import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // This endpoint will be called from the frontend to get user info
    return NextResponse.json({
      success: true,
      message: 'This endpoint should be called from frontend with user context'
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userUid, userEmail, userClaims } = await request.json();
    
    console.log('🔍 DEBUG USER INFO:');
    console.log('UID:', userUid);
    console.log('Email:', userEmail);
    console.log('Claims:', userClaims);
    
    return NextResponse.json({
      success: true,
      userInfo: {
        uid: userUid,
        email: userEmail,
        claims: userClaims
      }
    });
  } catch (error: any) {
    console.error('❌ Error in debug endpoint:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

