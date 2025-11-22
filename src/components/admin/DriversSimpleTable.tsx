"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/Input'
import { Pagination } from '@/components/ui/pagination'
import { useFirestorePagination } from '@/hooks/useFirestorePagination'
import { where, QueryConstraint } from 'firebase/firestore'
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  UserCheck, 
  UserX,
  DollarSign,
  CheckCircle,
  XCircle,
  Car,
  Bike,
  Star,
  Phone,
  Mail,
  User,
  Download,
  Search,
  Loader2,
  Plus,
  AlertTriangle,
  Clock,
  MapPin
} from 'lucide-react'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useToast } from '@/hooks/use-toast'
import type { Driver } from '@/lib/types/Driver';
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Section, PageToolbar } from '@/components/layout/primitives'
import { normalizeFirestoreDate } from '@/lib/utils'


export function DriversSimpleTable() {
  const router = useRouter()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  
  // Build Firestore filters
  const getFirestoreFilters = (): QueryConstraint[] => {
    const filters: QueryConstraint[] = []
    
    if (statusFilter !== 'all') {
      filters.push(where('status', '==', statusFilter))
    }
    
    return filters
  }

  // Use Firestore pagination hook
  const {
    data: drivers,
    loading,
    error,
    hasNextPage,
    hasPreviousPage,
    currentPage,
    totalLoadedItems,
    nextPage,
    previousPage,
    refresh,
    updateFilters
  } = useFirestorePagination<Driver>({
    collectionName: 'drivers',
    orderByField: 'fullName',
    orderDirection: 'asc',
    limitPerPage: 10,
    whereConditions: getFirestoreFilters()
  })

  // Update filters when status filter changes
  useEffect(() => {
    updateFilters(getFirestoreFilters())
  }, [statusFilter])

  // Client-side search filtering (applied after Firestore query)
  const filteredDrivers = drivers.filter(driver => {
    if (!searchTerm) return true
    
    return (
      driver.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.phone?.includes(searchTerm) ||
      driver.driverId?.includes(searchTerm)
    )
  })

  // For display
  const displayedDrivers = filteredDrivers

  // Handle error display
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      })
    }
  }, [error, toast])

  const handleViewDriver = (driverId: string) => {
    router.push(`/admin/repartidores/${driverId}`)
  }

  const handleEditDriver = (driverId: string) => {
    router.push(`/admin/repartidores/${driverId}/editar`)
  }

  const handleStatusChange = async (driverId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'drivers', driverId), {
        status: newStatus,
        updatedAt: new Date(),
      })

      toast({
        title: "Estado actualizado",
        description: `El repartidor ahora está ${newStatus.toLowerCase()}`,
      })
    } catch (error) {
      console.error('Error updating status:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      })
    }
  }

  const handleExportDrivers = () => {
    try {
      const csvContent = "data:text/csv;charset=utf-8," 
        + "ID,Nombre,Email,Teléfono,Estado,Clasificación,Vehículo,Saldo,Deuda,Pedidos,Calificación,Registro\n"
        + drivers.map(d => 
            `"${d.driverId || d.id}","${d.fullName || 'Sin nombre'}","${d.email}","${d.phone || ''}","${d.status}","${d.currentClassification || ''}","${d.vehicle?.type || ''}","${d.walletBalance || 0}","${d.pendingDebts || 0}","${d.kpis?.completedDeliveries || 0}","${d.kpis?.averageRating || 0}","${d.onboardingDate ? format(d.onboardingDate, 'dd/MM/yyyy') : ''}"`
          ).join("\n")
      
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute("download", `repartidores_${format(new Date(), 'yyyy-MM-dd')}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Exportación exitosa",
        description: "Los datos se han exportado correctamente",
      })
    } catch (error) {
      console.error('Error exporting drivers:', error)
      toast({
        title: "Error",
        description: "No se pudo exportar el archivo",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'ACTIVE': { 
        label: 'Activo', 
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: <CheckCircle className="w-3 h-3" />
      },
      'ACTIVO_COTIZANDO': { 
        label: 'Cotizando', 
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: <UserCheck className="w-3 h-3" />
      },
      'SUSPENDED': { 
        label: 'Suspendido', 
        className: 'bg-red-100 text-red-800 border-red-200',
        icon: <XCircle className="w-3 h-3" />
      },
      'INACTIVE': { 
        label: 'Inactivo', 
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: <UserX className="w-3 h-3" />
      },
      'PENDING': { 
        label: 'En Revisión', 
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: <Clock className="w-3 h-3" />
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

  const getVehicleIcon = (vehicleType?: string) => {
    switch (vehicleType?.toLowerCase()) {
      case 'moto':
      case 'motorcycle':
      case 'scooter':
        return <Bike className="w-4 h-4" />
      case 'auto':
      case 'car':
        return <Car className="w-4 h-4" />
      case 'bicicleta':
      case 'bicycle':
        return <Bike className="w-4 h-4 text-green-600" />
      case 'pie':
      case 'walking':
        return <User className="w-4 h-4 text-blue-600" />
      default:
        return <Bike className="w-4 h-4" />
    }
  }

  // Estadísticas basadas en datos reales
  const activeDrivers = drivers.filter(d => d.status === 'ACTIVE' || d.status === 'ACTIVO_COTIZANDO').length
  const suspendedDrivers = drivers.filter(d => d.status === 'SUSPENDED').length
  const totalBalance = drivers.reduce((sum, d) => sum + (d.walletBalance || 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2 text-gray-600">Cargando repartidores...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics - Mobile-First Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-xs sm:text-sm font-medium">Total Repartidores</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-800">{drivers.length}</p>
            </div>
            <User className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-xs sm:text-sm font-medium">Activos</p>
              <p className="text-xl sm:text-2xl font-bold text-green-800">{activeDrivers}</p>
            </div>
            <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-xs sm:text-sm font-medium">Suspendidos</p>
              <p className="text-xl sm:text-2xl font-bold text-red-800">{suspendedDrivers}</p>
            </div>
            <XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-xs sm:text-sm font-medium">Balance Total</p>
              <p className="text-xl sm:text-2xl font-bold text-purple-800">
                ${totalBalance.toFixed(2)}
              </p>
            </div>
            <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
          </div>
        </div>
      </div>

        {/* Toolbar con filtros y acciones */}
      <Section>
        <PageToolbar
          left={
            <div className="flex items-center gap-3 w-full min-w-0 flex-wrap">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 flex-shrink-0 h-4 w-4" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar repartidor..."
                  className="pl-10 w-full min-w-0 text-xs sm:text-sm h-9 sm:h-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[200px] min-w-0 flex-shrink-0">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="ACTIVE">Activos</SelectItem>
                  <SelectItem value="ACTIVO_COTIZANDO">Cotizando</SelectItem>
                  <SelectItem value="SUSPENDED">Suspendidos</SelectItem>
                  <SelectItem value="INACTIVE">Inactivos</SelectItem>
                  <SelectItem value="PENDING_REVIEW">En Revisión</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
          right={
            <Button variant="outline" size="sm" onClick={handleExportDrivers}>
              <Download />
              <span className="hidden sm:inline">Exportar CSV</span>
              <span className="sm:hidden">CSV</span>
            </Button>
          }
        />
        
        <p className="text-sm text-gray-600 mt-2">
          {filteredDrivers.length} de {totalLoadedItems} repartidores mostrados
        </p>
      </Section>
      
      {/* Content Container - Mobile Optimized */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-6">

        {/* Responsive Content - Cards on Mobile, Table on Desktop */}
        <div className="space-y-4">
          {/* Mobile Card Layout */}
          <div className="block lg:hidden">
            {displayedDrivers.length === 0 ? (
              <div className="py-12 text-center">
                <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay repartidores</h3>
                <p className="text-gray-500 text-sm px-4">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'No se encontraron repartidores que coincidan con los filtros aplicados.'
                    : 'No hay repartidores registrados en el sistema.'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayedDrivers.map((driver) => (
                  <div key={driver.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                    {/* Driver Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={driver.photoUrl} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                            {driver.fullName?.charAt(0) || driver.email.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {driver.fullName || 'Sin nombre'}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Mail className="w-3 h-3" />
                            <span className="truncate max-w-[150px]">{driver.email}</span>
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDriver(driver.id)}>
                            <Eye />
                            Ver Perfil
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditDriver(driver.id)}>
                            <Edit />
                            Editar
                          </DropdownMenuItem>
                          {driver.status === 'ACTIVE' && (
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(driver.id, 'SUSPENDED')}
                              className="text-red-600"
                            >
                              <XCircle />
                              Suspender
                            </DropdownMenuItem>
                          )}
                          {driver.status === 'SUSPENDED' && (
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(driver.id, 'ACTIVE')}
                              className="text-green-600"
                            >
                              <CheckCircle />
                              Reactivar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Driver Details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-gray-500 uppercase">Estado</span>
                        </div>
                        {getStatusBadge(driver.status)}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-gray-500 uppercase">Vehículo</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getVehicleIcon(driver.vehicle?.type)}
                          <span className="text-sm text-gray-600 capitalize">
                            {driver.vehicle?.type || 'No especificado'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-gray-500 uppercase">Balance</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-green-600" />
                          <span className={`font-medium text-sm ${
                            (driver.walletBalance || 0) < 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            ${(driver.walletBalance || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-gray-500 uppercase">KPIs</span>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">
                            {driver.kpis?.completedDeliveries || 0} pedidos
                          </div>
                          {driver.kpis?.averageRating && (
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-500 fill-current" />
                              <span className="text-xs text-gray-500">
                                {driver.kpis.averageRating.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Additional Info */}
                    {driver.phone && (
                      <div className="pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Phone className="w-3 h-3" />
                          <span>{driver.phone}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Repartidor</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Estado</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Vehículo</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Balance</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">KPIs</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Clasificación</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {displayedDrivers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No hay repartidores</h3>
                      <p className="text-gray-500">
                        {searchTerm || statusFilter !== 'all' 
                          ? 'No se encontraron repartidores que coincidan con los filtros aplicados.'
                          : 'No hay repartidores registrados en el sistema.'
                        }
                      </p>
                    </td>
                  </tr>
                ) : (
                  displayedDrivers.map((driver) => (
                    <tr key={driver.id} className="hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={driver.photoUrl} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                              {driver.fullName?.charAt(0) || driver.email.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900">
                              {driver.fullName || 'Sin nombre'}
                            </p>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Mail className="w-3 h-3" />
                              <span className="truncate">{driver.email}</span>
                            </div>
                            {driver.phone && (
                              <div className="flex items-center gap-1 text-xs text-gray-400">
                                <Phone className="w-3 h-3" />
                                <span>{driver.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(driver.status)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {getVehicleIcon(driver.vehicle?.type)}
                          <div>
                            <span className="text-sm text-gray-600 capitalize">
                              {driver.vehicle?.type || 'No especificado'}
                            </span>
                            {driver.vehicle?.brand && (
                              <div className="text-xs text-gray-400">
                                {driver.vehicle.brand} {driver.vehicle.model}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-green-600" />
                            <span className={`font-medium ${
                              (driver.walletBalance || 0) < 0 ? 'text-red-600' : 'text-green-600'
                            }`}>
                              ${(driver.walletBalance || 0).toFixed(2)}
                            </span>
                          </div>
                          {(driver.pendingDebts || 0) > 0 && (
                            <div className="flex items-center gap-1 text-xs">
                              <AlertTriangle className="w-3 h-3 text-red-500" />
                              <span className="text-red-600">
                                Deuda: ${(driver.pendingDebts || 0).toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {driver.kpis?.completedDeliveries || 0} pedidos
                            </span>
                          </div>
                          {driver.kpis?.averageRating && (
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-500 fill-current" />
                              <span className="text-xs text-gray-500">
                                {driver.kpis.averageRating.toFixed(1)}
                              </span>
                            </div>
                          )}
                          {driver.kpis?.onTimeDeliveryRate && (
                            <div className="text-xs text-green-600">
                              {(driver.kpis.onTimeDeliveryRate * 100).toFixed(0)}% a tiempo
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">
                            {driver.currentClassification || 'Sin clasificar'}
                          </span>
                          {driver.onboardingDate && (
                            <div className="text-xs text-gray-500">
                              Desde {format(normalizeFirestoreDate(driver.onboardingDate), 'MMM yyyy', { locale: es })}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDriver(driver.id)}>
                              <Eye />
                              Ver Perfil
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditDriver(driver.id)}>
                              <Edit />
                              Editar
                            </DropdownMenuItem>
                            {driver.status === 'ACTIVE' && (
                              <DropdownMenuItem 
                                onClick={() => handleStatusChange(driver.id, 'SUSPENDED')}
                                className="text-red-600"
                              >
                                <XCircle />
                                Suspender
                              </DropdownMenuItem>
                            )}
                            {driver.status === 'SUSPENDED' && (
                              <DropdownMenuItem 
                                onClick={() => handleStatusChange(driver.id, 'ACTIVE')}
                                className="text-green-600"
                              >
                                <CheckCircle />
                                Reactivar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Firestore Cursor-Based Pagination */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-6 pt-4 border-t bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
            Página {currentPage} • {displayedDrivers.length} de {totalLoadedItems} elementos
            {searchTerm && ` (filtrado por búsqueda)`}
          </div>
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={previousPage}
              disabled={!hasPreviousPage || loading}
              className="text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">Anterior</span>
              <span className="sm:hidden">‹</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={loading}
              className="text-xs sm:text-sm"
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : '↻'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={nextPage}
              disabled={!hasNextPage || loading}
              className="text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <span className="sm:hidden">›</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
