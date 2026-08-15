import { useEventListener } from 'expo';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { VoiceAnswerButton } from './VoiceAnswerButton';
import type { VoiceAnswerInputProps } from './VoiceAnswerInput.types';
import { buildSpeechContextStrings } from '../utils/bibleBookAliases';
import { parseSpokenBibleReference } from '../utils/parseSpokenBibleReference';

export function VoiceAnswerSpeechImpl({
  disabled = false,
  enabledBookNames,
  onParsed,
  onError,
  onListeningChange,
}: VoiceAnswerInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const hasHandledResultRef = useRef(false);
  const latestTranscriptRef = useRef('');
  const enabledBookNamesRef = useRef(enabledBookNames);

  enabledBookNamesRef.current = enabledBookNames;

  useEffect(() => {
    onListeningChange?.({ isListening, interimTranscript });
  }, [interimTranscript, isListening, onListeningChange]);

  const handleFinalTranscript = useCallback((transcript: string) => {
    if (hasHandledResultRef.current) {
      return;
    }

    hasHandledResultRef.current = true;
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

  useEventListener(ExpoSpeechRecognitionModule, 'start', () => {
    hasHandledResultRef.current = false;
    setIsListening(true);
  });

  useEventListener(ExpoSpeechRecognitionModule, 'end', () => {
    // Android often ends without a final result after showing partials.
    commitLatestTranscript();
    setIsListening(false);
  });

  useEventListener(ExpoSpeechRecognitionModule, 'result', (event) => {
    const transcript = event.results[0]?.transcript?.trim() ?? '';
    if (!transcript) {
      return;
    }

    latestTranscriptRef.current = transcript;
    setInterimTranscript(transcript);

    if (event.isFinal) {
      handleFinalTranscript(transcript);
    }
  });

  useEventListener(ExpoSpeechRecognitionModule, 'error', (event) => {
    setIsListening(false);

    if (event.error === 'aborted') {
      if (commitLatestTranscript()) {
        return;
      }
      latestTranscriptRef.current = '';
      setInterimTranscript('');
      onError('Voice input cancelled.');
      return;
    }

    // Devices frequently report no-speech / no-match after the user did speak
    // and partial text was already shown. Keep that transcript if we have one.
    if (commitLatestTranscript()) {
      return;
    }

    setInterimTranscript('');

    if (event.error === 'no-speech') {
      onError('No speech heard. Tap the mic and try again.');
      return;
    }

    if (event.error === 'not-allowed') {
      onError('Microphone permission is required for voice answers.');
      return;
    }

    onError('Voice recognition failed. Try again or use the picker.');
  });

  const startListening = useCallback(async () => {
    if (disabled || isListening) {
      return;
    }

    if (enabledBookNamesRef.current.length === 0) {
      onError('No books are enabled for review.');
      return;
    }

    if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
      onError('Speech recognition is not available on this device.');
      return;
    }

    const permissions = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permissions.granted) {
      onError('Microphone permission is required for voice answers.');
      return;
    }

    hasHandledResultRef.current = false;
    latestTranscriptRef.current = '';
    setInterimTranscript('');

    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true,
      continuous: false,
      contextualStrings: buildSpeechContextStrings(enabledBookNamesRef.current),
      androidIntentOptions: {
        EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 1000,
        EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 1000,
      },
    });
  }, [disabled, isListening, onError]);

  const stopListening = useCallback(() => {
    if (!isListening) {
      return;
    }

    commitLatestTranscript();
    ExpoSpeechRecognitionModule.stop();
  }, [commitLatestTranscript, isListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
      return;
    }

    void startListening();
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    if (disabled && isListening) {
      hasHandledResultRef.current = true;
      latestTranscriptRef.current = '';
      ExpoSpeechRecognitionModule.abort();
      setIsListening(false);
      setInterimTranscript('');
    }
  }, [disabled, isListening]);

  return (
    <VoiceAnswerButton
      disabled={disabled}
      isListening={isListening}
      onPress={toggleListening}
    />
  );
}
