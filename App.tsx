// App principal de BeFast GO
import React, { useEffect, useState } from 'react';
import { StatusBar, Alert } from 'react-native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { initializeFirebase, setupNotificationListeners } from './src/config/firebase';
import NotificationHandler from './src/components/NotificationHandler';

const App: React.FC = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Inicializar Firebase
      const firebaseInitialized = await initializeFirebase();
      if (!firebaseInitialized) {
        Alert.alert('Error', 'No se pudo inicializar Firebase');
        return;
      }

      // Configurar listeners de notificaciones
      setupNotificationListeners();

      setReady(true);
      console.log('BeFast GO initialized successfully');
    } catch (error) {
      console.error('Error initializing app:', error);
      Alert.alert('Error', 'Error al inicializar la aplicación');
    }
  };

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar
          barStyle="light-content"
          backgroundColor="#FF6B35"
          translucent={false}
        />
        {ready && <NotificationHandler />}
        <AppNavigator />
        <Toast />
      </SafeAreaProvider>
    </Provider>
  );
};

export default App;
