import fs from 'fs';
import path from 'path';
import { json } from '@sveltejs/kit';

const usersPath = path.resolve('src/lib/data/users.json');

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, cookies }) {
    const { email, password } = await request.json();

    if (!fs.existsSync(usersPath)) {
        return json({ success: false, error: 'Base de datos no encontrada.' }, { status: 500 });
    }

    const users = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
    // En una aplicación real, NUNCA guardes contraseñas en texto plano. Usa librerías como bcrypt para compararlas.
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
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