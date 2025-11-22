'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Car, 
  DollarSign,
  TrendingUp,
  Star, 
  Clock, 
  Shield, 
  FileText,
  Calendar,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit,
  Download,
  Eye,
  Bike,
  Truck,
  Loader2,
  Package,
  Upload
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db, storage } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { COLLECTIONS } from '@/lib/collections';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import withAuth from '@/components/auth/withAuth';
import DOMPurify from 'isomorphic-dompurify';
import { Section, PageToolbar } from '@/components/layout/primitives';

// Componente para mostrar documentos firmados en el admin
function AdminSignedDocumentsSection({ driverEmail }: { driverEmail: string }) {
  const [signedDocs, setSignedDocs] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<any>(null);

  useEffect(() => {
    if (!driverEmail) return;

    const fetchSignedDocuments = async () => {
      try {
        const docRef = doc(db, 'signedDocuments', driverEmail);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setSignedDocs(docSnap.data());
        }
      } catch (error) {
        console.error('Error fetching signed documents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSignedDocuments();
  }, [driverEmail]);

  const handleViewDocument = (docData: any, title: string) => {
    setCurrentDocument({ ...docData, title });
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-600">Cargando documentos...</span>
      </div>
    );
  }

  if (!signedDocs) {
    return (
      <div className="text-center py-6 text-gray-500">
        <FileText className="mx-auto h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm">No hay documentos firmados registrados</p>
        <p className="text-xs mt-1">El repartidor debe completar el proceso de registro</p>
      </div>
    );
  }

  const documents = [
    { key: 'contractInstructions', name: 'Instructivo de Llenado', icon: '📋' },
    { key: 'algorithmicPolicy', name: 'Política Algorítmica', icon: '🤖' },
    { key: 'driverContract', name: 'Contrato de Trabajo', icon: '📄' }
  ];

  return (
    <>
      <div className="space-y-3">
        {documents.map((doc) => {
          const docData = signedDocs.documents?.[doc.key];
          return (
            <div key={doc.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-lg">{doc.icon}</span>
                <div>
                  <p className="font-medium text-sm">{doc.name}</p>
                  {docData?.signedAt && (
                    <p className="text-xs text-gray-600">
                      Firmado: {docData.signedAt.toDate().toLocaleDateString('es-MX')} a las {docData.signedAt.toDate().toLocaleTimeString('es-MX')}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={docData ? 'default' : 'secondary'} className="bg-emerald-100 text-emerald-800">
                  {docData ? 'Firmado' : 'Pendiente'}
                </Badge>
                {docData && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleViewDocument(docData, doc.name)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
        
        {signedDocs.signedBy && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-800">
                  Firmado por: {signedDocs.signedBy}
                </p>
                {signedDocs.createdAt && (
                  <p className="text-xs text-emerald-600 mt-1">
                    {signedDocs.createdAt.toDate().toLocaleString('es-MX')}
                  </p>
                )}
              </div>
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        )}
      </div>

      {/* Modal para ver documento */}
      {modalOpen && currentDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-800">{currentDocument.title}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setModalOpen(false)}
                className="p-2"
              >
                <XCircle className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="p-4 sm:p-8 overflow-y-auto max-h-[70vh] bg-white">
              {currentDocument.content && (
                <div 
                  className="max-w-none text-sm leading-relaxed"
                  style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentDocument.content) }}
                  role="document"
                  aria-label={currentDocument.title}
                />
              )}
            </div>
            
            <div className="p-6 border-t bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <p><strong>Estado:</strong> Firmado y Aceptado</p>
                  {currentDocument.signedAt && (
                    <p><strong>Fecha:</strong> {currentDocument.signedAt.toDate().toLocaleString('es-MX')}</p>
                  )}
                </div>
                <Button onClick={() => setModalOpen(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface DocumentMap {
  ine?: { url?: string; verified?: boolean; expiryDate?: string; status?: string; uploadedAt?: any };
  license?: { url?: string; verified?: boolean; expiryDate?: string; status?: string; uploadedAt?: any };
  proofOfAddress?: { url?: string; verified?: boolean; status?: string; uploadedAt?: any };
  vehicleRegistration?: { url?: string; verified?: boolean; status?: string; uploadedAt?: any };
  insurance?: { url?: string; verified?: boolean; expiryDate?: string; status?: string; uploadedAt?: any };
  [key: string]: { url?: string; verified?: boolean; expiryDate?: string; status?: string; uploadedAt?: any } | undefined;
}

interface Driver {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  rfc?: string;
  nss?: string;
  curp?: string;
  address?: string;
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED';
  vehicleType?: 'MOTORCYCLE' | 'BICYCLE' | 'CAR' | 'VAN' | 'auto' | 'moto' | 'bici' | string;
  vehicle?: {
    type?: string;
    [key: string]: any;
  };
  rating?: number;
  totalDeliveries?: number;
  createdAt?: any;
  documents?: DocumentMap;
  bankAccount?: {
    accountNumber?: string;
    clabe?: string;
    bankName?: string;
  };
  earnings?: {
    currentWeek?: number;
    currentMonth?: number;
    totalEarnings?: number;
  };
  profileImage?: string;
  signature?: string;
  trainingCompleted?: boolean;
  walletBalance?: number;
  pendingDebts?: number;
  training?: {
    completedModules?: number;
    totalModules?: number;
    finalScore?: number;
    modules?: Array<{
      name: string;
      status: 'completed' | 'in_progress' | 'pending';
      progress: number;
      score: number;
      duration: number;
    }>;
    certification?: {
      title: string;
      expiryDate: string;
      certificateUrl?: string;
    };
  };
  legalDocuments?: Array<{
    name: string;
    status: 'accepted' | 'pending' | 'rejected';
    acceptedAt?: string;
  }>;
  [key: string]: any;
}

const vehicleIcons = {
  CAR: Car,
  MOTORCYCLE: Bike,
  BICYCLE: Bike,
  VAN: Truck,
  auto: Car,
  moto: Bike,
  bici: Bike
};

const statusColors = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  SUSPENDED: 'bg-red-100 text-red-800'
};


// Tipar correctamente el resultado de useParams
type Params = { id: string };

const DriverDetailPage = () => {
  const params = useParams() as Params;
  const id = params.id;
  const router = useRouter();
  const { toast } = useToast();
  const [driver, setDriver] = useState<Driver | null>(null);

  useEffect(() => {
    if (!id) return;

    const driverRef = doc(db, COLLECTIONS.DRIVERS, id as string);
    const unsubscribe = onSnapshot(driverRef, (doc) => {
      if (doc.exists()) {
        setDriver({ id: doc.id, ...doc.data() } as Driver);
      } else {
        toast({
          title: 'Error',
          description: 'Usuario no encontrado',
          variant: 'destructive',
        });
      }
    });

    return () => unsubscribe();
  }, [id, toast]);

  const handleStatusUpdate = async (status: Driver['status']) => {
    if (!driver) return;

    try {
      console.log('Updating driver status:', { driverId: driver.id, status });
      await updateDoc(doc(db, COLLECTIONS.DRIVERS, driver.id), { 
        status,
        updatedAt: new Date()
      });
      toast({
        title: 'Éxito',
        description: `Estado actualizado a ${status}`,
      });
    } catch (error: any) {
      console.error('Error updating driver status:', error);
      toast({
        title: 'Error',
        description: `No se pudo actualizar el estado: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  if (!driver) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p>Repartidor no encontrado</p>
        <Button onClick={() => router.push('/admin/repartidores')}>
          Volver a Repartidores
        </Button>
      </div>
    );
  }

  const vehicleTypeKey = driver.vehicleType && vehicleIcons.hasOwnProperty(driver.vehicleType)
    ? driver.vehicleType as keyof typeof vehicleIcons
    : 'CAR';
  const VehicleIcon = vehicleIcons[vehicleTypeKey];

  return (
    <div className="space-y-6">
      <Section>
        <PageToolbar
          left={
            <div className="flex items-center gap-4 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/admin/repartidores')}
              >
                <ArrowLeft />
                Volver
              </Button>
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium">
                  {driver.fullName ? driver.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'DR'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-medium truncate">{driver.email}</p>
              </div>
            </div>
          }
          right={
            <Badge className={statusColors[driver.status]}>
              {driver.status}
            </Badge>
          }
        />
      </Section>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Calificación</p>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="text-xl font-bold">{driver.rating || 0}</span>
                </div>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Entregas</p>
                <p className="text-2xl font-bold">{driver.totalDeliveries || 0}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ganancias Este Mes</p>
                <p className="text-2xl font-bold text-green-600">
                  ${driver.earnings?.currentMonth || 0}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vehículo</p>
                <p className="text-lg font-medium">{driver.vehicleType || (typeof driver.vehicle === 'object' && driver.vehicle?.type) || '-'}</p>
              </div>
              <VehicleIcon className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 overflow-x-auto">
          <TabsTrigger value="personal" className="text-xs sm:text-sm">Información</TabsTrigger>
          <TabsTrigger value="documents" className="text-xs sm:text-sm">Documentos</TabsTrigger>
          <TabsTrigger value="legal" className="text-xs sm:text-sm">Contratos</TabsTrigger>
          <TabsTrigger value="training" className="text-xs sm:text-sm">Capacitación</TabsTrigger>
          <TabsTrigger value="earnings" className="text-xs sm:text-sm">Ganancias</TabsTrigger>
          <TabsTrigger value="actions" className="text-xs sm:text-sm">Acciones</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Datos Personales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nombre Completo</label>
                  <p className="text-sm sm:text-base">{driver.fullName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">RFC</label>
                  <p className="text-sm sm:text-base">{driver.rfc || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">NSS</label>
                  <p className="text-sm sm:text-base">{driver.nss || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">CURP</label>
                  <p className="text-sm sm:text-base">{driver.curp || '-'}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="flex items-center gap-2 min-w-0">
                  <Mail className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <span className="text-sm sm:text-base truncate">{driver.email}</span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <span className="text-sm sm:text-base truncate">{driver.phone}</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                <span>{driver.address || '-'}</span>
              </div>

              {driver.emergencyContact && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Contacto de Emergencia</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Nombre</label>
                        <p className="text-sm sm:text-base">{driver.emergencyContact.name || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Teléfono</label>
                        <p className="text-sm sm:text-base truncate">{driver.emergencyContact.phone || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Relación</label>
                        <p className="text-sm sm:text-base">{driver.emergencyContact.relationship || '-'}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Solo información que NO está en otras pestañas */}
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Estado Financiero
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Saldo Actual</label>
                    <p className={`font-medium text-sm sm:text-base ${(driver.walletBalance || 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ${(driver.walletBalance || 0).toLocaleString('es-MX')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Deudas Pendientes</label>
                    <p className={`font-medium text-sm sm:text-base ${(driver.pendingDebts || 0) > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                      ${(driver.pendingDebts || 0).toLocaleString('es-MX')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Límite de Crédito</label>
                    <p className="font-medium text-sm sm:text-base">${(driver.driverDebtLimit || 300).toLocaleString('es-MX')}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Fechas Importantes
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Fecha de Alta</label>
                    <p className="text-sm sm:text-base">{(() => {
                      const dateValue = driver.onboardingDate || driver.createdAt;
                      if (!dateValue) return '-';
                      
                      try {
                        let date: Date;
                        if (dateValue.seconds) {
                          // Firestore Timestamp
                          date = new Date(dateValue.seconds * 1000);
                        } else if (typeof dateValue === 'string' || typeof dateValue === 'number') {
                          // String or number timestamp
                          date = new Date(dateValue);
                        } else if (dateValue instanceof Date) {
                          // Already a Date object
                          date = dateValue;
                        } else {
                          return '-';
                        }
                        
                        return isNaN(date.getTime()) ? '-' : format(date, 'dd/MM/yyyy', { locale: es });
                      } catch (error) {
                        console.error('Error formatting date:', error);
                        return '-';
                      }
                    })()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Último Acceso</label>
                    <p className="text-sm sm:text-base">{(() => {
                      const dateValue = driver.lastLogin;
                      if (!dateValue) return '-';
                      
                      try {
                        let date: Date;
                        if (dateValue.seconds) {
                          // Firestore Timestamp
                          date = new Date(dateValue.seconds * 1000);
                        } else if (typeof dateValue === 'string' || typeof dateValue === 'number') {
                          // String or number timestamp
                          date = new Date(dateValue);
                        } else if (dateValue instanceof Date) {
                          // Already a Date object
                          date = dateValue;
                        } else {
                          return '-';
                        }
                        
                        return isNaN(date.getTime()) ? '-' : format(date, 'dd/MM/yyyy HH:mm', { locale: es });
                      } catch (error) {
                        console.error('Error formatting date:', error);
                        return '-';
                      }
                    })()}</p>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estado y Carga de Documentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { key: 'ine', label: 'INE/Pasaporte' },
                  { key: 'license', label: 'Licencia de Conducir' },
                  { key: 'proofOfAddress', label: 'Comprobante de Domicilio' },
                  { key: 'vehicleRegistration', label: 'Tarjeta de Circulación' },
                  { key: 'insurance', label: 'Póliza de Seguro' },
                ].map(({ key, label }) => {
                  const docData = driver.documents?.[key] || {};
                  const isObject = typeof docData === 'object' && docData !== null;
                  return (
                    <div key={key} className="flex flex-col md:flex-row md:items-center justify-between p-3 border rounded gap-2">
                      <div>
                        <p className="font-medium">{label}</p>
                        {isObject && 'expiryDate' in docData && docData.expiryDate && (
                          <p className="text-sm text-gray-500">
                            Vence: {format(new Date(docData.expiryDate), 'dd/MM/yyyy', { locale: es })}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {(isObject ? docData.url : docData) && (
                          <Button size="sm" variant="outline" onClick={() => window.open(isObject ? docData.url : docData)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          style={{ display: 'none' }}
                          id={`upload-${key}`}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const filePath = `drivers/${driver.id}/${key}_${Date.now()}_${file.name}`;
                            const sRef = storageRef(storage, filePath);
                            await uploadBytes(sRef, file);
                            const url = await getDownloadURL(sRef);
                            await updateDoc(doc(db, COLLECTIONS.DRIVERS, driver.id), {
                              [`documents.${key}.url`]: url,
                              [`documents.${key}.uploadedAt`]: new Date(),
                              [`documents.${key}.status`]: 'approved',
                              [`documents.${key}.verified`]: true,
                              [`documents.${key}.verifiedBy`]: 'admin',
                              [`documents.${key}.verifiedAt`]: new Date(),
                            });
                            setDriver((prev) => prev ? ({
                              ...prev,
                              documents: {
                                ...prev.documents,
                                [key]: {
                                  ...(prev.documents?.[key] || {}),
                                  url,
                                  uploadedAt: new Date(),
                                  status: 'approved',
                                  verified: true,
                                  verifiedBy: 'admin',
                                  verifiedAt: new Date(),
                                }
                              }
                            }) : prev);
                          }}
                        />
                        <label htmlFor={`upload-${key}`}>
                          <Button asChild size="sm" variant="outline">
                            <span>
                              <Upload className="h-4 w-4 mr-1" />
                              {docData.url ? 'Actualizar' : 'Subir'}
                            </span>
                          </Button>
                        </label>
                        {docData.status === 'pending' && (
                          <div className="flex gap-1">
                            <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-6 px-2 text-xs bg-green-50 hover:bg-green-100"
                              onClick={async () => {
                                try {
                                  await updateDoc(doc(db, COLLECTIONS.DRIVERS, driver.id), {
                                    [`documents.${key}.status`]: 'approved',
                                    [`documents.${key}.verifiedAt`]: new Date(),
                                    [`documents.${key}.verifiedBy`]: 'admin',
                                    [`documents.${key}.verified`]: true
                                  });
                                  
                                  // Actualizar estado local inmediatamente
                                  setDriver(prev => prev ? {
                                    ...prev,
                                    documents: {
                                      ...prev.documents,
                                      [key]: {
                                        ...prev.documents?.[key],
                                        status: 'approved',
                                        verified: true,
                                        verifiedAt: new Date(),
                                        verifiedBy: 'admin'
                                      }
                                    }
                                  } : prev);

                                  toast({
                                    title: 'Documento aprobado',
                                    description: `${label} ha sido aprobado`,
                                  });
                                } catch (error) {
                                  toast({
                                    title: 'Error',
                                    description: 'No se pudo aprobar el documento',
                                    variant: 'destructive'
                                  });
                                }
                              }}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Aprobar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-6 px-2 text-xs bg-red-50 hover:bg-red-100"
                              onClick={async () => {
                                try {
                                  await updateDoc(doc(db, COLLECTIONS.DRIVERS, driver.id), {
                                    [`documents.${key}.status`]: 'rejected',
                                    [`documents.${key}.rejectedAt`]: new Date(),
                                    [`documents.${key}.rejectedBy`]: 'admin',
                                    [`documents.${key}.verified`]: false
                                  });
                                  
                                  // Actualizar estado local inmediatamente
                                  setDriver(prev => prev ? {
                                    ...prev,
                                    documents: {
                                      ...prev.documents,
                                      [key]: {
                                        ...prev.documents?.[key],
                                        status: 'rejected',
                                        verified: false,
                                        rejectedAt: new Date(),
                                        rejectedBy: 'admin'
                                      }
                                    }
                                  } : prev);

                                  toast({
                                    title: 'Documento rechazado',
                                    description: `${label} ha sido rechazado`,
                                    variant: 'destructive'
                                  });
                                } catch (error) {
                                  toast({
                                    title: 'Error',
                                    description: 'No se pudo rechazar el documento',
                                    variant: 'destructive'
                                  });
                                }
                              }}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Rechazar
                            </Button>
                          </div>
                        )}
                        {docData.status === 'approved' && <Badge className="bg-green-100 text-green-800">Aprobado</Badge>}
                        {docData.status === 'rejected' && <Badge className="bg-red-100 text-red-800">Rechazado</Badge>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña de Contratos y Firma */}
        <TabsContent value="legal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Contratos y Documentos Legales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Firma Digital */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">Firma Digital del Contrato</h4>
                {driver.signature ? (
                  <div className="space-y-2">
                    <img 
                      src={driver.signature} 
                      alt="Firma digital" 
                      className="border rounded max-w-md h-32 object-contain bg-white"
                    />
                    <p className="text-sm text-gray-600">
                      Firmado durante el registro
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500">No hay firma digital registrada</p>
                )}
              </div>

              {/* Documentos Legales Firmados */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">Documentos Legales Firmados</h4>
                <AdminSignedDocumentsSection driverEmail={driver.email} />
              </div>

              {/* Información Legal */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">📋 Información Legal</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Todos los documentos fueron aceptados durante el proceso de registro</li>
                  <li>• La firma digital tiene validez legal según la normativa mexicana</li>
                  <li>• Los contratos se almacenan de forma segura y están disponibles para auditorías</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña de Capacitación */}
        <TabsContent value="training" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Capacitación y Certificaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Estado General de Capacitación */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded">
                  <p className="text-sm text-gray-500">Estado General</p>
                  <Badge className={driver.trainingCompleted ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                    {driver.trainingCompleted ? "Completada" : "Pendiente"}
                  </Badge>
                </div>
                <div className="text-center p-4 border rounded">
                  <p className="text-sm text-gray-500">Módulos Completados</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {driver.training?.completedModules || 0}/{driver.training?.totalModules || 3}
                  </p>
                </div>
                <div className="text-center p-4 border rounded">
                  <p className="text-sm text-gray-500">Puntuación Final</p>
                  <p className="text-2xl font-bold text-green-600">
                    {driver.training?.finalScore || 0}%
                  </p>
                </div>
              </div>

              {/* Módulos de Capacitación */}
              <div className="space-y-3">
                <h4 className="font-semibold">Módulos de Capacitación</h4>
                
                {driver.training?.modules && driver.training.modules.length > 0 ? (
                  driver.training.modules.map((module: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="font-medium">{module.name}</h5>
                        <Badge className={
                          module.status === 'completed' ? "bg-green-100 text-green-800" :
                          module.status === 'in_progress' ? "bg-yellow-100 text-yellow-800" :
                          "bg-gray-100 text-gray-800"
                        }>
                          {module.status === 'completed' ? 'Completado' :
                           module.status === 'in_progress' ? 'En Progreso' : 'Pendiente'}
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            module.status === 'completed' ? 'bg-green-600' :
                            module.status === 'in_progress' ? 'bg-yellow-500' : 'bg-gray-400'
                          }`}
                          style={{width: `${module.progress || 0}%`}}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Puntuación: {module.score || 0}% | Tiempo: {module.duration || 0} min
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No hay módulos de capacitación registrados</p>
                  </div>
                )}
              </div>

              {/* Certificaciones */}
              {driver.training?.certification ? (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">🏆 Certificación Obtenida</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-green-700">{driver.training.certification.title}</p>
                      <p className="text-sm text-green-600">
                        Válida hasta: {driver.training.certification.expiryDate 
                          ? new Date(driver.training.certification.expiryDate).toLocaleDateString('es-MX')
                          : 'Sin fecha de vencimiento'
                        }
                      </p>
                    </div>
                    {driver.training.certification.certificateUrl && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(driver.training?.certification?.certificateUrl, '_blank')}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Descargar Certificado
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Certificación Pendiente</h4>
                  <p className="text-sm text-yellow-700">
                    El repartidor debe completar todos los módulos de capacitación para obtener su certificación.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="earnings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Ganancias</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded">
                  <p className="text-sm text-gray-500">Esta Semana</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ${driver.earnings?.currentWeek || 0}
                  </p>
                </div>
                <div className="text-center p-4 border rounded">
                  <p className="text-sm text-gray-500">Este Mes</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${driver.earnings?.currentMonth || 0}
                  </p>
                </div>
                <div className="text-center p-4 border rounded">
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-2xl font-bold text-purple-600">
                    ${driver.earnings?.totalEarnings || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Acciones Administrativas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={() => handleStatusUpdate('ACTIVE')}
                  disabled={driver.status === 'ACTIVE'}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Activar Repartidor
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleStatusUpdate('SUSPENDED')}
                  disabled={driver.status === 'SUSPENDED'}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Suspender Repartidor
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push(`/admin/repartidores/${driver.id}/edit`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Información
                </Button>
                <Button 
                  variant="outline"
                  onClick={async () => {
                    try {
                      // Generar reporte del repartidor
                      const reportData = {
                        repartidor: {
                          nombre: driver.fullName,
                          email: driver.email,
                          telefono: driver.phone,
                          rfc: driver.rfc,
                          nss: driver.nss,
                          curp: driver.curp,
                          status: driver.status
                        },
                        billetera: {
                          saldo: driver.walletBalance || 0,
                          deudas: driver.pendingDebts || 0
                        },
                        vehiculo: {
                          tipo: driver.vehicleType || 'N/A',
                          placas: driver.vehiclePlates || 'N/A'
                        },
                        fechaGeneracion: new Date().toLocaleString('es-MX')
                      };

                      // Crear y descargar archivo JSON
                      const dataStr = JSON.stringify(reportData, null, 2);
                      const dataBlob = new Blob([dataStr], {type: 'application/json'});
                      const url = URL.createObjectURL(dataBlob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `reporte_${driver.fullName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);

                      toast({
                        title: 'Reporte generado',
                        description: 'El reporte se descargó correctamente',
                      });
                    } catch (error) {
                      toast({
                        title: 'Error',
                        description: 'No se pudo generar el reporte',
                        variant: 'destructive'
                      });
                    }
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Generar Reporte
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default withAuth(DriverDetailPage, {
  requiredRoles: ['ADMIN', 'SUPER_ADMIN', 'CONTADORA'],
});
