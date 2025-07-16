// Legacy color support for backward compatibility
export const Colors = {
  orange: "#f57c00",
  blue: "#039be5",
  black: "#222222",
  white: "#ffffff",
  mediumGray: "#6e6869",
  red: "#fc5c65",
};

// Gluestack UI token mappings for Club Management App
export const ClubThemeTokens = {
  // Primary brand colors
  primary: '$indigo600',      // Club management primary
  primaryLight: '$indigo500',
  primaryDark: '$indigo700',
  
  // Secondary colors
  secondary: '$orange500',    // Action/accent color
  secondaryLight: '$orange400',
  secondaryDark: '$orange600',
  
  // Status colors
  success: '$green600',
  warning: '$amber500', 
  error: '$red600',
  info: '$blue600',
  
  // Neutral colors
  background: '$white',
  backgroundDark: '$blueGray900',
  surface: '$blueGray50',
  text: '$blueGray900',
  textSecondary: '$blueGray600',
  textMuted: '$blueGray500',
  border: '$blueGray300',
  
  // Club-specific semantic colors
  clubOwner: '$purple600',
  clubAdmin: '$blue600', 
  clubMember: '$green600',
  eventActive: '$indigo600',
  eventPending: '$amber500',
  attendanceYes: '$green600',
  attendanceNo: '$red500',
  attendanceMaybe: '$orange500',
};
