import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { store } from './store';
import AppNavigator from './navigation/AppNavigator';
import { initializeFirebase, setupPushNotifications, setupNotificationListeners } from './config/firebase';
import { initMapsKey } from './config/keys';

// --- 1. IMPORTAR el navigationRef ---
// Esto es necesario para que NavigationService.ts funcione
import { navigationRef } from './navigation/NavigationService';

const App: React.FC = () => {
  useEffect(() => {
    // --- 2. Preparar variable para la limpieza del listener ---
    let notificationListenerCleanup: (() => void) | undefined;

    const initializeApp = async () => {
      // Configurar Google Maps API Key (unificado por env)
      initMapsKey();

      // Inicializar Firebase
      await initializeFirebase();

      // Configurar notificaciones push
      await setupPushNotifications();

      // --- 3. Capturar la función de limpieza ---
      notificationListenerCleanup = setupNotificationListeners();
    };

    initializeApp();

    // --- 4. Ejecutar la limpieza al desmontar el componente ---
    return () => {
      if (notificationListenerCleanup) {
        notificationListenerCleanup();
      }
    };
  }, []);

  return (
    <Provider store={store}>
      {/* --- 5. Asignar el ref al NavigationContainer --- */}
      <NavigationContainer ref={navigationRef}>
        <AppNavigator />
      </NavigationContainer>
    </Provider>
  );
};

export default App;