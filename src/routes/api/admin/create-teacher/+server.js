import { json } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const usersPath = path.resolve('src/lib/data/users.json');
const progressPath = path.resolve('src/lib/data/progress.json');

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
    // --- ¡SEGURIDAD! ---
    // Gracias al hook, podemos verificar el rol del usuario que hace la petición.
    if (locals.user?.role !== 'admin') {
        return json({ success: false, error: 'Acceso no autorizado' }, { status: 403 }); // 403 Forbidden
    }

    try {
        const { name, email, password } = await request.json();

        if (!name || !email || !password) {
            return json({ success: false, error: 'Faltan campos requeridos.' }, { status: 400 });
        }

        let users = fs.existsSync(usersPath) ? JSON.parse(fs.readFileSync(usersPath, 'utf-8')) : [];
        let progress = fs.existsSync(progressPath) ? JSON.parse(fs.readFileSync(progressPath, 'utf-8')) : [];

        if (users.some(u => u.email === email)) {
            return json({ success: false, error: 'El correo ya está en uso.' }, { status: 409 });
        }

        const newTeacherId = uuidv4();
        const newTeacher = {
            id: newTeacherId,
            name,
            email,
            password, // Hashear en producción
            role: 'teacher'
        };

        const newTeacherProgress = {
            userId: newTeacherId,
            points: 0,
            level: 1,
            progress: 0,
            completedModules: [],
            earnedBadges: [],
            completedChallenges: [],
            averageScore: 0,
            streak: 0,
            status: 'active',
            lastActivity: new Date().toISOString().split('T')[0]
        };

        users.push(newTeacher);
        progress.push(newTeacherProgress);

        fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
        fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2));

        return json({ success: true, message: 'Docente creado con éxito.' }, { status: 201 });

    } catch (error) {
        console.error('Error creando docente:', error);
        return json({ success: false, error: 'Error interno del servidor.' }, { status: 500 });
    }
}