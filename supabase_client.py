from supabase import create_client, Client

SUPABASE_URL = "https://nvrthjhyqxqvkyocafpv.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52cnRoamh5cXhxdmt5b2NhZnB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNzI4MjYsImV4cCI6MjA3NTk0ODgyNn0.SA4B43Gfzlt6eJVBiY0zzNPqCRlu8WD8q9eEBSeJt_w"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Funciones para obtener datos
def get_challenges():
    return supabase.table('challenges').select('*').execute().data

def get_users():
    return supabase.table('users').select('*').execute().data

def get_progress(user_id=None):
    if user_id:
        return supabase.table('progress').select('*').eq('user_id', user_id).execute().data
    return supabase.table('progress').select('*').execute().data

def get_modules():
    return supabase.table('modules').select('*').execute().data

def get_lessons():
    return supabase.table('lessons').select('*').execute().data

def get_forum_questions():
    return supabase.table('forum_questions').select('*').execute().data

def get_forum_answers():
    return supabase.table('forum_answers').select('*').execute().data

def get_notifications(user_id):
    return supabase.table('notifications').select('*').eq('user_id', user_id).execute().data

def get_store_catalog():
    return supabase.table('store_catalog').select('*').execute().data

def get_purchases(user_id):
    return supabase.table('purchases').select('*').eq('user_id', user_id).execute().data