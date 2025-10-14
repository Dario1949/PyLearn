import fs from 'fs';
import path from 'path';
import { json } from '@sveltejs/kit';

const questionsPath = path.resolve('src/lib/data/forum-questions.json');
const answersPath = path.resolve('src/lib/data/forum-answers.json');
const usersPath = path.resolve('src/lib/data/users.json');

/** @type {import('./$types').RequestHandler} */
export async function GET() {
    try {
        // Leemos los archivos de forma segura, devolviendo un array vacío si no existen
        const questions = fs.existsSync(questionsPath) ? JSON.parse(fs.readFileSync(questionsPath, 'utf-8')) : [];
        const answers = fs.existsSync(answersPath) ? JSON.parse(fs.readFileSync(answersPath, 'utf-8')) : [];
        const users = fs.existsSync(usersPath) ? JSON.parse(fs.readFileSync(usersPath, 'utf-8')) : [];

        const usersMap = new Map(users.map(u => [u.id, { name: u.name, avatar: u.avatar, role: u.role }]));

        const posts = questions.map(q => {
            const postAnswers = answers
                .filter(a => a.questionId === q.id)
                .map(a => ({
                    ...a,
                    author: usersMap.get(a.authorId) || { name: 'Usuario Desconocido' }
                }));

            return {
                ...q,
                author: usersMap.get(q.authorId) || { name: 'Usuario Desconocido' },
                answers: postAnswers,
                replies: postAnswers.length // Añadimos el conteo de respuestas
            };
        });

        posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        return json({ posts });
    } catch (error) {
        console.error("Error al cargar los posts del foro:", error);
        return json({ error: 'Error al cargar los posts del foro.' }, { status: 500 });
    }
}