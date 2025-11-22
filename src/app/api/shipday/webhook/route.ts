import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Ensure Node runtime; this route only proxies server-to-server webhooks
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FUNCTIONS_URL =
  process.env.FIREBASE_FUNCTIONS_URL ||
  process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL ||
  'https://us-central1-befast-hfkbl.cloudfunctions.net';

export async function POST(request: NextRequest) {
  try {
    // Preserve the raw body exactly as received to keep HMAC signatures valid
    const rawBody = await request.text();

    // Forward Shipday signature header as-is; verification happens in Cloud Functions
    const SIGNATURE_HEADER = 'x-shipday-signature';
    const receivedSignature = request.headers.get(SIGNATURE_HEADER) ?? undefined;

    // Build headers for the proxy request, preserving content-type and signature
    const headers: Record<string, string> = {
      'content-type': request.headers.get('content-type') || 'application/json',
    };
    if (receivedSignature) headers[SIGNATURE_HEADER] = receivedSignature;

    // Best-effort pass-through of context headers (optional)
    const userAgent = request.headers.get('user-agent');
    if (userAgent) headers['user-agent'] = userAgent;
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) headers['x-forwarded-for'] = forwardedFor;

    const response = await fetch(`${FUNCTIONS_URL}/handleShipdayWebhook`, {
      method: 'POST',
      headers,
      body: rawBody,
    });

    const responseText = await response.text();

    // Try to preserve content-type from backend (JSON if possible)
    const contentType = response.headers.get('content-type') || 'application/json';
    return new NextResponse(responseText, {
      status: response.status,
      headers: {
        'content-type': contentType,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-shipday-signature',
    },
  });
}
