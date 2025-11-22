'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Footer } from '@/components/footer';
import AnimatedBackground from './AnimateBackground';
import { motion } from 'framer-motion';
import { WelcomeButton } from './WelcomeButton';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { useBreakpoints } from '@/hooks/use-mobile';
import { ShoppingCart, Package, Bike } from 'lucide-react';
import { WelcomeChatbot } from '@/components/chat';

export default function WelcomePage() {
  const { isMobile, isTablet } = useBreakpoints();

  return (
    <>
      <div className="relative w-full py-20 sm:py-32 bg-gray-900 flex items-center justify-center overflow-hidden min-h-screen font-montserrat">
        {/* Fondo con imagen y overlay */}
        <div className="absolute inset-0">
          <img 
            src="/Diseño sin título (1).jpg" 
            alt="BeFast Delivery background" 
            className="w-full h-full object-cover opacity-30 blur-sm"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent"></div>
        </div>

        {/* Contenido principal */}
        <div className="relative text-center px-4 sm:px-6 lg:px-8 z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="w-full"
          >
            
            {/* Logo */}
            <motion.div 
              initial={{ y: -20, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mb-6 flex flex-col items-center gap-2"
            >
              <Link href="/" className="inline-block">
                <Image
                  src="/befast-logo.svg"
                  alt="Logotipo de BeFast"
                  width={120}
                  height={80}
                  className="mx-auto h-20 w-auto object-contain drop-shadow-lg filter brightness-0 invert"
                  priority
                />
              </Link>
            </motion.div>

            {/* Título principal */}
            <motion.h1 
              initial={{ y: -10, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-6"
            >
              BeFast Ecosistema
            </motion.h1>

            {/* Subtítulo */}
            <motion.p 
              initial={{ y: 10, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              transition={{ duration: 0.6, delay: 0.6 }}
              className="max-w-2xl mx-auto text-lg text-gray-300 mb-12"
            >
              Elige tu portal para comenzar.
            </motion.p>

            {/* Cards con efecto glassmorphism */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              transition={{ duration: 0.6, delay: 0.7 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
            >
              {/* BeFast Market */}
              <Link 
                href="https://order.befastmarket.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group block p-8 bg-white/10 rounded-xl backdrop-blur-lg border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="bg-amber-500 p-3 rounded-full">
                    <ShoppingCart className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="mt-4 text-xl font-bold text-white">BeFast EATS</h2>
                  <p className="mt-2 text-gray-300 text-sm">Proximamente.</p>
                </div>
              </Link>

              {/* BeFast Delivery */}
              <Link 
                href="/delivery/login"
                className="group block p-8 bg-white/10 rounded-xl backdrop-blur-lg border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="bg-blue-500 p-3 rounded-full">
                    <Package className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="mt-4 text-xl font-bold text-white">BeFast Delivery</h2>
                  <p className="mt-2 text-gray-300 text-sm">Portal para Negocios.</p>
                </div>
              </Link>

              {/* BeFast Repartidores */}
              <Link 
                href="/repartidores/login"
                className="group block p-8 bg-white/10 rounded-xl backdrop-blur-lg border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="bg-green-500 p-3 rounded-full">
                    <Bike className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="mt-4 text-xl font-bold text-white">BeFast Repartidores</h2>
                  <p className="mt-2 text-gray-300 text-sm">Portal para Repartidores.</p>
                </div>
              </Link>
            </motion.div>

          </motion.div>
        </div>

        {/* Chat de Bienvenida */}
        <WelcomeChatbot />
      </div>

      {/* Footer */}
      <Footer />
    </>
  );
}