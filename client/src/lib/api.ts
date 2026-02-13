import type { Delivery, Profile, Transaction, CashoutRequest } from "@shared/schema";

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
  shopAddress?: string;
  category?: string;
  sellerType?: string;
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

export async function getDriverDetails(driverId: string): Promise<{ profileId: string; vehicleType: string; isActive: boolean; vehicleColor?: string; vehiclePlate?: string }> {
  const res = await fetch(`${API_BASE}/driver/${driverId}/details`);
  if (!res.ok) throw new Error("Failed to fetch driver details");
  return res.json();
}

export async function updateDriverAvailability(driverId: string, isActive: boolean): Promise<any> {
  const res = await fetch(`${API_BASE}/driver/${driverId}/availability`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isActive }),
  });
  if (!res.ok) throw new Error("Failed to update availability");
  return res.json();
}

export async function updateDriverLocation(driverId: string, latitude: number, longitude: number): Promise<any> {
  const res = await fetch(`${API_BASE}/driver/${driverId}/location`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ latitude, longitude }),
  });
  if (!res.ok) throw new Error("Failed to update location");
  return res.json();
}

export async function getDriverStats(driverId: string): Promise<{ totalMissions: number; deliveredCount: number; inTransitCount: number; earnings: number; cashToReturn: number }> {
  const res = await fetch(`${API_BASE}/driver/${driverId}/stats`);
  if (!res.ok) throw new Error("Failed to fetch driver stats");
  return res.json();
}

export async function getSellerDetails(sellerId: string): Promise<{ profileId: string; shopName: string; businessAddress?: string; category?: string; totalSalesCount?: number }> {
  const res = await fetch(`${API_BASE}/seller/${sellerId}/details`);
  if (!res.ok) throw new Error("Failed to fetch seller details");
  return res.json();
}

export async function getSellerStats(sellerId: string): Promise<{ totalOrders: number; deliveredCount: number; pendingCount: number; inTransitCount: number; totalArticleRevenue: number; totalDeliveryFees: number; pendingCOD: number }> {
  const res = await fetch(`${API_BASE}/seller/${sellerId}/stats`);
  if (!res.ok) throw new Error("Failed to fetch seller stats");
  return res.json();
}

export async function getDeliveryTracking(deliveryId: string): Promise<Delivery & { driverName?: string; driverPhone?: string; vehicleType?: string; vehicleColor?: string; driverAvatarUrl?: string; driverLat?: number; driverLng?: number }> {
  const res = await fetch(`${API_BASE}/deliveries/${deliveryId}/tracking`);
  if (!res.ok) throw new Error("Failed to fetch tracking data");
  return res.json();
}

export async function createCashoutRequest(userId: string, amount: number): Promise<CashoutRequest> {
  const res = await fetch(`${API_BASE}/cashout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, amount }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Erreur lors de la demande de retrait");
  }
  return res.json();
}

export async function listCashoutRequests(filters?: { userId?: string; status?: string }): Promise<CashoutRequest[]> {
  const params = new URLSearchParams();
  if (filters?.userId) params.set("userId", filters.userId);
  if (filters?.status) params.set("status", filters.status);
  const res = await fetch(`${API_BASE}/cashout?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch cashout requests");
  return res.json();
}

export async function resolveCashoutRequest(id: string, status: string, adminNote?: string): Promise<CashoutRequest> {
  const res = await fetch(`${API_BASE}/cashout/${id}/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, adminNote }),
  });
  if (!res.ok) throw new Error("Failed to resolve cashout request");
  return res.json();
}

export async function sendOtp(phoneNumber: string): Promise<{ success: boolean; smsStatus: string }> {
  const res = await fetch(`${API_BASE}/otp/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phoneNumber }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Erreur lors de l'envoi du code");
  }
  return res.json();
}

export async function verifyOtp(phoneNumber: string, otpCode: string): Promise<{ verified: boolean }> {
  const res = await fetch(`${API_BASE}/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phoneNumber, otpCode }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Code invalide");
  }
  return res.json();
}

export async function getAdminDriverLocations(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/admin/drivers-locations`);
  if (!res.ok) throw new Error("Failed to fetch driver locations");
  return res.json();
}

export async function getAdminAlerts(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/admin/alerts`);
  if (!res.ok) throw new Error("Failed to fetch alerts");
  return res.json();
}

export async function getAdminStats(): Promise<any> {
  const res = await fetch(`${API_BASE}/admin/stats`);
  if (!res.ok) throw new Error("Failed to fetch admin stats");
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
