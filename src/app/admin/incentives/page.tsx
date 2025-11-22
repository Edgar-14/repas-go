'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, Target, DollarSign, Users, Loader2 } from 'lucide-react';
import { withAuth } from '@/components/auth/withAuth';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Section, PageToolbar } from '@/components/layout/primitives';
// // Firebase Functions imports removed - not needed in frontend
// Removed - not needed in frontend
// --- Tipos ---
interface Incentive {
  id: string;
  name: string;
  description: string;
  amount: number;
  status: 'active' | 'paused' | 'archived';
  participants: number;
}

function IncentivesPage() {
  const { toast } = useToast();
  const [incentives, setIncentives] = useState<Incentive[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "incentives"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const incentivesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Incentive));
      setIncentives(incentivesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching incentives: ", error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los incentivos.' });
      setLoading(false);
    });
    return () => unsubscribe();
  }, [toast]);

  const stats = useMemo(() => {
    return {
      activeCount: incentives.filter(i => i.status === 'active').length,
      totalAwarded: incentives.reduce((sum, i) => sum + (i.amount * i.participants), 0), // Simplified calculation
      totalParticipants: incentives.reduce((sum, i) => sum + i.participants, 0),
    };
  }, [incentives]);

  const handleCreate = () => {
    // Redirigir a página de creación de incentivos
    window.location.href = '/admin/incentives/create';
  };

  const handleEdit = (incentiveId: string) => {
    window.location.href = `/admin/incentives/${incentiveId}/edit`;
  };

  const handleViewDetails = (incentiveId: string) => {
    window.location.href = `/admin/incentives/${incentiveId}`;
  };

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* UI Universal: Section + PageToolbar */}
      <Section>
        <PageToolbar
          left={
            <div className="text-sm text-muted-foreground">
              Gestiona incentivos y bonificaciones para conductores
            </div>
          }
          right={
            <Button onClick={handleCreate} size="sm">
              <Gift />
              Crear Incentivo
            </Button>
          }
        />
      </Section>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incentivos Activos</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Otorgado (Estimado)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalAwarded.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participantes Totales</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalParticipants}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Incentivos Configurados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {incentives.length > 0 ? incentives.map((incentive) => (
              <div key={incentive.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <h3 className="font-medium">{incentive.name}</h3>
                  <p className="text-sm text-muted-foreground">{incentive.description}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={incentive.status === 'active' ? 'default' : 'secondary'}>{incentive.status}</Badge>
                    <span className="text-sm text-muted-foreground">{incentive.participants} participantes</span>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div className="text-lg font-bold text-green-600">${incentive.amount.toLocaleString()}</div>
                  <div className="space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(incentive.id)}>Editar</Button>
                    <Button variant="outline" size="sm" onClick={() => handleViewDetails(incentive.id)}>Ver Detalles</Button>
                  </div>
                </div>
              </div>
            )) : <p className="text-center text-muted-foreground py-8">No hay incentivos configurados.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default withAuth(IncentivesPage, {
  requiredRoles: ['ADMIN', 'SUPER_ADMIN', 'CONTADORA'],
});
