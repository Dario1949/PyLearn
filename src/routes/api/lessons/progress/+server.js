import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
    if (!locals.user) {
        return json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const { lessonId, moduleId, completed, userId: requestUserId } = await request.json();
        const userId = requestUserId || locals.user.id;

        // Marcar lección como completada o no completada
        const { error: upsertError } = await supabase
            .from('lesson_progress')
            .upsert({
                user_id: userId,
                lesson_id: lessonId,
                module_id: moduleId,
                completed,
                completed_at: completed ? new Date().toISOString() : null
            }, { onConflict: 'user_id,lesson_id' });

        if (upsertError) throw upsertError;

        // Calcular progreso del módulo
        const { data: allLessons, error: lessonsError } = await supabase
            .from('lessons')
            .select('id')
            .eq('module_id', moduleId);

        if (lessonsError) {
            console.error('Error fetching lessons for progress:', lessonsError);
            // If no lessons table, just return success
            return json({ 
                success: true, 
                moduleProgress: 0,
                moduleCompleted: false,
                challengeUnlocked: false
            });
        }

        const { data: completedLessons } = await supabase
            .from('lesson_progress')
            .select('lesson_id')
            .eq('user_id', userId)
            .eq('module_id', moduleId)
            .eq('completed', true);

        const totalLessons = allLessons?.length || 0;
        const completedCount = completedLessons?.length || 0;
        const progressPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
        const moduleCompleted = progressPercentage === 100;

        // Actualizar progreso del módulo en la tabla progress
        if (moduleCompleted) {
            const { data: currentProgress } = await supabase
                .from('progress')
                .select('completed_modules')
                .eq('user_id', userId)
                .single();

            const completedModules = currentProgress?.completed_modules || [];
            if (!completedModules.includes(moduleId)) {
                completedModules.push(moduleId);
                
                await supabase
                    .from('progress')
                    .update({ 
                        completed_modules: completedModules,
                        last_activity: new Date().toISOString().split('T')[0]
                    })
                    .eq('user_id', userId);
            }
        }

        return json({ 
            success: true, 
            moduleProgress: progressPercentage,
            moduleCompleted,
            challengeUnlocked: moduleCompleted
        });

    } catch (error) {
        console.error('Error actualizando progreso:', error);
        return json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

/** @type {import('./$types').RequestHandler} */
export async function GET({ url, locals }) {
    if (!locals.user) {
        return json({ error: 'No autorizado' }, { status: 401 });
    }

    const moduleId = url.searchParams.get('moduleId');
    const requestUserId = url.searchParams.get('userId');
    if (!moduleId) {
        return json({ error: 'moduleId requerido' }, { status: 400 });
    }

    try {
        const userId = requestUserId || locals.user.id;

        // Obtener progreso de lecciones del módulo
        const { data: lessonProgress } = await supabase
            .from('lesson_progress')
            .select('lesson_id, completed, completed_at')
            .eq('user_id', userId)
            .eq('module_id', moduleId);

        // Obtener todas las lecciones del módulo
        const { data: allLessons, error: lessonsError } = await supabase
            .from('lessons')
            .select('id, title, content')
            .eq('module_id', moduleId)
            .order('id');

        if (lessonsError) {
            console.error('Error fetching lessons:', lessonsError);
            // If lessons table doesn't exist, return empty data
            return json({
                lessons: [],
                progress: 0,
                challengeUnlocked: false
            });
        }

        const progressMap = new Map(lessonProgress?.map(p => [p.lesson_id, p]) || []);
        
        const lessonsWithProgress = allLessons?.map(lesson => ({
            ...lesson,
            completed: progressMap.get(lesson.id)?.completed || false,
            completedAt: progressMap.get(lesson.id)?.completed_at
        })) || [];

        const totalLessons = lessonsWithProgress.length;
        const completedCount = lessonsWithProgress.filter(l => l.completed).length;
        const progressPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

        return json({
            lessons: lessonsWithProgress,
            progress: progressPercentage,
            challengeUnlocked: progressPercentage === 100
        });

    } catch (error) {
        console.error('Error obteniendo progreso:', error);
        return json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}