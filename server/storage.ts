import crypto from "crypto";
import { db } from "./db";
import { pool } from "./db";
import {
  profiles, deliveries, transactions,
  type Profile, type InsertProfile,
  type Delivery, type InsertDelivery,
  type Transaction, type InsertTransaction,
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getProfile(id: string): Promise<Profile | undefined>;
  getProfileByPhone(phone: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  createSellerWithDetails(profile: InsertProfile, shopName: string): Promise<Profile>;

  getDelivery(id: string): Promise<Delivery | undefined>;
  listDeliveries(filters?: { status?: string; sellerId?: string; driverId?: string }): Promise<Delivery[]>;
  createDelivery(delivery: InsertDelivery & { otpCode: string }): Promise<Delivery>;
  updateDeliveryStatus(id: string, status: string): Promise<Delivery>;
  assignDriver(deliveryId: string, driverId: string): Promise<Delivery>;
  updateDeliveryPhoto(deliveryId: string, photoUrl: string): Promise<Delivery>;

  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  listTransactions(userId: string): Promise<Transaction[]>;
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

  async createProfile(profileData: InsertProfile): Promise<Profile> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const userId = profileData.id || crypto.randomUUID();
      
      await client.query(
        `INSERT INTO auth.users (id, instance_id, aud, role, email, phone, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
         VALUES ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', $2, $3, '', NOW(), NOW(), NOW(), '', '', '', '')
         ON CONFLICT (id) DO NOTHING`,
        [userId, `${profileData.phoneNumber}@kolisa.app`, profileData.phoneNumber]
      );
      
      await client.query(
        `INSERT INTO public.profiles (id, phone_number, full_name, role, avatar_url)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [userId, profileData.phoneNumber, profileData.fullName || null, profileData.role || 'temp_seller', profileData.avatarUrl || null]
      );
      
      await client.query('COMMIT');
      
      const result = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
      return result[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async createSellerWithDetails(profileData: InsertProfile, shopName: string): Promise<Profile> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const userId = profileData.id || crypto.randomUUID();
      
      await client.query(
        `INSERT INTO auth.users (id, instance_id, aud, role, email, phone, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
         VALUES ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', $2, $3, '', NOW(), NOW(), NOW(), '', '', '', '')
         ON CONFLICT (id) DO NOTHING`,
        [userId, `${profileData.phoneNumber}@kolisa.app`, profileData.phoneNumber]
      );
      
      await client.query(
        `INSERT INTO public.profiles (id, phone_number, full_name, role, avatar_url)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, profileData.phoneNumber, profileData.fullName || null, 'temp_seller', profileData.avatarUrl || null]
      );

      await client.query(
        `INSERT INTO public.seller_details (profile_id, shop_name)
         VALUES ($1, $2)`,
        [userId, shopName]
      );
      
      await client.query('COMMIT');
      
      const result = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
      return result[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
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

  async updateDeliveryStatus(id: string, status: string): Promise<Delivery> {
    const result = await db.update(deliveries)
      .set({ status })
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
}

export const storage = new DatabaseStorage();
