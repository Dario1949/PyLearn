import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase.js';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
    try {
        const { data: questions, error: questionsError } = await supabase.from('forum_questions').select('*');
        const { data: users, error: usersError } = await supabase.from('users').select('id, name, avatar, role');

        if (questionsError) {
            console.error('Error loading questions:', questionsError);
            return json({ questions: [], error: 'Error loading questions' });
        }

        const usersMap = new Map(users?.map(u => [u.id, { name: u.name, avatar: u.avatar, role: u.role }]) || []);

        const questionsWithAuthors = questions?.map(q => ({
            ...q,
            author: usersMap.get(q.author_id) || { name: 'Usuario Desconocido' }
        })) || [];

        questionsWithAuthors.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        return json({ questions: questionsWithAuthors });
    } catch (error) {
        console.error("Error al cargar las preguntas del foro:", error);
        return json({ error: 'Error al cargar las preguntas del foro.' }, { status: 500 });
    }
}