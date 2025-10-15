import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase.js';

// --- GET: Devuelve todos los prompts actuales ---
/** @type {import('./$types').RequestHandler} */
export async function GET({ locals }) {
    // Seguridad: solo los admins pueden leer los prompts
    if (locals.user?.role !== 'admin') {
        return json({ error: 'Acceso no autorizado' }, { status: 403 });
    }

    try {
        const { data: prompts, error } = await supabase
            .from('prompts')
            .select('*')
            .single();

        if (error) throw error;
        return json(prompts.content || {});
    } catch (error) {
        return json({ error: 'No se pudieron cargar los prompts.' }, { status: 500 });
    }
}

// --- POST: Actualiza y guarda los prompts ---
/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
    // Seguridad: solo los admins pueden modificar los prompts
    if (locals.user?.role !== 'admin') {
        return json({ error: 'Acceso no autorizado' }, { status: 403 });
    }

    try {
        const updatedPrompts = await request.json();
        
        const { error } = await supabase
            .from('prompts')
            .upsert({ id: 1, content: updatedPrompts });

        if (error) throw error;
        return json({ success: true, message: 'Prompts actualizados con éxito.' });
    } catch (error) {
        return json({ error: 'No se pudieron guardar los prompts.' }, { status: 500 });
    }
}
