"use client";
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { AddressAutocompleteInput } from '@/components/address-autocomplete-input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/collections';
import Link from 'next/link';
import { MapPin, Building, Loader2 } from 'lucide-react';
import withAuth from '@/components/auth/withAuth';
import { useAuth } from '@/hooks/useAuth';
import { useBusinessData } from '@/hooks/useRealtimeData';
import { Section } from '@/components/layout/primitives';

function DeliverySettingsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Use real-time business data
  const { business, loading, error } = useBusinessData(user?.uid || null);
  
  const [saving, setSaving] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessCoords, setBusinessCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [businessPhone, setBusinessPhone] = useState('');

  const handleAddressChange = (value: string) => {
    setBusinessAddress(value);
  };

  const handlePlaceSelected = (place: any) => {
    if (place && place.formatted_address) {
      setBusinessAddress(place.formatted_address || '');
      if (place.geometry && place.geometry.location) {
        setBusinessCoords({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        });
      }
    }
  };

  // Populate form with real-time business data
  useEffect(() => {
    if (business) {
      setBusinessName(business.businessName || '');
      setBusinessAddress(business.address || '');
      setBusinessPhone(business.phone || '');
      if (business.coordinates) {
        setBusinessCoords(business.coordinates);
      }
    }
  }, [business]);

  // Handle real-time data errors
  useEffect(() => {
    if (error) {
      console.error('Error loading business data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo cargar la información del negocio.',
      });
    }
  }, [error, toast]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (!user) throw new Error('No autenticado');
      
      // Primero verificar si el documento existe en BUSINESS
      let docRef = doc(db, COLLECTIONS.BUSINESSES, user.uid);
      let docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        // Si no existe en BUSINESS, buscar en businesses (minúsculas)
        docRef = doc(db, 'businesses', user.uid);
        docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          throw new Error('No se encontró el perfil del negocio');
        }
      }
      
      await updateDoc(docRef, {
        businessName,
        address: businessAddress,
        phone: businessPhone,
        coordinates: businessCoords || null,
        updatedAt: new Date()
      });
      
      toast({ 
        title: '✅ Configuración actualizada', 
        description: 'Los cambios se han guardado correctamente.' 
      });
    } catch (err) {
      console.error('Error saving settings:', err);
      toast({ 
        title: '❌ Error', 
        description: 'No se pudo guardar la configuración. Intenta de nuevo.' 
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 px-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 sm:w-12 sm:h-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-sm sm:text-base text-slate-600">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      {/* Main Content */}
      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSave} className="space-y-4 sm:space-y-6">
          {/* Información Básica */}
          <div className="bg-gradient-to-br from-orange-50 to-white border border-orange-200 shadow-orange-200/20 rounded-xl p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6 flex items-center text-slate-800">
              <Building className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Información Básica
            </h2>
            
            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
                  Nombre del Negocio *
                </label>
                <Input 
                  value={businessName} 
                  onChange={e => setBusinessName(e.target.value)} 
                  required 
                  disabled={loading || saving}
                  className="w-full text-sm sm:text-base"
                  placeholder="Ej: Restaurante El Buen Sabor"
                />
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
                  Teléfono del Negocio *
                </label>
                <Input 
                  value={businessPhone} 
                  onChange={e => setBusinessPhone(e.target.value)} 
                  required 
                  disabled={loading || saving}
                  className="w-full text-sm sm:text-base"
                  placeholder="Ej: 312 123 4567"
                />
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2 flex items-center">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  Dirección del Negocio *
                </label>
                <AddressAutocompleteInput
                  id="business-address"
                  placeholder="Escribe la dirección de tu negocio"
                  required
                  className="w-full text-sm sm:text-base"
                  value={businessAddress}
                  onValueChange={handleAddressChange}
                  onPlaceSelected={handlePlaceSelected}
                  disabled={loading || saving}
                />
                {businessCoords && (
                  <p className="text-xs text-green-600 mt-1">
                    ✅ Coordenadas: {businessCoords.lat.toFixed(6)}, {businessCoords.lng.toFixed(6)}
                  </p>
                )}
                <p className="text-xs text-slate-500 mt-1">Esta será tu dirección de recogida por defecto</p>
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6">
            <Link href="/delivery/dashboard" className="flex-1 order-2 sm:order-1">
              <Button
                type="button"
                variant="outline"
                className="w-full border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400 h-11 sm:h-12 text-sm sm:text-base"
              >
                Cancelar
              </Button>
            </Link>
            <div className="flex-1 order-1 sm:order-2">
              <Button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-11 sm:h-12 text-sm sm:text-base font-medium"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  'Guardar Cambios'
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default withAuth(DeliverySettingsPage, {
    redirectTo: '/delivery/login',
});
