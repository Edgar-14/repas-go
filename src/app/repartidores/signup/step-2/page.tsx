'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { uploadFileWithMetadata } from '@/lib/storage';

interface UploadedDocumentMeta {
  storagePath: string;
  downloadURL: string;
  uploadedAt: string;
  originalName: string;
}

const REQUIRED_DOCS: Record<string, string> = {
  ine_front: 'INE/Credencial - Frente',
  ine_back: 'INE/Credencial - Reverso',
  proof_address: 'Comprobante de Domicilio',
  fiscal_document: 'Constancia Fiscal',
  driver_license: 'Licencia de Conducir',
};

const OPTIONAL_DOCS: Record<string, string> = {
  vehicle_registration: 'Tarjeta de Circulación',
};

export default function SignupStep2() {
  const router = useRouter();
  const { toast } = useToast();
  const [signupData, setSignupData] = useState<Record<string, any> | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, UploadedDocumentMeta>>({});
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const verified = localStorage.getItem('driverVerified');
    if (verified !== 'true') {
      router.replace('/repartidores/signup');
      return;
    }

    const savedRaw = localStorage.getItem('signupData');
    if (!savedRaw) {
      router.replace('/repartidores/signup');
      return;
    }

    try {
      const saved = JSON.parse(savedRaw);
      if (!saved.email) {
        router.replace('/repartidores/signup');
        return;
      }
      setSignupData(saved);
      // CORRECCIÓN: Se usa el nombre de clave consistente 'uploadedDocuments' que se guardará al final.
      if (saved.uploadedDocuments) {
        setUploadedDocs(saved.uploadedDocuments);
      }
    } catch (error) {
      console.error('Error parsing signupData at step-2:', error);
      router.replace('/repartidores/signup');
    }
  }, [router]);
  
  // CORRECCIÓN: Se elimina el `useEffect` que intentaba sincronizar y guardar los datos automáticamente.
  // Esta era una fuente principal de corrupción de datos. El guardado se centraliza en `handleNext`.

  const handleFileChange = async (field: string, file: File | null) => {
    // Se mantiene el email en el estado `signupData` para la validación.
    if (!signupData?.email) {
      toast({
        variant: 'destructive',
        title: 'Sesión inválida',
        description: 'Vuelve a iniciar tu registro.',
      });
      router.replace('/repartidores/signup');
      return;
    }

    if (!file) {
      const updated = { ...uploadedDocs };
      delete updated[field];
      setUploadedDocs(updated);
      toast({ title: 'Documento eliminado', description: 'Selecciona un nuevo archivo si deseas reemplazarlo.' });
      return;
    }

    setUploading(field);
    try {
      const path = `driver-applications/${signupData.email}/${field}`; // Ruta más específica
      const metadata = await uploadFileWithMetadata(file, path);
      const newMeta: UploadedDocumentMeta = {
        storagePath: metadata.storagePath,
        downloadURL: metadata.downloadURL,
        uploadedAt: new Date().toISOString(),
        originalName: file.name,
      };
      // Solo actualizamos el estado local. No se toca localStorage aquí.
      setUploadedDocs((prev) => ({ ...prev, [field]: newMeta }));

      toast({
        title: 'Documento subido',
        description: `${file.name} se subió correctamente`,
      });
    } catch (error: any) {
      console.error('Error uploading document:', error);

      let errorMessage = 'No se pudo subir el archivo';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message;
        } else if ('code' in error && typeof error.code === 'string') {
          switch (error.code) {
            case 'storage/unauthorized':
              errorMessage = 'No tienes permisos para subir archivos. Verifica tu autenticación.';
              break;
            case 'storage/quota-exceeded':
              errorMessage = 'Se ha excedido el límite de almacenamiento. Contacta al soporte.';
              break;
            case 'storage/retry-limit-exceeded':
              errorMessage = 'Error de conexión. Verifica tu conexión e intenta de nuevo.';
              break;
            default:
              errorMessage = `Error de almacenamiento: ${error.code}`;
          }
        }
      }

      toast({
        variant: 'destructive',
        title: 'Error al subir documento',
        description: errorMessage,
      });
    } finally {
      setUploading(null);
    }
  };

  const missingRequiredDocs = useMemo(
    () => Object.keys(REQUIRED_DOCS).filter((key) => !uploadedDocs[key as keyof typeof uploadedDocs]),
    [uploadedDocs],
  );

  const handleNext = async () => {
    if (missingRequiredDocs.length > 0) {
      toast({
        title: 'Documentos requeridos',
        description: `Por favor sube los siguientes documentos: ${missingRequiredDocs.map(docKey => REQUIRED_DOCS[docKey]).join(', ')}.`,
        variant: 'destructive',
      });
      return;
    }
    
    // CORRECCIÓN: Lógica de guardado explícita y segura antes de navegar.
    try {
        const existingRaw = localStorage.getItem('signupData');
        const existing = existingRaw ? JSON.parse(existingRaw) : {};

        // Creamos el nuevo objeto de datos combinando lo existente con los documentos subidos.
        const updatedSignupData = {
            ...existing,
            uploadedDocuments: uploadedDocs, // Añadimos los documentos de forma estructurada.
        };

        // Guardamos el objeto completo y correcto en localStorage.
        localStorage.setItem('signupData', JSON.stringify(updatedSignupData));

        // Guardamos el borrador en Firestore.
        if (updatedSignupData.email && db) {
            await setDoc(doc(db, 'driverRegistrationDrafts', updatedSignupData.email), {
                documents: uploadedDocs,
                step: 2,
                updatedAt: serverTimestamp(),
            }, { merge: true });
        }

    } catch (error) {
        console.error("Error guardando los datos de los documentos:", error);
        toast({
            title: "Error al guardar",
            description: "No se pudieron guardar tus documentos. Inténtalo de nuevo.",
            variant: "destructive"
        });
        return; // Detenemos la navegación si hay error.
    }

    router.push('/repartidores/signup/step-3');
  };

  if (!signupData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl shadow-[15px_15px_30px_#bebebe,-15px_-15px_30px_#ffffff] border-0">
        <CardHeader className="text-center pb-8">
          <div className="flex flex-col items-center space-y-6 mb-8">
            <Image
              src="/logo-befast-repartidores.svg"
              alt="BeFast Repartidores"
              width={80}
              height={30}
            />
            <h1 className="text-2xl font-bold text-emerald-800">Registro de Repartidor BeFast</h1>
          </div>
          <div className="flex flex-col items-center space-y-4 mb-8">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">✓</div>
              <div className="w-12 h-1 bg-emerald-600 rounded flex-shrink-0"></div>
              <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">2</div>
              <div className="w-12 h-1 bg-gray-300 rounded flex-shrink-0"></div>
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm flex-shrink-0">3</div>
              <div className="w-12 h-1 bg-gray-300 rounded flex-shrink-0"></div>
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm flex-shrink-0">4</div>
            </div>
            <p className="text-gray-700 text-base font-medium">Paso 2 de 4: Documentación Legal</p>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-800 text-center">Carga tus Documentos Oficiales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(REQUIRED_DOCS).map(([key, label]) => (
                <div key={key} className="space-y-3">
                  <Label className="text-base font-medium">{label} *</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange(key, e.target.files?.[0] ?? null)}
                      className="text-sm"
                      disabled={uploading === key}
                    />
                    {uploading === key && <Loader2 className="w-4 h-4 animate-spin" />}
                    {uploadedDocs[key] && <CheckCircle className="w-4 h-4 text-green-600" />}
                  </div>
                  {uploadedDocs[key] && (
                    <p className="text-xs text-gray-500">{uploadedDocs[key].originalName}</p>
                  )}
                </div>
              ))}

              {Object.entries(OPTIONAL_DOCS).map(([key, label]) => (
                <div key={key} className="space-y-3">
                  <Label className="text-base font-medium">{label}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange(key, e.target.files?.[0] ?? null)}
                      className="text-sm"
                      disabled={uploading === key}
                    />
                    {uploading === key && <Loader2 className="w-4 h-4 animate-spin" />}
                    {uploadedDocs[key] && <CheckCircle className="w-4 h-4 text-green-600" />}
                  </div>
                  {uploadedDocs[key] && (
                    <p className="text-xs text-gray-500">{uploadedDocs[key].originalName}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between pt-6">
            <Link href="/repartidores/signup/step-1">
              <Button variant="outline" className="px-8">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Anterior
              </Button>
            </Link>
            <Button
              onClick={handleNext}
              className="px-8 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
              disabled={uploading !== null || missingRequiredDocs.length > 0}
            >
              {uploading ? 'Subiendo archivo...' : (missingRequiredDocs.length > 0 ? 'Sube los documentos faltantes' : 'Continuar')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}