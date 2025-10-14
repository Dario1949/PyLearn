/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
    try {
        // Hacemos peticiones en paralelo para cargar todo lo necesario
        const [modulesRes, leaderboardRes] = await Promise.all([
            fetch('/api/modules'),
            fetch('/api/leaderboard')
        ]);

        if (!modulesRes.ok || !leaderboardRes.ok) {
            throw new Error('No se pudieron cargar los datos del dashboard.');
        }

        const modulesData = await modulesRes.json();
        const leaderboardData = await leaderboardRes.json();

        return {
            allModules: modulesData.modules,
            leaderboard: leaderboardData.leaderboard,
            notifications: [] // Se cargarán en el cliente
        };
    } catch (error) {
        console.error('Error en el cargador del dashboard:', error);
        return {
            allModules: [],
            leaderboard: [],
            notifications: [],
            error: error.message
        };
    }
}