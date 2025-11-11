const colors = {
  primary: '#00B894', // befast-green-dark
  secondary: '#1EE09A', // befast-green-light
  success: '#27ae60',
  error: '#D63031', // befast-red
  background: '#FFFFFF',
  
  textPrimary: '#1A202C', // befast-gray-900
  textSecondary: '#718096', // befast-gray-600
  textLight: '#FFFFFF',

  cardBackground: '#FFFFFF',
  screenBackground: '#F7FAFC', // befast-gray-100
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

const sizes = {
    borderRadiusSmall: 4,
    borderRadiusMedium: 8,
    borderRadiusLarge: 16,
};

const typography = {
  fontSizes: {
    caption: 12,
    body: 16,
    h4: 18,
    h3: 20,
    h2: 24,
    h1: 32,
  },
  fontWeights: {
    regular: { fontWeight: '400' },
    medium: { fontWeight: '500' },
    bold: { fontWeight: '700' },
  },
};

const components = {
  screenContainer: {
    flex: 1,
    backgroundColor: colors.screenBackground,
    paddingHorizontal: spacing.md,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: sizes.borderRadiusLarge,
    padding: spacing.md,
    marginVertical: spacing.sm,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: sizes.borderRadiusMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonTextPrimary: {
    color: colors.textLight,
    ...typography.fontWeights.bold,
    fontSize: typography.fontSizes.body,
  },
};

const theme = {
  colors,
  spacing,
  sizes,
  typography,
  components,
};

export default theme;
