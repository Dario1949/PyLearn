// src/routes/api/progress/award-challenge/+server.js
import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase.js';

const pointsMap = { 'fácil': 5, 'medio': 10, 'difícil': 15 };

function todayYMD(timeZone = 'America/Bogota') {
  // 'en-CA' => YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(new Date());
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const { userId, challengeId, lessonId, moduleId, challengeDifficulty, points } = await request.json();
    console.log('Datos recibidos:', { userId, challengeId, lessonId, moduleId, challengeDifficulty, points });
    
    if (!userId || (!challengeId && !lessonId)) {
      return json({ success: false, error: 'Faltan datos (userId y challengeId o lessonId).' }, { status: 400 });
    }

    // 1) Traer progreso actual
    const { data: userProgress, error: fetchError } = await supabase
      .from('progress')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (fetchError) return json({ success: false, error: fetchError.message }, { status: 500 });

    const prev = userProgress ?? {};
    const completedChallenges = Array.isArray(prev.completed_challenges) ? prev.completed_challenges : [];
    const completedLessons = Array.isArray(prev.completed_lessons) ? prev.completed_lessons : [];
    const completedModules = Array.isArray(prev.completed_modules) ? prev.completed_modules : [];

    console.log('Progreso actual:', { completedChallenges, completedLessons, completedModules });
    
    const alreadyHasChallenge = challengeId ? completedChallenges.includes(challengeId) : false;
    const alreadyHasLesson = lessonId ? completedLessons.includes(lessonId) : false;
    console.log('¿Reto ya completado?', alreadyHasChallenge);
    console.log('¿Lección ya completada?', alreadyHasLesson);

    // 2) Puntos a sumar
    const normalized = String(challengeDifficulty ?? '').toLowerCase().trim();
    const defaultPts = points ?? 5;
    const pointsToAdd = Number.isFinite(points) ? Number(points) : defaultPts;

    // 3) Reconstruir listas
    const newCompletedChallenges = challengeId && !alreadyHasChallenge
      ? [...completedChallenges, challengeId]
      : completedChallenges;
      
    const newCompletedLessons = lessonId && !alreadyHasLesson
      ? [...completedLessons, lessonId]
      : completedLessons;

    // Agregar módulo si se proporciona y no está ya completado
    let newCompletedModules = [...completedModules];
    if (moduleId && !completedModules.includes(moduleId)) {
      // Verificar si todos los retos del módulo están completados
      const { data: moduleChallenges, error: mcErr } = await supabase
        .from('challenges')
        .select('id')
        .eq('module_id', moduleId);
      
      console.log('Retos del módulo:', moduleChallenges);
      
      if (!mcErr && moduleChallenges?.length) {
        const allDone = moduleChallenges.every(c => newCompletedChallenges.includes(c.id));
        console.log('¿Todos los retos completados?', allDone);
        
        if (allDone) {
          newCompletedModules.push(moduleId);
          console.log('Módulo agregado:', moduleId);
        }
      } else {
        // Si no hay retos asociados o hay error, agregar el módulo directamente
        newCompletedModules.push(moduleId);
        console.log('Módulo agregado directamente (sin retos asociados):', moduleId);
      }
    }

    // 4) Alinear contadores: si quieres acumulado en ambos campos:
    const basePoints = Number(prev.points ?? 0);
    const baseTotal = Number(prev.total_points_earned ?? prev.points ?? 0);
    const shouldAddPoints = (challengeId && !alreadyHasChallenge) || (lessonId && !alreadyHasLesson);
    const add = shouldAddPoints ? pointsToAdd : 0;

    const newPoints = basePoints + add;                 // acumulado
    const newTotal  = baseTotal + add;                  // histórico acumulado
    const newLevel  = Math.max(1, newCompletedModules.length);

    const payload = {
      user_id: userId,
      points: newPoints,
      total_points_earned: newTotal,
      level: newLevel,
      completed_challenges: newCompletedChallenges,
      completed_lessons: newCompletedLessons,
      completed_modules: newCompletedModules,
      last_activity: new Date().toISOString()
    };

    console.log('Payload final:', payload);

    // 5) UPSERT por user_id
    const { data: saved, error: upsertError } = await supabase
      .from('progress')
      .upsert(payload)
      .select();

    if (upsertError) {
      console.error('Error en upsert:', upsertError);
      return json({ success: false, error: upsertError.message }, { status: 500 });
    }
    
    console.log('Progreso guardado exitosamente:', saved);
    return json({ success: true, progress: saved });
  } catch (e) {
    console.error('Error al premiar reto:', e);
    return json({ success: false, error: 'Error interno del servidor.' }, { status: 500 });
  }
}
