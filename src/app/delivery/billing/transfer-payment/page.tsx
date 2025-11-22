'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Building2,
  CreditCard
} from 'lucide-react';
import Link from 'next/link';
// // Firebase Functions imports removed - not needed in frontend
// Removed - not needed in frontend
// Firebase
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';

export default function TransferPaymentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [transferDetails, setTransferDetails] = useState({
    amount: '',
    reference: '',
    bank: '',
    notes: ''
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          variant: 'destructive',
          title: 'Tipo de archivo no válido',
          description: 'Solo se permiten archivos JPG, PNG o PDF.',
        });
        return;
      }
      
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'Archivo muy grande',
          description: 'El archivo no puede ser mayor a 5MB.',
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast({
        variant: 'destructive',
        title: 'Archivo requerido',
        description: 'Debes subir el comprobante de transferencia.',
      });
      return;
    }

    if (!transferDetails.amount || !transferDetails.reference) {
      toast({
        variant: 'destructive',
        title: 'Datos incompletos',
        description: 'Debes llenar el monto y la referencia de la transferencia.',
      });
      return;
    }

    setUploading(true);
    
    try {
      // Crear FormData para subir archivo
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('businessId', user!.uid);
      formData.append('transferDetails', JSON.stringify(transferDetails));

      // Subir archivo a Firebase Storage
      const uploadResponse = await fetch('/api/upload/receipt', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Error al subir el archivo');
      }

      const { fileUrl } = await uploadResponse.json();

      // Crear solicitud de pago en Firestore
      await addDoc(collection(db, 'creditPurchaseRequests'), {
        businessId: user!.uid,
        transferDetails: {
          amount: parseFloat(transferDetails.amount),
          reference: transferDetails.reference,
          bank: transferDetails.bank,
          notes: transferDetails.notes,
          receiptUrl: fileUrl,
          uploadedAt: new Date()
        },
        status: 'PENDING_VERIFICATION',
        requestDate: new Date(),
        createdAt: new Date()
      });

      toast({
        title: "Comprobante enviado",
        description: "Tu comprobante ha sido enviado para verificación. Te notificaremos cuando sea procesado.",
      });

      router.push('/delivery/billing');
      
    } catch (error: any) {
      console.error('Error uploading receipt:', error);
      toast({
        variant: 'destructive',
        title: 'Error al enviar comprobante',
        description: error.message || 'No se pudo procesar tu comprobante.',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/delivery/billing">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Subir Comprobante</h1>
            <p className="text-gray-600">Envía tu comprobante de transferencia bancaria</p>
          </div>
        </div>

        {/* Bank Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-500" />
              Datos Bancarios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-3">Realiza tu transferencia a:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Banco:</span>
                  <span className="font-medium text-blue-900">BBVA MÉXICO</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Cuenta:</span>
                  <span className="font-medium text-blue-900">0123456789</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">CLABE:</span>
                  <span className="font-medium text-blue-900">012345678901234567</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Tarjeta:</span>
                  <span className="font-medium text-blue-900">4152313659461094</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Titular:</span>
                  <span className="font-medium text-blue-900">Rosio Arisema Uribe Macias</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-green-500" />
              Comprobante de Transferencia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="receipt">Comprobante de transferencia *</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="receipt"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  {selectedFile ? (
                    <div className="space-y-2">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                      <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedFile(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                      >
                        Cambiar archivo
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Haz clic para subir tu comprobante
                        </p>
                        <p className="text-xs text-gray-500">
                          JPG, PNG o PDF (máximo 5MB)
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Seleccionar archivo
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Transfer Details */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="amount">Monto transferido *</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="1"
                      placeholder="0.00"
                      value={transferDetails.amount}
                      onChange={(e) => setTransferDetails(prev => ({ ...prev, amount: e.target.value }))}
                      className="!pl-10 !pr-4"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reference">Referencia/Concepto *</Label>
                  <Input
                    id="reference"
                    placeholder="Referencia de la transferencia"
                    value={transferDetails.reference}
                    onChange={(e) => setTransferDetails(prev => ({ ...prev, reference: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank">Banco origen (opcional)</Label>
                <Input
                  id="bank"
                  placeholder="Ej: BBVA, Santander, Banorte..."
                  value={transferDetails.bank}
                  onChange={(e) => setTransferDetails(prev => ({ ...prev, bank: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas adicionales (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Cualquier información adicional..."
                  rows={3}
                  value={transferDetails.notes}
                  onChange={(e) => setTransferDetails(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={uploading || !selectedFile}
              >
                {uploading ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-spin" />
                    Enviando comprobante...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Enviar Comprobante
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Información Importante
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">Tiempo de procesamiento</p>
                <p className="text-xs text-gray-600">24-48 horas hábiles después de recibir tu comprobante</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">Notificación automática</p>
                <p className="text-xs text-gray-600">Te enviaremos un email cuando tus créditos sean acreditados</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">Soporte</p>
                <p className="text-xs text-gray-600">Si tienes dudas, contacta a soporte@befastapp.com.mx</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
  );
}
