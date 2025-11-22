
import Link from 'next/link';
import { Instagram, Facebook, Mail, Phone, ShoppingBag, Bike as BikeIcon } from 'lucide-react';
import { Logo } from './logo';

export function Footer() {
    return (
        <footer className="bg-gray-800 text-gray-300">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                {/* 1. Íconos de redes sociales y contacto */}
                <div className="flex flex-wrap justify-center gap-4 mb-8">
                    <a href="https://www.instagram.com/befastmarket/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-base text-gray-300 hover:text-white transition-colors duration-200">
                        <Instagram size={22} />
                    </a>
                    <a href="https://www.facebook.com/befastmarket1/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-base text-gray-300 hover:text-white transition-colors duration-200">
                        <Facebook size={22} />
                    </a>
                    <a href="mailto:soporte@befastapp.com.mx" aria-label="Email" className="text-base text-gray-300 hover:text-white transition-colors duration-200">
                        <Mail size={22} />
                    </a>
                    <a href="https://wa.me/5213121905494" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="text-base text-gray-300 hover:text-white transition-colors duration-200">
                        <Phone size={22} />
                    </a>
                    <Link href="/market" aria-label="Market" className="text-base text-gray-300 hover:text-white transition-colors duration-200">
                        <ShoppingBag size={22} />
                    </Link>
                    <Link href="/delivery" aria-label="Delivery" className="text-base text-gray-300 hover:text-white transition-colors duration-200">
                        <BikeIcon size={22} />
                    </Link>
                </div>
                
                {/* 2. Enlaces legales */}
                <div className="flex justify-center items-center gap-x-6 mb-8">
                    <Link href="/terms" className="text-base text-gray-300 hover:text-white transition-colors duration-200">
                        Términos y Condiciones
                    </Link>
                    <span className="text-gray-400">|</span>
                    <Link href="/privacy" className="text-base text-gray-300 hover:text-white transition-colors duration-200">
                        Política de Privacidad
                    </Link>
                    <span className="text-gray-400">|</span>
                    <Link href="/admin/login" className="text-base text-gray-300 hover:text-white transition-colors duration-200">
                        Admin
                    </Link>
                </div>

                {/* 3. Aviso de Copyright */}
                <div className="border-t border-gray-700 pt-8">
                    <p className="text-base text-gray-400 text-center">
                        © {new Date().getFullYear()} BeFast. Todos los derechos reservados.
                    </p>
                </div>
            </div>
        </footer>
    );
}
