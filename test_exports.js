// Test rápido para verificar las exportaciones
const { setupNotificationListeners, setupPushNotifications } = require('./src/config/firebase');

console.log('setupNotificationListeners:', typeof setupNotificationListeners);
console.log('setupPushNotifications:', typeof setupPushNotifications);

if (typeof setupNotificationListeners === 'function') {
  console.log('✅ setupNotificationListeners está exportada correctamente');
} else {
  console.log('❌ setupNotificationListeners NO está exportada');
}

if (typeof setupPushNotifications === 'function') {
  console.log('✅ setupPushNotifications está exportada correctamente');
} else {
  console.log('❌ setupPushNotifications NO está exportada');
}
