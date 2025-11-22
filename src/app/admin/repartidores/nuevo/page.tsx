'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import withAuth from '@/components/auth/withAuth';

interface NewDriverForm {
  fullName: string;
  email: string;
  phone: string;
  rfc: string;
  nss: string;
  curp: string;
  address: string;
  vehicleType: string;
  vehiclePlates: string;
}

function NewDriverPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<NewDriverForm>({
    fullName: '',
    email: '',
    phone: '',
    rfc: '',
    nss: '',
    curp: '',
    address: '',
    vehicleType: 'CAR',
    vehiclePlates: ''
  });

  const handleInputChange = (field: keyof NewDriverForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const registerDriver = httpsCallable(functions, 'registerDriver');
      const result = await registerDriver({
        email: formData.email,
        password: 'temp123',
        fullName: formData.fullName,
        phone: formData.phone
      });

      toast({
        title: 'Cuenta creada',
        description: 'El repartidor ha sido registrado exitosamente',
        variant: 'default'
      });

      router.push('/admin/repartidores');
    } catch (error: any) {
      console.error('Error creating driver account:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear la cuenta del repartidor',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/admin/repartidores')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Repartidores
        </Button>
        <h1 className="text-2xl font-bold">Crear Nuevo Repartidor</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Repartidor</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Nombre Completo *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">Teléfono *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="rfc">RFC</Label>
                <Input
                  id="rfc"
                  value={formData.rfc}
                  onChange={(e) => handleInputChange('rfc', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="nss">NSS</Label>
                <Input
                  id="nss"
                  value={formData.nss}
                  onChange={(e) => handleInputChange('nss', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="curp">CURP</Label>
                <Input
                  id="curp"
                  value={formData.curp}
                  onChange={(e) => handleInputChange('curp', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="vehicleType">Tipo de Vehículo</Label>
                <Select
                  value={formData.vehicleType}
                  onValueChange={(value) => handleInputChange('vehicleType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar vehículo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CAR">Automóvil</SelectItem>
                    <SelectItem value="MOTORCYCLE">Moto</SelectItem>
                    <SelectItem value="BICYCLE">Bicicleta</SelectItem>
                    <SelectItem value="WALKING">A pie</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="vehiclePlates">Placas del Vehículo</Label>
                <Input
                  id="vehiclePlates"
                  value={formData.vehiclePlates}
                  onChange={(e) => handleInputChange('vehiclePlates', e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Crear Repartidor
                  </>
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push('/admin/repartidores')}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default withAuth(NewDriverPage, {
  requiredRoles: ['ADMIN', 'SUPER_ADMIN', 'CONTADORA']
});
