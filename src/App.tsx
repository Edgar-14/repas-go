import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { store } from './store';
import AppNavigator from './navigation/AppNavigator';
import { initializeFirebase, setupPushNotifications, setupNotificationListeners } from './config/firebase';
import { setGoogleMapsApiKey } from './config/runtime';

const App: React.FC = () => {
  useEffect(() => {
    const initializeApp = async () => {
      // Configurar Google Maps API Key
      setGoogleMapsApiKey('AIzaSyBQJ9X8K8K8K8K8K8K8K8K8K8K8K8K8K8K'); // Reemplazar con tu key real
      
      // Inicializar Firebase
      await initializeFirebase();
      
      // Configurar notificaciones push
      await setupPushNotifications();
      
      // Configurar listeners de notificaciones
      setupNotificationListeners();
    };

    initializeApp();
  }, []);

  return (
    <Provider store={store}>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </Provider>
  );
};

export default App;