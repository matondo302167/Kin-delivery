import { create } from 'zustand';

export type OrderStatus = 'pending' | 'delivering' | 'delivered';

export interface Order {
  id: string;
  recipientName: string;
  recipientPhone: string;
  address: string;
  note?: string;
  status: OrderStatus;
  price: number;
  timestamp: Date;
  trackingToken: string;
}

interface AppState {
  orders: Order[];
  balance: number;
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
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      trackingToken: 'TRK-WEMBA-123',
    },
    {
      id: 'ORD-002',
      recipientName: 'Maman Monique',
      recipientPhone: '0998765432',
      address: 'Marché de la Liberté, Masina',
      status: 'delivered',
      price: 15000,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      trackingToken: 'TRK-MONIQUE-456',
    },
  ],
  balance: 15000,
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
