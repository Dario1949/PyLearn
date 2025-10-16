import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, cookies }) {
  try {
    console.log('Iniciando upload de avatar');
    const sessionId = cookies.get('session_id');
    if (!sessionId) {
      console.log('No hay session_id');
      return json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    console.log('Session ID encontrado:', sessionId);
    // Verificar usuario
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('id', sessionId)
      .single();

    if (!user) {
      console.log('Usuario no encontrado');
      return json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
    }

    console.log('Usuario encontrado:', user.id);
    const formData = await request.formData();
    const file = formData.get('avatar');
    console.log('Archivo recibido:', !!file, file?.name, file?.size);

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

    console.log('Convirtiendo archivo a base64...');
    // Convertir archivo a base64
    const arrayBuffer = await file.arrayBuffer();
    console.log('ArrayBuffer obtenido, tamaño:', arrayBuffer.byteLength);
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    console.log('Base64 generado, longitud:', base64.length);
    const avatarUrl = `data:${file.type};base64,${base64}`;

    console.log('Actualizando usuario en base de datos...');
    // Actualizar avatar del usuario en la base de datos
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar: avatarUrl })
      .eq('id', user.id);
    console.log('Resultado actualización:', !updateError ? 'éxito' : 'error');

    if (updateError) {
      console.error('Error actualizando usuario:', updateError);
      return json({ success: false, error: 'Error al actualizar el perfil' }, { status: 500 });
    }

    return json({ 
      success: true, 
      avatarUrl,
      message: 'Avatar actualizado correctamente'
    });

  } catch (error) {
    console.error('Error en upload-avatar:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return json({ 
      success: false, 
      error: 'No se pudo procesar la imagen',
      details: {
        message: error.message,
        type: error.constructor.name
      }
    }, { status: 500 });
  }
}