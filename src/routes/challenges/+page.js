/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
	try {
		const response = await fetch('/api/challenges');
		if (!response.ok) {
			throw new Error('No se pudieron cargar los retos.');
		}
		const data = await response.json();
        console.log('Datos recibidos del API:', data);
		return {
			challenges: data.challenges
		};
	} catch (error) {
		console.error(error);
		return {
			challenges: [],
			error: error.message
		};
	}
}