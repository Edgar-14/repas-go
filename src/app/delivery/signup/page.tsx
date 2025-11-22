
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { CustomCheckbox } from '@/components/ui/custom-checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AddressAutocompleteInput } from '@/components/address-autocomplete-input';
import { User, Mail, Lock, Building, Phone, MapPin, ArrowLeft } from 'lucide-react';
import { WelcomeChatbot } from '@/components/chat';

let functions: any = null;
if (app) {
    functions = getFunctions(app);
} else {
    console.warn('Firebase app no está inicializada en la página de registro.');
}

const InteractiveMapComponent = ({ place }: { place: any | null }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<any>(null);
    const [marker, setMarker] = useState<any>(null);

    useEffect(() => {
        if (mapRef.current && !map && window.google && window.google.maps) {
            const mapOptions: any = {
                center: { lat: 19.2433, lng: -103.724 },
                zoom: 12,
                disableDefaultUI: true,
                gestureHandling: 'cooperative',
            };
            const googleMap = new window.google.maps.Map(mapRef.current, mapOptions);
            setMap(googleMap);
        }
    }, [mapRef]);

    useEffect(() => {
        if (map && place && place.geometry && place.geometry.location) {
            if (marker) {
                marker.setPosition(place.geometry.location);
            } else if (window.google && window.google.maps) {
                const newMarker = new window.google.maps.Marker({
                    position: place.geometry.location,
                    map: map,
                    title: place.name,
                });
                setMarker(newMarker);
            }
            map.setCenter(place.geometry.location);
            map.setZoom(16);
        }
    }, [map, place, marker]);

    return <div ref={mapRef} className="h-full w-full rounded-lg" />;
};

export default function DeliverySignupPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    
    const [contactName, setContactName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [businessPhone, setBusinessPhone] = useState('');
    const [businessAddress, setBusinessAddress] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [privacyAccepted, setPrivacyAccepted] = useState(false);
    const [selectedPlace, setSelectedPlace] = useState<any>(null);
    
    // Session Recovery - Load saved data on mount
    useEffect(() => {
        try {
            const savedData = localStorage.getItem('businessSignupData');
            if (savedData) {
                const data = JSON.parse(savedData);
                setContactName(data.contactName || '');
                setBusinessName(data.businessName || '');
                setBusinessPhone(data.businessPhone || '');
                setBusinessAddress(data.businessAddress || '');
                // Don't restore email/password for security
                
                toast({
                    title: 'Datos recuperados',
                    description: 'Hemos restaurado tus datos previamente ingresados.',
                });
            }

            const failedRegistration = localStorage.getItem('failedRegistration');
            if (failedRegistration) {
                const data = JSON.parse(failedRegistration);
                toast({
                    title: 'Registro previo detectado',
                    description: 'Parece que hubo un problema con tu registro anterior. Intenta nuevamente.',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error loading saved registration data:', error);
        }
    }, [toast]);

    // Auto-save form data as user types (debounced)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (contactName || businessName || businessPhone || businessAddress) {
                try {
                    localStorage.setItem('businessSignupData', JSON.stringify({
                        contactName,
                        businessName,
                        businessPhone,
                        businessAddress,
                        savedAt: new Date().toISOString()
                    }));
                } catch (error) {
                    console.error('Error saving form data:', error);
                }
            }
        }, 1000); // Save after 1 second of inactivity

        return () => clearTimeout(timeoutId);
    }, [contactName, businessName, businessPhone, businessAddress]);
    
    // Función para normalizar las coordenadas
    const getCoordinates = (placeDetails: any) => {
      if (!placeDetails?.geometry?.location) return null;
      
      const { location } = placeDetails.geometry;
      
      const lat = typeof location.lat === 'function' ? location.lat() : location.lat;
      const lng = typeof location.lng === 'function' ? location.lng() : location.lng;
      
      return { lat, lng };
    };

    const handleSignup = async (event: React.FormEvent) => {
        event.preventDefault();
        
        if (!termsAccepted || !privacyAccepted) {
            toast({
                variant: 'destructive',
                title: 'Aceptación Requerida',
                description: 'Debes aceptar los términos y las políticas de privacidad.',
            });
            return;
        }
        
        if (password.length < 6) {
            toast({
                variant: 'destructive',
                title: 'Contraseña muy corta',
                description: 'La contraseña debe tener al menos 6 caracteres.',
            });
            return;
        }

        if (businessPhone.length !== 10) {
            toast({
                variant: 'destructive',
                title: 'Teléfono inválido',
                description: 'El teléfono debe tener exactamente 10 dígitos.',
            });
            return;
        }
        
        setIsLoading(true);

        try {
            if (!functions) {
                throw new Error('Firebase Functions no está disponible');
            }
            
            const registerBusiness = httpsCallable(functions, 'registerBusiness');
            
            // Prepara los detalles del lugar con coordenadas normalizadas
            const placeDetailsPayload = selectedPlace ? {
              ...selectedPlace,
              geometry: {
                ...selectedPlace.geometry,
                location: getCoordinates(selectedPlace),
              }
            } : null;
            
            const result = await registerBusiness({
                email,
                password,
                businessName,
                contactName,
                phone: businessPhone,
                address: businessAddress,
                placeDetails: placeDetailsPayload,
            });

            const data = result.data as any;

            if (data.success) {
                // Clear saved form data on successful registration
                try {
                    localStorage.removeItem('businessSignupData');
                    localStorage.removeItem('failedRegistration');
                } catch (storageError) {
                    console.error("Could not clear localStorage:", storageError);
                }

                toast({
                    title: '¡Registro Exitoso!',
                    description: 'Se ha enviado un código de verificación a tu email. Verifica tu cuenta para continuar.',
                });
                
                localStorage.setItem('pendingVerificationEmail', email);
                
                router.push(`/delivery/verify-code?email=${encodeURIComponent(email)}`);
            } else {
                // Enhanced error handling for common issues
                let errorMessage = data.message || 'Error en el registro';
                
                if (errorMessage.includes('Maps API')) {
                    errorMessage = 'Error al validar la dirección. Por favor, verifica que la dirección sea correcta e intenta nuevamente.';
                } else if (errorMessage.includes('already exists')) {
                    errorMessage = 'Ya existe una cuenta con este correo electrónico. Intenta iniciar sesión.';
                } else if (errorMessage.includes('phone')) {
                    errorMessage = 'El número de teléfono no es válido. Asegúrate de usar 10 dígitos.';
                }
                
                throw new Error(errorMessage);
            }

        } catch (error: any) {
            console.error("Error en el registro:", error);
            
            // Detailed error logging for debugging
            const errorDetails = {
                message: error.message,
                code: error.code,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                formData: { email, businessName, contactName }
            };
            
            console.error("Registration error details:", errorDetails);
            
            toast({
                variant: 'destructive',
                title: '❌ Error en el Registro',
                description: `${error.message || 'Error inesperado'}. Si el problema persiste, contacta a soporte@befastapp.com.mx`,
                duration: 8000,
            });
            
            // Save failed registration for recovery
            try {
                localStorage.setItem('failedRegistration', JSON.stringify({
                    ...errorDetails,
                    attemptedAt: new Date().toISOString()
                }));
            } catch (storageError) {
                console.error("Could not save to localStorage:", storageError);
            }
            
        } finally {
            setIsLoading(false);
        }
    };
    
    const handlePlaceSelected = useCallback((place: any | null) => {
        if (place && place.formatted_address) {
            setBusinessAddress(place.formatted_address);
            setSelectedPlace(place);
        } else {
            setSelectedPlace(place);
        }
    }, []);

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

            <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md text-center">
                <Image
                    src="/logo-befast-delivery.svg"
                    alt="BeFast Delivery Logo"
                    width={120}
                    height={80}
                    className="mx-auto h-16 sm:h-20 w-auto object-contain drop-shadow-lg filter brightness-0 invert mb-6"
                    priority
                />
                <h2 className="mt-6 text-3xl font-extrabold text-white">Registro para Negocios</h2>
                <p className="mt-2 text-sm text-gray-400">Crea una cuenta para empezar a gestionar tus entregas.</p>
            </div>

            <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">

                    <form onSubmit={handleSignup} className="space-y-6">
                        <div>
                            <label htmlFor="contactName" className="block text-sm font-medium text-gray-300">
                                Nombre del Contacto
                            </label>
                            <div className="mt-1">
                                <input
                                    id="contactName"
                                    type="text"
                                    required
                                    value={contactName}
                                    onChange={e => setContactName(e.target.value)}
                                    disabled={isLoading}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm bg-gray-700 text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="businessName" className="block text-sm font-medium text-gray-300">
                                Nombre del Negocio
                            </label>
                            <div className="mt-1">
                                <input
                                    id="businessName"
                                    type="text"
                                    required
                                    value={businessName}
                                    onChange={e => setBusinessName(e.target.value)}
                                    disabled={isLoading}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm bg-gray-700 text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                                Correo Electrónico
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    disabled={isLoading}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm bg-gray-700 text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                                Contraseña
                            </label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    disabled={isLoading}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm bg-gray-700 text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="businessPhone" className="block text-sm font-medium text-gray-300">
                                Teléfono del Negocio
                            </label>
                            <div className="mt-1">
                                <input
                                    id="businessPhone"
                                    type="tel"
                                    required
                                    value={businessPhone}
                                    onChange={e => setBusinessPhone(e.target.value)}
                                    disabled={isLoading}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm bg-gray-700 text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="businessAddress" className="block text-sm font-medium text-gray-300">
                                Dirección del Negocio
                            </label>
                            <div className="mt-1">
                                <AddressAutocompleteInput 
                                    id="businessAddress" 
                                    placeholder="Escribe tu dirección de recogida"
                                    required 
                                    className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm bg-gray-700 text-white" 
                                    value={businessAddress} 
                                    onValueChange={setBusinessAddress} 
                                    onPlaceSelected={handlePlaceSelected} 
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-start space-x-3">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    checked={termsAccepted}
                                    onChange={(e) => setTermsAccepted(e.target.checked)}
                                    className="mt-1 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-600 rounded bg-gray-700"
                                />
                                <label htmlFor="terms" className="text-sm text-gray-300">
                                    Acepto los{' '}
                                    <Link 
                                        href="/contract" 
                                        target="_blank"
                                        className="text-orange-400 hover:text-orange-300 underline font-medium"
                                    >
                                        términos y condiciones
                                    </Link>
                                </label>
                            </div>
                            <div className="flex items-start space-x-3">
                                <input
                                    type="checkbox"
                                    id="privacy"
                                    checked={privacyAccepted}
                                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                                    className="mt-1 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-600 rounded bg-gray-700"
                                />
                                <label htmlFor="privacy" className="text-sm text-gray-300">
                                    Acepto las{' '}
                                    <Link 
                                        href="/privacy" 
                                        target="_blank"
                                        className="text-orange-400 hover:text-orange-300 underline font-medium"
                                    >
                                        políticas de privacidad
                                    </Link>
                                </label>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading || !termsAccepted || !privacyAccepted}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Creando Cuenta...' : 'Registrar'}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-400">
                        ¿Ya tienes una cuenta?{' '}
                        <Link href="/delivery/login" className="font-medium text-orange-400 hover:text-orange-300">
                            Inicia sesión
                        </Link>
                    </p>
                </div>
            </div>

            {/* Chat de Bienvenida */}
            <WelcomeChatbot />
        </div>
    );
}