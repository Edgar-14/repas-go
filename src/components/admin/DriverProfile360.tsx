"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Star,
  Award,
  Target,
  Activity,
  FileText,
  CreditCard,
  Truck,
  Shield,
  Download,
  Eye,
  Edit,
  MessageSquare,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { COLLECTIONS } from "@/lib/collections";
import { AdvancedTable } from "@/components/ui/advanced-table";
// // Firebase Functions imports removed - not needed in frontend
// Removed - not needed in frontend
interface DriverProfile360Props {
  driverId: string;
  onClose?: () => void;
}

interface DriverData {
  id: string;
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
    profileImage?: string;
    status: string;
    registrationDate: Date;
    lastActive: Date;
  };
  documents: {
    valid: boolean;
    expired: string[];
    expiring: string[];
    total: number;
  };
  performance: {
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    averageRating: number;
    totalEarnings: number;
    monthlyEarnings: number;
    completionRate: number;
    onTimeRate: number;
  };
  wallet: {
    balance: number;
    pendingDebts: number;
    totalTransactions: number;
    lastTransaction: Date;
  };
  classification: {
    level: string;
    points: number;
    nextLevel: string;
    progress: number;
  };
  compliance: {
    imss: boolean;
    isr: boolean;
    cfdi: boolean;
    documents: boolean;
  };
}

export function DriverProfile360({ driverId, onClose }: DriverProfile360Props) {
  const [driverData, setDriverData] = useState<DriverData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  useEffect(() => {
    loadDriverData();
  }, [driverId]);

  const loadDriverData = async () => {
    try {
      setLoading(true);
      
      // Cargar datos del repartidor
      const driverRef = doc(db, 'drivers', driverId);
      const driverSnap = await getDoc(driverRef);
      
      if (!driverSnap.exists()) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Repartidor no encontrado"
        });
        return;
      }

      const driver = driverSnap.data();
      
      // Cargar transacciones de wallet
      const walletQuery = query(
        collection(db, COLLECTIONS.WALLET_TRANSACTIONS),
        where('driverId', '==', driverId),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const walletSnap = await getDocs(walletQuery);
      const walletTransactions = walletSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Cargar órdenes recientes - Using ORDERS collection per BEFAST FLUJO FINAL
      const ordersQuery = query(
        collection(db, COLLECTIONS.ORDERS),
        where('driverId', '==', driverId),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const ordersSnap = await getDocs(ordersQuery);
      const recentOrders = ordersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Procesar datos
      const processedData: DriverData = {
        id: driverId,
        personalInfo: {
          name: driver.name || 'Sin nombre',
          email: driver.email || '',
          phone: driver.phone || '',
          address: driver.address || '',
          profileImage: driver.profileImage,
          status: driver.status || 'INACTIVE',
          registrationDate: driver.registrationDate?.toDate() || new Date(),
          lastActive: driver.lastActive?.toDate() || new Date(),
        },
        documents: {
          valid: driver.documentsValid || false,
          expired: driver.expiredDocuments || [],
          expiring: driver.expiringDocuments || [],
          total: Object.keys(driver.documents || {}).length,
        },
        performance: {
          totalOrders: driver.totalOrders || 0,
          completedOrders: driver.completedOrders || 0,
          cancelledOrders: driver.cancelledOrders || 0,
          averageRating: driver.averageRating || 0,
          totalEarnings: driver.totalEarnings || 0,
          monthlyEarnings: driver.monthlyEarnings || 0,
          completionRate: driver.completionRate || 0,
          onTimeRate: driver.onTimeRate || 0,
        },
        wallet: {
          balance: driver.walletBalance || 0,
          pendingDebts: driver.pendingDebts || 0,
          totalTransactions: walletTransactions.length,
          lastTransaction: (walletTransactions[0] as any)?.createdAt?.toDate() || new Date(),
        },
        classification: {
          level: driver.classificationLevel || 'NUEVO',
          points: driver.classificationPoints || 0,
          nextLevel: getNextLevel(driver.classificationLevel || 'NUEVO'),
          progress: calculateProgress(driver.classificationPoints || 0, driver.classificationLevel || 'NUEVO'),
        },
        compliance: {
          imss: driver.imssCompliant || false,
          isr: driver.isrCompliant || false,
          cfdi: driver.cfdiCompliant || false,
          documents: driver.documentsValid || false,
        },
      };

      setDriverData(processedData);
    } catch (error) {
      console.error('Error loading driver data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los datos del repartidor"
      });
    } finally {
      setLoading(false);
    }
  };

  const getNextLevel = (currentLevel: string): string => {
    const levels = ['NUEVO', 'BRONCE', 'PLATA', 'ORO', 'DIAMANTE'];
    const currentIndex = levels.indexOf(currentLevel);
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : 'MÁXIMO';
  };

  const calculateProgress = (points: number, level: string): number => {
    const levelThresholds = { NUEVO: 0, BRONCE: 100, PLATA: 300, ORO: 600, DIAMANTE: 1000 };
    const currentThreshold = levelThresholds[level as keyof typeof levelThresholds] || 0;
    const nextThreshold = levelThresholds[getNextLevel(level) as keyof typeof levelThresholds] || 1000;
    
    if (nextThreshold === currentThreshold) return 100;
    
    return Math.min(100, ((points - currentThreshold) / (nextThreshold - currentThreshold)) * 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      case 'SUSPENDED': return 'bg-red-100 text-red-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplianceIcon = (compliant: boolean) => {
    return compliant ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando perfil del repartidor...</p>
        </div>
      </div>
    );
  }

  if (!driverData) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">No se encontraron datos del repartidor</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header del perfil */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={driverData.personalInfo.profileImage} />
                <AvatarFallback>
                  {driverData.personalInfo.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{driverData.personalInfo.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getStatusColor(driverData.personalInfo.status)}>
                    {driverData.personalInfo.status}
                  </Badge>
                  <Badge variant="outline">
                    {driverData.classification.level}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                Contactar
              </Button>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              {onClose && (
                <Button variant="outline" size="sm" onClick={onClose}>
                  Cerrar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs principales */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="performance">Rendimiento</TabsTrigger>
          <TabsTrigger value="financial">Financiero</TabsTrigger>
          <TabsTrigger value="compliance">Cumplimiento</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        {/* Tab: Resumen */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium">Órdenes Totales</span>
                </div>
                <div className="text-2xl font-bold mt-2">{driverData.performance.totalOrders}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">Ganancias Totales</span>
                </div>
                <div className="text-2xl font-bold mt-2">${driverData.performance.totalEarnings.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm font-medium">Calificación</span>
                </div>
                <div className="text-2xl font-bold mt-2">{driverData.performance.averageRating.toFixed(1)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium">Tasa de Completado</span>
                </div>
                <div className="text-2xl font-bold mt-2">{driverData.performance.completionRate.toFixed(1)}%</div>
              </CardContent>
            </Card>
          </div>

          {/* Información personal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{driverData.personalInfo.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{driverData.personalInfo.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{driverData.personalInfo.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    Registrado: {driverData.personalInfo.registrationDate.toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Clasificación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Clasificación Actual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Nivel: {driverData.classification.level}</span>
                  <span className="text-sm text-gray-500">Siguiente: {driverData.classification.nextLevel}</span>
                </div>
                <Progress value={driverData.classification.progress} className="h-2" />
                <div className="text-center text-sm text-gray-600">
                  {driverData.classification.points} puntos
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Rendimiento */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Métricas de Rendimiento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Órdenes Completadas</span>
                  <Badge variant="outline">{driverData.performance.completedOrders}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Órdenes Canceladas</span>
                  <Badge variant="outline">{driverData.performance.cancelledOrders}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Tasa de Completado</span>
                  <Badge variant="outline">{driverData.performance.completionRate.toFixed(1)}%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Puntualidad</span>
                  <Badge variant="outline">{driverData.performance.onTimeRate.toFixed(1)}%</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ganancias</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Total Histórico</span>
                  <span className="font-semibold">${driverData.performance.totalEarnings.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Este Mes</span>
                  <span className="font-semibold">${driverData.performance.monthlyEarnings.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Promedio por Orden</span>
                  <span className="font-semibold">
                    ${driverData.performance.totalOrders > 0 
                      ? (driverData.performance.totalEarnings / driverData.performance.totalOrders).toFixed(2)
                      : '0.00'
                    }
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Financiero */}
        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Estado de Billetera</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Saldo Actual</span>
                  <span className={`font-semibold ${driverData.wallet.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${driverData.wallet.balance.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Deudas Pendientes</span>
                  <span className="font-semibold text-orange-600">
                    ${driverData.wallet.pendingDebts.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Total Transacciones</span>
                  <span className="font-semibold">{driverData.wallet.totalTransactions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Última Transacción</span>
                  <span className="text-sm text-gray-500">
                    {driverData.wallet.lastTransaction.toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Acciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar Estado de Cuenta
                </Button>
                <Button className="w-full" variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Historial Completo
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Cumplimiento */}
        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Estado de Cumplimiento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {getComplianceIcon(driverData.compliance.imss)}
                    <span>IMSS</span>
                  </div>
                  <Badge variant={driverData.compliance.imss ? "default" : "destructive"}>
                    {driverData.compliance.imss ? "Cumple" : "No cumple"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {getComplianceIcon(driverData.compliance.isr)}
                    <span>ISR</span>
                  </div>
                  <Badge variant={driverData.compliance.isr ? "default" : "destructive"}>
                    {driverData.compliance.isr ? "Cumple" : "No cumple"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {getComplianceIcon(driverData.compliance.cfdi)}
                    <span>CFDI</span>
                  </div>
                  <Badge variant={driverData.compliance.cfdi ? "default" : "destructive"}>
                    {driverData.compliance.cfdi ? "Cumple" : "No cumple"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {getComplianceIcon(driverData.compliance.documents)}
                    <span>Documentos</span>
                  </div>
                  <Badge variant={driverData.compliance.documents ? "default" : "destructive"}>
                    {driverData.compliance.documents ? "Válidos" : "Vencidos"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {driverData.documents.expired.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Documentos Vencidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {driverData.documents.expired.map((doc, index) => (
                    <div key={index} className="flex items-center gap-2 text-red-600">
                      <XCircle className="h-4 w-4" />
                      <span>{doc}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {driverData.documents.expiring.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-600">
                  <AlertTriangle className="h-5 w-5" />
                  Documentos por Vencer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {driverData.documents.expiring.map((doc, index) => (
                    <div key={index} className="flex items-center gap-2 text-yellow-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{doc}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Historial */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Historial de actividad en desarrollo</p>
                <p className="text-sm">Esta funcionalidad estará disponible próximamente</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
