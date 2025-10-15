import { GoogleGenerativeAI } from '@google/generative-ai';
import { PRIVATE_GOOGLE_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase.js';

// 1. Leemos la clave de API de forma segura
const genAI = new GoogleGenerativeAI(PRIVATE_GOOGLE_API_KEY);

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const { topic = 'fundamentos de Python', numModules = 8 } = await request.json();

    // Activamos el "Modo JSON" para asegurar que la respuesta de la IA sea válida
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json'
      }
    });

    // Leemos la plantilla del prompt desde Supabase
    const { data: prompts } = await supabase.from('prompts').select('*').eq('key', 'generarPlanDeModulo').single();
    const promptTemplate = prompts?.content;

    if (!promptTemplate) {
      throw new Error("La plantilla del prompt 'generarPlanDeModulo' no se encontró en Supabase");
    }

    const prompt = promptTemplate
      .replace('{topic}', topic)
      .replace('{numModules}', numModules);

    // Llamamos al modelo de IA
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // La respuesta de la IA ahora es un objeto con tres arrays: modules, challenges y lessons
    const generatedData = JSON.parse(responseText);

    // --- ¡LÓGICA DE GUARDADO MEJORADA! ---
    // Guardamos cada parte en Supabase
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
      await supabase.from('modules').delete().neq('id', 'dummy');
      await supabase.from('modules').insert(mappedModules);
    }

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
      await supabase.from('challenges').delete().neq('id', 'dummy');
      await supabase.from('challenges').insert(mappedChallenges);
    }

    if (generatedData.lessons) {
      const mappedLessons = generatedData.lessons.map(l => ({
        id: l.id,
        module_id: l.moduleId,
        title: l.title,
        content: l.content
      }));
      await supabase.from('lessons').delete().neq('id', 'dummy');
      await supabase.from('lessons').insert(mappedLessons);
    }

    console.log('Successfully generated and saved new modules, challenges, and lessons.');

    return json({ success: true, message: 'Ruta de aprendizaje, retos y lecciones generados con éxito.' });

  } catch (error) {
    console.error('Error generando la ruta de aprendizaje:', error);
    return json({ success: false, error: 'No se pudo generar la ruta de aprendizaje.' }, { status: 500 });
  }
}
