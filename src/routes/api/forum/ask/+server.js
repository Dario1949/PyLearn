import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase.js';
import { v4 as uuidv4 } from 'uuid';

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

		// Creamos el objeto de la nueva pregunta
		const newQuestion = {
			id: uuidv4(),
			author_id: authorId,
			title,
			content,
			category,
			timestamp: new Date().toISOString(),
			solved: false,
			votes: 0,
			replies: 0,
			tags: [] // Puedes añadir lógica para extraer tags del contenido
		};

		// Guardamos en Supabase
		const { error } = await supabase.from('forum_questions').insert(newQuestion);
		if (error) throw error;

		// Obtener información del autor
		const { data: author } = await supabase
			.from('users')
			.select('id, name, avatar, role')
			.eq('id', authorId)
			.single();

		// Crear la pregunta con la estructura completa
		const questionWithAuthor = {
			...newQuestion,
			author: author || { name: 'Usuario Desconocido' },
			answers: [],
			replies: 0
		};

		// Otorgamos 5 puntos por preguntar
		await fetch('/api/progress/add-points', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ userId: authorId, points: 5, reason: 'FORUM_QUESTION' })
		});

		return json({ success: true, question: questionWithAuthor }, { status: 201 });

	} catch (error) {
		console.error("Error al crear la pregunta:", error);
		return json({ success: false, error: 'Error interno del servidor.' }, { status: 500 });
	}
}
