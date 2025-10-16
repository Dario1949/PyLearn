import { GoogleGenerativeAI } from '@google/generative-ai';
import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase.js';

// 1. Leemos la clave de API de forma segura desde las variables de entorno
import { PRIVATE_GOOGLE_API_KEY } from '$env/static/private';

// Validar que la API key existe
if (!PRIVATE_GOOGLE_API_KEY) {
  console.error('PRIVATE_GOOGLE_API_KEY no está configurada');
}

// Inicializa el cliente de IA
const genAI = PRIVATE_GOOGLE_API_KEY ? new GoogleGenerativeAI(PRIVATE_GOOGLE_API_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }) : null;



// Función para limpiar la respuesta de la IA si viene envuelta en markdown
function cleanJsonString(str) {
    const match = str.match(/```json\s*([\s\S]*?)\s*```/);
    return match ? match[1].trim() : str.trim();
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
    try {
        console.log('Iniciando verificación de challenge');
        console.log('API Key disponible:', !!PRIVATE_GOOGLE_API_KEY);
        
        // Verificar que la IA está disponible
        if (!model) {
            console.error('Google AI no está configurado correctamente');
            return json({ success: false, error: 'Servicio de IA no disponible.' }, { status: 503 });
        }

        const { challenge, userCode } = await request.json();
        console.log('Datos recibidos - Challenge:', !!challenge, 'UserCode:', !!userCode);

        if (!challenge || !userCode) {
            return json({ success: false, error: 'Faltan datos para la verificación.' }, { status: 400 });
        }

        // --- ¡MEJORA CLAVE! ---
        // 3. Leemos la plantilla del prompt desde Supabase
        const { data: prompts, error: promptError } = await supabase.from('prompts').select('*').eq('key', 'verificarReto').single();
        
        if (promptError || !prompts) {
            console.error('Error cargando prompt:', promptError);
            // Usar prompt por defecto si no se encuentra en la base de datos
            const defaultPrompt = `Analiza el siguiente código Python y verifica si resuelve correctamente el reto:

Reto: ${challenge.description}
Código del usuario: ${userCode}

Responde en formato JSON con: {"isCorrect": boolean, "feedback": "string", "score": number}`;
            
            const result = await model.generateContent(defaultPrompt);
            const responseText = result.response.text();
            const cleanedText = cleanJsonString(responseText);
            const verificationData = JSON.parse(cleanedText);
            
            return json({ success: true, verification: verificationData }, { status: 200 });
        }

        // 4. Reemplazamos las variables en la plantilla con los datos recibidos
        const prompt = prompts.content
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
        console.error('API Key disponible:', !!PRIVATE_GOOGLE_API_KEY);
        console.error('Modelo disponible:', !!model);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        // Devolver información más específica del error
        const errorMessage = error.message || 'No se pudo verificar el código en este momento.';
        return json({ 
            success: false, 
            error: errorMessage,
            details: {
                hasApiKey: !!PRIVATE_GOOGLE_API_KEY,
                hasModel: !!model,
                errorType: error.constructor.name
            }
        }, { status: 500 });
    }
}
