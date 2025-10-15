from supabase_client import *

# Ejemplos de uso
challenges = get_challenges()
print(f"Total challenges: {len(challenges)}")

users = get_users()
print(f"Total users: {len(users)}")

# Obtener progreso de un usuario específico
if users:
    user_progress = get_progress(users[0]['id'])
    print(f"Progress for user: {user_progress}")

# Obtener todas las preguntas del foro
questions = get_forum_questions()
print(f"Forum questions: {len(questions)}")

# Obtener catálogo de la tienda
catalog = get_store_catalog()
print(f"Store items: {len(catalog)}")

# Obtener notificaciones de un usuario
if users:
    notifications = get_notifications(users[0]['id'])
    print(f"Notifications: {len(notifications)}")