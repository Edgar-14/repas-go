// Centralized app keys and constants
import { runtimeConfig } from './runtime';

// Exportamos la clave de API desde la configuración en tiempo de ejecución.
// Si es nula, se pasará un string vacío para evitar errores de tipo,
// pero los componentes que la usen (como MapViewDirections) fallarán,
// lo cual será capturado por nuestro ErrorBoundary.
export const GOOGLE_MAPS_API_KEY = runtimeConfig.googleMapsApiKey ?? '';
