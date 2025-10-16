import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase.js';

/** @type {import('./$types').RequestHandler} */
export async function PUT({ params, request, locals }) {
    if (locals.user?.role !== 'admin') {
        return json({ error: 'Acceso no autorizado' }, { status: 403 });
    }

    try {
        const { name, email, role, program } = await request.json();
        const { id } = params;

        if (!name || !email || !role) {
            return json({ error: 'Faltan campos requeridos' }, { status: 400 });
        }

        const { error } = await supabase
            .from('users')
            .update({ name, email, role, program: program || null })
            .eq('id', id);

        if (error) throw error;
        return json({ success: true });
    } catch (error) {
        return json({ error: 'Error al actualizar usuario' }, { status: 500 });
    }
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ params, locals }) {
    if (locals.user?.role !== 'admin') {
        return json({ error: 'Acceso no autorizado' }, { status: 403 });
    }

    try {
        const { id } = params;

        // Eliminar progreso del usuario primero
        await supabase.from('progress').delete().eq('user_id', id);
        
        // Eliminar usuario
        const { error } = await supabase.from('users').delete().eq('id', id);
        
        if (error) throw error;
        return json({ success: true });
    } catch (error) {
        return json({ error: 'Error al eliminar usuario' }, { status: 500 });
    }
}