'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/Input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Store, 
  DollarSign, 
  Calendar,
  Mail,
  Phone,
  MapPin,
  Search,
  Filter,
  Download,
  Plus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  UserPlus,
  PlusCircle,
  Loader2,
  CreditCard,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc, query, orderBy, limit } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/collections';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase';
import withAuth from '@/components/auth/withAuth';
import { Section, PageToolbar } from '@/components/layout/primitives';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Business {
  id: string;
  uid: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION' | 'INACTIVE';
  credits: number;
  availableCredits: number;
  totalCreditsUsed: number;
  totalOrders: number;
  totalSpent: number;
  defaultPickupAddress: string;
  savedAddresses: string[];
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isVerified?: boolean;
}

interface CreditTransaction {
  id: string;
  businessId: string;
  businessName?: string;
  amount: number;
  credits: number;
  type: 'PURCHASE' | 'USAGE' | 'REFUND' | 'ADJUSTMENT';
  description: string;
  proofUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  processedBy?: string;
  processedAt?: any;
  createdAt: any;
}

function BusinessesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [paginatedBusinesses, setPaginatedBusinesses] = useState<Business[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTab, setSelectedTab] = useState('businesses');
  const [addCreditsLoading, setAddCreditsLoading] = useState<string | null>(null);
  const [addAmount, setAddAmount] = useState<{ [id: string]: number }>({});
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newBusinessData, setNewBusinessData] = useState({
    businessName: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    password: ''
  });

  useEffect(() => {
    // Cargar transacciones de créditos
    const transactionsUnsubscribe = onSnapshot(
      query(
        collection(db, COLLECTIONS.CREDIT_TRANSACTIONS),
        orderBy('createdAt', 'desc'),
        limit(100)
      ),
      (snapshot) => {
        const transactionsData: CreditTransaction[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          transactionsData.push({
            id: doc.id,
            ...data
          } as CreditTransaction);
        });
        setTransactions(transactionsData);
      }
    );

    const unsubscribe = onSnapshot(
      collection(db, 'businesses'),
      (snapshot) => {
        const businessesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          lastLoginAt: doc.data().lastLoginAt?.toDate(),
        })) as Business[];
        
        console.log('Businesses loaded:', businessesData.length);
        setBusinesses(businessesData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching businesses:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los negocios",
          variant: "destructive",
        });
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
      transactionsUnsubscribe();
    };
  }, [toast]);

  useEffect(() => {
    let filtered = businesses;

    if (searchTerm) {
      filtered = filtered.filter(business =>
        business.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(business => business.status === statusFilter);
    }

    setFilteredBusinesses(filtered);
    setCurrentPage(1);
  }, [businesses, searchTerm, statusFilter]);

  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedBusinesses(filteredBusinesses.slice(startIndex, endIndex));
  }, [filteredBusinesses, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredBusinesses.length / itemsPerPage);

  const handleStatusChange = async (businessId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'businesses', businessId), {
        status: newStatus,
        updatedAt: new Date(),
      });

      toast({
        title: "Estado actualizado",
        description: `El negocio ahora está ${newStatus.toLowerCase()}`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      });
    }
  };

  const handleCreateAccount = async () => {
    if (!newBusinessData.businessName || !newBusinessData.contactName || 
        !newBusinessData.email || !newBusinessData.phone || !newBusinessData.address) {
      toast({
        title: "Campos requeridos",
        description: "Todos los campos son obligatorios",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const functions = getFunctions(app);
      const registerBusiness = httpsCallable(functions, 'registerBusiness');
      
      const result = await registerBusiness({
        businessName: newBusinessData.businessName,
        contactName: newBusinessData.contactName,
        email: newBusinessData.email,
        phone: newBusinessData.phone,
        address: newBusinessData.address,
        password: newBusinessData.password || 'BeFast2025!', // Password temporal
        adminCreated: true
      });
      
      if ((result.data as any).success) {
        toast({
          title: "Negocio creado exitosamente",
          description: `Se ha registrado ${newBusinessData.businessName} correctamente`,
        });
        
        // Reset form
        setNewBusinessData({
          businessName: '',
          contactName: '',
          email: '',
          phone: '',
          address: '',
          password: ''
        });
        setShowCreateDialog(false);
      } else {
        throw new Error((result.data as any).message || 'Error al crear el negocio');
      }
    } catch (error) {
      console.error('Error creating business:', error);
      toast({
        title: "Error al crear negocio",
        description: error instanceof Error ? error.message : "No se pudo crear el negocio. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'ACTIVE': { 
        label: 'Activo', 
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: <CheckCircle className="w-3 h-3" />
      },
      'SUSPENDED': { 
        label: 'Suspendido', 
        className: 'bg-red-100 text-red-800 border-red-200',
        icon: <XCircle className="w-3 h-3" />
      },
      'PENDING_VERIFICATION': { 
        label: 'Pendiente', 
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: <Clock className="w-3 h-3" />
      },
      'INACTIVE': { 
        label: 'Inactivo', 
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: <XCircle className="w-3 h-3" />
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['INACTIVE'];
    
    return (
      <Badge className={`gap-1 ${config.className}`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getVerificationBadge = (isVerified: boolean = false) => {
    return (
      <Badge className={`gap-1 ${
        isVerified 
          ? 'bg-blue-100 text-blue-800 border-blue-200'
          : 'bg-orange-100 text-orange-800 border-orange-200'
      }`}>
        {isVerified ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
        {isVerified ? 'Verificado' : 'Sin verificar'}
      </Badge>
    );
  };

  const handleExportCSV = () => {
    try {
      const csvContent = "data:text/csv;charset=utf-8," + 
        "Negocio,Contacto,Email,Estado,Créditos Disponibles,Créditos Usados,Total Pedidos,Registro\n" +
        businesses.map(b => 
          `"${b.businessName || ''}","${b.contactName || ''}","${b.email || ''}","${b.status || ''}","${b.availableCredits || 0}","${b.totalCreditsUsed || 0}","${b.totalOrders || 0}","${format(b.createdAt, 'dd/MM/yyyy')}"`
        ).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `negocios_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Exportación exitosa",
        description: "Los datos se han exportado correctamente",
      });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast({
        title: "Error",
        description: "No se pudo exportar el archivo CSV",
        variant: "destructive",
      });
    }
  };

  const handleExportCreditHistory = async () => {
    try {
      const functions = getFunctions(app);
      const exportCreditHistory = httpsCallable(functions, 'exportCreditHistory');
      
      const result = await exportCreditHistory({
        businessId: 'all',
        format: 'xlsx',
        includeTransactions: true
      });
      
      if ((result.data as any).success) {
        toast({
          title: 'Reporte generado',
          description: 'El historial de créditos se ha generado exitosamente',
        });
        
        const link = document.createElement('a');
        link.href = (result.data as any).downloadUrl;
        link.download = `historial_creditos_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
        link.click();
      } else {
        throw new Error((result.data as any).message || 'Error al generar reporte');
      }
    } catch (error) {
      console.error('Error exporting credit history:', error);
      toast({
        variant: 'destructive',
        title: 'Error al exportar',
        description: 'No se pudo generar el historial de créditos',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros y búsqueda */}
      <Section className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 w-full min-w-0">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 flex-shrink-0 h-4 w-4" />
            <Input
              placeholder="Buscar por nombre, contacto o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full text-xs sm:text-sm h-9 sm:h-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px] min-w-0 h-9 sm:h-10 text-xs sm:text-sm">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="ACTIVE">Activos</SelectItem>
              <SelectItem value="SUSPENDED">Suspendidos</SelectItem>
              <SelectItem value="PENDING_VERIFICATION">Pendientes</SelectItem>
              <SelectItem value="INACTIVE">Inactivos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Botones de acción */}
        <div className="grid grid-cols-3 gap-2 w-full sm:flex sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="w-full text-xs sm:text-sm sm:w-auto"
          >
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Exportar CSV</span>
            <span className="sm:hidden">CSV</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCreditHistory}
            className="w-full text-xs sm:text-sm sm:w-auto"
          >
            <FileText className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Historial</span>
            <span className="sm:hidden">Hist</span>
          </Button>
          <Button
            size="sm"
            onClick={() => setShowCreateDialog(true)}
            className="w-full text-xs sm:text-sm sm:w-auto"
          >
            <UserPlus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Crear Cuenta</span>
            <span className="sm:hidden">Crear</span>
          </Button>
        </div>
      </Section>

      {/* KPIs Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="card-mobile-header flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Negocios</CardTitle>
            <Store className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="card-mobile-content pt-0">
            <div className="text-lg sm:text-2xl font-bold">{businesses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="card-mobile-header flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium">Verificados</CardTitle>
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
          </CardHeader>
          <CardContent className="card-mobile-content pt-0">
            <div className="text-lg sm:text-2xl font-bold">
              {businesses.filter(b => b.status === 'ACTIVE').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="card-mobile-header flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium"><span className="hidden sm:inline">Pendientes de </span>Verificación</CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
          </CardHeader>
          <CardContent className="card-mobile-content pt-0">
            <div className="text-lg sm:text-2xl font-bold">
              {businesses.filter(b => b.status === 'PENDING_VERIFICATION').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="card-mobile-header flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium">Créditos <span className="hidden sm:inline">Totales</span></CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500" />
          </CardHeader>
          <CardContent className="card-mobile-content pt-0">
            <div className="text-lg sm:text-2xl font-bold">
              {businesses.reduce((sum, b) => sum + (b.availableCredits || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de negocios */}
      <Card>
        <CardContent className="p-0">

          {filteredBusinesses.length === 0 ? (
            <div className="text-center py-12">
              <Store className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay negocios</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No se encontraron negocios que coincidan con los filtros aplicados.'
                  : 'No hay negocios registrados en el sistema.'
                }
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Primer Negocio
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="mobile-priority">Nombre del Negocio</TableHead>
                    <TableHead className="mobile-priority">Créditos</TableHead>
                    <TableHead className="mobile-priority">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedBusinesses.map((business) => (
                    <TableRow key={business.id} className="hover:bg-gray-50">
                      <TableCell className="mobile-priority">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <Avatar className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0">
                            <AvatarImage src={`/business-avatars/${business.id}.jpg`} />
                            <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-600 text-white font-medium text-xs">
                              {(business.businessName || 'BS').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-gray-900 truncate text-xs sm:text-sm">
                              {business.businessName || 'Sin nombre'}
                            </div>
                            <div className="text-[10px] sm:text-sm text-gray-500 truncate">
                              {business.contactName || 'Sin contacto'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="mobile-priority">
                        <div className="flex items-center gap-1 text-xs sm:text-sm">
                          <DollarSign className="w-3 h-3 text-green-600" />
                          <span className="font-medium text-green-600">
                            {business.availableCredits || business.credits || 0}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="mobile-priority">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 touch-target">
                              <span className="sr-only">Abrir menú</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => router.push(`/admin/negocios/${business.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/admin/negocios/${business.id}`)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {business.status === 'PENDING_VERIFICATION' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(business.id, 'ACTIVE')}>
                                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                Activar
                              </DropdownMenuItem>
                            )}
                            {business.status === 'ACTIVE' && (
                              <DropdownMenuItem 
                                onClick={() => handleStatusChange(business.id, 'SUSPENDED')}
                                className="text-red-600"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Suspender
                              </DropdownMenuItem>
                            )}
                            {business.status === 'SUSPENDED' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(business.id, 'ACTIVE')}>
                                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                Reactivar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {totalPages > 1 && filteredBusinesses.length > 0 && (
            <div className="border-t">
              <div className="p-3 sm:p-4 flex flex-col gap-3">
                <div className="text-xs sm:text-sm text-gray-600">
                  Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, filteredBusinesses.length)} de {filteredBusinesses.length} negocios
                </div>
                <div className="flex gap-2 items-center justify-center sm:justify-start flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="text-xs sm:text-sm"
                  >
                    ← Anterior
                  </Button>
                  <div className="flex items-center gap-1">
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={i}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-8 h-8 sm:w-9 sm:h-9 p-0 text-xs"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="text-xs sm:text-sm"
                  >
                    Siguiente →
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo para crear negocio */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Crear Nuevo Negocio</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Negocio *
                </label>
                <Input
                  value={newBusinessData.businessName}
                  onChange={(e) => setNewBusinessData(prev => ({
                    ...prev,
                    businessName: e.target.value
                  }))}
                  placeholder="Ej: Restaurante La Bella Vista"
                  disabled={isCreating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Contacto *
                </label>
                <Input
                  value={newBusinessData.contactName}
                  onChange={(e) => setNewBusinessData(prev => ({
                    ...prev,
                    contactName: e.target.value
                  }))}
                  placeholder="Nombre completo del responsable"
                  disabled={isCreating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <Input
                  type="email"
                  value={newBusinessData.email}
                  onChange={(e) => setNewBusinessData(prev => ({
                    ...prev,
                    email: e.target.value
                  }))}
                  placeholder="contacto@negocio.com"
                  disabled={isCreating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono *
                </label>
                <Input
                  value={newBusinessData.phone}
                  onChange={(e) => setNewBusinessData(prev => ({
                    ...prev,
                    phone: e.target.value
                  }))}
                  placeholder="33 1234 5678"
                  disabled={isCreating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección Completa *
                </label>
                <Input
                  value={newBusinessData.address}
                  onChange={(e) => setNewBusinessData(prev => ({
                    ...prev,
                    address: e.target.value
                  }))}
                  placeholder="Calle, número, colonia, ciudad"
                  disabled={isCreating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña Temporal (opcional)
                </label>
                <Input
                  type="password"
                  value={newBusinessData.password}
                  onChange={(e) => setNewBusinessData(prev => ({
                    ...prev,
                    password: e.target.value
                  }))}
                  placeholder="Si no se especifica, se usará: BeFast2025!"
                  disabled={isCreating}
                />
                <p className="text-xs text-gray-500 mt-1">
                  El negocio podrá cambiar esta contraseña en su primer inicio de sesión
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCreateDialog(false);
                  setNewBusinessData({
                    businessName: '',
                    contactName: '',
                    email: '',
                    phone: '',
                    address: '',
                    password: ''
                  });
                }}
                disabled={isCreating}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateAccount}
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creando...
                  </>
                ) : (
                  'Crear Negocio'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(BusinessesPage, {
  requiredRoles: ['ADMIN', 'SUPER_ADMIN', 'CONTADORA'],
});
