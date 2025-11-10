import React from 'react';
import { View, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';

/**
 * NotificationContainer
 *
 * Minimal drop-in container to host global UI notifiers (Toast, Snackbars, etc.).
 * This component is intentionally lightweight so Metro can resolve
 * `./components/ui/NotificationContainer` from App.tsx or other entry points.
 */
const NotificationContainer: React.FC = () => {
  return (
    <View pointerEvents="box-none" style={styles.container}>
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default NotificationContainer;
