import { db } from '@/lib/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, query, where, orderBy, limit, startAfter, Timestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { getFunctions } from 'firebase/functions';
// Assuming these helpers exist and work correctly
// import { normalizeOrderStatus, isOrderActive, getOrderProgress } from '@/utils/orderStatusHelpers';

// 🎯 IMPORTAR DESDE EL MODELO CANÓNICO - ÚNICA FUENTE DE VERDAD
// Assuming OrderStatus is defined as the Shipday orderState values + maybe 'CANCELLED'
import {
  Order,
  OrderStatus, // Type should be the union of canonical statuses below
  OrderItem,
  CustomerInfo, // Assuming this contains name, phone, address obj, email?
  Address,      // Assuming this contains street, city, etc., coordinates
  PaymentMethod,// Should be 'CASH' | 'CARD' | 'UNKNOWN' etc. based on canonical
  // Let's define the canonical statuses strictly based on Shipday + CANCELLED
  // Ensure your OrderStatus type in '@/lib/types/Order' matches this
  // CANONICAL_ORDER_STATUSES // This might be defined in types file, ensure it matches below
} from '@/lib/types/Order';

// Re-exportar para backward compatibility con código existente (si es necesario)
export type { Order, OrderStatus, OrderItem, CustomerInfo, Address, PaymentMethod };

// Define the canonical statuses based on Shipday `orderState` oficial
// Ensure OrderStatus type in '@/lib/types/Order' matches exactly Shipday API
const CANONICAL_STATUSES: ReadonlySet<OrderStatus> = new Set([
  'ACTIVE', 'NOT_ASSIGNED', 'NOT_ACCEPTED', 'NOT_STARTED_YET',
  'STARTED', 'PICKED_UP', 'READY_TO_DELIVER', 'ALREADY_DELIVERED',
  'FAILED_DELIVERY', 'INCOMPLETE'
]);

// Mantener interfaces adicionales que no están en el modelo canónico
export interface OrderFilters {
  status?: OrderStatus | OrderStatus[];
  businessId?: string;
  driverId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  paymentMethod?: PaymentMethod | PaymentMethod[];
  source?: string; // e.g., 'DELIVERY', 'MARKET'
}

export interface OrderStats {
  total: number;
  pending: number; // Waiting assignment/acceptance/start
  inProgress: number; // Started, picked up, en route
  completed: number; // Successfully delivered
  cancelled: number; // Failed, incomplete, cancelled
  totalRevenue: number;
  averageOrderValue: number;
  averageDeliveryTimeMinutes: number; // Renamed for clarity
}

// Map various inputs (Shipday states, legacy values) to our canonical OrderStatus
// Prioritizes official Shipday orderState values
const STATUS_ALIAS_MAP: Record<string, OrderStatus> = {
  // Direct Shipday orderState mappings
  ACTIVE: 'ACTIVE',
  NOT_ASSIGNED: 'NOT_ASSIGNED',
  NOT_ACCEPTED: 'NOT_ACCEPTED',
  NOT_STARTED_YET: 'NOT_STARTED_YET',
  STARTED: 'STARTED',
  PICKED_UP: 'PICKED_UP',
  READY_TO_DELIVER: 'READY_TO_DELIVER',
  ALREADY_DELIVERED: 'ALREADY_DELIVERED',
  FAILED_DELIVERY: 'FAILED_DELIVERY',
  INCOMPLETE: 'INCOMPLETE',

  // Common aliases / Internal / Legacy States
  PENDING: 'NOT_ASSIGNED', // Map generic PENDING to more specific initial state
  ASSIGNED: 'STARTED',     // Map ASSIGNED to STARTED as per Shipday flow
  ACCEPTED: 'STARTED',     // Map ACCEPTED to STARTED
  IN_PROGRESS: 'STARTED',  // Map generic IN_PROGRESS to STARTED initially
  AT_PICKUP: 'STARTED',    // Often part of STARTED phase
  READY_FOR_PICKUP: 'NOT_STARTED_YET', // Before pickup starts
  IN_TRANSIT: 'READY_TO_DELIVER', // Map IN_TRANSIT to READY_TO_DELIVER
  DELIVERED: 'ALREADY_DELIVERED', // Map DELIVERED alias
  COMPLETED: 'ALREADY_DELIVERED', // Map COMPLETED alias
  CANCELLED: 'CANCELLED',
  CANCELED: 'CANCELLED', // Typo alias
  FAILED: 'FAILED_DELIVERY', // Map generic FAILED

  // Legacy lowercase - map to uppercase canonical
  pending: 'NOT_ASSIGNED',
  confirmed: 'NOT_STARTED_YET',
  preparing: 'NOT_STARTED_YET',
  ready_for_pickup: 'NOT_STARTED_YET',
  ready_to_deliver: 'READY_TO_DELIVER',
  ready_to_pickup: 'NOT_STARTED_YET',
  assigned: 'STARTED',
  accepted: 'STARTED',
  started: 'STARTED',
  picked_up: 'PICKED_UP',
  in_transit: 'READY_TO_DELIVER',
  delivered: 'ALREADY_DELIVERED',
  completed: 'ALREADY_DELIVERED',
  cancelled: 'CANCELLED',
  failed: 'FAILED_DELIVERY'
};

// Define which timestamp fields should potentially be set when reaching a status
// Based on typical order flow and Shipday webhook data
type TimelineFieldKey = keyof Pick<Order, 'assignedAt' | 'startedAt' | 'pickedUpAt' | 'arrivedAt' | 'completedAt' | 'cancelledAt'>; // Match canonical Order model fields
const TIMELINE_FIELD_MAP: Partial<Record<OrderStatus, TimelineFieldKey[]>> = {
  STARTED: ['assignedAt', 'startedAt'], // Covers ASSIGNED, ACCEPTED, STARTED
  PICKED_UP: ['pickedUpAt'],
  READY_TO_DELIVER: [], // Usually occurs between PICKED_UP and completion
  ALREADY_DELIVERED: ['arrivedAt', 'completedAt'], // Covers DELIVERED, COMPLETED
  FAILED_DELIVERY: ['cancelledAt'], // Use cancelledAt for failures too
  INCOMPLETE: ['cancelledAt'],
  CANCELLED: ['cancelledAt'],
  // ACTIVE, NOT_ASSIGNED, NOT_ACCEPTED, NOT_STARTED_YET don't typically set specific milestones beyond createdAt
};


/**
 * Normalizes a status string to a canonical OrderStatus value.
 * @param status Input status string (potentially from Shipday or legacy).
 * @returns A canonical OrderStatus, defaulting to 'NOT_ASSIGNED'.
 */
const normalizeOrderStatusValue = (status?: string | null): OrderStatus => {
  if (!status) {
    return 'NOT_ASSIGNED'; // Default for new or unknown orders
  }
  const upper = status.trim().toUpperCase().replace(/\s+/g, '_');
  // Use map, default if not found in map BUT is in the canonical set, else default to NOT_ASSIGNED
  const mapped = STATUS_ALIAS_MAP[upper];
  if (mapped) return mapped;
  if (CANONICAL_STATUSES.has(upper as OrderStatus)) return upper as OrderStatus; // If it's already canonical
  return 'NOT_ASSIGNED'; // Final fallback
};

/**
 * Builds an object with timestamp updates based on the new status,
 * only setting timestamps that haven't been set before.
 * @param status The new canonical OrderStatus.
 * @param existing Optional existing order data to check current timestamps.
 * @returns An object containing fields like { assignedAt: Date, lastStatusChangeAt: Date }.
 */
const buildTimelineUpdates = (
  status: OrderStatus,
  existing?: Partial<Order>
): Partial<Record<TimelineFieldKey | 'lastStatusChangeAt', Date>> => {
  const now = new Date();
  const fieldsToPotentiallySet = TIMELINE_FIELD_MAP[status] ?? [];
  const updates: Partial<Record<TimelineFieldKey | 'lastStatusChangeAt', Date>> = {
    lastStatusChangeAt: now // Always update last change time
  };

  for (const field of fieldsToPotentiallySet) {
    // Only set the timestamp if it doesn't already exist on the order
    if (!existing?.[field]) {
      updates[field] = now;
    }
  }

  // Ensure completedAt is set robustly for all completion statuses
  if (status === 'ALREADY_DELIVERED' && !existing?.completedAt) {
      updates.completedAt = now;
  }
  // Ensure cancelledAt is set robustly for all failure/cancel statuses
   if ((status === 'FAILED_DELIVERY' || status === 'INCOMPLETE' || status === 'CANCELLED') && !existing?.cancelledAt) {
      updates.cancelledAt = now;
   }

  return updates;
};

/** Utility to remove undefined values from an object */
const cleanUndefined = <T extends Record<string, unknown>>(obj: T): T => {
  Object.keys(obj).forEach(key => obj[key] === undefined && delete obj[key]);
  return obj;
};

/** Utility to safely convert various date types to JS Date */
const toDate = (value: unknown): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate(); // Firebase Timestamp specific
  if (typeof (value as any)?.toDate === 'function') return (value as any).toDate(); // General check for objects with toDate method
  // Try parsing as string/number last
  const parsed = new Date(value as any);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

// --- OrderService Class ---

export class OrderService {
  private functions = getFunctions();
  private ordersCollection = 'orders'; // Use constant if defined elsewhere (e.g., COLLECTIONS.ORDERS)

  /** Creates an order in Firestore and triggers sync to Shipday. */
  async createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: string }): Promise<string> {
    try {
      const initialStatus = normalizeOrderStatusValue(orderData.status || 'NOT_ASSIGNED');
      // Ensure required fields for canonical Order are present or defaulted
      const order: Omit<Order, 'id'> = {
        // Ensure ALL required fields from Order type are listed here or have defaults
        orderNumber: orderData.orderNumber || 'N/A', // Caller MUST provide this ideally via generateOrderNumber
        businessId: orderData.businessId,
        source: orderData.source || 'UNKNOWN', // Caller should specify 'DELIVERY' or 'MARKET'
        orderType: orderData.orderType || 'UNKNOWN',
        customer: orderData.customer || { name: 'N/A', phone: 'N/A', address: { street: 'N/A', coordinates: { lat: 0, lng: 0 } } },
        pickup: orderData.pickup || { name: 'N/A', address: 'N/A', coordinates: { lat: 0, lng: 0 } },
        items: orderData.items || [],
        paymentMethod: orderData.paymentMethod || 'UNKNOWN',
        status: initialStatus, // Use normalized status
        totalOrderValue: orderData.totalOrderValue || 0,
        deliveryFee: orderData.deliveryFee || 0,
        tip: orderData.tip || 0,
        tax: orderData.tax || 0,
        discount: orderData.discount || 0,
        amountToCollect: orderData.amountToCollect || 0, // Ensure this required field is present
        // Add any other REQUIRED fields from your Order type with defaults if necessary
        // ...
        // Optional fields are spread later if needed, but required ones must be defined
        ...orderData, // Spread the original data AFTER defaults, allowing overrides
        // Timestamps
        createdAt: Timestamp.now(), // Use Firestore Timestamp
        updatedAt: Timestamp.now(), // Use Firestore Timestamp
        lastStatusChangeAt: Timestamp.now(),
        // Ensure other optional timestamps are undefined/null initially
        assignedAt: undefined,
        startedAt: undefined,
        pickedUpAt: undefined,
        arrivedAt: undefined,
        completedAt: undefined,
        cancelledAt: undefined,
      };

      // Remove the potentially non-canonical status if it existed in original orderData
      const cleanedOrderDataForFirestore = { ...order };
      // delete (cleanedOrderDataForFirestore as any).status; // status is already set correctly above


      const docRef = await addDoc(collection(db, this.ordersCollection), cleanedOrderDataForFirestore);

      // Trigger order creation in Shipday via Cloud Function
      await this.syncOrderToShipday(docRef.id, order); // Pass the constructed 'order' object

      return docRef.id;
    } catch (error: any) {
      console.error('Error creating order:', error);
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }

  /** Retrieves a single order by its ID. */
  async getOrder(orderId: string): Promise<Order | null> {
    try {
      const docRef = doc(db, this.ordersCollection, orderId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        // --- CORRECTION APPLIED ---
        // Explicitly construct the Order object to satisfy TypeScript
        // Provide defaults ONLY for fields that *might* genuinely be missing in Firestore
        // Best practice: Ensure your Order type uses optional fields (?) where applicable
        const order: Order = {
          id: docSnap.id,
          // Required fields (Assume they exist in Firestore or add sensible defaults)
          orderNumber: data.orderNumber || `MISSING_${docSnap.id}`, // Fallback if missing
          businessId: data.businessId || 'UNKNOWN_BUSINESS',
          source: data.source || 'UNKNOWN',
          orderType: data.orderType || 'UNKNOWN',
          customer: data.customer || { name: 'N/A', phone: 'N/A', address: { street: 'N/A', coordinates: { lat: 0, lng: 0 } } },
          pickup: data.pickup || { name: 'N/A', address: 'N/A', coordinates: { lat: 0, lng: 0 } },
          items: data.items || [],
          paymentMethod: data.paymentMethod || 'UNKNOWN',
          status: normalizeOrderStatusValue(data.status), // Normalize status read from DB
          totalOrderValue: data.totalOrderValue || 0,
          deliveryFee: data.deliveryFee || 0,
          tip: data.tip || 0,
          tax: data.tax || 0,
          discount: data.discount || 0,
          totalAmount: data.totalAmount || data.totalOrderValue || 0, // Add missing totalAmount field
          amountToCollect: data.amountToCollect ?? 0, // Use nullish coalescing for 0
          // Add ALL other required fields from your Order type here

          // Spread the rest of the data (optional fields) AFTER required ones
          ...data,

          // Timestamps (Convert using toDate)
          createdAt: toDate(data.createdAt),
          updatedAt: toDate(data.updatedAt),
          assignedAt: toDate(data.assignedAt),
          startedAt: toDate(data.startedAt),
          pickedUpAt: toDate(data.pickedUpAt),
          arrivedAt: toDate(data.arrivedAt),
          completedAt: toDate(data.completedAt),
          cancelledAt: toDate(data.cancelledAt),
          lastStatusChangeAt: toDate(data.lastStatusChangeAt),
          // Convert any other timestamp fields defined in your Order type
        };
        // Remove the unsafe type assertion 'as Order'
        return order;

      }
      return null;
    } catch (error: any) {
      console.error(`Error getting order ${orderId}:`, error);
      return null;
    }
  }


  /** Updates an order in Firestore and triggers sync if status/driver changes. */
  async updateOrder(orderId: string, updates: Partial<Omit<Order, 'id' | 'createdAt'>>): Promise<boolean> {
    try {
      const docRef = doc(db, this.ordersCollection, orderId);
      const snapshot = await getDoc(docRef);
      // Ensure existingOrder conforms to Partial<Order> for timeline check
      const existingOrder = snapshot.exists() ? (snapshot.data() as Partial<Order>) : undefined;

      const normalizedStatus = updates.status
        ? normalizeOrderStatusValue(updates.status as string) // Normalize incoming status
        : existingOrder?.status; // Keep existing if no new status provided

      // Check if status is valid before proceeding
      if (!normalizedStatus || !CANONICAL_STATUSES.has(normalizedStatus)) {
         console.warn(`Cannot update order ${orderId} without a valid canonical status. Provided: ${updates.status}, Normalized: ${normalizedStatus}`);
         return false; // Prevent update with invalid status
      }

      const timelineUpdates = buildTimelineUpdates(normalizedStatus, existingOrder);

      // Prepare payload, ensuring consistency with Firestore types (Timestamp)
      const payload = cleanUndefined({
        ...updates,
        status: normalizedStatus, // Always store the canonical status
        updatedAt: Timestamp.now(), // Use Firestore Timestamp
        ...timelineUpdates, // These are JS Dates, Firestore converts them
      });

      await updateDoc(docRef, payload);

      // Trigger sync ONLY if status or driverId actually changed
      const statusChanged = updates.status && normalizedStatus !== existingOrder?.status;
      const driverChanged = 'driverId' in updates && updates.driverId !== existingOrder?.driverId; // Check explicitly if driverId is part of updates

      if (statusChanged || driverChanged) {
        // Pass only relevant updates needed by Shipday
        const syncUpdates: Record<string, any> = {}; // Use Record for flexibility
        if (statusChanged) syncUpdates.status = normalizedStatus;
        if (driverChanged) syncUpdates.driverId = updates.driverId; // Function needs to map this
        // Add other fields Shipday might need for updates
        if ('proofOfDelivery' in updates) syncUpdates.proofOfDelivery = updates.proofOfDelivery;
        if ('podUrls' in updates) syncUpdates.podUrls = updates.podUrls;

        if (Object.keys(syncUpdates).length > 0) {
            await this.syncOrderUpdateToShipday(orderId, syncUpdates);
        }
      }

      return true;
    } catch (error: any) {
      console.error(`Error updating order ${orderId}:`, error);
      return false;
    }
  }

  /** Deletes an order from Firestore. */
  async deleteOrder(orderId: string): Promise<boolean> {
    try {
      const docRef = doc(db, this.ordersCollection, orderId);
      await deleteDoc(docRef);
      // Consider calling a Cloud Function to delete from Shipday if necessary
      // await this.deleteOrderFromShipday(orderId);
      return true;
    } catch (error: any) {
      console.error(`Error deleting order ${orderId}:`, error);
      return false;
    }
  }

  /** Retrieves a list of orders based on filters, with pagination. */
  async getOrders(filters?: OrderFilters, limitCount: number = 50, lastDoc?: any): Promise<{orders: Order[], lastVisibleDoc: any | null}> {
    try {
      let q = query(collection(db, this.ordersCollection));

      // Apply filters
      if (filters?.status) {
        const statusArray = Array.isArray(filters.status) ? filters.status : [filters.status];
        if (statusArray.length > 0 && statusArray.length <= 10) { // Firestore 'in' query limit is 10
          const normalizedStatuses = Array.from(
            new Set(statusArray.map(status => normalizeOrderStatusValue(status))) // Use normalized
          );
          q = query(q, where('status', 'in', normalizedStatuses));
        } else if (statusArray.length > 10) {
            console.warn("Firestore 'in' query limited to 10 statuses. Fetching all and filtering client-side or rethink query.");
            // Fetch without status filter here and filter later
        }
      }

      if (filters?.businessId) { q = query(q, where('businessId', '==', filters.businessId)); }
      if (filters?.driverId) { q = query(q, where('driverId', '==', filters.driverId)); }
      // Ensure createdAt index exists for range queries
      if (filters?.dateFrom) { q = query(q, where('createdAt', '>=', Timestamp.fromDate(filters.dateFrom))); }
      if (filters?.dateTo) { q = query(q, where('createdAt', '<=', Timestamp.fromDate(filters.dateTo))); }
      if (filters?.paymentMethod) {
        const paymentArray = Array.isArray(filters.paymentMethod) ? filters.paymentMethod : [filters.paymentMethod];
        if (paymentArray.length > 0 && paymentArray.length <= 10) { // Limit applies here too
          q = query(q, where('paymentMethod', 'in', paymentArray));
        }
      }
      if (filters?.source) { q = query(q, where('source', '==', filters.source)); }


      // Order by creation date (newest first) - Requires index on createdAt
      q = query(q, orderBy('createdAt', 'desc'));

      // Apply pagination
      if (lastDoc) { q = query(q, startAfter(lastDoc)); }
      q = query(q, limit(limitCount));

      const querySnapshot = await getDocs(q);
      const orders = querySnapshot.docs.map(doc => {
          const data = doc.data();
          // Construct the Order object explicitly like in getOrder
          const order: Order = {
              id: doc.id,
              orderNumber: data.orderNumber || `MISSING_${doc.id}`,
              businessId: data.businessId || 'UNKNOWN_BUSINESS',
              source: data.source || 'UNKNOWN',
              orderType: data.orderType || 'UNKNOWN',
              customer: data.customer || { name: 'N/A', phone: 'N/A', address: { street: 'N/A', coordinates: { lat: 0, lng: 0 } } },
              pickup: data.pickup || { name: 'N/A', address: 'N/A', coordinates: { lat: 0, lng: 0 } },
              items: data.items || [],
              paymentMethod: data.paymentMethod || 'UNKNOWN',
              status: normalizeOrderStatusValue(data.status),
              totalOrderValue: data.totalOrderValue || 0,
              deliveryFee: data.deliveryFee || 0,
              tip: data.tip || 0,
              tax: data.tax || 0,
              discount: data.discount || 0,
              totalAmount: data.totalAmount || data.totalOrderValue || 0, // Add missing totalAmount field
              amountToCollect: data.amountToCollect ?? 0,
              // Add ALL other required fields from Order type
              ...data, // Spread remaining optional fields
              // Convert Timestamps
              createdAt: toDate(data.createdAt),
              updatedAt: toDate(data.updatedAt),
              assignedAt: toDate(data.assignedAt),
              startedAt: toDate(data.startedAt),
              pickedUpAt: toDate(data.pickedUpAt),
              arrivedAt: toDate(data.arrivedAt),
              completedAt: toDate(data.completedAt),
              cancelledAt: toDate(data.cancelledAt),
              lastStatusChangeAt: toDate(data.lastStatusChangeAt),
          };
          return order;
      });
      const lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1] || null;

      return { orders, lastVisibleDoc };
    } catch (error: any) {
      console.error('Error getting orders:', error);
      return { orders: [], lastVisibleDoc: null };
    }
  }

  // Convenience methods using getOrders
  async getOrdersByBusiness(businessId: string, limitCount: number = 50, lastDoc?: any): Promise<{orders: Order[], lastVisibleDoc: any | null}> {
    return this.getOrders({ businessId }, limitCount, lastDoc);
  }

  async getOrdersByDriver(driverId: string, limitCount: number = 50, lastDoc?: any): Promise<{orders: Order[], lastVisibleDoc: any | null}> {
    return this.getOrders({ driverId }, limitCount, lastDoc);
  }

  // Get orders considered "active" (not completed or cancelled/failed)
  async getActiveOrders(filters?: Omit<OrderFilters, 'status'>, limitCount: number = 100): Promise<Order[]> {
    // Correct list of active statuses based on Shipday flow
    const activeStatuses: OrderStatus[] = [
      'ACTIVE', 'NOT_ASSIGNED', 'NOT_ACCEPTED', 'NOT_STARTED_YET', // Pending/Waiting
      'STARTED', 'PICKED_UP', 'READY_TO_DELIVER' // In Progress
    ];
    // Firestore limit for 'in' is 10, this list is shorter, so it's ok.
    const result = await this.getOrders({ ...filters, status: activeStatuses }, limitCount);
    return result.orders;
  }

  /** Assigns a driver to an order and updates status to 'STARTED'. */
  async assignDriver(orderId: string, driverId: string): Promise<boolean> {
      // Assuming driver assignment implies the driver has accepted/started
    try {
      const success = await this.updateOrder(orderId, {
        driverId,
        status: 'STARTED', // Move to STARTED upon assignment as per Shipday flow
      });
      // Notification might be handled by syncOrderUpdateToShipday or separate process
      return success;
    } catch (error: any) {
      console.error(`Error assigning driver ${driverId} to order ${orderId}:`, error);
      return false;
    }
  }

  /** Updates only the status of an order. */
  async updateOrderStatus(orderId: string, status: string | OrderStatus, notes?: string): Promise<boolean> {
    const normalizedStatus = normalizeOrderStatusValue(status); // Ensure canonical
    if (!CANONICAL_STATUSES.has(normalizedStatus)) {
        console.error(`Invalid status provided to updateOrderStatus: ${status}`);
        return false;
    }
    const updates = cleanUndefined<Partial<Order>>({
      status: normalizedStatus,
      notes, // Add notes if provided
    });
    return this.updateOrder(orderId, updates);
  }

  /** Marks an order as CANCELLED. */
  async cancelOrder(orderId: string, reason: string, refundAmount?: number): Promise<boolean> {
    return this.updateOrder(orderId, {
      status: 'CANCELLED',
      cancellationReason: reason,
      refundAmount: refundAmount ?? 0, // Ensure refund amount is set, default to 0
    });
  }

  /** Calculates statistics based on fetched orders. */
  async getOrderStats(filters?: OrderFilters): Promise<OrderStats> {
    try {
      // Fetch a larger sample for stats
      const { orders } = await this.getOrders(filters, 1000); // Increased limit

      const initialStats: OrderStats = {
        total: orders.length, pending: 0, inProgress: 0, completed: 0, cancelled: 0,
        totalRevenue: 0, averageOrderValue: 0, averageDeliveryTimeMinutes: 0,
      };

      // Define status sets based on CANONICAL definitions
      const pendingSet: Set<OrderStatus> = new Set(['ACTIVE', 'NOT_ASSIGNED', 'NOT_ACCEPTED', 'NOT_STARTED_YET']);
      const inProgressSet: Set<OrderStatus> = new Set(['STARTED', 'PICKED_UP', 'READY_TO_DELIVER']);
      const completedSet: Set<OrderStatus> = new Set(['ALREADY_DELIVERED']);
      const cancelledSet: Set<OrderStatus> = new Set(['FAILED_DELIVERY', 'INCOMPLETE', 'CANCELLED']);

      const stats = orders.reduce((acc, order) => {
        // Status is already normalized from getOrders
        const status = order.status;

        if (pendingSet.has(status)) acc.pending++;
        else if (inProgressSet.has(status)) acc.inProgress++;
        else if (completedSet.has(status)) {
            acc.completed++;
            acc.totalRevenue += order.totalAmount ?? 0;
        }
        else if (cancelledSet.has(status)) acc.cancelled++;

        return acc;
      }, initialStats);


      if (stats.completed > 0) {
        stats.averageOrderValue = stats.totalRevenue / stats.completed;

        // Calculate average delivery time
        const completedOrdersWithTimes = orders
         .filter(order => order.status === 'ALREADY_DELIVERED') // Filter directly on normalized status
         .map(order => ({
            end: order.completedAt ?? order.updatedAt, // Use completedAt or fallback
            start: order.createdAt,
         }))
         .filter(times => times.start && times.end && times.end.getTime() > times.start.getTime()); // Filter invalid times


        if (completedOrdersWithTimes.length > 0) {
          const totalDeliveryMillis = completedOrdersWithTimes.reduce((sum, times) => {
            // Added non-null assertion as filter guarantees start and end exist
            return sum + (times.end!.getTime() - times.start!.getTime());
          }, 0);
          stats.averageDeliveryTimeMinutes = Math.round(totalDeliveryMillis / completedOrdersWithTimes.length / (1000 * 60));
        }
      }

      return stats;
    } catch (error: any) {
      console.error('Error getting order stats:', error);
      // Return empty stats on error
      return { total: 0, pending: 0, inProgress: 0, completed: 0, cancelled: 0, totalRevenue: 0, averageOrderValue: 0, averageDeliveryTimeMinutes: 0 };
    }
  }

  // --- Shipday Integration (using Cloud Functions) ---

  /** Calls Cloud Function to sync a new order TO Shipday. */
  private async syncOrderToShipday(orderId: string, order: Omit<Order, 'id'>): Promise<void> {
    try {
      // Define types for callable function data and result for better type safety
      const createShipdayOrder = httpsCallable<{ orderId: string, orderData: Omit<Order, 'id'> }, { success: boolean, shipdayOrderId?: number }>(this.functions, 'createShipdayOrder');
      const result = await createShipdayOrder({ orderId, orderData: order });
      if (!result.data.success) {
          console.warn(`Cloud Function createShipdayOrder reported failure for order ${orderId}. Result:`, result.data);
      } else {
          console.log(`Successfully called createShipdayOrder for ${orderId}. Shipday ID: ${result.data.shipdayOrderId}`);
      }
    } catch (error: any) {
      console.error(`Error calling createShipdayOrder function for order ${orderId}:`, error);
      // Consider marking the order with sync error in Firestore
      // await updateDoc(doc(db, this.ordersCollection, orderId), { shipdaySyncError: error.message });
    }
  }

 /** Calls Cloud Function to sync order updates TO Shipday. */
  private async syncOrderUpdateToShipday(orderId: string, updates: Record<string, any>): Promise<void> {
    if (Object.keys(updates).length === 0) {
        console.log(`No relevant updates to sync to Shipday for order ${orderId}`);
        return;
    }
    console.log(`Syncing updates to Shipday for order ${orderId}:`, updates);
    try {
      const updateShipdayOrder = httpsCallable<{ orderId: string, updates: Record<string, any> }, { success: boolean }>(this.functions, 'updateShipdayOrder');
      const result = await updateShipdayOrder({ orderId, updates });
       if (!result.data.success) {
          console.warn(`Cloud Function updateShipdayOrder reported failure for order ${orderId}. Result:`, result.data);
      } else {
          console.log(`Successfully called updateShipdayOrder for ${orderId}.`);
      }
    } catch (error: any) {
      console.error(`Error calling updateShipdayOrder function for order ${orderId}:`, error);
      // await updateDoc(doc(db, this.ordersCollection, orderId), { shipdaySyncError: error.message });
    }
  }

 /** Calls Cloud Function to notify driver (e.g., via Push Notification, SMS). */
  private async notifyDriverAssignment(driverId: string, orderId: string): Promise<void> {
    // Keep if separate notification logic is needed beyond Shipday's app
    console.log(`Notifying driver ${driverId} for order ${orderId} (implementation via Cloud Function)`);
    try {
      const notifyDriver = httpsCallable<{ driverId: string, orderId: string }, { success: boolean }>(this.functions, 'notifyDriverAssignment');
      const result = await notifyDriver({ driverId, orderId });
       if (!result.data.success) {
          console.warn(`Cloud Function notifyDriverAssignment reported failure for driver ${driverId}, order ${orderId}.`);
       }
    } catch (error: any) {
      console.error(`Error calling notifyDriverAssignment function for driver ${driverId}, order ${orderId}:`, error);
    }
  }


  /** Searches orders based on various text fields. Basic client-side search. */
  async searchOrders(searchTerm: string, filters?: OrderFilters): Promise<Order[]> {
     // For performance on large datasets, consider using a dedicated search service
    try {
      // Fetch potentially relevant orders first
      const { orders } = await this.getOrders({ ...filters, dateFrom: filters?.dateFrom ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, 500); // Search last 30 days

      if (!searchTerm?.trim()) {
        return orders.slice(0, 100); // Return a subset if no search term
      }

      const lowerSearchTerm = searchTerm.toLowerCase();

      // Ensure optional chaining and null checks
      return orders.filter(order =>
        order.customer?.name?.toLowerCase().includes(lowerSearchTerm) ||
        order.customer?.phone?.includes(searchTerm) || // Phone search no lowercase
        order.pickup?.name?.toLowerCase().includes(lowerSearchTerm) ||
        order.orderNumber?.toLowerCase().includes(lowerSearchTerm) ||
        order.shipdayOrderNumber?.toLowerCase().includes(lowerSearchTerm) ||
        order.items?.some(item => item.name?.toLowerCase().includes(lowerSearchTerm)) ||
        order.driverName?.toLowerCase().includes(lowerSearchTerm) // Added driverName search
      ).slice(0, 100); // Limit final results
    } catch (error: any) {
      console.error('Error searching orders:', error);
      return [];
    }
  }
}

// Export a singleton instance
export const orderService = new OrderService();