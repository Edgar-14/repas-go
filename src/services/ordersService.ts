import { functions } from '../config/firebase';
import type { Order } from '../types';

type GetDriverOrdersResponse = {
  success: boolean;
  driverId: string;
  fetchedAt: string;
  counts: { available: number; assigned: number };
  availableOrders: Order[];
  assignedOrders: Order[];
};

export async function fetchDriverOrders(driverId?: string): Promise<GetDriverOrdersResponse> {
  const callable = functions().httpsCallable('getDriverOrders');
  const result = await callable({ driverId });
  return result.data as GetDriverOrdersResponse;
}