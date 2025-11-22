import { NextRequest, NextResponse } from 'next/server';
import 'server-only';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import {
  ORDER_STATUS_DEFINITIONS,
  OrderStatusDefinition,
  OrderStatusKey
} from '../../../../../../../shared/orderStatusDefinitions';

export const runtime = 'nodejs';

function baseUrl() {
  return (process.env.SHIPDAY_API_URL || 'https://api.shipday.com').replace(/\/$/, '');
}

function shipdayHeaders() {
  const apiKey = process.env.SHIPDAY_API_KEY;
  if (!apiKey) throw new Error('SHIPDAY_API_KEY is not configured');
  // Align with existing client behavior: send API key directly (no base64)
  return {
    Authorization: `Basic ${apiKey}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  } as Record<string, string>;
}

async function fetchJson(url: string) {
  const res = await fetch(url, { headers: shipdayHeaders(), cache: 'no-store' });
  const text = await res.text();
  if (!res.ok) throw new Error(`Shipday API error: ${res.status} - ${text}`);
  try { return JSON.parse(text); } catch { return text ? { raw: text } : {}; }
}

interface StatusMappingInfo {
  status: OrderStatusKey;
  statusEs: string;
  isFinal: boolean;
  definition: OrderStatusDefinition;
}

const SHIPDAY_STATUS_SYNC_MAP: Record<string, StatusMappingInfo> = ORDER_STATUS_DEFINITIONS.reduce(
  (accumulator, definition) => {
    const entry: StatusMappingInfo = {
      status: definition.key,
      statusEs: definition.spanishLabel,
      isFinal: definition.isFinal,
      definition
    };

    const registerKey = (key?: string) => {
      if (!key) return;
      accumulator[key] = entry;
      accumulator[key.toUpperCase()] = entry;
      accumulator[key.toLowerCase()] = entry;
    };

    registerKey(definition.shipdayStatus ?? definition.key);
    if (definition.shipdayStatus) {
      registerKey(definition.shipdayStatus.replace(/_/g, ' '));
    }

    return accumulator;
  },
  {} as Record<string, StatusMappingInfo>
);

async function syncOrderStatusFromShipday(
  shipdayOrderId: string,
  shipdayStatus: string | null,
  trackingLink: string | null,
  driverInfo: any
) {
  if (!shipdayStatus) return;

  try {
    const normalizedStatus = shipdayStatus.toUpperCase();
    const mapping = SHIPDAY_STATUS_SYNC_MAP[normalizedStatus];
    if (!mapping) {
      console.log('ℹ️ Estado Shipday no mapeado, se omite sincronización:', { shipdayStatus });
      return;
    }

    let snapshot = await adminDb
      .collection('orders')
      .where('shipdayOrderId', '==', shipdayOrderId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      const numericId = Number(shipdayOrderId);
      if (!Number.isNaN(numericId)) {
        snapshot = await adminDb
          .collection('orders')
          .where('shipdayOrderId', '==', numericId)
          .limit(1)
          .get();
      }
    }

    if (snapshot.empty) {
      console.log('⚠️ Pedido no encontrado para sincronizar estado desde Shipday', { shipdayOrderId });
      return;
    }

    const orderDoc = snapshot.docs[0];
    const currentData = orderDoc.data();
    const updates: Record<string, unknown> = {};
    let shouldUpdate = false;

    if ((currentData.status as string | undefined) !== mapping.status) {
      updates.status = mapping.status;
      shouldUpdate = true;
    }

    if ((currentData.statusEs as string | undefined) !== mapping.statusEs) {
      updates.statusEs = mapping.statusEs;
      shouldUpdate = true;
    }

    if ((currentData.shipdayStatus as string | undefined)?.toUpperCase() !== normalizedStatus) {
      updates.shipdayStatus = normalizedStatus;
      shouldUpdate = true;
    }

    if (trackingLink && !currentData.trackingLink) {
      updates.trackingLink = trackingLink;
      shouldUpdate = true;
    }

    if (driverInfo?.name && currentData.driverName !== driverInfo.name) {
      updates.driverName = driverInfo.name;
      shouldUpdate = true;
    }

    if (driverInfo?.id && currentData.driverId !== String(driverInfo.id)) {
      updates.driverId = String(driverInfo.id);
      shouldUpdate = true;
    }

    if (driverInfo?.phone && currentData.driverPhone !== driverInfo.phone) {
      updates.driverPhone = driverInfo.phone;
      shouldUpdate = true;
    }

    if (mapping.isFinal) {
      if (!currentData.completedAt) {
        updates.completedAt = FieldValue.serverTimestamp();
        shouldUpdate = true;
      }
      if (!currentData.deliveredAt && mapping.status === 'COMPLETED') {
        updates.deliveredAt = FieldValue.serverTimestamp();
        shouldUpdate = true;
      }
    }

    if (!shouldUpdate) {
      await orderDoc.ref.update({ lastShipdaySync: FieldValue.serverTimestamp() });
      return;
    }

    updates.lastShipdaySync = FieldValue.serverTimestamp();

    await orderDoc.ref.update(updates);
    console.log('🆗 Pedido sincronizado desde Shipday', {
      orderId: orderDoc.id,
      shipdayOrderId,
      shipdayStatus: normalizedStatus,
      updates
    });
  } catch (error) {
    console.error('❌ Error sincronizando estado del pedido desde Shipday', {
      shipdayOrderId,
      shipdayStatus,
      error
    });
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const shipdayOrderId = Number(id);
    if (!Number.isFinite(shipdayOrderId) || shipdayOrderId <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid Shipday order identifier',
        message: `El identificador ${id} no es un ID numérico válido de Shipday`
      }, { status: 400 });
    }

    console.log(`🔍 Getting tracking for Shipday order: ${shipdayOrderId}`);

    // 1) Consultar directamente a Shipday con Basic base64
    const url = `${baseUrl()}/orders/${encodeURIComponent(shipdayOrderId)}`;
    let resp: any;
    try {
      resp = await fetchJson(url);
    } catch (err: any) {
      // Fallback to Firestore if Shipday call fails (e.g., 403)
      try {
        const snap = await adminDb
          .collection('orders')
          .where('shipdayOrderId', '==', shipdayOrderId)
          .limit(1)
          .get();
        if (!snap.empty) {
          const data = snap.docs[0].data() as any;
          return NextResponse.json({
            success: true,
            data: {
              orderId: shipdayOrderId,
              status: data.status ?? null,
              trackingLink: data.trackingLink ?? data.shipdayTrackingLink ?? null,
              trackingId: null,
              driverInfo: null,
            }
          }, { status: 200 });
        }
      } catch {}
      // Último recurso: no romper UI
      return NextResponse.json({
        success: true,
        data: {
          orderId: shipdayOrderId,
          status: null,
          trackingLink: null,
          trackingId: null,
          driverInfo: null,
        }
      }, { status: 200 });
    }

    // La API puede devolver objeto o array. Si es array vacío, no 404: devolver sin tracking.
    const orderData = Array.isArray(resp)
      ? (resp.length > 0 ? resp[0] : null)
      : (typeof resp === 'object' ? resp : null);

    if (!orderData) {
      // Devolver 200 sin tracking para no romper UI; tracking aún no disponible
      return NextResponse.json({
        success: true,
        data: {
          orderId: shipdayOrderId,
          status: null,
          trackingLink: null,
          trackingId: null,
          driverInfo: null,
        }
      }, { status: 200 });
    }

    const trackingLink: string | null = orderData.trackingLink || orderData.tracking_link || null;
    const trackingId: string | null = trackingLink
      ? (trackingLink.includes('/') ? (trackingLink.split('/').pop()?.split('?')[0] ?? null) : trackingLink)
      : null;

    const status: string | null = orderData.orderStatus?.orderState || orderData.status || null;
    const driverInfo = orderData.assignedCarrier || null;

    await syncOrderStatusFromShipday(String(shipdayOrderId), status, trackingLink, driverInfo);

    return NextResponse.json({
      success: true,
      data: {
        orderId: shipdayOrderId,
        status,
        trackingLink,
        trackingId,
        driverInfo,
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('❌ Error getting tracking:', error);
    const msg = error?.message || '';
    const isForbidden = msg.includes('403') || msg.toLowerCase().includes('forbidden');
    return NextResponse.json(
      {
        success: false,
        error: isForbidden ? 'Shipday authentication failed or insufficient permissions' : 'Internal server error',
        details: msg,
      },
      { status: isForbidden ? 403 : 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}