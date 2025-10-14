import fs from 'fs';
import path from 'path';
import { json } from '@sveltejs/kit';

const notificationsPath = path.resolve('src/lib/data/notifications.json');

// Asegurar que el archivo existe
if (!fs.existsSync(notificationsPath)) {
  fs.writeFileSync(notificationsPath, '[]');
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const { userId, message, type, from } = await request.json();
    
    if (!userId || !message) {
      return json({ error: 'userId y message son requeridos' }, { status: 400 });
    }
    
    const notifications = JSON.parse(fs.readFileSync(notificationsPath, 'utf-8'));
    
    const newNotification = {
      id: Date.now().toString(),
      userId,
      message,
      type: type || 'info',
      from: from || 'Sistema',
      timestamp: new Date().toISOString(),
      read: false
    };
    
    notifications.push(newNotification);
    fs.writeFileSync(notificationsPath, JSON.stringify(notifications, null, 2));
    
    return json({ success: true, notification: newNotification });
  } catch (error) {
    console.error('Error al crear notificación:', error);
    return json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
  try {
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return json({ error: 'userId es requerido' }, { status: 400 });
    }
    
    const notifications = JSON.parse(fs.readFileSync(notificationsPath, 'utf-8'));
    const userNotifications = notifications.filter(n => n.userId === userId);
    
    return json({ notifications: userNotifications });
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    return json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ url }) {
  try {
    const pathParts = url.pathname.split('/');
    const notificationId = pathParts[pathParts.length - 1];
    
    if (!notificationId) {
      return json({ error: 'ID de notificación es requerido' }, { status: 400 });
    }
    
    const notifications = JSON.parse(fs.readFileSync(notificationsPath, 'utf-8'));
    const filteredNotifications = notifications.filter(n => n.id !== notificationId);
    
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