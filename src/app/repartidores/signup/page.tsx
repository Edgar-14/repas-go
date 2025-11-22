'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Lock, Mail, Phone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from '@/lib/firebase';

interface RegisterDriverResponse {
  success: boolean;
  message?: string;
  uid?: string;
}

interface RegisterDriverPayload {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

const initialFormData = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
};

export default function DriversSignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState(initialFormData);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Limpiar cualquier estado inconsistente si el usuario llega aquí sin estar verificado.
    const verified = localStorage.getItem('driverVerified');
    if (verified !== 'true') {
        localStorage.removeItem('signupData');
        localStorage.removeItem('driverPendingVerificationEmail');
        return;
    }
    
    // Si está verificado pero hay datos, lo mandamos al siguiente paso.
    const signupDataRaw = localStorage.getItem('signupData');
    if (signupDataRaw) {
        try {
            const parsed = JSON.parse(signupDataRaw);
            if (parsed && typeof parsed === 'object') {
                router.replace('/repartidores/signup/step-1');
            }
        } catch (error) {
            // Si los datos están corruptos, se limpian.
            localStorage.removeItem('signupData');
            localStorage.removeItem('driverVerified');
        }
    }
  }, [router]);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = event.target;
    if (id === 'phone') {
      const numericValue = value.replace(/\D/g, '').slice(0, 10);
      setFormData((prev) => ({ ...prev, [id]: numericValue }));
    } else {
      setFormData((prev) => ({ ...prev, [id]: value }));
    }
  }, []);

  const { fullName, email, phone, password, confirmPassword } = formData;

  const isReady = useMemo(
    () =>
      fullName.trim().length > 2 &&
      email.trim().includes('@') &&
      phone.trim().length === 10 &&
      password.length >= 6 &&
      password === confirmPassword,
    [confirmPassword, email, fullName, password, phone],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isReady) {
      toast({
        title: 'Faltan datos',
        description: 'Por favor, completa todos los campos correctamente.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const functions = getFunctions(app);
      const registerDriver = httpsCallable<RegisterDriverPayload, RegisterDriverResponse>(
        functions,
        'registerDriver',
      );

      const result = await registerDriver({ fullName: fullName.trim(), email: email.trim(), phone: phone.trim(), password });
      const data = result.data;

      if (!data.success) {
        throw new Error(data.message || 'No fue posible crear la cuenta.');
      }
      
      const auth = getAuth(app);
      await signInWithEmailAndPassword(auth, email, password);

      // CORRECCIÓN: Se crea el objeto `signupData` con la estructura anidada correcta desde el inicio.
      // Esto previene la corrupción de datos en los pasos siguientes.
      const initialSignupData = {
        email: email.trim(),
        uid: data.uid ?? null,
        personalData: {
          fullName: fullName.trim(),
          phone: phone.trim(),
        },
        // Se inicializan los otros objetos para mantener la consistencia.
        vehicle: {},
        bank: {},
        uploadedDocuments: {},
        legal: null,
      };
      
      // Se limpia cualquier dato previo y se establece el nuevo objeto estructurado.
      localStorage.setItem('signupData', JSON.stringify(initialSignupData));
      localStorage.setItem('driverVerified', 'true');
      localStorage.removeItem('driverPendingVerificationEmail');

      toast({
        title: '¡Cuenta creada!',
        description: 'Ahora completa tu perfil de repartidor.',
      });

      router.push('/repartidores/signup/step-1');
    } catch (error: unknown) {
      console.error('Error creando cuenta de repartidor:', error);

      let message = 'No fue posible crear la cuenta. Intenta nuevamente.';
      if (error instanceof Error) {
        if (error.message.toLowerCase().includes('already-exists') || 
            error.message.toLowerCase().includes('already-in-use')) {
          message = 'Ya existe una cuenta con este correo electrónico.';
        } else if (error.message.includes('internal')) {
          message = 'Error interno del servidor. Verifica tu conexión e intenta nuevamente.';
        } else {
          message = error.message;
        }
      }

      toast({
        title: 'Error al crear cuenta',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-[15px_15px_30px_#bebebe,-15px_-15px_30px_#ffffff]">
        <CardHeader className="text-center space-y-4">
          <Image
            src="/logo-befast-repartidores.svg"
            alt="BeFast Repartidores"
            width={90}
            height={36}
            className="h-9 w-auto object-contain mx-auto"
          />
          <CardTitle className="text-2xl font-bold text-emerald-800">Crea tu cuenta</CardTitle>
          <CardDescription className="text-gray-600">
            Registra tu información básica.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={handleChange}
                  placeholder="Nombre(s) Apellidos"
                  required
                  className="pl-10 h-11"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono (10 dígitos)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  value={phone}
                  onChange={handleChange}
                  placeholder="3121234567"
                  required
                  className="pl-10 h-11"
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={handleChange}
                  placeholder="tu@email.com"
                  autoComplete="email"
                  required
                  className="pl-10 h-11"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={handleChange}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                  required
                  className="pl-10 h-11"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={handleChange}
                  placeholder="Repite tu contraseña"
                  autoComplete="new-password"
                  required
                  className="pl-10 h-11"
                  disabled={isLoading}
                />
              </div>
              {password && confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-600 mt-1">Las contraseñas no coinciden.</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
              disabled={isLoading || !isReady}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creando cuenta...
                </>
              ) : (
                'Crear mi cuenta'
              )}
            </Button>

            <div className="text-center text-sm text-gray-600">
              ¿Ya tienes una cuenta?{' '}
              <Link href="/repartidores/login" className="font-medium text-emerald-600 underline">
                Inicia sesión
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}