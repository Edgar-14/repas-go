'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Image from 'next/image';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Key, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  password: z.string().min(8, { message: "La contraseña debe tener al menos 8 caracteres." }),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export default function AdminResetPasswordPage() {
  const searchParams = useSearchParams();
  const oobCode = searchParams.get('oobCode'); // Correctly get oobCode from URL
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!oobCode) {
      setError("Código de recuperación inválido o no encontrado en la URL.");
    } else {
      // Optional: Verify the code on component mount to provide early feedback
      verifyPasswordResetCode(auth, oobCode).catch((error) => {
        console.error("Invalid oobCode:", error);
        setError("El enlace de recuperación es inválido o ha expirado. Por favor, solicita uno nuevo.");
        toast({
          title: "Enlace Inválido",
          description: "El enlace de recuperación es inválido o ha expirado.",
          variant: "destructive"
        });
      });
    }
  }, [oobCode, toast]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });
  
  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setError(null);

    if (!oobCode) {
      setError("Token de recuperación no encontrado. Por favor, solicita un nuevo enlace.");
      setIsLoading(false);
      return;
    }

    try {
      await confirmPasswordReset(auth, oobCode, values.password);
      setIsSuccess(true);
      toast({
        title: "Éxito",
        description: "Tu contraseña ha sido actualizada. Ya puedes iniciar sesión.",
      });
    } catch (error: any) {
      console.error('Password reset error:', error);
      if (error.code === 'auth/invalid-action-code') {
        setError('El enlace de recuperación es inválido o ha expirado. Por favor, solicita uno nuevo.');
      } else {
        setError('Ocurrió un error al restablecer la contraseña.');
      }
      toast({
        title: "Error",
        description: error.message || 'Ocurrió un error.',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-green-50 to-emerald-100">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardContent className="text-center py-12">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-4">Contraseña Restablecida</h2>
            <p className="text-gray-600 mb-8">Tu contraseña ha sido actualizada exitosamente.</p>
            <Link href="/admin/login">
              <Button className="w-full">Volver al Inicio de Sesión</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-cian-100">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center">
          <Image src="/befast-logo-admin.svg" alt="BeFast Admin Logo" width={120} height={80} className="mx-auto h-20 w-auto" />
          <CardTitle className="text-2xl font-bold">Establecer Nueva Contraseña</CardTitle>
          <CardDescription>Introduce tu nueva contraseña para acceder a tu cuenta.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nueva Contraseña</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="********" disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Contraseña</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="********" disabled={isLoading || !oobCode} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && <p className="text-sm font-medium text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading || !oobCode}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Key className="mr-2 h-4 w-4" />}
                Restablecer Contraseña
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
