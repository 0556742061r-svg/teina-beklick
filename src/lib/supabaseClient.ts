import { createClient } from "@supabase/supabase-js";

// This publishable/anon key is safe to expose in frontend code -- it's designed for that.
// Row Level Security (RLS) policies on the database control what it's actually allowed to do.
const SUPABASE_URL = "https://sthtexfhaoozatmxwvwk.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_MdneaSakVJzsHvgaBaag-g_lI4tfZ_y";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
