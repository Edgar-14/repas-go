'use client';

import { useState } from 'react';
// import { sendPasswordResetEmail } from 'firebase/auth'; // Not used directly
// import { auth } from '@/lib/firebase'; // Not used directly
import Image from 'next/image';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
// Removed unused Card components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Mail } from 'lucide-react';
// Removed unused cn utility
import { useToast } from '@/hooks/use-toast'; // Corrected import path from central hooks directory

const formSchema = z.object({
  email: z.string().email({ message: "Introduce un correo válido." }),
});

export default function AdminForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast(); // Initialize toast

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    try {
      // Validar que sea un email de administrador (esto debería hacerse en backend, pero se mantiene por ahora)
      const adminEmails = [
        'egarcia@befastapp.com.mx',
        'documentos@befastapp.com.mx',
        'revisiones@befastapp.com.mx',
        'guillezamoracolima@hotmail.com',
        'c.monsetdeleon@gmail.com'
      ];

      if (!adminEmails.includes(values.email)) {
        throw new Error('Email no autorizado para recuperación administrativa');
      }

      // Usar nuestra API personalizada con Gmail
      const response = await fetch('/api/auth/custom-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: values.email,
          portal: 'admin'
        }),
      });
      
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Error enviando correo');
      }

      // Show success toast
      toast({
        title: "Correo enviado",
        description: "Si existe una cuenta con ese email, recibirás un enlace de recuperación.",
        variant: "default",
      });

      form.reset(); // Clear the form

    } catch (error: any) {
      console.error('Error sending password reset:', error);
      
      // Show error toast
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el correo. Inténtalo de nuevo.",
        variant: "destructive",
      });

    } finally {
      setIsLoading(false);
    }
  };

  return (
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
          src="/befast-logo-admin.svg"
          alt="BeFast Admin Logo"
          width={120}
          height={80}
          className="mx-auto h-20 w-auto object-contain drop-shadow-lg filter brightness-0 invert mb-6"
          priority
        />
        <h2 className="mt-6 text-3xl font-extrabold text-white">Recuperar Contraseña</h2>
        <p className="mt-2 text-sm text-gray-400">Ingresa tu email corporativo para recuperar tu contraseña</p>
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
                      Email Corporativo
                    </FormLabel>
                    <div className="mt-1">
                      <Input
                        {...field}
                        type="email"
                        placeholder="admin@befastapp.com.mx"
                        disabled={isLoading}
                        className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-700 text-white"
                      />
                    </div>
                    <FormMessage />
                    <p className="text-xs text-gray-400 mt-1">
                      Solo emails autorizados de BeFast pueden solicitar recuperación
                    </p>
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  href="/admin/login"
                  className="font-medium text-blue-400 hover:text-blue-300 transition-colors hover:underline"
                >
                  Inicia sesión aquí
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <Link href="/" className="font-medium text-blue-400 hover:text-blue-300">
            ← Volver al portal
          </Link>
        </div>
      </div>
    </div>
  );
}
