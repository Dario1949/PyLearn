import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase.js';
import { v4 as uuidv4 } from 'uuid';

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals }) {
    if (locals.user?.role !== 'admin') {
        return json({ error: 'Acceso no autorizado' }, { status: 403 });
    }

    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('id, name, email, role, program, created_at')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return json(users || []);
    } catch (error) {
        return json({ error: 'Error al cargar usuarios' }, { status: 500 });
    }
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
    if (locals.user?.role !== 'admin') {
        return json({ error: 'Acceso no autorizado' }, { status: 403 });
    }

    try {
        const { name, email, password, role, program } = await request.json();

        if (!name || !email || !password || !role) {
            return json({ error: 'Faltan campos requeridos' }, { status: 400 });
        }

        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return json({ error: 'El correo ya está en uso' }, { status: 409 });
        }

        const newUserId = uuidv4();
        
        const { error: userError } = await supabase
            .from('users')
            .insert({
                id: newUserId,
                name,
                email,
                password,
                role,
                program: program || null,
                created_at: new Date().toISOString()
            });

        if (userError) throw userError;

        const { error: progressError } = await supabase
            .from('progress')
            .insert({
                user_id: newUserId,
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

        return json({ success: true }, { status: 201 });
    } catch (error) {
        return json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}