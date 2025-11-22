'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CustomCheckbox } from '@/components/ui/custom-checkbox';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, FileText, Loader2, Check, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import DOMPurify from 'isomorphic-dompurify';

interface DocumentData {
  url?: string;
  name?: string;
  uploadDate?: string;
  content?: string;
}

interface LegalDocuments {
  contractInstructions: DocumentData | null;
  algorithmicPolicy: DocumentData | null;
  driverContract: DocumentData | null;
}

export default function SignupStep3() {
  const router = useRouter();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [signature, setSignature] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [agreements, setAgreements] = useState({
    contract_accepted: false,
    legal_validity: false
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<{title: string, content: string, type: string} | null>(null);
  const [acceptedDocuments, setAcceptedDocuments] = useState<string[]>([]);
  const [legalDocuments, setLegalDocuments] = useState<LegalDocuments>({
    contractInstructions: null,
    algorithmicPolicy: null,
    driverContract: null
  });
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // CORRECCIÓN: Se lee el nombre completo desde localStorage para pre-llenar el campo.
    const savedRaw = localStorage.getItem('signupData');
    if (!savedRaw) {
      router.push('/repartidores/signup');
      return;
    }
    try {
        const saved = JSON.parse(savedRaw);
        if (saved?.personalData?.fullName) {
            setFullName(saved.personalData.fullName);
        }
        // Restaurar estado legal si existe en el borrador
        if (saved?.legal) {
            setSignature(saved.legal.signature || '');
            setAgreements({
                contract_accepted: saved.legal.acceptedContract || false,
                legal_validity: saved.legal.acceptedValidity || false,
            });
            setAcceptedDocuments(saved.legal.acceptedDocuments || []);
        }
    } catch (error) {
        console.error("Error al cargar datos iniciales en Step 3", error);
    }


    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }

    const fetchLegalDocuments = async () => {
      try {
        const [instructivoRes, politicaRes, contratoRes] = await Promise.all([
          fetch('/instructivo_de_llenado.md'),
          fetch('/politica_algoritmica.md'),
          fetch('/modelo_de_contrato.md')
        ]);

        const [instructivoText, politicaText, contratoText] = await Promise.all([
          instructivoRes.text(),
          politicaRes.text(),
          contratoRes.text()
        ]);

        const cleanContent = (text: string) => {
          return text
            .replace(/Cadena de validación:.*?Folio:.*?\n/g, '')
            .replace(/\|\|.*?\|\|/g, '')
            .replace(/^#\s+(.+)$/gm, '<h1 class="text-2xl font-bold text-gray-900 mb-6 mt-8 border-b-2 border-emerald-500 pb-2">$1</h1>')
            .replace(/^##\s+(.+)$/gm, '<h2 class="text-xl font-semibold text-gray-800 mb-4 mt-6">$1</h2>')
            .replace(/^###\s+(.+)$/gm, '<h3 class="text-lg font-medium text-gray-700 mb-3 mt-4">$1</h3>')
            .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
            .replace(/\n\n/g, '</p><p class="mb-4 text-gray-700 leading-relaxed text-justify">')
            .replace(/^(?!<[h|l|p|d])(.+)$/gm, '<p class="mb-4 text-gray-700 leading-relaxed text-justify">$1</p>')
            .replace(/<li>/g, '<ul class="list-disc list-inside mb-4 space-y-2"><li>').replace(/<\/li>/g, '</li></ul>')
            .replace(/<\/ul><ul[^>]*>/g, '')
            .trim();
        };

        setLegalDocuments({
          contractInstructions: { content: cleanContent(instructivoText), name: 'Instructivo de Llenado de Contrato' },
          algorithmicPolicy: { content: cleanContent(politicaText), name: 'Política de Gestión Algorítmica' },
          driverContract: { content: cleanContent(contratoText), name: 'Modelo de Contrato Individual de Trabajo' }
        });
      } catch (error) {
        console.error("❌ Error cargando documentos legales:", error);
      } finally {
        setLoadingDocuments(false);
      }
    };

    fetchLegalDocuments();
  }, [router]);

  // CORRECCIÓN: Se elimina el useEffect de auto-guardado para evitar conflictos.
  // El guardado se hará de forma segura y única en la función handleNext.

  const handleDocumentView = (document: DocumentData | null, title: string, type: string) => {
    if (document?.content) {
      setCurrentDocument({ title, content: document.content, type });
      setModalOpen(true);
    } else {
      toast({
        title: 'Documento no disponible',
        description: `${title} no está disponible en este momento.`,
        variant: 'destructive'
      });
    }
  };

  const handleAcceptAndClose = () => {
    if (currentDocument && !acceptedDocuments.includes(currentDocument.type)) {
      setAcceptedDocuments(prev => [...prev, currentDocument.type]);
    }
    setModalOpen(false);
    setCurrentDocument(null);
  };
  
  const closeModal = () => {
    setModalOpen(false);
    setCurrentDocument(null);
  };

  const getMousePos = (canvas: HTMLCanvasElement, e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getMousePos(canvas, e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getMousePos(canvas, e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };
  
  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignature(canvas.toDataURL('image/png'));
    }
  };
  
  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature('');
  };
  
  // Lógica táctil (sin cambios)
  const getTouchPos = (canvas: HTMLCanvasElement, touchEvent: React.TouchEvent<HTMLCanvasElement>) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (touchEvent.touches[0].clientX - rect.left) * scaleX,
      y: (touchEvent.touches[0].clientY - rect.top) * scaleY
    };
  };
  const startDrawingTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if(!canvas) return;
    const touchPos = getTouchPos(canvas, e);
    const ctx = canvas.getContext('2d');
    if(!ctx) return;
    ctx.beginPath();
    ctx.moveTo(touchPos.x, touchPos.y);
    setIsDrawing(true);
  };
  const drawTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if(!isDrawing) return;
    const canvas = canvasRef.current;
    if(!canvas) return;
    const touchPos = getTouchPos(canvas, e);
    const ctx = canvas.getContext('2d');
    if(!ctx) return;
    ctx.lineTo(touchPos.x, touchPos.y);
    ctx.stroke();
  };
  const stopDrawingTouch = () => {
    if(!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignature(canvas.toDataURL('image/png'));
    }
  };

  // CORRECCIÓN COMPLETA: Unificamos toda la lógica de guardado y envío en una sola función robusta.
  const handleNext = async () => {
    if (!signature || !fullName.trim() || !agreements.contract_accepted || !agreements.legal_validity) {
      toast({
        title: 'Información Faltante',
        description: 'Debes dibujar tu firma, escribir tu nombre completo y aceptar ambas casillas para continuar.',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    
    try {
      // 1. Leer los datos completos directamente desde localStorage para evitar corrupción.
      const currentDataRaw = localStorage.getItem('signupData');
      if (!currentDataRaw) {
        throw new Error("No se encontraron datos de registro. Vuelve al inicio.");
      }
      const currentData = JSON.parse(currentDataRaw);

      // 2. Preparar el objeto con la información legal de este paso.
      const legalData = {
        signature,
        fullName: fullName.trim(),
        acceptedContract: agreements.contract_accepted,
        acceptedValidity: agreements.legal_validity,
        acceptedDocuments,
        signedAt: new Date().toISOString(),
      };

      // 3. Crear el objeto final combinando los datos existentes con los nuevos.
      const finalSignupData = {
        ...currentData,
        legal: legalData,
        status: 'pending_review', // Estado final para la revisión del administrador
        applicationSubmittedAt: serverTimestamp(),
      };

      // 4. Guardar el objeto completo y finalizado en Firestore.
      if (currentData.email && db) {
        await setDoc(
          doc(db, 'driverRegistrationDrafts', currentData.email),
          finalSignupData,
          { merge: true } // Usar merge para actualizar el borrador existente.
        );
      } else {
        throw new Error("Email no encontrado, no se puede guardar la solicitud.");
      }
      
      // 5. Guardar el estado final en localStorage para el paso final.
      localStorage.setItem('signupData', JSON.stringify(finalSignupData));

      toast({
        title: "¡Solicitud Enviada!",
        description: "Tus datos han sido enviados para revisión. Serás redirigido a la página de confirmación.",
      });

      // 6. Redirigir al paso final de confirmación.
      router.push('/repartidores/signup/step-5');

    } catch (error: any) {
      console.error('Error al enviar la solicitud en el paso 3:', error);
      toast({
        title: 'Error al Enviar',
        description: error.message || 'No se pudo guardar tu solicitud. Por favor, intenta de nuevo.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loadingDocuments) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Cargando documentos legales...</span>
        </div>
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
              <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm flex-shrink-0">✓</div>
              <div className="w-12 h-1 bg-emerald-600 rounded flex-shrink-0"></div>
              <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm flex-shrink-0">✓</div>
              <div className="w-12 h-1 bg-emerald-600 rounded flex-shrink-0"></div>
              <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">3</div>
              <div className="w-12 h-1 bg-gray-300 rounded flex-shrink-0"></div>
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm flex-shrink-0">4</div>
            </div>
            <p className="text-gray-700 text-base font-medium">Paso 3 de 4: Contratación y Acuerdos Legales</p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-8">
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-800 text-center">Revisa y Acepta los Documentos Legales</h2>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg"><FileText className="text-blue-600 flex-shrink-0" /></div>
                    <div>
                      <p className="font-medium text-sm">📋 Instructivo de Llenado</p>
                      <p className="text-xs text-gray-500">Guía paso a paso del proceso</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {acceptedDocuments.includes('contractInstructions') && <Check className="w-4 h-4 text-green-600" />}
                    <Button size="sm" variant="outline" onClick={() => handleDocumentView(legalDocuments.contractInstructions, 'Instructivo de Llenado', 'contractInstructions')} disabled={!legalDocuments.contractInstructions} className="h-8 px-3 text-xs">Ver</Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg"><FileText className="w-4 h-4 text-purple-600" /></div>
                    <div>
                      <p className="font-medium text-sm">🤖 Política Algorítmica</p>
                      <p className="text-xs text-gray-500">Uso de algoritmos en asignación</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {acceptedDocuments.includes('algorithmicPolicy') && <Check className="w-4 h-4 text-green-600" />}
                    <Button size="sm" variant="outline" onClick={() => handleDocumentView(legalDocuments.algorithmicPolicy, 'Política Algorítmica', 'algorithmicPolicy')} disabled={!legalDocuments.algorithmicPolicy} className="h-8 px-3 text-xs">Ver</Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg"><FileText className="w-4 h-4 text-emerald-600" /></div>
                    <div>
                      <p className="font-medium text-sm">📄 Contrato de Trabajo</p>
                      <p className="text-xs text-gray-500">Términos y condiciones laborales</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {acceptedDocuments.includes('driverContract') && <Check className="w-4 h-4 text-green-600" />}
                    <Button size="sm" variant="outline" onClick={() => handleDocumentView(legalDocuments.driverContract, 'Contrato de Trabajo', 'driverContract')} disabled={!legalDocuments.driverContract} className="h-8 px-3 text-xs">Ver</Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">Firma Digital</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <canvas 
                    ref={canvasRef} 
                    width={400} 
                    height={150} 
                    className="w-full border border-gray-200 rounded cursor-crosshair bg-white" 
                    style={{ touchAction: 'none', maxWidth: '100%', height: 'auto' }} 
                    onMouseDown={startDrawing} 
                    onMouseMove={draw} 
                    onMouseUp={stopDrawing} 
                    onMouseLeave={stopDrawing} 
                    onTouchStart={startDrawingTouch} 
                    onTouchMove={drawTouch} 
                    onTouchEnd={stopDrawingTouch} 
                  />
                </div>
                <Button variant="outline" size="sm" onClick={clearSignature} className="mt-2">Limpiar Firma</Button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">Nombre Completo</Label>
                <Input id="fullName" type="text" placeholder="Escribe tu nombre completo aquí" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <CustomCheckbox id="contract_accepted" checked={agreements.contract_accepted} onCheckedChange={(checked) => setAgreements(prev => ({ ...prev, contract_accepted: checked as boolean }))} />
                <Label htmlFor="contract_accepted" className="text-sm leading-5 cursor-pointer select-none">He leído y acepto el Contrato.</Label>
              </div>
              <div className="flex items-center space-x-3">
                <CustomCheckbox id="legal_validity" checked={agreements.legal_validity} onCheckedChange={(checked) => setAgreements(prev => ({ ...prev, legal_validity: checked as boolean }))} />
                <Label htmlFor="legal_validity" className="text-sm leading-5 cursor-pointer select-none">Entiendo que esta firma tiene validez legal.</Label>
              </div>
            </div>
          </div>
        </CardContent>
        
        <div className="flex justify-between p-6 border-t bg-gray-50">
          <Link href="/repartidores/signup/step-2">
            <Button variant="outline" className="px-8"><ArrowLeft className="w-4 h-4 mr-2" />Anterior</Button>
          </Link>
          <Button onClick={handleNext} className="px-8 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white" disabled={!signature || !fullName.trim() || !agreements.contract_accepted || !agreements.legal_validity || saving}>
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</> : 'Enviar Solicitud'}
            {!saving && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </Card>

      {modalOpen && currentDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-800">{currentDocument.title}</h3>
              <Button variant="ghost" size="sm" onClick={closeModal} className="p-2"><X className="w-5 h-5" /></Button>
            </div>
            
            <div className="p-4 sm:p-8 overflow-y-auto flex-grow bg-white">
              <div className="prose max-w-none text-sm" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentDocument.content) }} />
            </div>
            
            <div className="p-6 border-t bg-gray-50">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <CustomCheckbox id="accept-document" checked={acceptedDocuments.includes(currentDocument.type)} onCheckedChange={(checked) => { if (checked) { setAcceptedDocuments(prev => [...prev, currentDocument.type]); } else { setAcceptedDocuments(prev => prev.filter(doc => doc !== currentDocument.type)); } }} />
                  <Label htmlFor="accept-document" className="text-sm font-medium cursor-pointer">He leído y acepto este documento</Label>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                  <Button variant="outline" onClick={closeModal} className="w-full sm:w-auto">Cerrar</Button>
                  <Button onClick={handleAcceptAndClose} className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white w-full sm:w-auto">Aceptar y Cerrar</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}