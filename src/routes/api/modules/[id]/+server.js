import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
	try {
		// 1. Encontrar el módulo solicitado por el ID
		const { data: module, error: moduleError } = await supabase
			.from('modules')
			.select('*')
			.eq('id', params.id)
			.single();

		if (moduleError || !module) {
			return json({ error: 'Módulo no encontrado' }, { status: 404 });
		}

		// 2. Encontrar lecciones del módulo
		const { data: lessons } = await supabase
			.from('lessons')
			.select('*')
			.eq('module_id', module.id);

		// 3. Encontrar el reto asociado al módulo
		const { data: challenge } = await supabase
			.from('challenges')
			.select('*')
			.eq('id', module.challenge_id)
			.single();

		// 4. Combinar todo en un solo objeto para enviarlo al frontend.
		const fullModuleData = {
			...module,
			lessons,     // Este es el array de lecciones filtrado
			challenge    // Este es el objeto del reto completo
		};

		return json(fullModuleData);

	} catch (error) {
		console.error(`Error al obtener el módulo ${params.id}:`, error);
		return json({ error: 'No se pudo cargar el módulo.' }, { status: 500 });
	}
}