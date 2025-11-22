'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter as DialogFooterUI } from "@/components/ui/dialog";
import { Loader2, UserCheck, XCircle, Eye, Users, Clock, CheckCircle, X, Search } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, where, updateDoc, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase';
import { Section, PageToolbar } from '@/components/layout/primitives';
// Definición de columnas del Kanban
const KANBAN_COLUMNS = [
  {
    id: 'pending_review',
    title: 'Nuevas Solicitudes',
    icon: Users,
    color: 'bg-blue-50 border-blue-200',
    status: 'PENDING_REVIEW'
  },
  {
    id: 'in_review',
    title: 'En Revisión',
    icon: Clock,
    color: 'bg-yellow-50 border-yellow-200',
    status: 'IN_REVIEW'
  },
  {
    id: 'approved',
    title: 'Aprobadas',
    icon: CheckCircle,
    color: 'bg-green-50 border-green-200',
    status: 'APPROVED'
  },
  {
    id: 'rejected',
    title: 'Rechazadas',
    icon: X,
    color: 'bg-red-50 border-red-200',
    status: 'REJECTED'
  }
];

const formatDate = (d: any, locale = 'es-MX') => {
  const date = d?.toDate ? d.toDate() : new Date(d);
  return date.toLocaleDateString(locale);
};

function getStatusBadge(status: string) {
  switch (status) {
    case 'PENDING_REVIEW': return <Badge variant="secondary">Pendiente</Badge>;
    case 'IN_REVIEW': return <Badge variant="outline" className="border-yellow-500 text-yellow-700">En Revisión</Badge>;
    case 'APPROVED': return <Badge variant="default" className="bg-green-500">Aprobada</Badge>;
    case 'REJECTED': return <Badge variant="destructive">Rechazada</Badge>;
    default: return <Badge>{status}</Badge>;
  }
}

function getDocumentTypeName(type: string): string {
  const documentTypes: Record<string, string> = {
    'driver_license': 'Licencia de Conducir',
    'fiscal_document': 'Constancia de Situación Fiscal',
    'ine_back': 'INE (Reverso)',
    'ine_front': 'INE (Frente)',
    'proof_address': 'Comprobante de Domicilio',
    'proof_of_address': 'Comprobante de Domicilio',
    'vehicle_registration': 'Tarjeta de Circulación'
  };
  return documentTypes[type] || type;
}

import withAuth from '@/components/auth/withAuth';

function AdminRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [training, setTraining] = useState<any | null>(null);
  const [legal, setLegal] = useState<any | null>(null);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [loadingTraining, setLoadingTraining] = useState(false);
  const [loadingLegal, setLoadingLegal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [draggedItem, setDraggedItem] = useState<any | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    let q;

    if (search.trim()) {
      q = query(
        collection(db, 'driverRegistrationDrafts'),
        where('personalData.fullName', '>=', search.trim()),
        where('personalData.fullName', '<=', search.trim() + '\uf8ff')
      );
    } else {
      q = query(
        collection(db, 'driverRegistrationDrafts'),
        orderBy('submittedAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsData = snapshot.docs.map(doc => {
        const data = doc.data();
        // Normalizar status: pending_review -> PENDING_REVIEW
        let normalizedStatus = (data.status || 'PENDING_REVIEW').toUpperCase().replace(/_/g, '_');
        if (normalizedStatus === 'PENDING_REVIEW' || normalizedStatus === 'PENDING') {
          normalizedStatus = 'PENDING_REVIEW';
        }
        return {
          id: doc.id,
          email: data.email,
          fullName: data.personalData?.fullName || '',
          phone: data.personalData?.phone || '',
          curp: data.personalData?.curp || '',
          rfc: data.personalData?.rfc || '',
          nss: data.personalData?.nss || '',
          address: data.address || '',
          vehicle: data.vehicle || {},
          bank: data.bank || {},
          status: normalizedStatus,
          submittedAt: data.submittedAt,
          updatedAt: data.updatedAt,
          documents: data.documents || data.uploadedDocuments || {},
          legal: data.legal,
          training: data.training,
          hasDocuments: Object.keys(data.documents || data.uploadedDocuments || {}).length > 0,
          hasLegal: !!data.legal,
          hasTraining: !!data.training
        };
      }) as any[];
      console.log('📊 Total de solicitudes cargadas:', requestsData.length);
      console.log('📋 Solicitudes por estado:', {
        PENDING_REVIEW: requestsData.filter(r => r.status === 'PENDING_REVIEW').length,
        IN_REVIEW: requestsData.filter(r => r.status === 'IN_REVIEW').length,
        APPROVED: requestsData.filter(r => r.status === 'APPROVED').length,
        REJECTED: requestsData.filter(r => r.status === 'REJECTED').length,
      });
      setRequests(requestsData);
      setIsLoading(false);
    }, (error) => {
      console.error('Error escuchando solicitudes:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar las solicitudes.' });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast, search]);

  // Fetch documents from field when request is selected
  useEffect(() => {
    if (selectedRequest) {
      setLoadingDocs(true);
      const docs = selectedRequest.documents || {};
      const docsArray = Object.entries(docs).map(([type, data]: [string, any]) => {
        // Convert Firebase Storage URL to Google Cloud Storage URL format
        let cleanUrl = data.downloadURL;
        if (cleanUrl && cleanUrl.includes('firebasestorage.googleapis.com')) {
          // Extract bucket and path from Firebase URL
          const match = cleanUrl.match(/\/b\/([^\/]+)\/o\/(.+?)\?/);
          if (match) {
            const bucket = match[1];
            const encodedPath = match[2];
            const decodedPath = decodeURIComponent(encodedPath);
            // Convert to Google Cloud Storage URL format
            cleanUrl = `https://storage.cloud.google.com/${bucket}/${decodedPath}`;
          }
        }
        return {
          id: type,
          type: type,
          downloadURL: cleanUrl,
          fileName: data.originalName,
          size: data.size,
          uploadedAt: data.uploadedAt
        };
      });
      setDocuments(docsArray);
      setLoadingDocs(false);
    } else {
      setDocuments([]);
    }
  }, [selectedRequest]);

  // Fetch training from field when request is selected
  useEffect(() => {
    if (selectedRequest) {
      setLoadingTraining(true);
      setTraining(selectedRequest.training || null);
      setLoadingTraining(false);
    } else {
      setTraining(null);
    }
  }, [selectedRequest]);

  // Fetch legal from field when request is selected
  useEffect(() => {
    if (selectedRequest) {
      setLoadingLegal(true);
      setLegal(selectedRequest.legal || null);
      setLoadingLegal(false);
    } else {
      setLegal(null);
    }
  }, [selectedRequest]);

  const handleApproveRequest = async (applicationId: string) => {
    setIsSubmitting(true);
    try {
      const functions = getFunctions(app);
      const updateDriverStatus = httpsCallable(functions, 'updateDriverStatus');

      const result = await updateDriverStatus({
        applicationId,
        newStatus: 'APPROVED'
      });

      const resultData = result.data as any;
      if (!resultData.success) {
        throw new Error(resultData.result || 'Error al aprobar la solicitud.');
      }

      toast({
        title: 'Solicitud Aprobada',
        description: 'El repartidor ha sido aprobado y recibirá un correo para configurar su contraseña.'
      });
    } catch (error: any) {
      console.error('Error al aprobar solicitud:', error);
      toast({
        variant: 'destructive',
        title: 'Error al Aprobar',
        description: error.message || 'No se pudo aprobar la solicitud'
      });
    } finally {
      setIsSubmitting(false);
      setSelectedRequest(null);
    }
  };

  const handleRejectRequest = async (applicationId: string) => {
    if (!rejectReason.trim()) {
      toast({
        variant: 'destructive',
        title: 'Motivo requerido',
        description: 'Debes ingresar un motivo para rechazar la solicitud.'
      });
      return;
    }

    if (rejectReason.trim().length < 10) {
      toast({
        variant: 'destructive',
        title: 'Motivo muy corto',
        description: 'El motivo debe tener al menos 10 caracteres.'
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const functions = getFunctions(app);
      const updateDriverStatus = httpsCallable(functions, 'updateDriverStatus');

      const result = await updateDriverStatus({
        applicationId,
        newStatus: 'REJECTED',
        rejectionReason: rejectReason
      });

      const resultData = result.data as any;

      if (!resultData.success) {
        throw new Error(resultData.result || 'Error al rechazar la solicitud.');
      }

      toast({
        title: 'Solicitud Rechazada',
        description: 'La solicitud ha sido rechazada y se ha notificado al solicitante.'
      });
      setRejectReason('');
    } catch (error: any) {
      console.error('Error al rechazar solicitud:', error);
      toast({
        variant: 'destructive',
        title: 'Error al Rechazar',
        description: error.message || 'No se pudo rechazar la solicitud'
      });
    } finally {
      setIsSubmitting(false);
      setSelectedRequest(null);
    }
  };

  const handleModalOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedRequest(null);
      setDocuments([]);
      setTraining(null);
      setLegal(null);
      setRejectReason('');
    }
  };

  // Funciones para drag and drop
  const handleDragStart = (e: React.DragEvent, request: any) => {
    setDraggedItem(request);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();

    if (!draggedItem || draggedItem.status === newStatus) {
      setDraggedItem(null);
      return;
    }

    if (newStatus === 'APPROVED' || newStatus === 'REJECTED') {
      toast({
        variant: 'destructive',
        title: 'Acción no permitida',
        description: `Para ${newStatus === 'APPROVED' ? 'aprobar' : 'rechazar'} una solicitud, utiliza los botones en la vista de detalle.`,
      });
      setDraggedItem(null);
      return;
    }

    try {
      // Actualizar el estado en Firestore
      await updateDoc(doc(db, 'driverRegistrationDrafts', draggedItem.id), {
        status: newStatus,
        updatedAt: new Date(),
        reviewedAt: new Date()
      });

      // Enviar notificación por email según el nuevo estado
      const functions = getFunctions(app);
      const sendNotification = httpsCallable(functions, 'sendNotification');

      let emailTemplate = '';
      let subject = '';

      switch (newStatus) {
        case 'APPROVED':
          emailTemplate = 'driver_approval';
          subject = '¡Solicitud Aprobada! - BeFast';
          break;
        case 'REJECTED':
          emailTemplate = 'driver_rejection';
          subject = 'Solicitud de Repartidor - BeFast';
          break;
        case 'IN_REVIEW':
          emailTemplate = 'driver_review';
          subject = 'Solicitud en Revisión - BeFast';
          break;
      }

      if (emailTemplate) {
        await sendNotification({
          email: draggedItem.email,
          template: emailTemplate,
          subject: subject,
          data: {
            nombre: draggedItem.fullName,
            motivo: rejectReason || 'No cumple con los requisitos',
            fecha: new Date().toLocaleDateString('es-MX')
          }
        });
      }

      toast({
        title: 'Estado actualizado',
        description: `Solicitud movida a ${KANBAN_COLUMNS.find(col => col.status === newStatus)?.title}.`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar el estado de la solicitud',
      });
    }

    setDraggedItem(null);
  };

  // Filtrar solicitudes por estado
  const getRequestsByStatus = (status: string) => {
    return requests.filter(req => req.status === status);
  };

  // Calcular tiempo promedio en cada etapa
  const getAverageTimeInStage = (status: string) => {
    const stageRequests = requests.filter(req => req.status === status);
    if (stageRequests.length === 0) return '0 min';

    const totalTime = stageRequests.reduce((acc, req) => {
      const createdAt = req.submittedAt?.toDate?.() || new Date();
      const updatedAt = req.updatedAt?.toDate?.() || new Date();
      const timeInStage = updatedAt.getTime() - createdAt.getTime();
      return acc + timeInStage;
    }, 0);

    const averageTime = totalTime / stageRequests.length;
    const hours = Math.floor(averageTime / (1000 * 60 * 60));
    const minutes = Math.floor((averageTime % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Componente de tarjeta de solicitud
  const RequestCard = ({ request }: { request: any }) => (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, request)}
      className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-move"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{request.fullName}</h4>
          <p className="text-sm text-gray-600">{request.email}</p>
          <p className="text-sm text-gray-500">{request.phone}</p>
        </div>
        {getStatusBadge(request.status)}
      </div>

      <div className="text-xs text-gray-500 mb-3">
        <p><strong>Vehículo:</strong> {request.vehicle?.type} {request.vehicle?.brand}</p>
        <p><strong>RFC:</strong> {request.rfc}</p>
        <p><strong>Fecha:</strong> {request.submittedAt?.toDate?.()?.toLocaleDateString('es-MX')}</p>
      </div>

      <div className="flex gap-2">
        <Dialog open={selectedRequest?.id === request.id} onOpenChange={handleModalOpenChange}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedRequest(request)}
              className="flex-1"
            >
              <Eye />
              Revisar
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header con controles usando Section + PageToolbar */}
      <Section>
        <PageToolbar
          left={
            <div className="flex items-center gap-2 w-full min-w-0">
              <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <Input
                type="text"
                placeholder="Buscar por nombre, email o teléfono..."
                className="w-full min-w-0"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          }
          right={
            <>
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('kanban')}
              >
                Kanban
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                Tabla
              </Button>
            </>
          }
        />
      </Section>

      {/* Vista Kanban */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {KANBAN_COLUMNS.map((column) => {
            const columnRequests = getRequestsByStatus(column.status);
            const IconComponent = column.icon;

            return (
              <Card key={column.id} className={`${column.color} min-h-[600px]`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4" />
                      <CardTitle className="text-sm font-medium">{column.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {columnRequests.length}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {getAverageTimeInStage(column.status)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div
                    className="space-y-3 min-h-[500px]"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, column.status)}
                  >
                    {isLoading ? (
                      <div className="flex justify-center items-center h-32">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : columnRequests.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <IconComponent className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No hay solicitudes</p>
                      </div>
                    ) : (
                      columnRequests.map((request) => (
                        <RequestCard key={request.id} request={request} />
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Vista Tabla */}
      {viewMode === 'table' && (
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay solicitudes</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehículo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {requests
                      .map((req) => (
                        <tr key={req.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{req.fullName}</div>
                            <div className="text-sm text-gray-500">{req.rfc}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.phone}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {req.vehicle?.type} {req.vehicle?.brand}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(req.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {req.submittedAt?.toDate?.()?.toLocaleDateString('es-MX')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Dialog open={selectedRequest?.id === req.id} onOpenChange={handleModalOpenChange}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedRequest(req)}
                                >
                                  <Eye />
                                  Revisar
                                </Button>
                              </DialogTrigger>
                            </Dialog>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal de revisión (compartido entre ambas vistas) */}
      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={handleModalOpenChange}>
          <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle> {selectedRequest.fullName}</DialogTitle>
              <DialogDescription>
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="personal">
              <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4 gap-1 h-auto">
                <TabsTrigger value="personal" className="text-xs sm:text-sm">Info. Personal</TabsTrigger>
                <TabsTrigger value="documents" className="text-xs sm:text-sm">Documentos</TabsTrigger>
                <TabsTrigger value="contract" className="text-xs sm:text-sm">Contrato</TabsTrigger>
                <TabsTrigger value="training" className="text-xs sm:text-sm">Capacitación</TabsTrigger>
              </TabsList>
              <TabsContent value="personal">
                <div className="text-sm space-y-3 py-4">
                  <p className="break-words"><strong>Email:</strong> {selectedRequest.email}</p>
                  <p><strong>Teléfono:</strong> {selectedRequest.phone}</p>
                  <p><strong>CURP:</strong> {selectedRequest.curp}</p>
                  <p><strong>RFC:</strong> {selectedRequest.rfc}</p>
                  <p><strong>NSS:</strong> {selectedRequest.nss}</p>
                  <p className="break-words"><strong>Dirección:</strong> {selectedRequest.address ? `${selectedRequest.address.street}, ${selectedRequest.address.city}, ${selectedRequest.address.state}, ${selectedRequest.address.zipCode}` : 'N/A'}</p>
                  <p><strong>Vehículo:</strong> {selectedRequest.vehicle?.type} {selectedRequest.vehicle?.brand} {selectedRequest.vehicle?.model}</p>
                  <p><strong>Placa:</strong> {selectedRequest.vehicle?.plate}</p>
                  <p><strong>Banco:</strong> {selectedRequest.bank?.name}</p>
                  <p className="break-words"><strong>CLABE:</strong> {selectedRequest.bank?.clabe}</p>
                </div>
              </TabsContent>
              <TabsContent value="documents">
                {loadingDocs ? (
                  <div className="flex justify-center items-center h-40"><Loader2 className="w-6 h-6 animate-spin" /></div>
                ) : documents.length === 0 ? (
                  <p className="text-center py-8">No se encontraron documentos para esta solicitud.</p>
                ) : (
                  <ul className="space-y-2 py-4">
                    {documents.map(doc => (
                      <li key={doc.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-md bg-gray-50 gap-2 min-w-0">
                        <div className="flex-1 min-w-0 w-full sm:w-auto">
                          <span className="font-medium text-gray-800 block truncate text-sm">{getDocumentTypeName(doc.type)}</span>
                          {doc.fileName && <span className="text-xs text-gray-500 block truncate">{doc.fileName}</span>}
                          {doc.size && <span className="text-xs text-gray-500">{(doc.size / 1024).toFixed(0)} KB</span>}
                        </div>
                        {doc.downloadURL ? (
                          <a href={doc.downloadURL} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 w-full sm:w-auto">
                            <Button variant="ghost" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                              <Eye className="w-4 h-4" />
                              <span className="hidden sm:inline ml-1">Ver</span>
                            </Button>
                          </a>
                        ) : (
                          <Button variant="ghost" size="sm" className="w-full sm:w-auto text-xs sm:text-sm" disabled>
                            <Eye className="w-4 h-4" />
                            <span className="hidden sm:inline ml-1">No disponible</span>
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>
              <TabsContent value="contract">
                {loadingLegal ? (
                  <div className="flex justify-center items-center h-40"><Loader2 className="w-6 h-6 animate-spin" /></div>
                ) : legal ? (
                  <div className="py-4 space-y-4">
                    <div className="text-sm space-y-2">
                      <p><strong>Firmado por:</strong> {legal.fullName}</p>
                      <p><strong>Fecha:</strong> {formatDate(legal.signedAt, 'es-MX')}</p>
                      <p><strong>Contrato aceptado:</strong> {legal.acceptedContract ? '✅ Sí' : '❌ No'}</p>
                      <p><strong>Validez legal aceptada:</strong> {legal.acceptedValidity ? '✅ Sí' : '❌ No'}</p>
                      {legal.acceptedDocuments && legal.acceptedDocuments.length > 0 && (
                        <div>
                          <strong>Documentos aceptados:</strong>
                          <ul className="list-disc list-inside ml-4">
                            {legal.acceptedDocuments.map((doc: string, idx: number) => (
                              <li key={idx}>{doc}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    {legal.signature && (
                      <div className="border p-4 rounded-md bg-white">
                        <p className="text-sm font-medium mb-2">Firma Digital:</p>
                        <img src={legal.signature} alt="Firma Digital" className="mx-auto border max-w-full h-auto rounded-md" />
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-center py-8">No se encontraron acuerdos legales para esta solicitud.</p>
                )}
              </TabsContent>
              <TabsContent value="training">
                {loadingTraining ? (
                  <div className="flex justify-center items-center h-40"><Loader2 className="w-6 h-6 animate-spin" /></div>
                ) : training ? (
                  <div className="py-4 space-y-4">
                    <div className="text-sm space-y-3">
                      <p><strong>Módulos completados:</strong> {Array.isArray(training.completedModules) ? training.completedModules.length : 0}</p>
                      <p><strong>Puntuación del examen:</strong> {training.testScore || 'N/A'}%</p>
                      <p><strong>Aprobado:</strong> {training.testPassed ? '✅ Sí' : '❌ No'}</p>
                      <p><strong>Fecha de finalización:</strong> {training.completedAt?.toDate?.()?.toLocaleDateString('es-MX') || training.completedAt || 'N/A'}</p>
                    </div>
                    {Array.isArray(training.completedModules) && training.completedModules.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Módulos completados:</p>
                        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                          {training.completedModules.map((moduleId: number, idx: number) => (
                            <li key={idx}>Módulo {moduleId}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-center py-8">No se encontró información de capacitación para esta solicitud.</p>
                )}
              </TabsContent>
            </Tabs>
            <div className="space-y-2 px-1 my-4">
              <label className="block text-sm font-medium text-gray-700">
                Motivo de rechazo (obligatorio para rechazar):
              </label>
              <Input
                type="text"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Ingresa el motivo del rechazo"
                className="w-full"
              />
            </div>
            <DialogFooterUI className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                variant="destructive"
                onClick={() => handleRejectRequest(selectedRequest.id)}
                disabled={isSubmitting || selectedRequest.status === 'REJECTED'}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <XCircle className="mr-2" />}
                Rechazar
              </Button>
              <Button
                onClick={() => handleApproveRequest(selectedRequest.id)}
                disabled={isSubmitting || selectedRequest.status === 'APPROVED'}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <UserCheck className="mr-2" />}
                Aprobar
              </Button>
            </DialogFooterUI>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default withAuth(AdminRequestsPage, {
  requiredRoles: ['ADMIN', 'SUPER_ADMIN', 'CONTADORA'],
});
