import fs from 'fs';
import path from 'path';
import { json } from '@sveltejs/kit';

const progressPath = path.resolve('src/lib/data/progress.json');
const modulesPath = path.resolve('src/lib/data/modules.json'); // Necesitamos saber qué reto pertenece a qué módulo

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
    try {
        const { userId, challengeId, points } = await request.json();

        if (!userId || !challengeId || points === undefined) {
            return json({ success: false, error: 'Faltan datos requeridos.' }, { status: 400 });
        }

        let allProgress = JSON.parse(fs.readFileSync(progressPath, 'utf-8'));
        const progressIndex = allProgress.findIndex(p => p.userId === userId);

        if (progressIndex === -1) {
            return json({ success: false, error: 'Progreso de usuario no encontrado.' }, { status: 404 });
        }

        const userProgress = allProgress[progressIndex];

        // Inicializamos los arrays si no existen para evitar errores
        if (!userProgress.completedChallenges) {
            userProgress.completedChallenges = [];
        }
        if (!userProgress.completedModules) {
            userProgress.completedModules = [];
        }

        // 1. Lógica principal: sumar puntos del reto solo si no estaba completado
        if (!userProgress.completedChallenges.includes(challengeId)) {
            userProgress.points += points;
            userProgress.completedChallenges.push(challengeId);
            console.log(`User ${userId} completed challenge ${challengeId} and earned ${points} points. Total: ${userProgress.points}`);
        } else {
            console.log(`Challenge ${challengeId} already completed by user ${userId}`);
        }
        userProgress.lastActivity = new Date().toISOString().split('T')[0];

        // 2. Lógica secundaria: ¿Este reto completa un MÓDULO?
        const allModules = JSON.parse(fs.readFileSync(modulesPath, 'utf-8'));
        // Buscamos si algún módulo tiene este reto como su reto final
        const moduleAssociated = allModules.find(m => m.challengeId === challengeId);

        if (moduleAssociated && !userProgress.completedModules.includes(moduleAssociated.id)) {
            // Si encontramos un módulo y no estaba ya completado, lo marcamos como tal.
            userProgress.completedModules.push(moduleAssociated.id);
            console.log(`User ${userId} completed module ${moduleAssociated.id} by finishing challenge ${challengeId}.`);
        }

        // 3. Guardamos todos los cambios
        fs.writeFileSync(progressPath, JSON.stringify(allProgress, null, 2));

        return json({ success: true, progress: userProgress });

    } catch (error) {
        console.error('Error al guardar el progreso del reto:', error);
        return json({ success: false, error: 'Error interno del servidor.' }, { status: 500 });
    }
}