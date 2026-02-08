import type { Express } from "express";
import { createServer, type Server } from "http";
import crypto from "crypto";
import { storage } from "./storage";
import { insertDeliverySchema, insertProfileSchema } from "@shared/schema";
import { z } from "zod";
import { sendPinCodeSms, sendDeliveryConfirmationSms } from "./services/twilioService";
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
      const { phoneNumber, fullName, shopName } = req.body;
      if (!phoneNumber || !fullName) {
        return res.status(400).json({ error: "Nom et numéro de téléphone requis" });
      }

      const existing = await storage.getProfileByPhone(phoneNumber);
      if (existing) {
        return res.status(409).json({ error: "Ce numéro est déjà enregistré. Connectez-vous.", profile: existing });
      }

      const profile = await storage.createSellerWithDetails(
        { phoneNumber, fullName, role: 'temp_seller' },
        shopName || fullName
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
      
      if (delivery.sellerId) {
        const totalAmount = parseFloat(delivery.deliveryFee || "0") + parseFloat(delivery.articlePrice || "0");
        await storage.createTransaction({
          userId: delivery.sellerId,
          deliveryId: delivery.id,
          amount: totalAmount.toString(),
          type: 'delivery_earning',
          description: `Livraison ${delivery.id.substring(0, 8)} - Paiement`,
        });
      }
      
      await sendDeliveryConfirmationSms(delivery.customerPhone, delivery.id);
      
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
      const [allMissions, txList] = await Promise.all([
        storage.listDeliveries({ driverId }),
        storage.listTransactions(driverId),
      ]);
      const delivered = allMissions.filter(d => d.status === 'delivered');
      const inTransit = allMissions.filter(d => d.status === 'in_transit');
      const earnings = txList.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
      const cashToReturn = inTransit.reduce((sum, d) => sum + parseFloat(d.articlePrice || "0"), 0) + 
        delivered.filter(d => {
          const tx = txList.find(t => t.deliveryId === d.id);
          return !tx;
        }).reduce((sum, d) => sum + parseFloat(d.articlePrice || "0"), 0);
      
      res.json({
        totalMissions: allMissions.length,
        deliveredCount: delivered.length,
        inTransitCount: inTransit.length,
        earnings,
        cashToReturn,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch driver stats" });
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
  
  registerObjectStorageRoutes(app);

  return httpServer;
}
