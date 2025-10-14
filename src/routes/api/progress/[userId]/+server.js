// src/routes/api/progress/[userId]/+server.js
import fs from 'fs';
import path from 'path';

const progressPath = path.resolve('src/lib/data/progress.json');

/**
 * GET /api/progress/:userId
 * Responde { success: true, progress: {...} } o { success: true, progress: null } si no hay registro.
 */
export async function GET({ params }) {
  const { userId } = params;

  if (!userId) {
    return new Response(JSON.stringify({ success: false, error: 'userId requerido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let list = [];
  try {
    if (fs.existsSync(progressPath)) {
      list = JSON.parse(fs.readFileSync(progressPath, 'utf-8'));
    }
  } catch (e) {
    console.error('Error leyendo progress.json:', e);
    return new Response(JSON.stringify({ success: false, error: 'No se pudo leer el progreso' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const row = Array.isArray(list) ? list.find(p => p.userId === userId) : null;

  return new Response(JSON.stringify({ success: true, progress: row ?? null }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
