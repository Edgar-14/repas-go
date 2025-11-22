'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { DocumentUpload } from '@/components/ui/document-upload';
import { 
  DollarSign, 
  Loader2, 
  Save,
  Settings,
  FileText,
  Users,
  Shield,
  Percent,
  Bike,
  Star,
  Upload,
  X,
  Eye,
  Edit3
} from 'lucide-react';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp,
  addDoc,
  collection,
  getDocs
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { db, storage } from '@/lib/firebase';
import { getAuth, onAuthStateChanged, type User } from 'firebase/auth';
import { COLLECTIONS } from '@/lib/collections';
import withAuth from '@/components/auth/withAuth';
import { TextEditorModal } from '@/components/ui/text-editor-modal';
import { Section, PageToolbar } from '@/components/layout/primitives';

interface DocumentConfig {
  url?: string;
  name?: string;
  uploadDate?: Date;
  content?: string;
}

interface GlobalSettings {
  // Tarifas y límites básicos
  cashOrderCommissionType: 'amount' | 'percent';
  cashOrderCommission: number;
  driverDebtLimit: number;
  maxAssignedOrders: number;
  minRatingRequired: number;
  
  // Tarifas adicionales
  rainFeeType: 'amount' | 'percent';
  rainFee: number;
  nightFeeType: 'amount' | 'percent';
  nightFee: number;
  zoneFeeType: 'amount' | 'percent';
  zoneFee: number;
  bonusPerOrderType: 'amount' | 'percent';
  bonusPerOrder: number;
  specialScheduleFeeType: 'amount' | 'percent';
  specialScheduleFee: number;
  
  // Penalizaciones
  penaltyType: 'amount' | 'percent';
  penaltyValue: number;
  penaltyTarget: string;
  
  // Personalización de perfil
  classificationEnabled: boolean;
  minAverageRating: number;
  minTotalOrders: number;
  minOnTimeRate: number;
  minAcceptanceRate: number;
  
  // Documentos legales
  driverContract: DocumentConfig;
  algorithmicPolicy: DocumentConfig;
  contractInstructions: DocumentConfig;
  privacyPolicyPortal: DocumentConfig;
  privacyPolicyBusiness: DocumentConfig;
}

function NewSettingsPage() {
  const { toast } = useToast();
  const auth = getAuth();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Estados adicionales
  const [drivers, setDrivers] = useState<any[]>([]);
  const [penaltySearch, setPenaltySearch] = useState('');
  const [showDriverList, setShowDriverList] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState<Record<string, boolean>>({});
  const driverInputRef = useRef<HTMLInputElement>(null);
  const [textEditorModal, setTextEditorModal] = useState<{
    isOpen: boolean;
    docType: keyof GlobalSettings | null;
    title: string;
    content: string;
  }>({
    isOpen: false,
    docType: null,
    title: '',
    content: ''
  });

  const [settings, setSettings] = useState<GlobalSettings>({
    // Tarifas y límites básicos
    cashOrderCommissionType: 'amount',
    cashOrderCommission: 15.0,
    driverDebtLimit: -300.0,
    maxAssignedOrders: 3,
    minRatingRequired: 4.2,
    
    // Tarifas adicionales
    rainFeeType: 'amount',
    rainFee: 10.0,
    nightFeeType: 'amount',
    nightFee: 8.0,
    zoneFeeType: 'amount',
    zoneFee: 5.0,
    bonusPerOrderType: 'amount',
    bonusPerOrder: 3.0,
    specialScheduleFeeType: 'amount',
    specialScheduleFee: 12.0,
    
    // Penalizaciones
    penaltyType: 'amount',
    penaltyValue: 20.0,
    penaltyTarget: '',
    
    // Personalización de perfil
    classificationEnabled: true,
    minAverageRating: 4.2,
    minTotalOrders: 0,
    minOnTimeRate: 0,
    minAcceptanceRate: 0,
    
    // Documentos legales
    driverContract: {},
    algorithmicPolicy: {},
    contractInstructions: {},
    privacyPolicyPortal: {},
    privacyPolicyBusiness: {},
  });

  // Cargar repartidores para autocompletado
  useEffect(() => {
    const loadDrivers = async () => {
      try {
        const driversSnap = await getDocs(collection(db, 'drivers'));
        setDrivers(driversSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error('Error loading drivers:', error);
      }
    };
    loadDrivers();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const settingsRef = doc(db, 'configuration', 'globalSettings');
        const docSnap = await getDoc(settingsRef);
        if (docSnap.exists()) {
          setSettings(prev => ({...prev, ...docSnap.data()}));
        }
      } catch (error) {
        console.error("Error fetching settings: ", error);
        toast({ 
          variant: 'destructive', 
          title: 'Error', 
          description: 'No se pudieron cargar las configuraciones.' 
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [toast]);

  const handleSettingsChange = (field: keyof GlobalSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handlePenaltyDriverSelect = (driverId: string, driverName: string) => {
    setSettings(prev => ({ ...prev, penaltyTarget: driverId }));
    setPenaltySearch(driverName);
    setShowDriverList(false);
  };

  const clearPenaltySearch = () => {
    setPenaltySearch('');
    setSettings(prev => ({ ...prev, penaltyTarget: '' }));
    setShowDriverList(false);
  };

  const handleFileUpload = async (docType: keyof GlobalSettings, file: File) => {
    if (!currentUser) {
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: 'Debes iniciar sesión para subir archivos.' 
      });
      return;
    }

    setUploadingDocs(prev => ({ ...prev, [docType]: true }));
    
    try {
      const fileName = `${docType}_${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `legal-documents/${fileName}`);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      const documentConfig: DocumentConfig = {
        url: downloadURL,
        name: file.name,
        uploadDate: new Date()
      };
      
      setSettings(prev => ({
        ...prev,
        [docType]: documentConfig
      }));
      
      toast({ 
        title: 'Éxito', 
        description: `${file.name} subido correctamente.` 
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: 'No se pudo subir el archivo.' 
      });
    } finally {
      setUploadingDocs(prev => ({ ...prev, [docType]: false }));
    }
  };

  const handleRemoveDocument = async (docType: keyof GlobalSettings) => {
    try {
      const docConfig = settings[docType] as DocumentConfig;
      if (docConfig?.url) {
        try {
          const fileRef = ref(storage, docConfig.url);
          await deleteObject(fileRef);
        } catch (storageError) {
          console.log('File might not exist in storage:', storageError);
        }
      }
      
      setSettings(prev => ({
        ...prev,
        [docType]: {}
      }));
      
      toast({ 
        title: 'Éxito', 
        description: 'Documento eliminado correctamente.' 
      });
    } catch (error) {
      console.error('Error removing document:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: 'No se pudo eliminar el documento.' 
      });
    }
  };

  const handleOpenTextEditor = (docType: keyof GlobalSettings, title: string) => {
    const docConfig = settings[docType] as DocumentConfig;
    setTextEditorModal({
      isOpen: true,
      docType,
      title,
      content: docConfig?.content || ''
    });
  };

  const handleSaveTextDocument = async (content: string) => {
    if (!textEditorModal.docType) return;

    const docType = textEditorModal.docType;

    try {
      const newDocumentConfig = {
        content: content,
        name: `${textEditorModal.title}.html`,
        uploadDate: new Date(),
      };
      
      // Actualizar estado local
      setSettings(prev => ({
        ...prev,
        [docType]: newDocumentConfig
      }));

      // Guardar inmediatamente en Firestore
      const settingsRef = doc(db, 'configuration', 'globalSettings');
      await setDoc(settingsRef, { [docType]: newDocumentConfig }, { merge: true });
      
      toast({
        title: "Documento guardado",
        description: "El documento se ha guardado correctamente en la base de datos.",
      });

      setTextEditorModal(prev => ({ ...prev, isOpen: false, docType: null, title: '', content: '' }));

    } catch (error) {
      console.error('Error saving text document:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el documento.",
        variant: "destructive",
      });
    }
  };

  const handleSaveChanges = async () => {
    if (!currentUser) {
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: 'Debes iniciar sesión para realizar esta acción.' 
      });
      return;
    }
    
    setIsSaving(true);
    try {
      const settingsRef = doc(db, 'configuration', 'globalSettings');
      await setDoc(settingsRef, settings, { merge: true });

      await addDoc(collection(db, COLLECTIONS.AUDIT_LOGS), {
        adminId: currentUser.email,
        action: 'UPDATE_GLOBAL_SETTINGS',
        targetId: 'globalSettings',
        timestamp: serverTimestamp(),
        details: { newSettings: settings }
      });

      toast({ 
        title: 'Éxito', 
        description: 'Las configuraciones han sido guardadas.' 
      });
    } catch (error) {
      console.error("Error saving settings: ", error);
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: 'No se pudieron guardar las configuraciones.' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Componente FeeInput para tarifas
  const FeeInput = ({ 
    label, 
    typeField, 
    valueField, 
    description, 
    icon = DollarSign 
  }: {
    label: string;
    typeField: keyof GlobalSettings;
    valueField: keyof GlobalSettings;
    description: string;
    icon?: any;
  }) => {
    const Icon = icon;
    const feeType = settings[typeField] as string;
    const feeValue = settings[valueField] as number;
    
    return (
      <div className="space-y-3">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="flex gap-2">
          <Select 
            value={feeType} 
            onValueChange={(value) => handleSettingsChange(typeField, value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="amount">Monto Fijo</SelectItem>
              <SelectItem value="percent">Porcentaje</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative flex-1">
            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              type="number" 
              value={feeValue} 
              onChange={(e) => handleSettingsChange(valueField, Number(e.target.value))}
              className="pl-10" 
              min={0} 
            />
          </div>
        </div>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center text-center gap-4 h-96">
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
        <h3 className="text-xl font-bold">Cargando configuraciones...</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* UI Universal: Section + PageToolbar */}
      <Section>
        <PageToolbar
          left={
            <div className="text-sm text-muted-foreground">
              Administra tarifas, límites y documentos legales del sistema
            </div>
          }
          right={
            <Button 
              onClick={handleSaveChanges} 
              disabled={isSaving} 
              size="sm"
            >
              {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
              Guardar Cambios
            </Button>
          }
        />
      </Section>

      <div className="section-padding space-y-6">
        {/* Tarifas y Límites */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <Settings className="h-5 w-5" />
              Tarifas y Límites de Operación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Límites básicos */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Límite de Deuda (Efectivo)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    type="number" 
                    value={settings.driverDebtLimit} 
                    onChange={(e) => handleSettingsChange('driverDebtLimit', Number(e.target.value))}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500">Saldo negativo máximo antes de restringir pedidos en efectivo</p>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Máximo Pedidos Asignados</Label>
                <div className="relative">
                  <Bike className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    type="number" 
                    value={settings.maxAssignedOrders} 
                    onChange={(e) => handleSettingsChange('maxAssignedOrders', Number(e.target.value))}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500">Límite de pedidos activos para considerar disponible</p>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Calificación Mínima</Label>
                <div className="relative">
                  <Star className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    type="number" 
                    value={settings.minRatingRequired} 
                    onChange={(e) => handleSettingsChange('minRatingRequired', Number(e.target.value))}
                    className="pl-10"
                    min={0}
                    max={5}
                    step={0.1}
                  />
                </div>
                <p className="text-xs text-gray-500">Calificación mínima requerida para operar</p>
              </div>

              {/* Comisión base */}
              <FeeInput
                label="Comisión Base (Efectivo)"
                typeField="cashOrderCommissionType"
                valueField="cashOrderCommission"
                description="Comisión por pedidos en efectivo"
              />

              {/* Tarifas adicionales */}
              <FeeInput
                label="Tarifa Extra por Lluvia"
                typeField="rainFeeType"
                valueField="rainFee"
                description="Tarifa adicional por condiciones de lluvia"
              />

              <FeeInput
                label="Tarifa Nocturna"
                typeField="nightFeeType"
                valueField="nightFee"
                description="Tarifa adicional por horario nocturno"
              />

              <FeeInput
                label="Tarifa por Zona Especial"
                typeField="zoneFeeType"
                valueField="zoneFee"
                description="Tarifa adicional por zonas de alta demanda"
              />

              <FeeInput
                label="Bonificación por Pedido"
                typeField="bonusPerOrderType"
                valueField="bonusPerOrder"
                description="Bonificación extra por cada pedido completado"
              />

              <FeeInput
                label="Tarifa Horario Especial"
                typeField="specialScheduleFeeType"
                valueField="specialScheduleFee"
                description="Tarifa adicional por horarios especiales"
              />
            </div>

            <Separator className="my-6" />

            {/* Penalizaciones */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Penalizaciones</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Seleccionar Repartidor</Label>
                  <div className="relative">
                    <Input
                      ref={driverInputRef}
                      value={penaltySearch}
                      onChange={(e) => {
                        setPenaltySearch(e.target.value);
                        setShowDriverList(true);
                        if (!e.target.value) {
                          setSettings(prev => ({ ...prev, penaltyTarget: '' }));
                        }
                      }}
                      onFocus={() => setShowDriverList(true)}
                      placeholder="Buscar repartidor..."
                      className="w-full"
                    />
                    {showDriverList && penaltySearch && (
                      <div className="absolute z-10 bg-white border w-full max-h-40 overflow-y-auto shadow-lg rounded mt-1">
                        {drivers
                          .filter(d =>
                            d.fullName?.toLowerCase().includes(penaltySearch.toLowerCase()) ||
                            d.email?.toLowerCase().includes(penaltySearch.toLowerCase()) ||
                            d.id?.toLowerCase().includes(penaltySearch.toLowerCase())
                          )
                          .slice(0, 10)
                          .map(d => (
                            <div
                              key={d.id}
                              className="px-3 py-2 hover:bg-blue-100 cursor-pointer text-sm"
                              onClick={() => handlePenaltyDriverSelect(d.id, d.fullName || d.email)}
                            >
                              {d.fullName || d.email} 
                              <span className="text-xs text-gray-500 ml-2">({d.id})</span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                  {settings.penaltyTarget && (
                    <p className="text-xs text-green-600">
                      Repartidor seleccionado: {drivers.find(d => d.id === settings.penaltyTarget)?.fullName || settings.penaltyTarget}
                    </p>
                  )}
                </div>
                
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Penalización</Label>
                  <div className="flex gap-2">
                    <Select 
                      value={settings.penaltyType} 
                      onValueChange={(value) => handleSettingsChange('penaltyType', value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="amount">Monto Fijo</SelectItem>
                        <SelectItem value="percent">Porcentaje</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="relative flex-1">
                      {settings.penaltyType === 'percent' ? (
                        <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      ) : (
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      )}
                      <Input 
                        type="number" 
                        value={settings.penaltyValue} 
                        onChange={(e) => handleSettingsChange('penaltyValue', Number(e.target.value))}
                        className="pl-10" 
                        min={0} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personalización de Perfil de Repartidor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-600">
              <Users className="h-5 w-5" />
              Personalización de Perfil de Repartidor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    checked={settings.classificationEnabled} 
                    onChange={(e) => handleSettingsChange('classificationEnabled', e.target.checked)}
                    className="rounded"
                  />
                  <Label className="text-sm font-medium">Clasificación Visible</Label>
                </div>
                <p className="text-xs text-gray-500">Mostrar clasificación (Diamond, Gold, etc.) en el perfil</p>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Calificación Promedio Mínima</Label>
                <Input 
                  type="number" 
                  value={settings.minAverageRating} 
                  onChange={(e) => handleSettingsChange('minAverageRating', Number(e.target.value))}
                  min={0} 
                  max={5} 
                  step={0.1}
                />
                <p className="text-xs text-gray-500">Calificación mínima para mantener el perfil activo</p>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Pedidos Mínimos Completados</Label>
                <Input 
                  type="number" 
                  value={settings.minTotalOrders} 
                  onChange={(e) => handleSettingsChange('minTotalOrders', Number(e.target.value))}
                  min={0}
                />
                <p className="text-xs text-gray-500">Pedidos mínimos para beneficios o promociones</p>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">% Mínimo Entregas a Tiempo</Label>
                <Input 
                  type="number" 
                  value={settings.minOnTimeRate} 
                  onChange={(e) => handleSettingsChange('minOnTimeRate', Number(e.target.value))}
                  min={0} 
                  max={100}
                />
                <p className="text-xs text-gray-500">Porcentaje mínimo de entregas puntuales</p>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">% Mínimo Aceptación</Label>
                <Input 
                  type="number" 
                  value={settings.minAcceptanceRate} 
                  onChange={(e) => handleSettingsChange('minAcceptanceRate', Number(e.target.value))}
                  min={0} 
                  max={100}
                />
                <p className="text-xs text-gray-500">Porcentaje mínimo de pedidos aceptados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documentos Legales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <FileText className="h-5 w-5" />
              Documentos Legales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Documentos para registro de repartidores */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-600">Para Registro de Repartidores</h3>
                
                <DocumentUpload
                  title="Contrato de Repartidores"
                  description="Se muestra en la página 3 del registro de repartidores"
                  currentDocument={settings.driverContract}
                  onUpload={(file) => handleFileUpload('driverContract', file)}
                  onCreateText={() => handleOpenTextEditor('driverContract', 'Contrato de Repartidores')}
                  onRemove={() => handleRemoveDocument('driverContract')}
                  onView={() => settings.driverContract.url && window.open(settings.driverContract.url, '_blank')}
                  isUploading={uploadingDocs['driverContract']}
                  acceptedTypes={['pdf', 'doc', 'docx', 'txt']}
                  maxSize={5}
                />
                
                <DocumentUpload
                  title="Política Algorítmica"
                  description="Se muestra en la página 3 del registro de repartidores"
                  currentDocument={settings.algorithmicPolicy}
                  onUpload={(file) => handleFileUpload('algorithmicPolicy', file)}
                  onCreateText={() => handleOpenTextEditor('algorithmicPolicy', 'Política Algorítmica')}
                  onRemove={() => handleRemoveDocument('algorithmicPolicy')}
                  onView={() => settings.algorithmicPolicy.url && window.open(settings.algorithmicPolicy.url, '_blank')}
                  isUploading={uploadingDocs['algorithmicPolicy']}
                  acceptedTypes={['pdf', 'doc', 'docx', 'txt']}
                  maxSize={5}
                />
                
                <DocumentUpload
                  title="Instructivo de Llenado de Contrato"
                  description="Se muestra en la página 3 del registro de repartidores"
                  currentDocument={settings.contractInstructions}
                  onUpload={(file) => handleFileUpload('contractInstructions', file)}
                  onCreateText={() => handleOpenTextEditor('contractInstructions', 'Instructivo de Llenado de Contrato')}
                  onRemove={() => handleRemoveDocument('contractInstructions')}
                  onView={() => settings.contractInstructions.url && window.open(settings.contractInstructions.url, '_blank')}
                  isUploading={uploadingDocs['contractInstructions']}
                  acceptedTypes={['pdf', 'doc', 'docx', 'txt']}
                  maxSize={5}
                />
              </div>

              {/* Documentos para portales */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-green-600">Para Portales</h3>
                
                <DocumentUpload
                  title="Políticas de Privacidad (Portal)"
                  description="Se muestra en el portal de bienvenida"
                  currentDocument={settings.privacyPolicyPortal}
                  onUpload={(file) => handleFileUpload('privacyPolicyPortal', file)}
                  onCreateText={() => handleOpenTextEditor('privacyPolicyPortal', 'Políticas de Privacidad Portal')}
                  onRemove={() => handleRemoveDocument('privacyPolicyPortal')}
                  onView={() => settings.privacyPolicyPortal.url && window.open(settings.privacyPolicyPortal.url, '_blank')}
                  isUploading={uploadingDocs['privacyPolicyPortal']}
                  acceptedTypes={['pdf', 'doc', 'docx', 'txt']}
                  maxSize={5}
                />
                
                <DocumentUpload
                  title="Términos y Condiciones (Negocios)"
                  description="Se muestra en el registro de negocios"
                  currentDocument={settings.privacyPolicyBusiness}
                  onUpload={(file) => handleFileUpload('privacyPolicyBusiness', file)}
                  onCreateText={() => handleOpenTextEditor('privacyPolicyBusiness', 'Términos y Condiciones Negocios')}
                  onRemove={() => handleRemoveDocument('privacyPolicyBusiness')}
                  onView={() => settings.privacyPolicyBusiness.url && window.open(settings.privacyPolicyBusiness.url, '_blank')}
                  isUploading={uploadingDocs['privacyPolicyBusiness']}
                  acceptedTypes={['pdf', 'doc', 'docx', 'txt']}
                  maxSize={5}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modal de Editor de Texto */}
        <TextEditorModal
          isOpen={textEditorModal.isOpen}
          onClose={() => setTextEditorModal(prev => ({ ...prev, isOpen: false }))}
          onSave={handleSaveTextDocument}
          title={textEditorModal.title}
          initialContent={textEditorModal.content}
        />
      </div>
    </div>
  );
}

export default withAuth(NewSettingsPage, {
  requiredRoles: ['ADMIN', 'SUPER_ADMIN', 'CONTADORA'],
});
