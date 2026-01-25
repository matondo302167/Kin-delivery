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
}

interface AppState {
  orders: Order[];
  balance: number;
  addOrder: (order: Omit<Order, 'id' | 'status' | 'timestamp'>) => void;
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
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
    },
    {
      id: 'ORD-002',
      recipientName: 'Maman Monique',
      recipientPhone: '0998765432',
      address: 'Marché de la Liberté, Masina',
      status: 'delivered',
      price: 15000,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    },
    {
      id: 'ORD-003',
      recipientName: 'Fally Ipupa',
      recipientPhone: '0823456789',
      address: 'Hotel Memling, Kinshasa',
      note: 'Reception',
      status: 'pending',
      price: 7500,
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
    },
  ],
  balance: 15000,
  addOrder: (orderData) =>
    set((state) => ({
      orders: [
        {
          ...orderData,
          id: `ORD-${Math.floor(Math.random() * 10000)}`,
          status: 'pending',
          timestamp: new Date(),
        },
        ...state.orders,
      ],
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
