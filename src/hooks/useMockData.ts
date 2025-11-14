import { useState, useCallback } from 'react';
import React from 'react';
import { Driver, Order, ChatMessage, OrderStatus, TransactionType } from '../types';

interface Incentive {
  id: string;
  title: string;
  description: string;
  reward: number;
  goal: number;
  progress: number;
}

interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  date: string;
}

interface Payment {
  id: string;
  amount: number;
  date: string;
  status: string;
  method: string;
}

// Mock Data
const initialDriver: Driver = {
    personalData: { fullName: 'Juan Perez' },
    email: 'driver@befast.com',
    operational: { isOnline: false },
    stats: {
        rating: 4.9,
        acceptanceRate: 92,
        onTimeRate: 98,
        cancellationRate: 2,
        level: 12,
        xp: 1850,
        xpGoal: 2500,
        rank: 'Diamante',
    },
    wallet: { balance: 1250.75, pendingDebts: 85.50 },
};

const initialOrders: Order[] = [
    {
        id: '12345',
        status: OrderStatus.PENDING,
        driverId: 'driver123',
        customer: {
            name: 'Ana García',
            phone: '+52 55 1234 5678',
            address: 'Calle Oaxaca 90, Roma Nte.'
        },
        pickup: {
            businessName: 'Super Tacos',
            address: 'Av. Insurgentes Sur 123, Roma Nte.',
            location: { latitude: 19.4192, longitude: -99.1685 }
        },
        delivery: {
            address: 'Calle Oaxaca 90, Roma Nte.',
            location: { latitude: 19.422, longitude: -99.1645 },
            items: [{ id: 't1', name: 'Tacos al Pastor', quantity: 4, price: 60 }, { id: 's1', name: 'Soda', quantity: 1, price: 25 }]
        },
        paymentMethod: 'CASH',
        total: 85,
        platformFee: 10,
        tip: 20,
        estimatedEarnings: 85.50,
        distance: 2.5,
        estimatedTime: 15,
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        updatedAt: new Date(),
        // Compatibility properties
        customerName: 'Ana García',
        pickupBusiness: 'Super Tacos',
        pickupAddress: 'Av. Insurgentes Sur 123, Roma Nte.',
        deliveryAddress: 'Calle Oaxaca 90, Roma Nte.',
        totalEarnings: 85.50,
        date: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        items: [{ id: 't1', name: 'Tacos al Pastor', quantity: 4, price: 60 }, { id: 's1', name: 'Soda', quantity: 1, price: 25 }],
        chatHistory: [
            { sender: 'business', text: '¡Tu pedido de Super Tacos está listo para ser recogido!', timestamp: '1:15 PM' },
            { sender: 'customer', text: '¡Gracias! ¿Podrías avisarme cuando estés cerca?', timestamp: '1:20 PM' },
            { sender: 'driver', text: '¡Claro! Voy en camino.', timestamp: '1:22 PM' },
        ],
        paymentMethod: 'CASH',
        earningsBreakdown: { baseFare: 40, distancePay: 25.50, tip: 20 },
        customerRating: 5,
    },
    {
        id: '67890',
        status: OrderStatus.PENDING,
        driverId: 'driver123',
        customer: {
            name: 'Carlos Martinez',
            phone: '+52 55 9876 5432',
            address: 'Calle 27 80, San Pedro de los Pinos'
        },
        pickup: {
            businessName: 'Pizza Nostra',
            address: 'Av. Revolución 500, San Pedro de los Pinos',
            location: { latitude: 19.385, longitude: -99.185 }
        },
        delivery: {
            address: 'Calle 27 80, San Pedro de los Pinos',
            location: { latitude: 19.388, longitude: -99.188 },
            items: [{ id: 'p1', name: 'Pizza Pepperoni Grande', quantity: 1, price: 120 }]
        },
        paymentMethod: 'CARD',
        total: 120,
        platformFee: 15,
        tip: 30,
        estimatedEarnings: 120.00,
        distance: 3.2,
        estimatedTime: 20,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        updatedAt: new Date(),
        // Compatibility properties
        customerName: 'Carlos Martinez',
        pickupBusiness: 'Pizza Nostra',
        pickupAddress: 'Av. Revolución 500, San Pedro de los Pinos',
        deliveryAddress: 'Calle 27 80, San Pedro de los Pinos',
        totalEarnings: 120.00,
        date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        items: [{ id: 'p1', name: 'Pizza Pepperoni Grande', quantity: 1, price: 120 }],
        chatHistory: [],
        paymentMethod: 'CARD',
        earningsBreakdown: { baseFare: 50, distancePay: 40, tip: 30 },
        customerRating: 4,
    },
    {
        id: '11223',
        status: OrderStatus.COMPLETED,
        driverId: 'driver123',
        customer: {
            name: 'Sofía López',
            phone: '+52 55 5555 1234',
            address: 'Calle Hamburgo 15, Juárez'
        },
        pickup: {
            businessName: 'Sushi Roll',
            address: 'Paseo de la Reforma 222, Juárez',
            location: { latitude: 19.427, longitude: -99.164 }
        },
        delivery: {
            address: 'Calle Hamburgo 15, Juárez',
            location: { latitude: 19.429, longitude: -99.162 },
            items: [{ id: 'r1', name: 'California Roll', quantity: 2, price: 75 }]
        },
        paymentMethod: 'CARD',
        total: 95,
        platformFee: 12,
        tip: 20,
        estimatedEarnings: 95.75,
        distance: 1.8,
        estimatedTime: 12,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        // Compatibility properties
        customerName: 'Sofía López',
        pickupBusiness: 'Sushi Roll',
        pickupAddress: 'Paseo de la Reforma 222, Juárez',
        deliveryAddress: 'Calle Hamburgo 15, Juárez',
        totalEarnings: 95.75,
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        items: [{ id: 'r1', name: 'California Roll', quantity: 2, price: 75 }],
        chatHistory: [],
        paymentMethod: 'CARD',
        earningsBreakdown: { baseFare: 45, distancePay: 30.75, tip: 20 },
        customerRating: 5,
    },
];

const initialTransactions: Transaction[] = [
    { id: 't1', type: TransactionType.CARD_ORDER_TRANSFER, description: 'Pago de Pedido #11223', amount: 75.75, date: 'Ayer' },
    { id: 't2', type: TransactionType.TIP_CARD_TRANSFER, description: 'Propina de Pedido #11223', amount: 20.00, date: 'Ayer' },
    { id: 't3', type: TransactionType.CASH_ORDER_ADEUDO, description: 'Adeudo Pedido #12345', amount: 85.50, date: 'Hoy' },
    { id: 't4', type: TransactionType.DEBT_PAYMENT, description: 'Pago de Adeudo', amount: 150.00, date: 'Hace 2 días' },
    { id: 't5', type: TransactionType.WITHDRAWAL, description: 'Retiro a cuenta bancaria', amount: 500.00, date: 'Hace 3 días' },
];

const initialIncentives: Incentive[] = [
    { id: 'i1', title: 'Bono de Fin de Semana', description: 'Completa 50 viajes este fin de semana.', reward: 500, goal: 50, progress: 25 },
    { id: 'i2', title: 'Reto Nocturno', description: 'Completa 10 viajes después de las 9 PM.', reward: 150, goal: 10, progress: 8 },
];

const initialPayments: Payment[] = [
    { id: 'p1', amount: 500.00, date: '2023-10-26', status: 'Completado', method: 'Retiro a **** 1234' },
    { id: 'p2', amount: 150.00, date: '2023-10-27', status: 'Completado', method: 'Pago de deuda con tarjeta' },
    { id: 'p3', amount: 750.00, date: '2023-10-28', status: 'Pendiente', method: 'Retiro a **** 1234' },
];

const weeklySummary = {
    earnings: 1350.75,
    trips: 45,
    hours: 32,
};

import { auth, firestore, COLLECTIONS } from '../config/firebase';

export const useMockData = () => {
    const [driver, setDriver] = useState<Driver>({
        personalData: { fullName: '' },
        email: '',
        operational: { isOnline: false },
        stats: undefined,
        wallet: { balance: 0, pendingDebts: 0 },
    });
    const [orders, setOrders] = useState<Order[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [weeklySummary, setWeeklySummary] = useState<{ earnings: number; trips: number; hours: number }>({ earnings: 0, trips: 0, hours: 0 });

    // Suscribirse a datos reales de Firestore
    React.useEffect(() => {
        const uid = auth().currentUser?.uid;
        if (!uid) return;
        const unsubDriver = firestore().collection(COLLECTIONS.DRIVERS).doc(uid).onSnapshot((doc) => {
            const data = doc.data() as any;
            if (data) {
                setDriver({
                    personalData: { fullName: data.personalData?.fullName || '' },
                    email: data.email || '',
                    operational: { isOnline: !!data.operational?.isOnline },
                    stats: data.stats,
                    wallet: { balance: data.wallet?.balance || 0, pendingDebts: data.wallet?.pendingDebts || 0 },
                });
            }
        });
        const unsubOrders = firestore()
            .collection(COLLECTIONS.ORDERS)
            .where('driverId', '==', uid)
            .orderBy('createdAt', 'desc')
            .limit(50)
            .onSnapshot((snap) => {
                const list: Order[] = [];
                let earnings = 0;
                let trips = 0;
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                snap.forEach((d) => {
                    const data: any = d.data();
                    const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
                    const order: Order = {
                        id: d.id,
                        status: data.status,
                        earnings: data.estimatedEarnings || 0,
                        payment: { method: (data.paymentMethod === 'CARD' ? 'TARJETA' : 'EFECTIVO'), tip: data.tip },
                        distance: data.distance || 0,
                        pickup: { name: data.pickup?.businessName || 'Pickup' },
                        customer: { name: data.customer?.name || 'Cliente' },
                        timestamps: { created: createdAt },
                        driverId: data.driverId,
                        // compat
                        ...(data.customerName ? { customerName: data.customerName } : {}),
                        ...(data.pickupBusiness ? { pickupBusiness: data.pickupBusiness } : {}),
                    } as any;
                    list.push(order);
                    if (createdAt >= sevenDaysAgo && (data.status === 'DELIVERED' || data.status === 'COMPLETED')) {
                        earnings += data.estimatedEarnings || 0;
                        trips += 1;
                    }
                });
                setOrders(list);
                setWeeklySummary({ earnings, trips, hours: 0 });
            });
        return () => { unsubDriver(); unsubOrders(); };
    }, []);

    const toggleOnlineStatus = useCallback(async () => {
        const uid = auth().currentUser?.uid;
        if (!uid) return;
        await firestore().collection(COLLECTIONS.DRIVERS).doc(uid).set({
            operational: { isOnline: !driver.operational.isOnline }
        }, { merge: true });
    }, [driver.operational.isOnline]);

    const declineOrder = useCallback(async (orderId: string) => {
        // Solo elimina de la vista, no modifica en servidor
        setOrders(prev => prev.filter(o => o.id !== orderId));
    }, []);

    const getOrderById = useCallback((id: string) => {
        return orders.find(o => o.id === id);
    }, [orders]);

    const addChatMessage = useCallback((orderId: string, message: ChatMessage) => {
        setOrders(prevOrders => prevOrders.map(order => 
            order.id === orderId ? { ...order, chatHistory: [...order.chatHistory, message] } : order
        ));
    }, []);

    const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
        setOrders(prevOrders => prevOrders.map(order => 
            order.id === orderId ? { ...order, status } : order
        ));
    }, []);
    
    return {
        driver,
        orders,
        weeklySummary,
        incentives: initialIncentives,
        transactions, // Datos en vivo desde Firestore
        payments: [], // Removido mock: se mostrará vacío hasta implementar fuente real
        toggleOnlineStatus,
        declineOrder,
        getOrderById,
        addChatMessage,
        updateOrderStatus,
    };
};
