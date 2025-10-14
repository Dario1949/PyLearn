import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { json } from '@sveltejs/kit';

const usersPath = path.resolve('src/lib/data/users.json');
const progressPath = path.resolve('src/lib/data/progress.json');

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, cookies }) {
	try {
		const userData = await request.json();

		if (!userData.email || !userData.password || !userData.name) {
			return json({ success: false, error: 'Faltan campos requeridos' }, { status: 400 });
		}

		let users = fs.existsSync(usersPath) ? JSON.parse(fs.readFileSync(usersPath, 'utf-8')) : [];
		let progress = fs.existsSync(progressPath) ? JSON.parse(fs.readFileSync(progressPath, 'utf-8')) : [];

		if (users.some((u) => u.email === userData.email)) {
			return json({ success: false, error: 'El correo ya está registrado' }, { status: 409 });
		}

		// Lógica del primer Admin: Si no hay usuarios, el primero en registrarse será 'admin'.
		const role = users.length === 0 ? 'admin' : userData.role || 'student';
		const newUserId = uuidv4();

		const newUser = {
			id: newUserId,
			name: userData.name,
			email: userData.email,
			password: userData.password, // En producción, hashear la contraseña aquí.
			program: userData.program || null,
			role: role,
			bio: '',
			avatar: '',
			createdAt: new Date().toLocaleDateString('en-CA') // formato YYYY-MM-DD
		};

		const newUserProgress = {
			userId: newUserId,
			points: 0,
			level: 1,
			progress: 0,
			completedModules: [],
			earnedBadges: [],
			completedChallenges: [],
			averageScore: 0,
			streak: 0,
			status: 'active',
			lastActivity: new Date().toLocaleDateString('en-CA') // formato YYYY-MM-DD
		};

		users.push(newUser);
		progress.push(newUserProgress);

		fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
		fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2));

		// Establecemos la cookie de sesión para el nuevo usuario.
		cookies.set('session_id', newUser.id, {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			secure: process.env.NODE_ENV === 'production',
			maxAge: 60 * 60 * 24 * 7
		});

		const { password, ...userToReturn } = newUser;
		return json({ success: true, user: userToReturn }, { status: 201 });

	} catch (error) {
		console.error('Error en el registro:', error);
		return json({ success: false, error: 'Ocurrió un error en el servidor.' }, { status: 500 });
	}
}