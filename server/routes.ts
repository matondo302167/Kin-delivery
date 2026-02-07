import type { Express } from "express";
import { createServer, type Server } from "http";
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
      res.status(500).json({ error: "Failed to create profile" });
    }
  });
  
  app.get("/api/deliveries", async (req, res) => {
    try {
      const { status, sellerId, driverId } = req.query;
      const deliveries = await storage.listDeliveries({
        status: status as string,
        sellerId: sellerId as string,
        driverId: driverId as string,
      });
      res.json(deliveries);
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
        return res.status(400).json({ error: "Delivery photo proof required" });
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
      const transactions = await storage.listTransactions(req.params.userId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });
  
  registerObjectStorageRoutes(app);

  return httpServer;
}
