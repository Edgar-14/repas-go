import { functions, CLOUD_FUNCTIONS } from '../config/firebase';
import { Order } from '../types/index';

interface GetDriverOrdersResponse {
  success: boolean;
  driverId: string;
  fetchedAt: string;
  counts: { available: number; assigned: number };
  availableOrders: Order[];
  assignedOrders: Order[];
}

export async function fetchDriverOrders(driverId: string): Promise<GetDriverOrdersResponse> {
  try {
    const callable = functions().httpsCallable(CLOUD_FUNCTIONS.GET_DRIVER_ORDERS);
    const result = await callable({ driverId });
    return result.data as GetDriverOrdersResponse;
  } catch (error: any) {
    console.error('[OrdersService] Error fetching driver orders:', error);
    throw new Error(error.message || 'Error fetching driver orders');
  }
}