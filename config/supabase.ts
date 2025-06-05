import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://uohnbyejhxxypjvbauks.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvaG5ieWVqaHh4eXBqdmJhdWtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MjA4MzAsImV4cCI6MjA2MjQ5NjgzMH0.PSR4LFgJykR0m9eiLPM7gPYS5njxhaxF6OHtGJSsJk4'
);

export default supabase;