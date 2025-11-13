// App principal de BeFast GO
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './src/navigation/NavigationService';
import NotificationHandler from './src/components/NotificationHandler';
import { initializeFirebase, setupNotificationListeners, setupPushNotifications } from './src/config/firebase';
import NotificationService from './src/services/NotificationService';

import { setGoogleMapsApiKey } from './src/config/runtime';
import { GOOGLE_MAPS_API_KEY_FROM_ENV } from './src/config/env'; // Simulando la carga desde el entorno

const App = () => {

  useEffect(() => {
    // --- Configuración de Claves en Tiempo de Ejecución ---
    // En una app real, esta clave vendría de un servicio seguro, no de un archivo.
    // Aquí simulamos la carga de la clave desde el entorno.
    if (GOOGLE_MAPS_API_KEY_FROM_ENV) {
      setGoogleMapsApiKey(GOOGLE_MAPS_API_KEY_FROM_ENV);
    } else {
      console.warn('¡ADVERTENCIA! La clave de API de Google Maps no está configurada.');
    }
    
    const initFirebase = async () => {
      const ok = await initializeFirebase();
      if (ok) {
        setupNotificationListeners();
        await setupPushNotifications().catch(() => {});
        await NotificationService.initialize();
      }
    };
    initFirebase();
  }, []);

  return (
    <Provider store={store}>
      <View style={styles.container}>
        <NavigationContainer ref={navigationRef}>
          <AppNavigator />
          <NotificationHandler />
        </NavigationContainer>
        

      </View>
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
