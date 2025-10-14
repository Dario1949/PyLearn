import fs from 'fs';
import path from 'path';
import { json } from '@sveltejs/kit';

const challengesPath = path.resolve('src/lib/data/challenges.json');

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	try {
		if (!fs.existsSync(challengesPath)) {
			return json({ challenges: [] });
		}

		const challengesData = fs.readFileSync(challengesPath, 'utf-8');
		const allChallenges = JSON.parse(challengesData);

		return json({ challenges: allChallenges });

	} catch (error) {
		console.error('Error al leer los retos:', error);
		return json({ error: 'No se pudieron cargar los retos.' }, { status: 500 });
	}
}