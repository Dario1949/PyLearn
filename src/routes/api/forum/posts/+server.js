import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase.js';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
    try {
        const { data: questions, error: questionsError } = await supabase.from('forum_questions').select('*');
        const { data: answers, error: answersError } = await supabase.from('forum_answers').select('*');
        const { data: users, error: usersError } = await supabase.from('users').select('id, name, avatar, role');

        console.log('Questions:', questions?.length || 0, 'Error:', questionsError);
        console.log('Answers:', answers?.length || 0, 'Error:', answersError);
        console.log('Users:', users?.length || 0, 'Error:', usersError);

        if (questionsError) {
            console.error('Error loading questions:', questionsError);
            return json({ posts: [], error: 'Error loading questions' });
        }

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

        console.log('Final posts:', posts.length);
        return json({ posts });
    } catch (error) {
        console.error("Error al cargar los posts del foro:", error);
        return json({ error: 'Error al cargar los posts del foro.' }, { status: 500 });
    }
}
