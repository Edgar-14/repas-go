# BeFast GO – Integración de Pedidos (Backend + App Nativa)

## 1. Cloud Function (ya creada y desplegada)

Archivo: `functions/src/orders/getDriverOrders.ts`

```ts
/**
 * @file Provides a lightweight callable to fetch orders for drivers without touching Shipday logic.
 */

import * as functions from 'firebase-functions';
import { onCall } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { COLLECTIONS } from '../shared/collections';
import { Order, orderConverter } from '../shared/types';

const db = admin.firestore();

const DEFAULT_AVAILABLE_STATUSES = ['NOT_ASSIGNED', 'SEARCHING'] as const;
const DEFAULT_DRIVER_STATUSES = [
  'ASSIGNED',
  'ACTIVE',
  'STARTED',
  'PICKED_UP',
  'READY_TO_DELIVER',
  'IN_TRANSIT',
  'ALREADY_DELIVERED',
  'COMPLETED'
] as const;

type TimestampLike = { toDate?: () => Date } | undefined | null;

const toIsoString = (value: TimestampLike): string | null => {
  if (!value) {
    return null;
  }
  if (typeof value.toDate === 'function') {
    try {
      return value.toDate().toISOString();
    } catch (error) {
      console.warn('Failed to convert timestamp', error);
      return null;
    }
  }
  return null;
};

const deepSerialize = (data: unknown): unknown => {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'object') {
    if (typeof (data as TimestampLike)?.toDate === 'function') {
      return toIsoString(data as TimestampLike);
    }

    if (Array.isArray(data)) {
      return data.map((item) => deepSerialize(item));
    }

    return Object.keys(data as Record<string, unknown>).reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = deepSerialize((data as Record<string, unknown>)[key]);
      return acc;
    }, {});
  }

  return data;
};

const serializeOrder = (order: Order) => ({
  ...order,
  createdAt: toIsoString(order.createdAt),
  updatedAt: toIsoString(order.updatedAt),
  assignedAt: toIsoString(order.assignedAt),
  pickedUpAt: toIsoString(order.pickedUpAt),
  completedAt: toIsoString(order.completedAt),
  customer: deepSerialize(order.customer),
  pickup: deepSerialize(order.pickup),
  items: deepSerialize(order.items),
});

export const getDriverOrders = onCall(async (request) => {
  const { auth, data } = request;
  const providedDriverId: string | undefined = data?.driverId;
  const driverId = (providedDriverId || auth?.uid || '').trim();

  if (!driverId) {
    throw new functions.https.HttpsError('unauthenticated', 'Driver ID is required');
  }

  const limit = typeof data?.limit === 'number' && data.limit > 0 ? Math.min(data.limit, 50) : 25;

  try {
    const availableStatuses: string[] = Array.isArray(data?.availableStatuses) && data.availableStatuses.length
      ? data.availableStatuses
      : [...DEFAULT_AVAILABLE_STATUSES];

    const driverStatuses: string[] = Array.isArray(data?.driverStatuses) && data.driverStatuses.length
      ? data.driverStatuses
      : [...DEFAULT_DRIVER_STATUSES];

    const availableQuery = availableStatuses.length
      ? db
          .collection(COLLECTIONS.ORDERS)
          .where('status', 'in', availableStatuses)
          .orderBy('createdAt', 'desc')
          .limit(limit)
          .withConverter(orderConverter)
      : null;

    const driverQuery = db
      .collection(COLLECTIONS.ORDERS)
      .where('driverId', '==', driverId)
      .orderBy('updatedAt', 'desc')
      .limit(limit)
      .withConverter(orderConverter);

    const [availableSnapshot, driverSnapshot] = await Promise.all([
      availableQuery ? availableQuery.get() : Promise.resolve(null),
      driverQuery.get()
    ]);

    const availableOrders = availableSnapshot
      ? availableSnapshot.docs
          .map((doc) => doc.data())
          .filter((order) => driverStatuses.includes(order.status) || availableStatuses.includes(order.status) || !order.driverId)
          .map((order) => serializeOrder(order))
      : [];

    const assignedOrders = driverSnapshot.docs
      .map((doc) => doc.data())
      .filter((order) => driverStatuses.includes(order.status) || !driverStatuses.length)
      .map((order) => serializeOrder(order));

    return {
      success: true,
      driverId,
      fetchedAt: new Date().toISOString(),
      counts: {
        available: availableOrders.length,
        assigned: assignedOrders.length,
      },
      availableOrders,
      assignedOrders,
    };
  } catch (error) {
    console.error('getDriverOrders error', error);
    throw new functions.https.HttpsError('internal', (error as Error)?.message || 'Unable to fetch orders');
  }
});
```

Exportada en `functions/src/index.ts`:

```ts
export { getDriverOrders } from './orders/getDriverOrders';
```

Despliegue realizado:

```powershell
firebase deploy --only functions:getDriverOrders
```

---

## 2. Tipos compartidos para la app nativa

Archivo sugerido: `repas-go/src/types/order.ts`

```ts
import type { Order } from '../../functions/shared/types';

export type { Order };
```

(Alternativa: copia manualmente la interfaz `Order` desde `functions/shared/types.ts` si no deseas dependencia directa.)

---

## 3. Servicio en React Native

Archivo: `repas-go/src/services/ordersService.ts`

```ts
import { getFunctions, httpsCallable } from 'firebase/functions';
import type { Order } from '../types/order';

type GetDriverOrdersResponse = {
  success: boolean;
  driverId: string;
  fetchedAt: string;
  counts: { available: number; assigned: number };
  availableOrders: Order[];
  assignedOrders: Order[];
};

const functions = getFunctions();

export async function fetchDriverOrders(driverId?: string): Promise<GetDriverOrdersResponse> {
  const callable = httpsCallable(functions, 'getDriverOrders');
  const { data } = await callable({ driverId });
  return data as GetDriverOrdersResponse;
}
```

---

## 4. Thunk en Redux (Orders Slice)

Archivo: `repas-go/src/store/slices/ordersSlice.ts`

```ts
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { Order } from '../../types/order';
import { fetchDriverOrders } from '../../services/ordersService';

export const loadOrders = createAsyncThunk('orders/load', async (_, { getState }) => {
  const { auth } = getState() as { auth: { driver?: { uid: string } } };
  const uid = auth.driver?.uid;
  return await fetchDriverOrders(uid);
});

const ordersSlice = createSlice({
  name: 'orders',
  initialState: {
    availableOrders: [] as Order[],
    assignedOrders: [] as Order[],
    isLoading: false,
    error: null as string | null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.availableOrders = action.payload.availableOrders;
        state.assignedOrders = action.payload.assignedOrders;
      })
      .addCase(loadOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? 'Error cargando pedidos';
      });
  },
});

export default ordersSlice.reducer;
```

---

## 5. Disparar carga y mostrar pedidos

**Post-login** (ej. `repas-go/src/screens/LoginScreen.tsx`):

```ts
import { useAppDispatch } from '../store/hooks';
import { loadOrders } from '../store/slices/ordersSlice';

const dispatch = useAppDispatch();

const onLoginSuccess = () => {
  dispatch(loadOrders());
  navigation.navigate('Main');
};
```

**Pantalla de pedidos** (`repas-go/src/screens/OrdersScreen.tsx`):

```ts
import { useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loadOrders } from '../store/slices/ordersSlice';
import OrderCard from '../components/OrderCard';

export default function OrdersScreen() {
  const dispatch = useAppDispatch();
  const { availableOrders, assignedOrders, isLoading } = useAppSelector((state) => state.orders);

  useEffect(() => {
    dispatch(loadOrders());
  }, [dispatch]);

  return (
    <View>
      {isLoading && <ActivityIndicator />}

      <Text>Nuevos disponibles</Text>
      <FlatList
        data={availableOrders}
        keyExtractor={(order) => order.id}
        renderItem={({ item }) => <OrderCard order={item} />}
      />

      <Text>Asignados</Text>
      <FlatList
        data={assignedOrders}
        keyExtractor={(order) => order.id}
        renderItem={({ item }) => <OrderCard order={item} />}
      />
    </View>
  );
}
```

---

## 6. Prueba rápida

1. Crear pedido desde Portal Delivery/Administración.
2. Iniciar sesión en la app BeFast Go.
3. Verificar que `loadOrders` se ejecuta y las listas se llenan.
4. Revisar Firebase Console → Functions → getDriverOrders para confirmar invocaciones y tiempos.

Con esto, los repartidores ya reciben pedidos en la app nativa sin tocar Shipday y podemos extenderlo después para aceptar pedidos o mostrar historial.
