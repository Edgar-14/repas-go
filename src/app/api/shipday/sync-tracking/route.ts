/**
 * Shipday Sync Tracking API - BeFast (100% alineado a la arquitectura real)
 * Sincroniza tracking links para pedidos pendientes que no tienen trackingLink,
 * utilizando orderNumber como referencia (según Shipday API docs).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getShipdayService } from '@/lib/services/shipdayService';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc, orderBy, limit } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/collections';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Iniciando sincronización de tracking para pedidos pendientes...');
    
    const shipdayService = getShipdayService();

    // Buscar pedidos pendientes SIN trackingLink, CON shipdayOrderId y orderNumber
    const ordersQuery = query(
      collection(db, COLLECTIONS.ORDERS),
      where('status', '==', 'PENDING'),
      where('shipdayOrderId', '!=', null),
      where('trackingLink', '==', null),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const ordersSnapshot = await getDocs(ordersQuery);

    if (ordersSnapshot.empty) {
      return NextResponse.json({
        success: true,
        message: 'No hay pedidos pendientes sin tracking',
        data: { processed: 0, updated: 0, errors: 0 }
      });
    }

    let processed = 0;
    let updated = 0;
    let errors = 0;

    for (const orderDoc of ordersSnapshot.docs) {
      try {
        const orderData = orderDoc.data();
        const shipdayOrderId = orderData.shipdayOrderId;
        const orderNumber = orderData.orderNumber || orderData.shipdayOrderNumber;

        if (!shipdayOrderId || !orderNumber) {
          console.warn(`⚠️ Pedido ${orderDoc.id} sin shipdayOrderId o orderNumber`);
          continue;
        }

        processed++;
        console.log(`🔍 Procesando pedido ${orderDoc.id} (Shipday ID: ${shipdayOrderId}, Order Number: ${orderNumber})`);

        // Buscar tracking ID real en Shipday usando el orderNumber
        const trackingId = await shipdayService.getTrackingIdByOrderNumber(orderNumber);

        if (trackingId) {
          // Generar trackingLink oficial Shipday
          const trackingLink = `https://track.shipday.com/track/${trackingId}`;

          await updateDoc(doc(db, COLLECTIONS.ORDERS, orderDoc.id), {
            trackingLink,
            trackingId,
            updatedAt: new Date()
          });

          updated++;
          console.log(`✅ Tracking actualizado para pedido ${orderDoc.id}: ${trackingLink}`);
        } else {
          console.log(`⚠️ No se encontró trackingId para pedido ${orderDoc.id} (orderNumber: ${orderNumber})`);
        }

        // Pequeña pausa para no sobrecargar la API Shipday
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error: any) {
        errors++;
        console.error(`❌ Error procesando pedido ${orderDoc.id}:`, error);
      }
    }

    console.log(`🎉 Sync de tracking completada: ${processed} procesados, ${updated} actualizados, ${errors} errores`);
    return NextResponse.json({
      success: true,
      message: 'Sincronización de tracking completada',
      data: { processed, updated, errors, totalFound: ordersSnapshot.docs.length }
    });

  } catch (error: any) {
    console.error('❌ Error global en sync tracking:', error);
    return NextResponse.json({
      success: false,
      error: 'Falló la sincronización de tracking',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Contar pedidos pendientes sin trackingLink
    const ordersQuery = query(
      collection(db, COLLECTIONS.ORDERS),
      where('status', '==', 'PENDING'),
      where('shipdayOrderId', '!=', null),
      where('trackingLink', '==', null)
    );
    const ordersSnapshot = await getDocs(ordersQuery);
    return NextResponse.json({
      success: true,
      data: {
        pendingOrdersWithoutTracking: ordersSnapshot.docs.length,
        lastChecked: new Date().toISOString()
      },
      message: 'Estado de sincronización de tracking obtenido'
    });
  } catch (error: any) {
    console.error('❌ Error obteniendo estado de tracking:', error);
    return NextResponse.json({
      success: false,
      error: 'Falló al obtener estado de tracking',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}