'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
// Removed unused Card components
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Mail } from 'lucide-react';
// Removed unused cn utility
import { useToast } from '@/hooks/use-toast';
import { WelcomeChatbot } from '@/components/chat';
// // Firebase Functions imports removed - not needed in frontend
// Removed - not needed in frontend
const formSchema = z.object({
  email: z.string().email({ message: "Introduce un correo válido." }),
});

export default function DeliveryForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      if (typeof window !== 'undefined') {
        const { getAuth, sendPasswordResetEmail } = await import('firebase/auth');
        const { app } = await import('@/lib/firebase');
        const auth = getAuth(app);

      // Usar nuestra API personalizada con Gmail
      const response = await fetch('/api/auth/custom-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: values.email,
          portal: 'delivery'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error enviando correo');
      }

        // Mostrar mensaje de éxito
        toast({
          title: '¡Correo enviado!',
          description: 'Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.',
        });

        form.setValue('email', '');
      }
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      
      // Mostrar mensaje de error
      toast({
        variant: 'destructive',
        title: 'Error al enviar el correo',
        description: error.message || 'No se pudo enviar el correo de recuperación. Verifica tu dirección de email.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        {/* Fondo con imagen */}
        <div className="absolute inset-0">
          <img 
            src="/Diseño sin título (1).jpg" 
            alt="BeFast background" 
            className="w-full h-full object-cover opacity-20 blur-sm"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent"></div>
        </div>

        {/* Header */}
        <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md text-center">
          <Image
            src="/logo-befast-delivery.svg"
            alt="BeFast Delivery Logo"
            width={120}
            height={80}
            className="mx-auto h-20 w-auto object-contain drop-shadow-lg filter brightness-0 invert mb-6"
            priority
          />
          <h2 className="mt-6 text-3xl font-extrabold text-white">Recuperar Contraseña</h2>
          <p className="mt-2 text-sm text-gray-400">Ingresa tu email para recuperar tu contraseña</p>
        </div>

        {/* Form Container */}
        <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* Email Field */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-sm font-medium text-gray-300">
                        Correo Electrónico
                      </FormLabel>
                      <div className="mt-1">
                        <Input
                          {...field}
                          type="email"
                          placeholder="negocio@befastapp.com.mx"
                          disabled={isLoading}
                          className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm bg-gray-700 text-white"
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <div>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Enviar Enlace de Recuperación
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>

            {/* Enlaces adicionales */}
            <div className="mt-6 space-y-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-400">
                  ¿Recordaste tu contraseña?{' '}
                  <Link
                    href="/delivery/login"
                    className="font-medium text-orange-400 hover:text-orange-300 transition-colors hover:underline"
                  >
                    Inicia sesión aquí
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Back Link */}
          <div className="mt-6 text-center">
            <Link href="/" className="font-medium text-orange-400 hover:text-orange-300">
              ← Volver al portal
            </Link>
          </div>

          {/* Support Contact */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-400">¿Necesitas ayuda?</p>
            <p className="text-sm">
              <a
                href="mailto:soporte@befastapp.com.mx"
                className="hover:underline transition-colors text-orange-400 hover:text-orange-300"
              >
                Contactar Soporte Técnico
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Chat de Bienvenida */}
      <WelcomeChatbot />
    </>
  );
}
