import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase.js';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	try {
		const { data: modules, error } = await supabase.from('modules').select('*');
		if (error) throw error;
		return json({ modules: modules || [] });
	} catch (error) {
		console.error('Error al leer los módulos:', error);
		return json({ error: 'No se pudieron cargar los módulos.' }, { status: 500 });
	}
}
