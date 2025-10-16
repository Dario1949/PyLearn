/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
	try {
		const [promptsResponse, usersResponse] = await Promise.all([
			fetch('/api/admin/prompts'),
			fetch('/api/admin/users')
		]);

		const prompts = promptsResponse.ok ? await promptsResponse.json() : {};
		const users = usersResponse.ok ? await usersResponse.json() : [];

		return { prompts, users };
	} catch (error) {
		return { prompts: {}, users: [], error: error.message };
	}
}