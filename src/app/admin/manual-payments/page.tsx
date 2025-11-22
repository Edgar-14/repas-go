'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Download,
  DollarSign,
  Clock,
  AlertCircle,
  Gift
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc, query, orderBy, where } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { httpsCallable } from 'firebase/functions';
import { COLLECTIONS } from '@/lib/collections';
import { functions } from '@/lib/firebase';
import { Section, PageToolbar } from '@/components/layout/primitives';
// // Firebase Functions imports removed - not needed in frontend
// Removed - not needed in frontend
interface PaymentRequest {
  id: string;
  businessId: string;
  businessName: string;
  packageName: string;
  packageCost: number;
  availableCredits: number;
  bonus: number;
  totalCredits: number;
  isFirstPurchase: boolean;
  proofOfPaymentUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: any;
  processedDate?: any;
  processedBy?: string;
  processedByEmail?: string;
  rejectionReason?: string;
}

export default function ManualPaymentsPage() {
  const { user, role, loading: userLoading } = useAuth();
  const { toast } = useToast();
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const assignCredits = httpsCallable(functions, 'assignCreditsToBusiness');

  useEffect(() => {
    if (!user || role !== 'ADMIN' && role !== 'SUPER_ADMIN') return;

    setIsLoading(true);
    const q = query(
      collection(db, COLLECTIONS.CREDIT_TRANSACTIONS),
      where('type', '==', 'PURCHASE'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const requests: PaymentRequest[] = [];
      querySnapshot.forEach((doc) => {
        requests.push({ id: doc.id, ...doc.data() } as PaymentRequest);
      });
      setPaymentRequests(requests);
      setIsLoading(false);
    }, (error) => {
      console.error('Error al obtener solicitudes de pago:', error);
      setIsLoading(false);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error al cargar las solicitudes de pago'
      });
    });

    return () => unsubscribe();
  }, [user, role, toast]);

  const handleApprovePayment = async (request: PaymentRequest) => {
    if (!user) return;

    setProcessingRequestId(request.id);
    
    try {
      // Asignar créditos usando la función cloud
      const result = await assignCredits({
        businessId: request.businessId,
        amount: request.availableCredits,
        reason: 'PURCHASE',
        notes: `Pago manual aprobado - ${request.packageName}`,
        reference: request.id
      });

      // Actualizar estado de la solicitud
      await updateDoc(doc(db, 'creditTransactions', request.id), {
        status: 'APPROVED',
        processedDate: new Date(),
        processedBy: user.uid,
        processedByEmail: user.email
      });

      toast({
        title: 'Pago Aprobado',
        description: `Se han asignado ${request.totalCredits} créditos a ${request.businessName}${request.isFirstPurchase ? ' (incluye bonus de primera compra)' : ''}`
      });

    } catch (error: any) {
      console.error('Error al aprobar pago:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Error al procesar el pago'
      });
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleRejectPayment = async () => {
    if (!selectedRequest || !user || !rejectionReason.trim()) return;

    setProcessingRequestId(selectedRequest.id);

    try {
      await updateDoc(doc(db, 'creditTransactions', selectedRequest.id), {
        status: 'REJECTED',
        processedDate: new Date(),
        processedBy: user.uid,
        processedByEmail: user.email,
        rejectionReason: rejectionReason.trim()
      });

      toast({
        title: 'Pago Rechazado',
        description: `Se ha rechazado el pago de ${selectedRequest.businessName}`
      });

      setShowRejectDialog(false);
      setSelectedRequest(null);
      setRejectionReason('');

    } catch (error: any) {
      console.error('Error al rechazar pago:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Error al rechazar el pago'
      });
    } finally {
      setProcessingRequestId(null);
    }
  };

  const getStatusBadge = (status: string, isFirstPurchase: boolean) => {
    const baseClasses = "text-xs font-medium px-2 py-1 rounded-full";
    
    switch (status) {
      case 'approved':
        return (
          <div className="flex items-center gap-1">
            <Badge className={`${baseClasses} bg-green-100 text-green-800`}>
              <CheckCircle className="w-3 h-3 mr-1" />
              Aprobado
            </Badge>
            {isFirstPurchase && (
              <Badge className={`${baseClasses} bg-purple-100 text-purple-800`}>
                <Gift className="w-3 h-3 mr-1" />
                1era Compra
              </Badge>
            )}
          </div>
        );
      case 'rejected':
        return (
          <Badge className={`${baseClasses} bg-red-100 text-red-800`}>
            <XCircle className="w-3 h-3 mr-1" />
            Rechazado
          </Badge>
        );
      case 'pending':
        return (
          <div className="flex items-center gap-1">
            <Badge className={`${baseClasses} bg-orange-100 text-orange-800`}>
              <Clock className="w-3 h-3 mr-1" />
              Pendiente
            </Badge>
            {isFirstPurchase && (
              <Badge className={`${baseClasses} bg-purple-100 text-purple-800`}>
                <Gift className="w-3 h-3 mr-1" />
                1era Compra
              </Badge>
            )}
          </div>
        );
      default:
        return <Badge className={baseClasses}>{status}</Badge>;
    }
  };

  if (userLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-4">Cargando solicitudes de pago...</p>
      </div>
    );
  }

  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No tienes permisos para acceder a esta página.
        </AlertDescription>
      </Alert>
    );
  }

  const pendingRequests = paymentRequests.filter(r => r.status === 'pending');
  const processedRequests = paymentRequests.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-6">
      {/* UI Universal: Section + PageToolbar */}
      <Section>
        <PageToolbar />
      </Section>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingRequests.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Primeras Compras</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {pendingRequests.filter(r => r.isFirstPurchase).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Procesadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{processedRequests.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Solicitudes Pendientes ({pendingRequests.length})
          </CardTitle>
          <CardDescription>
            Solicitudes de pago que requieren revisión y aprobación
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingRequests.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Negocio</TableHead>
                  <TableHead>Paquete</TableHead>
                  <TableHead>Costo</TableHead>
                  <TableHead>Créditos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.businessName}</TableCell>
                    <TableCell>{request.packageName}</TableCell>
                    <TableCell>${request.packageCost.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{request.availableCredits} base</div>
                        {request.bonus > 0 && (
                          <div className="text-green-600">+{request.bonus} bonus</div>
                        )}
                        <div className="font-semibold">= {request.totalCredits} total</div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status, request.isFirstPurchase)}</TableCell>
                    <TableCell>
                      {new Date(request.requestDate.seconds * 1000).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(request.proofOfPaymentUrl, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleApprovePayment(request)}
                          disabled={processingRequestId === request.id}
                        >
                          {processingRequestId === request.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </Button>
                        <Dialog open={showRejectDialog && selectedRequest?.id === request.id} onOpenChange={setShowRejectDialog}>
                          <DialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setSelectedRequest(request)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Rechazar Pago</DialogTitle>
                              <DialogDescription>
                                ¿Estás seguro de que quieres rechazar el pago de {request.businessName}?
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="rejection-reason">Motivo del rechazo</Label>
                                <Textarea
                                  id="rejection-reason"
                                  value={rejectionReason}
                                  onChange={(e) => setRejectionReason(e.target.value)}
                                  placeholder="Explica el motivo del rechazo..."
                                  className="mt-2"
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                                  Cancelar
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  onClick={handleRejectPayment}
                                  disabled={!rejectionReason.trim() || processingRequestId === request.id}
                                >
                                  {processingRequestId === request.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  ) : (
                                    <XCircle className="h-4 w-4 mr-2" />
                                  )}
                                  Rechazar
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay solicitudes pendientes</h3>
              <p className="text-muted-foreground">
                Todas las solicitudes de pago han sido procesadas
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processed Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Pagos Procesados</CardTitle>
          <CardDescription>
            Últimas solicitudes de pago procesadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {processedRequests.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Negocio</TableHead>
                  <TableHead>Paquete</TableHead>
                  <TableHead>Costo</TableHead>
                  <TableHead>Créditos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Procesado</TableHead>
                  <TableHead>Por</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedRequests.slice(0, 10).map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.businessName}</TableCell>
                    <TableCell>{request.packageName}</TableCell>
                    <TableCell>${request.packageCost.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{request.availableCredits} base</div>
                        {request.bonus > 0 && (
                          <div className="text-green-600">+{request.bonus} bonus</div>
                        )}
                        <div className="font-semibold">= {request.totalCredits} total</div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status, request.isFirstPurchase)}</TableCell>
                    <TableCell>
                      {request.processedDate && new Date(request.processedDate.seconds * 1000).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {request.processedByEmail}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay pagos procesados</h3>
              <p className="text-muted-foreground">
                Los pagos procesados aparecerán aquí
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
