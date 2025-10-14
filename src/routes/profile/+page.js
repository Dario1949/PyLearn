/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
	try {
		const response = await fetch('/api/challenges');
		if (!response.ok) {
			throw new Error('No se pudieron cargar los retos.');
		}
		const data = await response.json();
        console.log('Datos recibidos del API:', data);

        const response2 = await fetch('/api/modules');
		if (!response2.ok) {
			throw new Error('No se pudieron cargar los retos.');
		}
		const data2 = await response2.json();
        console.log('Datos recibidos del API:', data2);

		return {
			challenges: data.challenges || [],
            modules: data2.modules || []
		};
	} catch (error) {
		console.error(error);
		return {
			challenges: [],
            modules: [],
			error: error.message
		};
	}

    
}