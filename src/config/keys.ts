import { GOOGLE_MAPS_API_KEY as KEY_FROM_ENV } from '@env';
import { GOOGLE_MAPS_API_KEY_SOURCE } from './env';

// -----------------------------------------------------------------------------
// 🛑 IMPORTANTE: CLAVE PARA JAVASCRIPT
// -----------------------------------------------------------------------------
// Esta clave la usan los servicios de JS (MapViewDirections, Geocoding, Places).
//
// ⚠️ ADVERTENCIA: Esta clave NO es suficiente para que el mapa se vea.
// El componente <MapView> (usado en TrackingMap.tsx) necesita la clave
// configurada NATIVAMENTE en Android e iOS para renderizar los tiles del mapa.
//
// Ver:
// 1. android/app/src/main/AndroidManifest.xml
// 2. ios/[Proyecto]/AppDelegate.m
// -----------------------------------------------------------------------------

export const GOOGLE_MAPS_API_KEY = (KEY_FROM_ENV || GOOGLE_MAPS_API_KEY_SOURCE || '').trim();

export function hasMapsKey() { return !!GOOGLE_MAPS_API_KEY; }

export function initMapsKey() {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('[Maps] GOOGLE_MAPS_API_KEY vacío, verifica tu archivo .env o env.ts');
  } else {
    console.log('[Maps] API Key de JavaScript inicializada');
  }
}