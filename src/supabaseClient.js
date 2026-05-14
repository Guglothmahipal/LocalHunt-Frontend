// import { createClient } from "@supabase/supabase-js";

// const supabaseUrl = "https://dbnofngibwyzovxlezip.supabase.co";
// const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRibm9mbmdpYnd5em92eGxlemlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMTQxMTEsImV4cCI6MjA3Mzc5MDExMX0.RV4bVKwfPXphdhrPFfoMoNa0R8Y6FQvd_pnf8ccLcik";

// export const supabase = createClient(supabaseUrl, supabaseKey);

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
