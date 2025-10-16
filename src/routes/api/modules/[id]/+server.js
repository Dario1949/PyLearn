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

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ params, locals }) {
	if (locals.user?.role !== 'teacher' && locals.user?.role !== 'admin') {
		return json({ error: 'Acceso no autorizado' }, { status: 403 });
	}

	try {
		// Eliminar lecciones del módulo
		await supabase.from('lessons').delete().eq('module_id', params.id);
		
		// Eliminar retos del módulo
		await supabase.from('challenges').delete().eq('module_id', params.id);
		
		// Eliminar el módulo
		const { error } = await supabase.from('modules').delete().eq('id', params.id);
		
		if (error) throw error;
		return json({ success: true });
	} catch (error) {
		console.error('Error eliminando módulo:', error);
		return json({ error: 'Error al eliminar el módulo' }, { status: 500 });
	}
}

/** @type {import('./$types').RequestHandler} */
export async function PUT({ params, request, locals }) {
	if (locals.user?.role !== 'teacher' && locals.user?.role !== 'admin') {
		return json({ error: 'Acceso no autorizado' }, { status: 403 });
	}

	try {
		const data = await request.json();
		
		// Si solo se envían lecciones (desde el modal de detalles)
		if (data.lessons && !data.title) {
			// Eliminar lecciones existentes del módulo
			await supabase.from('lessons').delete().eq('module_id', params.id);
			
			// Insertar las nuevas lecciones
			if (data.lessons.length > 0) {
				const mappedLessons = data.lessons.map(lesson => ({
					id: lesson.id,
					module_id: params.id,
					title: lesson.title,
					content: lesson.content
				}));
				
				const { error } = await supabase.from('lessons').insert(mappedLessons);
				if (error) throw error;
			}
		} else {
			// Actualización completa del módulo (desde el editor)
			const { title, description, difficulty, estimatedTime, lessons } = data;
			
			// Actualizar el módulo
			const { error: moduleError } = await supabase.from('modules')
				.update({
					title,
					description,
					difficulty: difficulty || 'beginner',
					duration: `${estimatedTime || 30} min`
				})
				.eq('id', params.id);
			
			if (moduleError) throw moduleError;
			
			// Actualizar lecciones si se proporcionan
			if (lessons) {
				// Eliminar lecciones existentes
				await supabase.from('lessons').delete().eq('module_id', params.id);
				
				// Insertar nuevas lecciones
				if (lessons.length > 0) {
					const mappedLessons = lessons.map(lesson => ({
						id: lesson.id || `lesson_${Date.now()}_${Math.random()}`,
						module_id: params.id,
						title: lesson.title,
						content: lesson.content
					}));
					
					const { error } = await supabase.from('lessons').insert(mappedLessons);
					if (error) throw error;
				}
			}
		}
		
		return json({ success: true });
	} catch (error) {
		console.error('Error actualizando módulo:', error);
		return json({ error: 'Error al actualizar el módulo' }, { status: 500 });
	}
}