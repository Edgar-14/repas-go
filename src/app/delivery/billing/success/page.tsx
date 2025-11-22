'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, CreditCard, Package, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useBusinessData } from '@/hooks/useRealtimeData';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/collections';

interface CreditTransaction {
  id: string;
  businessId: string;
  amount: number;
  credits: number;
  type: 'PURCHASE' | 'USAGE' | 'REFUND' | 'ADJUSTMENT';
  description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: any;
  stripeSessionId?: string;
}

export default function BillingSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { business, loading: businessLoading } = useBusinessData(user?.uid || null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [recentTransaction, setRecentTransaction] = useState<CreditTransaction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (sessionId && user?.uid) {
      // Get real-time transaction data for this session
      const transactionsQuery = query(
        collection(db, COLLECTIONS.CREDIT_TRANSACTIONS),
        where('businessId', '==', user.uid),
        where('stripeSessionId', '==', sessionId),
        orderBy('createdAt', 'desc'),
        limit(1)
      );

      const unsubscribe = onSnapshot(transactionsQuery, (snapshot) => {
        if (!snapshot.empty) {
          const transactionData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as CreditTransaction;
          setRecentTransaction(transactionData);
          setSessionData({
            id: sessionId,
            amount: transactionData.amount,
            credits: transactionData.credits,
            packageName: getPackageName(transactionData.credits),
            description: transactionData.description
          });
        } else {
          // Fallback data if transaction not found
          setSessionData({
            id: sessionId,
            amount: 1500,
            credits: 100,
            packageName: 'Empresarial'
          });
        }
        setLoading(false);
      }, (error) => {
        console.error('Error loading transaction:', error);
        // Set fallback data on error
        setSessionData({
          id: sessionId,
          amount: 1500,
          credits: 100,
          packageName: 'Empresarial'
        });
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, [searchParams, user]);

  const getPackageName = (credits: number): string => {
    if (credits >= 250) return 'Corporativo';
    if (credits >= 100) return 'Empresarial';
    if (credits >= 50) return 'Básico';
    return 'Personalizado';
  };

  if (loading || businessLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Verificando pago...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/delivery/billing" className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Volver a Paquetes
          </Link>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">¡Pago Exitoso!</h1>
          <p className="text-slate-600">Tu compra se ha procesado correctamente</p>
        </div>

        {/* Success Card */}
        <Card className="bg-gradient-to-br from-green-50 to-white border-green-200 shadow-green-200/20">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 p-4 rounded-full bg-green-100 w-fit">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <CardTitle className="text-xl text-green-800">Transacción Completada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Real-time Business Balance */}
            {business && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-800">Saldo Actual</span>
                  <span className="font-bold text-blue-900">{business.credits} créditos</span>
                </div>
                <div className="text-xs text-blue-600">
                  Actualizado en tiempo real
                </div>
              </div>
            )}

            {/* Payment Details */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Monto pagado</span>
                </div>
                <span className="font-bold text-green-900">
                  ${sessionData?.amount?.toLocaleString() || '1,500'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Créditos adquiridos</span>
                </div>
                <span className="font-bold text-blue-900">
                  {sessionData?.credits || '100'} créditos
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800">Paquete</span>
                </div>
                <span className="font-bold text-orange-900">
                  {sessionData?.packageName || 'Empresarial'}
                </span>
              </div>
            </div>

            {/* Transaction Status */}
            {recentTransaction && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Estado de Transacción</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    recentTransaction.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                    recentTransaction.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {recentTransaction.status === 'APPROVED' ? 'Aprobado' :
                     recentTransaction.status === 'PENDING' ? 'Pendiente' : 'Rechazado'}
                  </span>
                </div>
                {recentTransaction.description && (
                  <p className="text-xs text-gray-600">{recentTransaction.description}</p>
                )}
              </div>
            )}

            {/* Session ID */}
            {sessionData?.id && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">ID de sesión:</p>
                <p className="text-sm font-mono text-gray-800 break-all">
                  {sessionData.id}
                </p>
              </div>
            )}

            {/* Next Steps */}
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-800">Próximos pasos:</h3>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Tus créditos ya están disponibles en tu cuenta</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Puedes crear pedidos inmediatamente</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Recibirás un comprobante por email</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <Link href="/delivery/dashboard" className="block">
                <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                  Ir al Dashboard
                </Button>
              </Link>
              
              <Link href="/delivery/new-order" className="block">
                <Button variant="outline" className="w-full border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400">
                  Crear Nuevo Pedido
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Support Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            ¿Tienes alguna pregunta? Contacta a{' '}
            <a href="mailto:soporte@befastapp.com.mx" className="text-orange-600 hover:text-orange-700">
              soporte@befastapp.com.mx
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}