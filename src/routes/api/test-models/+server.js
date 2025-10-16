import { GoogleGenerativeAI } from '@google/generative-ai';
import { json } from '@sveltejs/kit';
import { PRIVATE_GOOGLE_API_KEY } from '$env/static/private';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
    try {
        if (!PRIVATE_GOOGLE_API_KEY) {
            return json({ error: 'No API key configured' }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(PRIVATE_GOOGLE_API_KEY);
        
        // Lista de modelos para probar
        const modelsToTest = [
            'gemini-1.5-flash',
            'gemini-1.5-pro',
            'gemini-pro',
            'gemini-1.5-flash-latest',
            'gemini-1.5-pro-latest'
        ];

        const results = [];

        for (const modelName of modelsToTest) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent('Test');
                results.push({ model: modelName, status: 'working', response: 'OK' });
            } catch (error) {
                results.push({ 
                    model: modelName, 
                    status: 'error', 
                    error: error.message 
                });
            }
        }

        return json({ results });

    } catch (error) {
        return json({ error: error.message }, { status: 500 });
    }
}