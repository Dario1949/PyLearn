import { GoogleGenerativeAI } from '@google/generative-ai';
import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase.js';

// Leemos la clave de API de forma segura desde las variables de entorno
import { PRIVATE_GOOGLE_API_KEY } from '$env/static/private';

// Inicializa el cliente de IA con el modelo correcto
const genAI = PRIVATE_GOOGLE_API_KEY ? new GoogleGenerativeAI(PRIVATE_GOOGLE_API_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' }) : null;

// Función para limpiar la respuesta de la IA si viene envuelta en markdown
function cleanJsonString(str) {
    const match = str.match(/```json\s*([\s\S]*?)\s*```/);
    return match ? match[1].trim() : str.trim();
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
    try {
        // Verificar que la IA está disponible
        if (!model) {
            console.error('Google AI no está configurado correctamente');
            return json({ success: false, error: 'Servicio de IA no disponible.' }, { status: 503 });
        }

        const { challenge, userCode } = await request.json();

        if (!challenge || !userCode) {
            return json({ success: false, error: 'Faltan datos para la verificación.' }, { status: 400 });
        }

        // Usar prompt por defecto simple
        const defaultPrompt = `Analiza el siguiente código Python y verifica si resuelve correctamente el reto:

Reto: ${challenge.description}
Código del usuario: ${userCode}

Responde ÚNICAMENTE en formato JSON con: {"isCorrect": boolean, "feedback": "string", "score": number}`;
        
        const result = await model.generateContent(defaultPrompt);
        const responseText = result.response.text();
        const cleanedText = cleanJsonString(responseText);
        const verificationData = JSON.parse(cleanedText);
        
        return json({ success: true, verification: verificationData }, { status: 200 });

    } catch (error) {
        console.error('Error verificando el reto con IA:', error);
        return json({ success: false, error: 'No se pudo verificar el código en este momento.' }, { status: 500 });
    }
}
