import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<any>();

export function navigate(name: string, params?: any) {
  try {
    if (navigationRef.isReady()) {
      navigationRef.navigate(name as never, params as never);
    } else {
      // En caso de que aún no esté lista la navegación, guardar intento en consola
      console.warn('[NavigationService] Navigation not ready for', name, params);
    }
  } catch (e) {
    console.warn('[NavigationService] navigate error', e);
  }
}
