import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase.js';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
    try {
        const { data: allUsers } = await supabase.from('users').select('*');
        const { data: allProgress } = await supabase.from('progress').select('*');

        // 1. Creamos un mapa de progreso usando el 'user_id' como clave
        const progressMap = new Map(allProgress?.map(p => [p.user_id, p]) || []);

        // 2. Filtramos los usuarios para obtener solo estudiantes
        const students = allUsers
            ?.filter(user => user.role === 'student')
            .map(user => {
                const { password, ...userProfile } = user;
                const userProgress = progressMap.get(user.id);
                
                const completedModules = userProgress?.completed_modules?.length || 0;
                const totalModules = 6;
                const calculatedProgress = Math.round((completedModules / totalModules) * 100);
                const averageScore = userProgress?.points ? Math.min(Math.round(userProgress.points * 10), 100) : 0;
                const status = 'inactive';

                return {
                    ...userProfile,
                    id: user.id,
                    points: userProgress?.points || 0,
                    level: userProgress?.level || 1,
                    progress: calculatedProgress,
                    completedModules: completedModules,
                    completedChallenges: userProgress?.completed_challenges?.length || 0,
                    averageScore: averageScore,
                    streak: userProgress?.streak || 0,
                    status: status,
                    lastActivity: userProgress?.last_activity || 'Nunca'
                };
            }) || [];

        return json({ students });

    } catch (error) {
        console.error('Error al combinar datos de estudiantes:', error);
        return json({ error: 'No se pudieron cargar los datos.' }, { status: 500 });
    }
}
