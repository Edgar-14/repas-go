/**
 * Shipday Active Sync API
 * Sincronización activa de pedidos y repartidores en tiempo real
 */

import { NextRequest, NextResponse } from 'next/server';
import { getShipdayService } from '@/lib/services/shipdayService';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc, orderBy, limit } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/collections';
import { ShipdayOrderData } from '@/lib/shipday-collections';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting active sync with Shipday...');
    
    const shipdayService = getShipdayService();

    // Helpers for robust ID/status/tracking extraction and Firestore lookup
    const getShipdayId = (o: any): string => {
      const raw = o?.id ?? o?.orderId ?? o?.order_id ?? o?.orderID;
      return raw != null ? String(raw) : '';
    };
    const getShipdayStatus = (o: any): string => {
      const s = o?.status ?? o?.orderStatus?.orderState ?? o?.order_status;
      return s ? String(s).toUpperCase() : '';
    };
    const getShipdayTrackingLink = (o: any): string | null => {
      return o?.tracking_url ?? o?.trackingUrl ?? o?.trackingLink ?? o?.tracking_link ?? null;
    };
    const findOrderDocByShipdayId = async (idRaw: any) => {
      try {
        const idStr = String(idRaw);
        if (idStr && idStr !== 'undefined' && idStr !== 'NaN') {
          const q1 = query(collection(db, COLLECTIONS.ORDERS), where('shipdayOrderId', '==', idStr), limit(1));
          const s1 = await getDocs(q1);
          if (!s1.empty) return s1.docs[0];
        }
        const idNum = Number(idRaw);
        if (!Number.isNaN(idNum)) {
          const q2 = query(collection(db, COLLECTIONS.ORDERS), where('shipdayOrderId', '==', idNum), limit(1));
          const s2 = await getDocs(q2);
          if (!s2.empty) return s2.docs[0];
        }
      } catch {}
      return null;
    };
    const syncResults = {
      orders: { synced: 0, failed: 0, errors: [] as any[] },
      drivers: { synced: 0, failed: 0, errors: [] as any[] },
      tracking: { synced: 0, failed: 0, errors: [] as any[] }
    };

    // 1. Sincronizar pedidos activos
    console.log('📦 Syncing active orders...');
    try {
      const activeOrders = await shipdayService.getActiveOrders();
      
            
      for (const shipdayOrder of activeOrders as any[]) {
        try {
          // Buscar pedido en BeFast por shipdayOrderId
          const sdId = getShipdayId(shipdayOrder as any);
          if (!sdId) {
            console.warn('Skipping order without Shipday ID', shipdayOrder);
            continue;
          }
          const orderDoc = await findOrderDocByShipdayId(sdId);
          
          if (orderDoc) {
            const befastOrder = orderDoc.data();
            
            // Actualizar estado si es diferente
            const statusMapping: { [key: string]: string } = {
              // Pendiente / búsqueda
              'PENDING': 'pending',
              'SEARCHING': 'pending',
              'NOT_ASSIGNED': 'pending',
              'NOT_ACCEPTED': 'pending',
              'NOT_STARTED_YET': 'pending',
              // Asignado / iniciado
              'ASSIGNED': 'assigned',
              'STARTED': 'assigned',
              // Recogido
              'PICKED_UP': 'picked_up',
              // En tránsito
              'READY_TO_DELIVER': 'in_transit',
              'IN_TRANSIT': 'in_transit',
              // Entregado / completado
              'ALREADY_DELIVERED': 'delivered',
              'DELIVERED': 'delivered',
              'COMPLETED': 'delivered',
              // Cancelado / fallido / incompleto
              'CANCELLED': 'cancelled',
              'FAILED': 'cancelled',
              'FAILED_DELIVERY': 'cancelled',
              'INCOMPLETE': 'cancelled'
            };
            
            const sdStatus = getShipdayStatus(shipdayOrder as any);
            const mappedStatus = statusMapping[sdStatus] || sdStatus.toLowerCase();
            
            if (befastOrder.status !== mappedStatus) {
              await updateDoc(doc(db, COLLECTIONS.ORDERS, orderDoc.id), {
                status: mappedStatus,
                updatedAt: new Date(),
                // Actualizar datos adicionales de Shipday
                trackingLink: getShipdayTrackingLink(shipdayOrder as any) || befastOrder.trackingLink,
                shipdayStatus: sdStatus,
                lastSyncAt: new Date()
              });
              
              console.log(`✅ Updated order ${orderDoc.id} status: ${befastOrder.status} → ${mappedStatus}`);
              syncResults.orders.synced++;
            }
          }
        } catch (error: any) {
          console.error(`❌ Error syncing order ${(shipdayOrder as any).id}:`, error.message);
          syncResults.orders.failed++;
          syncResults.orders.errors.push({
            orderId: (shipdayOrder as any).id,
            error: error.message
          });
        }
      }
    } catch (error: any) {
      console.error('❌ Error syncing orders:', error.message);
      syncResults.orders.errors.push({ error: error.message });
    }

    // 2. Sincronizar repartidores activos
    console.log('🚴 Syncing active drivers...');
    try {
      const shipdayDrivers = await shipdayService.getDrivers();
      
      for (const shipdayDriver of shipdayDrivers as any[]) {
        try {
          // Buscar repartidor en BeFast por shipdayCarrierId (campo "id" del Carrier en Shipday)
          const driverQuery = query(
            collection(db, COLLECTIONS.DRIVERS),
            where('shipdayCarrierId', '==', (shipdayDriver as any).id),
            limit(1)
          );
          
          const driverSnapshot = await getDocs(driverQuery);
          
          if (!driverSnapshot.empty) {
            const driverDoc = driverSnapshot.docs[0];
            const befastDriver = driverDoc.data();
            
            // Actualizar estado del repartidor
            await updateDoc(doc(db, COLLECTIONS.DRIVERS, driverDoc.id), {
              isActiveInShipday: (shipdayDriver as any).is_active || true,
              shipdayStatus: (shipdayDriver as any).status,
              lastSyncAt: new Date()
            });
            
            console.log(`✅ Updated driver ${driverDoc.id} status`);
            syncResults.drivers.synced++;
          }
        } catch (error: any) {
          console.error(`❌ Error syncing driver ${(shipdayDriver as any).id}:`, error.message);
          syncResults.drivers.failed++;
          syncResults.drivers.errors.push({
            driverId: (shipdayDriver as any).id,
            error: error.message
          });
        }
      }
    } catch (error: any) {
      console.error('❌ Error syncing drivers:', error.message);
      syncResults.drivers.errors.push({ error: error.message });
    }

    // 3. Actualizar tracking de pedidos con trackingLink
    console.log('📍 Syncing tracking data...');
    try {
      const ordersWithTrackingQuery = query(
        collection(db, COLLECTIONS.ORDERS),
        where('trackingLink', '!=', null),
        where('status', 'in', ['assigned', 'picked_up', 'in_transit', 'delivered'])
      );
      
      const ordersSnapshot = await getDocs(ordersWithTrackingQuery);
      
      for (const orderDoc of ordersSnapshot.docs) {
        try {
          const order = orderDoc.data();
          if (order.trackingLink) {
            // Extraer tracking ID del URL
            const trackingId = extractTrackingId(order.trackingLink);
            if (trackingId) {
              const progress = await shipdayService.getOrderProgress(trackingId);
              
              const progStatus = ((progress as any)?.orderStatus?.status ?? (progress as any)?.status ?? '').toUpperCase();
              if (progress && progStatus && progStatus !== String(order.status || '').toUpperCase()) {
                const statusMapping: { [key: string]: string } = {
                  // Pendiente / búsqueda
                  'PENDING': 'pending',
                  'SEARCHING': 'pending',
                  'NOT_ASSIGNED': 'pending',
                  'NOT_ACCEPTED': 'pending',
                  'NOT_STARTED_YET': 'pending',
                  // Asignado / iniciado
                  'ASSIGNED': 'assigned',
                  'STARTED': 'assigned',
                  // Recogido
                  'PICKED_UP': 'picked_up',
                  // En tránsito
                  'READY_TO_DELIVER': 'in_transit',
                  'IN_TRANSIT': 'in_transit',
                  // Entregado / completado
                  'ALREADY_DELIVERED': 'delivered',
                  'DELIVERED': 'delivered',
                  'COMPLETED': 'delivered',
                  // Cancelado / fallido / incompleto
                  'CANCELLED': 'cancelled',
                  'FAILED': 'cancelled',
                  'FAILED_DELIVERY': 'cancelled',
                  'INCOMPLETE': 'cancelled'
                };
                
                const mappedStatus = statusMapping[progStatus] || progStatus.toLowerCase();
                
                await updateDoc(doc(db, COLLECTIONS.ORDERS, orderDoc.id), {
                  status: mappedStatus,
                  updatedAt: new Date(),
                  lastSyncAt: new Date()
                });
                
                console.log(`✅ Updated tracking for order ${orderDoc.id}: ${order.status} → ${mappedStatus}`);
                syncResults.tracking.synced++;
              }
            }
          }
        } catch (error: any) {
          console.error(`❌ Error syncing tracking for order ${orderDoc.id}:`, error.message);
          syncResults.tracking.failed++;
          syncResults.tracking.errors.push({
            orderId: orderDoc.id,
            error: error.message
          });
        }
      }
    } catch (error: any) {
      console.error('❌ Error syncing tracking:', error.message);
      syncResults.tracking.errors.push({ error: error.message });
    }

    const totalSynced = syncResults.orders.synced + syncResults.drivers.synced + syncResults.tracking.synced;
    const totalFailed = syncResults.orders.failed + syncResults.drivers.failed + syncResults.tracking.failed;

    console.log(`✅ Active sync completed: ${totalSynced} synced, ${totalFailed} failed`);

    return NextResponse.json({
      success: true,
      message: 'Sincronización activa completada',
      data: {
        summary: {
          totalSynced,
          totalFailed,
          syncTime: new Date().toISOString()
        },
        details: syncResults
      }
    });

  } catch (error: any) {
    console.error('❌ Error in active sync:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Active sync failed',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}

function extractTrackingId(trackingUrl: string): string | null {
  try {
    // Extraer ID de tracking de diferentes formatos de URL
    const url = new URL(trackingUrl);
    const pathParts = url.pathname.split('/');
    return pathParts[pathParts.length - 1] || null;
  } catch {
    return null;
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
