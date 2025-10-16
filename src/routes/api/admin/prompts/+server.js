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
            .select('*');

        if (error) {
            console.error('Error cargando prompts:', error);
            return json([]);
        }
        
        return json(prompts || []);
    } catch (error) {
        console.error('Error cargando prompts:', error);
        return json([]);
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
        
        // Actualizar cada prompt individualmente
        for (const prompt of updatedPrompts) {
            const { error } = await supabase
                .from('prompts')
                .upsert(prompt, { onConflict: 'key' });
            
            if (error) {
                console.error('Error actualizando prompt:', prompt.key, error);
                throw error;
            }
        }

        return json({ success: true, message: 'Prompts actualizados con éxito.' });
    } catch (error) {
        console.error('Error guardando prompts:', error);
        return json({ error: `No se pudieron guardar los prompts: ${error.message}` }, { status: 500 });
    }
}
