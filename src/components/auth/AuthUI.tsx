// src/components/auth/AuthUI.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
// Removed unused Card components
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
// import { Loader2 } from 'lucide-react';
import { usePortalTheme } from '@/hooks/use-portal-theme';
import { cn } from '@/lib/utils';

// Schema de validación
const authFormSchema = z.object({
  email: z.string().email({ message: "Introduce un correo válido." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
});

type AuthFormData = z.infer<typeof authFormSchema>;

// Tipos
type UserType = 'admin' | 'delivery' | 'repartidor';
type PortalKey = 'admin' | 'delivery' | 'repartidores';

interface AuthUIProps {
  userType: UserType;
  title: string;
  description: string;
  onSubmit: (values: AuthFormData) => void;
  onGoogleSignIn?: () => void;
  isLoading: boolean;
  icon?: React.ElementType;
  showSignup?: boolean;
  additionalInfo?: React.ReactNode;
}

// Configuraciones estáticas
const PORTAL_CONFIG = {
  logos: {
    admin: '/befast-logo-admin.svg',
    delivery: '/logo-befast-delivery.svg',
    repartidores: '/logo-befast-repartidores.svg'
  },
  defaultColors: {
    primary: '#FF7300',
    secondary: '#EA580C', 
    gradient: 'from-orange-500 to-orange-600',
    accent: '#FB923C',
    background: 'from-orange-50 to-orange-100',
    text: 'text-orange-900',
    textSecondary: 'text-orange-700'
  },
  placeholders: {
    admin: 'admin@befastapp.com.mx',
    delivery: 'tu@email.com',
    repartidores: 'tu@email.com'
  },
  emailLabels: {
    admin: 'Email corporativo',
    delivery: 'Correo electrónico',
    repartidores: 'Correo electrónico'
  },
  submitTexts: {
    admin: 'Acceder al Sistema',
    delivery: 'Entrar',
    repartidores: 'Iniciar Sesión'
  }
} as const;

// Componentes internos
const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

// Hooks y utilidades
const useAuthUIConfig = (userType: UserType, portal?: string, colors?: any) => {
  const normalizedPortal = (userType === 'repartidor' ? 'repartidores' : userType) as PortalKey;
  
  console.log('useAuthUIConfig Debug:', { userType, portal, colors, normalizedPortal });
  
  const safeColors = colors || PORTAL_CONFIG.defaultColors;
  const currentLogo = PORTAL_CONFIG.logos[normalizedPortal] || PORTAL_CONFIG.logos.admin;

  const getHref = (type: 'signup' | 'forgot-password') => {
    const base = normalizedPortal === 'repartidores' ? 'repartidores' : userType;
    if (type === 'signup' && normalizedPortal === 'repartidores') {
      return `/${base}/signup`;
    }
    return `/${base}/${type === 'signup' ? 'signup' : 'forgot-password'}`;
  };

  const getCardShadowClass = () => {
    const shadowMap = {
      admin: "shadow-blue-300/60",
      delivery: "shadow-orange-300/60",
      repartidores: "shadow-emerald-300/60"
    };
    return shadowMap[normalizedPortal];
  };

  const getInputFocusClass = () => {
    if (normalizedPortal === 'admin') {
      return "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";
    }
    return `focus:border-[${safeColors.primary}] focus:ring-2 focus:ring-[${safeColors.primary}]/20`;
  };

  const getButtonClass = () => {
    const baseClass = "w-full h-12 font-semibold transition-all duration-300 rounded-lg shadow-lg hover:shadow-xl";
    
    if (normalizedPortal === 'repartidores') {
      return cn(
        baseClass,
        "bg-gradient-to-r from-green-500 via-green-600 to-green-700 hover:from-green-600 hover:via-green-700 hover:to-green-800 text-white",
        "hover:shadow-green-200/50"
      );
    }

    const portalShadow = {
      admin: "hover:shadow-purple-200/50",
      delivery: "hover:shadow-orange-200/50"
    }[normalizedPortal] || "";

    return cn(
      baseClass,
      `bg-gradient-to-r ${safeColors.gradient} hover:opacity-90 text-white`,
      portalShadow
    );
  };

  return {
    normalizedPortal,
    safeColors,
    currentLogo,
    getHref,
    getCardShadowClass,
    getInputFocusClass,
    getButtonClass,
    placeholder: PORTAL_CONFIG.placeholders[normalizedPortal],
    emailLabel: PORTAL_CONFIG.emailLabels[normalizedPortal],
    submitText: PORTAL_CONFIG.submitTexts[normalizedPortal]
  };
};

// Removed unused helper function

// Removed unused components - now integrated directly in main component

// Componente principal
export const AuthUI: React.FC<AuthUIProps> = ({
  userType,
  title,
  description,
  onSubmit,
  onGoogleSignIn,
  isLoading,
  icon,
  showSignup = true,
  additionalInfo
}) => {
  const { portal, colors } = usePortalTheme();
  const config = useAuthUIConfig(userType, portal, colors);

  const form = useForm<AuthFormData>({
    resolver: zodResolver(authFormSchema),
    defaultValues: { email: "", password: "" },
  });

  console.info('AuthUI Debug:', { portal, colors, userType });

  // Obtener colores según el portal
  const getPortalColors = () => {
    switch (config.normalizedPortal) {
      case 'admin':
        return {
          focus: 'focus:ring-blue-500 focus:border-blue-500',
          button: 'bg-blue-600 hover:bg-blue-700',
          buttonFocus: 'focus:ring-blue-500',
          link: 'text-blue-400 hover:text-blue-300'
        };
      case 'delivery':
        return {
          focus: 'focus:ring-orange-500 focus:border-orange-500',
          button: 'bg-orange-600 hover:bg-orange-700',
          buttonFocus: 'focus:ring-orange-500',
          link: 'text-orange-400 hover:text-orange-300'
        };
      case 'repartidores':
        return {
          focus: 'focus:ring-green-500 focus:border-green-500',
          button: 'bg-green-600 hover:bg-green-700',
          buttonFocus: 'focus:ring-green-500',
          link: 'text-green-400 hover:text-green-300'
        };
      default:
        return {
          focus: 'focus:ring-blue-500 focus:border-blue-500',
          button: 'bg-blue-600 hover:bg-blue-700',
          buttonFocus: 'focus:ring-blue-500',
          link: 'text-blue-400 hover:text-blue-300'
        };
    }
  };

  const portalColors = getPortalColors();

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
          src={config.currentLogo}
          alt={`BeFast ${config.normalizedPortal} Logo`}
          width={120}
          height={80}
          className="mx-auto h-20 w-auto object-contain drop-shadow-lg filter brightness-0 invert mb-6"
          priority
        />
        <h2 className="mt-6 text-3xl font-extrabold text-white">{title}</h2>
        <p className="mt-2 text-sm text-gray-400">{description}</p>
      </div>

      {/* Form Container */}
      <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-sm font-medium text-gray-300">
                      {config.emailLabel}
                    </FormLabel>
                    <div className="mt-1">
                      <Input
                        {...field}
                        type="email"
                        placeholder={config.placeholder}
                        disabled={isLoading}
                        className={`appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none ${portalColors.focus} sm:text-sm bg-gray-700 text-white`}
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password Field */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-sm font-medium text-gray-300">
                      Contraseña
                    </FormLabel>
                    <div className="mt-1">
                      <Input
                        {...field}
                        type="password"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        disabled={isLoading}
                        className={`appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none ${portalColors.focus} sm:text-sm bg-gray-700 text-white`}
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
                  disabled={isLoading || !form.formState.isValid}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${portalColors.button} focus:outline-none focus:ring-2 focus:ring-offset-2 ${portalColors.buttonFocus} focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isLoading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Verificando...
                    </>
                  ) : (
                    config.submitText
                  )}
                </Button>
              </div>
            </form>
          </Form>

          {/* Forgot Password Link */}
          <div className="mt-4 text-center">
            <Link 
              href={config.getHref('forgot-password')} 
              className={`text-sm hover:underline transition-colors ${portalColors.link}`}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {/* Sign Up Link - Only for delivery and repartidores */}
          {showSignup && config.normalizedPortal !== 'admin' && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-400">
                ¿No tienes cuenta?{' '}
                <Link 
                  href={config.getHref('signup')} 
                  className={`font-semibold hover:underline transition-colors ${portalColors.link}`}
                >
                  Regístrate ahora
                </Link>
              </p>
            </div>
          )}

          {/* Google Sign In - if provided */}
          {onGoogleSignIn && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-600" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-gray-800 px-2 text-gray-400">O continúa con</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={onGoogleSignIn}
                disabled={isLoading}
                className="w-full mt-4 bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-gray-500"
              >
                {isLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                ) : (
                  <>
                    <GoogleIcon />
                    <span className="ml-2">Continuar con Google</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <Link href="/" className={`font-medium ${portalColors.link}`}>
            ← Volver al portal
          </Link>
        </div>

        {/* Support Contact */}
        {config.normalizedPortal !== 'admin' && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-400">¿Necesitas ayuda?</p>
            <p className="text-sm">
              <a
                href="mailto:soporte@befastapp.com.mx"
                className={`hover:underline transition-colors ${portalColors.link}`}
              >
                Contactar Soporte Técnico
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
