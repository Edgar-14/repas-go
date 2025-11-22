import { NextRequest, NextResponse } from 'next/server';
import 'server-only';
import { adminDb } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

// Helpers
function parseLimit(param: string | null, def = 50, max = 200) {
  const n = Number(param);
  if (!Number.isFinite(n) || n <= 0) return def;
  return Math.min(n, max);
}

function normalizeOrder(doc: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>) {
  const d = doc.data() as any;
  return {
    id: doc.id,
    orderNumber: d.orderNumber ?? null,
    shipdayOrderId: d.shipdayOrderId ?? null,
    orderType: d.orderType ?? null,
    source: d.source ?? null,
    businessId: d.businessId ?? d.business?.id ?? null,
    businessName: d.businessName ?? d.business?.name ?? null,
    paymentMethod: d.paymentMethod ?? null,
    status: d.status ?? null,
    statusEs: d.statusEs ?? null,
    shipdayStatus: d.shipdayStatus ?? null,
    trackingLink: d.trackingLink ?? d.shipdayTrackingLink ?? null,
    customer: d.customer ?? null,
    pickup: d.pickup ?? null,
    deliveryFee: d.deliveryFee ?? null,
    tip: d.tip ?? null,
    totalAmount: d.totalAmount ?? null,
    driverId: d.driverId ?? null,
    timestamps: {
      createdAt: d.createdAt ?? null,
      updatedAt: d.updatedAt ?? null,
      assignedAt: d.assignedAt ?? null,
      completedAt: d.completedAt ?? null,
      lastSyncAt: d.lastSyncAt ?? null,
    },
  };
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) {
  try {
    const { slug } = await ctx.params;
    if (!slug || slug.length === 0) {
      return NextResponse.json({ error: 'Invalid route' }, { status: 404 });
    }

    const segment = (slug[0] || '').toLowerCase();
    const search = req.nextUrl.searchParams;

    // /api/orders/active?limit=50
    if (segment === 'active') {
      const limit = parseLimit(search.get('limit'), 75);
      const activeStatuses = ['pending', 'assigned', 'in_transit'];

      // Buscar pedidos recientes activos (últimas 48h) para performance
      const since = new Date(Date.now() - 1000 * 60 * 60 * 48);

      const q = await adminDb
        .collection('orders')
        .where('createdAt', '>=', (global as any).admin?.firestore?.Timestamp?.fromDate
          ? (global as any).admin.firestore.Timestamp.fromDate(since)
          : (await import('firebase-admin')).firestore.Timestamp.fromDate(since))
        .orderBy('createdAt', 'desc')
        .limit(400) // luego filtramos por estado
        .get();

      const items = q.docs
        .map(normalizeOrder)
        .filter((o) => activeStatuses.includes((o.status || '').toLowerCase()))
        .slice(0, limit);

      return NextResponse.json({ items, count: items.length }, { status: 200 });
    }

    // /api/orders/by-business?businessId=...&limit=...
    if (segment === 'by-business') {
      const businessId = search.get('businessId');
      if (!businessId) {
        return NextResponse.json({ error: 'Missing businessId' }, { status: 400 });
      }
      const limit = parseLimit(search.get('limit'), 100);

      const q = await adminDb
        .collection('orders')
        .where('businessId', '==', businessId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      const items = q.docs.map(normalizeOrder);
      return NextResponse.json({ items, count: items.length }, { status: 200 });
    }

    // /api/orders/by-driver?driverId=...&activeOnly=true|false&limit=...
    if (segment === 'by-driver') {
      const driverId = search.get('driverId');
      if (!driverId) {
        return NextResponse.json({ error: 'Missing driverId' }, { status: 400 });
      }
      const limit = parseLimit(search.get('limit'), 50);
      const activeOnly = (search.get('activeOnly') ?? 'true').toLowerCase() === 'true';
      const activeStatuses = ['pending', 'assigned', 'in_transit'];

      const q = await adminDb
        .collection('orders')
        .where('driverId', '==', driverId)
        .orderBy('createdAt', 'desc')
        .limit(300)
        .get();

      let items = q.docs.map(normalizeOrder);
      if (activeOnly) items = items.filter((o) => activeStatuses.includes((o.status || '').toLowerCase()));
      items = items.slice(0, limit);

      return NextResponse.json({ items, count: items.length }, { status: 200 });
    }

    // /api/orders/events?orderId=...&limit=...
    if (segment === 'events') {
      const orderId = search.get('orderId');
      if (!orderId) {
        return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
      }
      const limit = parseLimit(search.get('limit'), 50);

      const q = await adminDb
        .collection('orderEvents')
        .where('orderId', '==', orderId)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      const items = q.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      return NextResponse.json({ items, count: items.length }, { status: 200 });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal Server Error', details: error?.message || String(error) },
      { status: 500 },
    );
  }
}
