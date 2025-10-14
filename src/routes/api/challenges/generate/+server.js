import { GoogleGenerativeAI } from '@google/generative-ai';
import { json } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';

// 1. Leemos la clave de API de forma segura desde las variables de entorno
import { PRIVATE_GOOGLE_API_KEY } from '$env/static/private';

// Inicializa el cliente de IA
const genAI = new GoogleGenerativeAI(PRIVATE_GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// 2. Definimos las rutas a nuestros archivos de "base de datos"
const challengesPath = path.resolve('src/lib/data/challenges.json');
const promptsPath = path.resolve('src/lib/data/prompts.json');

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
    // 3. Leemos la plantilla del prompt desde el archivo JSON centralizado
    const prompts = JSON.parse(fs.readFileSync(promptsPath, 'utf-8'));
    let promptTemplate = prompts.generarReto;

    // 4. Reemplazamos las variables en la plantilla con los valores recibidos
    const prompt = promptTemplate
      .replace('{topic}', topic)
      .replace('{difficulty}', difficulty);

    // 5. Llamamos al modelo de IA con el prompt dinámico
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const newChallenge = JSON.parse(cleanJsonString(responseText));

    // 6. Guardamos el nuevo reto en nuestra base de datos de retos
    let allChallenges = [];
    if (fs.existsSync(challengesPath)) {
      const fileContent = fs.readFileSync(challengesPath, 'utf-8');
      // Verificamos que el archivo no esté vacío para evitar errores de parseo
      if (fileContent) {
        allChallenges = JSON.parse(fileContent);
      }
    }

    // Evitamos guardar duplicados si la IA genera el mismo ID
    if (!allChallenges.some((c) => c.id === newChallenge.id)) {
      allChallenges.push(newChallenge);
      fs.writeFileSync(challengesPath, JSON.stringify(allChallenges, null, 2));
    }

    return json({ success: true, challenge: newChallenge });

  } catch (error) {
    console.error('Error generando y guardando el reto con IA:', error);
    return json({ success: false, error: 'No se pudo generar el reto en este momento.' }, { status: 500 });
  }
}