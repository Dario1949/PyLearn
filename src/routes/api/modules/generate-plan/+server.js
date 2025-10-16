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
      model: 'gemini-pro',
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

    // --- LÓGICA DE GUARDADO - AGREGAR EN LUGAR DE REEMPLAZAR ---
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
      await supabase.from('modules').insert(mappedModules);
    }

    // Buscar módulos existentes sin retos y agregar a la lista de procesamiento
    const { data: existingModules } = await supabase
      .from('modules')
      .select('*')
      .is('challenge_id', null);
    
    const allModulesToProcess = [...(generatedData.modules || [])];
    if (existingModules?.length > 0) {
      allModulesToProcess.push(...existingModules);
      console.log(`Encontrados ${existingModules.length} módulos existentes sin retos`);
    }

    // Generar retos para todos los módulos
    for (const module of allModulesToProcess) {
      try {
        let challengeToInsert = null;
        
        // Para módulos nuevos, intentar usar el reto generado por IA
        if (generatedData.challenges && generatedData.modules?.some(m => m.id === module.id)) {
          const moduleChallenge = generatedData.challenges.find(c => c.moduleId === module.id);
          if (moduleChallenge) {
            challengeToInsert = {
              id: moduleChallenge.id,
              module_id: module.id,
              title: moduleChallenge.title,
              description: moduleChallenge.description,
              category: moduleChallenge.category,
              difficulty: moduleChallenge.difficulty,
              points: moduleChallenge.points,
              time_limit: moduleChallenge.timeLimit,
              code: moduleChallenge.code,
              test_cases: moduleChallenge.testCases
            };
          }
        }
        
        // Si no hay reto generado, crear uno nuevo
        if (!challengeToInsert) {
          const challengeModel = genAI.getGenerativeModel({ model: 'gemini-pro' });
          const { data: challengePrompts } = await supabase.from('prompts').select('*').eq('key', 'generarReto').single();
          
          if (challengePrompts?.content) {
            const challengePrompt = challengePrompts.content
              .replace('{topic}', module.title)
              .replace('{difficulty}', module.difficulty || 'medium');
            
            const challengeResult = await challengeModel.generateContent(challengePrompt);
            const challengeText = challengeResult.response.text();
            const cleanedText = challengeText.match(/```json\s*([\s\S]*?)\s*```/) ? 
              challengeText.match(/```json\s*([\s\S]*?)\s*```/)[1].trim() : challengeText.trim();
            
            const generatedChallenge = JSON.parse(cleanedText);
            
            challengeToInsert = {
              id: generatedChallenge.id,
              module_id: module.id,
              title: generatedChallenge.title,
              description: generatedChallenge.description,
              category: generatedChallenge.category,
              difficulty: generatedChallenge.difficulty,
              points: generatedChallenge.points,
              time_limit: generatedChallenge.timeLimit,
              code: generatedChallenge.code,
              test_cases: generatedChallenge.testCases
            };
          }
        }
        
        // Insertar el reto y actualizar el módulo
        if (challengeToInsert) {
          await supabase.from('challenges').insert(challengeToInsert);
          await supabase.from('modules').update({ challenge_id: challengeToInsert.id }).eq('id', module.id);
          console.log(`Reto ${challengeToInsert.id} asociado al módulo ${module.title}`);
        }
        
      } catch (error) {
        console.error(`Error generando reto para módulo ${module.title}:`, error);
      }
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

    console.log('Successfully generated and saved new modules, challenges, and lessons.');

    return json({ success: true, message: 'Ruta de aprendizaje, retos y lecciones generados con éxito.' });

  } catch (error) {
    console.error('Error generando la ruta de aprendizaje:', error);
    return json({ success: false, error: 'No se pudo generar la ruta de aprendizaje.' }, { status: 500 });
  }
}
