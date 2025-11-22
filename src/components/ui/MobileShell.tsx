import React from 'react';
import { View, StyleSheet } from 'react-native';

/**
 * MobileShell
 *
 * Lightweight layout wrapper. Place app-level floating UI like FloatingButtons/NotificationContainer.
 */
const MobileShell: React.FC<{ children?: React.ReactNode }>= ({ children }) => {
  return <View style={styles.container}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default MobileShell;
