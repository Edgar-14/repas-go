// ============================================
// CONFIGURACIÓN DE COLORES POR PORTAL
// ============================================

export const PORTAL_COLORS = {
  admin: {
    primary: '#00b1fd', // Azul del logo de admin
    secondary: '#0094e7',
    gradient: 'from-blue-500 via-blue-600 to-blue-700',
    accent: '#60A5FA',
    background: 'from-blue-50 to-blue-100',
    text: 'text-blue-900',
    textSecondary: 'text-blue-700'
  },
  delivery: {
    primary: '#FF7300', // Orange for businesses
    secondary: '#EA580C',
    gradient: 'from-orange-500 to-orange-600',
    accent: '#FB923C',
    background: 'from-orange-50 to-orange-100',
    text: 'text-orange-900',
    textSecondary: 'text-orange-700'
  },
  repartidores: {
    primary: '#20b500', // Verde del logo de repartidores
    secondary: '#129c00',
    gradient: 'from-green-500 via-green-600 to-green-700',
    accent: '#34D399',
    background: 'from-green-50 to-green-100',
    text: 'text-green-900',
    textSecondary: 'text-green-700'
  }
} as const;

export type PortalType = keyof typeof PORTAL_COLORS;

// Helper function to get portal colors
export const getPortalColors = (portal: PortalType) => PORTAL_COLORS[portal];

// CSS custom properties for dynamic theming
export const generatePortalCSSVars = (portal: PortalType) => {
  const colors = getPortalColors(portal);
  return {
    '--portal-primary': colors.primary,
    '--portal-secondary': colors.secondary,
    '--portal-accent': colors.accent,
  };
};