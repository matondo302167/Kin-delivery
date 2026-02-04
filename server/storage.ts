import { db } from "./db";
import { profiles, orders, transactions, type Profile, type InsertProfile, type Order, type InsertOrder, type Transaction, type InsertTransaction } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Profiles
  getProfile(id: string): Promise<Profile | undefined>;
  getProfileByPhone(phone: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfileBalance(id: string, amount: number): Promise<Profile>;
  
  // Orders
  getOrder(id: string): Promise<Order | undefined>;
  getOrderByTrackingToken(token: string): Promise<Order | undefined>;
  listOrders(filters?: { status?: string; sellerId?: string; courierId?: string }): Promise<Order[]>;
  createOrder(order: InsertOrder & { pinCode: string; trackingToken: string }): Promise<Order>;
  updateOrderStatus(id: string, status: string, updates?: Partial<Order>): Promise<Order>;
  assignCourier(orderId: string, courierId: string): Promise<Order>;
  updateOrderPhoto(orderId: string, photoUrl: string): Promise<Order>;
  confirmCashCollection(orderId: string): Promise<Order>;
  
  // Transactions
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  listTransactions(profileId: string): Promise<Transaction[]>;
}

export class DatabaseStorage implements IStorage {
  // Profiles
  async getProfile(id: string): Promise<Profile | undefined> {
    const result = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
    return result[0];
  }

  async getProfileByPhone(phone: string): Promise<Profile | undefined> {
    const result = await db.select().from(profiles).where(eq(profiles.phone, phone)).limit(1);
    return result[0];
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const result = await db.insert(profiles).values(profile).returning();
    return result[0];
  }

  async updateProfileBalance(id: string, amount: number): Promise<Profile> {
    const profile = await this.getProfile(id);
    if (!profile) throw new Error("Profile not found");
    
    const newBalance = (parseFloat(profile.balance) + amount).toString();
    const result = await db.update(profiles)
      .set({ balance: newBalance })
      .where(eq(profiles.id, id))
      .returning();
    return result[0];
  }

  // Orders
  async getOrder(id: string): Promise<Order | undefined> {
    const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    return result[0];
  }

  async getOrderByTrackingToken(token: string): Promise<Order | undefined> {
    const result = await db.select().from(orders).where(eq(orders.trackingToken, token)).limit(1);
    return result[0];
  }

  async listOrders(filters?: { status?: string; sellerId?: string; courierId?: string }): Promise<Order[]> {
    let query = db.select().from(orders);
    
    if (filters?.status) {
      query = query.where(eq(orders.status, filters.status)) as any;
    }
    if (filters?.sellerId) {
      query = query.where(eq(orders.sellerId, filters.sellerId)) as any;
    }
    if (filters?.courierId) {
      query = query.where(eq(orders.courierId, filters.courierId)) as any;
    }
    
    return query.orderBy(desc(orders.createdAt));
  }

  async createOrder(orderData: InsertOrder & { pinCode: string; trackingToken: string }): Promise<Order> {
    const result = await db.insert(orders).values(orderData).returning();
    return result[0];
  }

  async updateOrderStatus(id: string, status: string, updates?: Partial<Order>): Promise<Order> {
    const updateData: any = { status, updatedAt: new Date() };
    
    if (status === 'delivered') {
      updateData.deliveredAt = new Date();
    }
    
    if (updates) {
      Object.assign(updateData, updates);
    }
    
    const result = await db.update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning();
    return result[0];
  }

  async assignCourier(orderId: string, courierId: string): Promise<Order> {
    const result = await db.update(orders)
      .set({ courierId, status: 'delivering', updatedAt: new Date() })
      .where(eq(orders.id, orderId))
      .returning();
    return result[0];
  }

  async updateOrderPhoto(orderId: string, photoUrl: string): Promise<Order> {
    const result = await db.update(orders)
      .set({ photoProofUrl: photoUrl, updatedAt: new Date() })
      .where(eq(orders.id, orderId))
      .returning();
    return result[0];
  }

  async confirmCashCollection(orderId: string): Promise<Order> {
    const result = await db.update(orders)
      .set({ cashCollected: true, updatedAt: new Date() })
      .where(eq(orders.id, orderId))
      .returning();
    return result[0];
  }

  // Transactions
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const result = await db.insert(transactions).values(transaction).returning();
    return result[0];
  }

  async listTransactions(profileId: string): Promise<Transaction[]> {
    return db.select().from(transactions)
      .where(eq(transactions.profileId, profileId))
      .orderBy(desc(transactions.createdAt));
  }
}

export const storage = new DatabaseStorage();
