/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
	try {
		const response = await fetch('/api/admin/prompts');
		if (!response.ok) {
			return { prompts: {}, error: 'No se pudieron cargar los prompts.' };
		}
		const prompts = await response.json();
		return { prompts };
	} catch (error) {
		return { prompts: {}, error: error.message };
	}
}