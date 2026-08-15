import type { ParsedBibleReference } from '../utils/parseSpokenBibleReference';

export interface VoiceAnswerInputProps {
  disabled?: boolean;
  enabledBookNames: string[];
  onParsed: (reference: ParsedBibleReference) => void;
  onError: (message: string) => void;
  onListeningChange?: (state: {
    isListening: boolean;
    interimTranscript: string;
  }) => void;
}
