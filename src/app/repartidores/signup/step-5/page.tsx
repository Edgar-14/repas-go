'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// CORRECCIÓN: Se elimina la referencia a 'training'.
interface ApplicationPayload {
  email: string;
  uid?: string | null;
  fullName: string;
  phone: string;
  curp: string;
  rfc: string;
  address: string;
  vehicleInfo: Record<string, unknown>;
  bankInfo: Record<string, unknown>;
  documents: Record<string, unknown>;
  legal: Record<string, unknown> | null;
}

export default function SignupStep5() {
  const router = useRouter();
  const { toast } = useToast();
  const [applicationData, setApplicationData] = useState<ApplicationPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const submitApplication = async () => {
      if (typeof window === 'undefined') return;

      const verified = localStorage.getItem('driverVerified');
      if (verified !== 'true') {
        router.replace('/repartidores/signup');
        return;
      }

      const signupRaw = localStorage.getItem('signupData');
      if (!signupRaw) {
        router.replace('/repartidores/signup');
        return;
      }

      let data: any;
      try {
        data = JSON.parse(signupRaw);
      } catch (error) {
        console.error('Error parsing signupData at step-5:', error);
        router.replace('/repartidores/signup');
        return;
      }

      // CORRECCIÓN: Se leen los datos de la estructura anidada y limpia, que es la fuente de verdad.
      // Esto previene el error de "datos incompletos" causado por la corrupción de datos.
      const email = data.email ?? '';
      const fullName = data.personalData?.fullName ?? '';
      const phone = data.personalData?.phone ?? '';
      const curp = data.personalData?.curp ?? '';
      const rfc = data.personalData?.rfc ?? '';
      const vehicleInfo = data.vehicle ?? {};
      const bankInfo = data.bank ?? {};
      const documents = data.uploadedDocuments ?? {};
      const legal = data.legal ?? null;
      
      // La validación principal asegura que la información crítica del registro exista.
      if (!email || !fullName || !phone || !curp) {
        toast({
          title: 'Datos incompletos',
          description: 'Faltan datos obligatorios. Por favor, completa todos los pasos desde el inicio.',
          variant: 'destructive',
        });
        router.replace('/repartidores/signup/step-1');
        return;
      }

      const payload: ApplicationPayload = {
        email,
        uid: data.uid ?? null,
        fullName,
        phone,
        curp,
        rfc,
        address: data.address ?? '', // Asumiendo que la dirección es opcional o no se pide.
        vehicleInfo,
        bankInfo,
        documents,
        legal,
      };

      try {
        const { getFunctions, httpsCallable } = await import('firebase/functions');
        const { app } = await import('@/lib/firebase');
        const functions = getFunctions(app);
        const submitDriverApplication = httpsCallable(functions, 'submitDriverApplication');

        const result = await submitDriverApplication({ driverData: payload });
        const responseData = result.data as any;

        if (!responseData?.success) {
          throw new Error(responseData?.message || 'Error al enviar la solicitud');
        }

        setApplicationData(payload);
        
        if (data.email && db) {
          await setDoc(
            doc(db, 'driverRegistrationDrafts', data.email),
            {
              step: 5, // Marca el paso final como completado
              applicationSubmitted: true,
              submittedAt: serverTimestamp(),
              applicationId: responseData.applicationId,
            },
            { merge: true },
          );
        }

        localStorage.removeItem('signupData'); // Limpiamos los datos locales al finalizar.
        toast({
          title: 'Solicitud enviada exitosamente',
          description: 'Tu aplicación está siendo revisada por nuestro equipo.',
        });
      } catch (error: any) {
        console.error(' Error submitting application:', error);
        const message = error?.message ?? '';

        // Manejo de error si la solicitud ya existe
        if (message.toLowerCase().includes('already')) {
          setApplicationData(payload);
          localStorage.removeItem('signupData');
          toast({
            title: 'Solicitud ya enviada',
            description: 'Tu solicitud ya fue registrada anteriormente.',
          });
          return; // No redirige, solo muestra el estado.
        }

        toast({
          variant: 'destructive',
          title: 'Error al enviar solicitud',
          description: message || 'No se pudo enviar tu solicitud. Por favor intenta nuevamente desde el paso anterior.',
        });
        router.replace('/repartidores/signup/step-3');
      } finally {
          setLoading(false);
      }
    };

    submitApplication();
  }, [router, toast]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Enviando y finalizando tu solicitud...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <Image
            src="/logo-befast-repartidores.svg"
            alt="BeFast Repartidores"
            width={80}
            height={30}
            className="mx-auto mb-4"
          />
          <h1 className="text-2xl sm:text-3xl font-bold text-emerald-800 mb-2">¡Solicitud Enviada Exitosamente!</h1>
          <p className="text-gray-700 text-sm sm:text-base">
            Tu aplicación para ser repartidor de BeFast ha sido recibida y está en revisión.
          </p>
        </div>

        {/* CORRECCIÓN: Se ajusta la barra de progreso a 4 pasos. */}
        <div className="mb-8">
          <Progress value={100} className="h-3" />
          <div className="flex justify-between text-xs text-gray-600 mt-2">
            <span>Paso 1: Información</span>
            <span>Paso 2: Documentos</span>
            <span>Paso 3: Contratos</span>
            <span className="font-semibold text-emerald-600">Paso 4: ¡Completado!</span>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="text-green-600 flex-shrink-0" style={{ width: '2.5rem', height: '2.5rem' }} />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-green-800">Solicitud Recibida</h2>
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                PENDIENTE DE REVISIÓN
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center text-sm text-green-700">
                <p className="mb-2">
                  <strong>Tiempo estimado de respuesta:</strong>
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Calendar className="flex-shrink-0" />
                  <span className="font-semibold">3-5 días hábiles</span>
                </div>
              </div>

              <div className="border-t border-green-200 pt-4">
                <h3 className="font-medium text-green-800 mb-2">¿Qué sigue ahora?</h3>
                {/* CORRECCIÓN: Se elimina la referencia a capacitación. */}
                <ul className="text-sm text-green-700 space-y-1">
                  <li>Nuestro equipo revisará tu información</li>
                  <li>Validaremos tus documentos</li>
                  <li>Te notificaremos la decisión final por correo</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Clock className="text-blue-600 flex-shrink-0" />
                Mientras Esperas
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">Prepárate para trabajar</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>Mantén tus documentos a la mano</li>
                  <li>Revisa que tu vehículo esté en buen estado</li>
                  <li>Asegúrate de tener una mochila térmica</li>
                  <li>Familiarízate con las zonas de tu ciudad</li>
                </ul>
              </div>

              <div className="bg-amber-50 p-4 rounded-lg">
                <h3 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                  <AlertCircle className="flex-shrink-0" />
                  Importante
                </h3>
                <p className="text-sm text-amber-700">
                  Recibirás un correo electrónico con el resultado de tu solicitud.
                  Asegúrate de revisar tu bandeja de entrada y spam.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {applicationData && (
          <Card className="mt-6">
            <CardHeader>
              <h2 className="text-xl font-semibold">Resumen de tu Solicitud</h2>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-medium text-gray-800 mb-2">Información Personal</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Nombre:</strong> {applicationData.fullName}</p>
                    <p><strong>Email:</strong> {applicationData.email}</p>
                    <p><strong>Teléfono:</strong> {applicationData.phone}</p>
                    <p><strong>Vehículo:</strong> {(applicationData.vehicleInfo?.type as string) || 'No especificado'}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-800 mb-2">Estado de Documentos</h3>
                  <div className="space-y-2">
                    {Object.keys(applicationData.documents || {}).length > 0 ? Object.keys(applicationData.documents).map((docType) => (
                      <div key={docType} className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm capitalize">{docType.replace(/_/g, ' ')}</span>
                        <Badge variant="outline" className="text-xs">Enviado</Badge>
                      </div>
                    )) : <p className="text-sm text-gray-500">No se subieron documentos opcionales.</p>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between items-center mt-8">
          <Link href="/repartidores/login">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="flex-shrink-0" />
              Ir a Iniciar Sesión
            </Button>
          </Link>

          <Button onClick={() => router.push('/')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            Volver al Inicio
          </Button>
        </div>
      </div>
    </div>
  );
}