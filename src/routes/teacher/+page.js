// src/routes/teacher/+page.js

/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
	try {
		const [studentsResponse, modulesResponse] = await Promise.all([
			fetch('/api/students'),
			fetch('/api/modules')
		]);
		
		const studentsData = studentsResponse.ok ? await studentsResponse.json() : { students: [] };
		const modulesData = modulesResponse.ok ? await modulesResponse.json() : { modules: [] };
		
		return {
			students: studentsData.students || [],
			modules: modulesData.modules || []
		};
	} catch (error) {
		console.error('Error en el cargador del panel docente:', error);
		return {
			students: [],
			modules: [],
			error: 'No se pudo cargar los datos.'
		};
	}
}