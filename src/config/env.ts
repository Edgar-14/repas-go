// Este archivo simula la carga de variables de entorno para React Native.
// En un proyecto real, esto se manejaría con una librería como react-native-config
// o react-native-dotenv.

// 🚨 ADVERTENCIA DE SEGURIDAD 🚨
// NO COLOQUES TU API KEY DIRECTAMENTE EN ESTE ARCHIVO.
// La clave "AIzaSy..." que tenías aquí está expuesta y es un riesgo de seguridad.
//
// LA FORMA CORRECTA:
// 1. Crea un archivo llamado ".env" en la raíz de tu proyecto.
// 2. Añade tu clave ahí:
//    GOOGLE_MAPS_API_KEY="AIzaSy...TuClaveRealVaAqui"
//
// La librería 'react-native-dotenv' (que usas en keys.ts) leerá ese archivo .env
// de forma segura.

// Dejamos esto como un fallback vacío o con un placeholder.
export const GOOGLE_MAPS_API_KEY_SOURCE = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'PLACEHOLDER_KEY_MOVIDA_A_DOTENV';
