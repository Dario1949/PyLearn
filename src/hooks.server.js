import '$lib/server/database-init.js';

import fs from 'fs';
import path from 'path';
import { redirect } from '@sveltejs/kit';

const usersPath = path.resolve('src/lib/data/users.json');

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

    // Obtenemos al usuario basado en la cookie (esta parte no cambia)
    if (!sessionId) {
        event.locals.user = null;
    } else {
        const users = fs.existsSync(usersPath) ? JSON.parse(fs.readFileSync(usersPath, 'utf-8')) : [];
        const user = users.find((u) => u.id === sessionId);
        if (user) {
            const { password, ...safeUser } = user;
            event.locals.user = safeUser;
        } else {
            event.locals.user = null;
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