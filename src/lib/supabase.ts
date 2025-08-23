import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database table names
export const TABLES = {
  FOM: 'FOM',
  LFOM: 'LFOM',
  MDA_CLAIM: 'MDA claim',
  POS_LFOM: 'POS LFOM',
  POS_FOM: 'POS FOM',
  STOCK: 'Stock'
} as const;

export type TableName = typeof TABLES[keyof typeof TABLES];