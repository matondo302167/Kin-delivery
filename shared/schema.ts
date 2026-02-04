import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User profiles (sellers, couriers, clients)
export const profiles = pgTable("profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  email: text("email"),
  role: text("role").notNull(), // 'seller', 'courier', 'client'
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull().default("0"), // Seller balance in FC
  avatar: text("avatar"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Orders/Deliveries
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Seller & Courier
  sellerId: varchar("seller_id").references(() => profiles.id),
  courierId: varchar("courier_id").references(() => profiles.id),
  
  // Recipient details
  recipientName: text("recipient_name").notNull(),
  recipientPhone: text("recipient_phone").notNull(),
  
  // Addresses
  pickupAddress: text("pickup_address").notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  pickupLat: decimal("pickup_lat", { precision: 10, scale: 7 }),
  pickupLng: decimal("pickup_lng", { precision: 10, scale: 7 }),
  deliveryLat: decimal("delivery_lat", { precision: 10, scale: 7 }),
  deliveryLng: decimal("delivery_lng", { precision: 10, scale: 7 }),
  
  // Pricing
  price: decimal("price", { precision: 10, scale: 2 }).notNull(), // Delivery fee in FC
  articlePrice: decimal("article_price", { precision: 10, scale: 2 }).notNull().default("0"), // Product price for COD
  paymentMethod: text("payment_method").notNull(), // 'cod' or 'mobile_money'
  
  // Status & Security
  status: text("status").notNull().default("pending"), // 'pending', 'delivering', 'delivered'
  pinCode: text("pin_code").notNull(), // 4-digit PIN for validation
  photoProofUrl: text("photo_proof_url"), // Supabase Storage URL
  cashCollected: boolean("cash_collected").notNull().default(false), // COD confirmation
  
  // Tracking
  trackingToken: text("tracking_token").notNull().unique(),
  
  // Additional
  note: text("note"),
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deliveredAt: timestamp("delivered_at"),
});

// Transactions (for audit & balance tracking)
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: varchar("profile_id").notNull().references(() => profiles.id),
  orderId: varchar("order_id").references(() => orders.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: text("type").notNull(), // 'credit', 'debit', 'withdrawal'
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertProfileSchema = createInsertSchema(profiles).omit({
  id: true,
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deliveredAt: true,
  trackingToken: true,
  pinCode: true,
  cashCollected: true,
  photoProofUrl: true,
  status: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

// Types
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
