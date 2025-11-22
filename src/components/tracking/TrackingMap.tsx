'use client';

import { useEffect, useRef } from 'react';

interface TrackingMapProps {
  customer: {
    latitude: number;
    longitude: number;
    name: string;
  };
  business: {
    latitude: number;
    longitude: number;
    name: string;
  };
  driver?: {
    latitude?: number;
    longitude?: number;
    name: string;
  };
}

export default function TrackingMap({ customer, business, driver }: TrackingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    const map = new google.maps.Map(mapRef.current, {
      zoom: 13,
      center: { lat: customer.latitude, lng: customer.longitude },
    });

    // Marcador del cliente
    new google.maps.Marker({
      position: { lat: customer.latitude, lng: customer.longitude },
      map,
      title: `Entrega: ${customer.name}`,
    });

    // Marcador del negocio
    new google.maps.Marker({
      position: { lat: business.latitude, lng: business.longitude },
      map,
      title: `Recogida: ${business.name}`,
    });

    // Marcador del repartidor
    if (driver?.latitude && driver?.longitude) {
      new google.maps.Marker({
        position: { lat: driver.latitude, lng: driver.longitude },
        map,
        title: `Repartidor: ${driver.name}`,
      });
    }

  }, [customer, business, driver]);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-64 rounded-lg border"
    />
  );
}