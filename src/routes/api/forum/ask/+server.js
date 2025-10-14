import fs from 'fs';
import path from 'path';
import { json } from '@sveltejs/kit';
import { v4 as uuidv4 } from 'uuid';

const questionsPath = path.resolve('src/lib/data/forum-questions.json');

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, fetch }) {
	try {
		const { authorId, title, content, category } = await request.json();

		// --- ¡MEJORA DE SEGURIDAD! ---
		// Validamos que los datos esenciales hayan llegado.
		if (!authorId || !title || !content || !category) {
			return json({ success: false, error: 'Faltan datos. Asegúrate de incluir título, contenido y categoría.' }, { status: 400 });
		}
		if (title.trim().length < 10) {
			return json({ success: false, error: 'El título es demasiado corto.' }, { status: 400 });
		}

		// Cargamos las preguntas existentes
		let questions = [];
		if (fs.existsSync(questionsPath)) {
			questions = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));
		}

		// Creamos el objeto de la nueva pregunta
		const newQuestion = {
			id: uuidv4(),
			authorId,
			title,
			content,
			category,
			timestamp: new Date().toISOString(),
			solved: false,
			votes: 0,
			replies: 0,
			tags: [] // Puedes añadir lógica para extraer tags del contenido
		};

		questions.push(newQuestion);
		fs.writeFileSync(questionsPath, JSON.stringify(questions, null, 2));

		// Otorgamos 5 puntos por preguntar
		await fetch('/api/progress/add-points', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ userId: authorId, points: 5, reason: 'FORUM_QUESTION' })
		});

		return json({ success: true, question: newQuestion }, { status: 201 });

	} catch (error) {
		console.error("Error al crear la pregunta:", error);
		return json({ success: false, error: 'Error interno del servidor.' }, { status: 500 });
	}
}