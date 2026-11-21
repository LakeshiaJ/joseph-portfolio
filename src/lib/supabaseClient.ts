import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dsedtmiaizjrboucjvwn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_H0b-80yIafLhLx-7UM_08g_3k_4wa7G';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);