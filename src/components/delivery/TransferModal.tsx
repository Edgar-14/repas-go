'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  DollarSign,
  X
} from 'lucide-react';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/collections';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageInfo?: {
    id: string;
    name: string;
    price: number;
    credits: number;
  };
}

export default function TransferModal({ isOpen, onClose, packageInfo }: TransferModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [transferDetails, setTransferDetails] = useState({
    amount: packageInfo?.price.toString() || '',
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

    if (!user?.uid) {
      toast({
        variant: 'destructive',
        title: 'Sesión requerida',
        description: 'Vuelve a iniciar sesión para enviar el comprobante.',
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
        let message = 'Error al subir el archivo';
        try {
          const text = await uploadResponse.text();
          try {
            const err = JSON.parse(text);
            message = err?.details || err?.error || err?.message || message;
          } catch {
            if (text) message = text;
          }
        } catch {}
        throw new Error(message);
      }

      const { fileUrl } = await uploadResponse.json();

      // Obtener información del negocio para incluir el nombre
      let businessName = 'Negocio desconocido';
      
      try {
        const businessDocRef = doc(db, 'businesses', user!.uid);
        const businessDocSnap = await getDoc(businessDocRef);
        
        if (businessDocSnap.exists()) {
          const businessData = businessDocSnap.data();
          businessName = businessData.businessName || businessData.name || 'Negocio desconocido';
        }
      } catch (error) {
        console.warn('No se pudo obtener el nombre del negocio:', error);
      }

      // Crear solicitud de pago en Firestore
      await addDoc(collection(db, COLLECTIONS.CREDIT_TRANSACTIONS), {
        businessId: user!.uid,
        businessName: businessName,
        packageInfo: packageInfo,
        transferDetails: {
          amount: parseFloat(transferDetails.amount),
          reference: transferDetails.reference,
          bank: transferDetails.bank,
          notes: transferDetails.notes,
          receiptUrl: fileUrl,
          uploadedAt: new Date()
        },
        type: 'PURCHASE',
        credits: packageInfo?.credits || 0,
        amount: parseFloat(transferDetails.amount),
        description: `Compra de ${packageInfo?.credits || 0} créditos - ${packageInfo?.name || 'Paquete'}`,
        status: 'PENDING',
        proofUrl: fileUrl,
        processedBy: null,
        processedAt: null,
        createdAt: new Date()
      });

      toast({
        title: "Comprobante enviado",
        description: "Tu comprobante ha sido enviado para verificación. Te notificaremos cuando sea procesado.",
      });

      // Reset form and close modal
      setSelectedFile(null);
      setTransferDetails({
        amount: packageInfo?.price.toString() || '',
        reference: '',
        bank: '',
        notes: ''
      });
      onClose();
      
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

  const handleClose = () => {
    if (!uploading) {
      setSelectedFile(null);
      setTransferDetails({
        amount: packageInfo?.price.toString() || '',
        reference: '',
        bank: '',
        notes: ''
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[95vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl sm:text-2xl">Transferencia Bancaria</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Completa los datos de tu transferencia y sube el comprobante para procesar tu compra de créditos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Package Info */}
          {packageInfo && (
            <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-200">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-lg text-orange-900">{packageInfo.name}</h3>
                    <p className="text-sm text-orange-700">{packageInfo.credits} créditos</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-2xl font-bold text-orange-600">${packageInfo.price.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}


          {/* Upload Form */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
                <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                Comprobante de Transferencia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* File Upload */}
                <div className="space-y-3">
                  <Label htmlFor="receipt" className="text-sm sm:text-base font-medium">Comprobante de transferencia *</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-gray-400 transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="receipt"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    
                    {selectedFile ? (
                      <div className="space-y-3">
                        <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-green-500 mx-auto" />
                        <p className="text-sm sm:text-base font-medium text-gray-900 break-all">{selectedFile.name}</p>
                        <p className="text-xs sm:text-sm text-gray-500">
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
                          className="text-xs sm:text-sm"
                        >
                          Cambiar archivo
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Upload className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto" />
                        <div>
                          <p className="text-sm sm:text-base font-medium text-gray-900">
                            Haz clic para subir tu comprobante
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500">
                            JPG, PNG o PDF (máximo 5MB)
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs sm:text-sm"
                        >
                          Seleccionar archivo
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Transfer Details */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-sm sm:text-base font-medium">Monto transferido *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none z-10" />
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="1"
                        placeholder="0.00"
                        value={transferDetails.amount}
                        onChange={(e) => setTransferDetails(prev => ({ ...prev, amount: e.target.value }))}
                        className="!pl-10 !pr-4 text-sm sm:text-base"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reference" className="text-sm sm:text-base font-medium">Referencia/Concepto *</Label>
                    <Input
                      id="reference"
                      placeholder="Referencia de la transferencia"
                      value={transferDetails.reference}
                      onChange={(e) => setTransferDetails(prev => ({ ...prev, reference: e.target.value }))}
                      className="text-sm sm:text-base"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bank" className="text-sm sm:text-base font-medium">Banco origen (opcional)</Label>
                  <Input
                    id="bank"
                    placeholder="Ej: BBVA, Santander, Banorte..."
                    value={transferDetails.bank}
                    onChange={(e) => setTransferDetails(prev => ({ ...prev, bank: e.target.value }))}
                    className="text-sm sm:text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm sm:text-base font-medium">Notas adicionales (opcional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Cualquier información adicional..."
                    rows={3}
                    value={transferDetails.notes}
                    onChange={(e) => setTransferDetails(prev => ({ ...prev, notes: e.target.value }))}
                    className="text-sm sm:text-base resize-none"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={uploading}
                    className="flex-1 h-11 sm:h-10 text-sm sm:text-base"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-11 sm:h-10 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base"
                    disabled={uploading || !selectedFile}
                  >
                    {uploading ? (
                      <>
                        <Upload className="mr-2 h-4 w-4 animate-spin" />
                        <span className="hidden sm:inline">Enviando...</span>
                        <span className="sm:hidden">Enviando...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">Enviar Comprobante</span>
                        <span className="sm:hidden">Enviar</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Information */}
          <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
                <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                Información Importante
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm sm:text-base font-medium text-gray-900">Tiempo de procesamiento</p>
                  <p className="text-xs sm:text-sm text-gray-600">24-48 horas hábiles después de recibir tu comprobante</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm sm:text-base font-medium text-gray-900">Notificación automática</p>
                  <p className="text-xs sm:text-sm text-gray-600">Te enviaremos un email cuando tus créditos sean acreditados</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm sm:text-base font-medium text-gray-900">Soporte</p>
                  <p className="text-xs sm:text-sm text-gray-600">Si tienes dudas, contacta a soporte@befastapp.com.mx</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
