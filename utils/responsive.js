import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (based on standard mobile screen - iPhone 11)
const baseWidth = 375;
const baseHeight = 812;

// Scaling factors
const widthScale = SCREEN_WIDTH / baseWidth;
const heightScale = SCREEN_HEIGHT / baseHeight;

// Responsive dimension functions
export const horizontalScale = (size) => Math.round(widthScale * size);
export const verticalScale = (size) => Math.round(heightScale * size);
export const moderateScale = (size, factor = 0.5) => Math.round(size + (horizontalScale(size) - size) * factor);

// Device type detection
export const isSmallDevice = SCREEN_WIDTH < 375;
export const isTablet = SCREEN_WIDTH >= 768;
export const isLargeDevice = SCREEN_WIDTH >= 1024;

// Font scaling
export const fontScale = Math.min(widthScale, 1.4);

// Responsive padding and margin
export const spacing = {
  xs: horizontalScale(4),
  sm: horizontalScale(8),
  md: horizontalScale(16),
  lg: horizontalScale(24),
  xl: horizontalScale(32),
  xxl: horizontalScale(40),
};

// Screen dimensions
export const screenWidth = SCREEN_WIDTH;
export const screenHeight = SCREEN_HEIGHT; 