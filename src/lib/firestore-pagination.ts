/**
 * 🔧 UTILIDADES DE PAGINACIÓN FIRESTORE - BeFast System
 * 
 * Proporciona funciones optimizadas para paginación en colecciones grandes
 * siguiendo las mejores prácticas de Firestore.
 */

import { useState } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs, 
  DocumentSnapshot,
  Query,
  QueryConstraint,
  where,
  WhereFilterOp
} from 'firebase/firestore';
import { db } from './firebase';
import { COLLECTIONS } from './collections';

export interface PaginationOptions {
  pageSize?: number;
  lastDoc?: DocumentSnapshot;
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
  whereConditions?: Array<{
    field: string;
    operator: WhereFilterOp;
    value: any;
  }>;
}

export interface PaginatedResult<T> {
  data: T[];
  lastDoc: DocumentSnapshot | null;
  hasMore: boolean;
  totalCount?: number;
}

/**
 * 📄 Obtener audit logs paginados
 */
export async function getAuditLogsPaginated(
  options: PaginationOptions = {}
): Promise<PaginatedResult<any>> {
  const {
    pageSize = 20,
    lastDoc,
    orderByField = 'timestamp',
    orderDirection = 'desc',
    whereConditions = []
  } = options;

  let q: Query = query(collection(db, COLLECTIONS.AUDIT_LOGS));

  // Aplicar condiciones WHERE
  whereConditions.forEach(condition => {
    q = query(q, where(condition.field, condition.operator, condition.value));
  });

  // Aplicar ordenamiento
  q = query(q, orderBy(orderByField, orderDirection));

  // Aplicar paginación
  q = query(q, limit(pageSize + 1)); // +1 para detectar si hay más páginas

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);
  const docs = snapshot.docs;
  
  const hasMore = docs.length > pageSize;
  const data = hasMore ? docs.slice(0, pageSize) : docs;
  const newLastDoc = data.length > 0 ? data[data.length - 1] : null;

  return {
    data: data.map(doc => ({ id: doc.id, ...doc.data() })),
    lastDoc: newLastDoc,
    hasMore
  };
}

/**
 * 📦 Obtener órdenes paginadas por negocio
 */
export async function getOrdersByBusinessPaginated(
  businessId: string,
  options: PaginationOptions = {}
): Promise<PaginatedResult<any>> {
  const {
    pageSize = 20,
    lastDoc,
    orderByField = 'createdAt',
    orderDirection = 'desc'
  } = options;

  let q: Query = query(
    collection(db, 'orders'),
    where('businessId', '==', businessId),
    orderBy(orderByField, orderDirection),
    limit(pageSize + 1)
  );

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);
  const docs = snapshot.docs;
  
  const hasMore = docs.length > pageSize;
  const data = hasMore ? docs.slice(0, pageSize) : docs;
  const newLastDoc = data.length > 0 ? data[data.length - 1] : null;

  return {
    data: data.map(doc => ({ id: doc.id, ...doc.data() })),
    lastDoc: newLastDoc,
    hasMore
  };
}

/**
 * 📦 Obtener órdenes paginadas por repartidor
 */
export async function getOrdersByDriverPaginated(
  driverId: string,
  options: PaginationOptions = {}
): Promise<PaginatedResult<any>> {
  const {
    pageSize = 20,
    lastDoc,
    orderByField = 'createdAt',
    orderDirection = 'desc'
  } = options;

  let q: Query = query(
    collection(db, 'orders'),
    where('driverId', '==', driverId),
    orderBy(orderByField, orderDirection),
    limit(pageSize + 1)
  );

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);
  const docs = snapshot.docs;
  
  const hasMore = docs.length > pageSize;
  const data = hasMore ? docs.slice(0, pageSize) : docs;
  const newLastDoc = data.length > 0 ? data[data.length - 1] : null;

  return {
    data: data.map(doc => ({ id: doc.id, ...doc.data() })),
    lastDoc: newLastDoc,
    hasMore
  };
}

/**
 * 💰 Obtener transacciones de wallet paginadas
 */
export async function getWalletTransactionsPaginated(
  driverId: string,
  options: PaginationOptions = {}
): Promise<PaginatedResult<any>> {
  const {
    pageSize = 20,
    lastDoc,
    orderByField = 'createdAt',
    orderDirection = 'desc'
  } = options;

  let q: Query = query(
    collection(db, COLLECTIONS.WALLET_TRANSACTIONS),
    where('driverId', '==', driverId),
    orderBy(orderByField, orderDirection),
    limit(pageSize + 1)
  );

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);
  const docs = snapshot.docs;
  
  const hasMore = docs.length > pageSize;
  const data = hasMore ? docs.slice(0, pageSize) : docs;
  const newLastDoc = data.length > 0 ? data[data.length - 1] : null;

  return {
    data: data.map(doc => ({ id: doc.id, ...doc.data() })),
    lastDoc: newLastDoc,
    hasMore
  };
}

/**
 * 🔔 Obtener notificaciones paginadas
 */
export async function getNotificationsPaginated(
  userId: string,
  options: PaginationOptions = {}
): Promise<PaginatedResult<any>> {
  const {
    pageSize = 20,
    lastDoc,
    orderByField = 'createdAt',
    orderDirection = 'desc'
  } = options;

  let q: Query = query(
    collection(db, COLLECTIONS.NOTIFICATIONS),
    where('userId', '==', userId),
    orderBy(orderByField, orderDirection),
    limit(pageSize + 1)
  );

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);
  const docs = snapshot.docs;
  
  const hasMore = docs.length > pageSize;
  const data = hasMore ? docs.slice(0, pageSize) : docs;
  const newLastDoc = data.length > 0 ? data[data.length - 1] : null;

  return {
    data: data.map(doc => ({ id: doc.id, ...doc.data() })),
    lastDoc: newLastDoc,
    hasMore
  };
}

/**
 * 📊 Obtener métricas del sistema paginadas
 */
export async function getSystemMetricsPaginated(
  options: PaginationOptions = {}
): Promise<PaginatedResult<any>> {
  const {
    pageSize = 20,
    lastDoc,
    orderByField = 'date',
    orderDirection = 'desc'
  } = options;

  let q: Query = query(
    collection(db, 'systemMetrics'),
    orderBy(orderByField, orderDirection),
    limit(pageSize + 1)
  );

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);
  const docs = snapshot.docs;
  
  const hasMore = docs.length > pageSize;
  const data = hasMore ? docs.slice(0, pageSize) : docs;
  const newLastDoc = data.length > 0 ? data[data.length - 1] : null;

  return {
    data: data.map(doc => ({ id: doc.id, ...doc.data() })),
    lastDoc: newLastDoc,
    hasMore
  };
}

/**
 * 🚚 Obtener logs de Shipday paginados
 */
export async function getShipdayLogsPaginated(
  options: PaginationOptions = {}
): Promise<PaginatedResult<any>> {
  const {
    pageSize = 20,
    lastDoc,
    orderByField = 'timestamp',
    orderDirection = 'desc',
    whereConditions = []
  } = options;

  let q: Query = query(collection(db, 'shipdayLogs'));

  // Aplicar condiciones WHERE
  whereConditions.forEach(condition => {
    q = query(q, where(condition.field, condition.operator, condition.value));
  });

  // Aplicar ordenamiento
  q = query(q, orderBy(orderByField, orderDirection));

  // Aplicar paginación
  q = query(q, limit(pageSize + 1));

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);
  const docs = snapshot.docs;
  
  const hasMore = docs.length > pageSize;
  const data = hasMore ? docs.slice(0, pageSize) : docs;
  const newLastDoc = data.length > 0 ? data[data.length - 1] : null;

  return {
    data: data.map(doc => ({ id: doc.id, ...doc.data() })),
    lastDoc: newLastDoc,
    hasMore
  };
}

/**
 * 🔧 Función genérica de paginación
 */
export async function getPaginatedData<T>(
  collectionName: string,
  options: PaginationOptions = {}
): Promise<PaginatedResult<T>> {
  const {
    pageSize = 20,
    lastDoc,
    orderByField = 'createdAt',
    orderDirection = 'desc',
    whereConditions = []
  } = options;

  let q: Query = query(collection(db, collectionName));

  // Aplicar condiciones WHERE
  whereConditions.forEach(condition => {
    q = query(q, where(condition.field, condition.operator, condition.value));
  });

  // Aplicar ordenamiento
  q = query(q, orderBy(orderByField, orderDirection));

  // Aplicar paginación
  q = query(q, limit(pageSize + 1));

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);
  const docs = snapshot.docs;
  
  const hasMore = docs.length > pageSize;
  const data = hasMore ? docs.slice(0, pageSize) : docs;
  const newLastDoc = data.length > 0 ? data[data.length - 1] : null;

  return {
    data: data.map(doc => ({ id: doc.id, ...doc.data() } as T)),
    lastDoc: newLastDoc,
    hasMore
  };
}

/**
 * 📈 Hook para usar paginación en componentes React
 */
export function usePagination<T>(
  fetchFunction: (options: PaginationOptions) => Promise<PaginatedResult<T>>,
  initialOptions: PaginationOptions = {}
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const loadMore = async (options: PaginationOptions = {}) => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFunction({
        ...initialOptions,
        ...options,
        lastDoc: options.lastDoc || lastDoc || undefined
      });

      if (options.lastDoc) {
        // Cargar más datos
        setData(prev => [...prev, ...result.data]);
      } else {
        // Cargar datos iniciales
        setData(result.data);
      }

      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setData([]);
    setLastDoc(null);
    setHasMore(true);
    setError(null);
  };

  return {
    data,
    loading,
    hasMore,
    error,
    loadMore,
    reset
  };
}
