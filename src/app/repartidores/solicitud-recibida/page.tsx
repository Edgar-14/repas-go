"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SolicitudRecibidaPage() {
  const router = useRouter();

  return (
  <div className="relative min-h-screen w-full overflow-hidden font-body bg-gray-100">
      <div className="relative z-10 flex min-h-screen w-full flex-col items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl border p-8 text-center shadow-2xl bg-card">
          <div className="w-full flex items-center justify-start mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
              className="text-green-600 hover:text-green-700"
            >
              <ArrowLeft />
            </Button>
          </div>

          <div className="mb-6">
            <Link href="/" className="mb-4 inline-block">
              <Image
                src="/logo-befast-repartidores.svg"
                alt="Logotipo de BeFast Repartidores"
                width={120}
                height={80}
                className="mx-auto h-20 w-auto object-contain"
              />
            </Link>
          </div>

          <div className="mb-6">
            <CheckCircle className="mx-auto h-16 w-16 text-green-600 mb-4" />
            <h1 className="mb-2 text-2xl font-bold text-foreground">
              ¡Solicitud Recibida!
            </h1>
            <p className="text-sm text-foreground/70">
              Tu registro de repartidor ha sido enviado para revisión.
            </p>
          </div>

          <div className="space-y-4 text-left text-sm text-foreground/80">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border">
              <h3 className="font-semibold text-foreground mb-2">¿Qué sigue?</h3>
              <ul className="space-y-2">
                <li>• Nuestro equipo revisará tu documentación</li>
                <li>• Te contactaremos en máximo 48 horas hábiles</li>
                <li>• Si tu solicitud es aprobada, recibirás un correo para activar tu cuenta</li>
              </ul>
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border">
              <h3 className="font-semibold text-foreground mb-2">Importante</h3>
              <p>
                Mantén tu documentación actualizada y revisa tu correo electrónico regularmente.
                Si tienes dudas, contacta a nuestro equipo de soporte.
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div className="text-center">
              <p className="text-sm text-foreground/70 mb-2">¿Necesitas ayuda?</p>
              <div className="space-x-4">
                <a 
                  href="https://wa.me/5213121905494" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  WhatsApp Soporte
                </a>
                <span className="text-foreground/30">•</span>
                <a 
                  href="mailto:soporte@befastapp.com.mx"
                  className="text-sm text-primary hover:underline"
                >
                  Email Soporte
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
