import crypto from "crypto";
import { db } from "./db";
import { pool } from "./db";
import {
  profiles, deliveries, transactions, driverDetails, driverLocations,
  type Profile, type InsertProfile,
  type Delivery, type InsertDelivery,
  type Transaction, type InsertTransaction,
  type DriverDetails, type DriverLocation,
} from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  getProfile(id: string): Promise<Profile | undefined>;
  getProfileByPhone(phone: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  createSellerWithDetails(profile: InsertProfile, shopName: string, shopAddress?: string, category?: string): Promise<Profile>;

  getDelivery(id: string): Promise<Delivery | undefined>;
  listDeliveries(filters?: { status?: string; sellerId?: string; driverId?: string }): Promise<Delivery[]>;
  createDelivery(delivery: InsertDelivery & { otpCode: string }): Promise<Delivery>;
  updateDeliveryStatus(id: string, status: string): Promise<Delivery>;
  assignDriver(deliveryId: string, driverId: string): Promise<Delivery>;
  updateDeliveryPhoto(deliveryId: string, photoUrl: string): Promise<Delivery>;

  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  listTransactions(userId: string): Promise<Transaction[]>;

  getDriverDetails(driverId: string): Promise<DriverDetails | undefined>;
  updateDriverAvailability(driverId: string, isActive: boolean): Promise<DriverDetails>;
  updateDriverLocation(driverId: string, lat: number, lng: number): Promise<DriverLocation>;
  getDriverLocation(driverId: string): Promise<DriverLocation | undefined>;
  getDeliveryWithDriver(deliveryId: string): Promise<(Delivery & { driverName?: string; driverPhone?: string; vehicleType?: string; vehicleColor?: string; driverAvatarUrl?: string; driverLat?: number; driverLng?: number }) | undefined>;
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

  async createSellerWithDetails(profileData: InsertProfile, shopName: string, shopAddress?: string, category?: string): Promise<Profile> {
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
        [userId, profileData.phoneNumber, profileData.fullName || null, profileData.role || 'temp_seller', profileData.avatarUrl || null]
      );

      await client.query(
        `INSERT INTO public.seller_details (profile_id, shop_name, business_address, category)
         VALUES ($1, $2, $3, $4)`,
        [userId, shopName, shopAddress || null, category || null]
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

  async getDriverDetails(driverId: string): Promise<DriverDetails | undefined> {
    const result = await db.select().from(driverDetails).where(eq(driverDetails.profileId, driverId)).limit(1);
    return result[0];
  }

  async updateDriverAvailability(driverId: string, isActive: boolean): Promise<DriverDetails> {
    const existing = await this.getDriverDetails(driverId);
    if (!existing) {
      const result = await db.insert(driverDetails).values({
        profileId: driverId,
        vehicleType: 'moto',
        isActive,
      }).returning();
      return result[0];
    }
    const result = await db.update(driverDetails)
      .set({ isActive })
      .where(eq(driverDetails.profileId, driverId))
      .returning();
    return result[0];
  }

  async updateDriverLocation(driverId: string, lat: number, lng: number): Promise<DriverLocation> {
    const existing = await this.getDriverLocation(driverId);
    if (!existing) {
      const result = await db.insert(driverLocations).values({
        driverId,
        latitude: lat,
        longitude: lng,
      }).returning();
      return result[0];
    }
    const result = await db.update(driverLocations)
      .set({ latitude: lat, longitude: lng, updatedAt: new Date() })
      .where(eq(driverLocations.driverId, driverId))
      .returning();
    return result[0];
  }

  async getDriverLocation(driverId: string): Promise<DriverLocation | undefined> {
    const result = await db.select().from(driverLocations).where(eq(driverLocations.driverId, driverId)).limit(1);
    return result[0];
  }

  async getDeliveryWithDriver(deliveryId: string): Promise<(Delivery & { driverName?: string; driverPhone?: string; vehicleType?: string; vehicleColor?: string; driverAvatarUrl?: string; driverLat?: number; driverLng?: number }) | undefined> {
    const delivery = await this.getDelivery(deliveryId);
    if (!delivery) return undefined;
    
    if (!delivery.driverId) return { ...delivery };
    
    const driverProfile = await this.getProfile(delivery.driverId);
    const driverDet = await this.getDriverDetails(delivery.driverId);
    const driverLoc = await this.getDriverLocation(delivery.driverId);
    
    return {
      ...delivery,
      driverName: driverProfile?.fullName || undefined,
      driverPhone: driverProfile?.phoneNumber || undefined,
      vehicleType: driverDet?.vehicleType || undefined,
      vehicleColor: driverDet?.vehicleColor || undefined,
      driverAvatarUrl: driverProfile?.avatarUrl || undefined,
      driverLat: driverLoc?.latitude || undefined,
      driverLng: driverLoc?.longitude || undefined,
    };
  }
}

export const storage = new DatabaseStorage();
