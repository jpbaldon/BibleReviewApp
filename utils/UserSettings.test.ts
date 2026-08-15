import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getHoldToTryAnother,
  setHoldToTryAnother,
  getSoundEnabled,
  setSoundEnabled,
  getTranslation,
  setTranslation,
  getMicButtonEnabled,
  setMicButtonEnabled,
} from './UserSettings';

describe('UserSettings', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  describe('holdToTryAnother', () => {
    it('defaults to false', async () => {
      expect(await getHoldToTryAnother('user-a')).toBe(false);
    });

    it('persists per user', async () => {
      await setHoldToTryAnother('user-a', true);
      await setHoldToTryAnother('user-b', false);

      expect(await getHoldToTryAnother('user-a')).toBe(true);
      expect(await getHoldToTryAnother('user-b')).toBe(false);
    });
  });

  describe('soundEnabled', () => {
    it('defaults to true', async () => {
      expect(await getSoundEnabled('user-a')).toBe(true);
    });

    it('persists false when muted', async () => {
      await setSoundEnabled('user-a', false);
      expect(await getSoundEnabled('user-a')).toBe(false);
    });

    it('keeps settings isolated by user', async () => {
      await setSoundEnabled('user-a', false);
      expect(await getSoundEnabled('user-b')).toBe(true);
    });
  });

  describe('translation', () => {
    it('defaults to BSB', async () => {
      expect(await getTranslation('user-a')).toBe('BSB');
    });

    it('persists translation choice', async () => {
      await setTranslation('user-a', 'ASV');
      expect(await getTranslation('user-a')).toBe('ASV');
    });
  });

  describe('micButtonEnabled', () => {
    it('defaults to true', async () => {
      expect(await getMicButtonEnabled('user-a')).toBe(true);
    });

    it('persists false when hidden', async () => {
      await setMicButtonEnabled('user-a', false);
      expect(await getMicButtonEnabled('user-a')).toBe(false);
    });

    it('keeps settings isolated by user', async () => {
      await setMicButtonEnabled('user-a', false);
      expect(await getMicButtonEnabled('user-b')).toBe(true);
    });
  });
});
