import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase.js';

export async function PUT({ request }) {
  try {
    const { modules } = await request.json();
    
    if (!modules || !Array.isArray(modules)) {
      return json({ error: 'Datos de módulos inválidos' }, { status: 400 });
    }

    // Actualizar el orden de cada módulo
    const updates = modules.map(({ id, order }) => 
      supabase
        .from('modules')
        .update({ order })
        .eq('id', id)
    );

    await Promise.all(updates);

    return json({ success: true });
  } catch (error) {
    console.error('Error reordenando módulos:', error);
    return json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}