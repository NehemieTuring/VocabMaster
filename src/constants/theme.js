export const COLORS = {
  // Primary
  primary: '#1565C0',
  primaryLight: '#42A5F5',
  primaryDark: '#0D47A1',
  primaryGradientStart: '#1976D2',
  primaryGradientEnd: '#0D47A1',

  // Accent
  accent: '#FF6D00',
  accentLight: '#FF9E40',

  // Level colors
  levelBeginner: '#E53935',       // Rouge - À travailler
  levelBeginnerLight: '#FFCDD2',
  levelIntermediate: '#FFB300',   // Jaune - À revoir
  levelIntermediateLight: '#FFF9C4',
  levelAdvanced: '#43A047',       // Vert - Acquis
  levelAdvancedLight: '#C8E6C9',

  // Backgrounds
  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  cardShadow: 'rgba(0, 0, 0, 0.08)',

  // Text
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  textOnPrimary: '#FFFFFF',
  textOnDark: '#FFFFFF',

  // Status
  success: '#43A047',
  error: '#E53935',
  warning: '#FFB300',
  info: '#42A5F5',

  // Misc
  border: '#E5E7EB',
  divider: '#F0F0F0',
  overlay: 'rgba(0, 0, 0, 0.5)',
  white: '#FFFFFF',
  black: '#000000',
  ripple: 'rgba(21, 101, 192, 0.12)',
};

export const FONTS = {
  regular: { fontWeight: '400' },
  medium: { fontWeight: '500' },
  semiBold: { fontWeight: '600' },
  bold: { fontWeight: '700' },
  extraBold: { fontWeight: '800' },
};

export const SIZES = {
  // Font sizes
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  display: 36,

  // Spacing
  spacing2: 2,
  spacing4: 4,
  spacing6: 6,
  spacing8: 8,
  spacing10: 10,
  spacing12: 12,
  spacing16: 16,
  spacing20: 20,
  spacing24: 24,
  spacing32: 32,
  spacing40: 40,

  // Border radius
  radiusSm: 8,
  radiusMd: 12,
  radiusLg: 16,
  radiusXl: 20,
  radiusFull: 999,

  // Shadows
  shadowSm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  shadowMd: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  shadowLg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
};

export const LEVEL_CONFIG = {
  0: {
    label: 'À travailler',
    color: COLORS.levelBeginner,
    lightColor: COLORS.levelBeginnerLight,
    icon: 'signal-cellular-1',
    emoji: '🔴',
  },
  1: {
    label: 'À revoir',
    color: COLORS.levelIntermediate,
    lightColor: COLORS.levelIntermediateLight,
    icon: 'signal-cellular-2',
    emoji: '🟡',
  },
  2: {
    label: 'Acquis',
    color: COLORS.levelAdvanced,
    lightColor: COLORS.levelAdvancedLight,
    icon: 'signal-cellular-3',
    emoji: '🟢',
  },
};
