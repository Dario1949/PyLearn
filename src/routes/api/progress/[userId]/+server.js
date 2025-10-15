// src/routes/api/progress/[userId]/+server.js
import { supabase } from '$lib/supabase.js';

/**
 * GET /api/progress/:userId
 * Responde { success: true, progress: {...} } o { success: true, progress: null } si no hay registro.
 */
export async function GET({ params }) {
  const { userId } = params;

  if (!userId) {
    return new Response(JSON.stringify({ success: false, error: 'userId requerido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { data: progress, error } = await supabase
      .from('progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return new Response(JSON.stringify({ success: true, progress: progress ?? null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error('Error obteniendo progreso:', e);
    return new Response(JSON.stringify({ success: false, error: 'No se pudo obtener el progreso' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
