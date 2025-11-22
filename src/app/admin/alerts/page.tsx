'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/Input';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Search,
  Bell,
  TrendingUp,
  Users,
  DollarSign,
  FileText,
  Loader2
} from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import withAuth from '@/components/auth/withAuth';
import { COLLECTIONS } from '@/lib/collections';
import { Section, PageToolbar } from '@/components/layout/primitives';
interface AlertData {
  id: string;
  type: 'COMPLIANCE' | 'FINANCIAL' | 'OPERATIONAL' | 'SYSTEM';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  createdAt: any;
  acknowledgedBy?: string;
  acknowledgedAt?: any;
  resolvedBy?: string;
  resolvedAt?: any;
  data?: any;
  affectedEntities?: string[];
}

function AdminAlertsPage() {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<AlertData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const alertsQuery = query(
      collection(db, COLLECTIONS.SYSTEM_ALERTS),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(alertsQuery, (snapshot) => {
      const alertsData: AlertData[] = [];
      snapshot.forEach((doc) => {
        alertsData.push({ id: doc.id, ...doc.data() } as AlertData);
      });
      setAlerts(alertsData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let filtered = [...alerts];

    if (searchTerm) {
      filtered = filtered.filter(alert =>
        alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(alert => alert.type === typeFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(alert => alert.priority === priorityFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(alert => alert.status === statusFilter);
    }

    setFilteredAlerts(filtered);
  }, [alerts, searchTerm, typeFilter, priorityFilter, statusFilter]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'COMPLIANCE': return <FileText className="h-4 w-4" />;
      case 'FINANCIAL': return <DollarSign className="h-4 w-4" />;
      case 'OPERATIONAL': return <Users className="h-4 w-4" />;
      case 'SYSTEM': return <TrendingUp className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'ACKNOWLEDGED': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'RESOLVED': return <CheckCircle className="h-4 w-4 text-green-600" />;
      default: return <XCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const alertRef = doc(db, 'systemAlerts', alertId);
      await updateDoc(alertRef, {
        status: 'ACKNOWLEDGED',
        acknowledgedBy: 'admin', // TODO: Get actual admin ID
        acknowledgedAt: new Date()
      });
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const alertRef = doc(db, 'systemAlerts', alertId);
      await updateDoc(alertRef, {
        status: 'RESOLVED',
        resolvedBy: 'admin', // TODO: Get actual admin ID
        resolvedAt: new Date()
      });
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const getAlertStats = () => {
    const active = alerts.filter(a => a.status === 'ACTIVE').length;
    const critical = alerts.filter(a => a.priority === 'CRITICAL' && a.status === 'ACTIVE').length;
    const compliance = alerts.filter(a => a.type === 'COMPLIANCE' && a.status === 'ACTIVE').length;
    const resolved = alerts.filter(a => a.status === 'RESOLVED').length;

    return { active, critical, compliance, resolved };
  };

  const stats = getAlertStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Activas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              Requieren atención
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Críticas</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
            <p className="text-xs text-muted-foreground">
              Máxima prioridad
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cumplimiento</CardTitle>
            <FileText className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.compliance}</div>
            <p className="text-xs text-muted-foreground">
              Asuntos legales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resueltas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            <p className="text-xs text-muted-foreground">
              Este mes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Section>
        <PageToolbar
          left={
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 flex-shrink-0" />
              <Input
                placeholder="Buscar alertas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          }
          right={
            <div className="flex gap-2 flex-wrap">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="COMPLIANCE">Cumplimiento</SelectItem>
                  <SelectItem value="FINANCIAL">Financiero</SelectItem>
                  <SelectItem value="OPERATIONAL">Operacional</SelectItem>
                  <SelectItem value="SYSTEM">Sistema</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las prioridades</SelectItem>
                  <SelectItem value="CRITICAL">Crítica</SelectItem>
                  <SelectItem value="HIGH">Alta</SelectItem>
                  <SelectItem value="MEDIUM">Media</SelectItem>
                  <SelectItem value="LOW">Baja</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="ACTIVE">Activa</SelectItem>
                  <SelectItem value="ACKNOWLEDGED">Reconocida</SelectItem>
                  <SelectItem value="RESOLVED">Resuelta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        />
      </Section>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Bell className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  No hay alertas que coincidan con los filtros
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredAlerts.map((alert) => (
            <Card key={alert.id} className={`border-l-4 ${
              alert.priority === 'CRITICAL' ? 'border-l-red-500' :
              alert.priority === 'HIGH' ? 'border-l-orange-500' :
              alert.priority === 'MEDIUM' ? 'border-l-yellow-500' :
              'border-l-green-500'
            }`}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getTypeIcon(alert.type)}
                      <h3 className="font-semibold">{alert.title}</h3>
                      <Badge className={getPriorityColor(alert.priority)}>
                        {alert.priority}
                      </Badge>
                      <Badge variant="outline">
                        {alert.type}
                      </Badge>
                      {getStatusIcon(alert.status)}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {alert.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        Creada: {alert.createdAt?.toDate().toLocaleString('es-MX')}
                      </span>
                      {alert.acknowledgedAt && (
                        <span>
                          Reconocida: {alert.acknowledgedAt.toDate().toLocaleString('es-MX')}
                        </span>
                      )}
                      {alert.resolvedAt && (
                        <span>
                          Resuelta: {alert.resolvedAt.toDate().toLocaleString('es-MX')}
                        </span>
                      )}
                    </div>

                    {alert.affectedEntities && alert.affectedEntities.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground">
                          Entidades afectadas: {alert.affectedEntities.join(', ')}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    {alert.status === 'ACTIVE' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                        >
                          <Clock />
                          Reconocer
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleResolveAlert(alert.id)}
                        >
                          <CheckCircle />
                          Resolver
                        </Button>
                      </>
                    )}
                    {alert.status === 'ACKNOWLEDGED' && (
                      <Button
                        size="sm"
                        onClick={() => handleResolveAlert(alert.id)}
                      >
                        <CheckCircle />
                        Resolver
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default withAuth(AdminAlertsPage, {
  requiredRoles: ['ADMIN', 'SUPER_ADMIN', 'CONTADORA'],
});
