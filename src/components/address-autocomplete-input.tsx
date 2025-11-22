'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from "@/lib/utils";

// Hook para cargar Google Maps script (polling seguro)
function useGoogleMapsScript() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkGoogleMaps = () => {
      return typeof window !== 'undefined' &&
        window.google &&
        window.google.maps &&
        window.google.maps.places;
    };

    if (checkGoogleMaps()) {
      setIsReady(true);
      setIsLoading(false);
      setError(null);
      return;
    }

    const interval = setInterval(() => {
      if (checkGoogleMaps()) {
        setIsReady(true);
        setIsLoading(false);
        setError(null);
        clearInterval(interval);
      }
    }, 100);

    const timeout = setTimeout(() => {
      if (!isReady) {
        setError('Google Maps API no se cargó correctamente');
        setIsLoading(false);
        clearInterval(interval);
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isReady]);

  return { isReady, error, isLoading };
}

interface AddressAutocompleteInputProps extends Omit<React.ComponentProps<'input'>, 'onChange'> {
  onValueChange: (value: string) => void;
  onPlaceSelected: (place: any) => void;
  value?: string;
}

export function AddressAutocompleteInput({
  onValueChange,
  onPlaceSelected,
  value,
  ...props
}: AddressAutocompleteInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const isSelectingRef = useRef(false);
  const { isReady, error, isLoading } = useGoogleMapsScript();
  const [inputValue, setInputValue] = useState(value || '');
  const lastSelectedRef = useRef<string>(value || '');

  // Sincronizar prop value
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value || '');
      lastSelectedRef.current = value || '';
    }
  }, [value]);

  useEffect(() => {
    if (!isReady || !inputRef.current || autocompleteRef.current) return;
    if (!window.google || !window.google.maps) return;

    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['geocode', 'establishment'],
      componentRestrictions: { country: 'mx' },
      fields: ['address_component', 'formatted_address', 'geometry', 'name', 'place_id'],
    });

    const listener = autocompleteRef.current.addListener('place_changed', () => {
      isSelectingRef.current = true;
      const place = autocompleteRef.current?.getPlace();
      if (place && place.formatted_address) {
        setInputValue(place.formatted_address);
        lastSelectedRef.current = place.formatted_address;
        onValueChange(place.formatted_address);
        onPlaceSelected(place);
      }
      setTimeout(() => { isSelectingRef.current = false; }, 200);
    });

    return () => {
      if (listener) listener.remove();
      autocompleteRef.current = null;
    };
  }, [isReady, onPlaceSelected, onValueChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    // No llamar a onValueChange aquí para evitar disparos innecesarios (solo en blur o select)
  };

  // Estado de error
  if (error) {
    return (
      <div className="relative">
        <input
          disabled
          value=""
          className={cn(
            "w-full min-w-0 rounded-xl py-3 px-4 text-base bg-red-50 border border-red-200 text-red-600 placeholder:text-red-400 focus:outline-none transition",
            props.className
          )}
          id={props.id}
          placeholder="Error: Google Maps no disponible"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
          <span className="text-red-500 text-lg">⚠️</span>
        </div>
      </div>
    );
  }

  // Estado de carga
  if (isLoading) {
    return (
      <div className="relative">
        <input
          disabled
          value=""
          className={cn(
            "w-full min-w-0 rounded-xl py-3 px-4 text-base bg-gray-50 border border-gray-200 placeholder:text-gray-400 focus:outline-none transition",
            props.className
          )}
          id={props.id}
          placeholder="Cargando direcciones..."
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  const { className, ...restProps } = props;

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={() => {
          setTimeout(() => {
            if (!isSelectingRef.current && inputValue !== lastSelectedRef.current) {
              onValueChange(inputValue);
            }
          }, 220);
        }}
        disabled={!isReady || props.disabled}
        placeholder={props.placeholder || "Ingresa una dirección..."}
        className={cn(
          "w-full min-w-0 rounded-xl py-3 px-4 text-base bg-background border border-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition",
          className
        )}
        {...restProps}
      />
      {isReady && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
          <span className="text-green-500 text-lg">✓</span>
        </div>
      )}
    </div>
  );
}