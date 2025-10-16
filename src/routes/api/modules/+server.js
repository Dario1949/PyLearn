import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase.js';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	try {
		// Obtener módulos con conteo de lecciones
		const { data: modules, error } = await supabase.from('modules').select('*');
		if (error) throw error;

		// Obtener conteo de lecciones para cada módulo
		const modulesWithLessons = await Promise.all(
			(modules || []).map(async (module) => {
				const { count } = await supabase
					.from('lessons')
					.select('*', { count: 'exact', head: true })
					.eq('module_id', module.id);
				
				return {
					...module,
					lessonsCount: count || 0
				};
			})
		);

		return json({ modules: modulesWithLessons });
	} catch (error) {
		console.error('Error al leer los módulos:', error);
		return json({ error: 'No se pudieron cargar los módulos.' }, { status: 500 });
	}
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
	if (locals.user?.role !== 'teacher' && locals.user?.role !== 'admin') {
		return json({ error: 'Acceso no autorizado' }, { status: 403 });
	}

	try {
		const { title, description, difficulty, estimatedTime, lessons } = await request.json();
		
		if (!title || !description) {
			return json({ error: 'Faltan campos requeridos' }, { status: 400 });
		}

		const moduleId = `module_${Date.now()}`;
		
		// Crear el módulo
		const { error: moduleError } = await supabase.from('modules').insert({
			id: moduleId,
			title,
			description,
			difficulty: difficulty || 'beginner',
			duration: `${estimatedTime || 30} min`,
			icon: '📚'
		});

		if (moduleError) throw moduleError;

		// Crear las lecciones si existen
		if (lessons && lessons.length > 0) {
			const mappedLessons = lessons.map(lesson => ({
				id: lesson.id || `lesson_${Date.now()}_${Math.random()}`,
				module_id: moduleId,
				title: lesson.title,
				content: lesson.content
			}));
			
			const { error: lessonsError } = await supabase.from('lessons').insert(mappedLessons);
			if (lessonsError) throw lessonsError;
		}

		return json({ success: true, moduleId });
	} catch (error) {
		console.error('Error creando módulo:', error);
		return json({ error: 'Error al crear el módulo' }, { status: 500 });
	}
}
