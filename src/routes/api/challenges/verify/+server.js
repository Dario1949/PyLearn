import { GoogleGenerativeAI } from '@google/generative-ai';
import { json } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';

// 1. Leemos la clave de API de forma segura desde las variables de entorno
import { PRIVATE_GOOGLE_API_KEY } from '$env/static/private';

// Inicializa el cliente de IA
const genAI = new GoogleGenerativeAI(PRIVATE_GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// 2. Definimos la ruta al archivo de prompts
const promptsPath = path.resolve('src/lib/data/prompts.json');

// Función para limpiar la respuesta de la IA si viene envuelta en markdown
function cleanJsonString(str) {
    const match = str.match(/```json\s*([\s\S]*?)\s*```/);
    return match ? match[1].trim() : str.trim();
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
    try {
        const { challenge, userCode } = await request.json();

        if (!challenge || !userCode) {
            return json({ success: false, error: 'Faltan datos para la verificación.' }, { status: 400 });
        }

        // --- ¡MEJORA CLAVE! ---
        // 3. Leemos la plantilla del prompt desde el archivo JSON
        const prompts = JSON.parse(fs.readFileSync(promptsPath, 'utf-8'));
        let promptTemplate = prompts.verificarReto;

        // 4. Reemplazamos las variables en la plantilla con los datos recibidos
        const prompt = promptTemplate
            .replace('${challenge.description}', challenge.description)
            .replace('${userCode}', userCode);

        // 5. Llamamos al modelo de IA con el prompt dinámico
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        const cleanedText = cleanJsonString(responseText);
        const verificationData = JSON.parse(cleanedText);

        return json({ success: true, verification: verificationData }, { status: 200 });

    } catch (error) {
        console.error('Error verificando el reto con IA:', error);
        return json({ success: false, error: 'No se pudo verificar el código en este momento.' }, { status: 500 });
    }
}