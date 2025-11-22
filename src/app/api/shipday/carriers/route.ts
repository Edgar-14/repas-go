import { NextRequest, NextResponse } from 'next/server';
import 'server-only';

export const runtime = 'nodejs';

function baseUrl() {
  return (process.env.SHIPDAY_API_URL || 'https://api.shipday.com').replace(/\/$/, '');
}

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

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, { ...init, headers: { ...(init?.headers || {}), ...shipdayHeaders() }, cache: 'no-store' });
  const text = await res.text();
  if (!res.ok) throw new Error(`Shipday API error: ${res.status} - ${text}`);
  try { return JSON.parse(text); } catch { return text ? { raw: text } : {}; }
}

export async function GET() {
  try {
    const url = `${baseUrl()}/carriers`;
    const data = await fetchJson(url, { method: 'GET' });
    return NextResponse.json(Array.isArray(data) ? data : (data?.carriers || []), { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to list carriers', details: error?.message || String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Normalizar payload básico
    const payload = {
      carrierName: body?.carrierName || body?.name,
      carrierEmail: body?.carrierEmail || body?.email,
      carrierPhoneNumber: body?.carrierPhoneNumber || body?.phoneNumber || body?.phone,
      vehicleType: body?.vehicleType || 'car',
      licensePlate: body?.licensePlate || body?.plateNumber || '',
      isActive: typeof body?.isActive === 'boolean' ? body.isActive : true,
    };

    if (!payload.carrierName || !payload.carrierPhoneNumber) {
      return NextResponse.json({ error: 'carrierName and carrierPhoneNumber are required' }, { status: 400 });
    }

    const url = `${baseUrl()}/carriers`;
    const data = await fetchJson(url, { method: 'POST', body: JSON.stringify(payload) });
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to create carrier', details: error?.message || String(error) }, { status: 500 });
  }
}
