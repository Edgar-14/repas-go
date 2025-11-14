// src/types/index.ts
// --- TIPOS PRINCIPALES DE DATOS ---
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

// Tipos de Navegación (Fuente Única de Verdad)
export type RootStackParamList = {
Login: undefined;
Registration: undefined;
Onboarding: undefined;
Main: undefined;
OrderDetail: { orderId: string };
OrderCompletion: { order: Order }; // 'order' en lugar de 'orderId' según OrderCompletionScreen
OrderRating: { order: Order };
GPSNavigation: undefined;
DeliveryConfirmation: { orderId: string };
PaymentsHistory: undefined;
Metrics: undefined;
Settings: undefined;
Documents: undefined;
Emergency: undefined;
Incidents: { orderId: string };
CustomerTracking: { id: string };
Navigation: { orderId?: string }; // Añadido para que NavigationScreen funcione
Chat: { chatId?: string }; // Añadido para GPSNavigationScreen
Withdrawal: undefined; // Añadido para PaymentsScreen
};

export type MainTabParamList = {
Dashboard: undefined;
Orders: undefined;
Maps: undefined;
Payments: undefined;
Notifications: undefined;
Profile: undefined;
};

// Props de navegación genéricas (para EmergencyScreen, etc.)
export interface NavigationProps {
navigation: any;
route?: any;
}

// --- TIPOS DE ENTIDADES ---

export interface Driver {
uid: string;
email: string;
personalData: {
fullName: string;
phone: string;
rfc: string;
curp: string;
nss: string;
};
administrative: {
befastStatus: 'PENDING' | 'APPROVED' | 'ACTIVE' | 'SUSPENDED';
imssStatus: 'ACTIVO_COTIZANDO' | 'PENDING' | 'INACTIVE';
documentsStatus: 'APPROVED' | 'PENDING' | 'EXPIRED';
trainingStatus: 'COMPLETED' | 'PENDING' | 'EXPIRED';
idseApproved: boolean;
idseDocument?: string;
};
operational: {
isOnline: boolean;
status: 'ACTIVE' | 'BUSY' | 'OFFLINE' | 'BREAK';
currentOrderId: string | null;
currentLocation?: {
latitude: number;
longitude: number;
};
};
wallet: {
balance: number;
pendingDebts: number;
creditLimit: number;
};
stats: {
totalOrders: number;
completedOrders: number;
rating: number;
totalEarnings: number;
acceptanceRate: number;
onTimeRate: number;
cancellationRate: number;
level: number;
xp: number;
xpGoal: number;
rank: string;
};
}

export enum OrderStatus {
PENDING = 'PENDING',
CREATED = 'CREATED',
SEARCHING = 'SEARCHING',
ASSIGNED = 'ASSIGNED',
ACCEPTED = 'ACCEPTED',
STARTED = 'STARTED',
PICKED_UP = 'PICKED_UP',
IN_TRANSIT = 'IN_TRANSIT',
ARRIVED = 'ARRIVED',
DELIVERED = 'DELIVERED',
COMPLETED = 'COMPLETED',
FAILED = 'FAILED',
CANCELLED = 'CANCELLED'
}

export interface Order {
id: string;
status: OrderStatus;
driverId?: string;
customer: {
name: string;
phone?: string;
address?: string;
location?: { latitude: number; longitude: number };
};
pickup: {
businessName?: string;
name: string; // Añadido para compatibilidad
address?: string;
location?: {
latitude: number;
longitude: number;
};
specialInstructions?: string;
};
delivery?: {
address: string;
location: {
latitude: number;
longitude: number;
};
items: any[]; // Simplificado
};
paymentMethod?: 'CASH' | 'CARD';
payment: {
method: 'TARJETA' | 'EFECTIVO';
tip?: number;
};
total?: number;
earnings: number;
distance: number;
estimatedTime?: number;
timestamps: {
created: Date;
};
// Propiedades de compatibilidad
[key: string]: any;
}


export enum TransactionType {
CARD_ORDER_TRANSFER = 'CARD_ORDER_TRANSFER',
TIP_CARD_TRANSFER = 'TIP_CARD_TRANSFER',
DEBT_PAYMENT = 'DEBT_PAYMENT',
CASH_ORDER_ADEUDO = 'CASH_ORDER_ADEUDO',
WITHDRAWAL = 'WITHDRAWAL',
BENEFITS_TRANSFER = 'BENEFITS_TRANSFER',
ADJUSTMENT = 'ADJUSTMENT',
PENALTY = 'PENALTY',
BONUS = 'BONUS'
}

export interface WalletTransaction {
id: string;
driverId: string;
type: TransactionType;
amount: number;
description: string;
orderId?: string;
timestamp: Date | FirebaseFirestoreTypes.Timestamp;
status: 'PENDING' | 'COMPLETED' | 'FAILED';
date?: string; // Para compatibilidad
}

export interface Notification {
id: string;
title: string;
message: string;
type: 'success' | 'error' | 'info';
timestamp: Date;
read: boolean;
data?: any;
}

// --- TIPOS DE SERVICIOS ---

export interface ValidationResult {
approved?: boolean;
reason?: string;
canReceiveOrders?: boolean;
blockingReason?: string;
message?: string;
}

export interface CriticalValidation {
imssValidation: {
idseApproved: boolean;
imssStatus: 'ACTIVO_COTIZANDO' | 'PENDING' | 'INACTIVE';
nssValid: boolean;
};
operationalValidation: {
befastStatus: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
documentsValid: boolean;
trainingCurrent: boolean;
debtWithinLimit: boolean;
};
}

// Para NavigationScreen (IA de Mapas)
export interface MapLocation {
latitude: number;
longitude: number;
title?: string;
description?: string;
}

export interface MapAction {
intent: 'VIEW_LOCATION' | 'SEARCH_PLACES' | 'DIRECTIONS' | 'CLEAR';
params?: any;
}

// Para Notificaciones (Modal de Nuevo Pedido)
export interface NewOrderNotificationPayload {
id: string;
storeName: string;
pickupAddress: string;
deliveryAddress: string;
total: number;
paymentMethod: 'CASH' | 'CARD' | string;
distanceKm: number;
deliveryFee: number;
tip: number;
[key: string]: any; // Permitir otros campos
}