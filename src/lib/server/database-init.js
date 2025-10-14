import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PRIVATE_GOOGLE_API_KEY } from '$env/static/private';

// Rutas a todos los archivos de datos
const modulesPath = path.resolve('src/lib/data/modules.json');
const challengesPath = path.resolve('src/lib/data/challenges.json');
const lessonsPath = path.resolve('src/lib/data/lessons.json');
const promptsPath = path.resolve('src/lib/data/prompts.json');

// Usamos una función asíncrona autoejecutable (IIFE)
(async () => {
	// 1. Verificamos si los módulos ya existen. Si es así, no hacemos nada.
	if (fs.existsSync(modulesPath)) {
		const fileContent = fs.readFileSync(modulesPath, 'utf-8');
		if (fileContent && fileContent.trim() !== '[]' && fileContent.trim() !== '') {
			console.log('Database (`modules.json`) already populated. Skipping AI initialization.');
			return;
		}
	}

	console.log('Database is empty. Calling AI to generate default content...');

	try {
		const genAI = new GoogleGenerativeAI(PRIVATE_GOOGLE_API_KEY);
		// Activamos el "Modo JSON" para asegurar una respuesta válida
		const model = genAI.getGenerativeModel({
			model: 'gemini-1.5-flash',
			generationConfig: {
				responseMimeType: 'application/json'
			}
		});

		// Preparamos el prompt
		const prompts = JSON.parse(fs.readFileSync(promptsPath, 'utf-8'));
		const promptTemplate = prompts.generarPlanDeModulo;

		if (!promptTemplate) {
			throw new Error("La plantilla del prompt 'generarPlanDeModulo' no se encontró en prompts.json");
		}

		const prompt = promptTemplate
			.replace('{topic}', 'Fundamentos de Python para Principiantes')
			.replace('{numModules}', 6);

		// Llamamos a la IA
		const result = await model.generateContent(prompt);
		const responseText = result.response.text();
		const generatedData = JSON.parse(responseText);

		// --- ¡LÓGICA MEJORADA! ---
		// 2. Guardamos cada parte de la respuesta en su archivo correspondiente
		fs.writeFileSync(modulesPath, JSON.stringify(generatedData.modules || [], null, 2));
		fs.writeFileSync(challengesPath, JSON.stringify(generatedData.challenges || [], null, 2));
		fs.writeFileSync(lessonsPath, JSON.stringify(generatedData.lessons || [], null, 2));

		console.log('Successfully initialized modules, challenges, and lessons with AI-generated content.');

	} catch (error) {
		console.error('Failed to initialize database with AI:', error);
		// Si la IA falla, creamos archivos vacíos para que la app no se rompa
		if (!fs.existsSync(modulesPath)) fs.writeFileSync(modulesPath, '[]');
		if (!fs.existsSync(challengesPath)) fs.writeFileSync(challengesPath, '[]');
		if (!fs.existsSync(lessonsPath)) fs.writeFileSync(lessonsPath, '[]');
	}
})();