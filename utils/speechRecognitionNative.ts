import { requireOptionalNativeModule } from 'expo-modules-core';

const NATIVE_MODULE_NAME = 'ExpoSpeechRecognition';

let cachedNativeAvailable: boolean | undefined;

/**
 * Whether the speech native module is compiled into the current app binary.
 * Safe to call on any build — does not load expo-speech-recognition JS.
 */
export function isSpeechRecognitionNativeAvailable(): boolean {
  if (cachedNativeAvailable !== undefined) {
    return cachedNativeAvailable;
  }

  cachedNativeAvailable =
    requireOptionalNativeModule(NATIVE_MODULE_NAME) !== null;
  return cachedNativeAvailable;
}
