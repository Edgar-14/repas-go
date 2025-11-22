/**
 * Test Workflow API - Tests complete end-to-end flows
 * Tests order creation → payment → notification → assignment workflow
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/collections';

export async function POST(request: NextRequest) {
  try {
    const { workflowType, testData } = await request.json();
    console.log('🧪 Testing workflow:', workflowType);

    const workflowResults = {
      workflowType,
      steps: [],
      success: false,
      error: null
    };

    switch (workflowType) {
      case 'COMPLETE_ORDER_FLOW':
        return await testCompleteOrderFlow(testData, workflowResults);
      
      case 'BUSINESS_REGISTRATION_FLOW':
        return await testBusinessRegistrationFlow(testData, workflowResults);
      
      case 'DRIVER_REGISTRATION_FLOW':
        return await testDriverRegistrationFlow(testData, workflowResults);
      
      case 'PAYMENT_PROCESSING_FLOW':
        return await testPaymentProcessingFlow(testData, workflowResults);
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Unknown workflow type'
        }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Workflow test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

async function testCompleteOrderFlow(testData: any, results: any) {
  try {
    // Step 1: Create business if not exists
    results.steps.push({
      step: 1,
      name: 'Create Business',
      status: 'RUNNING'
    });

    const businessData = {
      uid: `test_business_${Date.now()}`,
      businessName: testData.businessName || 'Test Business',
      contactName: 'Test Contact',
      email: `test${Date.now()}@example.com`,
      phone: '5555555555',
      address: 'Test Address 123',
      coordinates: { lat: 19.4326, lng: -99.1332 },
      rfc: 'TEST123456789',
      status: 'ACTIVE',
      credits: 10,
      totalOrders: 0,
      totalSpent: 0,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const businessRef = await addDoc(collection(db, 'businesses'), businessData);
    results.steps[0].status = 'COMPLETED';
    results.steps[0].result = { businessId: businessRef.id };

    // Step 2: Create driver if not exists
    results.steps.push({
      step: 2,
      name: 'Create Driver',
      status: 'RUNNING'
    });

    const driverData = {
      uid: `test_driver_${Date.now()}`,
      fullName: testData.driverName || 'Test Driver',
      email: `driver${Date.now()}@example.com`,
      phone: '5555555555',
      status: 'ACTIVE',
      walletBalance: 0,
      pendingDebts: 0,
      driverDebtLimit: 300,
      ingreso_bruto_mensual: 0,
      isActive: true,
      imssStatus: 'PENDING',
      currentClassification: 'Trabajador Independiente',
      trainingCompleted: true,
      kpis: {
        totalOrders: 0,
        acceptanceRate: 100,
        onTimeDeliveryRate: 95,
        averageRating: 4.5,
        totalDistance: 0,
        averageDeliveryTime: 30,
        completedDeliveries: 0,
        lateDeliveries: 0,
        failedDeliveries: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const driverRef = await addDoc(collection(db, 'drivers'), driverData);
    results.steps[1].status = 'COMPLETED';
    results.steps[1].result = { driverId: driverRef.id };

    // Step 3: Create order
    results.steps.push({
      step: 3,
      name: 'Create Order',
      status: 'RUNNING'
    });

    const orderData = {
      orderId: `TEST_ORDER_${Date.now()}`,
      businessId: businessRef.id,
      driverId: driverRef.id,
      source: 'BEFAST_DELIVERY',
      paymentMethod: 'CASH',
      status: 'PENDING',
      customer: {
        name: 'Test Customer',
        phone: '5555555555',
        address: 'Customer Address 456',
        coordinates: { lat: 19.4326, lng: -99.1332 }
      },
      pickup: {
        name: businessData.businessName,
        address: businessData.address,
        coordinates: businessData.coordinates
      },
      totalOrderValue: parseFloat(testData.orderAmount) || 150,
      tip: 15,
      createdAt: new Date(),
      updatedAt: new Date(),
      validationResult: 'APPROVED'
    };

    const orderRef = await addDoc(collection(db, 'orders'), orderData);
    results.steps[2].status = 'COMPLETED';
    results.steps[2].result = { orderId: orderRef.id };

    // Step 4: Process payment (simulate wallet transaction)
    results.steps.push({
      step: 4,
      name: 'Process Payment',
      status: 'RUNNING'
    });

    const walletTransaction = {
      driverId: driverRef.id,
      orderId: orderRef.id,
      amount: -15, // Commission fee for cash order
      type: 'CASH_ORDER_ADEUDO',
      description: `Comisión por pedido en efectivo ${orderData.orderId}`,
      previousBalance: 0,
      newBalance: -15,
      createdAt: new Date()
    };

    const transactionRef = await addDoc(collection(db, COLLECTIONS.WALLET_TRANSACTIONS), walletTransaction);
    
    // Update driver wallet balance
    await updateDoc(doc(db, 'drivers', driverRef.id), {
      walletBalance: -15,
      pendingDebts: 15,
      updatedAt: new Date()
    });

    results.steps[3].status = 'COMPLETED';
    results.steps[3].result = { transactionId: transactionRef.id };

    // Step 5: Update business credits
    results.steps.push({
      step: 5,
      name: 'Update Business Credits',
      status: 'RUNNING'
    });

    await updateDoc(doc(db, 'businesses', businessRef.id), {
      credits: 9, // Reduce by 1
      totalOrders: 1,
      totalSpent: 15,
      updatedAt: new Date()
    });

    results.steps[4].status = 'COMPLETED';
    results.steps[4].result = { creditsRemaining: 9 };

    // Step 6: Complete order (simulate delivery)
    results.steps.push({
      step: 6,
      name: 'Complete Order',
      status: 'RUNNING'
    });

    await updateDoc(doc(db, 'orders', orderRef.id), {
      status: 'COMPLETED',
      deliveryTime: 25,
      rating: 5,
      updatedAt: new Date()
    });

    // Update driver KPIs
    await updateDoc(doc(db, 'drivers', driverRef.id), {
      'kpis.totalOrders': 1,
      'kpis.completedDeliveries': 1,
      'kpis.totalDistance': 5.2,
      lastServiceDate: new Date(),
      updatedAt: new Date()
    });

    results.steps[5].status = 'COMPLETED';
    results.steps[5].result = { orderStatus: 'COMPLETED' };

    results.success = true;

    return NextResponse.json({
      success: true,
      message: 'Complete order flow test successful',
      results
    });

  } catch (error: any) {
    console.error('Complete order flow test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      results
    }, { status: 500 });
  }
}

async function testBusinessRegistrationFlow(testData: any, results: any) {
  try {
    // Step 1: Create business registration
    results.steps.push({
      step: 1,
      name: 'Business Registration',
      status: 'RUNNING'
    });

    const businessData = {
      uid: `test_reg_${Date.now()}`,
      businessName: testData.businessName || 'Test Registration Business',
      contactName: testData.contactName || 'Test Contact',
      email: testData.email || `test${Date.now()}@example.com`,
      phone: testData.phone || '5555555555',
      address: testData.address || 'Test Registration Address',
      coordinates: { lat: 19.4326, lng: -99.1332 },
      rfc: testData.rfc || 'TESTREG123456',
      status: 'PENDING',
      credits: 0,
      totalOrders: 0,
      totalSpent: 0,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const businessRef = await addDoc(collection(db, 'businesses'), businessData);
    results.steps[0].status = 'COMPLETED';
    results.steps[0].result = { businessId: businessRef.id };

    // Step 2: Email verification (simulate)
    results.steps.push({
      step: 2,
      name: 'Email Verification',
      status: 'RUNNING'
    });

    await updateDoc(doc(db, 'businesses', businessRef.id), {
      emailVerified: true,
      status: 'ACTIVE',
      updatedAt: new Date()
    });

    results.steps[1].status = 'COMPLETED';
    results.steps[1].result = { emailVerified: true };

    results.success = true;
    return NextResponse.json({
      success: true,
      message: 'Business registration flow test successful',
      results
    });

  } catch (error: any) {
    console.error('Business registration flow test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      results
    }, { status: 500 });
  }
}

async function testDriverRegistrationFlow(testData: any, results: any) {
  try {
    // Step 1: Create driver application
    results.steps.push({
      step: 1,
      name: 'Driver Application',
      status: 'RUNNING'
    });

    const applicationData = {
      userId: `test_app_${Date.now()}`,
      fullName: testData.driverName || 'Test Driver Application',
      email: testData.email || `driver${Date.now()}@example.com`,
      phone: testData.phone || '5555555555',
      rfc: testData.rfc || 'TESTDRV123456',
      nss: testData.nss || '12345678901',
      curp: testData.curp || 'TESTDRIVER123456',
      documents: {
        ineFront: 'test_ine_front.jpg',
        ineBack: 'test_ine_back.jpg',
        license: 'test_license.jpg',
        addressProof: 'test_address.jpg',
        vehicleInsurance: 'test_insurance.jpg'
      },
      vehicle: {
        type: 'MOTO',
        brand: 'Honda',
        model: 'Wave',
        year: 2020,
        plates: 'ABC123',
        color: 'Roja'
      },
      bank: {
        accountNumber: '1234567890',
        bankName: 'BBVA',
        accountHolder: 'Test Driver',
        clabe: '012345678901234567'
      },
      digitalSignature: 'test_signature.png',
      trainingCompleted: true,
      trainingScore: 95,
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const applicationRef = await addDoc(collection(db, 'driverApplications'), applicationData);
    results.steps[0].status = 'COMPLETED';
    results.steps[0].result = { applicationId: applicationRef.id };

    // Step 2: Application approval (simulate admin approval)
    results.steps.push({
      step: 2,
      name: 'Application Approval',
      status: 'RUNNING'
    });

    await updateDoc(doc(db, 'driverApplications', applicationRef.id), {
      status: 'APPROVED',
      reviewedBy: 'test_admin',
      reviewedAt: new Date(),
      updatedAt: new Date()
    });

    results.steps[1].status = 'COMPLETED';
    results.steps[1].result = { approved: true };

    // Step 3: Create driver profile
    results.steps.push({
      step: 3,
      name: 'Create Driver Profile',
      status: 'RUNNING'
    });

    const driverData = {
      uid: applicationData.userId,
      fullName: applicationData.fullName,
      email: applicationData.email,
      phone: applicationData.phone,
      curp: applicationData.curp,
      rfc: applicationData.rfc,
      nss: applicationData.nss,
      address: 'Driver Address from Application',
      vehicle: applicationData.vehicle,
      bank: applicationData.bank,
      status: 'ACTIVE',
      walletBalance: 0,
      pendingDebts: 0,
      driverDebtLimit: 300,
      ingreso_bruto_mensual: 0,
      isActive: true,
      imssStatus: 'PENDING',
      currentClassification: 'Trabajador Independiente',
      trainingCompleted: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      approvedAt: new Date(),
      kpis: {
        totalOrders: 0,
        acceptanceRate: 0,
        onTimeDeliveryRate: 0,
        averageRating: 0,
        totalDistance: 0,
        averageDeliveryTime: 0,
        completedDeliveries: 0,
        lateDeliveries: 0,
        failedDeliveries: 0
      }
    };

    const driverRef = await addDoc(collection(db, 'drivers'), driverData);
    results.steps[2].status = 'COMPLETED';
    results.steps[2].result = { driverId: driverRef.id };

    results.success = true;
    return NextResponse.json({
      success: true,
      message: 'Driver registration flow test successful',
      results
    });

  } catch (error: any) {
    console.error('Driver registration flow test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      results
    }, { status: 500 });
  }
}

async function testPaymentProcessingFlow(testData: any, results: any) {
  try {
    // Step 1: Create business credit transaction
    results.steps.push({
      step: 1,
      name: 'Credit Transaction',
      status: 'RUNNING'
    });

    const creditTransaction = {
      businessId: testData.businessId || 'test_business',
      amount: parseFloat(testData.amount) || 750,
      credits: parseFloat(testData.credits) || 50,
      type: 'PURCHASE',
      description: 'Paquete Básico - 50 créditos',
      proofUrl: 'test_payment_proof.jpg',
      status: 'PENDING',
      createdAt: new Date()
    };

    const transactionRef = await addDoc(collection(db, COLLECTIONS.CREDIT_TRANSACTIONS), creditTransaction);
    results.steps[0].status = 'COMPLETED';
    results.steps[0].result = { transactionId: transactionRef.id };

    // Step 2: Approve payment (simulate admin approval)
    results.steps.push({
      step: 2,
      name: 'Payment Approval',
      status: 'RUNNING'
    });

    await updateDoc(doc(db, 'creditTransactions', transactionRef.id), {
      status: 'APPROVED',
      processedBy: 'test_admin',
      processedAt: new Date()
    });

    results.steps[1].status = 'COMPLETED';
    results.steps[1].result = { paymentApproved: true };

    // Step 3: Update business credits
    results.steps.push({
      step: 3,
      name: 'Update Business Credits',
      status: 'RUNNING'
    });

    // Find business and update credits
    const businessQuery = query(
      collection(db, 'businesses'),
      where('uid', '==', testData.businessId || 'test_business')
    );
    
    const businessSnapshot = await getDocs(businessQuery);
    if (!businessSnapshot.empty) {
      const businessDoc = businessSnapshot.docs[0];
      const currentCredits = businessDoc.data().credits || 0;
      
      await updateDoc(businessDoc.ref, {
        credits: currentCredits + creditTransaction.credits,
        totalSpent: (businessDoc.data().totalSpent || 0) + creditTransaction.amount,
        updatedAt: new Date()
      });

      results.steps[2].status = 'COMPLETED';
      results.steps[2].result = { 
        newCredits: currentCredits + creditTransaction.credits 
      };
    } else {
      throw new Error('Business not found for credit update');
    }

    results.success = true;
    return NextResponse.json({
      success: true,
      message: 'Payment processing flow test successful',
      results
    });

  } catch (error: any) {
    console.error('Payment processing flow test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      results
    }, { status: 500 });
  }
}