
'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Download, 
  Upload, 
  FileText, 
  Calendar, 
  Search,
  CheckCircle, 
  AlertTriangle,
  Clock,
  Eye,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

const statusColors = {
  generated: 'bg-blue-100 text-blue-800',
  uploaded: 'bg-yellow-100 text-yellow-800',
  processed: 'bg-green-100 text-green-800',
  pending: 'bg-gray-100 text-gray-800',
  error: 'bg-red-100 text-red-800'
};

const statusLabels = {
  generated: 'Generado',
  uploaded: 'Subido a IMSS',
  processed: 'Procesado',
  pending: 'Pendiente',
  error: 'Error'
};

const statusIcons = {
  generated: FileText,
  uploaded: Upload,
  processed: CheckCircle,
  pending: Clock,
  error: AlertTriangle
};

const typeColors = {
  'ALTA': 'bg-green-100 text-green-800',
  'BAJA': 'bg-red-100 text-red-800',
  'MODIFICACION': 'bg-blue-100 text-blue-800',
  'SUA_MENSUAL': 'bg-purple-100 text-purple-800',
  'VARIABILIDAD': 'bg-orange-100 text-orange-800'
};

export default function IDSEFilesPage() {
  const [idseFilesData, setIdseFilesData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, "idseFiles"), orderBy("generatedDate", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const files = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setIdseFilesData(files);
        setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredFiles = idseFilesData.filter(file => {
    const matchesSearch = file.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || file.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || file.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleGenerateFile = async () => {
    setIsGenerating(true);
    toast({ title: 'Iniciando generación', description: 'El proceso de generación de archivos IDSE ha comenzado en segundo plano.' });
    
    try {
      // Call the Cloud Function for IDSE file generation
      const response = await fetch('/api/admin/generate-idse-files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          period: new Date().toISOString().slice(0, 7) // YYYY-MM format
        }),
      });

      if (!response.ok) {
        throw new Error('Error al generar archivos IDSE');
      }

      const result = await response.json();
      toast({ 
        title: 'Éxito', 
        description: `Archivos IDSE generados exitosamente para ${result.driversProcessed} repartidores.` 
      });
    } catch (error: any) {
      toast({ 
        variant: 'destructive',
        title: 'Error', 
        description: error.message || 'Error al generar archivos IDSE'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const totalFiles = idseFilesData.length;
  const pendingFiles = idseFilesData.filter(f => f.status === 'pending').length;
  const processedFiles = idseFilesData.filter(f => f.status === 'processed').length;
  const totalRecords = idseFilesData.reduce((sum, file) => sum + file.records, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/payroll">
          <Button variant="outline" size="sm">
            <ArrowLeft size={16} className="mr-2" />
            Volver a Nómina
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Archivos IDSE
          </h1>
          <p className="text-muted-foreground">
            Gestión de archivos para el Instituto del Seguro Social (IMSS)
          </p>
        </div>
        <Button 
          onClick={handleGenerateFile}
          disabled={isGenerating}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isGenerating ? (
            <>
              <RefreshCw size={16} className="mr-2 animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <FileText size={16} className="mr-2" />
              Generar Archivo
            </>
          )}
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Archivos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFiles}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingFiles}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Procesados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processedFiles}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registros</CardTitle>
            <span className="text-lg">📊</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecords}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Buscar archivos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Tipo de archivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="ALTA">Altas</SelectItem>
                <SelectItem value="BAJA">Bajas</SelectItem>
                <SelectItem value="MODIFICACION">Modificaciones</SelectItem>
                <SelectItem value="SUA_MENSUAL">SUA Mensual</SelectItem>
                <SelectItem value="VARIABILIDAD">Variabilidad</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="generated">Generados</SelectItem>
                <SelectItem value="uploaded">Subidos</SelectItem>
                <SelectItem value="processed">Procesados</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="error">Con Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Files Table */}
      <Card>
        <CardHeader>
          <CardTitle>Archivos IDSE</CardTitle>
          <CardDescription>
            Lista de archivos generados para el IMSS
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin" /></div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Archivo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Generado</TableHead>
                <TableHead>Registros</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFiles.map((file) => {
                const StatusIcon = statusIcons[file.status as keyof typeof statusIcons];
                return (
                  <TableRow key={file.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{file.fileName}</div>
                        <div className="text-sm text-gray-500">{file.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={typeColors[file.type as keyof typeof typeColors]}>
                        {file.type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{file.period}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{file.generatedDate?.toDate().toLocaleDateString()}</div>
                        <div className="text-gray-500">{file.generatedDate?.toDate().toLocaleTimeString()}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{file.records}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[file.status as keyof typeof statusColors]}>
                        <StatusIcon size={14} className="mr-1" />
                        {statusLabels[file.status as keyof typeof statusLabels]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm">
                          <Eye size={16} className="mr-1" />
                          Ver
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download size={16} className="mr-1" />
                          Descargar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
