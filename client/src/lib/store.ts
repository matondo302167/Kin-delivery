import { create } from 'zustand';

export type OrderStatus = 'pending' | 'delivering' | 'delivered';
export type UserRole = 'seller' | 'courier' | 'customer' | null;
export type PaymentMethod = 'cod' | 'mobile_money';

export interface Order {
  id: string;
  recipientName: string;
  recipientPhone: string;
  address: string;
  note?: string;
  status: OrderStatus;
  price: number;
  articlePrice: number;
  paymentMethod: PaymentMethod;
  timestamp: Date;
  trackingToken: string;
  lat?: number;
  lng?: number;
}

export interface UserProfile {
  name: string;
  phone: string;
  email: string;
  avatar?: string;
}

interface AppState {
  orders: Order[];
  balance: number;
  userRole: UserRole;
  profile: UserProfile;
  setRole: (role: UserRole) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  addOrder: (order: Omit<Order, 'id' | 'status' | 'timestamp' | 'trackingToken'>) => string;
  markAsDelivering: (id: string) => void;
  markAsDelivered: (id: string) => void;
  withdrawFunds: () => void;
}

export const useStore = create<AppState>((set) => ({
  orders: [
    {
      id: 'ORD-001',
      recipientName: 'Papa Wemba',
      recipientPhone: '0812345678',
      address: 'Avenue de la Paix, Gombe',
      note: 'Portail bleu',
      status: 'pending',
      price: 5000,
      articlePrice: 25000,
      paymentMethod: 'cod',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      trackingToken: 'TRK-WEMBA-123',
      lat: -4.315,
      lng: 15.305
    }
  ],
  balance: 15000,
  userRole: null,
  profile: {
    name: "Felix Kabange",
    phone: "0812345678",
    email: "felix@kolisa.cd"
  },
  setRole: (role) => set({ userRole: role }),
  updateProfile: (updates) => set((state) => ({ profile: { ...state.profile, ...updates } })),
  addOrder: (orderData) => {
    const id = `ORD-${Math.floor(Math.random() * 10000)}`;
    const trackingToken = `TRK-${Math.random().toString(36).substring(7).toUpperCase()}`;
    set((state) => ({
      orders: [
        {
          ...orderData,
          id,
          status: 'pending',
          timestamp: new Date(),
          trackingToken,
        },
        ...state.orders,
      ],
    }));
    return trackingToken;
  },
  markAsDelivering: (id) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === id ? { ...o, status: 'delivering' } : o
      ),
    })),
  markAsDelivered: (id) =>
    set((state) => {
      const order = state.orders.find((o) => o.id === id);
      if (order && order.status !== 'delivered') {
        return {
          orders: state.orders.map((o) =>
            o.id === id ? { ...o, status: 'delivered' } : o
          ),
          balance: state.balance + order.price,
        };
      }
      return state;
    }),
  withdrawFunds: () => set({ balance: 0 }),
}));
