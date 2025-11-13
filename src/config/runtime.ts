// runtime.ts
// Este archivo contiene configuraciones que se establecen en tiempo de ejecución.

interface RuntimeConfig {
  googleMapsApiKey: string | null;
}

// Creamos un objeto de configuración global con valores por defecto.
export const runtimeConfig: RuntimeConfig = {
  googleMapsApiKey: null,
};

// Función para actualizar la configuración.
export const setGoogleMapsApiKey = (apiKey: string) => {
  runtimeConfig.googleMapsApiKey = apiKey;
};
