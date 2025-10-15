import { v4 as uuidv4 } from 'uuid';
import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, cookies }) {
	try {
		const userData = await request.json();

		if (!userData.email || !userData.password || !userData.name) {
			return json({ success: false, error: 'Faltan campos requeridos' }, { status: 400 });
		}

		// Verificar si el email ya existe
		const { data: existingUser } = await supabase.from('users').select('id').eq('email', userData.email).single();
		if (existingUser) {
			return json({ success: false, error: 'El correo ya está registrado' }, { status: 409 });
		}

		// Verificar si es el primer usuario (admin)
		const { data: users } = await supabase.from('users').select('id');
		const role = users?.length === 0 ? 'admin' : userData.role || 'student';
		const newUserId = uuidv4();

		const newUser = {
			id: newUserId,
			name: userData.name,
			email: userData.email,
			password: userData.password,
			program: userData.program || null,
			role: role,
			bio: '',
			avatar: '',
			created_at: new Date().toISOString()
		};

		const newUserProgress = {
			user_id: newUserId,
			points: 0,
			level: 1,
			progress: 0,
			completed_modules: [],
			earned_badges: [],
			completed_challenges: [],
			average_score: 0,
			streak: 0,
			status: 'active',
			last_activity: new Date().toISOString()
		};

		// Insertar usuario y progreso en Supabase
		const { data: insertedUser, error: userError } = await supabase.from('users').insert(newUser).select();
		if (userError) {
			console.error('Error insertando usuario:', userError);
			throw userError;
		}

		const { data: insertedProgress, error: progressError } = await supabase.from('progress').insert(newUserProgress).select();
		if (progressError) {
			console.error('Error insertando progreso:', progressError);
			throw progressError;
		}

		console.log('Usuario insertado exitosamente:', insertedUser);
		console.log('Progreso insertado exitosamente:', insertedProgress);

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
