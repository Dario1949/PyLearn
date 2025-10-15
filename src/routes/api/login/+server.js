import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, cookies }) {
    const { email, password } = await request.json();

    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();

    if (error || !user) {
        return json({ success: false, error: 'Credenciales incorrectas' }, { status: 401 });
    }

    // Establecemos una cookie segura que contiene el ID del usuario.
    cookies.set('session_id', user.id, {
        path: '/',
        httpOnly: true, // Impide el acceso a la cookie desde JavaScript en el navegador
        sameSite: 'strict', // Mejora la seguridad contra ataques CSRF
        secure: process.env.NODE_ENV === 'production', // Asegura que la cookie solo se envíe por HTTPS en producción
        maxAge: 60 * 60 * 24 * 7 // Duración de la cookie: 1 semana
    });

    // Devolvemos los datos del usuario, EXCLUYENDO la contraseña.
    const { password: _, ...userToReturn } = user;
    return json({ success: true, user: userToReturn });
}
