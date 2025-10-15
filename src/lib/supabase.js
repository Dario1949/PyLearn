import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nvrthjhyqxqvkyocafpv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52cnRoamh5cXhxdmt5b2NhZnB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNzI4MjYsImV4cCI6MjA3NTk0ODgyNn0.SA4B43Gfzlt6eJVBiY0zzNPqCRlu8WD8q9eEBSeJt_w';

export const supabase = createClient(supabaseUrl, supabaseKey);