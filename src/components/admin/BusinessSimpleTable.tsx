"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/Input'
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Store,
  DollarSign,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  Download,
  Plus,
  Loader2
} from 'lucide-react'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { SearchInput } from '@/components/ui/search-input'
import type { Business } from '@/types'

export function BusinessSimpleTable() {
  const router = useRouter()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Cargar negocios
  useEffect(() => {
    const businessesQuery = query(
      collection(db, 'businesses'),
      orderBy('businessName', 'asc')
    )

    const unsubscribe = onSnapshot(businessesQuery, (snapshot) => {
      const businessesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Business[]
      
      setBusinesses(businessesData)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Filtrar negocios
  useEffect(() => {
    const filtered = businesses.filter(business => 
      business.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.contactEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.phoneNumber?.includes(searchTerm)
    )
    setFilteredBusinesses(filtered)
    setCurrentPage(1)
  }, [businesses, searchTerm])

  // Paginación
  const totalPages = Math.ceil(filteredBusinesses.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentBusinesses = filteredBusinesses.slice(startIndex, endIndex)

  const handleViewBusiness = (businessId: string) => {
    router.push(`/admin/negocios/${businessId}`)
  }

  const handleCreateBusiness = () => {
    router.push('/admin/negocios/nuevo')
  }

  const handleEditBusiness = (businessId: string) => {
    router.push(`/admin/negocios/${businessId}/editar`)
  }

  const handleExportBusinesses = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Nombre,Email,Teléfono,Estado,Créditos,Pedidos\n"
      + businesses.map(b => 
          `"${b.businessName || 'Sin nombre'}","${b.contactEmail}","${b.phoneNumber || ''}","${b.isActive ? 'Activo' : 'Inactivo'}","${b.credits || 0}","${b.totalOrders || 0}"`
        ).join("\n")
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `negocios_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getStatusBadge = (business: Business) => {
    if (!business.isActive) {
      return <Badge variant="destructive">Inactivo</Badge>
    }
    if (!business.isVerified) {
      return <Badge variant="secondary">Sin verificar</Badge>
    }
    return <Badge variant="default">Activo</Badge>
  }

  // Estadísticas simples
  const activeBusinesses = businesses.filter(b => b.isActive).length
  const verifiedBusinesses = businesses.filter(b => b.isVerified).length
  const lowCreditBusinesses = businesses.filter(b => (b.credits || 0) < 50).length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics - Simple Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total</p>
              <p className="text-2xl font-bold text-blue-800">{businesses.length}</p>
            </div>
            <Store className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Activos</p>
              <p className="text-2xl font-bold text-green-800">{activeBusinesses}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Verificados</p>
              <p className="text-2xl font-bold text-purple-800">{verifiedBusinesses}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">Pocos Créditos</p>
              <p className="text-2xl font-bold text-orange-800">{lowCreditBusinesses}</p>
            </div>
            <XCircle className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Header and Search */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Lista de Negocios</h2>
            <p className="text-sm text-gray-600 mt-1">
              {filteredBusinesses.length} de {businesses.length} negocios
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportBusinesses}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button size="sm" onClick={handleCreateBusiness}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Negocio
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar negocios..."
            className="max-w-md"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Negocio</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Estado</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Créditos</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Pedidos</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentBusinesses.map((business) => (
                <tr key={business.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={business.profileImageUrl} />
                        <AvatarFallback>
                          {business.businessName?.charAt(0) || business.contactEmail.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900">
                          {business.businessName || 'Sin nombre'}
                        </p>
                        <p className="text-sm text-gray-500">{business.contactEmail}</p>
                        {business.phoneNumber && (
                          <p className="text-xs text-gray-400">{business.phoneNumber}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    {getStatusBadge(business)}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className={`font-medium ${
                        (business.credits || 0) < 50 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {business.credits || 0}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm font-medium">{business.totalOrders || 0}</span>
                  </td>
                  <td className="py-4 px-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewBusiness(business.id)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Perfil
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditBusiness(business.id)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <p className="text-sm text-gray-600">
              Mostrando {startIndex + 1} a {Math.min(endIndex, filteredBusinesses.length)} de {filteredBusinesses.length} resultados
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="flex items-center px-3 py-1 text-sm">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
