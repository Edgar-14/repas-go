'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Search,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Loader2,
  RefreshCw,
  DollarSign,
  User,
  Calendar
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc, increment, collection, addDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/collections';
import withAuth from '@/components/auth/withAuth';
import { Section, PageToolbar } from '@/components/layout/primitives';

interface StripePayment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: number;
  metadata: {
    businessId?: string;
    packageName?: string;
    credits?: string;
    bonusCredits?: string;
    totalCredits?: string;
    isFirstPurchase?: string;
  };
  customer_email?: string;
}

function StripeRecoveryPage() {
  const { toast } = useToast();
  const [paymentIntentId, setPaymentIntentId] = useState('pi_3SFOm005h7ZVUpm906PIODMH');
  const [businessId, setBusinessId] = useState('YgWJBXsv5pgZ2EinceARv2as1f83');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState<StripePayment | null>(null);
  const [businessData, setBusiness] = useState<any>(null);

  const searchPayment = async () => {
    if (!paymentIntentId.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Ingresa un Payment Intent ID válido'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/stripe-recovery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'SEARCH_PAYMENT',
          paymentIntentId: paymentIntentId.trim()
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al buscar el pago');
      }

      setPaymentData(result.payment);

      // Si encontramos businessId en metadata, buscar el negocio
      if (result.payment.metadata?.businessId) {
        setBusinessId(result.payment.metadata.businessId);
        await searchBusiness(result.payment.metadata.businessId);
      }

      toast({
        title: 'Pago encontrado',
        description: `Pago de $${result.payment.amount / 100} ${result.payment.currency.toUpperCase()} encontrado`
      });

    } catch (error: any) {
      console.error('Error searching payment:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo buscar el pago'
      });
      setPaymentData(null);
    } finally {
      setLoading(false);
    }
  };

  const searchBusiness = async (busId: string) => {
    try {
      const businessRef = doc(db, COLLECTIONS.BUSINESSES, busId);
      const businessSnap = await getDoc(businessRef);

      if (businessSnap.exists()) {
        setBusiness({ id: businessSnap.id, ...businessSnap.data() });
      } else {
        setBusiness(null);
        toast({
          variant: 'destructive',
          title: 'Negocio no encontrado',
          description: `No se encontró el negocio con ID: ${busId}`
        });
      }
    } catch (error) {
      console.error('Error searching business:', error);
      setBusiness(null);
    }
  };

  const processPayment = async () => {
    if (!paymentData || !businessId.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Faltan datos del pago o ID del negocio'
      });
      return;
    }

    setProcessing(true);
    try {
      // Calcular créditos
      const baseCredits = parseInt(paymentData.metadata.credits || '50');
      const bonusCredits = parseInt(paymentData.metadata.bonusCredits || '15');
      const isFirstPurchase = paymentData.metadata.isFirstPurchase === 'true';
      const totalCredits = baseCredits + (isFirstPurchase ? bonusCredits : 0);

      // Actualizar AMBOS campos de créditos para mantener consistencia
      const businessRef = doc(db, COLLECTIONS.BUSINESSES, businessId);
      await updateDoc(businessRef, {
        credits: increment(totalCredits),
        availableCredits: increment(totalCredits),
        'billing.lastPurchaseDate': new Date(),
        'billing.lastPurchaseAmount': paymentData.amount / 100,
        'billing.totalPurchases': increment(1),
        updatedAt: new Date()
      });

      // Crear transacción en CREDIT_TRANSACTIONS (mayúsculas) para la pestaña de transferencias del admin
      await addDoc(collection(db, 'CREDIT_TRANSACTIONS'), {
        businessId,
        type: 'PURCHASE',
        amount: paymentData.amount / 100,
        credits: totalCredits,
        description: `Pago Stripe recuperado - ${paymentData.metadata.packageName || 'Paquete Básico'}`,
        packageName: paymentData.metadata.packageName || 'Recuperado',
        stripePaymentIntentId: paymentData.id,
        status: 'APPROVED',
        isFirstPurchase,
        recoveredPayment: true,
        recoveredAt: new Date(),
        processedBy: 'admin-recovery',
        processedAt: new Date(),
        createdAt: new Date(paymentData.created * 1000),
        transferDetails: {
          amount: paymentData.amount / 100,
          reference: paymentData.id,
          bank: 'Stripe',
          notes: `Pago recuperado manualmente - Payment Intent: ${paymentData.id}`,
          receiptUrl: `https://dashboard.stripe.com/payments/${paymentData.id}`,
          uploadedAt: new Date()
        },
        metadata: {
          currency: paymentData.currency,
          paymentMethod: 'STRIPE_CARD',
          originalAmount: paymentData.amount,
          recoveryReason: 'Webhook failed - Manual recovery'
        }
      });

      // Crear transacción en creditTransactions (minúsculas) para el historial del portal delivery
      await addDoc(collection(db, COLLECTIONS.CREDIT_TRANSACTIONS), {
        businessId,
        type: 'PURCHASE',
        amount: paymentData.amount / 100,
        credits: totalCredits,
        description: `Pago Stripe recuperado - ${paymentData.metadata.packageName || 'Paquete Básico'}`,
        packageName: paymentData.metadata.packageName || 'Recuperado',
        stripePaymentIntentId: paymentData.id,
        status: 'APPROVED',
        isFirstPurchase,
        recoveredPayment: true,
        recoveredAt: new Date(),
        processedBy: 'admin-recovery',
        processedAt: new Date(),
        createdAt: new Date(paymentData.created * 1000),
        metadata: {
          currency: paymentData.currency,
          paymentMethod: 'STRIPE_CARD',
          originalAmount: paymentData.amount,
          recoveryReason: 'Webhook failed - Manual recovery'
        }
      });

      // Actualizar datos del negocio en la UI
      if (businessData) {
        setBusiness({
          ...businessData,
          credits: (businessData.credits || 0) + totalCredits
        });
      }

      toast({
        title: 'Pago procesado exitosamente',
        description: `Se agregaron ${totalCredits} créditos al negocio ${businessData?.businessName || businessId}`
      });

      // Refrescar datos del negocio para mostrar cambios inmediatamente
      await searchBusiness(businessId);

    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast({
        variant: 'destructive',
        title: 'Error al procesar pago',
        description: error.message || 'No se pudo procesar el pago'
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Section>
        <PageToolbar
          left={
            <div className="flex items-center gap-2 w-full min-w-0">
              <Search />
              <span className="text-sm text-muted-foreground">Recuperación de pagos Stripe</span>
            </div>
          }
          right={
            <Button
              onClick={() => {
                setPaymentIntentId('pi_3SFOm005h7ZVUpm906PIODMH');
                setBusinessId('YgWJBXsv5pgZ2EinceARv2as1f83');
                searchPayment();
              }}
              className="bg-orange-600 hover:bg-orange-700 flex-shrink-0"
            >
              <AlertTriangle />
              Recuperar Pagos
            </Button>
          }
        />
      </Section>

      {/* Búsqueda de Pago */}
      <Card>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="paymentIntentId">Payment Intent ID</Label>
              <Input
                id="paymentIntentId"
                value={paymentIntentId}
                onChange={(e) => setPaymentIntentId(e.target.value)}
                placeholder="pi_3SFOm005h7ZVUpm906PIODMH"
                className="font-mono w-full min-w-0"
              />
            </div>
            <div>
              <Label htmlFor="businessId">Business ID (opcional)</Label>
              <Input
                id="businessId"
                value={businessId}
                onChange={(e) => setBusinessId(e.target.value)}
                placeholder="YgWJBXsv5pgZ2EinceARv2as1f83"
                className="font-mono w-full min-w-0"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={searchPayment}
              disabled={loading}
              className="flex-shrink-0"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search />
                  Buscar Pago
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Información del Pago */}
      {paymentData && (
        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard />
              <h3 className="text-lg font-semibold">Información del Pago</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="text-blue-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-blue-800">Monto</span>
                </div>
                <p className="text-lg font-bold text-blue-900">
                  ${(paymentData.amount / 100).toFixed(2)} {paymentData.currency.toUpperCase()}
                </p>
              </div>

              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="text-green-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-green-800">Estado</span>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  {paymentData.status}
                </Badge>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="text-gray-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-800">Fecha</span>
                </div>
                <p className="text-sm text-gray-900">
                  {new Date(paymentData.created * 1000).toLocaleString('es-MX')}
                </p>
              </div>
            </div>

            {/* Metadata */}
            {paymentData.metadata && Object.keys(paymentData.metadata).length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Metadata del Pago:</h4>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    {Object.entries(paymentData.metadata).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="font-medium">{key}:</span>
                        <span className="font-mono">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Cálculo de Créditos */}
            {paymentData.metadata.credits && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <h4 className="font-medium text-orange-800 mb-2">Cálculo de Créditos:</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Créditos base:</span>
                    <span className="font-mono">{paymentData.metadata.credits}</span>
                  </div>
                  {paymentData.metadata.bonusCredits && paymentData.metadata.isFirstPurchase === 'true' && (
                    <div className="flex justify-between text-green-600">
                      <span>Bonus primera compra:</span>
                      <span className="font-mono">+{paymentData.metadata.bonusCredits}</span>
                    </div>
                  )}
                  <div className="border-t pt-1 flex justify-between font-bold">
                    <span>Total créditos:</span>
                    <span className="font-mono">
                      {parseInt(paymentData.metadata.credits) +
                        (paymentData.metadata.isFirstPurchase === 'true' ? parseInt(paymentData.metadata.bonusCredits || '0') : 0)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Información del Negocio */}
      {businessData && (
        <Card>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <User />
              <h3 className="text-lg font-semibold">Información del Negocio</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-600">Nombre del Negocio</Label>
                <p className="font-medium">{businessData.businessName || businessData.name}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Email</Label>
                <p className="font-medium">{businessData.email}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Créditos Actuales</Label>
                <p className="font-bold text-blue-600">
                  {businessData.credits || 0}
                </p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Estado</Label>
                <Badge className="bg-green-100 text-green-800">
                  {businessData.status || 'active'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Acción de Procesamiento */}
      {paymentData && businessData && (
        <Card>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <RefreshCw />
              <h3 className="text-lg font-semibold">Procesar Pago Manualmente</h3>
            </div>
            
            <Alert className="mb-4">
              <AlertTriangle />
              <AlertDescription>
                Esta acción agregará los créditos al negocio y creará un registro de transacción.
                Asegúrate de que el pago no haya sido procesado anteriormente.
              </AlertDescription>
            </Alert>

            <Button
              onClick={processPayment}
              disabled={processing}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
            >
              {processing ? (
                <>
                  <Loader2 className="animate-spin" />
                  Procesando Pago...
                </>
              ) : (
                <>
                  <CheckCircle />
                  Procesar Pago y Agregar Créditos
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default withAuth(StripeRecoveryPage, {
  requiredRoles: ['ADMIN', 'SUPER_ADMIN'],
});
