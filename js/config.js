// Supabase project credentials — fill these in after creating the project
// (Dashboard → Project Settings → API). Both are safe to expose in client JS.
const SUPABASE_URL = "https://fzdvomtihkzoyathgbqm.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_IuMP6jobkKE6iCzZ-kMF7Q_Crbq2nQu";

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
