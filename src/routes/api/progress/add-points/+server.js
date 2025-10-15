import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
    try {
        const { userId, points, reason } = await request.json();

        if (!userId || points === undefined) {
            return json({ success: false, error: 'Faltan datos (userId, points).' }, { status: 400 });
        }

        // Obtener progreso actual
        const { data: currentProgress, error: fetchError } = await supabase
            .from('progress')
            .select('points')
            .eq('user_id', userId)
            .single();

        if (fetchError) {
            return json({ success: false, error: 'Usuario no encontrado.' }, { status: 404 });
        }

        const newTotalPoints = currentProgress.points + points;

        // Actualizar puntos
        const { error: updateError } = await supabase
            .from('progress')
            .update({ points: newTotalPoints })
            .eq('user_id', userId);

        if (updateError) throw updateError;

        console.log(`Usuario ${userId} ganó ${points} puntos por: ${reason || 'Actividad'}`);

        return json({ success: true, newTotalPoints });

    } catch (error) {
        console.error('Error al añadir puntos:', error);
        return json({ success: false, error: 'Error interno del servidor.' }, { status: 500 });
    }
}
