/**
 * @file Provides a collection of React hooks for subscribing to real-time Firestore data.
 * @author Jules
 */

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/collections';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  where, 
  limit,
  doc,
  DocumentData,
  Timestamp,
  QueryConstraint
} from 'firebase/firestore';

// 🎯 IMPORTAR DESDE EL MODELO CANÓNICO - ÚNICA FUENTE DE VERDAD
// Importar todos los tipos desde la fuente central
import type { 
  Order, 
  OrderItem, 
  Business, 
  WalletTransaction,
  Driver as CanonicalDriver 
} from '@/types';

// Re-exportar para compatibilidad con código existente
export type { Order, OrderItem, Business, WalletTransaction };

// Note: Driver interface below extends the canonical one with runtime-specific fields
// This is acceptable for hooks that need real-time Firestore data
export type Driver = CanonicalDriver;

export interface DriverFilters {
  status?: string[];
  imssStatus?: string[];
  classification?: string[];
  vehicleType?: string[];
  balance?: 'all' | 'positive' | 'negative' | 'debt';
  searchTerm?: string;
}

// Note: Business interface is now imported from @/types/business.ts
// The local definition below is kept for compatibility with existing code that
// may have slight differences, but should be gradually migrated to use the canonical type

export interface BusinessLegacy {
  id: string;
  uid: string;
  email: string;
  businessName: string;
  contactName: string;
  phone: string;
  address: string;
  coordinates: { lat: number; lng: number };
  rfc: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  credits: number; // Legacy field
  availableCredits: number; // New field used by Stripe webhook
  totalOrders: number;
  totalSpent: number;
  emailVerified: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  creditTransactions: Array<{
    transactionId: string;
    amount: number;
    packageType: 'Básico' | 'Empresarial' | 'Corporativo';
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: Timestamp;
    proofUrl: string;
  }>;
  billing?: {
    lastPurchaseDate?: Date;
    lastPurchaseAmount?: number;
    totalPurchases?: number;
    pendingCheckout?: any;
  };
}

/**
 * ⚠️ DEPRECATED: Local Driver and WalletTransaction interfaces
 * These interfaces were removed and replaced with canonical types imported from @/types.
 * 
 * - Driver canonical type: src/lib/types/Driver.ts
 * - WalletTransaction canonical type: src/types/wallet.ts
 * 
 * All code should now import these types from @/types instead of defining them locally.
 */

// Normaliza una orden para asegurar items con id y shape compatible
function normalizeOrder(data: any, id: string): Order {
  const items = Array.isArray(data?.items)
    ? data.items.map((it: any, idx: number) => ({
        id: it?.id ?? `${id}-item-${idx}`,
        name: it?.name,
        quantity: it?.quantity,
        price: it?.price,
        modifiers: it?.modifiers,
        subtotal: it?.subtotal,
      }))
    : undefined;
  const sShipdayOrderId = data?.shipdayOrderId != null ? String(data.shipdayOrderId) : undefined;
  return { id, ...data, items, shipdayOrderId: sShipdayOrderId } as Order;
}

/**
 * Subscribes to a real-time feed of the most recent orders from Firestore.
 *
 * NOTE: This hook demonstrates good practice by importing the canonical `Order` type,
 * but the file itself re-defines other core types like `Driver` and `Business`,
 * leading to type fragmentation.
 *
 * @param {number} [limitCount=50] - The maximum number of recent orders to fetch.
 * @returns {{orders: Order[], loading: boolean, error: string | null, retryCount: number}} The state of the real-time orders query.
 */
export function useRealtimeOrders(limitCount: number = 50) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!db) {
      setError('Firebase no está inicializado');
      setLoading(false);
      return;
    }

    const setupListener = () => {
      try {
        const ordersQuery = query(
          collection(db, COLLECTIONS.ORDERS),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );

        const unsubscribe = onSnapshot(
          ordersQuery,
          (querySnapshot) => {
            console.log(`Orders updated: ${querySnapshot.size} documents`);
            const ordersData: Order[] = [];
            querySnapshot.forEach((doc) => {
              ordersData.push(normalizeOrder(doc.data(), doc.id));
            });
            setOrders(ordersData);
            setLoading(false);
            setError(null);
            setRetryCount(0);
          },
          (err) => {
            console.error('Error getting orders:', err);
            setError(`Error cargando órdenes: ${err.message}`);
            setLoading(false);
            
            // Auto-retry with exponential backoff
            if (retryCount < 3) {
              console.log(`Retrying orders listener (attempt ${retryCount + 1}/3)`);
              setTimeout(() => {
                setRetryCount(prev => prev + 1);
                setLoading(true);
              }, 2000 * (retryCount + 1));
            }
          }
        );

        return unsubscribe;
      } catch (err: any) {
        console.error('Error setting up orders listener:', err);
        setError(`Error configurando listener: ${err.message}`);
        setLoading(false);
        return null;
      }
    };

    const unsubscribe = setupListener();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [limitCount, retryCount]);

  return { orders, loading, error, retryCount };
}

/**
 * Subscribes to a real-time feed of the most recent businesses from Firestore.
 *
 * @param {number} [limitCount=100] - The maximum number of recent businesses to fetch.
 * @returns {{businesses: Business[], loading: boolean, error: string | null}} The state of the real-time businesses query.
 */
export function useRealtimeBusinesses(limitCount: number = 100) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) {
      setError('Firebase no está inicializado');
      setLoading(false);
      return;
    }

    try {
      const businessesQuery = query(
        collection(db, COLLECTIONS.BUSINESSES),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const unsubscribe = onSnapshot(
        businessesQuery,
        (querySnapshot) => {
          const businessesData: Business[] = [];
          querySnapshot.forEach((doc) => {
            businessesData.push({ id: doc.id, ...doc.data() } as Business);
          });
          setBusinesses(businessesData);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Error getting businesses:', err);
          setError(`Error cargando negocios: ${err.message}`);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err: any) {
      setError(`Error configurando listener: ${err.message}`);
      setLoading(false);
    }
  }, [limitCount]);

  return { businesses, loading, error };
}

/**
 * Subscribes to the real-time data for a single business and its associated orders.
 * Contains client-side logic for sorting orders by status.
 *
 * @param {string | null} businessId - The ID of the business to subscribe to.
 * @returns {{business: Business | null, orders: Order[], loading: boolean, error: string | null, refreshData: () => void, lastUpdated: Date | null, connectionStatus: 'connected' | 'disconnected' | 'error'}} The comprehensive state for a business view.
 */
export function useBusinessData(businessId: string | null) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('connected');

  // Función para forzar la actualización de datos
  const refreshData = () => {
    setRefreshCounter(prev => prev + 1);
    setLastUpdated(new Date());
  };

  useEffect(() => {
    if (!db || !businessId) {
      setLoading(false);
      return;
    }

    console.log('🔥 useBusinessData: Setting up enhanced listener for businessId:', businessId);

    let unsubscribeBusiness: (() => void) | null = null;
    let unsubscribeOrders: (() => void) | null = null;
    let retryTimeout: NodeJS.Timeout | null = null;

    const setupListeners = () => {
      // Clean up any existing listeners
      if (unsubscribeBusiness) unsubscribeBusiness();
      if (unsubscribeOrders) unsubscribeOrders();

      // Business document listener with enhanced error handling
      const businessDocRef = doc(db, COLLECTIONS.BUSINESSES, businessId);
      
      unsubscribeBusiness = onSnapshot(
        businessDocRef,
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            const businessData = { id: docSnapshot.id, ...docSnapshot.data() } as Business;
            console.log('✅ Business data updated:', businessData.businessName);
            setBusiness(businessData);
            setLoading(false);
            setError(null);
            setConnectionStatus('connected');
            setLastUpdated(new Date());
          } else {
            console.log('⚠️ Business not found, trying fallback collection');
            setError('Negocio no encontrado');
            setConnectionStatus('error');
          }
        },
        (err) => {
          console.error('❌ Error in business listener:', err);
          setError(`Error de conexión: ${err.message}`);
          setConnectionStatus('error');
        }
      );

      // Business orders listener with real-time status tracking
      const ordersQuery = query(
        collection(db, COLLECTIONS.ORDERS),
        where('businessId', '==', businessId),
        orderBy('createdAt', 'desc'),
        limit(100) // Increased limit for better historical data
      );

      unsubscribeOrders = onSnapshot(
        ordersQuery,
        (querySnapshot) => {
          const ordersData: Order[] = [];
          querySnapshot.forEach((doc) => {
            ordersData.push(normalizeOrder(doc.data(), doc.id));
          });
          
          // Sort orders by status priority for better UI experience
          const statusPriority: Record<string, number> = {
            'pending': 1, 'searching': 2, 'assigned': 3, 
            'picked_up': 4, 'in_transit': 5, 'delivered': 6,
            'completed': 7, 'cancelled': 8, 'failed': 9,
            // Also support uppercase for backwards compatibility
            'PENDING': 1, 'SEARCHING': 2, 'ASSIGNED': 3, 
            'PICKED_UP': 4, 'IN_TRANSIT': 5, 'DELIVERED': 6,
            'COMPLETED': 7, 'CANCELLED': 8, 'FAILED': 9
          };
          
          ordersData.sort((a, b) => {
            const aPriority = statusPriority[a.status] || 999;
            const bPriority = statusPriority[b.status] || 999;
            return aPriority - bPriority || 
                   b.createdAt?.toMillis() - a.createdAt?.toMillis();
          });
          
          setOrders(ordersData);
          console.log('✅ Orders updated:', ordersData.length, 'pedidos');
          setLastUpdated(new Date());
        },
        (err) => {
          console.error('❌ Error getting orders:', err);
          setConnectionStatus('error');
        }
      );
    };

    setupListeners();

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up enhanced listeners for businessId:', businessId);
      if (unsubscribeBusiness) unsubscribeBusiness();
      if (unsubscribeOrders) unsubscribeOrders();
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [businessId]);

  // Auto-refresh mechanism for stale data
  useEffect(() => {
    if (!lastUpdated) return;
    
    const autoRefreshInterval = setInterval(() => {
      const now = new Date();
      const timeSinceLastUpdate = now.getTime() - lastUpdated.getTime();
      
      // Refresh if data is older than 2 minutes
      if (timeSinceLastUpdate > 120000 && connectionStatus === 'connected') {
        console.log('🔄 Auto-refreshing stale data');
        refreshData();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(autoRefreshInterval);
  }, [lastUpdated, connectionStatus]);

  return { 
    business, 
    orders, 
    loading, 
    error, 
    refreshData,
    lastUpdated,
    connectionStatus
  };
}

/**
 * Subscribes to a real-time feed of drivers, with support for client-side filtering.
 *
 * NOTE: This hook contains client-side business logic for filtering (e.g., by balance, search term).
 * This can lead to inconsistencies if the filtering rules are not synchronized with the backend.
 *
 * @param {number} [limitCount=100] - The maximum number of drivers to fetch.
 * @param {DriverFilters} [filters={}] - An object containing filters to be applied to the driver list.
 * @returns {{drivers: Driver[], loading: boolean, error: string | null}} The state of the real-time drivers query.
 */
export function useRealtimeDrivers(limitCount: number = 100, filters: DriverFilters = {}) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) {
      setError('Firebase no está inicializado');
      setLoading(false);
      return;
    }

    try {
      const queryConstraints: QueryConstraint[] = [];

      // Status filter
      if (filters.status && filters.status.length > 0) {
        queryConstraints.push(where('status', 'in', filters.status));
      }

      // IMSS Status filter
      if (filters.imssStatus && filters.imssStatus.length > 0) {
        queryConstraints.push(where('imssStatus', 'in', filters.imssStatus));
      }
      
      // Classification filter
      if (filters.classification && filters.classification.length > 0) {
        queryConstraints.push(where('currentClassification', 'in', filters.classification));
      }

      // Vehicle Type filter
      if (filters.vehicleType && filters.vehicleType.length > 0) {
        queryConstraints.push(where('vehicle.type', 'in', filters.vehicleType));
      }

      // Balance filter (needs special handling as it's not a direct where clause)
      // This part of the filtering will remain on the client-side for now,
      // as Firestore doesn't support inequality filters on multiple fields.
      // A more advanced solution might involve Cloud Functions or restructuring data.

      const driversQuery = query(
        collection(db, COLLECTIONS.DRIVERS),
        ...queryConstraints,
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const unsubscribe = onSnapshot(
        driversQuery,
        (querySnapshot) => {
          console.log('🔄 Firestore drivers updated:', querySnapshot.size, 'documents');
          let driversData: Driver[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            console.log('📄 Driver data:', doc.id, data);
            driversData.push({ id: doc.id, ...data } as Driver);
          });
          
          // Apply client-side filters that couldn't be done in Firestore
          if (filters.balance && filters.balance !== 'all') {
            driversData = driversData.filter(driver => {
              const balance = driver.walletBalance || 0;
              switch (filters.balance) {
                case 'positive':
                  return balance > 0;
                case 'negative':
                  return balance < 0;
                case 'debt':
                  return balance < -100; // Assuming debt is balance < -100 as in the component
                default:
                  return true;
              }
            });
          }

          if (filters.searchTerm) {
            const term = filters.searchTerm.toLowerCase();
            driversData = driversData.filter(driver =>
              driver.fullName?.toLowerCase().includes(term) ||
              driver.email?.toLowerCase().includes(term) ||
              driver.phone?.includes(term) ||
              driver.rfc?.toLowerCase().includes(term) ||
              driver.nss?.includes(term)
            );
          }

          setDrivers(driversData);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Error getting drivers:', err);
          setError(`Error cargando conductores: ${err.message}`);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err: any) {
      setError(`Error configurando listener: ${err.message}`);
      setLoading(false);
    }
  }, [limitCount, filters]);

  return { drivers, loading, error };
}

/**
 * Subscribes to all data related to a single driver, including their profile, wallet transactions, and orders.
 * NOW WITH REAL-TIME METRICS CALCULATION
 *
 * @param {string | null} driverId - The ID of the driver to subscribe to.
 * @returns {{driver: Driver | null, transactions: WalletTransaction[], orders: Order[], loading: boolean, error: string | null}} The comprehensive state for a driver view.
 */
export function useDriverData(driverId: string | null) {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!driverId) {
      setDriver(null);
      setTransactions([]);
      setOrders([]);
      setLoading(false);
      return;
    }

    console.log('🔥 useDriverData: Setting up listener for driverId:', driverId);
    setLoading(true);
    setError(null);

    const dataLoadedFlags = { driver: false, transactions: false, orders: false };
    
    const checkAllLoaded = () => {
      if (dataLoadedFlags.driver && dataLoadedFlags.transactions && dataLoadedFlags.orders) {
        console.log('✅ All driver data loaded successfully');
        setLoading(false);
      }
    };

    const driverRef = doc(db, COLLECTIONS.DRIVERS, driverId);
    const unsubDriver = onSnapshot(driverRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Driver | undefined;
        if (data) {
          const { id: _ignored, ...rest } = data as any;
          setDriver({ id: snap.id, ...rest });
          console.log('✅ Driver data loaded:', snap.id);
        }
      } else {
        console.log('⚠️ Driver document not found for ID:', driverId);
        setError('Perfil de conductor no encontrado');
      }
      dataLoadedFlags.driver = true;
      checkAllLoaded();
    }, (err) => {
      console.error('❌ Error loading driver:', err);
      setError(`Error cargando conductor: ${err.message}`);
      dataLoadedFlags.driver = true;
      checkAllLoaded();
    });

    const txRef = query(
      collection(db, COLLECTIONS.WALLET_TRANSACTIONS),
      where('driverId', '==', driverId),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    const unsubTx = onSnapshot(txRef, (snap) => {
      const list = snap.docs.map(d => {
        const data = d.data() as any;
        const { id: _ignored, ...rest } = data;
        return { id: d.id, ...rest } as WalletTransaction;
      });
      setTransactions(list);
      console.log('✅ Transactions loaded:', list.length);
      dataLoadedFlags.transactions = true;
      checkAllLoaded();
    }, (err) => {
      console.error('❌ Error loading transactions:', err);
      setError(`Error cargando transacciones: ${err.message}`);
      dataLoadedFlags.transactions = true;
      checkAllLoaded();
    });

    const ordersRef = query(
      collection(db, COLLECTIONS.ORDERS),
      where('driverId', '==', driverId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const unsubOrders = onSnapshot(ordersRef, (snap) => {
      const list = snap.docs.map(d => {
        const data = d.data() as any;
        const { id: _ignored, ...rest } = data;
        return normalizeOrder(rest, d.id);
      });
      setOrders(list);
      console.log('✅ Orders loaded:', list.length);
      dataLoadedFlags.orders = true;
      checkAllLoaded();
    }, (err) => {
      console.error('❌ Error loading orders:', err);
      // Orders error is not critical, continue
      dataLoadedFlags.orders = true;
      checkAllLoaded();
    });

    return () => {
      console.log('🧹 Cleaning up driver data listeners');
      unsubDriver();
      unsubTx();
      unsubOrders();
    };
  }, [driverId]);

  // 🔥 NEW: Calculate real-time metrics from transactions and orders
  // This ensures walletBalance, pendingDebts, and KPIs are always up-to-date
  useEffect(() => {
    if (!driver) return;

    console.log('💰 Calculating real-time metrics for driver:', driver.id);

    // Calculate walletBalance from transactions
    let calculatedBalance = 0;
    transactions.forEach(tx => {
      calculatedBalance += (tx.amount || 0);
    });

    // Calculate pendingDebts from cash orders
    let calculatedDebts = 0;
    orders.forEach(order => {
      if (order.paymentMethod === 'CASH' && 
          (order.status === 'COMPLETED' || order.status === 'ALREADY_DELIVERED' || order.status === 'DELIVERED')) {
        // For cash orders, driver owes 15 pesos per order (BeFast commission)
        calculatedDebts += 15;
      }
    });

    // Calculate KPIs from orders
    const completedOrders = orders.filter(o => {
      return o.status === 'COMPLETED' || o.status === 'ALREADY_DELIVERED' || o.status === 'DELIVERED';
    });
    const totalOrders = completedOrders.length;
    
    let totalEarnings = 0;
    let totalRatings = 0;
    let ratingSum = 0;
    let onTimeDeliveries = 0;
    
    completedOrders.forEach(order => {
      // Calculate earnings
      totalEarnings += (order.driverEarnings || order.deliveryFee || 0);
      
      // Calculate ratings
      if (order.rating && typeof order.rating === 'number') {
        ratingSum += order.rating;
        totalRatings++;
      }
      
      // Check on-time delivery
      if (order.deliveredAt && order.estimatedDeliveryTime) {
        const deliveredTime = order.deliveredAt?.toMillis ? order.deliveredAt.toMillis() : 0;
        const estimatedTime = order.estimatedDeliveryTime;
        const allowedDelay = 10 * 60 * 1000; // 10 minutes grace period
        
        if (deliveredTime <= estimatedTime + allowedDelay) {
          onTimeDeliveries++;
        }
      }
    });

    const averageRating = totalRatings > 0 ? ratingSum / totalRatings : 5.0;

    // Update driver with calculated metrics
    setDriver(prev => {
      if (!prev) return null;
      
      const updatedDriver: Driver = {
        ...prev,
        walletBalance: calculatedBalance,
        pendingDebts: calculatedDebts,
        totalEarnings,
        kpis: {
          totalOrders,
          acceptanceRate: prev.kpis?.acceptanceRate || 0,
          onTimeDeliveryRate: totalOrders > 0 ? (onTimeDeliveries / totalOrders) * 100 : 0,
          averageRating,
          totalDistance: prev.kpis?.totalDistance || 0,
          averageDeliveryTime: prev.kpis?.averageDeliveryTime || 0,
          completedDeliveries: totalOrders,
          lateDeliveries: totalOrders - onTimeDeliveries,
          failedDeliveries: prev.kpis?.failedDeliveries || 0,
          completionRate: prev.kpis?.completionRate || 0,
          cancellations: prev.kpis?.cancellations || 0,
        }
      };
      return updatedDriver;
    });

    console.log('✅ Metrics updated:', {
      walletBalance: calculatedBalance,
      pendingDebts: calculatedDebts,
      totalOrders,
      totalEarnings,
      averageRating
    });
  }, [driver?.id, transactions, orders]);

  return { driver, transactions, orders, loading, error };
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  userType: 'DRIVER' | 'BUSINESS' | 'ADMIN';
  userEmail?: string;
  subject: string;
  description: string;
  category: 'TECHNICAL' | 'FINANCIAL' | 'DOCUMENT' | 'GENERAL';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  assignedTo?: string;
  assignedAt?: Timestamp | any;
  resolution?: string;
  resolvedAt?: any;
  createdAt: Timestamp | any;
  updatedAt: Timestamp | any;
}

export interface CreditTransaction {
  id: string;
  businessId: string;
  type: 'PURCHASE' | 'USAGE';
  credits: number;
  status?: 'APPROVED' | 'PENDING' | 'REJECTED';
  description?: string;
  createdAt: Timestamp | any;
}

/**
 * Subscribes to a real-time feed of the most recent support tickets.
 *
 * @param {number} [limitCount=100] - The maximum number of tickets to fetch.
 * @returns {{tickets: SupportTicket[], loading: boolean, error: string | null}} The state of the real-time support tickets query.
 */
export function useRealtimeSupportTickets(limitCount: number = 100) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) {
      setError('Firebase no está inicializado');
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, COLLECTIONS.SUPPORT_TICKETS),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => {
        const data = d.data() as any;
        const { id: _ignored, ...rest } = data;
        return { id: d.id, ...rest } as SupportTicket;
      });
      setTickets(list);
      setLoading(false);
      setError(null);
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    return () => unsub();
  }, [limitCount]);

  return { tickets, loading, error };
}

/**
 * Subscribes to a real-time feed of credit transactions, optionally filtered by business.
 *
 * @param {string} [businessId] - If provided, fetches transactions only for this business.
 * @param {number} [limitCount=100] - The maximum number of transactions to fetch.
 * @returns {{transactions: CreditTransaction[], loading: boolean, error: string | null}} The state of the real-time credit transactions query.
 */
export function useRealtimeCreditTransactions(businessId?: string, limitCount: number = 100) {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) {
      setError('Firebase no está inicializado');
      setLoading(false);
      return;
    }

    const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc'), limit(limitCount)];
    if (businessId) {
      constraints.unshift(where('businessId', '==', businessId));
    }

    const q = query(collection(db, COLLECTIONS.CREDIT_TRANSACTIONS), ...constraints);

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => {
        const data = d.data() as any;
        const { id: _ignored, ...rest } = data;
        return { id: d.id, ...rest } as CreditTransaction;
      });
      setTransactions(list);
      setLoading(false);
      setError(null);
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    return () => unsub();
  }, [businessId, limitCount]);

  return { transactions, loading, error };
}