import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || anonKey;

export const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
export const supabaseAnon = createClient(url, anonKey, { auth: { persistSession: false } });
