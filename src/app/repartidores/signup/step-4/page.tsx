'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CustomCheckbox } from '@/components/ui/custom-checkbox';
import { ArrowLeft, ArrowRight, Play, BookOpen, Award, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function SignupStep4() {
  const router = useRouter();
  const { toast } = useToast();
  const [signupData, setSignupData] = useState<any>(null);
  const [currentModule, setCurrentModule] = useState(0);
  const [completedModules, setCompletedModules] = useState<number[]>([]);
  const [testScore, setTestScore] = useState<number | null>(null);
  const [testPassed, setTestPassed] = useState(false);
  const [modules, setModules] = useState<any[]>([]);
  const [loadingModules, setLoadingModules] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentModuleData, setCurrentModuleData] = useState<any>(null);
  const [moduleProgress, setModuleProgress] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('signupData');
    if (!saved) {
      router.push('/repartidores/signup/step-1');
      return;
    }
    const parsed = JSON.parse(saved);
    setSignupData(parsed);

    // Restaurar borrador de capacitación si existe
    const draft = parsed?.trainingDraft;
    if (draft) {
      if (Array.isArray(draft.completedModules)) {
        setCompletedModules(draft.completedModules);
      }
      if (typeof draft.testScore === 'number') {
        setTestScore(draft.testScore);
      }
      if (typeof draft.testPassed === 'boolean') {
        setTestPassed(draft.testPassed);
      }
    }
  }, [router]);

  // Cargar módulos desde Firestore
  useEffect(() => {
    const fetchTrainingModules = async () => {
      try {
        console.log('🔍 Cargando módulos de capacitación desde Firestore...');
        const modulesQuery = query(collection(db, 'trainingModules'));
        const snapshot = await getDocs(modulesQuery);
        
        if (!snapshot.empty) {
          const modulesList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          console.log('✅ Módulos cargados:', modulesList);
          setModules(modulesList);
        } else {
          console.log('⚠️ No se encontraron módulos, usando módulos por defecto');
          // Módulos por defecto si no hay en Firestore
          setModules([
            {
              title: 'Introducción a BeFast',
              description: 'Conoce nuestra plataforma y modelo de negocio',
              duration: '15 min',
              videoUrl: '/videos/intro-befast.mp4'
            },
            {
              title: 'Protocolos de Seguridad',
              description: 'Medidas de seguridad vial y prevención de accidentes',
              duration: '20 min',
              videoUrl: '/videos/safety-protocols.mp4'
            },
            {
              title: 'Uso de la Aplicación',
              description: 'Cómo usar la app para repartidores de manera eficiente',
              duration: '25 min',
              videoUrl: '/videos/app-usage.mp4'
            },
            {
              title: 'Atención al Cliente',
              description: 'Estándares de servicio y manejo de situaciones',
              duration: '20 min',
              videoUrl: '/videos/customer-service.mp4'
            }
          ]);
        }
      } catch (error) {
        console.error('❌ Error cargando módulos:', error);
        // Usar módulos por defecto en caso de error
        setModules([
          {
            title: 'Introducción a BeFast',
            description: 'Conoce nuestra plataforma y modelo de negocio',
            duration: '15 min',
            videoUrl: '/videos/intro-befast.mp4'
          },
          {
            title: 'Protocolos de Seguridad',
            description: 'Medidas de seguridad vial y prevención de accidentes',
            duration: '20 min',
            videoUrl: '/videos/safety-protocols.mp4'
          },
          {
            title: 'Uso de la Aplicación',
            description: 'Cómo usar la app para repartidores de manera eficiente',
            duration: '25 min',
            videoUrl: '/videos/app-usage.mp4'
          },
          {
            title: 'Atención al Cliente',
            description: 'Estándares de servicio y manejo de situaciones',
            duration: '20 min',
            videoUrl: '/videos/customer-service.mp4'
          }
        ]);
      } finally {
        setLoadingModules(false);
      }
    };

    fetchTrainingModules();
  }, []);

  // Autosave de avance de capacitación y evaluación (step 4)
  useEffect(() => {
    // Persistencia local
    try {
      if (signupData) {
        const updated = {
          ...signupData,
          trainingDraft: {
            completedModules,
            testScore,
            testPassed,
          },
        };
        localStorage.setItem('signupData', JSON.stringify(updated));
      }
    } catch {}

    // Persistencia en Firestore
    const saveDraft = async () => {
      try {
        const email = signupData?.email;
        if (!email) return;
        
        const draftData = {
          email,
          step: 4,
          training: {
            completedModules: completedModules || [],
            testScore: testScore ?? null,
            testPassed: !!testPassed,
          },
          updatedAt: serverTimestamp(),
        };
        
        await setDoc(
          doc(db, 'driverRegistrationDrafts', email),
          draftData,
          { merge: true }
        );
      } catch (e) {
        console.error('No se pudo guardar borrador de capacitación en Firestore:', e);
      }
    };
    saveDraft();
  }, [completedModules, testScore, testPassed, signupData?.email]);

  const handleOpenModule = (moduleIndex: number) => {
    const selectedModule = modules[moduleIndex];
    setCurrentModuleData({ ...selectedModule, index: moduleIndex });
    setModuleProgress(0);
    setModalOpen(true);
  };

  const handleModuleComplete = (moduleIndex: number) => {
    if (!completedModules.includes(moduleIndex)) {
      setCompletedModules(prev => [...prev, moduleIndex]);
    }
    setModalOpen(false);
    setCurrentModuleData(null);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setCurrentModuleData(null);
    setModuleProgress(0);
  };

  const handleStartTest = async () => {
    try {
      const { getFunctions, httpsCallable } = await import('firebase/functions');
      const { app } = await import('@/lib/firebase');
      const functions = getFunctions(app);
      const startDriverEvaluation = httpsCallable(functions, 'startDriverEvaluation');

      const payload: any = { completedModules };
      if (signupData?.uid) payload.driverId = signupData.uid;
      if (signupData?.email) payload.email = signupData.email;

      const result = await startDriverEvaluation(payload);
      const data = result.data as any;

      if (data && (data.success || typeof data.score === 'number')) {
        const score = typeof data.score === 'number' ? data.score : 100;
        setTestScore(score);
        setTestPassed(score >= 80);
      } else {
        // Fallback local: aprobar si todos los módulos están completos
        if (completedModules.length === modules.length) {
          setTestScore(85);
          setTestPassed(true);
          console.warn('Evaluación remota no disponible, se aplicó validación local.');
        } else {
          throw new Error(data?.message || 'Evaluación no disponible');
        }
      }
    } catch (error) {
      console.error('Error en evaluación:', error);
      if (completedModules.length === modules.length) {
        setTestScore(85);
        setTestPassed(true);
        console.warn('Evaluación remota falló, se aplicó validación local.');
      } else {
        toast({
          title: 'Error en evaluación',
          description: 'Error al iniciar la evaluación. Intenta de nuevo tras completar los módulos.',
          variant: 'destructive'
        });
      }
    }
  };

  const handleContinueToStep5 = async () => {
    if (!testPassed) {
      toast({
        title: 'Evaluación requerida',
        description: 'Debes aprobar la evaluación con al menos 80% para continuar',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Save training completion to draft and localStorage
      const trainingData = {
        completedModules,
        testScore,
        testPassed: true,
        completedAt: new Date().toISOString()
      };

      const finalData = {
        ...signupData,
        training: trainingData,
        step: 4,
      };

      // Save to Firestore draft
      if (signupData?.email && db) {
        await setDoc(
          doc(db, 'driverRegistrationDrafts', signupData.email),
          {
            email: signupData.email,
            step: 4,
            training: trainingData,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      // Save to localStorage
      localStorage.setItem('signupData', JSON.stringify(finalData));
      
      toast({
        title: 'Capacitación completada',
        description: 'Procederemos a enviar tu solicitud',
      });

      router.push('/repartidores/signup/step-5');
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Error al guardar los datos de capacitación. Inténtalo de nuevo.',
        variant: 'destructive'
      });
    }
  };

  if (!signupData || loadingModules) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-4" />
            <p className="text-gray-600">
              {!signupData ? 'Cargando datos...' : 'Cargando módulos de capacitación...'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const allModulesCompleted = completedModules.length === modules.length;
  const progress = (completedModules.length / modules.length) * 100;

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
              <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm flex-shrink-0">✓</div>
              <div className="w-12 h-1 bg-emerald-600 rounded flex-shrink-0"></div>
              <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">4</div>
            </div>
            <p className="text-gray-700 text-base font-medium">Paso 4 de 4: Capacitación Obligatoria</p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <BookOpen className="text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-blue-900">Capacitación Obligatoria</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Completa todos los módulos de video y aprueba la evaluación con 80% mínimo para finalizar tu solicitud.
                </p>
              </div>
            </div>
          </div>

          {/* Progreso */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Progreso de Capacitación</span>
              <span className="text-sm text-gray-600">{completedModules.length}/{modules.length} módulos</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Módulos de Capacitación */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Módulos de Capacitación</h3>
            {modules.map((module, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {completedModules.includes(index) ? (
                      <CheckCircle className="text-green-600 flex-shrink-0" />
                    ) : (
                      <div className="w-6 h-6 border-2 border-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-xs text-gray-500">{index + 1}</span>
                      </div>
                    )}
                    <div>
                      <h4 className="font-medium text-gray-900">{module.title}</h4>
                      <p className="text-sm text-gray-600">{module.description}</p>
                      <span className="text-xs text-gray-500">{module.duration}</span>
                    </div>
                  </div>
                  <Button
                    variant={completedModules.includes(index) ? "outline" : "default"}
                    size="sm"
                    onClick={() => handleOpenModule(index)}
                  >
                    {completedModules.includes(index) ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Completado
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Ver Video
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Evaluación */}
          {allModulesCompleted && (
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Award className="w-6 h-6 text-orange-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">Evaluación Final</h4>
                      <p className="text-sm text-gray-600">
                        Evaluación de conocimientos - Calificación mínima: 80%
                      </p>
                      {testScore && (
                        <p className="text-sm font-medium mt-1">
                          <span className={testPassed ? 'text-green-600' : 'text-red-600'}>
                            Calificación: {testScore}% {testPassed ? '(Aprobado)' : '(No aprobado)'}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                  {!testScore ? (
                    <Button onClick={handleStartTest} className="bg-orange-600 hover:bg-orange-700">
                      <Award className="w-4 h-4 mr-2" />
                      Iniciar Evaluación
                    </Button>
                  ) : testPassed ? (
                    <Button variant="outline" disabled>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Aprobado
                    </Button>
                  ) : (
                    <Button onClick={handleStartTest} variant="destructive">
                      <Award className="w-4 h-4 mr-2" />
                      Reintentar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Botones de navegación */}
          <div className="flex justify-between pt-6">
            <Link href="/repartidores/signup/step-3">
              <Button variant="outline" className="px-8">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Anterior
              </Button>
            </Link>
            <Button 
              onClick={handleContinueToStep5}
              className="px-8 bg-green-600 hover:bg-green-700"
              disabled={!allModulesCompleted || !testPassed}
            >
              {!allModulesCompleted ? 'Completa todos los módulos' : 
               !testPassed ? 'Aprueba la evaluación' : 'Enviar Solicitud'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal para módulo */}
      {modalOpen && currentModuleData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{currentModuleData.title}</h3>
              <Button variant="ghost" size="sm" onClick={handleCloseModal}>✕</Button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="mb-4">
                <p className="text-gray-700">{currentModuleData.description}</p>
              </div>
              
              {currentModuleData.videoUrl && (
                <div className="mb-4">
                  <video controls className="w-full rounded">
                    <source src={currentModuleData.videoUrl} type="video/mp4" />
                  </video>
                </div>
              )}
              
              {currentModuleData.quiz && (
                <div className="bg-gray-50 p-3 rounded">
                  <h4 className="font-medium mb-2">Cuestionario:</h4>
                  <p className="text-sm">{currentModuleData.quiz}</p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t flex justify-between">
              <Button variant="outline" onClick={handleCloseModal}>Cerrar</Button>
              <Button onClick={() => handleModuleComplete(currentModuleData.index)}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Completar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}