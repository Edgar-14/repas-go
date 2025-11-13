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