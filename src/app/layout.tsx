import type { Metadata } from "next";
import Script from 'next/script';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as HotToaster } from "react-hot-toast";
import { AuthProvider } from '@/hooks/useAuth';
import "./globals.css";

export const metadata: Metadata = {
  title: "BeFast",
  description: "Aplicación BeFast - Plataforma de delivery",
  icons: {
    icon: '/befast-logo-admin.svg',
    shortcut: '/befast-logo-admin.svg',
    apple: '/befast-logo-admin.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="facebook-domain-verification" content="vghburnfio6ag9njur0gxxjoueo5tq" />
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&v=weekly&language=es&region=MX`}
          strategy="beforeInteractive"
        />
      </head>
      <body className="bg-background text-foreground font-montserrat min-h-screen antialiased safe-area-px">
        <AuthProvider>
          {children}
        </AuthProvider>
        
        <Toaster />
        <HotToaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  );
}