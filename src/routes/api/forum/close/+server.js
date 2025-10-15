import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase.js';

export async function POST({ request, locals }) {
  try {
    if (!locals?.user?.id) {
      return json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const { questionId } = await request.json();
    if (!questionId) {
      return json({ success: false, error: 'ID de pregunta requerido' }, { status: 400 });
    }

    // Obtener la pregunta de Supabase
    const { data: question, error: fetchError } = await supabase
      .from('forum_questions')
      .select('*')
      .eq('id', questionId)
      .single();

    if (fetchError || !question) {
      return json({ success: false, error: 'Pregunta no encontrada' }, { status: 404 });
    }
    
    // Solo el autor o un admin/teacher puede cerrar la pregunta
    if (question.author_id !== locals.user.id && 
        locals.user.role !== 'admin' && 
        locals.user.role !== 'teacher') {
      return json({ success: false, error: 'No tienes permisos para cerrar esta pregunta' }, { status: 403 });
    }

    // Alternar el estado cerrado
    const newClosed = !question.closed;
    const newSolved = newClosed;

    // Actualizar en Supabase
    const { error: updateError } = await supabase
      .from('forum_questions')
      .update({ closed: newClosed, solved: newSolved })
      .eq('id', questionId);

    if (updateError) throw updateError;

    return json({ 
      success: true, 
      closed: newClosed,
      solved: newSolved
    });

  } catch (error) {
    console.error('Error cerrando pregunta:', error);
    return json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}
