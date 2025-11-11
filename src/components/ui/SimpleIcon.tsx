import React from 'react';
import { Image, StyleSheet } from 'react-native';

interface SimpleIconProps {
  type: 'home' | 'package' | 'wallet' | 'bell' | 'account' | 'arrow-left' | 'arrow-right' | 'check' | 'close' | 'plus' | 'minus' | 'bank' | 'clock' | 'play' | 'pause' | 'search' | 'cog' | 'shield-check' | 'help-circle' | 'logout';
  size?: number;
  color?: string;
}

const SimpleIcon: React.FC<SimpleIconProps> = ({ type, size = 24, color = '#000' }) => {
  const getIconSource = () => {
    switch (type) {
      case 'home': return require('../../../assets/icon/home.png');
      case 'package': return require('../../../assets/icon/package.png');
      case 'wallet': return require('../../../assets/icon/wallet.png');
      case 'bell': return require('../../../assets/icon/bell.png');
      case 'account': return require('../../../assets/icon/account.png');
      case 'arrow-left': return require('../../../assets/icon/arrow-left.png');
      case 'arrow-right': return require('../../../assets/icon/arrow-right.png');
      case 'check': return require('../../../assets/icon/check.png');
      case 'close': return require('../../../assets/icon/close.png');
      case 'plus': return require('../../../assets/icon/plus.png');
      case 'minus': return require('../../../assets/icon/minus.png');
      case 'bank': return require('../../../assets/icon/bank.png');
      case 'clock': return require('../../../assets/icon/clock.png');
      case 'play': return require('../../../assets/icon/play.png');
      case 'pause': return require('../../../assets/icon/pause.png');
      case 'search': return require('../../../assets/icon/search.png');
      case 'cog': return require('../../../assets/icon/cog.png');
      case 'shield-check': return require('../../../assets/icon/shield-check.png');
      case 'help-circle': return require('../../../assets/icon/help-circle.png');
      case 'logout': return require('../../../assets/icon/logout.png');
      default: return require('../../../assets/icon/home.png');
    }
  };

  return (
    <Image 
      source={getIconSource()} 
      style={[styles.icon, { width: size, height: size, tintColor: color }]} 
      resizeMode="contain"
    />
  );
};

const styles = StyleSheet.create({
  icon: {
    // tintColor will be applied via style prop
  },
});

export default SimpleIcon;