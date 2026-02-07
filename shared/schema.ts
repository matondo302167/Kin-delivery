import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, doublePrecision, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  phoneNumber: text("phone_number").notNull(),
  fullName: text("full_name"),
  role: text("role"),
  avatarUrl: text("avatar_url"),
  isVerified: boolean("is_verified"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const deliveries = pgTable("deliveries", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
  sellerId: uuid("seller_id").notNull().references(() => profiles.id),
  driverId: uuid("driver_id").references(() => profiles.id),
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
  profileId: uuid("profile_id").primaryKey().references(() => profiles.id),
  vehicleType: text("vehicle_type").notNull(),
  vehiclePlate: text("vehicle_plate"),
  vehicleColor: text("vehicle_color"),
  identityCardUrl: text("identity_card_url"),
  isActive: boolean("is_active").default(true),
});

export const driverLocations = pgTable("driver_locations", {
  driverId: uuid("driver_id").primaryKey().references(() => profiles.id),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const sellerDetails = pgTable("seller_details", {
  profileId: uuid("profile_id").primaryKey().references(() => profiles.id),
  shopName: text("shop_name").notNull(),
  businessAddress: text("business_address"),
  category: text("category"),
  totalSalesCount: integer("total_sales_count").default(0),
});

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
  userId: uuid("user_id").notNull().references(() => profiles.id),
  deliveryId: uuid("delivery_id").references(() => deliveries.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("CDF"),
  type: text("type").notNull(),
  status: text("status").default("completed"),
  paymentReference: text("payment_reference"),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const insertProfileSchema = createInsertSchema(profiles).omit({
  createdAt: true,
  updatedAt: true,
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

export const insertDriverDetailsSchema = createInsertSchema(driverDetails);
export const insertSellerDetailsSchema = createInsertSchema(sellerDetails);

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;

export type Delivery = typeof deliveries.$inferSelect;
export type InsertDelivery = z.infer<typeof insertDeliverySchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type DriverDetails = typeof driverDetails.$inferSelect;
export type InsertDriverDetails = z.infer<typeof insertDriverDetailsSchema>;

export type SellerDetails = typeof sellerDetails.$inferSelect;
export type InsertSellerDetails = z.infer<typeof insertSellerDetailsSchema>;

export type DriverLocation = typeof driverLocations.$inferSelect;
