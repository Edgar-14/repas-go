/**
 * API para sincronizar repartidores de Shipday a BeFast
 * Importa todos los repartidores y los guarda en la colección DRIVERS
 */

import { NextRequest, NextResponse } from 'next/server';
import { getShipdayService } from '@/lib/services/shipdayService';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/collections';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting Shipday drivers sync to BeFast...');

    const shipdayService = getShipdayService();
    
    // 1. Obtener todos los repartidores de la colección shipdayDrivers
    const shipdayDriversRef = collection(db, COLLECTIONS.SHIPDAY_DRIVERS);
    const shipdaySnapshot = await getDocs(shipdayDriversRef);
    
    console.log(`📊 Found ${shipdaySnapshot.size} drivers in shipdayDrivers collection`);
    
    const shipdayDrivers = shipdaySnapshot.docs.map(doc => ({
      id: doc.data().shipdayCarrierId || doc.id,
      ...(doc.data() as any)
    }));

    if (!shipdayDrivers || shipdayDrivers.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No carriers found in Shipday',
        summary: { success: 0, errors: 0, skipped: 0 }
      });
    }

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    const errors: any[] = [];

    // 2. Procesar cada repartidor
    for (const shipdayDriver of shipdayDrivers) {
      try {
        // Verificar si ya existe en BeFast
        const existingQuery = query(
          collection(db, COLLECTIONS.DRIVERS),
          where('shipdayCarrierId', '==', shipdayDriver.id.toString())
        );
        const existingDocs = await getDocs(existingQuery);

        if (!existingDocs.empty) {
          console.log(`⏭️ Carrier ${(shipdayDriver as any).name} already exists, skipping...`);
          skippedCount++;
          continue;
        }

        // Crear documento del repartidor en BeFast
        const driverData = {
          // Información básica de Shipday (campo "id" del Carrier Object)
          shipdayCarrierId: shipdayDriver.id.toString(),
          fullName: (shipdayDriver as any).name || 'Repartidor Sin Nombre',
          email: (shipdayDriver as any).email || `driver${shipdayDriver.id}@shipday.com`,
          phone: (shipdayDriver as any).phoneNumber || '',
          
          // Información del vehículo
          vehicle: {
            type: (shipdayDriver as any).vehicleType?.toLowerCase() || 'moto',
            plates: (shipdayDriver as any).vehicleLicensePlate || '',
            brand: '',
            model: '',
            year: new Date().getFullYear(),
            color: (shipdayDriver as any).vehicleColor || ''
          },
          
          // Estados por defecto
          status: (shipdayDriver as any).isActive ? 'ACTIVE' : 'INACTIVE',
          imssStatus: 'PENDING',
          
          // Métricas financieras iniciales
          walletBalance: 0,
          pendingDebts: 0,
          driverDebtLimit: -300.00,
          
          // KPIs iniciales
          kpis: {
            totalOrders: 0,
            completedOrders: 0,
            cancelledOrders: 0,
            acceptanceRate: 0,
            onTimeRate: 0,
            customerSatisfaction: 0,
            totalDistance: 0,
            totalWorkTime: 0,
            avgOrderValue: 0,
            efficiency: 0
          },

          // Métricas de desempeño
          performanceMetrics: {
            totalDeliveries: 0,
            deliveriesCompleted: 0,
            deliveriesOnTime: 0,
            deliveriesLate: 0,
            deliveriesFailed: 0,
            averageRating: 0,
            totalReviews: 0,
            averageDeliveryTime: 0,
            totalCashDeliveries: 0,
            totalEarnings: 0,
            driverPay: 0,
            cashCollected: 0,
            paymentAfterCash: 0
          },
          
          // Timestamps
          createdAt: new Date(),
          updatedAt: new Date(),
          importedFromShipday: true,
          importedAt: new Date(),
          
          // Ubicación si está disponible
          ...((shipdayDriver as any).latitude && (shipdayDriver as any).longitude && {
            lastKnownLocation: {
              latitude: (shipdayDriver as any).latitude,
              longitude: (shipdayDriver as any).longitude,
              updatedAt: new Date()
            }
          })
        };

        // Guardar en Firestore usando el ID de Shipday como documento ID
        const driverDocId = `shipday_${shipdayDriver.id}`;
        await setDoc(doc(db, COLLECTIONS.DRIVERS, driverDocId), driverData);

        console.log(`✅ Driver ${(shipdayDriver as any).name} imported successfully`);
        successCount++;

      } catch (error: any) {
        console.error(`❌ Error importing driver ${(shipdayDriver as any).name}:`, error);
        errors.push({
          driverName: (shipdayDriver as any).name,
          shipdayId: shipdayDriver.id,
          error: error.message
        });
        errorCount++;
      }
    }

    const summary = {
      success: successCount,
      errors: errorCount,
      skipped: skippedCount,
      total: shipdayDrivers.length
    };

    console.log('📊 Import Summary:', summary);

    return NextResponse.json({
      success: true,
      message: `Importación completada: ${successCount} exitosos, ${errorCount} errores, ${skippedCount} omitidos`,
      summary,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    console.error('❌ Error in drivers sync:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to sync drivers from Shipday',
      details: error.message || 'Unknown error',
      summary: { success: 0, errors: 1, skipped: 0 }
    }, { status: 500 });
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
