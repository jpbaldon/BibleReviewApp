/**
 * Palette from the review-screen mockup:
 * cool light canvas, navy text, blue accent, green submit, coral give-up.
 */

export type ThemeColors = {
  background: string;
  surface: string;
  scripture: string;
  text: string;
  textMuted: string;
  textDisabled: string;
  border: string;
  accent: string;
  accentMuted: string;
  onAccent: string;
  accentPressed: string;
  accentShadow: string;
  success: string;
  successPressed: string;
  successShadow: string;
  danger: string;
  dangerPressed: string;
  dangerShadow: string;
  warning: string;
  competitive: string;
  tabBarBackground: string;
  logoBackground: string;
  icon: string;
  tabIconDefault: string;
  tabIconSelected: string;
  // Compatibility aliases
  fadedText: string;
  linkText: string;
  disabledLinkText: string;
  disabledButtonText: string;
  highlightedText: string;
  horizontalDivider: string;
  tint: string;
  neutralButton: string;
  secondary: string;
};

const light: ThemeColors = {
  background: '#F5F7FA',
  surface: '#FFFFFF',
  scripture: '#EEF4FB',
  text: '#1A2B48',
  textMuted: '#6B7C93',
  textDisabled: '#9AA8BC',
  border: '#E2E8F0',
  accent: '#3B82F6',
  accentMuted: '#DBEAFE',
  onAccent: '#FFFFFF',
  accentPressed: '#2563EB',
  accentShadow: 'rgba(59, 130, 246, 0.28)',
  success: '#4DAF7C',
  successPressed: '#3D9A6A',
  successShadow: 'rgba(77, 175, 124, 0.28)',
  danger: '#EF5350',
  dangerPressed: '#E53935',
  dangerShadow: 'rgba(239, 83, 80, 0.28)',
  warning: '#F59E0B',
  competitive: '#F59E0B',
  tabBarBackground: '#FFFFFF',
  logoBackground: '#DBEAFE',
  icon: '#6B7C93',
  tabIconDefault: '#9AA8BC',
  tabIconSelected: '#3B82F6',
  // Aliases
  fadedText: '#6B7C93',
  linkText: '#3B82F6',
  disabledLinkText: '#9AA8BC',
  disabledButtonText: '#9AA8BC',
  highlightedText: '#F59E0B',
  horizontalDivider: '#E2E8F0',
  tint: '#3B82F6',
  neutralButton: '#3B82F6',
  secondary: '#FFFFFF',
};

const dark: ThemeColors = {
  background: '#000000',
  surface: '#1E293B',
  scripture: '#1E293B',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  textDisabled: '#64748B',
  border: '#334155',
  accent: '#60A5FA',
  accentMuted: '#1E3A5F',
  onAccent: '#000000',
  accentPressed: '#3B82F6',
  accentShadow: 'rgba(96, 165, 250, 0.25)',
  success: '#4ADE80',
  successPressed: '#22C55E',
  successShadow: 'rgba(74, 222, 128, 0.25)',
  danger: '#F87171',
  dangerPressed: '#EF4444',
  dangerShadow: 'rgba(248, 113, 113, 0.25)',
  warning: '#FBBF24',
  competitive: '#FBBF24',
  tabBarBackground: '#1E293B',
  logoBackground: '#1E3A5F',
  icon: '#94A3B8',
  tabIconDefault: '#64748B',
  tabIconSelected: '#60A5FA',
  // Aliases
  fadedText: '#94A3B8',
  linkText: '#60A5FA',
  disabledLinkText: '#64748B',
  disabledButtonText: '#64748B',
  highlightedText: '#FBBF24',
  horizontalDivider: '#334155',
  tint: '#60A5FA',
  neutralButton: '#60A5FA',
  secondary: '#1E293B',
};

export const Colors = {
  light,
  dark,
};
