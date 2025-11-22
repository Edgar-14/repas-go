import { db, auth } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { logAuditAction } from './AuditService';
import { Driver } from '@/lib/types/Driver';
import { Order } from '@/lib/types/Order';
import { SERVICE_FEE, DEFAULT_DEBT_LIMIT } from '@/constants/business';
// // Firebase Functions imports removed - not needed in frontend
// Removed - not needed in frontend
export async function validateDriverForOrder(data: { orderId: string; driverId: string; orderDetails: any; }) {
  const { orderId, driverId, orderDetails } = data;
  
  try {
    const driverDoc = await db.collection('drivers').doc(driverId).get();
    
    if (!driverDoc.exists) {
      await logAuditAction('ORDER_VALIDATION_FAILED', {
        entityType: 'ORDER',
        entityId: orderId,
        reason: 'Driver not found in BeFast system',
        performedBy: 'SYSTEM',
        severity: 'HIGH'
      });
      
      return { 
        approved: false, 
        reason: 'Driver not found in BeFast system' 
      };
    }
    
    const driver = driverDoc.data() as Driver | undefined;

    if (!driver) {
      await logAuditAction('ORDER_VALIDATION_FAILED', {
        entityType: 'ORDER',
        entityId: orderId,
        reason: 'Driver data is missing',
        performedBy: 'SYSTEM',
        severity: 'HIGH'
      });
      
      return { 
        approved: false, 
        reason: 'Driver data is missing' 
      };
    }
    
    const validStates = ['ACTIVE', 'ACTIVO_COTIZANDO'];
    if (!validStates.includes(driver.status)) {
      await logAuditAction('ORDER_VALIDATION_FAILED', {
        entityType: 'ORDER',
        entityId: orderId,
        reason: `Driver status invalid: ${driver.status}`,
        performedBy: 'SYSTEM',
        severity: 'MEDIUM'
      });
      
      return { 
        approved: false, 
        reason: `Driver status not valid for work: ${driver.status}` 
      };
    }
    
    if (orderDetails.paymentMethod === 'CASH') {
      const rawDebts = (driver as any).pendingDebts ?? 0;
      const normalizedDebts = rawDebts >= 0 ? rawDebts : Math.abs(rawDebts);
      const debtLimit = (driver as any).driverDebtLimit ?? (driver as any).debtLimit ?? DEFAULT_DEBT_LIMIT;
      
      if (normalizedDebts >= debtLimit) {
        await logAuditAction('ORDER_VALIDATION_FAILED', {
          entityType: 'ORDER', 
          entityId: orderId,
          reason: `Driver debt limit exceeded: ${normalizedDebts} >= ${debtLimit}`,
          performedBy: 'SYSTEM',
          severity: 'MEDIUM'
        });
        
        return { 
          approved: false, 
          reason: 'Driver debt limit exceeded' 
        };
      }
    }
    
    const requiredDocs = ['docId', 'docLicense', 'docInsurance'];
    const expiredDocs = [];
    
    for (const docType of requiredDocs) {
      const doc = driver.documents?.[docType as keyof typeof driver.documents];
      if (!doc || (doc as any).status !== 'APPROVED') {
        expiredDocs.push(docType);
      } else if ((doc as any).expiryDate && (doc as any).expiryDate.toDate() < new Date()) {
        expiredDocs.push(docType);
      }
    }
    
    if (expiredDocs.length > 0) {
      await logAuditAction('ORDER_VALIDATION_FAILED', {
        entityType: 'ORDER',
        entityId: orderId,
        reason: `Missing or expired documents: ${expiredDocs.join(', ')}`,
        performedBy: 'SYSTEM',
        severity: 'MEDIUM'
      });
      
      return { 
        approved: false, 
        reason: `Missing or expired documents: ${expiredDocs.join(', ')}` 
      };
    }
    
    await db.collection('orders').doc(orderId).update({
      driverId: driverId,
      status: 'ASSIGNED',
      assignedAt: FieldValue.serverTimestamp(),
      timeline: FieldValue.arrayUnion({
        status: 'ASSIGNED',
        timestamp: FieldValue.serverTimestamp(),
        notes: `Asignado a repartidor ${driver.fullName}`
      })
    });
    
    await logAuditAction('ORDER_VALIDATED_SUCCESS', {
      entityType: 'ORDER',
      entityId: orderId,
      performedBy: 'SYSTEM',
      notes: `Order approved for driver ${driverId}`,
      severity: 'LOW'
    });
    
    return { approved: true };
    
  } catch (error: any) {
    console.error('Order validation error:', error);
    
    await logAuditAction('ORDER_VALIDATION_ERROR', {
      entityType: 'ORDER',
      entityId: orderId,
      performedBy: 'SYSTEM',
      reason: 'Internal validation error',
      notes: error.message,
      severity: 'CRITICAL'
    });
    
    return { 
      approved: false, 
      reason: 'Internal validation error' 
    };
  }
}

export async function updateDriverWallet(data: { driverId: string; orderId: string; orderDetails: any; }) {
  const { driverId, orderId } = data;
  
  try {
    const driverRef = db.collection('drivers').doc(driverId);
    const orderRef = db.collection('orders').doc(orderId);
    
    await db.runTransaction(async (transaction) => {
      const driverDoc = await transaction.get(driverRef);
      const orderDoc = await transaction.get(orderRef);
      
      if (!driverDoc.exists || !orderDoc.exists) {
        throw new Error('Driver or order not found');
      }
      
      const driver = driverDoc.data() as Driver | undefined;
      const order = orderDoc.data() as Order | undefined;

      if (!driver || !order) {
        throw new Error('Driver or order data not found');
      }
      
      // Usar tarifa centralizada de constants/business.ts
      let walletUpdate = 0;
      let transactionType = '';
      
      if (order.paymentMethod === 'CASH') {
        // Para efectivo: NO modificar balance, registrar adeudo pendiente
        walletUpdate = 0; // No se modifica el balance
        transactionType = 'CASH_ORDER_ADEUDO';
        
        // Actualizar adeudos pendientes
        const currentDebts = (driver as any).pendingDebts || 0;
        transaction.update(driverRef, {
          pendingDebts: currentDebts + SERVICE_FEE,
          ingreso_bruto_mensual: (driver as any).ingreso_bruto_mensual + order.amountToCollect,
          'kpis.totalOrders': (driver as any).kpis?.totalOrders + 1,
          lastActiveAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        });
      } else {
        // Para tarjeta: BeFast transfiere ganancia al repartidor
        const netEarnings = order.amountToCollect - SERVICE_FEE;
        walletUpdate = netEarnings;
        transactionType = 'CARD_ORDER_TRANSFER';
        
        transaction.update(driverRef, {
          walletBalance: (driver.walletBalance || 0) + walletUpdate,
          ingreso_bruto_mensual: (driver as any).ingreso_bruto_mensual + order.amountToCollect,
          'kpis.totalOrders': (driver as any).kpis?.totalOrders + 1,
          lastActiveAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        });
      }
      
      const walletTransactionRef = db.collection('walletTransactions').doc();
      transaction.set(walletTransactionRef, {
        driverId: driverId,
        type: transactionType,
        amount: walletUpdate,
        orderId: orderId,
        status: 'COMPLETED',
        balanceAfter: order.paymentMethod === 'CASH' ? driver.walletBalance : (driver.walletBalance || 0) + walletUpdate,
        description: order.paymentMethod === 'CASH'
          ? `Adeudo por pedido en efectivo - Debe depositar $${SERVICE_FEE}` 
          : `Transferencia de ganancia por pedido con tarjeta`,
        createdAt: FieldValue.serverTimestamp(),
        processedAt: FieldValue.serverTimestamp()
      });
    });
    
    await logAuditAction('WALLET_UPDATED', {
      entityType: 'DRIVER',
      entityId: driverId,
      performedBy: 'SYSTEM',
      notes: `Order ${orderId} completed, wallet updated`,
      severity: 'LOW'
    });
    
    return { success: true };
    
  } catch (error: any) {
    console.error('Wallet update error:', error);
    
    await logAuditAction('WALLET_UPDATE_ERROR', {
      entityType: 'DRIVER',
      entityId: driverId,
      performedBy: 'SYSTEM',
      reason: 'Wallet update failed',
      notes: error.message,
      severity: 'HIGH'
    });
    
    throw error;
  }
}
