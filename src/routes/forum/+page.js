/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
	try {
		// CORRECCIÓN 1: La URL correcta del endpoint es '/api/forum/posts'
		const response = await fetch('/api/forum/posts');

		if (!response.ok) {
			throw new Error('No se pudo cargar el foro.');
		}
		
		const data = await response.json();
		
		// CORRECCIÓN 2: El endpoint devuelve una propiedad llamada 'posts', no 'questions'.
		return {
			posts: data.posts 
		};
	} catch (error) {
		console.error("Error en el cargador del foro:", error);
		return {
			posts: [],
			error: error.message
		};
	}
}