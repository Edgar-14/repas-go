"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  FileSpreadsheet, 
  Download, 
  Calendar as CalendarIcon,
  TrendingUp,
  DollarSign,
  Users,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
// // Firebase Functions imports removed - not needed in frontend
// Removed - not needed in frontend
interface ReportData {
  reportId: string
  title: string
  period: string
  generatedAt: Date
  status: 'GENERATING' | 'COMPLETED' | 'ERROR'
  data?: any
}

export function ContadoraReports() {
  const [payrollReports, setPayrollReports] = useState<ReportData[]>([])
  const [creditReports, setCreditReports] = useState<ReportData[]>([])
  const [loading, setLoading] = useState(false)
  const [showPayrollDialog, setShowPayrollDialog] = useState(false)
  const [showCreditDialog, setShowCreditDialog] = useState(false)
  
  // Payroll form state
  const [payrollForm, setPayrollForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  })
  
  // Credit form state
  const [creditForm, setCreditForm] = useState({
    startDate: new Date(),
    endDate: new Date(),
    businessId: ''
  })
  
  const { toast } = useToast()
  const functions = getFunctions()

  const generatePayrollReport = async () => {
    setLoading(true)
    try {
      const exportPayrollReport = httpsCallable(functions, 'exportPayrollReport')
      const result = await exportPayrollReport({
        month: payrollForm.month,
        year: payrollForm.year
      })

      const reportData = result.data as any
      
      setPayrollReports(prev => [{
        reportId: reportData.reportId,
        title: `Reporte de Nómina - ${payrollForm.month}/${payrollForm.year}`,
        period: reportData.data.period,
        generatedAt: new Date(),
        status: 'COMPLETED',
        data: reportData.data
      }, ...prev])

      toast({
        title: 'Reporte Generado',
        description: 'El reporte de nómina ha sido generado exitosamente.',
      })

      setShowPayrollDialog(false)
    } catch (error) {
      console.error('Error generating payroll report:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo generar el reporte de nómina.',
      })
    } finally {
      setLoading(false)
    }
  }

  const generateCreditReport = async () => {
    setLoading(true)
    try {
      const exportCreditHistoryReport = httpsCallable(functions, 'exportCreditHistoryReport')
      const result = await exportCreditHistoryReport({
        startDate: creditForm.startDate,
        endDate: creditForm.endDate,
        businessId: creditForm.businessId || undefined
      })

      const reportData = result.data as any
      
      setCreditReports(prev => [{
        reportId: reportData.reportId,
        title: `Reporte de Créditos - ${format(creditForm.startDate, 'dd/MM/yyyy')} a ${format(creditForm.endDate, 'dd/MM/yyyy')}`,
        period: reportData.data.period,
        generatedAt: new Date(),
        status: 'COMPLETED',
        data: reportData.data
      }, ...prev])

      toast({
        title: 'Reporte Generado',
        description: 'El reporte de historial de créditos ha sido generado exitosamente.',
      })

      setShowCreditDialog(false)
    } catch (error) {
      console.error('Error generating credit report:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo generar el reporte de historial de créditos.',
      })
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = (reportId: string, type: 'payroll' | 'credit') => {
    // In a real implementation, this would download the Excel file
    // For now, we'll show a placeholder
    toast({
      title: 'Descarga Iniciada',
      description: `Descargando reporte ${type === 'payroll' ? 'de nómina' : 'de créditos'}...`,
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'GENERATING':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'ERROR':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      'COMPLETED': 'default',
      'GENERATING': 'secondary',
      'ERROR': 'destructive'
    } as const

    const labels = {
      'COMPLETED': 'Completado',
      'GENERATING': 'Generando',
      'ERROR': 'Error'
    }

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Reportes Financieros</h2>
        <p className="text-muted-foreground">
          Genera y descarga reportes financieros para análisis y contabilidad
        </p>
      </div>

      {/* Report Generation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payroll Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Reporte de Nómina
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Genera un reporte completo de nómina mensual con beneficios y deducciones
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="month">Mes</Label>
                <Select
                  value={payrollForm.month.toString()}
                  onValueChange={(value) => setPayrollForm(prev => ({ ...prev, month: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {new Date(0, i).toLocaleString('es-MX', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="year">Año</Label>
                <Input
                  id="year"
                  type="number"
                  value={payrollForm.year}
                  onChange={(e) => setPayrollForm(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                  min="2020"
                  max="2030"
                />
              </div>
            </div>

            <Dialog open={showPayrollDialog} onOpenChange={setShowPayrollDialog}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Generar Reporte de Nómina
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirmar Generación de Reporte</DialogTitle>
                  <DialogDescription>
                    Se generará un reporte de nómina para {new Date(0, payrollForm.month - 1).toLocaleString('es-MX', { month: 'long' })} de {payrollForm.year}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">El reporte incluirá:</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Datos de todos los repartidores</li>
                      <li>• Cálculo de beneficios legales</li>
                      <li>• Deducciones de IMSS e ISR</li>
                      <li>• Neto a pagar por repartidor</li>
                      <li>• Totales y resúmenes</li>
                    </ul>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowPayrollDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={generatePayrollReport} disabled={loading}>
                    {loading ? 'Generando...' : 'Generar Reporte'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Credit History Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Reporte de Historial de Créditos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Genera un reporte de compras y uso de créditos por negocio
            </p>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha de Inicio</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !creditForm.startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {creditForm.startDate ? (
                          format(creditForm.startDate, "dd/MM/yyyy", { locale: es })
                        ) : (
                          <span>Seleccionar fecha</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={creditForm.startDate}
                        onSelect={(date) => date && setCreditForm(prev => ({ ...prev, startDate: date }))}
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label>Fecha de Fin</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !creditForm.endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {creditForm.endDate ? (
                          format(creditForm.endDate, "dd/MM/yyyy", { locale: es })
                        ) : (
                          <span>Seleccionar fecha</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={creditForm.endDate}
                        onSelect={(date) => date && setCreditForm(prev => ({ ...prev, endDate: date }))}
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <Dialog open={showCreditDialog} onOpenChange={setShowCreditDialog}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Generar Reporte de Créditos
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirmar Generación de Reporte</DialogTitle>
                  <DialogDescription>
                    Se generará un reporte de historial de créditos del {format(creditForm.startDate, 'dd/MM/yyyy')} al {format(creditForm.endDate, 'dd/MM/yyyy')}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">El reporte incluirá:</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Historial de compras de créditos</li>
                      <li>• Uso de créditos por negocio</li>
                      <li>• Saldos actuales</li>
                      <li>• Métodos de pago utilizados</li>
                      <li>• Estadísticas de uso</li>
                    </ul>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreditDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={generateCreditReport} disabled={loading}>
                    {loading ? 'Generando...' : 'Generar Reporte'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* Generated Reports */}
      <div className="space-y-6">
        {/* Payroll Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Reportes de Nómina Generados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {payrollReports.length > 0 ? (
              <div className="space-y-3">
                {payrollReports.map((report) => (
                  <div key={report.reportId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(report.status)}
                      <div>
                        <p className="font-medium">{report.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Generado el {format(report.generatedAt, 'dd/MM/yyyy HH:mm', { locale: es })}
                        </p>
                        {report.data && (
                          <div className="flex gap-4 mt-1">
                            <span className="text-xs text-muted-foreground">
                              Repartidores: {report.data.totalDrivers}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Total Beneficios: ${report.data.totalBenefits?.toFixed(2)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Neto a Pagar: ${report.data.totalNetPay?.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(report.status)}
                      {report.status === 'COMPLETED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadReport(report.reportId, 'payroll')}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Descargar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay reportes de nómina generados</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Credit Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Reportes de Créditos Generados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {creditReports.length > 0 ? (
              <div className="space-y-3">
                {creditReports.map((report) => (
                  <div key={report.reportId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(report.status)}
                      <div>
                        <p className="font-medium">{report.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Generado el {format(report.generatedAt, 'dd/MM/yyyy HH:mm', { locale: es })}
                        </p>
                        {report.data && (
                          <div className="flex gap-4 mt-1">
                            <span className="text-xs text-muted-foreground">
                              Negocios: {report.data.totalBusinesses}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Créditos Comprados: ${report.data.totalCreditsPurchased?.toFixed(2)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Créditos Usados: ${report.data.totalCreditsUsed?.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(report.status)}
                      {report.status === 'COMPLETED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadReport(report.reportId, 'credit')}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Descargar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay reportes de créditos generados</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
