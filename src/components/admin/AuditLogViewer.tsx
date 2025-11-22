'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { AuditService } from '@/lib/services/AuditService';
// // Firebase Functions imports removed - not needed in frontend
// Removed - not needed in frontend
interface AuditLogEntry {
  id: string;
  action: string;
  entityType?: string;
  entityId?: string;
  performedBy?: string;
  timestamp: any;
  createdAt?: any;
  details?: any;
  [key: string]: any; // Para permitir propiedades adicionales
}
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Eye, 
  Calendar,
  User,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AuditLogViewerProps {
  className?: string;
}

export function AuditLogViewer({ className }: AuditLogViewerProps) {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const actionTypes = [
    'CREATE_ORDER_REQUEST',
    'CREATE_ORDER_SUCCESS', 
    'CREATE_ORDER_ERROR',
    'LIQUIDATE_DEBT_REQUEST',
    'LIQUIDATE_DEBT_SUCCESS',
    'LIQUIDATE_DEBT_ERROR',
    'DRIVER_APPROVAL_REQUEST',
    'DRIVER_APPROVAL_SUCCESS',
    'DRIVER_REJECTION',
    'ADMIN_SYNC_REQUEST',
    'ADMIN_SYNC_SUCCESS',
    'ADMIN_SYNC_ERROR',
    'PAYROLL_PROCESSING_REQUEST',
    'PAYROLL_PROCESSING_SUCCESS',
    'PAYROLL_PROCESSING_ERROR'
  ];

  const getActionIcon = (action: string) => {
    if (action.includes('SUCCESS')) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (action.includes('ERROR')) return <XCircle className="h-4 w-4 text-red-600" />;
    if (action.includes('REQUEST')) return <Clock className="h-4 w-4 text-blue-600" />;
    return <Activity className="h-4 w-4 text-gray-600" />;
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('SUCCESS')) return 'bg-green-100 text-green-800';
    if (action.includes('ERROR')) return 'bg-red-100 text-red-800';
    if (action.includes('REQUEST')) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const auditLogs = await AuditService.getAuditLogs(100);
      // Filtrar solo los logs que tienen la estructura correcta
      const validLogs = auditLogs.filter((log: any) => 
        log && typeof log === 'object' && log.action && log.timestamp
      ) as AuditLogEntry[];
      setLogs(validLogs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar los logs de auditoría'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actorUid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    
    const matchesDate = dateFilter === 'all' || (() => {
      const logDate = new Date(log.timestamp);
      const now = new Date();
      
      switch (dateFilter) {
        case 'today':
          return logDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return logDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return logDate >= monthAgo;
        default:
          return true;
      }
    })();
    
    return matchesSearch && matchesAction && matchesDate;
  });

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'Action', 'Actor UID', 'Actor Role', 'Details'],
      ...filteredLogs.map(log => [
        format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss'),
        log.action,
        log.actorUid,
        log.actorRole,
        JSON.stringify(log.details)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Cargando logs de auditoría...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Logs de Auditoría del Sistema
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchLogs}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
              <Button variant="outline" size="sm" onClick={exportLogs}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Buscar</label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Buscar en logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Acción</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las acciones</SelectItem>
                  {actionTypes.map(action => (
                    <SelectItem key={action} value={action}>
                      {action.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Período</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo el tiempo</SelectItem>
                  <SelectItem value="today">Hoy</SelectItem>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Último mes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Badge variant="outline" className="text-sm">
                {filteredLogs.length} registros
              </Badge>
            </div>
          </div>

          {/* Lista de logs */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No se encontraron logs de auditoría</p>
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getActionIcon(log.action)}
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge className={getActionBadgeColor(log.action)}>
                            {log.action.replace(/_/g, ' ')}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <User className="h-3 w-3 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {log.actorUid} ({log.actorRole})
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de detalles */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {getActionIcon(selectedLog.action)}
                  Detalles del Log
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedLog(null)}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Acción</label>
                  <p className="text-lg font-semibold">{selectedLog.action}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Timestamp</label>
                  <p>{format(new Date(selectedLog.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: es })}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Actor</label>
                  <p>UID: {selectedLog.actorUid}</p>
                  <p>Rol: {selectedLog.actorRole}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Detalles</label>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
