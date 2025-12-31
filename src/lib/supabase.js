import { createClient } from "@supabase/supabase-js";

const supabaseUrl = 'https://azzauxfmrlzrrwpxbzkl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6emF1eGZtcmx6cnJ3cHhiemtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNTQ0NDksImV4cCI6MjA4MjczMDQ0OX0.U3j541Ckb7yZXHkEvaJpDKJ0poA_khFu0IKE4qYXG68'

export const supabase = createClient(supabaseUrl, supabaseKey)