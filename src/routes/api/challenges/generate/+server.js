import { GoogleGenerativeAI } from '@google/generative-ai';
import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase.js';

// 1. Leemos la clave de API de forma segura desde las variables de entorno
import { PRIVATE_GOOGLE_API_KEY } from '$env/static/private';

// Inicializa el cliente de IA
const genAI = new GoogleGenerativeAI(PRIVATE_GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });



// Función para limpiar la respuesta de la IA si viene envuelta en markdown
function cleanJsonString(str) {
  const match = str.match(/```json\s*([\s\S]*?)\s*```/);
  return match ? match[1].trim() : str.trim();
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const { topic = 'funciones básicas', difficulty = 'easy' } = await request.json();

    // --- ¡MEJORA CLAVE! ---
    // 3. Leemos la plantilla del prompt desde Supabase
    const { data: prompts } = await supabase.from('prompts').select('*').eq('key', 'generarReto').single();
    let promptTemplate = prompts.content;

    // 4. Reemplazamos las variables en la plantilla con los valores recibidos
    const prompt = promptTemplate
      .replace('{topic}', topic)
      .replace('{difficulty}', difficulty);

    // 5. Llamamos al modelo de IA con el prompt dinámico
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const newChallenge = JSON.parse(cleanJsonString(responseText));

    // 6. Guardamos el nuevo reto en Supabase
    const mappedChallenge = {
      id: newChallenge.id,
      module_id: newChallenge.moduleId,
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
    console.error('Error generando y guardando el reto con IA:', error);
    return json({ success: false, error: 'No se pudo generar el reto en este momento.' }, { status: 500 });
  }
}
