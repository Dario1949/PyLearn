import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase.js';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
    try {
        const { data: questions } = await supabase.from('forum_questions').select('*');
        const { data: answers } = await supabase.from('forum_answers').select('*');
        const { data: users } = await supabase.from('users').select('id, name, avatar, role');

        const usersMap = new Map(users?.map(u => [u.id, { name: u.name, avatar: u.avatar, role: u.role }]) || []);

        const posts = questions?.map(q => {
            const postAnswers = answers
                ?.filter(a => a.question_id === q.id)
                .map(a => ({
                    ...a,
                    author: usersMap.get(a.author_id) || { name: 'Usuario Desconocido' }
                })) || [];

            return {
                ...q,
                author: usersMap.get(q.author_id) || { name: 'Usuario Desconocido' },
                answers: postAnswers,
                replies: postAnswers.length
            };
        }) || [];

        posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        return json({ posts });
    } catch (error) {
        console.error("Error al cargar los posts del foro:", error);
        return json({ error: 'Error al cargar los posts del foro.' }, { status: 500 });
    }
}
