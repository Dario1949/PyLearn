import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, cookies }) {
  try {
    const sessionId = cookies.get('session_id');
    if (!sessionId) {
      return json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    // Verificar usuario
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('id', sessionId)
      .single();

    if (!user) {
      return json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('avatar');

    if (!file || !(file instanceof File)) {
      return json({ success: false, error: 'No se proporcionó archivo' }, { status: 400 });
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return json({ success: false, error: 'Tipo de archivo no permitido' }, { status: 400 });
    }

    // Validar tamaño (máximo 2MB para base64)
    if (file.size > 2 * 1024 * 1024) {
      return json({ success: false, error: 'El archivo es demasiado grande (máximo 2MB)' }, { status: 400 });
    }

    // Generar nombre único para el archivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Subir archivo a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Error subiendo archivo:', uploadError);
      return json({ success: false, error: 'Error al subir la imagen' }, { status: 500 });
    }

    // Obtener URL pública del archivo
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Actualizar avatar del usuario en la base de datos
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar: publicUrl })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error actualizando usuario:', updateError);
      return json({ success: false, error: 'Error al actualizar el perfil' }, { status: 500 });
    }

    return json({ 
      success: true, 
      avatarUrl: publicUrl,
      message: 'Avatar actualizado correctamente'
    });

  } catch (error) {
    console.error('Error en upload-avatar:', error);
    return json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}