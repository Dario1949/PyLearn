import fs from 'fs';
import path from 'path';
import { json } from '@sveltejs/kit';

const usersPath = path.resolve('src/lib/data/users.json');
const progressPath = path.resolve('src/lib/data/progress.json');

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	try {
		const allUsers = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
		const allProgress = JSON.parse(fs.readFileSync(progressPath, 'utf-8'));

		const progressMap = new Map(allProgress.map(p => [p.userId, p]));

		// Cargar preguntas del foro para contar publicaciones resueltas
	let forumQuestions = [];
	try {
		const questionsPath = path.resolve('src/lib/data/forum-questions.json');
		if (fs.existsSync(questionsPath)) {
			forumQuestions = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));
		}
	} catch (error) {
		console.warn('No se pudieron cargar las preguntas del foro:', error);
	}

	const combinedUsers = allUsers
			.filter(user => user.role === 'student') // Solo incluimos estudiantes en el ranking
			.map(user => {
				const { password, ...userProfile } = user;
				const userProgress = progressMap.get(user.id);
				const points = userProgress?.points || 0;
				const completedModules = userProgress?.completedModules || [];
				const level = Math.max(1, completedModules.length);
				
				// Contar publicaciones resueltas del usuario
				const solvedPosts = forumQuestions.filter(q => q.authorId === user.id && q.solved).length;

				return {
					...userProfile,
					id: user.id,
					points,
					level,
					completedModules,
					solvedPosts,
					badges: userProgress?.earnedBadges || []
				};
			});

		// Ordenamos los usuarios por puntos de mayor a menor
		const sortedUsers = combinedUsers.sort((a, b) => b.points - a.points);

		// Asignamos el rango (posición) a cada usuario después de ordenar
		const rankedUsers = sortedUsers.map((user, index) => ({
			...user,
			rank: index + 1
		}));

		return json({ leaderboard: rankedUsers });

	} catch (error) {
		console.error('Error al generar el leaderboard:', error);
		return json({ error: 'No se pudo generar la tabla de clasificación.' }, { status: 500 });
	}
}