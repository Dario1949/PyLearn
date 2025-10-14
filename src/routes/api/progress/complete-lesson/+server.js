import fs from 'fs';
import path from 'path';
import { json } from '@sveltejs/kit';

const progressPath = path.resolve('src/lib/data/progress.json');
const pointsMap = { fácil: 5, medio: 10, difícil: 15 };

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	try {
		const { userId, moduleId, challengeDifficulty, points } = await request.json();
		if (!userId || !moduleId || !challengeDifficulty) {
			return json({ success: false, error: 'Faltan datos.' }, { status: 400 });
		}

		let allProgress = JSON.parse(fs.readFileSync(progressPath, 'utf-8'));
		const progressIndex = allProgress.findIndex(p => p.userId === userId);

		if (progressIndex === -1) {
			return json({ success: false, error: 'Usuario no encontrado.' }, { status: 404 });
		}

		// Inicializamos el array si no existe
		if (!allProgress[progressIndex].completedModules) {
			allProgress[progressIndex].completedModules = [];
		}

		// Si el módulo no ha sido completado antes, añadimos puntos y lo marcamos como completado
		if (!allProgress[progressIndex].completedModules.includes(moduleId)) {
			const pointsToAdd = points || 5;
			allProgress[progressIndex].points += pointsToAdd;
			// Mantener el total de puntos ganados para el cálculo de nivel
			if (!allProgress[progressIndex].totalPointsEarned) {
				allProgress[progressIndex].totalPointsEarned = allProgress[progressIndex].points;
			} else {
				allProgress[progressIndex].totalPointsEarned += pointsToAdd;
			}
			// Calcular nivel basado en módulos completados
			const completedCount = allProgress[progressIndex].completedModules.length;
			allProgress[progressIndex].level = Math.max(1, completedCount);
			
			allProgress[progressIndex].completedModules.push(moduleId);
			allProgress[progressIndex].lastActivity = new Date().toISOString().split('T')[0];
		}
		
		fs.writeFileSync(progressPath, JSON.stringify(allProgress, null, 2));

		return json({ success: true, progress: allProgress[progressIndex] });
	} catch (error) {
		console.error('Error al completar la lección:', error);
		return json({ success: false, error: 'Error interno del servidor.' }, { status: 500 });
	}
}