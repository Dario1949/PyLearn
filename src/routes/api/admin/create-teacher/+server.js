import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase.js';
import { v4 as uuidv4 } from 'uuid';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
    // --- ¡SEGURIDAD! ---
    // Gracias al hook, podemos verificar el rol del usuario que hace la petición.
    if (locals.user?.role !== 'admin') {
        return json({ success: false, error: 'Acceso no autorizado' }, { status: 403 }); // 403 Forbidden
    }

    try {
        const { name, email, password } = await request.json();

        if (!name || !email || !password) {
            return json({ success: false, error: 'Faltan campos requeridos.' }, { status: 400 });
        }

        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return json({ success: false, error: 'El correo ya está en uso.' }, { status: 409 });
        }

        const newTeacherId = uuidv4();
        
        const { error: userError } = await supabase
            .from('users')
            .insert({
                id: newTeacherId,
                name,
                email,
                password,
                role: 'teacher',
                created_at: new Date().toISOString()
            });

        if (userError) throw userError;

        const { error: progressError } = await supabase
            .from('progress')
            .insert({
                user_id: newTeacherId,
                points: 0,
                level: 1,
                progress: 0,
                completed_modules: [],
                earned_badges: [],
                completed_challenges: [],
                average_score: 0,
                streak: 0,
                status: 'active',
                last_activity: new Date().toISOString().split('T')[0]
            });

        if (progressError) throw progressError;

        return json({ success: true, message: 'Docente creado con éxito.' }, { status: 201 });

    } catch (error) {
        console.error('Error creando docente:', error);
        return json({ success: false, error: 'Error interno del servidor.' }, { status: 500 });
    }
}
