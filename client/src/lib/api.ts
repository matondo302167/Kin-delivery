import type { Delivery, Profile, Transaction } from "@shared/schema";

const API_BASE = "/api";

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

export async function registerSeller(data: {
  phoneNumber: string;
  fullName: string;
  shopName?: string;
}): Promise<Profile> {
  const res = await fetch(`${API_BASE}/register-seller`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    if (res.status === 409 && error.profile) {
      return error.profile;
    }
    throw new Error(error.error || "Erreur lors de l'inscription");
  }
  return res.json();
}

export async function createProfile(data: {
  phoneNumber: string;
  fullName?: string;
  role: string;
}): Promise<Profile> {
  const res = await fetch(`${API_BASE}/profiles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(JSON.stringify(error.error) || "Failed to create profile");
  }
  return res.json();
}

export async function listDeliveries(filters?: {
  status?: string;
  sellerId?: string;
  driverId?: string;
}): Promise<Delivery[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.sellerId) params.set("sellerId", filters.sellerId);
  if (filters?.driverId) params.set("driverId", filters.driverId);
  
  const res = await fetch(`${API_BASE}/deliveries?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch deliveries");
  return res.json();
}

export async function getDelivery(id: string): Promise<Delivery> {
  const res = await fetch(`${API_BASE}/deliveries/${id}`);
  if (!res.ok) throw new Error("Failed to fetch delivery");
  return res.json();
}

export async function createDelivery(data: {
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  deliveryAddress: string;
  deliveryFee: string;
  articlePrice: string;
  sellerId: string;
}): Promise<{ delivery: Delivery; smsStatus: string; message: string }> {
  const res = await fetch(`${API_BASE}/deliveries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create delivery");
  }
  return res.json();
}

export async function acceptDelivery(deliveryId: string, driverId: string): Promise<Delivery> {
  const res = await fetch(`${API_BASE}/deliveries/${deliveryId}/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ driverId }),
  });
  if (!res.ok) throw new Error("Failed to accept delivery");
  return res.json();
}

export async function updateDeliveryPhoto(deliveryId: string, photoUrl: string): Promise<Delivery> {
  const res = await fetch(`${API_BASE}/deliveries/${deliveryId}/photo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ photoUrl }),
  });
  if (!res.ok) throw new Error("Failed to update photo");
  return res.json();
}

export async function validateDelivery(deliveryId: string, otpCode: string, driverId?: string): Promise<{
  delivery: Delivery;
  message: string;
}> {
  const res = await fetch(`${API_BASE}/deliveries/${deliveryId}/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ otpCode, driverId }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to validate delivery");
  }
  return res.json();
}

export async function listTransactions(userId: string): Promise<Transaction[]> {
  const res = await fetch(`${API_BASE}/transactions/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch transactions");
  return res.json();
}

export async function uploadFile(file: File): Promise<{ uploadURL: string; objectPath: string }> {
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
  const uploadRes = await fetch(uploadURL, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type || "application/octet-stream" },
  });
  if (!uploadRes.ok) throw new Error("Failed to upload file");
  return { uploadURL, objectPath };
}
