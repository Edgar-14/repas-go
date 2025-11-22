"use client"

import { useState, useMemo } from 'react'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ColumnDef } from '@tanstack/react-table'
import { AdvancedTable } from '@/components/ui/advanced-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Car,
  Bike,
  Truck,
  Star,
  Phone,
  Mail,
  Calendar,
  Activity,
  Shield,
  User,
  Download,
  Filter,
  Search,
  X,
  Loader2
} from 'lucide-react'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { collection, doc, updateDoc, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRealtimeDrivers, DriverFilters, type Driver } from '@/hooks/useRealtimeData';
import { COLLECTIONS } from '@/lib/collections';
import { getAuthCookie } from '@/lib/cookies';
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import ExportDriversButton from '@/components/ExportDriversButton'

// Componente de Loading Skeleton
const DriverRowSkeleton = () => (
  <tr className="border-b border-gray-100 animate-pulse">
    <td className="px-6 py-4">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
        <div className="space-y-1">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-3 bg-gray-200 rounded w-32"></div>
          <div className="h-3 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="h-6 bg-gray-200 rounded-full w-16"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-6 bg-gray-200 rounded-full w-20"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-6 bg-gray-200 rounded-full w-24"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-4 bg-gray-200 rounded w-12"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-4 bg-gray-200 rounded w-16"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-4 bg-gray-200 rounded w-12"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-6 bg-gray-200 rounded w-8"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-8 w-8 bg-gray-200 rounded"></div>
    </td>
  </tr>
)

// Componente de Estado Vacío
const EmptyState = ({ onAddDriver }: { onAddDriver: () => void }) => (
  <div className="text-center py-12">
    <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
      <User className="w-12 h-12 text-gray-400" />
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay repartidores</h3>
    <p className="text-gray-500 mb-6">No se encontraron repartidores que coincidan con los filtros aplicados.</p>
    <Button 
      variant="outline" 
      className="gap-2"
      onClick={onAddDriver}
    >
      <UserCheck className="w-4 h-4" />
      Agregar Repartidor
    </Button>
  </div>
)

// Función para obtener íconos de vehículos
const getVehicleIcon = (type: string) => {
  const normalizedType = type?.toLowerCase();
  switch (normalizedType) {
    case 'auto':
    case 'car':
      return <Car className="w-4 h-4" />
    case 'moto':
    case 'motocicleta':
    case 'motorcycle':
      return <Bike className="w-4 h-4" />
    case 'bici':
    case 'bicicleta':
    case 'bicycle':
      return <Bike className="w-4 h-4" />
    default:
      return <Truck className="w-4 h-4" />
  }
}

// Función para obtener badges de estado
const getStatusBadge = (status: string) => {
  const statusConfig = {
    'ACTIVE': { 
      label: 'Activo', 
      variant: 'default' as const, 
      className: 'bg-green-100 text-green-800 border-green-200',
      icon: <CheckCircle className="w-3 h-3" />
    },
    'SUSPENDED': { 
      label: 'Suspendido', 
      variant: 'destructive' as const, 
      className: 'bg-red-100 text-red-800 border-red-200',
      icon: <XCircle className="w-3 h-3" />
    },
    'ACTIVO_COTIZANDO': { 
      label: 'Pendiente', 
      variant: 'secondary' as const, 
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: <Clock className="w-3 h-3" />
    },
    'INACTIVE': { 
      label: 'Inactivo', 
      variant: 'outline' as const, 
      className: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: <XCircle className="w-3 h-3" />
    }
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['INACTIVE']
  
  return (
    <Badge className={`gap-1 ${config.className}`}>
      {config.icon}
      {config.label}
    </Badge>
  )
}

// Función para obtener badges de IMSS
const getIMSSBadge = (status: string) => {
  const statusConfig = {
    'PROVISIONAL': { 
      label: 'Provisional', 
      className: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: <Shield className="w-3 h-3" />
    },
    'COTIZANDO': { 
      label: 'Cotizando', 
      className: 'bg-green-100 text-green-800 border-green-200',
      icon: <CheckCircle className="w-3 h-3" />
    },
    'INACTIVE': { 
      label: 'Inactivo', 
      className: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: <XCircle className="w-3 h-3" />
    }
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['INACTIVE']
  
  return (
    <Badge className={`gap-1 ${config.className}`}>
      {config.icon}
      {config.label}
    </Badge>
  )
}

// Función para obtener badges de clasificación
const getClassificationBadge = (classification: string) => {
  const isEmployee = classification === 'Empleado Cotizante'
  
  return (
    <Badge className={`gap-1 ${isEmployee 
      ? 'bg-purple-100 text-purple-800 border-purple-200' 
      : 'bg-orange-100 text-orange-800 border-orange-200'
    }`}>
      {isEmployee ? <User className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
      {isEmployee ? 'Empleado' : 'Independiente'}
    </Badge>
  )
}

export function DriversAdvancedTable() {
  const router = useRouter()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [imssFilter, setImssFilter] = useState<string[]>([])
  const [classificationFilter, setClassificationFilter] = useState<string[]>([])
  const [vehicleFilter, setVehicleFilter] = useState<string[]>([])
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'positive' | 'negative' | 'debt'>('all')

  const [filters, setFilters] = useState<DriverFilters>({})

  React.useEffect(() => {
    const newFilters: DriverFilters = {
      searchTerm: searchTerm,
      status: statusFilter,
      imssStatus: imssFilter,
      classification: classificationFilter,
      vehicleType: vehicleFilter,
      balance: balanceFilter
    }
    setFilters(newFilters)
  }, [searchTerm, statusFilter, imssFilter, classificationFilter, vehicleFilter, balanceFilter])

  // Use real-time drivers data with filters
  const { drivers, loading, error } = useRealtimeDrivers(1000, filters);
  
  // Debug: Log when drivers data changes
  React.useEffect(() => {
    console.log('🎯 DriversAdvancedTable - drivers updated:', drivers?.length, 'drivers');
    if (drivers?.length > 0) {
      console.log('🔍 First driver sample:', drivers[0]);
    }
  }, [drivers]);

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [isCreatingDriver, setIsCreatingDriver] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [driversPerPage] = useState(4)
  const [isImportingDrivers, setIsImportingDrivers] = useState(false)
  const [importResults, setImportResults] = useState<any>(null)
  const [showFiltersModal, setShowFiltersModal] = useState(false)
  const [newDriver, setNewDriver] = useState({
    fullName: '',
    email: '',
    phone: '',
    vehicleType: 'moto',
    personalId: ''
  })
  const { toast } = useToast()

  // Calculate import stats from real-time data
  const importStats = useMemo(() => {
    if (!drivers) return { total: 0, imported: 0, withAccounts: 0, pending: 0 };

    return {
      total: drivers.length,
      // shipdayCarrierId: campo "id" del Carrier Object en Shipday
      imported: drivers.filter(d => (d as any).shipdayCarrierId).length,
      withAccounts: drivers.filter(d => d.uid).length,
      pending: 0 // 'INACTIVE' no existe en el tipo real
    };
  }, [drivers]);

  // Filter drivers based on search and filter criteria
  const sortedDrivers = useMemo(() => {
    if (!drivers) return [];
    return [...drivers].sort((a, b) => {
      const dateA = a.createdAt && typeof a.createdAt.toDate === 'function'
        ? a.createdAt.toDate().getTime()
        : 0;
      const dateB = b.createdAt && typeof b.createdAt.toDate === 'function'
        ? b.createdAt.toDate().getTime()
        : 0;
      return dateB - dateA;
    });
  }, [drivers]);


  // Export functionality

  const handleBulkApprove = async (selectedDrivers: Driver[]) => {
    try {
      const promises = selectedDrivers.map(driver => 
        updateDoc(doc(db, 'drivers', driver.id), { // Using DRIVERS collection per BEFAST FLUJO FINAL 
          status: 'ACTIVE',
          updatedAt: new Date()
        })
      )
      
      await Promise.all(promises)
      
      toast({
        title: "Repartidores Aprobados",
        description: `${selectedDrivers.length} repartidor(es) aprobado(s) exitosamente`,
      })
    } catch (error) {
      console.error('Error approving drivers:', error)
      toast({
        title: "Error",
        description: "No se pudieron aprobar los repartidores",
        variant: "destructive",
      })
    }
  }

  const handleBulkSuspend = async (selectedDrivers: Driver[]) => {
    try {
      const promises = selectedDrivers.map(driver => 
        updateDoc(doc(db, 'drivers', driver.id), { // Using DRIVERS collection per BEFAST FLUJO FINAL 
          status: 'SUSPENDED',
          updatedAt: new Date()
        })
      )
      
      await Promise.all(promises)
      
      toast({
        title: "Repartidores Suspendidos",
        description: `${selectedDrivers.length} repartidor(es) suspendido(s) exitosamente`,
      })
    } catch (error) {
      console.error('Error suspending drivers:', error)
      toast({
        title: "Error",
        description: "No se pudieron suspender los repartidores",
        variant: "destructive",
      })
    }
  }

  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreatingDriver(true)

    try {
      // Verificar si ya existe un repartidor con este email usando DRIVERS collection per BEFAST FLUJO FINAL
      const existingDriverQuery = await getDocs(
        query(collection(db, COLLECTIONS.DRIVERS), where('email', '==', newDriver.email))
      )

      if (!existingDriverQuery.empty) {
        toast({
          title: "Error",
          description: "Ya existe un repartidor con este email",
          variant: "destructive",
        })
        return
      }

      // Determinar estado inicial
      const hasPersonalId = newDriver.personalId && newDriver.personalId.trim() !== ''
      const initialStatus = 'APROBADO'

      // Crear nuevo repartidor
      const driverData = {
        fullName: newDriver.fullName,
        email: newDriver.email,
        phone: newDriver.phone,
        personalId: newDriver.personalId || '',
        vehicleType: newDriver.vehicleType,
        status: initialStatus,
        imssStatus: 'INACTIVE',
        currentClassification: 'Trabajador Independiente',
        walletBalance: 0,
        pendingDebts: 0,
        driverDebtLimit: 300,
        suspended: false,
        hasAltaIMSS: hasPersonalId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Agregar a Firestore usando DRIVERS collection per BEFAST FLUJO FINAL
  await addDoc(collection(db, COLLECTIONS.DRIVERS), driverData)

      toast({
        title: "Repartidor Creado",
        description: `${newDriver.fullName} ha sido agregado exitosamente`,
      })

      // Limpiar formulario y cerrar diálogo
      setNewDriver({
        fullName: '',
        email: '',
        phone: '',
        vehicleType: 'moto',
        personalId: ''
      })
      setShowCreateDialog(false)

    } catch (error) {
      console.error('Error creating driver:', error)
      toast({
        title: "Error",
        description: "No se pudo crear el repartidor",
        variant: "destructive",
      })
    } finally {
      setIsCreatingDriver(false)
    }
  }

  const importDriversFromShipday = async () => {
    setIsImportingDrivers(true)
    setImportResults(null)

    try {
      // Obtener token de autenticación
      const token = getAuthCookie();

      if (!token) {
        throw new Error('No se encontró token de autenticación')
      }

      console.log('🚀 Starting driver import from Shipday...');
      
      const response = await fetch('/api/shipday/sync-drivers-to-befast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('📡 Import response status:', response.status);

      const result = await response.json()

      console.log('📊 Import result:', result);
      
      if (response.ok && result.success) {
        setImportResults(result)
        toast({
          title: "Importación Exitosa",
          description: `${result.summary.success} repartidores importados desde Shipday`,
        })
      } else {
        console.error('❌ Import failed:', result);
        throw new Error(result.error || 'Error en la importación')
      }
    } catch (error) {
      console.error('Error importing drivers:', error)
      toast({
        title: "Error de Importación",
        description: error instanceof Error ? error.message : "No se pudieron importar los repartidores",
        variant: "destructive",
      })
    } finally {
      setIsImportingDrivers(false)
    }
  }

  const exportDrivers = async () => {
    try {
      // Construir parámetros de consulta
      const params = new URLSearchParams({
        companyId: '117106' // Tu empresa
      });

      // Agregar filtros si están activos
      if (statusFilter.length > 0) {
        params.append('status', statusFilter.join(','));
      }

      const response = await fetch(`/api/shipday/export/drivers?${params.toString()}`);
      
      if (response.ok) {
        // Crear blob y descargar
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `repartidores-befast-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Exportación exitosa",
          description: "Los repartidores se han exportado correctamente",
        });
      } else {
        throw new Error('Error al exportar repartidores');
      }
    } catch (error) {
      console.error('Error exporting drivers:', error);
      toast({
        title: "Error de exportación",
        description: "No se pudieron exportar los repartidores",
        variant: "destructive",
      });
    }
  };

  const columns: ColumnDef<Driver>[] = [
    {
      accessorKey: 'fullName',
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-500" />
          <span className="font-semibold text-gray-900">Repartidor</span>
        </div>
      ),
      cell: ({ row }) => {
        const driver = row.original
        return (
          <div className="flex items-center space-x-3 min-w-[200px]">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="h-8 w-8 ring-2 ring-gray-100 hover:ring-blue-200 transition-all">
                    <AvatarImage src={`/avatars/${driver.id}.jpg`} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium">
                      {driver.fullName ? driver.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'DR'}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ver perfil completo</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-gray-900 truncate">
                {driver.fullName || 'Sin nombre'}
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Mail className="w-3 h-3" />
                <span className="truncate">{driver.email || 'Sin email'}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Phone className="w-3 h-3" />
                <span className="truncate">{driver.phone || 'Sin teléfono'}</span>
              </div>
              {driver.importedFromShipday && (
                <div className="flex items-center gap-1 text-xs text-blue-600">
                  <Download className="w-3 h-3" />
                  <span>Importado de Shipday</span>
                </div>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-gray-500" />
          <span className="font-semibold text-gray-900">Estado</span>
        </div>
      ),
      cell: ({ row }) => getStatusBadge(row.getValue('status')),
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: 'imssStatus',
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-gray-500" />
          <span className="font-semibold text-gray-900">IMSS</span>
        </div>
      ),
      cell: ({ row }) => getIMSSBadge(row.getValue('imssStatus')),
    },
    {
      accessorKey: 'currentClassification',
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-500" />
          <span className="font-semibold text-gray-900">Clasificación</span>
        </div>
      ),
      cell: ({ row }) => getClassificationBadge(row.getValue('currentClassification')),
    },
    {
      accessorKey: 'vehicleType',
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <Car className="w-4 h-4 text-gray-500" />
          <span className="font-semibold text-gray-900">Vehículo</span>
        </div>
      ),
      cell: ({ row }) => {
        const driver = row.original as Driver;
        const vehicleType = (driver.vehicle?.type || driver.vehicleType || 'moto') as string;
        const labels = {
          'auto': 'Auto',
          'moto': 'Moto',
          'motocicleta': 'Motocicleta', 
          'bici': 'Bicicleta',
          'bicicleta': 'Bicicleta'
        }
        return (
          <div className="flex items-center gap-2">
            {getVehicleIcon(vehicleType)}
            <span className="text-sm font-medium text-gray-700">
              {labels[vehicleType as keyof typeof labels] || vehicleType}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: 'walletBalance',
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-gray-500" />
          <span className="font-semibold text-gray-900">Saldo</span>
        </div>
      ),
      cell: ({ row }) => {
        const balance = row.getValue('walletBalance') as number || 0
        return (
          <div className={`flex items-center gap-1 font-mono text-sm ${
            balance >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            <DollarSign className="w-3 h-3" />
            {balance.toFixed(2)}
          </div>
        )
      },
    },
    {
      accessorKey: 'pendingDebts',
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-gray-500" />
          <span className="font-semibold text-gray-900">Adeudos</span>
        </div>
      ),
      cell: ({ row }) => {
        const debts = row.getValue('pendingDebts') as number || 0
        return (
          <div className={`flex items-center gap-1 font-mono text-sm ${
            debts > 0 ? 'text-orange-600' : 'text-green-600'
          }`}>
            <AlertTriangle className="w-3 h-3" />
            {debts.toFixed(2)}
          </div>
        )
      },
    },
    {
      accessorKey: 'totalOrders',
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-gray-500" />
          <span className="font-semibold text-gray-900">Pedidos</span>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Badge variant="outline" className="font-mono">
            {row.getValue('totalOrders') || 0}
          </Badge>
        </div>
      ),
    },
    {
      id: 'actions',
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <MoreHorizontal className="w-4 h-4 text-gray-500" />
          <span className="font-semibold text-gray-900">Acciones</span>
        </div>
      ),
      cell: ({ row }) => {
        const driver = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="h-8 w-8 p-0 hover:bg-gray-100 transition-colors"
              >
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-48 shadow-lg border-0 bg-white/95 backdrop-blur-sm"
            >
              <DropdownMenuLabel className="font-semibold text-gray-900">
                Acciones
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push(`/admin/repartidores/${driver.id}`)}
                className="gap-2 cursor-pointer hover:bg-blue-50 focus:bg-blue-50"
              >
                <Eye className="mr-2 h-4 w-4 text-blue-600" />
                <span>Ver Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 cursor-pointer hover:bg-gray-50 focus:bg-gray-50">
                <Edit className="mr-2 h-4 w-4 text-gray-600" />
                <span>Editar</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {driver.status === 'INACTIVE' && (
                <DropdownMenuItem
                  onClick={() => handleBulkApprove([driver])}
                  className="gap-2 cursor-pointer hover:bg-green-50 focus:bg-green-50"
                >
                  <UserCheck className="mr-2 h-4 w-4 text-green-600" />
                  <span>Aprobar</span>
                </DropdownMenuItem>
              )}
              {driver.status === 'ACTIVE' && (
                <DropdownMenuItem
                  onClick={() => handleBulkSuspend([driver])}
                  className="gap-2 cursor-pointer hover:bg-red-50 focus:bg-red-50 text-red-600"
                >
                  <UserX className="mr-2 h-4 w-4" />
                  <span>Suspender</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const bulkActions = [
    {
      label: 'Aprobar Seleccionados',
      action: handleBulkApprove,
      icon: <UserCheck className="h-4 w-4 mr-2" />,
      variant: 'default' as const
    },
    {
      label: 'Suspender Seleccionados',
      action: handleBulkSuspend,
      icon: <UserX className="h-4 w-4 mr-2" />,
      variant: 'destructive' as const
    }
  ]

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Gestión de Repartidores</h2>
              <p className="text-sm text-gray-500">Cargando repartidores...</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {Array.from({ length: 9 }).map((_, i) => (
                  <th key={i} className="px-6 py-3 text-left">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <DriverRowSkeleton key={i} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (drivers.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Gestión de Repartidores</h2>
              <p className="text-sm text-gray-500">Administra todos los repartidores del sistema</p>
            </div>
          </div>
        </div>
        <EmptyState onAddDriver={() => setShowCreateDialog(true)} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Title */}
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">
                Gestión de Repartidores
              </CardTitle>
              <p className="text-responsive-md text-gray-600 mt-1">
                {drivers.length} repartidores encontrados
              </p>
            </div>
            
            {/* Action Buttons - Responsive */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowFiltersModal(true)}
                  variant="outline"
                  size="sm"
                  className="flex-shrink-0 px-3 py-2 text-xs"
                >
                  <Filter className="w-4 h-4 mr-1" />
                  Filtros
                </Button>
                <ExportDriversButton />
              </div>
              
              <Button
                onClick={importDriversFromShipday}
                variant="outline"
                size="sm"
                disabled={isImportingDrivers}
                className="flex-shrink-0 px-3 py-2 text-xs"
              >
                {isImportingDrivers ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Import...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-1" />
                    Import
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Repartidor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    IMSS
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Clasificación
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Vehículo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Saldo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Adeudos
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Pedidos
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedDrivers.slice((currentPage - 1) * driversPerPage, currentPage * driversPerPage).map((driver) => (
                  <tr key={driver.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/admin/repartidores/${driver.id}`)}>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium">
                            {driver.fullName ? driver.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'DR'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-900 truncate">
                            {driver.fullName || 'Sin nombre'}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">{driver.email || 'Sin email'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Phone className="w-3 h-3" />
                            <span className="truncate">{driver.phone || 'Sin teléfono'}</span>
                          </div>
                          {(driver as any).shipdayCarrierId && (
                            <div className="flex items-center gap-1 text-xs text-blue-600">
                              <Download className="w-3 h-3" />
                              <span>Sincronizado con Shipday</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(driver.status)}
                    </td>
    <td className="px-4 py-4">
                      {getIMSSBadge(driver.imssStatus || 'INACTIVE')}
                    </td>
                    <td className="px-4 py-4">
                      {getClassificationBadge(driver.currentClassification || 'Trabajador Independiente')}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {getVehicleIcon((driver.vehicle?.type || 'moto') as string)}
                        <span className="text-sm font-medium text-gray-700">
                          {(() => {
                            const vehicleType = (driver.vehicle?.type || 'moto') as string;
                            const labels = {
                              'auto': 'Auto',
                              'moto': 'Moto', 
                              'bici': 'Bicicleta',
                              'bicicleta': 'Bicicleta'
                            };
                            return labels[vehicleType as keyof typeof labels] || vehicleType;
                          })()}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className={`flex items-center gap-1 font-mono text-sm ${
                        (driver.walletBalance || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <DollarSign className="w-3 h-3" />
                        {(driver.walletBalance || 0).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className={`flex items-center gap-1 font-mono text-sm ${
                        (driver.pendingDebts || 0) > 0 ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        <AlertTriangle className="w-3 h-3" />
                        {(driver.pendingDebts || 0).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant="outline" className="font-mono">
                        {driver.kpis?.totalOrders ?? (typeof (driver as any).totalOrders === 'number' ? (driver as any).totalOrders : 0)}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            className="h-8 w-8 p-0 hover:bg-gray-100 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="sr-only">Abrir menú</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/admin/repartidores/${driver.id}`); }}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Perfil
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              router.push(`/admin/repartidores/${driver.id}/edit`); 
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {/* Acción de aprobar eliminada porque 'INACTIVE' no existe en el tipo real */}
                          {driver.status === 'ACTIVE' && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleBulkSuspend([driver]); }} className="text-red-600">
                              <UserX className="mr-2 h-4 w-4" />
                              Suspender
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {drivers.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <User className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay repartidores</h3>
              <p className="text-gray-500 mb-6">No se encontraron repartidores que coincidan con los filtros aplicados.</p>
            </div>
          )}
          
          {/* Pagination Controls */}
          {drivers.length > driversPerPage && (
            <div className="flex justify-center items-center space-x-2 mt-6 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {currentPage} de {Math.ceil(drivers.length / driversPerPage)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={currentPage >= Math.ceil(drivers.length / driversPerPage)}
              >
                Siguiente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de resultados de importación */}
      {importResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Resultados de Importación desde Shipday</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setImportResults(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {/* Resumen */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-green-800">Importación Completada</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total procesados:</span>
                    <div className="font-semibold">{importResults.summary.total}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Exitosos:</span>
                    <div className="font-semibold text-green-600">{importResults.summary.success}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Errores:</span>
                    <div className="font-semibold text-red-600">{importResults.summary.errors}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Tiempo:</span>
                    <div className="font-semibold">{importResults.summary.processingTime}ms</div>
                  </div>
                </div>
                <p className="text-sm text-green-700 mt-2">
                  {importResults.summary.note}
                </p>
              </div>

              {/* Detalles de resultados */}
              {importResults.results && importResults.results.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Detalles de Importación</h4>
                  <div className="max-h-60 overflow-y-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-3 py-2 text-left">ID Shipday</th>
                          <th className="px-3 py-2 text-left">Estado</th>
                          <th className="px-3 py-2 text-left">ID BeFast</th>
                          <th className="px-3 py-2 text-left">Mensaje</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importResults.results.map((result: any, index: number) => (
                          <tr key={index} className="border-b">
                            <td className="px-3 py-2 font-mono">{result.shipdayCarrierId}</td>
                            <td className="px-3 py-2">
                              <Badge 
                                variant={result.success ? "default" : "destructive"}
                                className={result.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                              >
                                {result.success ? "Éxito" : "Error"}
                              </Badge>
                            </td>
                            <td className="px-3 py-2 font-mono text-xs">
                              {result.befastDriverId || "-"}
                            </td>
                            <td className="px-3 py-2 text-xs">
                              {result.message}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setImportResults(null)}
              >
                Cerrar
              </Button>
              <Button
                onClick={() => {
                  setImportResults(null)
                  // Recargar la página para ver los nuevos repartidores
                  window.location.reload()
                }}
              >
                Ver Repartidores Importados
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Diálogo para crear repartidor manualmente */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">Agregar Repartidor</h3>
            
            <form onSubmit={handleCreateDriver} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Nombre Completo *</Label>
                  <Input
                    id="fullName"
                    value={newDriver.fullName}
                    onChange={(e) => setNewDriver({...newDriver, fullName: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newDriver.email}
                    onChange={(e) => setNewDriver({...newDriver, email: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Teléfono *</Label>
                  <Input
                    id="phone"
                    value={newDriver.phone}
                    onChange={(e) => setNewDriver({...newDriver, phone: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="vehicleType">Tipo de Vehículo</Label>
                  <Select value={newDriver.vehicleType} onValueChange={(value) => setNewDriver({...newDriver, vehicleType: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="moto">Moto</SelectItem>
                      <SelectItem value="auto">Auto</SelectItem>
                      <SelectItem value="bicicleta">Bicicleta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="personalId">Personal ID (ALTA IMSS)</Label>
                <Input
                  id="personalId"
                  value={newDriver.personalId}
                  onChange={(e) => setNewDriver({...newDriver, personalId: e.target.value})}
                  placeholder="Opcional - para repartidores con ALTA IMSS"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  Crear Repartidor
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Filtros */}
      <Dialog open={showFiltersModal} onOpenChange={setShowFiltersModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros Avanzados
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Búsqueda global */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Búsqueda</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nombre, email o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Filtro de estado */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Estado
                </Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'ACTIVE', label: 'Activo', color: 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200' },
                    { key: 'SUSPENDED', label: 'Suspendido', color: 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200' },
                    { key: 'INACTIVE', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200' },
                    { key: 'INACTIVE', label: 'Inactivo', color: 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200' }
                  ].map((status) => (
                    <Button
                      key={status.key}
                      variant={statusFilter.includes(status.key) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setStatusFilter(prev => 
                          prev.includes(status.key) 
                            ? prev.filter(s => s !== status.key)
                            : [...prev, status.key]
                        )
                      }}
                      className={`text-xs transition-all duration-200 ${
                        statusFilter.includes(status.key) ? '' : status.color
                      }`}
                    >
                      {status.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Filtro de estado IMSS */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Estado IMSS
                </Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'PROVISIONAL', label: 'Provisional', color: 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200' },
                    { key: 'COTIZANDO', label: 'Cotizando', color: 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200' },
                    { key: 'INACTIVE', label: 'Inactivo', color: 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200' }
                  ].map((status) => (
                    <Button
                      key={status.key}
                      variant={imssFilter.includes(status.key) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setImssFilter(prev => 
                          prev.includes(status.key) 
                            ? prev.filter(s => s !== status.key)
                            : [...prev, status.key]
                        )
                      }}
                      className={`text-xs transition-all duration-200 ${
                        imssFilter.includes(status.key) ? '' : status.color
                      }`}
                    >
                      {status.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Filtro de clasificación */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Clasificación
                </Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'Empleado Cotizante', label: 'Empleado', color: 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200' },
                    { key: 'Trabajador Independiente', label: 'Independiente', color: 'bg-indigo-100 text-indigo-800 border-indigo-300 hover:bg-indigo-200' }
                  ].map((classification) => (
                    <Button
                      key={classification.key}
                      variant={classificationFilter.includes(classification.key) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setClassificationFilter(prev => 
                          prev.includes(classification.key) 
                            ? prev.filter(c => c !== classification.key)
                            : [...prev, classification.key]
                        )
                      }}
                      className={`text-xs transition-all duration-200 ${
                        classificationFilter.includes(classification.key) ? '' : classification.color
                      }`}
                    >
                      {classification.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Filtro de vehículo */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Car className="w-4 h-4" />
                  Tipo de Vehículo
                </Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'auto', label: 'Auto', icon: Car, color: 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200' },
                    { key: 'moto', label: 'Moto', icon: Bike, color: 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200' },
                    { key: 'bici', label: 'Bicicleta', icon: Bike, color: 'bg-teal-100 text-teal-800 border-teal-300 hover:bg-teal-200' }
                  ].map((vehicle) => (
                    <Button
                      key={vehicle.key}
                      variant={vehicleFilter.includes(vehicle.key) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setVehicleFilter(prev => 
                          prev.includes(vehicle.key) 
                            ? prev.filter(v => v !== vehicle.key)
                            : [...prev, vehicle.key]
                        )
                      }}
                      className={`text-xs transition-all duration-200 flex items-center gap-1 ${
                        vehicleFilter.includes(vehicle.key) ? '' : vehicle.color
                      }`}
                    >
                      <vehicle.icon className="w-3 h-3" />
                      {vehicle.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Filtro de balance */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Balance
                </Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'all', label: 'Todos', color: 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200' },
                    { key: 'positive', label: 'Positivo', color: 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200' },
                    { key: 'negative', label: 'Negativo', color: 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200' },
                    { key: 'debt', label: 'Con Adeudos', color: 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200' }
                  ].map((balance) => (
                    <Button
                      key={balance.key}
                      variant={balanceFilter === balance.key ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setBalanceFilter(balance.key as "all" | "positive" | "negative" | "debt")}
                      className={`text-xs transition-all duration-200 ${
                        balanceFilter === balance.key ? '' : balance.color
                      }`}
                    >
                      {balance.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Resumen y acciones */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-gray-600">
                Mostrando {drivers.length} repartidores
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('')
                    setStatusFilter([])
                    setImssFilter([])
                    setClassificationFilter([])
                    setVehicleFilter([])
                    setBalanceFilter('all')
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Limpiar Filtros
                </Button>
                <Button
                  onClick={() => setShowFiltersModal(false)}
                  size="sm"
                >
                  Aplicar Filtros
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DriversAdvancedTable;
