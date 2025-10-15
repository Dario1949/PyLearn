import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase.js';

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ params }) {
  try {
    const { id } = params;
    
    if (!id) {
      return json({ error: 'ID de notificación es requerido' }, { status: 400 });
    }
    
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    
    if (error) {
      return json({ error: 'Notificación no encontrada' }, { status: 404 });
    }
    
    return json({ success: true });
  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    return json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}