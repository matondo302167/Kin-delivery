import type { Express } from "express";
import { createServer, type Server } from "http";
import crypto from "crypto";
import { storage } from "./storage";
import { pool } from "./db";
import { insertDeliverySchema, insertProfileSchema } from "@shared/schema";
import { z } from "zod";
import { sendPinCodeSms, sendDeliveryConfirmationSms, sendPhoneVerificationSms } from "./services/twilioService";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";

function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get("/api/profiles/:id", async (req, res) => {
    try {
      const profile = await storage.getProfile(req.params.id);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });
  
  app.get("/api/profiles/phone/:phone", async (req, res) => {
    try {
      const profile = await storage.getProfileByPhone(req.params.phone);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });
  
  app.post("/api/profiles", async (req, res) => {
    try {
      const profileData = insertProfileSchema.parse(req.body);
      const profile = await storage.createProfile(profileData);
      res.status(201).json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Profile creation error:", error);
      res.status(500).json({ error: "Failed to create profile" });
    }
  });

  app.post("/api/register-seller", async (req, res) => {
    try {
      const { phoneNumber, fullName, shopName, shopAddress, category, sellerType } = req.body;
      if (!phoneNumber || !fullName) {
        return res.status(400).json({ error: "Nom et numéro de téléphone requis" });
      }

      const existing = await storage.getProfileByPhone(phoneNumber);
      if (existing) {
        return res.status(409).json({ error: "Ce numéro est déjà enregistré. Connectez-vous.", profile: existing });
      }

      const role = sellerType === 'pro_seller' ? 'pro_seller' : 'temp_seller';
      const profile = await storage.createSellerWithDetails(
        { phoneNumber, fullName, role },
        shopName || fullName,
        shopAddress,
        category
      );
      res.status(201).json(profile);
    } catch (error) {
      console.error("Seller registration error:", error);
      res.status(500).json({ error: "Erreur lors de la création du compte" });
    }
  });
  
  app.get("/api/deliveries", async (req, res) => {
    try {
      const { status, sellerId, driverId } = req.query;
      const list = await storage.listDeliveries({
        status: status as string,
        sellerId: sellerId as string,
        driverId: driverId as string,
      });
      res.json(list);
    } catch (error) {
      console.error("Deliveries fetch error:", error);
      res.status(500).json({ error: "Failed to fetch deliveries" });
    }
  });
  
  app.get("/api/deliveries/:id", async (req, res) => {
    try {
      const delivery = await storage.getDelivery(req.params.id);
      if (!delivery) {
        return res.status(404).json({ error: "Delivery not found" });
      }
      res.json(delivery);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch delivery" });
    }
  });
  
  app.post("/api/deliveries", async (req, res) => {
    try {
      const deliveryData = insertDeliverySchema.parse(req.body);
      
      const sellerProfile = await storage.getProfile(deliveryData.sellerId);
      if (!sellerProfile) {
        return res.status(400).json({ error: "Votre session a expiré. Veuillez vous reconnecter." });
      }
      
      const otpCode = generateOtpCode();
      
      const delivery = await storage.createDelivery({
        ...deliveryData,
        otpCode,
      });
      
      const smsResult = await sendPinCodeSms(
        deliveryData.customerPhone,
        otpCode,
        delivery.id
      );
      
      if (!smsResult.success) {
        console.error("Failed to send SMS:", smsResult.error);
      }
      
      res.status(201).json({
        delivery,
        smsStatus: smsResult.success ? "sent" : "failed",
        message: smsResult.success 
          ? `SMS envoyé au ${deliveryData.customerPhone} avec le code OTP`
          : `Commande créée mais SMS non envoyé: ${smsResult.error}`
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Delivery creation error:", error);
      res.status(500).json({ error: "Failed to create delivery" });
    }
  });
  
  app.post("/api/deliveries/:id/accept", async (req, res) => {
    try {
      const { driverId } = req.body;
      if (!driverId) {
        return res.status(400).json({ error: "Driver ID required" });
      }
      const delivery = await storage.assignDriver(req.params.id, driverId);
      res.json(delivery);
    } catch (error) {
      res.status(500).json({ error: "Failed to accept delivery" });
    }
  });
  
  app.post("/api/deliveries/:id/photo", async (req, res) => {
    try {
      const { photoUrl } = req.body;
      if (!photoUrl) {
        return res.status(400).json({ error: "Photo URL required" });
      }
      const delivery = await storage.updateDeliveryPhoto(req.params.id, photoUrl);
      res.json(delivery);
    } catch (error) {
      res.status(500).json({ error: "Failed to update photo" });
    }
  });
  
  app.post("/api/deliveries/:id/validate", async (req, res) => {
    try {
      const { otpCode, driverId } = req.body;
      
      if (!otpCode) {
        return res.status(400).json({ error: "OTP code required" });
      }
      
      const delivery = await storage.getDelivery(req.params.id);
      if (!delivery) {
        return res.status(404).json({ error: "Delivery not found" });
      }
      
      if (delivery.otpCode !== otpCode) {
        return res.status(400).json({ error: "Invalid OTP code" });
      }
      
      if (!delivery.proofImageUrl) {
        return res.status(400).json({ error: "Photo proof required" });
      }
      
      const updatedDelivery = await storage.updateDeliveryStatus(req.params.id, 'delivered');
      
      const deliveryFee = parseFloat(delivery.deliveryFee || "0");
      const articlePrice = parseFloat(delivery.articlePrice || "0");

      if (delivery.sellerId) {
        const totalAmount = deliveryFee + articlePrice;
        await storage.createTransaction({
          userId: delivery.sellerId,
          deliveryId: delivery.id,
          amount: totalAmount.toString(),
          type: 'delivery_earning',
          description: `Livraison ${delivery.id.substring(0, 8)} - Paiement`,
        });
      }

      const actualDriverId = driverId || delivery.driverId;
      if (actualDriverId && deliveryFee > 0) {
        await storage.createTransaction({
          userId: actualDriverId,
          deliveryId: delivery.id,
          amount: deliveryFee.toString(),
          type: 'driver_earning',
          description: `Commission livraison ${delivery.id.substring(0, 8)}`,
        });
      }
      
      try {
        await sendDeliveryConfirmationSms(delivery.customerPhone, delivery.id);
      } catch (smsError) {
        console.error("SMS confirmation error (non-blocking):", smsError);
      }
      
      res.json({ 
        delivery: updatedDelivery,
        message: "Livraison validée avec succès"
      });
    } catch (error) {
      console.error("Validation error:", error);
      res.status(500).json({ error: "Failed to validate delivery" });
    }
  });
  
  app.get("/api/transactions/:userId", async (req, res) => {
    try {
      const txList = await storage.listTransactions(req.params.userId);
      res.json(txList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.get("/api/driver/:id/details", async (req, res) => {
    try {
      const details = await storage.getDriverDetails(req.params.id);
      res.json(details || { profileId: req.params.id, vehicleType: 'moto', isActive: false });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch driver details" });
    }
  });

  app.post("/api/driver/:id/availability", async (req, res) => {
    try {
      const { isActive } = req.body;
      const details = await storage.updateDriverAvailability(req.params.id, isActive);
      res.json(details);
    } catch (error) {
      console.error("Availability update error:", error);
      res.status(500).json({ error: "Failed to update availability" });
    }
  });

  app.post("/api/driver/:id/location", async (req, res) => {
    try {
      const { latitude, longitude } = req.body;
      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return res.status(400).json({ error: "Invalid coordinates" });
      }
      const location = await storage.updateDriverLocation(req.params.id, latitude, longitude);
      res.json(location);
    } catch (error) {
      console.error("Location update error:", error);
      res.status(500).json({ error: "Failed to update location" });
    }
  });

  app.get("/api/driver/:id/stats", async (req, res) => {
    try {
      const driverId = req.params.id;
      const [allMissions, approvedCashouts] = await Promise.all([
        storage.listDeliveries({ driverId }),
        storage.listCashoutRequests({ userId: driverId, status: 'approved' }),
      ]);
      const delivered = allMissions.filter(d => d.status === 'delivered');
      const inTransit = allMissions.filter(d => d.status === 'in_transit');
      const earnings = delivered.reduce((sum, d) => sum + parseFloat(d.deliveryFee || "0"), 0);
      const totalCollected = delivered.reduce((sum, d) => sum + parseFloat(d.articlePrice || "0"), 0)
        + inTransit.reduce((sum, d) => sum + parseFloat(d.articlePrice || "0"), 0);
      const totalCashedOut = approvedCashouts.reduce((sum, c) => sum + parseFloat(c.amount || "0"), 0);
      const cashToReturn = totalCollected - totalCashedOut;
      
      res.json({
        totalMissions: allMissions.length,
        deliveredCount: delivered.length,
        inTransitCount: inTransit.length,
        earnings,
        cashToReturn: Math.max(0, cashToReturn),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch driver stats" });
    }
  });

  app.get("/api/seller/:id/details", async (req, res) => {
    try {
      const sellerId = req.params.id;
      const result = await pool.query(
        `SELECT profile_id, shop_name, business_address, category, total_sales_count FROM public.seller_details WHERE profile_id = $1`,
        [sellerId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Seller details not found" });
      }
      const row = result.rows[0];
      res.json({
        profileId: row.profile_id,
        shopName: row.shop_name,
        businessAddress: row.business_address,
        category: row.category,
        totalSalesCount: row.total_sales_count,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch seller details" });
    }
  });

  app.get("/api/seller/:id/top-communes", async (req, res) => {
    try {
      const sellerId = req.params.id;
      const allDeliveries = await storage.listDeliveries({ sellerId });
      const communeMap: Record<string, number> = {};
      for (const d of allDeliveries) {
        const addr = d.deliveryAddress || '';
        const parts = addr.split(',').map(s => s.trim());
        const commune = parts.length > 1 ? parts[parts.length - 1] : parts[0] || 'Autre';
        communeMap[commune] = (communeMap[commune] || 0) + 1;
      }
      const topCommunes = Object.entries(communeMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));
      res.json(topCommunes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch top communes" });
    }
  });

  app.get("/api/seller/:id/stats", async (req, res) => {
    try {
      const sellerId = req.params.id;
      const allDeliveries = await storage.listDeliveries({ sellerId });
      const delivered = allDeliveries.filter(d => d.status === 'delivered');
      const pending = allDeliveries.filter(d => d.status === 'pending');
      const inTransit = allDeliveries.filter(d => d.status === 'in_transit');

      const totalArticleRevenue = delivered.reduce((sum, d) => sum + parseFloat(d.articlePrice || "0"), 0);
      const totalDeliveryFees = allDeliveries.reduce((sum, d) => sum + parseFloat(d.deliveryFee || "0"), 0);
      const pendingCOD = inTransit.reduce((sum, d) => sum + parseFloat(d.articlePrice || "0"), 0);

      res.json({
        totalOrders: allDeliveries.length,
        deliveredCount: delivered.length,
        pendingCount: pending.length,
        inTransitCount: inTransit.length,
        totalArticleRevenue,
        totalDeliveryFees,
        pendingCOD,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch seller stats" });
    }
  });

  app.get("/api/deliveries/:id/tracking", async (req, res) => {
    try {
      const data = await storage.getDeliveryWithDriver(req.params.id);
      if (!data) {
        return res.status(404).json({ error: "Delivery not found" });
      }
      res.json(data);
    } catch (error: any) {
      if (error?.code === '22P02') {
        return res.status(404).json({ error: "Invalid delivery ID format" });
      }
      res.status(500).json({ error: "Failed to fetch tracking data" });
    }
  });
  
  app.post("/api/cashout", async (req, res) => {
    try {
      const { userId, amount } = req.body;
      if (!userId || !amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: "Montant invalide" });
      }
      const request = await storage.createCashoutRequest({ userId, amount: amount.toString() });
      res.status(201).json(request);
    } catch (error) {
      console.error("Cashout request error:", error);
      res.status(500).json({ error: "Erreur lors de la demande de retrait" });
    }
  });

  app.get("/api/cashout", async (req, res) => {
    try {
      const { userId, status } = req.query;
      const list = await storage.listCashoutRequests({
        userId: userId as string,
        status: status as string,
      });
      res.json(list);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cashout requests" });
    }
  });

  app.post("/api/cashout/:id/resolve", async (req, res) => {
    try {
      const { status, adminNote } = req.body;
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: "Statut invalide" });
      }
      const updated = await storage.updateCashoutStatus(req.params.id, status, adminNote);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to resolve cashout request" });
    }
  });

  app.post("/api/otp/send", async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      if (!phoneNumber) {
        return res.status(400).json({ error: "Numéro de téléphone requis" });
      }
      const otpCode = generateOtpCode();
      await storage.createOtpVerification(phoneNumber, otpCode);
      const smsResult = await sendPhoneVerificationSms(phoneNumber, otpCode);
      res.json({ success: true, smsStatus: smsResult.success ? 'sent' : 'failed' });
    } catch (error) {
      console.error("OTP send error:", error);
      res.status(500).json({ error: "Erreur lors de l'envoi du code" });
    }
  });

  app.post("/api/otp/verify", async (req, res) => {
    try {
      const { phoneNumber, otpCode } = req.body;
      if (!phoneNumber || !otpCode) {
        return res.status(400).json({ error: "Numéro et code requis" });
      }
      const isValid = await storage.verifyOtp(phoneNumber, otpCode);
      if (!isValid) {
        return res.status(400).json({ error: "Code invalide ou expiré" });
      }
      await storage.markPhoneVerified(phoneNumber);
      res.json({ verified: true });
    } catch (error) {
      console.error("OTP verify error:", error);
      res.status(500).json({ error: "Erreur de vérification" });
    }
  });

  app.get("/api/admin/drivers-locations", async (req, res) => {
    try {
      const locations = await storage.listAllDriverLocations();
      res.json(locations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch driver locations" });
    }
  });

  app.get("/api/admin/alerts", async (req, res) => {
    try {
      const allDeliveries = await storage.listDeliveries({});
      const now = new Date();
      const alerts: any[] = [];

      const inTransit = allDeliveries.filter(d => d.status === 'in_transit');
      for (const d of inTransit) {
        if (d.createdAt) {
          const hoursAgo = (now.getTime() - new Date(d.createdAt).getTime()) / (1000 * 60 * 60);
          if (hoursAgo > 2) {
            alerts.push({
              type: 'late_delivery',
              severity: hoursAgo > 6 ? 'critical' : 'warning',
              message: `Colis en retard: ${d.customerName} (${Math.floor(hoursAgo)}h)`,
              deliveryId: d.id,
              driverId: d.driverId,
            });
          }
        }
      }

      const drivers = (await storage.listAllProfiles()).filter(p => p.role === 'driver');
      for (const driver of drivers) {
        const driverDeliveries = allDeliveries.filter(d => d.driverId === driver.id && d.status === 'delivered');
        const approvedCashouts = await storage.listCashoutRequests({ userId: driver.id, status: 'approved' });
        const totalCollected = driverDeliveries.reduce((sum, d) => sum + parseFloat(d.articlePrice || "0"), 0);
        const totalCashedOut = approvedCashouts.reduce((sum, c) => sum + parseFloat(c.amount || "0"), 0);
        const debt = totalCollected - totalCashedOut;
        if (debt > 100000) {
          alerts.push({
            type: 'high_debt',
            severity: debt > 500000 ? 'critical' : 'warning',
            message: `${driver.fullName || 'Livreur'} a ${debt.toLocaleString()} FC de dette`,
            driverId: driver.id,
            amount: debt,
          });
        }
      }

      res.json(alerts);
    } catch (error) {
      console.error("Admin alerts error:", error);
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  app.get("/api/admin/stats", async (req, res) => {
    try {
      const allDeliveries = await storage.listDeliveries({});
      const allProfiles = await storage.listAllProfiles();
      const pendingCashouts = await storage.listCashoutRequests({ status: 'pending' });

      const delivered = allDeliveries.filter(d => d.status === 'delivered');
      const inTransit = allDeliveries.filter(d => d.status === 'in_transit');
      const pending = allDeliveries.filter(d => d.status === 'pending');
      const drivers = allProfiles.filter(p => p.role === 'driver');
      const sellers = allProfiles.filter(p => p.role === 'pro_seller' || p.role === 'temp_seller');

      res.json({
        totalDeliveries: allDeliveries.length,
        deliveredCount: delivered.length,
        inTransitCount: inTransit.length,
        pendingCount: pending.length,
        totalDrivers: drivers.length,
        totalSellers: sellers.length,
        pendingCashouts: pendingCashouts.length,
        totalRevenue: delivered.reduce((sum, d) => sum + parseFloat(d.deliveryFee || "0"), 0),
      });
    } catch (error) {
      console.error("Admin stats error:", error);
      res.status(500).json({ error: "Failed to fetch admin stats" });
    }
  });

  registerObjectStorageRoutes(app);

  return httpServer;
}
