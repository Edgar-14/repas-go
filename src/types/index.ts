// Tipos principales de la aplicación BeFast GO

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
  SEARCHING = 'SEARCHING',
  ASSIGNED = 'ASSIGNED',
  ACCEPTED = 'ACCEPTED',
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
    phone: string;
    address: string;
  };
  pickup: {
    businessName: string;
    address: string;
    location: {
      latitude: number;
      longitude: number;
    };
    specialInstructions?: string;
  };
  delivery: {
    address: string;
    location: {
      latitude: number;
      longitude: number;
    };
    items: OrderItem[];
  };
  paymentMethod: 'CASH' | 'CARD';
  total: number;
  platformFee: number;
  tip?: number;
  estimatedEarnings: number;
  distance: number;
  estimatedTime: number;
  createdAt: Date;
  updatedAt: Date;
  // Additional properties for compatibility
  customerName?: string;
  pickupBusiness?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  totalEarnings?: number;
  date?: string;
  items?: OrderItem[];
  chatHistory?: ChatMessage[];
  earningsBreakdown?: {
    baseFare: number;
    distancePay: number;
    tip: number;
  };
  customerRating?: number;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

export enum TransactionType {
  CASH_ORDER_ADEUDO = 'CASH_ORDER_ADEUDO',
  CARD_ORDER_TRANSFER = 'CARD_ORDER_TRANSFER',
  TIP_CARD_TRANSFER = 'TIP_CARD_TRANSFER',
  DEBT_PAYMENT = 'DEBT_PAYMENT',
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
  timestamp: Date;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
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
    imssStatus: 'ACTIVO_COTIZANDO';
    nssValid: boolean;
  };
  operationalValidation: {
    befastStatus: 'ACTIVE';
    documentsValid: boolean;
    trainingCurrent: boolean;
    debtWithinLimit: boolean;
  };
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface ChatMessage {
  sender: 'customer' | 'driver' | 'business';
  text: string;
  timestamp: string;
}

export interface NavigationProps {
  navigation: any;
  route: any;
}

export interface RootStackParamList {
  [key: string]: undefined | object;
  Onboarding: undefined;
  Registration: undefined;
  Login: undefined;
  Dashboard: undefined;
  Orders: undefined;
  OrderDetail: { orderId: string };
  Navigation: { orderId: string };
  Profile: undefined;
  Chat: { chatId?: string };
  DeliveryConfirmation: { orderId: string };
  Incidents: { orderId: string };
  Payments: undefined;
  Shift: undefined;
  Emergency: undefined;
  Notifications: undefined;
  EarningsDetail: undefined;
  Rating: { orderId: string; customerId: string };
  Withdrawal: undefined;
  Settings: undefined;
  Documents: undefined;
  CustomerTracking: { id: string };
  OrderCompletion: { order: Order };
  OrderRating: { order: Order };
}