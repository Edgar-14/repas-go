import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

/**
 * FloatingButtons
 *
 * Minimal placeholder with two sample buttons. Replace with real implementation.
 */
const FloatingButtons: React.FC<{ onPrimaryPress?: () => void; onSecondaryPress?: () => void }>
= ({ onPrimaryPress, onSecondaryPress }) => {
  return (
    <View pointerEvents="box-none" style={styles.container}>
      <TouchableOpacity style={[styles.button, styles.primary]} onPress={onPrimaryPress}>
        <Text style={styles.label}>Primary</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, styles.secondary]} onPress={onSecondaryPress}>
        <Text style={styles.label}>Secondary</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    alignItems: 'flex-end',
    gap: 12,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 2,
  },
  primary: {
    backgroundColor: '#FF6B35',
  },
  secondary: {
    backgroundColor: '#333',
  },
  label: {
    color: 'white',
    fontWeight: '600',
  },
});

export default FloatingButtons;
