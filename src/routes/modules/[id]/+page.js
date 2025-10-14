/** @type {import('./$types').PageLoad} */
export async function load({ fetch, params }) {
	try {
		// Usamos el 'id' de la URL para llamar a nuestro nuevo endpoint
		const response = await fetch(`/api/modules/${params.id}`);

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.error || 'No se pudo cargar el módulo');
		}

		const moduleData = await response.json();
		return { module: moduleData };

	} catch (error) {
		return {
			module: null,
			error: error.message
		};
	}
}