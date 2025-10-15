import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase.js';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
    try {
        // Verificar si hay usuarios en Supabase
        const { data: users, error } = await supabase.from('users').select('id').limit(1);
        
        if (error) throw error;
        
        const needsSetup = users.length === 0;
        
        return json({ needsInitialSetup: needsSetup });

    } catch (error) {
        console.error('Error verificando el estado de la aplicación:', error);
        return json({ error: 'No se pudo verificar el estado de la aplicación.' }, { status: 500 });
    }
}
