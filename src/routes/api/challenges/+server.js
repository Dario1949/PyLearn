import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase.js';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	try {
		const { data: challenges, error } = await supabase.from('challenges').select('*');
		if (error) throw error;

		return json({ challenges: challenges || [] });

	} catch (error) {
		console.error('Error al leer los retos:', error);
		return json({ error: 'No se pudieron cargar los retos.' }, { status: 500 });
	}
}
