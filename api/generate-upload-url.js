import { put } from '@vercel/blob';

export default async function handler(request, response) {
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
    
    // ✅ ТОКЕН ЯВНО УКАЗАН
    const BLOB_TOKEN = 'vercel_blob_rw_LfGF4UTZuaUbRsTo_zbwq4kqa8LtFGMViQ5mROHs4tTqhCu';
    
    const blob = await put(filename, null, {
      access: 'public',
      contentType: filetype,
      addRandomSuffix: true,
      token: BLOB_TOKEN // 👈 ЯВНО ПЕРЕДАЁМ ТОКЕН
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
