import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<any>();

export function navigate(name: string, params?: any) {
  try {
    if (navigationRef.isReady()) {
      (navigationRef as any).navigate(name, params);
    } else {
      console.warn('[NavigationService] Navigation not ready for', name, params);
    }
  } catch (e) {
    console.warn('[NavigationService] navigate error', e);
  }
}
