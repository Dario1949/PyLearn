import fs from 'fs';
import path from 'path';
import { json } from '@sveltejs/kit';

const modulesPath = path.resolve('src/lib/data/modules.json');

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	try {
		if (!fs.existsSync(modulesPath)) {
			return json({ modules: [] });
		}
		const modulesData = fs.readFileSync(modulesPath, 'utf-8');
		const allModules = JSON.parse(modulesData);
		return json({ modules: allModules });
	} catch (error) {
		console.error('Error al leer los módulos:', error);
		return json({ error: 'No se pudieron cargar los módulos.' }, { status: 500 });
	}
}