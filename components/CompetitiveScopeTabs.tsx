import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useThemeContext } from '@/context/ThemeContext';
import {
  COMPETITIVE_SCOPES,
  COMPETITIVE_SCOPE_LABELS,
  type CompetitiveScope,
} from '@/utils/bibleScope';

interface CompetitiveScopeTabsProps {
  selectedScope: CompetitiveScope;
  onSelectScope: (scope: CompetitiveScope) => void;
}

export const CompetitiveScopeTabs: React.FC<CompetitiveScopeTabsProps> = ({
  selectedScope,
  onSelectScope,
}) => {
  const { theme } = useThemeContext();

  return (
    <View style={styles.scopeTabs}>
      {COMPETITIVE_SCOPES.map((scope) => {
        const isSelected = selectedScope === scope;
        return (
          <Pressable
            key={scope}
            onPress={() => onSelectScope(scope)}
            style={[
              styles.scopeTab,
              {
                borderColor: isSelected ? theme.competitive : theme.border,
                backgroundColor: isSelected ? theme.accentMuted : theme.surface,
              },
            ]}
          >
            <Text
              style={[
                styles.scopeTabText,
                { color: isSelected ? theme.competitive : theme.textMuted },
              ]}
            >
              {COMPETITIVE_SCOPE_LABELS[scope]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  scopeTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  scopeTab: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  scopeTabText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
