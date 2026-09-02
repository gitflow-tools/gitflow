export const colors = {
  orange: '#FF6B35',
  coral: '#FF4444',
  pink: '#FF6B9D',
  magenta: '#D946A8',

  green: '#4ADE80',
  yellow: '#FACC15',
  red: '#EF4444',

  white: '#FFFFFF',
  lightGrey: '#D1D5DB',
  grey: '#6B7280',
  darkGrey: '#374151',
  darkerGrey: '#1F2937',

  bgDark: '#0D1117',
  bgPanel: '#161B22',
  bgHighlight: '#1C2333',

  border: '#30363D',
  borderActive: '#FF6B35',
  borderFaint: '#21262D',
} as const;

export type ThemeColor = keyof typeof colors;
