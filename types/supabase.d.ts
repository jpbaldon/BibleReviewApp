import '@supabase/supabase-js';

declare module '@supabase/supabase-js' {
  interface RealtimeClientOptions {
    /**
     * Custom WebSocket implementation for React Native
     */
    websocketImpl?: any;
  }
}