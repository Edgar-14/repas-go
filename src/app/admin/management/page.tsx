'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, Plus, Edit, Trash2, Shield, ShieldCheck, 
  Crown, Calculator, UserCheck, AlertTriangle, 
  Mail, Calendar, Activity, Lock, Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc, 
  deleteDoc,
  Timestamp 
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { COLLECTIONS } from '@/lib/collections';
import { app } from '@/lib/firebase';
import withAuth from '@/components/auth/withAuth';
import { Section, PageToolbar } from '@/components/layout/primitives';
// // Firebase Functions imports removed - not needed in frontend
// Removed - not needed in frontend
interface AdminUser {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'CONTADORA';
  isActive: boolean;
  permissions: string[];
  createdAt: Timestamp;
  lastLoginAt?: Timestamp;
  createdBy: string;
  department?: string;
  notes?: string;
}

const ROLE_DEFINITIONS = {
  SUPER_ADMIN: {
    label: 'Super Administrador',
    color: 'bg-purple-100 text-purple-800',
    icon: Crown,
    permissions: [
      'system.full_access',
      'users.manage_admins',
      'finance.full_access',
      'reports.all',
      'config.system_settings'
    ],
    description: 'Acceso completo al sistema, puede gestionar otros administradores'
  },
  ADMIN: {
    label: 'Administrador',
    color: 'bg-blue-100 text-blue-800',
    icon: Shield,
    permissions: [
      'drivers.manage',
      'businesses.manage',
      'orders.manage',
      'support.manage',
      'reports.operational'
    ],
    description: 'Gestión operativa completa, no puede crear otros administradores'
  },
  CONTADORA: {
    label: 'Contador(a)',
    color: 'bg-green-100 text-green-800',
    icon: Calculator,
    permissions: [
      'payroll.manage',
      'finance.view',
      'reports.financial',
      'businesses.billing'
    ],
    description: 'Gestión financiera y contable, nóminas y reportes'
  }
};

function AdminManagementPage() {
  const { user, claims } = useAuth();
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    role: 'ADMIN' as AdminUser['role'],
    department: '',
    notes: '',
    isActive: true
  });

  // Verificar que el usuario actual es SUPER_ADMIN
  const [canManageAdmins, setCanManageAdmins] = useState(false);

  useEffect(() => {
    if (claims?.role === 'SUPER_ADMIN') {
      setCanManageAdmins(true);
    }
  }, [claims]);

  // Cargar lista de administradores
  useEffect(() => {
    const adminQuery = query(
      collection(db, 'users'),
      where('role', 'in', ['SUPER_ADMIN', 'ADMIN', 'CONTADORA'])
    );

    const unsubscribe = onSnapshot(adminQuery, (snapshot) => {
      const admins = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AdminUser[];
      
      setAdminUsers(admins.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds));
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCreateAdmin = async () => {
    if (!canManageAdmins) {
      toast.error('No tienes permisos para crear administradores');
      return;
    }

    setIsSubmitting(true);
    try {
      const functions = getFunctions(app);
      const createAdminUser = httpsCallable(functions, 'createAdminUser');
      
      await createAdminUser({
        ...formData,
        createdBy: user?.uid,
        permissions: ROLE_DEFINITIONS[formData.role].permissions
      });

      toast.success('Administrador creado exitosamente');
      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error creating admin:', error);
      toast.error('Error al crear administrador');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAdmin = async () => {
    if (!editingUser || !canManageAdmins) return;

    setIsSubmitting(true);
    try {
      const userRef = doc(db, COLLECTIONS.USERS, editingUser.id);
      await updateDoc(userRef, {
        displayName: formData.displayName,
        role: formData.role,
        department: formData.department,
        notes: formData.notes,
        isActive: formData.isActive,
        permissions: ROLE_DEFINITIONS[formData.role].permissions,
        updatedAt: Timestamp.now(),
        updatedBy: user?.uid
      });

      toast.success('Administrador actualizado exitosamente');
      setShowEditDialog(false);
      setEditingUser(null);
      resetForm();
    } catch (error) {
      console.error('Error updating admin:', error);
      toast.error('Error al actualizar administrador');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (adminUser: AdminUser) => {
    if (!canManageAdmins || adminUser.role === 'SUPER_ADMIN') return;

    try {
      const userRef = doc(db, COLLECTIONS.USERS, adminUser.id);
      await updateDoc(userRef, {
        isActive: !adminUser.isActive,
        updatedAt: Timestamp.now(),
        updatedBy: user?.uid
      });

      toast.success(
        `Administrador ${!adminUser.isActive ? 'activado' : 'desactivado'} exitosamente`
      );
    } catch (error) {
      console.error('Error toggling admin status:', error);
      toast.error('Error al cambiar estado del administrador');
    }
  };

  const openEditDialog = (adminUser: AdminUser) => {
    setEditingUser(adminUser);
    setFormData({
      email: adminUser.email,
      displayName: adminUser.displayName,
      role: adminUser.role,
      department: adminUser.department || '',
      notes: adminUser.notes || '',
      isActive: adminUser.isActive
    });
    setShowEditDialog(true);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      displayName: '',
      role: 'ADMIN',
      department: '',
      notes: '',
      isActive: true
    });
  };

  const formatLastLogin = (timestamp?: Timestamp) => {
    if (!timestamp) return 'Nunca';
    
    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    
    return date.toLocaleDateString('es-MX');
  };

  if (!canManageAdmins) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Lock className="w-16 h-16 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Acceso Restringido</h2>
            <p className="text-gray-600 text-center">
              Solo los Super Administradores pueden gestionar otros administradores.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* UI Universal: Section + PageToolbar */}
      <Section>
        <PageToolbar
          left={
            <div className="text-sm text-muted-foreground">
              Crea, edita y gestiona los usuarios con acceso administrativo
            </div>
          }
          right={
            canManageAdmins && (
              <Button onClick={() => { resetForm(); setShowCreateDialog(true); }} size="sm">
                <Plus /> Crear Administrador
              </Button>
            )
          }
        />
      </Section>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Último Acceso</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adminUsers.map((admin) => {
                const roleInfo = ROLE_DEFINITIONS[admin.role];
                const RoleIcon = roleInfo.icon;
                return (
                  <TableRow key={admin.id}>
                    <TableCell>
                      <div className="font-medium">{admin.displayName}</div>
                      <div className="text-sm text-muted-foreground">{admin.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={roleInfo.color}>
                        <RoleIcon className="mr-2 h-4 w-4" /> {roleInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={admin.isActive ? 'default' : 'destructive'}>
                        {admin.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatLastLogin(admin.lastLoginAt)}</TableCell>
                    <TableCell className="text-right">
                      {canManageAdmins && (
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(admin)}><Edit className="h-4 w-4" /></Button>
                          <Switch checked={admin.isActive} onCheckedChange={() => handleToggleStatus(admin)} disabled={admin.role === 'SUPER_ADMIN'} />
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog || showEditDialog} onOpenChange={showCreateDialog ? () => {setShowCreateDialog(false); resetForm();} : () => {setShowEditDialog(false); resetForm();}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Editar' : 'Crear'} Administrador</DialogTitle>
            <DialogDescription>
              {editingUser ? 'Modifica los detalles de este administrador.' : 'Completa el formulario para crear un nuevo administrador.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="displayName">Nombre Completo</Label>
              <Input id="displayName" value={formData.displayName} onChange={(e) => setFormData({...formData, displayName: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} disabled={!!editingUser} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Rol</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value as AdminUser['role']})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_DEFINITIONS).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground p-2 rounded-md bg-muted">{ROLE_DEFINITIONS[formData.role].description}</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="department">Departamento (Opcional)</Label>
              <Input id="department" value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notas (Opcional)</Label>
              <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => editingUser ? setShowEditDialog(false) : setShowCreateDialog(false)}>Cancelar</Button>
            <Button onClick={editingUser ? handleUpdateAdmin : handleCreateAdmin} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (editingUser ? 'Guardar Cambios' : 'Crear Administrador')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default withAuth(AdminManagementPage, {
  requiredRoles: ['SUPER_ADMIN'],
});
