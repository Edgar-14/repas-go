import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/collections';

export async function POST(request: NextRequest) {
  try {
    const { driverId, driverData } = await request.json();

    if (!driverId || !driverData) {
      return NextResponse.json({
        success: false,
        error: 'Missing driverId or driverData'
      }, { status: 400 });
    }

    console.log('🚀 Creating driver profile:', driverId);

    // Check if driver already exists
    const driverRef = doc(db, COLLECTIONS.DRIVERS, driverId);
    const existingDoc = await getDoc(driverRef);

    if (existingDoc.exists()) {
      console.log('⚠️ Driver already exists, updating...');
    }

    // Create/update driver profile
    await setDoc(driverRef, {
      ...driverData,
      createdAt: driverData.createdAt || new Date(),
      updatedAt: new Date()
    }, { merge: true });

    console.log('✅ Driver profile created/updated successfully');

    return NextResponse.json({
      success: true,
      message: `Driver profile ${existingDoc.exists() ? 'updated' : 'created'} successfully`,
      driverId
    });

  } catch (error: any) {
    console.error('❌ Error creating driver profile:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create driver profile',
      details: error.message
    }, { status: 500 });
  }
}

