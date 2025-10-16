// +server.js (SvelteKit endpoint)
import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase.js';

export async function POST({ request }) {
  try {
    const { userId, challengeId, points } = await request.json();
    console.log('Datos recibidos:', { userId, challengeId, points });
    
    if (!userId || !challengeId || points === undefined) {
      return json({ success: false, error: 'Faltan datos requeridos.' }, { status: 400 });
    }

    // Obtener progreso del usuario
    const { data: userProgress, error: fetchError } = await supabase
      .from('progress')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error obteniendo progreso:', fetchError);
      return json({ success: false, error: fetchError.message }, { status: 500 });
    }

    console.log('Progreso actual del usuario:', userProgress);

    const completedChallenges = userProgress?.completed_challenges ?? [];
    const completedModules = userProgress?.completed_modules ?? [];
    let newPoints = userProgress?.points ?? 0;

    console.log('Puntos actuales:', newPoints);
    console.log('Retos completados:', completedChallenges);
    console.log('¿Reto ya completado?', completedChallenges.includes(challengeId));

    // Sumar puntos solo si el reto no estaba completado
    let newCompletedChallenges = [...completedChallenges];
    if (!completedChallenges.includes(challengeId)) {
      newPoints += points;
      newCompletedChallenges.push(challengeId);
      console.log('Nuevos puntos después de sumar:', newPoints);
    } else {
      console.log('Reto ya completado, no se suman puntos');
    }

    // Obtener módulo asociado al reto
    const { data: challenge } = await supabase
      .from('challenges')
      .select('module_id')
      .eq('id', challengeId)
      .single();

    let newCompletedModules = [...completedModules];
    const moduleId = challenge?.module_id;
    
    console.log('Módulo del reto:', moduleId);
    
    // Si completamos un reto, el módulo se considera completado
    if (moduleId && !completedModules.includes(moduleId)) {
      newCompletedModules.push(moduleId);
      console.log('Módulo completado agregado:', moduleId);
    }

    // Calcular nivel basado en módulos completados
    const newLevel = Math.max(1, newCompletedModules.length);
    
    // UPSERT: crea si no existe, actualiza si existe
    const payload = {
      user_id: userId,
      points: newPoints,
      level: newLevel,
      completed_challenges: newCompletedChallenges,
      completed_modules: newCompletedModules,
      last_activity: new Date().toISOString()
    };

    console.log('Payload a enviar:', payload);

    const { data: saved, error: upsertError } = await supabase
      .from('progress')
      .upsert(payload)
      .select();

    if (upsertError) {
      console.error('Error en upsert:', upsertError);
      return json({ success: false, error: upsertError.message }, { status: 500 });
    }

    console.log('Progreso guardado exitosamente:', saved);
    console.log('Módulos completados finales:', newCompletedModules);

    return json({ success: true, progress: saved });
  } catch (err) {
    console.error('Error en complete-challenge:', err);
    return json({ success: false, error: 'Error interno del servidor.' }, { status: 500 });
  }
}
