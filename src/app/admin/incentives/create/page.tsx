'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { withAuth } from '@/components/auth/withAuth';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
// // Firebase Functions imports removed - not needed in frontend
// Removed - not needed in frontend
function CreateIncentivePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    type: 'PERFORMANCE', // PERFORMANCE, BONUS, SPECIAL
    criteria: 'ORDERS_COMPLETED', // ORDERS_COMPLETED, RATING, ON_TIME, SPECIAL
    targetValue: '',
    startDate: '',
    endDate: '',
    maxParticipants: '',
    status: 'active'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const incentiveData = {
        ...formData,
        amount: parseFloat(formData.amount),
        targetValue: parseFloat(formData.targetValue),
        maxParticipants: parseInt(formData.maxParticipants) || null,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        participants: 0,
        createdAt: new Date(),
        createdBy: 'admin' // TODO: Get from auth context
      };

      await addDoc(collection(db, 'incentives'), incentiveData);

      toast({
        title: 'Incentivo creado',
        description: 'El incentivo se ha creado exitosamente.',
      });

      router.push('/admin/incentives');
    } catch (error) {
      console.error('Error creating incentive:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo crear el incentivo.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Crear Incentivo</h1>
          <p className="text-muted-foreground">Configura un nuevo incentivo para repartidores</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Incentivo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ej: Bonificación por puntualidad"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe los detalles del incentivo..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Monto del Incentivo (MXN) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="1"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Incentivo *</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERFORMANCE">Por Rendimiento</SelectItem>
                    <SelectItem value="BONUS">Bonificación</SelectItem>
                    <SelectItem value="SPECIAL">Especial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Criterios y Configuración */}
          <Card>
            <CardHeader>
              <CardTitle>Criterios y Configuración</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="criteria">Criterio de Evaluación *</Label>
                <Select value={formData.criteria} onValueChange={(value) => handleInputChange('criteria', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el criterio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ORDERS_COMPLETED">Pedidos Completados</SelectItem>
                    <SelectItem value="RATING">Calificación Promedio</SelectItem>
                    <SelectItem value="ON_TIME">Entregas a Tiempo</SelectItem>
                    <SelectItem value="SPECIAL">Criterio Especial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetValue">Valor Objetivo *</Label>
                <Input
                  id="targetValue"
                  type="number"
                  step="0.01"
                  min="1"
                  value={formData.targetValue}
                  onChange={(e) => handleInputChange('targetValue', e.target.value)}
                  placeholder="Ej: 10 pedidos, 4.5 estrellas, etc."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxParticipants">Máximo de Participantes</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  min="1"
                  value={formData.maxParticipants}
                  onChange={(e) => handleInputChange('maxParticipants', e.target.value)}
                  placeholder="Dejar vacío para ilimitado"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Estado *</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="paused">Pausado</SelectItem>
                    <SelectItem value="archived">Archivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fechas */}
        <Card>
          <CardHeader>
            <CardTitle>Período de Vigencia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Fecha de Inicio *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Fecha de Fin *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botones de Acción */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Crear Incentivo
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default withAuth(CreateIncentivePage, {
  requiredRoles: ['ADMIN', 'SUPER_ADMIN', 'CONTADORA'],
});
