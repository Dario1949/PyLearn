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
  try {
    const file = params.file || '';
    console.log('Avatar request for file:', file);
    
    if (!file) {
      console.log('No file specified');
      return new Response('Not found', { status: 404 });
    }

    const filePath = path.join(uploadsDir, file);
    console.log('Looking for file at:', filePath);
    
    if (!fs.existsSync(filePath)) {
      console.log('File not found:', filePath);
      return new Response('Not found', { status: 404 });
    }

    const ext = path.extname(filePath).toLowerCase();
    const body = fs.readFileSync(filePath);
    
    console.log('Serving file:', file, 'size:', body.length);

    return new Response(body, {
      headers: {
        'Content-Type': mimeFor(ext),
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error) {
    console.error('Error serving avatar:', error);
    return new Response('Server error', { status: 500 });
  }
}
