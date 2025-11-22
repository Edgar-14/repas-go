'use client';

import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { app, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Section, PageToolbar } from '@/components/layout/primitives';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
// // Firebase Functions imports removed - not needed in frontend
// Removed - not needed in frontend
import { Settings,
  Save,
  Eye,
  EyeOff,
  Loader2,
  Bell,
  Shield,
  User,
  Smartphone } from 'lucide-react';
import { COLLECTIONS } from '@/lib/collections';

interface DriverSettings {
  notifications: {
    newOrders: boolean;
    statusUpdates: boolean;
    paymentAlerts: boolean;
    systemUpdates: boolean;
  };
  privacy: {
    profileVisible: boolean;
    locationSharing: boolean;
  };
  workPreferences: {
    autoAcceptOrders: boolean;
    workingHours: {
      start: string;
      end: string;
    };
  };
}

import withAuth from "@/components/auth/withAuth";
import { useAuth } from '@/hooks/useAuth';

function DriverSettingsPage() {
  const { user } = useAuth();
  const [driverData, setDriverData] = useState<any>(null);
  const [settings, setSettings] = useState<DriverSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const { toast } = useToast();

  useEffect(() => {
    const fetchDriverData = async (uid: string) => {
      try {
        const driverDocRef = doc(db, COLLECTIONS.DRIVERS, uid);
        const driverDocSnap = await getDoc(driverDocRef);

        if (driverDocSnap.exists()) {
          const data = driverDocSnap.data();
          setDriverData(data);

          const defaultSettings: DriverSettings = {
            notifications: { newOrders: true, statusUpdates: true, paymentAlerts: true, systemUpdates: false },
            privacy: { profileVisible: true, locationSharing: true },
            workPreferences: { autoAcceptOrders: false, workingHours: { start: '08:00', end: '20:00' } }
          };
          setSettings(data.settings || defaultSettings);
        }
      } catch (error) {
        console.error("Error fetching driver data:", error);
        toast({ variant: "destructive", title: "Error", description: "No se pudo cargar la configuración" });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
        fetchDriverData(user.uid);
    }
  }, [user, toast]);

  const saveSettings = async () => {
    if (!user || !settings) return;

    setIsSaving(true);
    try {
      const driverDocRef = doc(db, COLLECTIONS.DRIVERS, user.uid);
      await updateDoc(driverDocRef, {
        settings: settings,
        updatedAt: new Date()
      });

      toast({
        title: "Configuración guardada",
        description: "Tus preferencias han sido actualizadas correctamente"
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar la configuración"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const changePassword = async () => {
    if (!user) return;
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ variant: "destructive", title: "Error", description: "Las contraseñas no coinciden" });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast({ variant: "destructive", title: "Error", description: "La nueva contraseña debe tener al menos 6 caracteres" });
      return;
    }
    try {
      const credential = EmailAuthProvider.credential(user.email!, passwordData.currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, passwordData.newPassword);
      toast({ title: "Contraseña actualizada", description: "Tu contraseña ha sido cambiada exitosamente" });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordChange(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo cambiar la contraseña" });
    }
  };

  const updateSetting = (section: keyof DriverSettings, key: string, value: any) => {
    if (!settings) return;
    
    setSettings(prev => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [key]: value
      }
    }));
  };

  const updateNestedSetting = (section: keyof DriverSettings, subsection: string, key: string, value: any) => {
    if (!settings) return;
    
    setSettings(prev => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [subsection]: {
          ...(prev![section] as any)[subsection],
          [key]: value
        }
      }
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user || !driverData || !settings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">No se encontró información del conductor</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={isSaving} className="gap-2">
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Guardar Cambios
        </Button>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Información de Perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nombre Completo</Label>
              <Input value={driverData.fullName || ''} disabled />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={user.email || ''} disabled />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input value={driverData.phone || ''} disabled />
            </div>
            <div>
              <Label>Estado</Label>
              <Input value={driverData.status || ''} disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Notificaciones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Nuevas órdenes</Label>
              <p className="text-sm text-muted-foreground">Recibir notificaciones de nuevos pedidos</p>
            </div>
            <Switch
              checked={settings.notifications.newOrders}
              onCheckedChange={(checked) => updateSetting('notifications', 'newOrders', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Actualizaciones de estado</Label>
              <p className="text-sm text-muted-foreground">Notificaciones sobre cambios en el estado de pedidos</p>
            </div>
            <Switch
              checked={settings.notifications.statusUpdates}
              onCheckedChange={(checked) => updateSetting('notifications', 'statusUpdates', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Alertas de pago</Label>
              <p className="text-sm text-muted-foreground">Notificaciones sobre pagos y billetera</p>
            </div>
            <Switch
              checked={settings.notifications.paymentAlerts}
              onCheckedChange={(checked) => updateSetting('notifications', 'paymentAlerts', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Actualizaciones del sistema</Label>
              <p className="text-sm text-muted-foreground">Noticias y actualizaciones de la plataforma</p>
            </div>
            <Switch
              checked={settings.notifications.systemUpdates}
              onCheckedChange={(checked) => updateSetting('notifications', 'systemUpdates', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Privacidad
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Perfil visible</Label>
              <p className="text-sm text-muted-foreground">Permitir que otros usuarios vean tu perfil</p>
            </div>
            <Switch
              checked={settings.privacy.profileVisible}
              onCheckedChange={(checked) => updateSetting('privacy', 'profileVisible', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Compartir ubicación</Label>
              <p className="text-sm text-muted-foreground">Permitir el seguimiento de ubicación durante entregas</p>
            </div>
            <Switch
              checked={settings.privacy.locationSharing}
              onCheckedChange={(checked) => updateSetting('privacy', 'locationSharing', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Work Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Preferencias de Trabajo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-aceptar órdenes</Label>
              <p className="text-sm text-muted-foreground">Aceptar automáticamente nuevos pedidos</p>
            </div>
            <Switch
              checked={settings.workPreferences.autoAcceptOrders}
              onCheckedChange={(checked) => updateSetting('workPreferences', 'autoAcceptOrders', checked)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Hora de inicio</Label>
              <Input
                type="time"
                value={settings.workPreferences.workingHours.start}
                onChange={(e) => updateNestedSetting('workPreferences', 'workingHours', 'start', e.target.value)}
              />
            </div>
            <div>
              <Label>Hora de fin</Label>
              <Input
                type="time"
                value={settings.workPreferences.workingHours.end}
                onChange={(e) => updateNestedSetting('workPreferences', 'workingHours', 'end', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Seguridad
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            onClick={() => setShowPasswordChange(!showPasswordChange)}
          >
            Cambiar Contraseña
          </Button>

          {showPasswordChange && (
            <div className="space-y-4 p-4 border rounded-lg">
              <div>
                <Label>Contraseña actual</Label>
                <div className="relative">
                  <Input
                    type={showPasswords.current ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                  >
                    {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label>Nueva contraseña</Label>
                <div className="relative">
                  <Input
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                  >
                    {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label>Confirmar nueva contraseña</Label>
                <div className="relative">
                  <Input
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                  >
                    {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={changePassword}>Cambiar Contraseña</Button>
                <Button variant="outline" onClick={() => setShowPasswordChange(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default withAuth(DriverSettingsPage, {
    role: 'DRIVER',
    redirectTo: '/repartidores/login',
});
