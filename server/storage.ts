import { db } from "./db";
import {
  profiles, deliveries, transactions, driverDetails, sellerDetails, driverLocations,
  type Profile, type InsertProfile,
  type Delivery, type InsertDelivery,
  type Transaction, type InsertTransaction,
  type DriverDetails, type InsertDriverDetails,
  type SellerDetails, type InsertSellerDetails,
  type DriverLocation,
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getProfile(id: string): Promise<Profile | undefined>;
  getProfileByPhone(phone: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;

  getDelivery(id: string): Promise<Delivery | undefined>;
  listDeliveries(filters?: { status?: string; sellerId?: string; driverId?: string }): Promise<Delivery[]>;
  createDelivery(delivery: InsertDelivery & { otpCode: string }): Promise<Delivery>;
  updateDeliveryStatus(id: string, status: string, updates?: Partial<Delivery>): Promise<Delivery>;
  assignDriver(deliveryId: string, driverId: string): Promise<Delivery>;
  updateDeliveryPhoto(deliveryId: string, photoUrl: string): Promise<Delivery>;

  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  listTransactions(userId: string): Promise<Transaction[]>;

  getDriverDetails(profileId: string): Promise<DriverDetails | undefined>;
  createDriverDetails(details: InsertDriverDetails): Promise<DriverDetails>;

  getSellerDetails(profileId: string): Promise<SellerDetails | undefined>;
  createSellerDetails(details: InsertSellerDetails): Promise<SellerDetails>;
}

export class DatabaseStorage implements IStorage {
  async getProfile(id: string): Promise<Profile | undefined> {
    const result = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
    return result[0];
  }

  async getProfileByPhone(phone: string): Promise<Profile | undefined> {
    const result = await db.select().from(profiles).where(eq(profiles.phoneNumber, phone)).limit(1);
    return result[0];
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const result = await db.insert(profiles).values(profile).returning();
    return result[0];
  }

  async getDelivery(id: string): Promise<Delivery | undefined> {
    const result = await db.select().from(deliveries).where(eq(deliveries.id, id)).limit(1);
    return result[0];
  }

  async listDeliveries(filters?: { status?: string; sellerId?: string; driverId?: string }): Promise<Delivery[]> {
    let query = db.select().from(deliveries);

    if (filters?.status) {
      query = query.where(eq(deliveries.status, filters.status)) as any;
    }
    if (filters?.sellerId) {
      query = query.where(eq(deliveries.sellerId, filters.sellerId)) as any;
    }
    if (filters?.driverId) {
      query = query.where(eq(deliveries.driverId, filters.driverId)) as any;
    }

    return query.orderBy(desc(deliveries.createdAt));
  }

  async createDelivery(deliveryData: InsertDelivery & { otpCode: string }): Promise<Delivery> {
    const result = await db.insert(deliveries).values(deliveryData).returning();
    return result[0];
  }

  async updateDeliveryStatus(id: string, status: string, updates?: Partial<Delivery>): Promise<Delivery> {
    const updateData: any = { status };
    if (updates) {
      Object.assign(updateData, updates);
    }
    const result = await db.update(deliveries)
      .set(updateData)
      .where(eq(deliveries.id, id))
      .returning();
    return result[0];
  }

  async assignDriver(deliveryId: string, driverId: string): Promise<Delivery> {
    const result = await db.update(deliveries)
      .set({ driverId, status: 'in_transit' })
      .where(eq(deliveries.id, deliveryId))
      .returning();
    return result[0];
  }

  async updateDeliveryPhoto(deliveryId: string, photoUrl: string): Promise<Delivery> {
    const result = await db.update(deliveries)
      .set({ proofImageUrl: photoUrl })
      .where(eq(deliveries.id, deliveryId))
      .returning();
    return result[0];
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const result = await db.insert(transactions).values(transaction).returning();
    return result[0];
  }

  async listTransactions(userId: string): Promise<Transaction[]> {
    return db.select().from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  async getDriverDetails(profileId: string): Promise<DriverDetails | undefined> {
    const result = await db.select().from(driverDetails).where(eq(driverDetails.profileId, profileId)).limit(1);
    return result[0];
  }

  async createDriverDetails(details: InsertDriverDetails): Promise<DriverDetails> {
    const result = await db.insert(driverDetails).values(details).returning();
    return result[0];
  }

  async getSellerDetails(profileId: string): Promise<SellerDetails | undefined> {
    const result = await db.select().from(sellerDetails).where(eq(sellerDetails.profileId, profileId)).limit(1);
    return result[0];
  }

  async createSellerDetails(details: InsertSellerDetails): Promise<SellerDetails> {
    const result = await db.insert(sellerDetails).values(details).returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();
