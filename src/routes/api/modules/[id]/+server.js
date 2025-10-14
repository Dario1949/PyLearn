import { json } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';

// Rutas a todos tus archivos de datos
const modulesPath = path.resolve('src/lib/data/modules.json');
const lessonsPath = path.resolve('src/lib/data/lessons.json');
const challengesPath = path.resolve('src/lib/data/challenges.json');

/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
	try {
		// Leemos los archivos de forma segura, devolviendo un array vacío si no existen
		const allModules = fs.existsSync(modulesPath) ? JSON.parse(fs.readFileSync(modulesPath, 'utf-8')) : [];
		const allLessons = fs.existsSync(lessonsPath) ? JSON.parse(fs.readFileSync(lessonsPath, 'utf-8')) : [];
		const allChallenges = fs.existsSync(challengesPath) ? JSON.parse(fs.readFileSync(challengesPath, 'utf-8')) : [];

		// 1. Encontrar el módulo solicitado por el ID de la URL (ej. 'module1')
		const module = allModules.find(m => m.id === params.id);
		if (!module) {
			return json({ error: 'Módulo no encontrado' }, { status: 404 });
		}

		// 2. Encontrar TODAS las lecciones que pertenecen a este módulo.
		//    Filtra `lessons.json` buscando donde `moduleId` sea igual al `id` del módulo.
		const lessons = allLessons.filter(l => l.moduleId === module.id);

		// 3. Encontrar el reto asociado al módulo usando el `challengeId` del módulo.
		const challenge = allChallenges.find(c => c.id === module.challengeId) || null;

		// 4. Combinar todo en un solo objeto para enviarlo al frontend.
		const fullModuleData = {
			...module,
			lessons,     // Este es el array de lecciones filtrado
			challenge    // Este es el objeto del reto completo
		};

		return json(fullModuleData);

	} catch (error) {
		console.error(`Error al obtener el módulo ${params.id}:`, error);
		return json({ error: 'No se pudo cargar el módulo.' }, { status: 500 });
	}
}