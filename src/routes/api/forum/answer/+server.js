import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase.js';
import { v4 as uuidv4 } from 'uuid';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, fetch }) {
    try {
        const { questionId, authorId, content } = await request.json();

        if (!questionId || !authorId || !content) {
            return json({ success: false, error: 'Faltan datos requeridos.' }, { status: 400 });
        }

        // Creamos el objeto de la nueva respuesta
        const newAnswer = {
            id: uuidv4(),
            question_id: questionId,
            author_id: authorId,
            content,
            timestamp: new Date().toISOString(),
            is_verified_correct: false
        };

        // Guardamos en Supabase
        const { error } = await supabase.from('forum_answers').insert(newAnswer);
        if (error) throw error;

        // Otorgamos 5 puntos por responder
        await fetch('/api/progress/add-points', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: authorId, points: 5, reason: 'FORUM_REPLY' })
        });

        return json({ success: true, answer: newAnswer }, { status: 201 });

    } catch (error) {
        console.error("Error al guardar la respuesta:", error);
        return json({ success: false, error: 'Error interno del servidor.' }, { status: 500 });
    }
}
