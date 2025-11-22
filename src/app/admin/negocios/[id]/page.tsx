'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { ArrowLeft, Edit, Loader2, Plus, Minus, Receipt, Eye, Check, X, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, where, orderBy, limit, Timestamp, updateDoc, addDoc, increment } from 'firebase/firestore';
import withAuth from '@/components/auth/withAuth';
// SE ELIMINARON 'Section' y 'PageToolbar' porque ya no se usan al reubicar el botón "Volver"
// NOTA: Si los usas en otro lado, puedes dejarlos, pero en este return ya no son necesarios.
// Para cumplir la regla de "no quitar imports", los mantendré, aunque no se usen en el return.
import { Section, PageToolbar } from '@/components/layout/primitives';
import type { Order as OrderType } from '@/lib/types/Order';


// --- Interfaces de Tipos ---
export interface Business {
  id: string;
  name?: string;
  businessName?: string;
  email: string;
  phone: string;
  address: string;
  status: 'active' | 'pending' | 'suspended' | 'inactive';
  businessType?: string;
  contactPerson?: string;
  contactName?: string;
  credits?: number;
  createdAt: Timestamp | string;
}

// Local interface for simplified order display (removed - use OrderType from lib)
type Order = Pick<OrderType, 'id' | 'businessId' | 'status' | 'createdAt'> & {
  customerName?: string;
  amountToCollect: number;
};

export interface CreditTransaction {
  id: string;
  businessId: string;
  amount: number;
  credits: number;
  type: 'PURCHASE' | 'USAGE' | 'REFUND' | 'ADJUSTMENT';
  description?: string;
  transferDetails?: {
    amount: number;
    reference: string;
    bank?: string;
    notes?: string;
    receiptUrl: string;
    uploadedAt: Timestamp | string;
  };
  proofUrl?: string;
  status: 'PENDING' | 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED';
  processedBy?: string;
  processedAt?: Timestamp | string;
  createdAt: Timestamp | string;
}

// --- Constantes y Helpers ---
const formatDate = (date: Timestamp | string) => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  if (date instanceof Timestamp) {
    return date.toDate().toLocaleDateString('es-MX', options);
  }
  return new Date(date).toLocaleDateString('es-MX', options);
};

// --- Componentes de UI Pequeños ---

const InfoItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <Label className="text-sm text-gray-500">{label}</Label>
    <div className="font-medium text-base md:text-lg">{value}</div>
  </div>
);

const BusinessInfoCard = ({ business, statusBadge }: { business: Business, statusBadge: React.ReactNode }) => (
  <Card>
    <CardContent className="p-4 md:p-6">
      {/* CAMBIO: Se reestructuró la cuadrícula para mejorar la responsividad y evitar superposiciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4">
        <div className="md:col-span-2 flex justify-between items-center">
          <InfoItem label="Nombre del Negocio" value={business.businessName || business.name || 'Sin nombre'} />
          {statusBadge}
        </div>
        <InfoItem label="Contacto" value={business.contactName || business.contactPerson || 'Sin contacto'} />
        <InfoItem label="Email" value={business.email} />
        <InfoItem label="Teléfono" value={business.phone} />
        <InfoItem label="Estado" value={<Badge className="bg-green-100 text-green-800">Verificado</Badge>} />

        {/* CAMBIO: La dirección ahora ocupa el ancho completo para evitar que el texto se encime */}
        <div className="md:col-span-2">
          <InfoItem label="Dirección" value={business.address} />
        </div>
      </div>
    </CardContent>
  </Card>
);

const CreditsManagerCard = ({ credits, onUpdate }: { credits: number; onUpdate: (newCredits: number) => Promise<void> }) => {
  const [editing, setEditing] = useState(false);
  const [tempCredits, setTempCredits] = useState(credits);

  useEffect(() => {
    setTempCredits(credits);
  }, [credits]);

  const handleSave = async () => {
    await onUpdate(tempCredits);
    setEditing(false);
  };

  const handleCancel = () => {
    setTempCredits(credits);
    setEditing(false);
  };

  return (
    <Card>
      <CardContent className="p-4 md:p-6">
        <div className="text-center space-y-4">
          <div>
            <div className="text-3xl font-bold text-blue-600">{credits}</div>
            <p className="text-sm text-gray-500">Créditos disponibles</p>
          </div>

          {editing ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setTempCredits(Math.max(0, tempCredits - 1))}><Minus /></Button>
                <Input type="number" value={tempCredits} onChange={(e) => setTempCredits(Number(e.target.value))} className="text-center" />
                <Button size="sm" variant="outline" onClick={() => setTempCredits(tempCredits + 1)}><Plus /></Button>
              </div>
              <div className="space-y-2">
                <Button size="sm" onClick={handleSave} className="w-full">Guardar</Button>
                <Button size="sm" variant="outline" onClick={handleCancel} className="w-full">Cancelar</Button>
              </div>
            </div>
          ) : (
            <Button size="sm" variant="outline" className="w-full" onClick={() => setEditing(true)}>
              <Edit className="mr-2 h-4 w-4" /> Editar Créditos
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ... (El resto de los sub-componentes como OrdersTable, TransactionsTable y ReceiptModal no necesitan cambios)
const OrdersTable = ({ orders }: { orders: Order[] }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  const { paginatedOrders, totalPages } = useMemo(() => {
    const total = Math.ceil(orders.length / ordersPerPage);
    const paginated = orders.slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage);
    return { paginatedOrders: paginated, totalPages: total };
  }, [orders, currentPage]);

  const getOrderStatusBadge = (status: Order['status']) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      delivered: { label: 'Entregado', className: 'bg-green-100 text-green-800' },
      DELIVERED: { label: 'Entregado', className: 'bg-green-100 text-green-800' },
      ALREADY_DELIVERED: { label: 'Entregado', className: 'bg-green-100 text-green-800' },
      COMPLETED: { label: 'Completado', className: 'bg-green-100 text-green-800' },
      pending: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },
      NOT_ASSIGNED: { label: 'Sin Asignar', className: 'bg-yellow-100 text-yellow-800' },
      NOT_STARTED_YET: { label: 'Sin Iniciar', className: 'bg-yellow-100 text-yellow-800' },
      cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-800' },
      CANCELLED: { label: 'Cancelado', className: 'bg-red-100 text-red-800' },
      shipped: { label: 'Enviado', className: 'bg-blue-100 text-blue-800' },
      STARTED: { label: 'En Camino', className: 'bg-blue-100 text-blue-800' },
      PICKED_UP: { label: 'Recogido', className: 'bg-blue-100 text-blue-800' },
      ACTIVE: { label: 'Activo', className: 'bg-blue-100 text-blue-800' },
    };
    const normalizedStatus = typeof status === 'string' ? status : String(status);
    const { label, className } = statusMap[normalizedStatus] || { label: 'Estado Desconocido', className: 'bg-gray-100 text-gray-800' };
    return <Badge className={className}>{label}</Badge>;
  };

  return (
    <Card>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders.length > 0 ? (
                paginatedOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.id.slice(-6)}</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>${order.amountToCollect}</TableCell>
                    <TableCell>{getOrderStatusBadge(order.status)}</TableCell>
                    <TableCell className="min-w-[150px]">{formatDate(order.createdAt)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500">No hay pedidos registrados</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {orders.length > ordersPerPage && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t mt-4">
            <div className="text-sm text-gray-700">
              Mostrando {((currentPage - 1) * ordersPerPage) + 1} a {Math.min(currentPage * ordersPerPage, orders.length)} de {orders.length} pedidos
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Anterior</Button>
              <span className="text-sm text-gray-700 px-3">Página {currentPage} de {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Siguiente</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const TransactionsTable = ({
  transactions,
  onApprove,
  onReject,
  onViewReceipt
}: {
  transactions: CreditTransaction[],
  onApprove: (id: string, transaction: CreditTransaction) => void,
  onReject: (id: string) => void,
  onViewReceipt: (url: string) => void
}) => {
  const [processingTransaction, setProcessingTransaction] = useState<string | null>(null);

  const handleApprove = async (transaction: CreditTransaction) => {
    setProcessingTransaction(transaction.id);
    await onApprove(transaction.id, transaction);
    setProcessingTransaction(null);
  }

  const handleReject = async (transactionId: string) => {
    setProcessingTransaction(transactionId);
    await onReject(transactionId);
    setProcessingTransaction(null);
  }

  const getStatusBadge = (status: CreditTransaction['status']) => {
    const statusMap = {
      PENDING: <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>,
      PENDING_VERIFICATION: <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>,
      APPROVED: <Badge className="bg-green-100 text-green-800">Aprobada</Badge>,
      REJECTED: <Badge className="bg-red-100 text-red-800">Rechazada</Badge>,
    };
    return statusMap[status] || <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
  };

  return (
    <Card>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Créditos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length > 0 ? (
                transactions.map((transaction) => {
                  const isPending = transaction.status === 'PENDING' || transaction.status === 'PENDING_VERIFICATION';
                  const receiptUrl = transaction.transferDetails?.receiptUrl || transaction.proofUrl;

                  return (
                    <TableRow key={transaction.id}>
                      <TableCell>{transaction.id.slice(-6)}</TableCell>
                      <TableCell>${transaction.transferDetails?.amount || transaction.amount}</TableCell>
                      <TableCell>{transaction.credits}</TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                      <TableCell className="min-w-[150px]">{formatDate(transaction.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {receiptUrl && (
                            <Button variant="outline" size="icon" onClick={() => onViewReceipt(receiptUrl)}><Eye className="h-4 w-4" /></Button>
                          )}
                          {isPending && (
                            <>
                              <Button
                                size="icon" variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => handleReject(transaction.id)}
                                disabled={processingTransaction === transaction.id}
                              >
                                {processingTransaction === transaction.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                              </Button>
                              <Button
                                size="icon"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleApprove(transaction)}
                                disabled={processingTransaction === transaction.id}
                              >
                                {processingTransaction === transaction.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">No hay transferencias registradas</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};


const ReceiptModal = ({ receiptUrl, onClose }: { receiptUrl: string | null; onClose: () => void }) => {
  if (!receiptUrl) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Comprobante de Transferencia</h3>
          <Button variant="ghost" size="sm" onClick={onClose}><X /></Button>
        </div>
        <div className="p-4 flex flex-col items-center justify-center">
          <img
            src={receiptUrl}
            alt="Comprobante de transferencia"
            className="max-w-full h-auto"
            onError={(e) => {
              const target = e.target as HTMLElement;
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = `
                    <div class="text-center py-8">
                      <p class="text-gray-500 mb-4">No se puede mostrar la imagen.</p>
                      <a href="${receiptUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 text-blue-600 hover:underline">
                        Abrir comprobante en nueva pestaña
                      </a>
                    </div>
                  `;
              }
            }}
          />
          <Button asChild variant="outline" className="mt-4">
            <a href={receiptUrl} target="_blank" rel="noopener noreferrer" download>
              <Download className="mr-2 h-4 w-4" /> Descargar
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};


// --- Componente Principal ---
function BusinessDetailPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params.id as string;

  const [business, setBusiness] = useState<Business | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [creditTransactions, setCreditTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);

  useEffect(() => {
    if (!businessId) return;

    const businessRef = doc(db, 'businesses', businessId);
    const unsubscribeBusiness = onSnapshot(businessRef, (doc) => {
      if (doc.exists()) {
        setBusiness({ id: doc.id, ...doc.data() } as Business);
      } else {
        toast.error('Negocio no encontrado');
        router.push('/admin/negocios');
      }
      setLoading(false);
    });

    const commonQueryProps = (collectionName: string) => ([
      collection(db, collectionName),
      where('businessId', '==', businessId),
      orderBy('createdAt', 'desc'),
      limit(50)
    ] as const);

    const ordersQuery = query(...commonQueryProps('orders'));
    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
      setOrders(ordersData);
    });

    const creditTransactionsQuery = query(...commonQueryProps('CREDIT_TRANSACTIONS'));
    const unsubscribeCreditTransactions = onSnapshot(creditTransactionsQuery, (snapshot) => {
      const transactionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CreditTransaction[];
      setCreditTransactions(transactionsData);
    });

    return () => {
      unsubscribeBusiness();
      unsubscribeOrders();
      unsubscribeCreditTransactions();
    };
  }, [businessId, router]);

  const handleUpdateCredits = async (newCredits: number) => {
    try {
      const businessRef = doc(db, 'businesses', businessId);
      // Actualizar AMBOS campos para mantener consistencia
      await updateDoc(businessRef, { 
        credits: newCredits,
        availableCredits: newCredits,
        updatedAt: new Date()
      });
      toast.success('Créditos actualizados correctamente');
    } catch (error) {
      toast.error('Error al actualizar créditos');
    }
  };

  const processCreditTransaction = async (
    transactionId: string,
    newStatus: 'APPROVED' | 'REJECTED',
    successMessage: string,
    transaction?: CreditTransaction
  ) => {
    try {
      const transactionRef = doc(db, 'CREDIT_TRANSACTIONS', transactionId);
      await updateDoc(transactionRef, {
        status: newStatus,
        processedBy: 'admin',
        processedAt: Timestamp.now()
      });

      if (newStatus === 'APPROVED' && transaction?.transferDetails) {
        const businessRef = doc(db, 'businesses', businessId);
        await updateDoc(businessRef, { credits: increment(transaction.credits) });

        await addDoc(collection(db, 'CREDIT_TRANSACTIONS'), {
          businessId: businessId,
          amount: transaction.transferDetails.amount,
          credits: transaction.credits,
          type: 'PURCHASE',
          description: `Transferencia aprobada - Ref: ${transaction.transferDetails.reference}`,
          status: 'APPROVED',
          processedBy: 'admin',
          processedAt: Timestamp.now(),
          createdAt: Timestamp.now()
        });
      }
      toast.success(successMessage);
    } catch (error) {
      console.error(`Error al procesar transferencia:`, error);
      toast.error(`Error al procesar la transferencia.`);
    }
  };

  const handleApproveTransfer = async (transactionId: string, transaction: CreditTransaction) => {
    if (!transaction.transferDetails) return;
    await processCreditTransaction(
      transactionId,
      'APPROVED',
      `Transferencia aprobada. Se agregaron ${transaction.credits} créditos.`,
      transaction
    );
  };

  const handleRejectTransfer = async (transactionId: string) => {
    await processCreditTransaction(transactionId, 'REJECTED', 'Transferencia rechazada.');
  };

  const handleViewReceipt = (url: string) => {
    setSelectedReceipt(url);
    setShowReceiptModal(true);
  }

  const pendingTransactionsCount = useMemo(() =>
    creditTransactions.filter(t => t.status === 'PENDING' || t.status === 'PENDING_VERIFICATION').length,
    [creditTransactions]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="text-center p-8">
        <p className="mb-4">Negocio no encontrado</p>
        <Button onClick={() => router.push('/admin/negocios')}>
          Volver a Negocios
        </Button>
      </div>
    );
  }

  const statusLabels = {
    active: "Activo",
    pending: "Pendiente",
    suspended: "Suspendido",
    inactive: "Inactivo"
  };
  const statusColors = {
    active: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    suspended: "bg-red-100 text-red-800",
    inactive: "bg-gray-100 text-gray-800"
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* CAMBIO: Se movió el botón "Volver" aquí y se eliminó la PageToolbar */}
      <Button variant="ghost" size="sm" onClick={() => router.push('/admin/negocios')} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver
      </Button>

      {/* CAMBIO: Nueva cuadrícula para que las tarjetas se apilen en móvil */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <BusinessInfoCard
            business={business}
            statusBadge={
              <Badge className={statusColors[business.status as keyof typeof statusColors]}>
                {statusLabels[business.status as keyof typeof statusLabels]}
              </Badge>
            }
          />
        </div>
        <div>
          <CreditsManagerCard credits={business.credits || 0} onUpdate={handleUpdateCredits} />
        </div>
      </div>

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Historial de Pedidos</TabsTrigger>
          <TabsTrigger value="transfers" className="relative">
            Transferencias
            {pendingTransactionsCount > 0 && (
              <Badge className="ml-2 bg-red-500 text-white text-xs rounded-full px-2">
                {pendingTransactionsCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <OrdersTable orders={orders} />
        </TabsContent>
        <TabsContent value="transfers">
          <TransactionsTable
            transactions={creditTransactions}
            onApprove={handleApproveTransfer}
            onReject={handleRejectTransfer}
            onViewReceipt={handleViewReceipt}
          />
        </TabsContent>
      </Tabs>

      <ReceiptModal
        receiptUrl={selectedReceipt}
        onClose={() => {
          setShowReceiptModal(false);
          setSelectedReceipt(null);
        }}
      />
    </div>
  );
}

export default withAuth(BusinessDetailPage, {
  requiredRoles: ['ADMIN', 'SUPER_ADMIN', 'CONTADORA'],
});