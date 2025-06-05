import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WebSocket from 'react-native-websocket';

// Type declaration for react-native-websocket
declare module 'react-native-websocket' {
  interface WebSocket {
    new(url: string): WebSocket;
    // Add other WebSocket methods as needed
  }
}

const supabase = createClient(
  '***REMOVED***',
  '***REMOVED***',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

export default supabase;