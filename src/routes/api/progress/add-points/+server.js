import fs from 'fs';
import path from 'path';
import { json } from '@sveltejs/kit';

const progressPath = path.resolve('src/lib/data/progress.json');

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
    try {
        const { userId, points, reason } = await request.json();

        if (!userId || points === undefined) {
            return json({ success: false, error: 'Faltan datos (userId, points).' }, { status: 400 });
        }

        let allProgress = JSON.parse(fs.readFileSync(progressPath, 'utf-8'));
        const progressIndex = allProgress.findIndex(p => p.userId === userId);

        if (progressIndex === -1) {
            return json({ success: false, error: 'Usuario no encontrado.' }, { status: 404 });
        }

        // Añadimos los puntos al total del usuario
        allProgress[progressIndex].points += points;

        // (Opcional) Aquí podrías añadir lógica para registrar el historial de puntos ganados
        console.log(`Usuario ${userId} ganó ${points} puntos por: ${reason || 'Actividad'}`);

        fs.writeFileSync(progressPath, JSON.stringify(allProgress, null, 2));

        return json({ success: true, newTotalPoints: allProgress[progressIndex].points });

    } catch (error) {
        console.error('Error al añadir puntos:', error);
        return json({ success: false, error: 'Error interno del servidor.' }, { status: 500 });
    }
}