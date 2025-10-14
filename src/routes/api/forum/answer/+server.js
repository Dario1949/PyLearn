import fs from 'fs';
import path from 'path';
import { json } from '@sveltejs/kit';
import { v4 as uuidv4 } from 'uuid';

const answersPath = path.resolve('src/lib/data/forum-answers.json');

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, fetch }) {
    try {
        const { questionId, authorId, content } = await request.json();

        if (!questionId || !authorId || !content) {
            return json({ success: false, error: 'Faltan datos requeridos.' }, { status: 400 });
        }

        // Cargamos las respuestas existentes
        let answers = [];
        if (fs.existsSync(answersPath)) {
            answers = JSON.parse(fs.readFileSync(answersPath, 'utf-8'));
        }

        // Creamos el objeto de la nueva respuesta
        const newAnswer = {
            id: uuidv4(),
            questionId,
            authorId,
            content,
            timestamp: new Date().toISOString(),
            isVerifiedCorrect: false
        };

        answers.push(newAnswer);
        fs.writeFileSync(answersPath, JSON.stringify(answers, null, 2));

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