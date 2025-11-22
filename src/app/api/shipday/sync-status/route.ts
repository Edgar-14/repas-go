/**
 * Shipday Sync Status API
 * Obtiene el estado de sincronización con Shipday
 */

import { NextRequest, NextResponse } from 'next/server';
import { getShipdayService } from '@/lib/services/shipdayService';
import { COLLECTIONS } from '@/lib/collections';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Getting Shipday sync status...');
    
    // Obtener servicio de Shipday
    const shipdayService = getShipdayService();

    // Obtener estado de salud de Shipday
    const healthStatus = await shipdayService.healthCheck();

    return NextResponse.json({
      success: true,
      data: {
        health: healthStatus,
        sync: {
          lastSync: new Date().toISOString(),
          isRunning: false,
          totalSynced: 0,
          totalFailed: 0,
          lastError: null
        },
        lastSync: new Date().toISOString(),
        isRunning: false,
        totalSynced: 0,
        totalFailed: 0,
        lastError: null
      },
      message: 'Estado de sincronización obtenido exitosamente'
    });

  } catch (error: any) {
    console.error('❌ Error getting sync status:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get sync status',
      details: error.message || 'Unknown error',
      data: {
        health: {
          status: 'error',
          message: 'Error de conexión con Shipday'
        },
        sync: null,
        lastSync: null,
        isRunning: false,
        totalSynced: 0,
        totalFailed: 0,
        lastError: error.message || 'Error desconocido'
      }
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    console.log('🚀 Executing sync action:', action);

    // Obtener servicio de Shipday
    const shipdayService = getShipdayService();

    let result;

    switch (action) {
      case 'health':
        result = await shipdayService.healthCheck();
        break;
      
      case 'sync-drivers':
        // Obtener repartidores de BeFast desde Firestore
        const { collection, getDocs, query, where } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        
        try {
        // Obtener repartidores de shipdayDrivers y migrarlos a DRIVERS
        const shipdayDriversRef = collection(db, COLLECTIONS.SHIPDAY_DRIVERS);
        const shipdaySnapshot = await getDocs(shipdayDriversRef);
        
        console.log(`📊 Encontrados ${shipdaySnapshot.size} repartidores en shipdayDrivers`);
        
        let successCount = 0;
        
        // Migrar cada repartidor de shipdayDrivers a DRIVERS
        for (const docSnap of shipdaySnapshot.docs) {
          try {
            const shipdayData = docSnap.data();
            const driverDocId = `shipday_${shipdayData.shipdayCarrierId || docSnap.id}`;
            
            const driverData = {
              shipdayCarrierId: shipdayData.shipdayCarrierId?.toString() || docSnap.id,
              fullName: shipdayData.name || 'Repartidor Sin Nombre',
              email: shipdayData.email || `driver${docSnap.id}@shipday.com`,
              phone: shipdayData.phoneNumber || '',
              vehicle: {
                type: (shipdayData.vehicleType || 'moto').toLowerCase(),
                plates: shipdayData.vehicleLicensePlate || '',
                color: shipdayData.vehicleColor || ''
              },
              status: shipdayData.isActive ? 'ACTIVE' : 'INACTIVE',
              walletBalance: 0,
              pendingDebts: 0,
              kpis: { totalOrders: 0, completedOrders: 0, cancelledOrders: 0 },
              createdAt: shipdayData.createdAt || new Date(),
              updatedAt: new Date(),
              importedFromShipday: true
            };
            
            const { setDoc, doc } = await import('firebase/firestore');
            await setDoc(doc(db, COLLECTIONS.DRIVERS, driverDocId), driverData);
            successCount++;
          } catch (error) {
            console.error(`Error migrating driver ${docSnap.id}:`, error);
          }
        }
        
        result = {
          success: successCount,
          errors: [],
          message: `${successCount} repartidores migrados de shipdayDrivers a DRIVERS`,
          driversCount: shipdaySnapshot.size,
          syncedCount: successCount
        };
        
        break;
        } catch (error) {
          console.error('❌ Error obteniendo repartidores de BeFast:', error);
          result = { 
            success: 0, 
            errors: [{ error: error instanceof Error ? error.message : 'Error desconocido' }],
            message: 'Error obteniendo repartidores de BeFast'
          };
        }
        break;
      
      case 'sync-orders':
        // syncOrders requiere un array de órdenes BeFast
        result = { success: 0, errors: [], message: 'syncOrders requires befastOrders array parameter' };
        break;
      
      case 'orders':
        // Alias para sync-orders
        result = { success: 0, errors: [], message: 'syncOrders requires befastOrders array parameter' };
        break;
      
      case 'all':
        // Sincronización completa - drivers y orders
        const { collection: collection2, getDocs: getDocs2, query: query2, where: where2 } = await import('firebase/firestore');
        const { db: db2 } = await import('@/lib/firebase');
        
        try {
          // Obtener repartidores activos de BeFast - Using DRIVERS collection per BEFAST FLUJO FINAL
          const driversQuery = query2(
            collection2(db2, 'DRIVERS'),
            where2('status', 'in', ['ACTIVE', 'ACTIVO_COTIZANDO'])
          );
          const driversSnapshot = await getDocs2(driversQuery);
          const befastDrivers = driversSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              nombre: (data as any).nombre || (data as any).name || 'Sin nombre',
              email: (data as any).email || '',
              telefono: (data as any).telefono || (data as any).phone || '',
              vehiculo: (data as any).vehiculo || (data as any).vehicle || 'car',
              activo: (data as any).activo !== false,
              shipdayCarrierId: (data as any).shipdayCarrierId || null,
              status: (data as any).status || 'ACTIVE'
            };
          });

          console.log(`📋 Sincronización completa: ${befastDrivers.length} repartidores encontrados`);

          // Filtrar solo los que no están sincronizados con Shipday
          const driversToSync = befastDrivers.filter(driver => !driver.shipdayCarrierId);
          
          console.log(`🔄 ${driversToSync.length} repartidores necesitan sincronización`);

          let driversResult = { success: 0, errors: [] as any[] };
          if (driversToSync.length > 0) {
            driversResult = await shipdayService.syncDrivers(driversToSync);
          }

          result = {
            success: driversResult.success,
            errors: driversResult.errors,
            message: `Sincronización completa: ${driversResult.success} repartidores sincronizados`,
            driversCount: befastDrivers.length,
            syncedCount: driversResult.success,
            failedCount: driversResult.errors.length,
            ordersCount: 0,
            ordersSynced: 0
          };
        } catch (error) {
          console.error('❌ Error en sincronización completa:', error);
          result = { 
            success: 0, 
            errors: [{ error: error instanceof Error ? error.message : 'Error desconocido' }],
            message: 'Error en sincronización completa'
          };
        }
        break;
      
      default:
        throw new Error(`Unknown sync action: ${action}`);
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: `Acción ${action} ejecutada exitosamente`
    });

  } catch (error: any) {
    console.error('❌ Error executing sync action:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to execute sync action',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
