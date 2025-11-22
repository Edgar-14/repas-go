/**
 * Backend Connectivity Test Component
 * Tests if forms and dashboards can connect to real Firestore data
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, query, limit, orderBy } from 'firebase/firestore';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

interface CollectionTest {
  name: string;
  exists: boolean;
  documentsCount: number;
  lastDocument?: any;
  error?: string;
}

interface ConnectionTest {
  firebaseInit: boolean;
  collections: CollectionTest[];
  writeTest: boolean;
  readTest: boolean;
}

export default function BackendConnectivityTest() {
  const [testResults, setTestResults] = useState<ConnectionTest>({
    firebaseInit: false,
    collections: [],
    writeTest: false,
    readTest: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [testData, setTestData] = useState({
    businessName: '',
    driverName: '',
    orderAmount: ''
  });
  const { toast } = useToast();

  const COLLECTIONS_TO_TEST = [
    'drivers',
    'businesses', 
    'orders',
    'walletTransactions',
    'driverApplications',
    'supportTickets',
    'creditTransactions'
  ];

  const testFirebaseConnection = async () => {
    setIsLoading(true);
    const results: ConnectionTest = {
      firebaseInit: false,
      collections: [],
      writeTest: false,
      readTest: false
    };

    try {
      // Test 1: Firebase initialization
      if (db) {
        results.firebaseInit = true;
      }

      // Test 2: Collection existence and document count
      for (const collectionName of COLLECTIONS_TO_TEST) {
        try {
          const collectionRef = collection(db, collectionName);
          const snapshot = await getDocs(query(collectionRef, limit(5)));
          
          const collectionTest: CollectionTest = {
            name: collectionName,
            exists: true,
            documentsCount: snapshot.size,
            lastDocument: snapshot.docs[0]?.data()
          };

          results.collections.push(collectionTest);
        } catch (error: any) {
          results.collections.push({
            name: collectionName,
            exists: false,
            documentsCount: 0,
            error: error.message
          });
        }
      }

      // Test 3: Write capability
      try {
        const testDoc = await addDoc(collection(db, 'connectivity_tests'), {
          testType: 'WRITE_TEST',
          timestamp: new Date(),
          source: 'BACKEND_CONNECTIVITY_TEST'
        });
        
        if (testDoc.id) {
          results.writeTest = true;
        }
      } catch (error: any) {
        console.error('Write test failed:', error);
      }

      // Test 4: Read capability  
      try {
        const readSnapshot = await getDocs(query(
          collection(db, 'connectivity_tests'), 
          orderBy('timestamp', 'desc'),
          limit(1)
        ));
        
        if (readSnapshot.size > 0) {
          results.readTest = true;
        }
      } catch (error: any) {
        console.error('Read test failed:', error);
      }

      setTestResults(results);
      
      toast({
        title: 'Prueba de conectividad completada',
        description: `${results.collections.filter(c => c.exists).length}/${COLLECTIONS_TO_TEST.length} colecciones disponibles`
      });

    } catch (error: any) {
      toast({
        title: 'Error en prueba de conectividad',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testBusinessForm = async () => {
    try {
      const businessData = {
        businessName: testData.businessName,
        contactName: 'Test Contact',
        email: 'test@example.com',
        phone: '5555555555',
        address: 'Test Address',
        coordinates: { lat: 19.4326, lng: -99.1332 },
        rfc: 'TEST123456',
        status: 'ACTIVE',
        credits: 10,
        totalOrders: 0,
        totalSpent: 0,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'businesses'), businessData);
      
      toast({
        title: 'Negocio creado exitosamente',
        description: `ID: ${docRef.id}`,
      });

      setTestData(prev => ({ ...prev, businessName: '' }));
    } catch (error: any) {
      toast({
        title: 'Error creando negocio',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const testDriverForm = async () => {
    try {
      const driverData = {
        fullName: testData.driverName,
        email: 'driver@example.com',
        phone: '5555555555',
        status: 'ACTIVE',
        walletBalance: 0,
        pendingDebts: 0,
        driverDebtLimit: 300,
        ingreso_bruto_mensual: 0,
        isActive: true,
        imssStatus: 'PENDING',
        currentClassification: 'Trabajador Independiente',
        trainingCompleted: false,
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
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'drivers'), driverData);
      
      toast({
        title: 'Conductor creado exitosamente',
        description: `ID: ${docRef.id}`,
      });

      setTestData(prev => ({ ...prev, driverName: '' }));
    } catch (error: any) {
      toast({
        title: 'Error creando conductor',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const testOrderForm = async () => {
    try {
      const orderData = {
        orderId: `TEST_${Date.now()}`,
        businessId: 'test_business',
        source: 'BEFAST_DELIVERY',
        paymentMethod: 'CASH',
        status: 'PENDING',
        customer: {
          name: 'Cliente Test',
          phone: '5555555555',
          address: 'Dirección Test',
          coordinates: { lat: 19.4326, lng: -99.1332 }
        },
        pickup: {
          name: 'Negocio Test',
          address: 'Dirección Pickup Test',
          coordinates: { lat: 19.4326, lng: -99.1332 }
        },
        totalOrderValue: parseFloat(testData.orderAmount) || 0,
        tip: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      
      toast({
        title: 'Orden creada exitosamente',
        description: `ID: ${docRef.id}`,
      });

      setTestData(prev => ({ ...prev, orderAmount: '' }));
    } catch (error: any) {
      toast({
        title: 'Error creando orden',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    testFirebaseConnection();
  }, []);

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : (
      <XCircle className="h-5 w-5 text-red-600" />
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Prueba de Conectividad Backend
        </h1>
        <p className="text-gray-600">
          Validación de conectividad entre frontend, Firestore y Cloud Functions
        </p>
      </div>

      {/* Firebase Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Firebase Connection Status
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between">
              <span>Firebase Initialized</span>
              {getStatusIcon(testResults.firebaseInit)}
            </div>
            <div className="flex items-center justify-between">
              <span>Write Capability</span>
              {getStatusIcon(testResults.writeTest)}
            </div>
            <div className="flex items-center justify-between">
              <span>Read Capability</span>
              {getStatusIcon(testResults.readTest)}
            </div>
            <div className="flex items-center justify-between">
              <span>Collections Available</span>
              <span className="font-medium">
                {testResults.collections.filter(c => c.exists).length}/{COLLECTIONS_TO_TEST.length}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Collections Status */}
      <Card>
        <CardHeader>
          <CardTitle>Firestore Collections Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {testResults.collections.map((collection) => (
              <div key={collection.name} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <span className="font-medium">{collection.name}</span>
                  {collection.error && (
                    <p className="text-sm text-red-600">{collection.error}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {collection.documentsCount} docs
                  </span>
                  {getStatusIcon(collection.exists)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Form Testing */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Test Business Form</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="businessName">Nombre del Negocio</Label>
              <Input
                id="businessName"
                value={testData.businessName}
                onChange={(e) => setTestData(prev => ({ ...prev, businessName: e.target.value }))}
                placeholder="Ej: Restaurante Test"
              />
            </div>
            <Button onClick={testBusinessForm} className="w-full">
              Crear Negocio Test
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Driver Form</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="driverName">Nombre del Conductor</Label>
              <Input
                id="driverName"
                value={testData.driverName}
                onChange={(e) => setTestData(prev => ({ ...prev, driverName: e.target.value }))}
                placeholder="Ej: Juan Pérez"
              />
            </div>
            <Button onClick={testDriverForm} className="w-full">
              Crear Conductor Test
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Order Form</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="orderAmount">Monto de la Orden</Label>
              <Input
                id="orderAmount"
                type="number"
                value={testData.orderAmount}
                onChange={(e) => setTestData(prev => ({ ...prev, orderAmount: e.target.value }))}
                placeholder="Ej: 150"
              />
            </div>
            <Button onClick={testOrderForm} className="w-full">
              Crear Orden Test
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Refresh Button */}
      <div className="text-center">
        <Button 
          onClick={testFirebaseConnection} 
          disabled={isLoading}
          variant="outline"
          className="gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          Refresh Connectivity Test
        </Button>
      </div>
    </div>
  );
}
