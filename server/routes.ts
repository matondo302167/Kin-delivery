import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertOrderSchema, insertProfileSchema } from "@shared/schema";
import { z } from "zod";
import { sendPinCodeSms, sendDeliveryConfirmationSms } from "./services/twilioService";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";

// Generate 4-digit PIN code
function generatePinCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Generate tracking token
function generateTrackingToken(): string {
  return `TRK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ===== PROFILES =====
  
  // Get profile by ID
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
  
  // Get profile by phone
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
  
  // Create profile
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
  
  // ===== ORDERS =====
  
  // List orders (with optional filters)
  app.get("/api/orders", async (req, res) => {
    try {
      const { status, sellerId, courierId } = req.query;
      const orders = await storage.listOrders({
        status: status as string,
        sellerId: sellerId as string,
        courierId: courierId as string,
      });
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });
  
  // Get order by ID
  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });
  
  // Get order by tracking token (for client tracking)
  app.get("/api/orders/track/:token", async (req, res) => {
    try {
      const order = await storage.getOrderByTrackingToken(req.params.token);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });
  
  // Create order
  app.post("/api/orders", async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      
      // Generate PIN and tracking token
      const pinCode = generatePinCode();
      const trackingToken = generateTrackingToken();
      
      // Create order
      const order = await storage.createOrder({
        ...orderData,
        pinCode,
        trackingToken,
      });
      
      // Send SMS with PIN code to recipient using Twilio
      const smsResult = await sendPinCodeSms(
        orderData.recipientPhone,
        pinCode,
        trackingToken
      );
      
      if (!smsResult.success) {
        console.error("Failed to send SMS:", smsResult.error);
      }
      
      res.status(201).json({
        order,
        smsStatus: smsResult.success ? "sent" : "failed",
        message: smsResult.success 
          ? `SMS envoyé au ${orderData.recipientPhone} avec le code PIN`
          : `Commande créée mais SMS non envoyé: ${smsResult.error}`
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Order creation error:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });
  
  // Courier accepts order
  app.post("/api/orders/:id/accept", async (req, res) => {
    try {
      const { courierId } = req.body;
      if (!courierId) {
        return res.status(400).json({ error: "Courier ID required" });
      }
      
      const order = await storage.assignCourier(req.params.id, courierId);
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to accept order" });
    }
  });
  
  // Confirm cash collection
  app.post("/api/orders/:id/cash-collected", async (req, res) => {
    try {
      const order = await storage.confirmCashCollection(req.params.id);
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to confirm cash collection" });
    }
  });
  
  // Upload delivery photo proof
  app.post("/api/orders/:id/photo", async (req, res) => {
    try {
      const { photoUrl } = req.body;
      if (!photoUrl) {
        return res.status(400).json({ error: "Photo URL required" });
      }
      
      const order = await storage.updateOrderPhoto(req.params.id, photoUrl);
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to update photo" });
    }
  });
  
  // Validate delivery with PIN
  app.post("/api/orders/:id/validate", async (req, res) => {
    try {
      const { pinCode, courierId } = req.body;
      
      if (!pinCode) {
        return res.status(400).json({ error: "PIN code required" });
      }
      
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      // Validate PIN
      if (order.pinCode !== pinCode) {
        return res.status(400).json({ error: "Invalid PIN code" });
      }
      
      // Check if cash was collected (for COD)
      if (order.paymentMethod === 'cod' && !order.cashCollected) {
        return res.status(400).json({ error: "Cash collection must be confirmed first" });
      }
      
      // Check if photo proof exists
      if (!order.photoProofUrl) {
        return res.status(400).json({ error: "Delivery photo proof required" });
      }
      
      // Mark as delivered
      const updatedOrder = await storage.updateOrderStatus(req.params.id, 'delivered');
      
      // Update seller balance for COD orders
      if (order.paymentMethod === 'cod' && order.sellerId) {
        const totalAmount = parseFloat(order.price) + parseFloat(order.articlePrice);
        await storage.updateProfileBalance(order.sellerId, totalAmount);
        
        // Record transaction
        await storage.createTransaction({
          profileId: order.sellerId,
          orderId: order.id,
          amount: totalAmount.toString(),
          type: 'credit',
          description: `Livraison ${order.trackingToken} - Cash on Delivery`,
        });
      }
      
      // Send delivery confirmation SMS
      await sendDeliveryConfirmationSms(order.recipientPhone, order.trackingToken);
      
      res.json({ 
        order: updatedOrder,
        message: "Livraison validée avec succès"
      });
    } catch (error) {
      console.error("Validation error:", error);
      res.status(500).json({ error: "Failed to validate delivery" });
    }
  });
  
  // ===== TRANSACTIONS =====
  
  // List transactions for a profile
  app.get("/api/transactions/:profileId", async (req, res) => {
    try {
      const transactions = await storage.listTransactions(req.params.profileId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });
  
  // Register object storage routes for photo uploads
  registerObjectStorageRoutes(app);

  return httpServer;
}
