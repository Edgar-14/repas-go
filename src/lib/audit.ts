import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/collections';
import { db } from '@/lib/firebase';
// // Firebase Functions imports removed - not needed in frontend
// Removed - not needed in frontend
export async function createAuditLog(data: any) {
  try {
    await addDoc(collection(db, COLLECTIONS.AUDIT_LOGS), {
      ...data,
      createdAt: serverTimestamp(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
    // No throw error to avoid breaking main functionality
  }
}

export async function createDriverAuditLog(
  driverId: any,
  action: any,
  performedBy: any,
  details: any
) {
  return createAuditLog({
    action,
    entityType: 'driver',
    entityId: driverId,
    performedBy,
    details
  });
}

export async function createOrderAuditLog(
  orderId: any,
  action: any,
  performedBy: any,
  details: any
) {
  return createAuditLog({
    action,
    entityType: 'order',
    entityId: orderId,
    performedBy,
    details
  });
}
