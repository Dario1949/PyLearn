import fs from 'fs';
import path from 'path';
import { json } from '@sveltejs/kit';

const usersPath = path.resolve('src/lib/data/users.json');

/** @type {import('./$types').RequestHandler} */
export async function GET() {
    try {
        let needsSetup = true; // Por defecto, asumimos que necesita configuración

        if (fs.existsSync(usersPath)) {
            const usersData = fs.readFileSync(usersPath, 'utf-8');
            const users = JSON.parse(usersData);
            // Si hay al menos un usuario, ya no necesita configuración inicial
            if (users.length > 0) {
                needsSetup = false;
            }
        }

        return json({ needsInitialSetup: needsSetup });

    } catch (error) {
        console.error('Error verificando el estado de la aplicación:', error);
        return json({ error: 'No se pudo verificar el estado de la aplicación.' }, { status: 500 });
    }
}