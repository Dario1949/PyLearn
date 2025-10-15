import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase.js';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	try {
		const { data: allUsers } = await supabase.from('users').select('*');
		const { data: allProgress } = await supabase.from('progress').select('*');
		const { data: forumQuestions } = await supabase.from('forum_questions').select('author_id, solved');

		const progressMap = new Map(allProgress?.map(p => [p.user_id, p]) || []);

		const combinedUsers = allUsers
			?.filter(user => user.role === 'student')
			.map(user => {
				const { password, ...userProfile } = user;
				const userProgress = progressMap.get(user.id);
				const points = userProgress?.points || 0;
				const completedModules = userProgress?.completed_modules || [];
				const level = Math.max(1, completedModules.length);
				
				const solvedPosts = forumQuestions?.filter(q => q.author_id === user.id && q.solved).length || 0;

				return {
					...userProfile,
					id: user.id,
					points,
					level,
					completedModules,
					solvedPosts,
					badges: userProgress?.earned_badges || []
				};
			}) || [];

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
