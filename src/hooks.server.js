import '$lib/server/database-init.js';

import { redirect } from '@sveltejs/kit';
import { supabase } from '$lib/supabase.js';

// --- MEJORA: Definimos nuestras rutas privadas ---
const privateRoutes = [
    '/dashboard',
    '/profile',
    '/challenges',
    '/leaderboard',
    '/settings',
    '/teacher',
    '/admin'
];

export async function handle({ event, resolve }) {
    const sessionId = event.cookies.get('session_id');

    // Obtenemos al usuario basado en la cookie usando Supabase
    if (!sessionId) {
        event.locals.user = null;
    } else {
        try {
            const { data: user, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', sessionId)
                .single();
            
            if (user && !error) {
                const { password, ...safeUser } = user;
                event.locals.user = safeUser;
            } else {
                event.locals.user = null;
                // Si la sesión no es válida, limpiar la cookie
                if (error) {
                    event.cookies.delete('session_id', { path: '/' });
                }
            }
        } catch (e) {
            console.error('Error verificando sesión:', e);
            event.locals.user = null;
            event.cookies.delete('session_id', { path: '/' });
        }
    }

    // --- MEJORA: Lógica de protección de rutas ---

    // 1. Verificamos si la ruta actual es privada
    const isPrivateRoute = privateRoutes.some((route) => event.url.pathname.startsWith(route));

    if (isPrivateRoute && !event.locals.user) {
        // Si es una ruta privada y no hay usuario, redirigimos al login.
        throw redirect(303, '/auth/login');
    }

    // 2. Mantenemos la protección específica para la ruta de admin
    if (event.url.pathname.startsWith('/admin')) {
        if (event.locals.user?.role !== 'admin') {
            // Si es la ruta de admin pero el usuario no es admin, lo sacamos.
            throw redirect(303, '/'); // O a una página de 'acceso denegado'
        }
    }

    // Si pasa todas las verificaciones, la petición continúa.
    return resolve(event);
}