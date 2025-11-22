export type Timestamp = any;

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
  CANCELLED = 'CANCELLED',
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
  BONUS = 'BONUS',
  MARKET_COMMISSION = 'MARKET_COMMISSION',
  DISTANCE_BONUS = 'DISTANCE_BONUS',
  TIME_BONUS = 'TIME_BONUS',
}

export interface Coordinates {
  latitude: number;
  longitude: number;
  lat?: number;
  lng?: number;
}

export interface CustomerInfo {
  name: string;
  phone?: string;
  address?: string;
  coordinates?: Coordinates;
}

export interface PickupInfo {
  name: string;
  businessName?: string;
  address?: string;
  coordinates?: Coordinates;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  driverId?: string;
  customer: CustomerInfo;
  pickup: PickupInfo;
  paymentMethod: 'CASH' | 'CARD';
  payment: {
    method: 'TARJETA' | 'EFECTIVO';
    tip?: number;
  };
  total?: number;
  earnings: number;
  distance: number;
  estimatedTime?: number;
  timestamps: {
    created: Timestamp;
  };
  [key: string]: any;
}

export interface WalletTransaction {
  id: string;
  driverId: string;
  type: TransactionType;
  amount: number;
  description: string;
  orderId?: string;
  timestamp: Timestamp;
  date?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
}

// Legacy alias for backward compatibility
export type WalletTransactionLocal = WalletTransaction;
export type OrderLocal = Order;

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info';
  timestamp: Timestamp;
  read: boolean;
  data?: any;
}

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
  [key: string]: any;
}

export interface Driver {
  uid: string;
  email: string;
  // Legacy flat properties for backward compatibility
  fullName?: string;
  phone?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED';
  walletBalance?: number;
  kpis?: {
    averageRating?: number;
    acceptanceRate?: number;
    totalOrders?: number;
    completedOrders?: number;
    totalEarnings?: number;
  };
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

export type RootStackParamList = {
  Login: undefined;
  Registration: undefined;
  Onboarding: undefined;
  Main: undefined;
  OrderDetail: { orderId: string };
  OrderCompletion: { order: Order };
  OrderRating: { order: Order };
  GPSNavigation: undefined;
  DeliveryConfirmation: { orderId: string };
  PaymentsHistory: undefined;
  Wallet: undefined;
  Withdrawal: undefined;
  Metrics: undefined;
  Settings: undefined;
  Documents: undefined;
  Emergency: undefined;
  Incidents: { orderId: string };
  CustomerTracking: { id: string };
  Navigation: { orderId?: string };
  Chat: { chatId?: string };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Orders: undefined;
  Maps: undefined;
  Payments: undefined;
  Notifications: undefined;
  Profile: undefined;
};

export interface NavigationProps {
  navigation: any;
  route?: any;
}
