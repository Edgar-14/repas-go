import { useState, useCallback } from 'react';
import { Order } from '../types';

const MOCK_ORDERS: Order[] = [
    {
        id: 'order-123',
        status: 'PENDING',
        earnings: 75.00,
        payment: { method: 'TARJETA', tip: 15 },
        distance: 3.5,
        pickup: { name: 'Pizza Nostra' },
        customer: { name: 'Carlos M.' },
        timestamps: { created: new Date() },
    },
    {
        id: 'order-456',
        status: 'PENDING',
        earnings: 95.20,
        payment: { method: 'EFECTIVO' },
        distance: 8.1,
        pickup: { name: 'Sushi Roll' },
        customer: { name: 'Sofía L.' },
        timestamps: { created: new Date() },
    },
];

const useOrders = () => {
  const [loading, setLoading] = useState(false);
  const [availableOrders, setAvailableOrders] = useState<Order[]>(MOCK_ORDERS);

  const acceptOrder = useCallback((orderId: string) => {
    return new Promise<void>((resolve) => {
      setLoading(true);
      setTimeout(() => {
        setAvailableOrders(prev => prev.filter(order => order.id !== orderId));
        setLoading(false);
        resolve();
      }, 700);
    });
  }, []);

  return { availableOrders, loading, acceptOrder };
};

export default useOrders;
