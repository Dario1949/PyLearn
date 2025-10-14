import { GoogleGenerativeAI } from '@google/generative-ai';
import { PRIVATE_GOOGLE_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';

// 1. Leemos la clave de API de forma segura
const genAI = new GoogleGenerativeAI(PRIVATE_GOOGLE_API_KEY);

// 2. Definimos las rutas a todos los archivos de "base de datos" que modificaremos
const modulesPath = path.resolve('src/lib/data/modules.json');
const challengesPath = path.resolve('src/lib/data/challenges.json');
const lessonsPath = path.resolve('src/lib/data/lessons.json');
const promptsPath = path.resolve('src/lib/data/prompts.json');

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

    // Leemos la plantilla del prompt desde el archivo JSON centralizado
    const prompts = JSON.parse(fs.readFileSync(promptsPath, 'utf-8'));
    const promptTemplate = prompts.generarPlanDeModulo;

    if (!promptTemplate) {
      throw new Error("La plantilla del prompt 'generarPlanDeModulo' no se encontró en prompts.json");
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
    // Guardamos cada parte de la respuesta en su archivo correspondiente, sobreescribiendo el contenido anterior.
    fs.writeFileSync(modulesPath, JSON.stringify(generatedData.modules || [], null, 2));
    fs.writeFileSync(challengesPath, JSON.stringify(generatedData.challenges || [], null, 2));
    fs.writeFileSync(lessonsPath, JSON.stringify(generatedData.lessons || [], null, 2));

    console.log('Successfully generated and saved new modules, challenges, and lessons.');

    return json({ success: true, message: 'Ruta de aprendizaje, retos y lecciones generados con éxito.' });

  } catch (error) {
    console.error('Error generando la ruta de aprendizaje:', error);
    return json({ success: false, error: 'No se pudo generar la ruta de aprendizaje.' }, { status: 500 });
  }
}