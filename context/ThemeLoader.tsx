import { useEffect } from 'react';
import { useThemeContext } from '../context/ThemeContext';

export const ThemeLoader = ({ userId }: { userId: string }) => {
  const { loadUserTheme } = useThemeContext();

  useEffect(() => {
    if (userId) {
      loadUserTheme(userId);
    }
  }, [userId]);

  return null;
};