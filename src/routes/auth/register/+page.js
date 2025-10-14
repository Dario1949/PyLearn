/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
	try {
		const response = await fetch('/api/app-status');
		if (!response.ok) {
			throw new Error('No se pudo verificar el estado de la aplicación.');
		}
		const data = await response.json();
		return {
			needsInitialSetup: data.needsInitialSetup
		};
	} catch (error) {
		console.error(error);
		return {
			needsInitialSetup: false, // Por seguridad, asumimos que no si hay error
			error: error.message
		};
	}
}