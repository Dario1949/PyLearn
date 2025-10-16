import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase.js';

// Función para generar módulos básicos
function generateBasicModules(topic, numModules) {
  const modules = [];
  const lessons = [];
  const challenges = [];
  
  for (let i = 1; i <= numModules; i++) {
    const moduleId = `module_${Date.now()}_${i}`;
    const challengeId = `challenge_${Date.now()}_${i}`;
    
    modules.push({
      id: moduleId,
      title: `${topic} - Módulo ${i}`,
      description: `Aprende conceptos básicos de ${topic}`,
      icon: "📚",
      difficulty: i <= 3 ? "easy" : i <= 6 ? "medium" : "hard",
      duration: 30,
      challengeId: challengeId
    });
    
    lessons.push({
      id: `lesson_${Date.now()}_${i}`,
      moduleId: moduleId,
      title: `Lección ${i}`,
      content: `Contenido de la lección ${i} sobre ${topic}`
    });
    
    challenges.push({
      id: challengeId,
      moduleId: moduleId,
      title: `Reto ${i}`,
      description: `Resuelve este ejercicio de ${topic}`,
      category: "programming",
      difficulty: i <= 3 ? "easy" : i <= 6 ? "medium" : "hard",
      points: i <= 3 ? 50 : i <= 6 ? 75 : 100,
      timeLimit: 30,
      code: "# Escribe tu código aquí\nprint('Hola mundo')",
      testCases: [{ input: "", expected: "Hola mundo" }]
    });
  }
  
  return { modules, lessons, challenges };
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const { topic = 'fundamentos de Python', numModules = 8 } = await request.json();

    // Generar datos básicos sin IA
    const generatedData = generateBasicModules(topic, numModules);

    // Guardar módulos
    if (generatedData.modules) {
      const mappedModules = generatedData.modules.map(m => ({
        id: m.id,
        title: m.title,
        description: m.description,
        icon: m.icon,
        difficulty: m.difficulty,
        duration: m.duration,
        challenge_id: m.challengeId
      }));
      await supabase.from('modules').insert(mappedModules);
    }

    // Guardar challenges
    if (generatedData.challenges) {
      const mappedChallenges = generatedData.challenges.map(c => ({
        id: c.id,
        module_id: c.moduleId,
        title: c.title,
        description: c.description,
        category: c.category,
        difficulty: c.difficulty,
        points: c.points,
        time_limit: c.timeLimit,
        code: c.code,
        test_cases: c.testCases
      }));
      await supabase.from('challenges').insert(mappedChallenges);
    }

    if (generatedData.lessons) {
      const mappedLessons = generatedData.lessons.map(l => ({
        id: l.id,
        module_id: l.moduleId,
        title: l.title,
        content: l.content
      }));
      await supabase.from('lessons').insert(mappedLessons);
    }

    return json({ success: true, message: 'Módulos generados con éxito.' });

  } catch (error) {
    console.error('Error generando módulos:', error);
    return json({ success: false, error: 'No se pudo generar los módulos.' }, { status: 500 });
  }
}
