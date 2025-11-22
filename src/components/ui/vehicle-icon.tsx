import React from 'react';
import { 
  Bike, 
  Car, 
  Truck, 
  Package,
  Clock,
  MapPin,
  User
} from 'lucide-react';

interface VehicleIconProps {
  vehicleType: string;
  size?: number;
  className?: string;
}

const vehicleIcons = {
  bicycle: Bike,
  motorcycle: Bike,
  car: Car,
  truck: Truck,
  bike: Bike,
  moto: Bike,
  auto: Car,
  van: Truck,
  scooter: Bike
};

const vehicleLabels = {
  bicycle: 'Bicicleta',
  motorcycle: 'Motocicleta',
  car: 'Automóvil',
  truck: 'Camión/Van',
  bike: 'Bicicleta',
  moto: 'Motocicleta',
  auto: 'Automóvil',
  van: 'Van',
  scooter: 'Scooter'
};

export function VehicleIcon({ vehicleType, size = 16, className = '' }: VehicleIconProps) {
  const IconComponent = vehicleIcons[vehicleType as keyof typeof vehicleIcons] || Package;
  
  return <IconComponent size={size} className={className} />;
}

export function getVehicleLabel(vehicleType: string): string {
  return vehicleLabels[vehicleType as keyof typeof vehicleLabels] || vehicleType;
}

// Additional utility icons for the system
export const SystemIcons = {
  Clock,
  MapPin,
  User,
  Package,
  Bike,
  Car,
  Truck
};

export function getVehicleColor(vehicleType: string): string {
  const colors = {
    bicycle: 'text-green-600',
    motorcycle: 'text-blue-600', 
    car: 'text-purple-600',
    truck: 'text-orange-600',
    bike: 'text-green-600',
    moto: 'text-blue-600',
    auto: 'text-purple-600',
    van: 'text-orange-600',
    scooter: 'text-blue-600'
  };
  
  return colors[vehicleType as keyof typeof colors] || 'text-gray-600';
}