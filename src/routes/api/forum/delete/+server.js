import fs from 'fs';
import path from 'path';
import { json } from '@sveltejs/kit';

const questionsPath = path.resolve('src/lib/data/forum-questions.json');
const answersPath = path.resolve('src/lib/data/forum-answers.json');

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
    
    // Solo el autor o un admin/teacher puede eliminar la pregunta
    if (question.authorId !== locals.user.id && 
        locals.user.role !== 'admin' && 
        locals.user.role !== 'teacher') {
      return json({ success: false, error: 'No tienes permisos para eliminar esta pregunta' }, { status: 403 });
    }

    // Eliminar la pregunta
    questions.splice(questionIndex, 1);

    // Eliminar respuestas asociadas
    if (fs.existsSync(answersPath)) {
      const answers = JSON.parse(fs.readFileSync(answersPath, 'utf-8'));
      const filteredAnswers = answers.filter(a => a.questionId !== questionId);
      fs.writeFileSync(answersPath, JSON.stringify(filteredAnswers, null, 2));
    }

    fs.writeFileSync(questionsPath, JSON.stringify(questions, null, 2));

    return json({ success: true });

  } catch (error) {
    console.error('Error eliminando pregunta:', error);
    return json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}