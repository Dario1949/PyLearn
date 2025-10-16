// src/routes/api/forum/verify-answer/+server.js
import { json } from "@sveltejs/kit";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PRIVATE_GOOGLE_API_KEY, PRIVATE_GOOGLE_MODEL } from "$env/static/private";
import { supabase } from '$lib/supabase.js';

// --- IA ---
if (!PRIVATE_GOOGLE_API_KEY) {
  console.warn("[verify-answer] Falta PRIVATE_GOOGLE_API_KEY");
}
const genAI = new GoogleGenerativeAI(PRIVATE_GOOGLE_API_KEY || "");
const model = genAI.getGenerativeModel({ model: PRIVATE_GOOGLE_MODEL });

// --- Template fallback robusto ---
const DEFAULT_VERIFY_TEMPLATE = `
Devuelve únicamente JSON válido. Analiza si la respuesta del foro resuelve correctamente la pregunta.
Responde con el siguiente formato:

{
  "isCorrect": true | false,
  "feedback": "explica brevemente por qué"
}

Pregunta:
Título: {{TITLE}}
Contenido: {{CONTENT}}

Respuesta del usuario:
{{ANSWER}}
`.trim();

// Extrae JSON desde bloque ```json ... ```
function cleanJsonString(str) {
  if (typeof str !== "string") return "";
  const match = str.match(/```json\s*([\s\S]*?)\s*```/i);
  return match ? match[1].trim() : str.trim();
}

// Lee un template desde Supabase si existe, sino devuelve null
async function loadVerifyTemplateFromDB() {
  try {
    const { data } = await supabase.from('prompts').select('*').eq('key', 'verifyAnswer').single();
    return data?.content || null;
  } catch (e) {
    console.warn("[verify-answer] No se pudo leer prompts desde Supabase:", e?.message);
    return null;
  }
}

// Rellena placeholders comunes, soporta distintos formatos
function fillTemplate(tpl, { title, content, answer }) {
  let s = String(tpl);

  // Soporte para tu plantilla previa
  // ${challenge.description}  y  ${userCode}
  s = s.replaceAll(
    "${challenge.description}",
    `Pregunta: ${title} - ${content}`
  );
  s = s.replaceAll("${userCode}", `Respuesta: ${answer}`);

  // Placeholders genéricos
  s = s.replaceAll("{{TITLE}}", title);
  s = s.replaceAll("{{CONTENT}}", content);
  s = s.replaceAll("{{ANSWER}}", answer);

  return s;
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, fetch, locals }) {
  try {
    // Autenticación básica
    if (!locals?.user) {
      return json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    // Entradas requeridas
    const body = await request.json().catch(() => ({}));
    const question = body?.question ?? null;
    const answer = body?.answer ?? null;

    if (!question || !answer) {
      return json(
        { success: false, error: "Faltan datos: question/answer" },
        { status: 400 }
      );
    }

    // Permisos: el autor de la pregunta, docente o admin pueden verificar
    const isStudent = locals.user?.role === "student";
    const isAuthor =
      locals.user?.id &&
      question?.author_id &&
      locals.user.id === question.author_id;
    if (isStudent && !isAuthor) {
      return json(
        {
          success: false,
          error: "No tienes permiso para verificar esta respuesta.",
        },
        { status: 403 }
      );
    }

    // Normaliza strings
    const qTitle = String(question?.title ?? "").trim();
    const qContent = String(question?.content ?? "").trim();
    const aContent = String(answer?.content ?? "").trim();

    // Carga template (o fallback)
    const dbTemplate = await loadVerifyTemplateFromDB();
    const template = dbTemplate || DEFAULT_VERIFY_TEMPLATE;

    // Construye el prompt final (sin .replace sobre undefined)
    const prompt = fillTemplate(template, {
      title: qTitle,
      content: qContent,
      answer: aContent,
    });

    // Llamada a la IA
    const result = await model.generateContent(prompt);
    const responseText = result?.response?.text ? result.response.text() : "";
    const cleaned = cleanJsonString(responseText);

    // Parseo robusto del JSON devuelto por la IA
    let verification = { isCorrect: false, feedback: "" };
    try {
      const parsed = JSON.parse(cleaned);
      if (typeof parsed?.isCorrect === "boolean") {
        verification.isCorrect = parsed.isCorrect;
      }
      if (typeof parsed?.feedback === "string") {
        verification.feedback = parsed.feedback;
      }
    } catch {
      // Fallback mínimo si no se pudo parsear
      const m = cleaned.match(/"isCorrect"\s*:\s*(true|false)/i);
      verification.isCorrect = m ? m[1].toLowerCase() === "true" : false;
    }

    // Si es correcta: bonificar y marcar como verificada
    if (verification.isCorrect) {
      try {
        await fetch("/api/progress/add-points", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: String(answer?.author_id || ""),
            points: 15,
            reason: "FORUM_CORRECT_REPLY",
          }),
        });
      } catch (e) {
        console.warn(
          "[verify-answer] No se pudo bonificar puntos:",
          e?.message
        );
      }

      try {
        await supabase
          .from('forum_answers')
          .update({ is_verified_correct: true })
          .eq('id', answer?.id);
      } catch (e) {
        console.warn(
          "[verify-answer] No se pudo actualizar respuesta en Supabase:",
          e?.message
        );
      }
    }

    return json({
      success: true,
      isCorrect: verification.isCorrect,
      feedback: verification.feedback ?? "",
    });
  } catch (error) {
    console.error("Error al verificar respuesta con IA:", error);
    return json(
      { success: false, error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
