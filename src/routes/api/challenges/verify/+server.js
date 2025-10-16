import { GoogleGenerativeAI } from '@google/generative-ai';
import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase.js';

// 1. Leemos la clave de API de forma segura desde las variables de entorno
import { PRIVATE_GOOGLE_API_KEY, PRIVATE_GOOGLE_MODEL } from '$env/static/private';

// Inicializa el cliente de IA
const genAI = new GoogleGenerativeAI(PRIVATE_GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: PRIVATE_GOOGLE_MODEL });



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
        // 3. Leemos la plantilla del prompt desde Supabase
        const { data: prompts } = await supabase.from('prompts').select('*').eq('key', 'verificarReto').single();
        let promptTemplate = prompts.content;

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
