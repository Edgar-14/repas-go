/**
 * Order Validation API - Connects to validateOrderAssignment function
 */

import { NextRequest, NextResponse } from 'next/server';

const FUNCTIONS_URL = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || 'https://us-central1-befast-hfkbl.cloudfunctions.net';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Forward request to order validation function
    const response = await fetch(`${FUNCTIONS_URL}/validateOrderAssignment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Order validation API error:', error);
    return NextResponse.json(
      { error: 'Order validation failed' },
      { status: 500 }
    );
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