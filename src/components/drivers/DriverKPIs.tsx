"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock, 
  Star, 
  DollarSign,
  Package,
  Download,
  BarChart3,
  PieChart
} from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, query, where, orderBy, limit, getDocs, onSnapshot } from 'firebase/firestore'
import { COLLECTIONS } from '@/lib/collections'
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'
interface DriverKPIsProps {
  driverId: string
  driverData: any
}

interface KPIData {
  totalOrders: number
  monthlyOrders: number
  weeklyOrders: number
  onTimeRate: number
  averageRating: number
  totalEarnings: number
  monthlyEarnings: number
  weeklyEarnings: number
  averageOrderValue: number
  completionRate: number
  responseTime: number
  customerSatisfaction: number
}

export function DriverKPIs({ driverId, driverData }: DriverKPIsProps) {
  const { toast } = useToast()
  const [kpiData, setKpiData] = useState<KPIData>({
    totalOrders: 0,
    monthlyOrders: 0,
    weeklyOrders: 0,
    onTimeRate: 0,
    averageRating: 0,
    totalEarnings: 0,
    monthlyEarnings: 0,
    weeklyEarnings: 0,
    averageOrderValue: 0,
    completionRate: 0,
    responseTime: 0,
    customerSatisfaction: 0
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month')

  useEffect(() => {
    const fetchKPIData = async () => {
      try {
        // Fetch orders data - Using ORDERS collection per BEFAST FLUJO FINAL
        const ordersRef = collection(db, COLLECTIONS.ORDERS)
        const ordersQuery = query(
          ordersRef,
          where('driverId', '==', driverId),
          orderBy('createdAt', 'desc')
        )
        
        const ordersSnapshot = await getDocs(ordersQuery)
        const orders = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          completedAt: doc.data().completedAt?.toDate()
        }))

        // Fetch wallet transactions
        const transactionsRef = collection(db, COLLECTIONS.WALLET_TRANSACTIONS)
        const transactionsQuery = query(
          transactionsRef,
          where('driverId', '==', driverId),
          orderBy('timestamp', 'desc')
        )
        
        const transactionsSnapshot = await getDocs(transactionsQuery)
        const transactions = transactionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        }))

        // Calculate KPIs
        const now = new Date()
        const weekAgo = subDays(now, 7)
        const monthAgo = subMonths(now, 1)
        const monthStart = startOfMonth(now)
        const monthEnd = endOfMonth(now)

        // Filter orders by time range
        const weeklyOrders = orders.filter(order => order.createdAt >= weekAgo)
        const monthlyOrders = orders.filter(order => order.createdAt >= monthStart && order.createdAt <= monthEnd)
        const allOrders = orders

        // Calculate metrics
        const completedOrders = allOrders.filter(order => (order as any).status === 'DELIVERED')
        const onTimeOrders = completedOrders.filter(order => {
          if (!order.completedAt || !order.createdAt) return false
          const deliveryTime = order.completedAt.getTime() - order.createdAt.getTime()
          const expectedTime = 30 * 60 * 1000 // 30 minutes in milliseconds
          return deliveryTime <= expectedTime
        })

        const totalEarnings = transactions
          .filter(t => (t as any).amount > 0)
          .reduce((sum, t) => sum + (t as any).amount, 0)

        const monthlyEarnings = transactions
          .filter(t => (t as any).amount > 0 && t.timestamp >= monthStart && t.timestamp <= monthEnd)
          .reduce((sum, t) => sum + (t as any).amount, 0)

        const weeklyEarnings = transactions
          .filter(t => (t as any).amount > 0 && t.timestamp >= weekAgo)
          .reduce((sum, t) => sum + (t as any).amount, 0)

        const averageOrderValue = completedOrders.length > 0 
          ? completedOrders.reduce((sum, order) => sum + ((order as any).amountToCollect || 0), 0) / completedOrders.length
          : 0

        const responseTime = allOrders.length > 0
          ? allOrders.reduce((sum, order) => {
              if ((order as any).assignedAt && order.createdAt) {
                const responseTime = (order as any).assignedAt.getTime() - order.createdAt.getTime()
                return sum + responseTime
              }
              return sum
            }, 0) / allOrders.length / (1000 * 60) // Convert to minutes
          : 0

        setKpiData({
          totalOrders: allOrders.length,
          monthlyOrders: monthlyOrders.length,
          weeklyOrders: weeklyOrders.length,
          onTimeRate: completedOrders.length > 0 ? (onTimeOrders.length / completedOrders.length) * 100 : 0,
          averageRating: driverData.averageRating || 0,
          totalEarnings,
          monthlyEarnings,
          weeklyEarnings,
          averageOrderValue,
          completionRate: allOrders.length > 0 ? (completedOrders.length / allOrders.length) * 100 : 0,
          responseTime,
          customerSatisfaction: driverData.averageRating ? (driverData.averageRating / 5) * 100 : 0
        })

        setLoading(false)
      } catch (error) {
        console.error('Error fetching KPI data:', error)
        setLoading(false)
      }
    }

    if (driverId) {
      fetchKPIData()
    }
  }, [driverId, driverData])

  const getCurrentData = () => {
    switch (timeRange) {
      case 'week':
        return {
          orders: kpiData.weeklyOrders,
          earnings: kpiData.weeklyEarnings,
          label: 'Esta Semana'
        }
      case 'month':
        return {
          orders: kpiData.monthlyOrders,
          earnings: kpiData.monthlyEarnings,
          label: 'Este Mes'
        }
      default:
        return {
          orders: kpiData.totalOrders,
          earnings: kpiData.totalEarnings,
          label: 'Total'
        }
    }
  }

  const currentData = getCurrentData()

  const exportToExcel = () => {
    toast({
      title: 'Función en desarrollo',
      description: 'La exportación a Excel será implementada próximamente',
      variant: 'default'
    })
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Métricas de Rendimiento</h3>
        <div className="flex gap-2">
          <Button
            variant={timeRange === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('week')}
          >
            Semana
          </Button>
          <Button
            variant={timeRange === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('month')}
          >
            Mes
          </Button>
          <Button
            variant={timeRange === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('all')}
          >
            Total
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentData.orders}</div>
            <p className="text-xs text-muted-foreground">
              {currentData.label}
            </p>
          </CardContent>
        </Card>

        {/* Earnings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganancias</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${currentData.earnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {currentData.label}
            </p>
          </CardContent>
        </Card>

        {/* On-Time Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Puntualidad</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.onTimeRate.toFixed(1)}%</div>
            <Progress value={kpiData.onTimeRate} className="mt-2" />
          </CardContent>
        </Card>

        {/* Rating */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calificación</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.averageRating.toFixed(1)}</div>
            <div className="flex items-center mt-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.floor(kpiData.averageRating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Completion Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Completado</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.completionRate.toFixed(1)}%</div>
            <Progress value={kpiData.completionRate} className="mt-2" />
          </CardContent>
        </Card>

        {/* Average Order Value */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Promedio</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${kpiData.averageOrderValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Por pedido
            </p>
          </CardContent>
        </Card>

        {/* Response Time */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo de Respuesta</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.responseTime.toFixed(1)}m</div>
            <p className="text-xs text-muted-foreground">
              Promedio
            </p>
          </CardContent>
        </Card>

        {/* Customer Satisfaction */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfacción</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.customerSatisfaction.toFixed(1)}%</div>
            <Progress value={kpiData.customerSatisfaction} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <Button onClick={exportToExcel} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Exportar Reporte (.xlsx)
        </Button>
      </div>
    </div>
  )
}
