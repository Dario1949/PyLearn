// src/routes/uploads/avatars/[file]/+server.js
import fs from 'fs';
import path from 'path';

const uploadsDir = path.resolve('uploads/avatars');

function mimeFor(ext) {
  switch (ext) {
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.gif': return 'image/gif';
    case '.svg': return 'image/svg+xml';
    case '.webp': return 'image/webp';
    default: return 'application/octet-stream';
  }
}

export async function GET({ params }) {
  const file = params.file || '';
  if (!file) return new Response('Not found', { status: 404 });

  const filePath = path.join(uploadsDir, file);
  if (!fs.existsSync(filePath)) {
    return new Response('Not found', { status: 404 });
  }

  const ext = path.extname(filePath).toLowerCase();
  const body = fs.readFileSync(filePath);

  return new Response(body, {
    headers: {
      'Content-Type': mimeFor(ext),
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  });
}
