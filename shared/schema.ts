import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, doublePrecision, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  phoneNumber: text("phone_number").notNull(),
  fullName: text("full_name"),
  role: text("role").default("temp_seller"),
  avatarUrl: text("avatar_url"),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const deliveries = pgTable("deliveries", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
  sellerId: uuid("seller_id").notNull(),
  driverId: uuid("driver_id"),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  pickupAddress: text("pickup_address").notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  articlePrice: decimal("article_price", { precision: 10, scale: 2 }).default("0.00"),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).default("0.00"),
  status: text("status").default("pending"),
  otpCode: varchar("otp_code", { length: 6 }),
  proofImageUrl: text("proof_image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const driverDetails = pgTable("driver_details", {
  profileId: uuid("profile_id").primaryKey(),
  vehicleType: text("vehicle_type").notNull(),
  vehiclePlate: text("vehicle_plate"),
  vehicleColor: text("vehicle_color"),
  identityCardUrl: text("identity_card_url"),
  isActive: boolean("is_active").default(true),
});

export const driverLocations = pgTable("driver_locations", {
  driverId: uuid("driver_id").primaryKey(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const sellerDetails = pgTable("seller_details", {
  profileId: uuid("profile_id").primaryKey(),
  shopName: text("shop_name").notNull(),
  businessAddress: text("business_address"),
  category: text("category"),
  totalSalesCount: integer("total_sales_count").default(0),
});

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
  userId: uuid("user_id").notNull(),
  deliveryId: uuid("delivery_id"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("CDF"),
  type: text("type").notNull(),
  status: text("status").default("completed"),
  paymentReference: text("payment_reference"),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const cashoutRequests = pgTable("cashout_requests", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
  userId: uuid("user_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").default("pending"),
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

export const otpVerifications = pgTable("otp_verifications", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
  phoneNumber: text("phone_number").notNull(),
  otpCode: varchar("otp_code", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const insertProfileSchema = createInsertSchema(profiles).omit({
  createdAt: true,
  updatedAt: true,
  isVerified: true,
}).extend({
  id: z.string().uuid().optional(),
});

export const insertDeliverySchema = createInsertSchema(deliveries).omit({
  id: true,
  createdAt: true,
  status: true,
  otpCode: true,
  proofImageUrl: true,
  driverId: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  status: true,
});

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;

export type Delivery = typeof deliveries.$inferSelect;
export type InsertDelivery = z.infer<typeof insertDeliverySchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export const insertCashoutRequestSchema = createInsertSchema(cashoutRequests).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
  status: true,
  adminNote: true,
});

export type CashoutRequest = typeof cashoutRequests.$inferSelect;
export type InsertCashoutRequest = z.infer<typeof insertCashoutRequestSchema>;

export type DriverDetails = typeof driverDetails.$inferSelect;
export type DriverLocation = typeof driverLocations.$inferSelect;
export type SellerDetails = typeof sellerDetails.$inferSelect;
