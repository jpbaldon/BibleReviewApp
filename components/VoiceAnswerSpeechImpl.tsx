import { useIsFocused } from '@react-navigation/native';
import { useEventListener } from 'expo';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { VoiceAnswerButton } from './VoiceAnswerButton';
import type { VoiceAnswerInputProps } from './VoiceAnswerInput.types';
import { buildSpeechContextStrings } from '../utils/bibleBookAliases';
import { parseSpokenBibleReference } from '../utils/parseSpokenBibleReference';

const useContinuousRecognition =
  Platform.OS !== 'android' || Number(Platform.Version) >= 33;

export function VoiceAnswerSpeechImpl({
  disabled = false,
  enabledBookNames,
  onParsed,
  onError,
  onListeningChange,
}: VoiceAnswerInputProps) {
  const isFocused = useIsFocused();
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const hasHandledResultRef = useRef(false);
  const latestTranscriptRef = useRef('');
  const enabledBookNamesRef = useRef(enabledBookNames);
  const isFocusedRef = useRef(isFocused);
  const disabledRef = useRef(disabled);
  const wantListeningRef = useRef(false);
  const ownsSessionRef = useRef(false);
  const nativeStartedRef = useRef(false);
  const committedSegmentsRef = useRef('');

  enabledBookNamesRef.current = enabledBookNames;
  isFocusedRef.current = isFocused;
  disabledRef.current = disabled;

  useEffect(() => {
    onListeningChange?.({ isListening, interimTranscript });
  }, [interimTranscript, isListening, onListeningChange]);

  const handleFinalTranscript = useCallback((transcript: string) => {
    if (hasHandledResultRef.current) {
      return;
    }

    hasHandledResultRef.current = true;
    wantListeningRef.current = false;
    ownsSessionRef.current = false;
    nativeStartedRef.current = false;
    committedSegmentsRef.current = '';
    setInterimTranscript('');
    latestTranscriptRef.current = '';
    setIsListening(false);

    const result = parseSpokenBibleReference(
      transcript,
      enabledBookNamesRef.current,
    );

    if (result.success) {
      onParsed(result.reference);
      return;
    }

    onError(result.error);
  }, [onError, onParsed]);

  const commitLatestTranscript = useCallback((): boolean => {
    if (hasHandledResultRef.current) {
      return true;
    }

    const transcript = latestTranscriptRef.current.trim();
    if (!transcript) {
      return false;
    }

    handleFinalTranscript(transcript);
    return true;
  }, [handleFinalTranscript]);

  const discardSession = useCallback(() => {
    hasHandledResultRef.current = true;
    wantListeningRef.current = false;
    ownsSessionRef.current = false;
    nativeStartedRef.current = false;
    latestTranscriptRef.current = '';
    committedSegmentsRef.current = '';
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  useEventListener(ExpoSpeechRecognitionModule, 'start', () => {
    if (!ownsSessionRef.current) {
      return;
    }

    if (!wantListeningRef.current) {
      ExpoSpeechRecognitionModule.abort();
      discardSession();
      return;
    }

    hasHandledResultRef.current = false;
    nativeStartedRef.current = true;
    setIsListening(true);
  });

  useEventListener(ExpoSpeechRecognitionModule, 'end', () => {
    if (!ownsSessionRef.current) {
      return;
    }

    commitLatestTranscript();
    ownsSessionRef.current = false;
    nativeStartedRef.current = false;
    wantListeningRef.current = false;
    setIsListening(false);
  });

  useEventListener(ExpoSpeechRecognitionModule, 'result', (event) => {
    if (!ownsSessionRef.current) {
      return;
    }

    const transcript = event.results[0]?.transcript?.trim() ?? '';
    if (!transcript) {
      return;
    }

    // Android continuous mode emits a new segment after each final; keep them joined.
    if (useContinuousRecognition && Platform.OS === 'android') {
      if (event.isFinal) {
        committedSegmentsRef.current =
          `${committedSegmentsRef.current} ${transcript}`.trim();
        latestTranscriptRef.current = committedSegmentsRef.current;
      } else {
        latestTranscriptRef.current =
          `${committedSegmentsRef.current} ${transcript}`.trim();
      }
    } else {
      latestTranscriptRef.current = transcript;
    }

    setInterimTranscript(latestTranscriptRef.current);

    if (event.isFinal && !useContinuousRecognition) {
      handleFinalTranscript(latestTranscriptRef.current);
    }
  });

  useEventListener(ExpoSpeechRecognitionModule, 'error', (event) => {
    if (!ownsSessionRef.current) {
      return;
    }

    const committed = commitLatestTranscript();
    ownsSessionRef.current = false;
    nativeStartedRef.current = false;
    wantListeningRef.current = false;
    setIsListening(false);

    if (committed) {
      return;
    }

    setInterimTranscript('');

    if (event.error === 'aborted') {
      latestTranscriptRef.current = '';
      return;
    }

    if (event.error === 'no-speech') {
      onError('No speech heard. Try again.');
      return;
    }

    if (event.error === 'not-allowed') {
      onError('Microphone permission is required for voice answers.');
      return;
    }

    onError('Voice recognition failed. Try again or use the picker.');
  });

  const startListening = useCallback(async () => {
    if (disabledRef.current || ownsSessionRef.current || !isFocusedRef.current) {
      return;
    }

    wantListeningRef.current = true;

    if (enabledBookNamesRef.current.length === 0) {
      wantListeningRef.current = false;
      onError('No books are enabled for review.');
      return;
    }

    if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
      wantListeningRef.current = false;
      onError('Speech recognition is not available on this device.');
      return;
    }

    const permissions = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!wantListeningRef.current || !isFocusedRef.current || disabledRef.current) {
      wantListeningRef.current = false;
      return;
    }

    if (!permissions.granted) {
      wantListeningRef.current = false;
      onError('Microphone permission is required for voice answers.');
      return;
    }

    hasHandledResultRef.current = false;
    nativeStartedRef.current = false;
    ownsSessionRef.current = true;
    latestTranscriptRef.current = '';
    committedSegmentsRef.current = '';
    setInterimTranscript('');

    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true,
      continuous: useContinuousRecognition,
      contextualStrings: buildSpeechContextStrings(enabledBookNamesRef.current),
      androidIntentOptions: useContinuousRecognition
        ? undefined
        : {
            EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 1000,
            EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 1000,
          },
    });
  }, [onError]);

  const stopListening = useCallback(() => {
    wantListeningRef.current = false;

    if (!ownsSessionRef.current) {
      return;
    }

    if (nativeStartedRef.current) {
      commitLatestTranscript();
      ExpoSpeechRecognitionModule.stop();
      return;
    }

    ExpoSpeechRecognitionModule.abort();
    discardSession();
  }, [commitLatestTranscript, discardSession]);

  const toggleListening = useCallback(() => {
    if (ownsSessionRef.current) {
      stopListening();
      return;
    }

    void startListening();
  }, [startListening, stopListening]);

  useEffect(() => {
    if (!disabled || !ownsSessionRef.current) {
      return;
    }

    ExpoSpeechRecognitionModule.abort();
    discardSession();
  }, [disabled, discardSession]);

  useEffect(() => {
    if (isFocused || !ownsSessionRef.current) {
      return;
    }

    if (latestTranscriptRef.current.trim()) {
      commitLatestTranscript();
      ExpoSpeechRecognitionModule.stop();
      return;
    }

    ExpoSpeechRecognitionModule.abort();
    discardSession();
  }, [commitLatestTranscript, discardSession, isFocused]);

  useEffect(() => {
    return () => {
      if (!ownsSessionRef.current) {
        return;
      }

      ExpoSpeechRecognitionModule.abort();
      ownsSessionRef.current = false;
      nativeStartedRef.current = false;
      wantListeningRef.current = false;
    };
  }, []);

  return (
    <VoiceAnswerButton
      disabled={disabled}
      isListening={isListening}
      onPress={toggleListening}
      onPressIn={() => {
        void startListening();
      }}
      onPressOut={stopListening}
    />
  );
}
