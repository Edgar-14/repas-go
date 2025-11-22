'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db, app } from '@/lib/firebase';
import withAuth from '@/components/auth/withAuth';
import { COLLECTIONS } from '@/lib/collections';
import { Search, Download } from 'lucide-react';
import { Section, PageToolbar } from '@/components/layout/primitives';
interface AuditLogEntry {
  id: string;
  action: string;
  targetId?: string;
  targetType?: string;
  performedBy: string;
  performedByEmail: string;
  performedByRole: string;
  timestamp: any;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: string;
  details?: any;
  oldValues?: any;
  newValues?: any;
}

function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const functions = getFunctions(app);

  useEffect(() => {
    // Real-time listener for audit logs
    const q = query(collection(db, COLLECTIONS.AUDIT_LOGS), orderBy("timestamp", "desc"), limit(100));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const logsData: AuditLogEntry[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        logsData.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp ? data.timestamp.toDate() : new Date()
        } as AuditLogEntry);
      });
      setLogs(logsData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.performedByEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.targetId && log.targetId.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSeverity = severityFilter === '' || log.severity === severityFilter;
    const matchesCategory = categoryFilter === '' || log.category === categoryFilter;
    
    return matchesSearch && matchesSeverity && matchesCategory;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const exportLogs = async () => {
    try {
      const queryAuditLogs = httpsCallable(functions, 'queryAuditLogs');
      const result = await queryAuditLogs({
        limit: 1000,
        severity: severityFilter || undefined,
        category: categoryFilter || undefined
      });
      
      // Convert to CSV and download
      const csv = convertToCSV((result.data as any).logs);
      downloadCSV(csv, 'audit-logs.csv');
    } catch (error) {
      console.error('Error exporting logs:', error);
    }
  };

  const convertToCSV = (data: any[]) => {
    if (!data.length) return '';
    
    const headers = ['Timestamp', 'Action', 'Performed By', 'Role', 'Severity', 'Category', 'Target ID', 'Details'];
    const rows = data.map(log => [
      new Date(log.timestamp).toLocaleString(),
      log.action,
      log.performedByEmail,
      log.performedByRole,
      log.severity,
      log.category,
      log.targetId || '',
      log.details ? JSON.stringify(log.details) : ''
    ]);
    
    return [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="text-lg font-bold">Cargando registros de auditoría...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Section>
        <PageToolbar
          left={
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 flex-shrink-0" />
              <Input
                placeholder="Buscar acción, email o ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          }
          right={
            <div className="flex gap-2 flex-wrap">
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filtrar por severidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las severidades</SelectItem>
                  <SelectItem value="CRITICAL">Crítico</SelectItem>
                  <SelectItem value="HIGH">Alto</SelectItem>
                  <SelectItem value="MEDIUM">Medio</SelectItem>
                  <SelectItem value="LOW">Bajo</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filtrar por categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las categorías</SelectItem>
                  <SelectItem value="FINANCIAL">Financiero</SelectItem>
                  <SelectItem value="USER_MANAGEMENT">Gestión de Usuarios</SelectItem>
                  <SelectItem value="ORDER_MANAGEMENT">Gestión de Pedidos</SelectItem>
                  <SelectItem value="SYSTEM">Sistema</SelectItem>
                  <SelectItem value="GENERAL">General</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={exportLogs} variant="outline">
                <Download />
                Exportar CSV
              </Button>
            </div>
          }
        />
        <p className="text-sm text-muted-foreground mt-2">
          {filteredLogs.length} registro(s) de auditoría
        </p>
      </Section>

      {/* Audit Logs Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Severidad</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Objetivo</TableHead>
                <TableHead>Detalles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedLog(log)}>
                  <TableCell className="font-mono text-xs">
                    {log.timestamp instanceof Date ? log.timestamp.toLocaleString() : 'N/A'}
                  </TableCell>
                  <TableCell className="font-medium">{log.action}</TableCell>
                  <TableCell>{log.performedByEmail}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.performedByRole}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getSeverityColor(log.severity)}>
                      {log.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{log.category}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{log.targetId || 'N/A'}</TableCell>
                  <TableCell className="truncate max-w-xs">
                    {log.details ? JSON.stringify(log.details).substring(0, 50) + '...' : 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detailed View */}
      {selectedLog && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Detalles de Auditoría</CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSelectedLog(null)}
              className="w-fit"
            >
              Cerrar
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold">Información Básica</h4>
                <p><strong>ID:</strong> {selectedLog.id}</p>
                <p><strong>Acción:</strong> {selectedLog.action}</p>
                <p><strong>Timestamp:</strong> {selectedLog.timestamp instanceof Date ? selectedLog.timestamp.toLocaleString() : 'N/A'}</p>
                <p><strong>Usuario:</strong> {selectedLog.performedByEmail}</p>
                <p><strong>Rol:</strong> {selectedLog.performedByRole}</p>
              </div>
              <div>
                <h4 className="font-semibold">Clasificación</h4>
                <p><strong>Severidad:</strong> <Badge className={getSeverityColor(selectedLog.severity)}>{selectedLog.severity}</Badge></p>
                <p><strong>Categoría:</strong> {selectedLog.category}</p>
                <p><strong>Objetivo:</strong> {selectedLog.targetId || 'N/A'}</p>
                <p><strong>Tipo:</strong> {selectedLog.targetType || 'N/A'}</p>
              </div>
            </div>
            
            {selectedLog.details && (
              <div className="mt-4">
                <h4 className="font-semibold">Detalles</h4>
                <pre className="bg-muted p-3 rounded text-xs overflow-auto">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            )}
            
            {(selectedLog.oldValues || selectedLog.newValues) && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                {selectedLog.oldValues && (
                  <div>
                    <h4 className="font-semibold">Valores Anteriores</h4>
                    <pre className="bg-red-50 p-3 rounded text-xs overflow-auto">
                      {JSON.stringify(selectedLog.oldValues, null, 2)}
                    </pre>
                  </div>
                )}
                {selectedLog.newValues && (
                  <div>
                    <h4 className="font-semibold">Valores Nuevos</h4>
                    <pre className="bg-green-50 p-3 rounded text-xs overflow-auto">
                      {JSON.stringify(selectedLog.newValues, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default withAuth(AdminAuditLogPage);
