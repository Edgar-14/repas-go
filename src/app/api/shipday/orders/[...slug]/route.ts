import { NextRequest, NextResponse } from 'next/server';
import 'server-only';
import { adminDb } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

// Helper: Build Shipday Basic Auth headers (API key from server env)
function shipdayHeaders() {
  const apiKey = process.env.SHIPDAY_API_KEY;
  if (!apiKey) throw new Error('SHIPDAY_API_KEY is not configured');
  const basic = Buffer.from(`${apiKey}:`).toString('base64');
  return {
    Authorization: `Basic ${basic}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  } as Record<string, string>;
}

// Helper: Fetch JSON with proper error handling
async function fetchJson(url: string) {
  const res = await fetch(url, { headers: shipdayHeaders(), cache: 'no-store' });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Shipday API error: ${res.status} - ${text}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    return text ? { raw: text } : {};
  }
}

// Extract trackingId from a Shipday tracking URL
function extractTrackingIdFromUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    // Expect path like /order/progress/{trackingId}
    const idx = parts.findIndex((p) => p.toLowerCase() === 'progress');
    if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];
  } catch {}
  return null;
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) {
  try {
    const { slug } = await ctx.params;
    if (!slug || slug.length === 0) {
      return NextResponse.json({ error: 'Invalid route' }, { status: 404 });
    }

    // Case A: /api/shipday/orders/progress/{trackingId}
    if (slug[0] === 'progress') {
      const trackingId = slug[1];
      if (!trackingId) {
        return NextResponse.json({ error: 'Missing trackingId' }, { status: 400 });
      }
      const includeStaticData = req.nextUrl.searchParams.get('includeStaticData');
      const flag = includeStaticData === 'true' ? 'true' : 'false';
      const baseUrl = process.env.SHIPDAY_API_URL || 'https://api.shipday.com';
      const url = `${baseUrl.replace(/\/$/, '')}/order/progress/${encodeURIComponent(trackingId)}?isStaticDataRequired=${flag}`;
      const progress = await fetchJson(url);
      return NextResponse.json(progress, { status: 200 });
    }

    // Case B: /api/shipday/orders/{shipdayOrderId}/tracking
    if (slug.length >= 2 && slug[1] === 'tracking') {
      const shipdayOrderId = slug[0];
      if (!shipdayOrderId) {
        return NextResponse.json({ error: 'Missing shipdayOrderId' }, { status: 400 });
      }

      // 1) Try Firestore cached trackingLink/status
      try {
        const snap = await adminDb
          .collection('orders')
          .where('shipdayOrderId', '==', shipdayOrderId)
          .limit(1)
          .get();
        if (!snap.empty) {
          const doc = snap.docs[0];
          const data = doc.data() as any;
          const fsTrackingLink = data.trackingLink || data.shipdayTrackingLink || null;
          if (fsTrackingLink) {
            const trackingId = extractTrackingIdFromUrl(fsTrackingLink);
            return NextResponse.json(
              {
                trackingLink: fsTrackingLink,
                trackingId,
                status: data.status || null,
                shipdayStatus: data.shipdayStatus || null,
              },
              { status: 200 },
            );
          }
        }
      } catch (e) {
        // Firestore fallback silently; continue with Shipday lookup
      }

      // 2) Query Shipday order details to derive tracking
      const baseUrl = process.env.SHIPDAY_API_URL || 'https://api.shipday.com';
      const orderUrl = `${baseUrl.replace(/\/$/, '')}/orders/${encodeURIComponent(shipdayOrderId)}`;
      const orderRes = await fetchJson(orderUrl);

      // API may return object or array
      const orderObj = Array.isArray(orderRes) ? orderRes[0] : orderRes;
      const trackingLink =
        orderObj?.trackingLink || orderObj?.tracking_link || null;
      const trackingId = extractTrackingIdFromUrl(trackingLink);

      return NextResponse.json(
        {
          trackingLink: trackingLink || (trackingId
            ? `${baseUrl.replace(/\/$/, '')}/order/progress/${trackingId}?isStaticDataRequired=true`
            : null),
          trackingId: trackingId || null,
          raw: orderObj || null,
        },
        { status: 200 },
      );
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal Server Error', details: error?.message || String(error) },
      { status: 500 },
    );
  }
}
