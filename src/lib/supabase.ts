
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Diagnostic logging (sanitized)
if (typeof window !== 'undefined') {
    console.log('[Supabase] Initializing with URL:', supabaseUrl ? `${supabaseUrl.substring(0, 12)}...` : 'MISSING');
}

if (!supabaseUrl || !supabaseAnonKey) {
    const errorMsg = 'Supabase URL or Anon Key is missing. Please check your .env file and RESTART your dev server.';
    if (typeof window !== 'undefined') {
        console.error(errorMsg);
    }
}

// Create client without fallback to prevent broken redirects to placeholder domains
export const supabase = createClient(
    supabaseUrl || 'https://MISSING_URL.supabase.co',
    supabaseAnonKey || 'MISSING_KEY'
);
