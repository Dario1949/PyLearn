import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase.js';

// Función para generar un challenge básico
function generateBasicChallenge(topic, difficulty, moduleId) {
  const challengeId = `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id: challengeId,
    moduleId: moduleId,
    title: `Reto de ${topic}`,
    description: `Resuelve este ejercicio de ${topic} con nivel ${difficulty}`,
    category: "programming",
    difficulty: difficulty,
    points: difficulty === 'easy' ? 50 : difficulty === 'medium' ? 75 : 100,
    timeLimit: 30,
    code: "# Escribe tu código aquí\nprint('Hola mundo')",
    testCases: [
      { input: "", expected: "Hola mundo" }
    ]
  };
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const { topic = 'funciones básicas', difficulty = 'easy', moduleId = null } = await request.json();

    // Generar challenge básico
    const newChallenge = generateBasicChallenge(topic, difficulty, moduleId);

    // Guardar el nuevo reto en Supabase
    const mappedChallenge = {
      id: newChallenge.id,
      module_id: moduleId || newChallenge.moduleId,
      title: newChallenge.title,
      description: newChallenge.description,
      category: newChallenge.category,
      difficulty: newChallenge.difficulty,
      points: newChallenge.points,
      time_limit: newChallenge.timeLimit,
      code: newChallenge.code,
      test_cases: newChallenge.testCases
    };
    
    await supabase.from('challenges').upsert(mappedChallenge);

    return json({ success: true, challenge: newChallenge });

  } catch (error) {
    console.error('Error generando reto:', error);
    return json({ success: false, error: 'No se pudo generar el reto.' }, { status: 500 });
  }
}
