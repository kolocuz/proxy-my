import { put } from '@vercel/blob';

export default async function handler(request, response) {
  // CORS
  response.setHeader('Access-Control-Allow-Origin', 'https://kolocuz.github.io');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  const { seed } = request.query;
  if (!seed) {
    return response.status(400).json({ error: 'Missing seed parameter' });
  }

  const safeSeed = seed.replace(/[^a-zA-Z0-9]/g, '_');
  const BLOB_PATH = `chats/${safeSeed}.json`;
  const BLOB_PUBLIC_URL = 'https://lfgf4utzuaubrsto.public.blob.vercel-storage.com';

  try {
    // ========== GET - ПОЛУЧИТЬ СООБЩЕНИЯ ==========
    if (request.method === 'GET') {
      try {
        const blobUrl = `${BLOB_PUBLIC_URL}/${BLOB_PATH}`;
        const res = await fetch(blobUrl);
        if (res.ok) {
          return response.status(200).json(await res.json());
        }
        return response.status(200).json([]);
      } catch (error) {
        console.log('Error reading blob:', error.message);
        return response.status(200).json([]);
      }
    }

    // ========== POST - ДОБАВИТЬ СООБЩЕНИЕ ==========
    if (request.method === 'POST') {
      // 👇 ВАШ ФОРМАТ: { message: {...} }
      const { message } = request.body;
      
      console.log('Получено сообщение:', message); // Для отладки
      
      if (!message) {
        return response.status(400).json({ 
          error: 'Missing message object',
          receivedBody: request.body 
        });
      }

      // Загружаем существующие сообщения
      let messages = [];
      try {
        const blobUrl = `${BLOB_PUBLIC_URL}/${BLOB_PATH}`;
        const res = await fetch(blobUrl);
        if (res.ok) {
          messages = await res.json();
        }
      } catch (error) {
        console.log('No existing file, creating new one');
      }

      // Добавляем новое сообщение
      messages.push(message);

      // Ограничиваем историю
      if (messages.length > 1000) {
        messages = messages.slice(-1000);
      }

      // Сохраняем в Blob
      const { url } = await put(BLOB_PATH, JSON.stringify(messages), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
      });

      console.log(`Сохранено ${messages.length} сообщений`);
      return response.status(200).json({ 
        success: true, 
        messageCount: messages.length 
      });
    }

    return response.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('Fatal error:', error);
    return response.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      stack: error.stack 
    });
  }
}
