import { Colors, type ThemeColors } from './Colors';

const expectedKeys: (keyof ThemeColors)[] = [
  'background',
  'surface',
  'scripture',
  'text',
  'textMuted',
  'textDisabled',
  'border',
  'accent',
  'accentMuted',
  'onAccent',
  'accentPressed',
  'accentShadow',
  'success',
  'successPressed',
  'successShadow',
  'danger',
  'dangerPressed',
  'dangerShadow',
  'warning',
  'competitive',
  'medalGold',
  'medalSilver',
  'medalBronze',
  'tabBarBackground',
  'logoBackground',
  'icon',
  'tabIconDefault',
  'tabIconSelected',
  'fadedText',
  'linkText',
  'disabledLinkText',
  'disabledButtonText',
  'highlightedText',
  'horizontalDivider',
  'tint',
  'neutralButton',
  'secondary',
];

describe('Colors', () => {
  it('defines matching keys for light and dark themes', () => {
    expect(Object.keys(Colors.light).sort()).toEqual(Object.keys(Colors.dark).sort());
  });

  it('includes every ThemeColors token in both schemes', () => {
    for (const key of expectedKeys) {
      expect(Colors.light[key]).toEqual(expect.any(String));
      expect(Colors.dark[key]).toEqual(expect.any(String));
      expect(Colors.light[key].length).toBeGreaterThan(0);
      expect(Colors.dark[key].length).toBeGreaterThan(0);
    }
  });
});
