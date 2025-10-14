import fs from 'fs';
import path from 'path';
import { json } from '@sveltejs/kit';

const notificationsPath = path.resolve('src/lib/data/notifications.json');

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ params }) {
  try {
    const { id } = params;
    
    if (!id) {
      return json({ error: 'ID de notificación es requerido' }, { status: 400 });
    }
    
    const notifications = JSON.parse(fs.readFileSync(notificationsPath, 'utf-8'));
    const filteredNotifications = notifications.filter(n => n.id !== id);
    
    if (notifications.length === filteredNotifications.length) {
      return json({ error: 'Notificación no encontrada' }, { status: 404 });
    }
    
    fs.writeFileSync(notificationsPath, JSON.stringify(filteredNotifications, null, 2));
    
    return json({ success: true });
  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    return json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}