import { json } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';

const promptsPath = path.resolve('src/lib/data/prompts.json');

// --- GET: Devuelve todos los prompts actuales ---
/** @type {import('./$types').RequestHandler} */
export async function GET({ locals }) {
    // Seguridad: solo los admins pueden leer los prompts
    if (locals.user?.role !== 'admin') {
        return json({ error: 'Acceso no autorizado' }, { status: 403 });
    }

    try {
        const prompts = JSON.parse(fs.readFileSync(promptsPath, 'utf-8'));
        return json(prompts);
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
        // Aquí podrías añadir validación para asegurar que el JSON tiene la estructura correcta
        fs.writeFileSync(promptsPath, JSON.stringify(updatedPrompts, null, 2));
        return json({ success: true, message: 'Prompts actualizados con éxito.' });
    } catch (error) {
        return json({ error: 'No se pudieron guardar los prompts.' }, { status: 500 });
    }
}