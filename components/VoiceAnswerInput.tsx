import React, { useEffect, useState } from 'react';
import type { VoiceAnswerInputProps } from './VoiceAnswerInput.types';
import { isSpeechRecognitionNativeAvailable } from '../utils/speechRecognitionNative';

type VoiceAnswerSpeechImplComponent = React.ComponentType<VoiceAnswerInputProps>;

export type { VoiceAnswerInputProps } from './VoiceAnswerInput.types';

/**
 * Renders voice input only when the speech native module is in the app binary.
 * The speech implementation is loaded dynamically so `expo-speech-recognition`
 * is never evaluated on builds that do not include it.
 */
export function VoiceAnswerInput(props: VoiceAnswerInputProps) {
  const [SpeechImpl, setSpeechImpl] =
    useState<VoiceAnswerSpeechImplComponent | null>(null);

  useEffect(() => {
    if (!isSpeechRecognitionNativeAvailable()) {
      return;
    }

    let cancelled = false;

    void import('./VoiceAnswerSpeechImpl')
      .then((mod) => {
        if (!cancelled && mod.VoiceAnswerSpeechImpl) {
          setSpeechImpl(() => mod.VoiceAnswerSpeechImpl);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSpeechImpl(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!SpeechImpl) {
    return null;
  }

  return <SpeechImpl {...props} />;
}
