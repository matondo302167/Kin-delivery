// API client for KOLISA backend
import type { Order, Profile, Transaction } from "@shared/schema";

const API_BASE = "/api";

// ===== PROFILES =====

export async function getProfile(id: string): Promise<Profile> {
  const res = await fetch(`${API_BASE}/profiles/${id}`);
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
}

export async function getProfileByPhone(phone: string): Promise<Profile> {
  const res = await fetch(`${API_BASE}/profiles/phone/${encodeURIComponent(phone)}`);
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
}

export async function createProfile(data: {
  name: string;
  phone: string;
  email?: string;
  role: string;
}): Promise<Profile> {
  const res = await fetch(`${API_BASE}/profiles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create profile");
  return res.json();
}

// ===== ORDERS =====

export async function listOrders(filters?: {
  status?: string;
  sellerId?: string;
  courierId?: string;
}): Promise<Order[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.sellerId) params.set("sellerId", filters.sellerId);
  if (filters?.courierId) params.set("courierId", filters.courierId);
  
  const res = await fetch(`${API_BASE}/orders?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch orders");
  return res.json();
}

export async function getOrder(id: string): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders/${id}`);
  if (!res.ok) throw new Error("Failed to fetch order");
  return res.json();
}

export async function getOrderByToken(token: string): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders/track/${token}`);
  if (!res.ok) throw new Error("Failed to fetch order");
  return res.json();
}

export async function createOrder(data: {
  recipientName: string;
  recipientPhone: string;
  pickupAddress: string;
  deliveryAddress: string;
  pickupLat?: string;
  pickupLng?: string;
  deliveryLat?: string;
  deliveryLng?: string;
  price: string;
  articlePrice: string;
  paymentMethod: string;
  note?: string;
  sellerId?: string;
}): Promise<{ order: Order; smsStatus: string; message: string }> {
  const res = await fetch(`${API_BASE}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create order");
  }
  return res.json();
}

export async function acceptOrder(orderId: string, courierId: string): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ courierId }),
  });
  if (!res.ok) throw new Error("Failed to accept order");
  return res.json();
}

export async function confirmCashCollection(orderId: string): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/cash-collected`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to confirm cash collection");
  return res.json();
}

export async function updateOrderPhoto(orderId: string, photoUrl: string): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/photo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ photoUrl }),
  });
  if (!res.ok) throw new Error("Failed to update photo");
  return res.json();
}

export async function validateDelivery(orderId: string, pinCode: string, courierId?: string): Promise<{
  order: Order;
  message: string;
}> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pinCode, courierId }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to validate delivery");
  }
  return res.json();
}

// ===== TRANSACTIONS =====

export async function listTransactions(profileId: string): Promise<Transaction[]> {
  const res = await fetch(`${API_BASE}/transactions/${profileId}`);
  if (!res.ok) throw new Error("Failed to fetch transactions");
  return res.json();
}

// ===== FILE UPLOAD =====

export async function uploadFile(file: File): Promise<{ uploadURL: string; objectPath: string }> {
  // Step 1: Request presigned URL
  const res = await fetch("/api/uploads/request-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: file.name,
      size: file.size,
      contentType: file.type || "application/octet-stream",
    }),
  });
  
  if (!res.ok) throw new Error("Failed to get upload URL");
  
  const { uploadURL, objectPath } = await res.json();
  
  // Step 2: Upload file to presigned URL
  const uploadRes = await fetch(uploadURL, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type || "application/octet-stream" },
  });
  
  if (!uploadRes.ok) throw new Error("Failed to upload file");
  
  return { uploadURL, objectPath };
}
