'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, User, Key, Shield, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { COLLECTIONS } from '@/lib/collections';
import withAuth from '@/components/auth/withAuth';

interface Driver {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  rfc: string;
  nss: string;
  curp: string;
  address: string;
  status: string;
  vehicleType?: string;
  vehiclePlates?: string;
  walletBalance?: number;
  pendingDebts?: number;
}

function DriverEditPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [disablingAccount, setDisablingAccount] = useState(false);

  useEffect(() => {
    const loadDriver = async () => {
      try {
        const driverDoc = await getDoc(doc(db, COLLECTIONS.DRIVERS, params.id as string));
        if (driverDoc.exists()) {
          setDriver({ id: driverDoc.id, ...driverDoc.data() } as Driver);
        } else {
          toast({
            title: 'Error',
            description: 'Repartidor no encontrado',
            variant: 'destructive',
          });
          router.push('/admin/repartidores');
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Error al cargar datos del repartidor',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadDriver();
  }, [params.id, toast, router]);

  const handleSave = async () => {
    if (!driver) return;
    
    // Validación básica
    if (!driver.fullName || !driver.email) {
      toast({
        title: 'Error de validación',
        description: 'El nombre completo y email son obligatorios',
        variant: 'destructive',
      });
      return;
    }
    
    setSaving(true);
    console.log('Attempting to save driver data:', {
      driverId: driver.id,
      data: {
        fullName: driver.fullName,
        email: driver.email,
        phone: driver.phone,
        status: driver.status
      }
    });
    
    try {
      await updateDoc(doc(db, COLLECTIONS.DRIVERS, driver.id), {
        fullName: driver.fullName,
        email: driver.email,
        phone: driver.phone,
        rfc: driver.rfc,
        nss: driver.nss,
        curp: driver.curp,
        address: driver.address,
        status: driver.status,
        // Estructura correcta según colecciones.md
        vehicle: {
          type: driver.vehicleType || (driver as any).vehicle?.type || 'moto',
          plates: driver.vehiclePlates || (driver as any).vehicle?.plates || '',
          brand: (driver as any).vehicle?.brand || '',
          model: (driver as any).vehicle?.model || '',
          year: (driver as any).vehicle?.year || '',
          color: (driver as any).vehicle?.color || ''
        },
        // Mantener compatibilidad con campos legacy
        vehicleType: driver.vehicleType || (driver as any).vehicle?.type || 'moto',
        vehiclePlates: driver.vehiclePlates || (driver as any).vehicle?.plates || '',
        walletBalance: driver.walletBalance || 0,
        pendingDebts: driver.pendingDebts || 0,
        updatedAt: new Date()
      });

      toast({
        title: 'Cambios guardados',
        description: 'La información se actualizó correctamente',
      });
      
      router.push(`/admin/repartidores/${driver.id}`);
    } catch (error: any) {
      console.error('Error saving driver data:', error);
      toast({
        title: 'Error',
        description: `No se pudieron guardar los cambios: ${error.message || error.code || 'Error desconocido'}`,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!driver) return;
    
    setResettingPassword(true);
    try {
      const functions = getFunctions();
      const resetDriverPassword = httpsCallable(functions, 'resetDriverPassword');
      
      await resetDriverPassword({ 
        driverId: driver.id,
        email: driver.email 
      });

      toast({
        title: 'Contraseña reseteada',
        description: 'Se ha enviado un email para restablecer la contraseña',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo resetear la contraseña',
        variant: 'destructive',
      });
    } finally {
      setResettingPassword(false);
    }
  };

  const handleDisableAccount = async () => {
    if (!driver) return;
    
    setDisablingAccount(true);
    try {
      const functions = getFunctions();
      const toggleDriverAccount = httpsCallable(functions, 'toggleDriverAccount');
      
      await toggleDriverAccount({ 
        driverId: driver.id,
        disable: driver.status !== 'SUSPENDED'
      });

      const newStatus = driver.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
      setDriver({ ...driver, status: newStatus });

      toast({
        title: newStatus === 'SUSPENDED' ? 'Cuenta deshabilitada' : 'Cuenta habilitada',
        description: `La cuenta ha sido ${newStatus === 'SUSPENDED' ? 'deshabilitada' : 'habilitada'}`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo cambiar el estado de la cuenta',
        variant: 'destructive',
      });
    } finally {
      setDisablingAccount(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p>Cargando información del repartidor...</p>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p>Repartidor no encontrado</p>
        <Button onClick={() => router.push('/admin/repartidores')}>
          Volver a Lista de Repartidores
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/admin/repartidores/${params.id}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al Perfil
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Editar Información Personal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fullName">Nombre Completo</Label>
              <Input
                id="fullName"
                value={driver.fullName || ''}
                onChange={(e) => setDriver({ ...driver, fullName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={driver.email || ''}
                onChange={(e) => setDriver({ ...driver, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={driver.phone || ''}
                onChange={(e) => setDriver({ ...driver, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="rfc">RFC</Label>
              <Input
                id="rfc"
                value={driver.rfc || ''}
                onChange={(e) => setDriver({ ...driver, rfc: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="nss">NSS</Label>
              <Input
                id="nss"
                value={driver.nss || ''}
                onChange={(e) => setDriver({ ...driver, nss: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="curp">CURP</Label>
              <Input
                id="curp"
                value={driver.curp || ''}
                onChange={(e) => setDriver({ ...driver, curp: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                value={driver.address || ''}
                onChange={(e) => setDriver({ ...driver, address: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="status">Estado</Label>
              <Select value={driver.status} onValueChange={(value) => setDriver({ ...driver, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Activo</SelectItem>
                  <SelectItem value="ACTIVO_COTIZANDO">Activo Cotizando</SelectItem>
                  <SelectItem value="INACTIVE">Inactivo</SelectItem>
                  <SelectItem value="SUSPENDED">Suspendido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="vehicleType">Tipo de Vehículo</Label>
              <Select value={driver.vehicleType} onValueChange={(value) => setDriver({ ...driver, vehicleType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar vehículo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CAR">Auto</SelectItem>
                  <SelectItem value="MOTORCYCLE">Motocicleta</SelectItem>
                  <SelectItem value="BICYCLE">Bicicleta</SelectItem>
                  <SelectItem value="TRUCK">Camioneta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="vehiclePlates">Placas del Vehículo</Label>
              <Input
                id="vehiclePlates"
                value={driver.vehiclePlates || ''}
                onChange={(e) => setDriver({ ...driver, vehiclePlates: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="walletBalance">Saldo Billetera ($)</Label>
              <Input
                id="walletBalance"
                type="number"
                step="0.01"
                value={driver.walletBalance || 0}
                onChange={(e) => setDriver({ ...driver, walletBalance: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label htmlFor="pendingDebts">Deudas Pendientes ($)</Label>
              <Input
                id="pendingDebts"
                type="number"
                step="0.01"
                value={driver.pendingDebts || 0}
                onChange={(e) => setDriver({ ...driver, pendingDebts: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
            <Button variant="outline" onClick={() => router.push(`/admin/repartidores/${driver.id}`)}>
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Gestión de Cuenta y Seguridad */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Gestión de Cuenta y Seguridad
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={handleResetPassword}
              disabled={resettingPassword}
              className="flex items-center gap-2"
            >
              <Key className="h-4 w-4" />
              {resettingPassword ? 'Enviando...' : 'Resetear Contraseña'}
            </Button>
            
            <Button
              variant={driver.status === 'SUSPENDED' ? 'default' : 'destructive'}
              onClick={handleDisableAccount}
              disabled={disablingAccount}
              className="flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              {disablingAccount 
                ? 'Procesando...' 
                : driver.status === 'SUSPENDED' 
                  ? 'Habilitar Cuenta' 
                  : 'Deshabilitar Cuenta'
              }
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                window.open(`mailto:${driver.email}?subject=Soporte BeFast&body=Hola ${driver.fullName},%0A%0A`, '_blank');
              }}
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Enviar Email
            </Button>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Información de Cuenta:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Email de acceso:</span>
                <p className="text-gray-600">{driver.email}</p>
              </div>
              <div>
                <span className="font-medium">Estado de cuenta:</span>
                <p className={`font-medium ${driver.status === 'SUSPENDED' ? 'text-red-600' : 'text-green-600'}`}>
                  {driver.status === 'SUSPENDED' ? 'Cuenta deshabilitada' : 'Cuenta activa'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Instrucciones para Soporte:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• <strong>Resetear Contraseña:</strong> Envía email automático al repartidor para que restablezca su contraseña</li>
              <li>• <strong>Deshabilitar Cuenta:</strong> Bloquea el acceso del repartidor al sistema (reversible)</li>
              <li>• <strong>Enviar Email:</strong> Abre tu cliente de email para contactar directamente al repartidor</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default withAuth(DriverEditPage, {
  requiredRoles: ['ADMIN', 'SUPER_ADMIN', 'CONTADORA'],
});
