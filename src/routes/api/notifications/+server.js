import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const { userId, message, type, from } = await request.json();
    
    if (!userId || !message) {
      return json({ error: 'userId y message son requeridos' }, { status: 400 });
    }
    
    const newNotification = {
      id: Date.now().toString(),
      user_id: userId,
      message,
      type: type || 'info',
      from_user: from || 'Sistema',
      timestamp: new Date().toISOString(),
      read: false
    };
    
    const { error } = await supabase.from('notifications').insert(newNotification);
    if (error) throw error;
    
    return json({ success: true, notification: newNotification });
  } catch (error) {
    console.error('Error al crear notificación:', error);
    return json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
  try {
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return json({ error: 'userId es requerido' }, { status: 400 });
    }
    
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });
    
    if (error) throw error;
    
    return json({ notifications: notifications || [] });
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    return json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ url }) {
  try {
    const notificationId = url.searchParams.get('id');
    
    if (!notificationId) {
      return json({ error: 'ID de notificación es requerido' }, { status: 400 });
    }
    
    const { error } = await supabase.from('notifications').delete().eq('id', notificationId);
    
    if (error) {
      return json({ error: 'Notificación no encontrada' }, { status: 404 });
    }
    
    return json({ success: true });
  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    return json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
