import { NextRequest, NextResponse } from 'next/server';
import 'server-only';
import { adminDb } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

function baseUrl() {
  return (process.env.SHIPDAY_API_URL || 'https://api.shipday.com').replace(/\/$/, '');
}

function shipdayHeaders() {
  const apiKey = process.env.SHIPDAY_API_KEY;
  if (!apiKey) throw new Error('SHIPDAY_API_KEY is not configured');
  // Alinear con cliente existente: enviar API key directamente
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

function mapStatus(sourceStatus: string): { mapped: string; es: string } {
  const up = (sourceStatus || '').toUpperCase();
  const map: Record<string, { mapped: string; es: string }> = {
    PENDING: { mapped: 'pending', es: 'buscando repartidor' },
    SEARCHING: { mapped: 'pending', es: 'buscando repartidor' },
    NOT_ASSIGNED: { mapped: 'pending', es: 'buscando repartidor' },
    NOT_ACCEPTED: { mapped: 'pending', es: 'buscando repartidor' },
    NOT_STARTED_YET: { mapped: 'pending', es: 'buscando repartidor' },

    ASSIGNED: { mapped: 'assigned', es: 'repartidor asignado' },
    STARTED: { mapped: 'assigned', es: 'repartidor asignado' },

    PICKED_UP: { mapped: 'picked_up', es: 'en punto de recogida' },

    READY_TO_DELIVER: { mapped: 'in_transit', es: 'en camino' },
    IN_TRANSIT: { mapped: 'in_transit', es: 'en camino' },

    ALREADY_DELIVERED: { mapped: 'delivered', es: 'entregado' },
    DELIVERED: { mapped: 'delivered', es: 'entregado' },
    COMPLETED: { mapped: 'delivered', es: 'entregado' },

    CANCELLED: { mapped: 'cancelled', es: 'cancelado' },
    FAILED: { mapped: 'cancelled', es: 'cancelado' },
    FAILED_DELIVERY: { mapped: 'cancelled', es: 'cancelado' },
    INCOMPLETE: { mapped: 'cancelled', es: 'cancelado' },
  };
  return map[up] || { mapped: up.toLowerCase(), es: up.toLowerCase() };
}

async function addOrderEvent(orderId: string, shipdayOrderId: string, eventType: string, description: string, metadata: any = {}) {
  const { firestore } = await import('firebase-admin');
  await adminDb.collection('orderEvents').add({
    orderId,
    eventType,
    description,
    timestamp: firestore.FieldValue.serverTimestamp(),
    metadata: { ...metadata, shipdayOrderId, source: 'SYNC' },
  });
}

async function updateOneOrder(shipdayOrderId: string) {
  const { firestore } = await import('firebase-admin');
  // Buscar el doc de Firestore por shipdayOrderId
  const snap = await adminDb
    .collection('orders')
    .where('shipdayOrderId', '==', shipdayOrderId)
    .limit(1)
    .get();

  if (snap.empty) {
    return { updated: false, reason: 'order_not_found' };
  }

  const doc = snap.docs[0];
  const current = doc.data() as any;

  // Consultar estado actual en Shipday
  const url = `${baseUrl()}/orders/${encodeURIComponent(shipdayOrderId)}`;
  const resp = await fetchJson(url);
  const orderObj = Array.isArray(resp) ? (resp[0] || null) : (typeof resp === 'object' ? resp : null);

  if (!orderObj) {
    return { updated: false, reason: 'shipday_not_found' };
  }

  const shipdayStatus = orderObj.orderStatus?.orderState || orderObj.status || 'PENDING';
  const mapped = mapStatus(shipdayStatus);
  const trackingLink: string | null = orderObj.trackingLink || orderObj.tracking_link || null;

  const updates: any = {
    status: mapped.mapped,
    statusEs: mapped.es,
    shipdayStatus: shipdayStatus.toUpperCase(),
    lastSyncAt: firestore.FieldValue.serverTimestamp(),
    updatedAt: firestore.FieldValue.serverTimestamp(),
  };
  if (trackingLink) updates.trackingLink = trackingLink;

  const changed = (current.status || null) !== updates.status || (current.shipdayStatus || null) !== updates.shipdayStatus || (!!trackingLink && current.trackingLink !== trackingLink);

  await doc.ref.update(updates);

  if (changed) {
    await addOrderEvent(doc.id, shipdayOrderId, 'ORDER_STATUS_SYNC', 'Estado sincronizado desde Shipday', {
      from: { status: current.status, shipdayStatus: current.shipdayStatus, trackingLink: current.trackingLink || null },
      to: { status: updates.status, shipdayStatus: updates.shipdayStatus, trackingLink: updates.trackingLink || null },
    });
  }

  return { updated: true, changed, status: updates.status, shipdayStatus: updates.shipdayStatus, trackingLink: updates.trackingLink || null };
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) {
  try {
    const { slug } = await ctx.params;
    const safeSlug = slug || [];
    const mode = (safeSlug[0] || '').toLowerCase();

    if (mode === 'order') {
      const shipdayOrderId = req.nextUrl.searchParams.get('shipdayOrderId');
      if (!shipdayOrderId) return NextResponse.json({ ok: false, error: 'shipdayOrderId required' }, { status: 400 });
      try {
        const result = await updateOneOrder(shipdayOrderId);
        return NextResponse.json({ ok: true, result }, { status: 200 });
      } catch (e: any) {
        return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 200 });
      }
    }

    if (mode === 'active') {
      const { firestore } = await import('firebase-admin');
      const since = new Date(Date.now() - 1000 * 60 * 60 * 48); // 48h
      const activeStatuses = ['pending', 'assigned', 'in_transit'];

      // Tomar pedidos recientes activos de Firestore para minimizar llamadas
      const q = await adminDb
        .collection('orders')
        .where('createdAt', '>=', firestore.Timestamp.fromDate(since))
        .orderBy('createdAt', 'desc')
        .limit(400)
        .get();

      const candidates = q.docs
        .map(d => ({ id: d.id, shipdayOrderId: (d.data() as any).shipdayOrderId, status: (d.data() as any).status }))
        .filter(x => x.shipdayOrderId && activeStatuses.includes((x.status || '').toLowerCase()))
        .slice(0, 100); // limitar lote

      const results: any[] = [];
      for (const c of candidates) {
        try {
          const r = await updateOneOrder(String(c.shipdayOrderId));
          results.push({ shipdayOrderId: c.shipdayOrderId, ...r });
        } catch (e: any) {
          results.push({ shipdayOrderId: c.shipdayOrderId, ok: false, error: e?.message || String(e) });
        }
      }

      return NextResponse.json({ ok: true, count: results.length, results }, { status: 200 });
    }

    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || String(error) }, { status: 500 });
  }
}
