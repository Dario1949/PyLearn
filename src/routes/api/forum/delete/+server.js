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

    const { data: question, error: fetchError } = await supabase
      .from('forum_questions')
      .select('*')
      .eq('id', questionId)
      .single();

    if (fetchError || !question) {
      return json({ success: false, error: 'Pregunta no encontrada' }, { status: 404 });
    }
    
    if (question.author_id !== locals.user.id && 
        locals.user.role !== 'admin' && 
        locals.user.role !== 'teacher') {
      return json({ success: false, error: 'No tienes permisos para eliminar esta pregunta' }, { status: 403 });
    }

    await supabase.from('forum_answers').delete().eq('question_id', questionId);
    const { error } = await supabase.from('forum_questions').delete().eq('id', questionId);
    
    if (error) throw error;

    return json({ success: true });

  } catch (error) {
    console.error('Error eliminando pregunta:', error);
    return json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}
