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
  'https://uohnbyejhxxypjvbauks.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvaG5ieWVqaHh4eXBqdmJhdWtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MjA4MzAsImV4cCI6MjA2MjQ5NjgzMH0.PSR4LFgJykR0m9eiLPM7gPYS5njxhaxF6OHtGJSsJk4',
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