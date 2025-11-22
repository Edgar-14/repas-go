import React from 'react';
import { Text, StyleSheet } from 'react-native';

interface SimpleIconProps {
  type: 'home' | 'package' | 'wallet' | 'bell' | 'account' | 'arrow-left' | 'arrow-right' | 'check' | 'close' | 'plus' | 'minus' | 'bank' | 'clock' | 'play' | 'pause' | 'search' | 'cog' | 'shield-check' | 'help-circle' | 'logout' | 'file-text' | 'chart-bar' | 'history' | 'credit-card' | 'alert-triangle' | 'shield-alert' | 'message-circle' | 'navigation' | 'dollar-sign' | 'trending-up' | 'trending-down' | 'star' | 'check-circle';
  size?: number;
  color?: string;
}

const SimpleIcon: React.FC<SimpleIconProps> = ({ type, size = 24, color = '#000' }) => {
  const getIconEmoji = () => {
    switch (type) {
      case 'home': return '🏠';
      case 'package': return '📦';
      case 'wallet': return '💰';
      case 'bell': return '🔔';
      case 'account': return '👤';
      case 'arrow-left': return '←';
      case 'arrow-right': return '→';
      case 'check': return '✓';
      case 'close': return '✕';
      case 'plus': return '+';
      case 'minus': return '-';
      case 'bank': return '🏦';
      case 'clock': return '🕐';
      case 'play': return '▶';
      case 'pause': return '⏸';
      case 'search': return '🔍';
      case 'cog': return '⚙️';
      case 'shield-check': return '🛡️';
      case 'help-circle': return '❓';
      case 'logout': return '🚪';
      case 'file-text': return '📄';
      case 'chart-bar': return '📊';
      case 'history': return '📜';
      case 'credit-card': return '💳';
      case 'alert-triangle': return '⚠️';
      case 'shield-alert': return '🚨';
      case 'message-circle': return '💬';
      case 'navigation': return '🧭';
      case 'dollar-sign': return '💲';
      case 'trending-up': return '📈';
      case 'trending-down': return '📉';
      case 'star': return '⭐';
      case 'check-circle': return '✅';
      default: return '🏠';
    }
  };

  return (
    <Text style={[styles.icon, { fontSize: size, color }]}>
      {getIconEmoji()}
    </Text>
  );
};

const styles = StyleSheet.create({
  icon: {
    textAlign: 'center',
  },
});

export default SimpleIcon;