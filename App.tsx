// App principal de BeFast GO
import React, { useEffect } from 'react'; // <-- 'useState' eliminado, no se usaba
import { View, StyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './src/navigation/NavigationService';
// --- CORRECCIÓN 1: 'setupPushNotifications' eliminado ---
import { initializeFirebase } from './src/config/firebase';
import NotificationService from './src/services/NotificationService';

import { setGoogleMapsApiKey } from './src/config/runtime';
import { GOOGLE_MAPS_API_KEY_SOURCE } from './src/config/env'; // Simulando la carga desde el entorno

const App = () => {

  useEffect(() => {
    // --- Configuración de Claves en Tiempo de Ejecución ---
    if (GOOGLE_MAPS_API_KEY_SOURCE) {
      setGoogleMapsApiKey(GOOGLE_MAPS_API_KEY_SOURCE);
    } else {
      console.warn('¡ADVERTENCIA! La clave de API de Google Maps no está configurada.');
    }

    const initFirebase = async () => {
      const ok = await initializeFirebase();
      if (ok) {
        await NotificationService.initialize();
      }
    };
    initFirebase();

    // --- Limpieza de listeners ---
    return () => {
      // Si en el futuro añadimos un método cleanup, se llamará aquí
    };
  }, []);

  return (
    <Provider store={store}>
      <View style={styles.container}>
        <NavigationContainer ref={navigationRef}>
          <AppNavigator />
          {/* NotificationHandler removido: lógica gestionada en NotificationService */}
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