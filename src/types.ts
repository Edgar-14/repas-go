// A simplified Order type based on the properties used in DashboardScreen.tsx
export interface Order {
  id: string;
  distance: number;
  pickup: { name: string; location?: { latitude: number; longitude: number } };
  customer: { name: string; location?: { latitude: number; longitude: number } };
  earnings: number;
  payment: {
    method: 'TARJETA' | 'EFECTIVO';
    tip?: number;
  };
  status: OrderStatus;
  timestamps: {
    created: Date;
  };
  driverId?: string;
  [key: string]: any; // permitir campos adaptados
}

// FIX: Expanded Driver type to be compatible with all mock data sources.
// Made `personalData`, `email`, and `stats` optional to avoid breaking `useDriver.ts` which uses a simpler mock.
export interface Driver {
  personalData?: {
    fullName: string;
  };
  email?: string;
  operational: {
    isOnline: boolean;
  };
  stats?: {
    rating: number;
    acceptanceRate: number;
    onTimeRate: number;
    cancellationRate: number;
    level: number;
    xp: number;
    xpGoal: number;
    rank: string;
  };
  wallet: {
    balance: number;
    pendingDebts: number;
  };
}

// FIX: Added missing OrderStatus enum.
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

// FIX: Added missing TransactionType enum.
export enum TransactionType {
    CARD_ORDER_TRANSFER = 'CARD_ORDER_TRANSFER',
    TIP_CARD_TRANSFER = 'TIP_CARD_TRANSFER',
    DEBT_PAYMENT = 'DEBT_PAYMENT',
    CASH_ORDER_ADEUDO = 'CASH_ORDER_ADEUDO',
    WITHDRAWAL = 'WITHDRAWAL',
}

// FIX: Added missing MapGroundingChunk for chatbot.
export interface MapGroundingChunk {
    maps: {
        uri: string;
        title: string;
    };
}

export interface WebGroundingChunk {
    web: {
        uri: string;
        title: string;
    };
}

// FIX: Added missing ChatMessage type.
export interface ChatMessage {
    sender: 'user' | 'model' | 'driver' | 'customer' | 'business';
    text: string;
    timestamp: string;
    groundingChunks?: (MapGroundingChunk | WebGroundingChunk)[];
}

// FIX: Added missing MockOrder type.
export interface MockOrder {
    id: string;
    customerName: string;
    pickupBusiness: string;
    pickupAddress: string;
    deliveryAddress: string;
    totalEarnings: number;
    status: OrderStatus;
    date: string;
    items: { id: string; name: string; quantity: number }[];
    chatHistory: ChatMessage[];
    paymentMethod: 'CASH' | 'CARD';
    earningsBreakdown: { baseFare: number; distancePay: number; tip: number };
    customerRating: number;
}

// FIX: Added missing Incentive type.
export interface Incentive {
    id: string;
    title: string;
    description: string;
    reward: number;
    goal: number;
    progress: number;
}

// FIX: Added missing Transaction type.
export interface Transaction {
    id: string;
    type: TransactionType;
    description: string;
    amount: number;
    date: string;
}

// FIX: Added missing Payment type.
export interface Payment {
    id: string;
    amount: number;
    date: string;
    status: 'Completado' | 'Pendiente' | 'Fallido';
    method: string;
}

// FIX: Added missing Notification type.
export interface Notification {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

// React Navigation Type Definitions
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
  Dashboard: undefined;
  Navigation: undefined;
  Orders: undefined;
  Wallet: undefined;
  Profile: undefined;
  ActiveOrder: { order: MockOrder };
  OrderCompletion: { order: MockOrder };
  // FIX: Made order parameter optional to satisfy Stack.Navigator type checking.
  OrderRating: { order?: MockOrder };
  OrderDetails: { id: string };
  PaymentsHistory: undefined;
  Metrics: undefined;
  LiveAssistant: undefined;
  DevMenu: undefined;
  // FIX: Made id parameter optional to satisfy Stack.Navigator type checking.
  CustomerTracking: { id?: string };
};