import fs from 'fs';
import path from 'path';
import { json } from '@sveltejs/kit';

const usersPath = path.resolve('src/lib/data/users.json');
const progressPath = path.resolve('src/lib/data/progress.json');

/** @type {import('./$types').RequestHandler} */
export async function GET() {
    try {
        const allUsers = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
        const allProgress = JSON.parse(fs.readFileSync(progressPath, 'utf-8'));

        // 1. Creamos un mapa de progreso usando el 'userId' como clave para una búsqueda eficiente.
        const progressMap = new Map(allProgress.map(p => [p.userId, p]));

        // 2. Filtramos los usuarios para obtener solo estudiantes y los enriquecemos con sus datos de progreso.
        const students = allUsers
            .filter(user => user.role === 'student')
            .map(user => {
                // Por seguridad, siempre excluimos la contraseña.
                const { password, ...userProfile } = user;

                // Buscamos el progreso del estudiante usando su ID único.
                const userProgress = progressMap.get(user.id);
                
                // Calcular progreso basado en módulos completados
                const completedModules = userProgress?.completedModules?.length || 0;
                const totalModules = 6; // Número total de módulos
                const calculatedProgress = Math.round((completedModules / totalModules) * 100);
                
                // Calcular puntuación promedio basada en puntos
                const averageScore = userProgress?.points ? Math.min(Math.round(userProgress.points * 10), 100) : 0;
                
                // Estado simple: solo activo o inactivo (todos inactivos por defecto ya que es local)
                const status = 'inactive';

                // Combinamos el perfil del usuario con sus datos de progreso.
                return {
                    ...userProfile,
                    id: user.id,
                    points: userProgress?.points || 0,
                    level: userProgress?.level || 1,
                    progress: calculatedProgress,
                    completedModules: completedModules,
                    completedChallenges: userProgress?.completedChallenges?.length || 0,
                    averageScore: averageScore,
                    streak: userProgress?.streak || 0,
                    status: status,
                    lastActivity: userProgress?.lastActivity || 'Nunca'
                };
            });

        return json({ students });

    } catch (error) {
        console.error('Error al combinar datos de estudiantes:', error);
        return json({ error: 'No se pudieron cargar los datos.' }, { status: 500 });
    }
}