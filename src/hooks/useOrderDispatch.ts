/**
 * useOrderDispatch.ts
 * 
 * Hook personalizado para suscribirse a pedidos disponibles y asignados al conductor.
 * 
 * Funcionalidades:
 * - Escucha en tiempo real pedidos con status SEARCHING o ASSIGNED
 * - Filtra pedidos asignados al conductor actual
 * - Proporciona métodos para aceptar/rechazar pedidos
 * - Centra el mapa en ubicaciones de pickup y delivery
 * - Se conecta a las Cloud Functions existentes del ecosistema BeFast
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { firestore } from '../config/firebase';
import { OrderDocument, OrderStatus } from '../types/order';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { showNewOrderModal } from '../store/slices/notificationsSlice';
import { AppDispatch } from '../store';

export interface OrderLocation {
  latitude: number;
  longitude: number;
}

export interface DispatchedOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  pickupLocation: OrderLocation;
  deliveryLocation: OrderLocation;
  pickupAddress: string;
  deliveryAddress: string;
  customerName: string;
  businessName: string;
  totalAmount: number;
  distance: number;
  estimatedDuration: number;
  paymentMethod: 'CASH' | 'CARD';
  items: Array<{ name: string; quantity: number }>;
}

export interface UseOrderDispatchOptions {
  driverId: string;
  autoAccept?: boolean; // Auto-accept asignaciones (default: false)
  listenToSearching?: boolean; // Escuchar pedidos SEARCHING (default: true)
  listenToAssigned?: boolean; // Escuchar pedidos ASSIGNED (default: true)
}

export interface UseOrderDispatchReturn {
  availableOrders: DispatchedOrder[]; // Pedidos en búsqueda
  assignedOrder: DispatchedOrder | null; // Pedido asignado al conductor
  isLoading: boolean;
  error: string | null;
  acceptOrder: (orderId: string) => Promise<boolean>;
  rejectOrder: (orderId: string) => Promise<void>;
  refreshOrders: () => void;
}

/**
 * Hook para gestionar el dispatch de pedidos al conductor
 */
export const useOrderDispatch = (
  options: UseOrderDispatchOptions
): UseOrderDispatchReturn => {
  const {
    driverId,
    autoAccept = false,
    listenToSearching = true,
    listenToAssigned = true,
  } = options;

  const dispatch = useDispatch<AppDispatch>();
  const [availableOrders, setAvailableOrders] = useState<DispatchedOrder[]>([]);
  const [assignedOrder, setAssignedOrder] = useState<DispatchedOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const unsubscribeSearching = useRef<(() => void) | null>(null);
  const unsubscribeAssigned = useRef<(() => void) | null>(null);
  const previousAvailableOrders = useRef<DispatchedOrder[]>([]);

  /**
   * Convierte un documento de Firestore a DispatchedOrder
   */
  const convertToDispatchedOrder = (
    doc: FirebaseFirestoreTypes.DocumentSnapshot
  ): DispatchedOrder | null => {
    if (!doc.exists) return null;

    const data = doc.data() as OrderDocument;

    // Validar que tenga las coordenadas necesarias
    if (!data.restaurant?.coordinates || !data.customer?.coordinates) {
      console.warn(`[useOrderDispatch] Orden ${doc.id} sin coordenadas completas`);
      return null;
    }

    return {
      id: doc.id,
      orderNumber: data.orderNumber || doc.id.slice(-8),
      status: data.status,
      pickupLocation: {
        latitude: data.restaurant.coordinates.lat,
        longitude: data.restaurant.coordinates.lng,
      },
      deliveryLocation: {
        latitude: data.customer.coordinates.lat,
        longitude: data.customer.coordinates.lng,
      },
      pickupAddress: data.restaurant.address,
      deliveryAddress: data.customer.address,
      customerName: data.customer.name,
      businessName: data.restaurant.name,
      totalAmount: data.pricing?.totalAmount || 0,
      distance: data.logistics?.distance || 0,
      estimatedDuration: data.logistics?.estimatedDuration || 0,
      paymentMethod: data.paymentMethod,
      items: data.items || [],
    };
  };

  /**
   * Escuchar pedidos en estado SEARCHING (disponibles para asignar)
   */
  useEffect(() => {
    if (!listenToSearching) return;

    setIsLoading(true);

    unsubscribeSearching.current = firestore()
      .collection('orders')
      .where('status', '==', OrderStatus.SEARCHING)
      .onSnapshot(
        (snapshot) => {
          const orders: DispatchedOrder[] = [];

          snapshot.forEach((doc) => {
            const order = convertToDispatchedOrder(doc);
            if (order) {
              orders.push(order);
            }
          });

          // --- LÓGICA PARA MOSTRAR MODAL ---
          // Si hay un nuevo pedido disponible que no estaba antes, mostrar el modal.
          if (orders.length > 0 && previousAvailableOrders.current.length === 0) {
            const newOrderToShow = orders[0]; // Mostrar el primer pedido nuevo
            console.log(`[useOrderDispatch] Nuevo pedido detectado: ${newOrderToShow.id}. Mostrando modal.`);
            dispatch(showNewOrderModal(newOrderToShow));
          }
          
          previousAvailableOrders.current = orders;
          // --- FIN DE LÓGICA ---

          setAvailableOrders(orders);
          setIsLoading(false);
          setError(null);

          console.log(`[useOrderDispatch] ${orders.length} pedidos disponibles`);
        },
        (err) => {
          console.error('[useOrderDispatch] Error listening to SEARCHING orders:', err);
          setError('Error al escuchar pedidos disponibles');
          setIsLoading(false);
        }
      );

    return () => {
      if (unsubscribeSearching.current) {
        unsubscribeSearching.current();
      }
    };
  }, [listenToSearching, driverId, dispatch]);

  /**
   * Escuchar pedidos asignados al conductor
   */
  useEffect(() => {
    if (!listenToAssigned || !driverId) return;

    setIsLoading(true);

    unsubscribeAssigned.current = firestore()
      .collection('orders')
      .where('assignedDriverId', '==', driverId)
      .where('status', 'in', [
        OrderStatus.ASSIGNED,
        OrderStatus.ACCEPTED,
        OrderStatus.STARTED,
        OrderStatus.PICKED_UP,
        OrderStatus.IN_TRANSIT,
      ])
      .onSnapshot(
        (snapshot) => {
          if (snapshot.empty) {
            setAssignedOrder(null);
            setIsLoading(false);
            return;
          }

          // Tomar el primer pedido activo
          const doc = snapshot.docs[0];
          const order = convertToDispatchedOrder(doc);

          if (order) {
            setAssignedOrder(order);

            // Auto-accept si está habilitado y el pedido está en ASSIGNED
            if (autoAccept && order.status === OrderStatus.ASSIGNED) {
              acceptOrder(order.id).catch((err) => {
                console.error('[useOrderDispatch] Error auto-accepting order:', err);
              });
            }
          }

          setIsLoading(false);
          setError(null);

          console.log(
            `[useOrderDispatch] Pedido asignado: ${order?.id} - Status: ${order?.status}`
          );
        },
        (err) => {
          console.error('[useOrderDispatch] Error listening to assigned orders:', err);
          setError('Error al escuchar pedido asignado');
          setIsLoading(false);
        }
      );

    return () => {
      if (unsubscribeAssigned.current) {
        unsubscribeAssigned.current();
      }
    };
  }, [listenToAssigned, driverId, autoAccept]);

  /**
   * Aceptar un pedido
   * Se conecta a la Cloud Function existente 'validateOrderAssignment'
   */
  const acceptOrder = useCallback(
    async (orderId: string): Promise<boolean> => {
      try {
        console.log(`[useOrderDispatch] Aceptando pedido ${orderId}...`);

        // Actualizar el estado local inmediatamente para mejor UX
        await firestore().collection('orders').doc(orderId).update({
          status: OrderStatus.ACCEPTED,
          assignedDriverId: driverId,
          'timing.acceptedAt': firestore.FieldValue.serverTimestamp(),
        });

        // La Cloud Function 'validateOrderAssignment' del ecosistema
        // validará automáticamente (IMSS, documentos, etc.) via trigger onUpdate
        // No necesitamos llamarla manualmente

        console.log(`[useOrderDispatch] Pedido ${orderId} aceptado exitosamente`);
        return true;
      } catch (err) {
        console.error('[useOrderDispatch] Error accepting order:', err);
        setError(`Error al aceptar pedido: ${(err as Error).message}`);
        return false;
      }
    },
    [driverId]
  );

  /**
   * Rechazar un pedido
   */
  const rejectOrder = useCallback(
    async (orderId: string): Promise<void> => {
      try {
        console.log(`[useOrderDispatch] Rechazando pedido ${orderId}...`);

        // Quitar la asignación del conductor
        await firestore().collection('orders').doc(orderId).update({
          assignedDriverId: null,
          status: OrderStatus.SEARCHING,
        });

        console.log(`[useOrderDispatch] Pedido ${orderId} rechazado`);
      } catch (err) {
        console.error('[useOrderDispatch] Error rejecting order:', err);
        setError(`Error al rechazar pedido: ${(err as Error).message}`);
      }
    },
    []
  );

  /**
   * Refrescar manualmente la lista de pedidos
   */
  const refreshOrders = useCallback(() => {
    console.log('[useOrderDispatch] Refrescando pedidos...');
    // Los listeners de Firebase se actualizan automáticamente
    // Este método es principalmente para indicar al UI que se está refrescando
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  return {
    availableOrders,
    assignedOrder,
    isLoading,
    error,
    acceptOrder,
    rejectOrder,
    refreshOrders,
  };
};

export default useOrderDispatch;
