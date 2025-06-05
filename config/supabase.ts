import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  '***REMOVED***',
  '***REMOVED***'
);

export default supabase;