'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import TransferModal from '@/components/delivery/TransferModal';
import {
  CreditCard,
  Building2,
  Zap,
  Star,
  Check,
  Loader2,
  Receipt,
  Info,
  Wallet
} from 'lucide-react';

// Firebase
import { useAuth } from '@/hooks/useAuth';
import { useBusinessData, useRealtimeCreditTransactions } from '@/hooks/useRealtimeData';
import { Section, PageToolbar } from '@/components/layout/primitives';
import { CREDIT_PACKAGES, FINANCIAL_CONFIG } from '@/constants/business';

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  originalPrice?: number;
  bonusCredits: number;
  popular?: boolean;
  features: string[];
}

export default function BillingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  // Use real-time business data and credit transactions
  const { business, loading: businessLoading, error: businessError } = useBusinessData(user?.uid || null);
  const { transactions, loading: transactionsLoading, error: transactionsError } = useRealtimeCreditTransactions(user?.uid || undefined);

  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);

  // Usar paquetes de créditos desde constantes centralizadas (con IVA calculado)
  const creditPackages: CreditPackage[] = [
    {
      id: 'basic',
      name: CREDIT_PACKAGES.BASICO.name,
      credits: CREDIT_PACKAGES.BASICO.credits,
      price: Math.round(CREDIT_PACKAGES.BASICO.price * (1 + FINANCIAL_CONFIG.IVA_RATE)),
      originalPrice: 2320, // Precio original con IVA para mostrar descuento
      bonusCredits: CREDIT_PACKAGES.BASICO.bonus,
      features: ['50 créditos de entrega', '15 créditos bonus en primera compra', 'Soporte 24/7', 'Reportes básicos']
    },
    {
      id: 'business',
      name: CREDIT_PACKAGES.EMPRESARIAL.name,
      credits: CREDIT_PACKAGES.EMPRESARIAL.credits,
      price: Math.round(CREDIT_PACKAGES.EMPRESARIAL.price * (1 + FINANCIAL_CONFIG.IVA_RATE)),
      originalPrice: 2320, // Precio original con IVA para mostrar descuento
      bonusCredits: CREDIT_PACKAGES.EMPRESARIAL.bonus,
      popular: true,
      features: ['100 créditos de entrega', '25 créditos bonus en primera compra', 'Soporte prioritario', 'Reportes avanzados', 'API access']
    },
    {
      id: 'corporate',
      name: CREDIT_PACKAGES.CORPORATIVO.name,
      credits: CREDIT_PACKAGES.CORPORATIVO.credits,
      price: Math.round(CREDIT_PACKAGES.CORPORATIVO.price * (1 + FINANCIAL_CONFIG.IVA_RATE)),
      originalPrice: 5800, // Precio original con IVA para mostrar descuento
      bonusCredits: CREDIT_PACKAGES.CORPORATIVO.bonus,
      features: ['250 créditos de entrega', '35 créditos bonus en primera compra', 'Soporte dedicado', 'Reportes personalizados', 'API completa', 'Integración personalizada']
    }
  ];

  // Handle loading and error states
  const loading = businessLoading || transactionsLoading;
  const error = businessError || transactionsError;

  if (!user) {
    router.push('/delivery/login');
    return null;
  }

  const handlePurchase = async (packageData: CreditPackage, paymentMethod: 'CARD' | 'TRANSFER') => {
    if (!business) return;

    setPurchasing(packageData.id);

    try {
      if (paymentMethod === 'CARD') {
        // Crear sesión de Stripe
        const response = await fetch('/api/stripe/create-checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            businessId: user!.uid,
            packageId: packageData.id,
            packageName: packageData.name,
            credits: packageData.credits,
            bonusCredits: packageData.bonusCredits,
            priceInMXN: packageData.price,
            isFirstPurchase: true,
            includeIVA: true // Siempre incluir IVA
          }),
        });

        if (!response.ok) {
          throw new Error('Error al crear la sesión de pago');
        }

        const { url } = await response.json();
        window.location.href = url;

      } else {
        // Abrir modal de transferencia
        setSelectedPackage(packageData);
        setTransferModalOpen(true);
      }

    } catch (error: any) {
      console.error('Error processing purchase:', error);
      toast({
        variant: 'destructive',
        title: 'Error al procesar compra',
        description: error.message || 'No se pudo procesar tu solicitud.',
      });
    } finally {
      setPurchasing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-6">
        <p>Error cargando información de facturación: {error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Reintentar
        </Button>
      </div>
    );
  }

  const isFirstPurchase = true;

  return (
    <div className="space-y-6">
      {/* UI Universal: Section + PageToolbar */}
      <Section>
        <PageToolbar
          left={
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Elige el paquete perfecto para tu negocio
              </div>
              <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1 shadow-sm border">
                <Wallet className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-gray-700">
                  <strong className="text-orange-600">{business?.availableCredits || business?.credits || 0}</strong> créditos
                </span>
              </div>
            </div>
          }
          right={
            isFirstPurchase && (
              <Badge className="bg-green-100 text-green-800">
                <Star className="h-4 w-4" />
                Primera compra - Bonus incluidos
              </Badge>
            )
          }
        />
      </Section>

      <div className="container mx-auto max-w-7xl">
        <div className="space-y-6">

          {/* Packages Grid */}
          <div className="grid gap-6 lg:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {creditPackages && creditPackages.length > 0 ? creditPackages.map((pkg) => {
              const totalCredits = pkg.credits + (isFirstPurchase ? pkg.bonusCredits : 0);
              const pricePerCredit = pkg.price / pkg.credits; // Precio por crédito base, sin bonus

              return (
                <Card
                  key={pkg.id}
                  className={`relative transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer ${pkg.popular
                    ? 'ring-2 ring-orange-500 shadow-lg scale-105 bg-gradient-to-br from-orange-50 to-white border-orange-200'
                    : 'hover:ring-2 hover:ring-orange-300 hover:shadow-lg'
                    }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 sm:px-4 py-1 shadow-lg text-xs sm:text-sm">
                        <Zap className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Más Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-3">
                    <div className="flex items-center justify-center mb-3">
                      {pkg.id === 'basic' && (
                        <div className="p-2 sm:p-3 rounded-full bg-blue-100 shadow-md">
                          <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-700" />
                        </div>
                      )}
                      {pkg.id === 'business' && (
                        <div className="p-2 sm:p-3 rounded-full bg-orange-100 shadow-md">
                          <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-orange-700" />
                        </div>
                      )}
                      {pkg.id === 'corporate' && (
                        <div className="p-2 sm:p-3 rounded-full bg-purple-100 shadow-md">
                          <Star className="h-6 w-6 sm:h-8 sm:w-8 text-purple-700" />
                        </div>
                      )}
                    </div>

                    <CardTitle className="text-base sm:text-lg">{pkg.name}</CardTitle>

                    <div className="space-y-1">
                      <div className="text-xl sm:text-2xl font-bold text-orange-600">
                        ${pkg.price.toLocaleString()}
                      </div>
                      <div className="text-xs text-green-600 font-medium">
                        IVA incluido
                      </div>
                      {pkg.originalPrice && (
                        <div className="text-xs text-gray-500 line-through">
                          ${pkg.originalPrice.toLocaleString()}
                        </div>
                      )}
                      <div className="text-xs text-gray-600">
                        ${pricePerCredit.toFixed(2)} por crédito
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Credits Summary */}
                    <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span>Créditos base:</span>
                        <span className="font-medium">{pkg.credits}</span>
                      </div>
                      {isFirstPurchase && pkg.bonusCredits > 0 && (
                        <div className="flex justify-between text-xs sm:text-sm text-green-600">
                          <span>Bonus primera compra:</span>
                          <span className="font-medium">+{pkg.bonusCredits}</span>
                        </div>
                      )}
                      <div className="border-t pt-1 flex justify-between font-bold text-xs sm:text-sm">
                        <span>Total créditos:</span>
                        <span>{totalCredits}</span>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-2">
                      {pkg.features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-xs sm:text-sm text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Purchase Buttons */}
                    <div className="space-y-2">
                      <Button
                        size="sm"
                        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-9 sm:h-10 text-xs sm:text-sm"
                        onClick={() => handlePurchase(pkg, 'CARD')}
                        disabled={purchasing === pkg.id}
                      >
                        {purchasing === pkg.id ? (
                          <>
                            <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                            Procesando...
                          </>
                        ) : (
                          <>
                            <Wallet className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                            Pagar con Tarjeta
                          </>
                        )}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400 transition-all duration-200 h-9 sm:h-10 text-xs sm:text-sm"
                        onClick={() => handlePurchase(pkg, 'TRANSFER')}
                        disabled={purchasing === pkg.id}
                      >
                        <Building2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                        Transferencia Bancaria
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            }) : (
              <div className="col-span-full text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600 mx-auto mb-4" />
                <p className="text-base text-gray-600">Cargando paquetes de créditos...</p>
              </div>
            )}
          </div>

          {/* Information Section */}
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Información Adicional</h2>
              <p className="text-gray-600">Todo lo que necesitas saber sobre facturación y métodos de pago</p>
            </div>

            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {/* Billing Info */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6 h-fit">
                <div className="flex items-center gap-3 mb-4">
                  <Info className="h-6 w-6 text-blue-700" />
                  <h3 className="font-semibold text-lg text-blue-900">Información de Facturación</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <p className="text-blue-800 font-medium">¿Necesitas factura?</p>
                  <p className="text-blue-700 leading-relaxed">Envía tu Constancia de Situación Fiscal actualizada junto con los detalles de tu compra.</p>
                  <div className="pt-3 border-t border-blue-300 space-y-2">
                    <p className="text-blue-600"><strong>Email:</strong> documentos@befastapp.com.mx</p>
                    <p className="text-blue-600"><strong>Tiempo:</strong> 3-5 días hábiles</p>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6 md:col-span-2 xl:col-span-1">
                <div className="flex items-center gap-3 mb-4">
                  <Receipt className="h-6 w-6 text-green-700" />
                  <h3 className="font-semibold text-lg text-green-900">Métodos de Pago</h3>
                </div>
                <div className="space-y-4 text-sm">
                  {/* Pago con Tarjeta */}
                  <div className="bg-white/50 rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <Wallet className="h-5 w-5 text-blue-700 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-800">Pago con Tarjeta</p>
                        <p className="text-green-700 text-sm">Acreditación inmediata y automática</p>
                      </div>
                    </div>
                  </div>

                  {/* Transferencia Bancaria */}
                  <div className="bg-white/50 rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <Building2 className="h-5 w-5 text-green-700 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-green-800 mb-1">Transferencia Bancaria</p>
                        <p className="text-green-700 text-sm mb-2">Validación manual en 24-48 horas</p>
                        <div className="text-xs text-green-600 space-y-1 bg-green-50 rounded p-2">
                          <p><strong>Beneficiario:</strong> Rosio Arisema Uribe Macias</p>
                          <p><strong>Banco:</strong> BBVA</p>
                          <p><strong>Cuenta:</strong> 271 026 0967</p>
                          <p><strong>CLABE:</strong> 012 090 02710260967 8</p>
                          <p><strong>Tarjeta de Débito:</strong> 4152 3139 4727 7377</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Spin de OXXO */}
                  <div className="bg-white/50 rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <Building2 className="h-5 w-5 text-green-700 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-800 mb-1">Spin de OXXO</p>
                        <p className="text-green-700 text-sm mb-2">Validación manual en 24-48 horas</p>
                        <div className="text-xs text-green-600 bg-green-50 rounded p-2">
                          <p><strong>Tarjeta Spin:</strong> 4217 4701 8024 6130</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Purchase History */}
              {business && (
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-6 h-fit">
                  <div className="flex items-center gap-3 mb-4">
                    <Receipt className="h-6 w-6 text-orange-700" />
                    <h3 className="font-semibold text-lg text-orange-900">Historial de Compras</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    {transactions && transactions.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-orange-800 font-medium text-sm mb-3">
                          Últimas transacciones:
                        </p>
                        {transactions.slice(0, 3).map((transaction, index) => (
                          <div key={transaction.id || index} className="bg-white/50 rounded-lg p-3 text-sm">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-orange-700 font-medium">
                                {transaction.type === 'PURCHASE' ? 'Compra' : 'Uso'}
                              </span>
                              <span className={`font-bold ${transaction.type === 'PURCHASE' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                {transaction.type === 'PURCHASE' ? '+' : '-'}{transaction.credits}
                              </span>
                            </div>
                            <div className="text-orange-600 text-xs">
                              {transaction.createdAt?.toDate ?
                                transaction.createdAt.toDate().toLocaleDateString('es-MX') :
                                new Date(transaction.createdAt as any).toLocaleDateString('es-MX')
                              }
                            </div>
                          </div>
                        ))}
                        {transactions.length > 3 && (
                          <p className="text-orange-600 text-xs text-center pt-2">
                            +{transactions.length - 3} más...
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-orange-800 font-medium mb-2">
                          Sin transacciones aún
                        </p>
                        <p className="text-orange-600 text-sm">
                          Tus compras aparecerán aquí
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Transfer Modal */}
          <TransferModal
            isOpen={transferModalOpen}
            onClose={() => {
              setTransferModalOpen(false);
              setSelectedPackage(null);
              setPurchasing(null);
            }}
            packageInfo={selectedPackage || undefined}
          />
        </div>
      </div>
    </div>
  );
}