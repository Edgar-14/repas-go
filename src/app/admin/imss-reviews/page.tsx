'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, addDoc, writeBatch } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { COLLECTIONS } from '@/lib/collections';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function IMSSReviewsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadPendingIMSSReviews = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, COLLECTIONS.DRIVERS), 
        where("status", "==", "PENDING_IMSS_REVIEW")
      );
      const querySnapshot = await getDocs(q);
      const reviews = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPendingReviews(reviews);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error al cargar revisiones', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingIMSSReviews();
  }, []);

  const approveIMSS = async (driverId: string) => {
    if (!user) return;
    setUpdatingId(driverId);
    try {
      const batch = writeBatch(db);
      
      const driverRef = doc(db, "drivers", driverId);
      batch.update(driverRef, {
        status: 'ALTA_PROVISIONAL',
        'documentsStatus.imssAlta': 'APPROVED',
        imssApprovedAt: serverTimestamp(),
        imssApprovedBy: user.uid
      });

      const functions = getFunctions();
      const setClaims = httpsCallable(functions, 'setCustomUserClaims');
      await setClaims({ userId: driverId, claims: { role: 'DRIVER', requiresIMSS: false } });

      const notificationRef = doc(collection(db, "notifications"));
      batch.set(notificationRef, {
        userId: driverId,
        type: 'IMSS_APPROVED',
        title: '¡Tu alta del IMSS fue aprobada!',
        message: 'Ya puedes empezar a recibir pedidos. Recuerda completar el resto de tu documentación.',
        createdAt: serverTimestamp(),
        read: false
      });
      
      await batch.commit();
      
      toast({ title: 'Alta del IMSS aprobada' });
      loadPendingIMSSReviews();
      
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error al aprobar', description: error.message });
    } finally {
      setUpdatingId(null);
    }
  }

  const rejectIMSS = async (driverId: string) => {
    if (!user) return;
    setUpdatingId(driverId);
    // Logic to reject, e.g., set status back to PENDING_IMSS and notify user
    // This part should be implemented with a dialog to ask for rejection reason
    toast({ title: 'Funcionalidad de Rechazo Pendiente' });
    setUpdatingId(null);
  }

  return (
    <MainLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">
          Revisión Urgente - Altas del IMSS
        </h1>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">
            <strong>IMPORTANTE:</strong> Estos conductores NO pueden trabajar hasta aprobar su IMSS.
            Prioridad de revisión: 24-48 horas máximo.
          </p>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : pendingReviews.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <p className="mt-4 text-lg">No hay revisiones pendientes.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {pendingReviews.map(driver => (
              <Card key={driver.id}>
                <CardContent className="p-4">
                  <div className="flex flex-wrap justify-between items-center gap-4">
                    <div>
                      <h3 className="font-semibold">{driver.name}</h3>
                      <p className="text-sm text-gray-600">{driver.email}</p>
                      <p className="text-sm text-red-600">
                        Esperando desde: {driver.imssUploadedAt ? format(driver.imssUploadedAt.toDate(), 'dd/MM/yyyy HH:mm') : 'N/A'}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => window.open(driver.imssDocumentUrl, '_blank')}
                        variant="outline"
                        disabled={!driver.imssDocumentUrl}
                      >
                        Ver Documento
                      </Button>
                      <Button
                        onClick={() => approveIMSS(driver.id)}
                        className="bg-green-600 hover:bg-green-700"
                        disabled={updatingId === driver.id}
                      >
                        {updatingId === driver.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                        Aprobar
                      </Button>
                      <Button
                        onClick={() => rejectIMSS(driver.id)}
                        variant="destructive"
                        disabled={updatingId === driver.id}
                      >
                        Rechazar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
