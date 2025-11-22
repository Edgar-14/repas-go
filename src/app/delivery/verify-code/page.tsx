'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Clock, RefreshCw } from 'lucide-react';

function VerifyCodeContent() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(600);
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1 || !/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (verificationCode?: string) => {
    const codeToVerify = verificationCode || code.join('');
    if (codeToVerify.length !== 6) {
      setError('Por favor ingresa el código completo de 6 dígitos');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      // Usar la función de Firebase para verificar el código
      const { getFunctions, httpsCallable } = await import('firebase/functions');
      const { app } = await import('@/lib/firebase');
      
      const functions = getFunctions(app);
      const verifyPublicEmail = httpsCallable(functions, 'verifyPublicEmail');
      
      const result = await verifyPublicEmail({ 
        email, 
        code: codeToVerify,
        userType: 'BUSINESS'
      });
      
      const data = result.data as any;
      
      if (data.success) {
        // Limpiar email guardado
        localStorage.removeItem('pendingVerificationEmail');
        
        // Redirigir al dashboard
        router.push('/delivery/dashboard');
      } else {
        throw new Error(data.message || 'Error en la verificación');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.message || 'Error al verificar el código. Intenta nuevamente.');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setError('');
    try {
      // Usar la función de Firebase para reenviar el código
      const { getFunctions, httpsCallable } = await import('firebase/functions');
      const { app } = await import('@/lib/firebase');
      
      const functions = getFunctions(app);
      const resendVerificationCode = httpsCallable(functions, 'resendVerificationCode');
      
      const result = await resendVerificationCode({ 
        email,
        userType: 'BUSINESS'
      });
      
      const data = result.data as any;
      
      if (data.success) {
        setTimeLeft(600);
        setCanResend(false);
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        throw new Error(data.message || 'Error al reenviar el código');
      }
    } catch (err: any) {
      console.error('Resend error:', err);
      setError(err.message || 'Error al reenviar el código. Intenta nuevamente.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-6">
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/logo-befast-delivery.svg"
                alt="BeFast Delivery Logo"
                width={120}
                height={80}
                className="mx-auto h-16 w-auto object-contain"
              />
            </Link>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Verificar Email
            </CardTitle>
            <CardDescription className="text-gray-600">
              Hemos enviado un código de 6 dígitos a<br />
              <span className="font-medium text-gray-800">{email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex justify-center space-x-2">
                {code.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 text-center text-lg font-bold border-2 focus:border-orange-500"
                    disabled={isLoading}
                  />
                ))}
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <Clock size={16} />
                  <span>El código expira en {formatTime(timeLeft)}</span>
                </div>
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button 
                onClick={() => handleVerify()}
                className="w-full h-12 bg-orange-600 hover:bg-orange-700"
                disabled={isLoading || code.some(digit => digit === '')}
              >
                {isLoading ? 'Verificando...' : 'Verificar Código'}
              </Button>
              <div className="text-center">
                {canResend ? (
                  <Button
                    variant="outline"
                    onClick={handleResendCode}
                    disabled={isResending}
                    className="text-orange-600 border-orange-600 hover:bg-orange-50"
                  >
                    {isResending ? (
                      <>
                        <RefreshCw size={16} className="mr-2 animate-spin" />
                        Reenviando...
                      </>
                    ) : (
                      'Reenviar Código'
                    )}
                  </Button>
                ) : (
                  <p className="text-sm text-gray-500">
                    Podrás solicitar un nuevo código cuando expire el tiempo
                  </p>
                )}
              </div>
              <div className="text-center">
                <Link
                  href="/delivery/signup"
                  className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800"
                >
                  <ArrowLeft size={16} className="mr-1" />
                  Volver al registro
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DeliveryVerifyCodePage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <VerifyCodeContent />
    </Suspense>
  );
}
