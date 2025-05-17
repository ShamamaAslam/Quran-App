import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xslkxuskcjirmsmjtyzq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzbGt4dXNrY2ppcm1zbWp0eXpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2ODA4ODAsImV4cCI6MjA2MjI1Njg4MH0.QOtYUl4i1qtk2lrAy_BlLdrGl5F5X5suvvqoCPVqp0c'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});