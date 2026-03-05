import { put } from '@vercel/blob';

export default async function handler(request, response) {
  // CORS для вашего GitHub Pages сайта
  response.setHeader('Access-Control-Allow-Origin', 'https://kolocuz.github.io');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }
  
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { filename, filetype } = request.query;
    
    if (!filename || !filetype) {
      return response.status(400).json({ error: 'Missing filename or filetype' });
    }
    
    const blob = await put(filename, null, {
      access: 'public',
      contentType: filetype,
      addRandomSuffix: true, // Для файлов оставляем суффикс (чтобы избежать коллизий)
    });
    
    response.status(200).json({
      url: blob.url,
      downloadUrl: blob.downloadUrl,
    });
  } catch (error) {
    console.error('Error:', error);
    response.status(500).json({ error: error.message });
  }
}
