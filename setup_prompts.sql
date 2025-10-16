-- Crear tabla prompts si no existe
CREATE TABLE IF NOT EXISTS prompts (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insertar prompt de verificación
INSERT INTO prompts (key, content) VALUES (
  'verificarReto',
  'Analiza el siguiente código Python y verifica si resuelve correctamente el reto:

Reto: ${challenge.description}
Código del usuario: ${userCode}

Responde ÚNICAMENTE en formato JSON válido con esta estructura exacta:
{
  "isCorrect": true/false,
  "feedback": "Explicación detallada del resultado",
  "score": número entre 0 y 100
}

No incluyas texto adicional fuera del JSON.'
) ON CONFLICT (key) DO UPDATE SET content = EXCLUDED.content;