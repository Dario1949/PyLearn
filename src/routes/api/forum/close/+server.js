import fs from 'fs';
import path from 'path';
import { json } from '@sveltejs/kit';

const questionsPath = path.resolve('src/lib/data/forum-questions.json');

export async function POST({ request, locals }) {
  try {
    if (!locals?.user?.id) {
      return json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const { questionId } = await request.json();
    if (!questionId) {
      return json({ success: false, error: 'ID de pregunta requerido' }, { status: 400 });
    }

    const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));
    const questionIndex = questions.findIndex(q => q.id === questionId);

    if (questionIndex === -1) {
      return json({ success: false, error: 'Pregunta no encontrada' }, { status: 404 });
    }

    const question = questions[questionIndex];
    
    // Solo el autor o un admin/teacher puede cerrar la pregunta
    if (question.authorId !== locals.user.id && 
        locals.user.role !== 'admin' && 
        locals.user.role !== 'teacher') {
      return json({ success: false, error: 'No tienes permisos para cerrar esta pregunta' }, { status: 403 });
    }

    // Alternar el estado cerrado
    questions[questionIndex].closed = !questions[questionIndex].closed;
    
    // Si se cierra, marcar como resuelto. Si se reabre, desmarcar
    questions[questionIndex].solved = questions[questionIndex].closed;

    fs.writeFileSync(questionsPath, JSON.stringify(questions, null, 2));

    return json({ 
      success: true, 
      closed: questions[questionIndex].closed,
      solved: questions[questionIndex].solved
    });

  } catch (error) {
    console.error('Error cerrando pregunta:', error);
    return json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}