import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './package.json';
import notifee from '@notifee/react-native'; // <-- 1. Importa Notifee

// --- 2. REGISTRA LA TAREA DE FONDO ---
// Esto debe ir ANTES del registerComponent
notifee.onBackgroundEvent(async ({ type, detail }) => {
  console.log('Evento de notificación en fondo:', type, detail);
  // Aquí puedes agregar lógica si una notificación se presiona
  // o se descarta mientras la app está cerrada.
});
// ------------------------------------

AppRegistry.registerComponent(appName, () => App);