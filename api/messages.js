import { put } from '@vercel/blob';

export default async function handler(request, response) {
  // CORS для вашего GitHub Pages сайта
  response.setHeader('Access-Control-Allow-Origin', 'https://kolocuz.github.io');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Обработка preflight запросов
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  const { seed } = request.query;
  if (!seed) {
    return response.status(400).json({ error: 'Missing seed parameter' });
  }

  // Используем seed как имя файла (безопасное кодирование)
  const safeSeed = seed.replace(/[^a-zA-Z0-9]/g, '_');
  const BLOB_PATH = `chats/${safeSeed}.json`;

  try {
    // ========== ПОЛУЧИТЬ СООБЩЕНИЯ ==========
    if (request.method === 'GET') {
      try {
        // Пытаемся получить файл из Blob
        const blobUrl = `https://pub-ee6d96d9b26645e58b5a2db78fc5bae2.r2.dev/${BLOB_PATH}`;
        const res = await fetch(blobUrl);
        
        if (res.ok) {
          const messages = await res.json();
          return response.status(200).json(messages);
        } else {
          // Если файла нет (новый чат) — возвращаем пустой массив
          return response.status(200).json([]);
        }
      } catch (error) {
        // Любая ошибка чтения — возвращаем пустой массив
        console.log('No existing chat file, starting fresh');
        return response.status(200).json([]);
      }
    }

    // ========== ДОБАВИТЬ СООБЩЕНИЕ ==========
    if (request.method === 'POST') {
      const { message } = request.body;
      if (!message) {
        return response.status(400).json({ error: 'Missing message' });
      }

      // Загружаем существующие сообщения
      let messages = [];
      try {
        const blobUrl = `https://pub-ee6d96d9b26645e58b5a2db78fc5bae2.r2.dev/${BLOB_PATH}`;
        const res = await fetch(blobUrl);
        if (res.ok) {
          messages = await res.json();
        }
      } catch (error) {
        // Нет файла — начинаем с пустого массива
        console.log('Creating new chat file');
      }

      // Добавляем новое сообщение
      messages.push(message);

      // Ограничиваем историю (последние 1000 сообщений)
      if (messages.length > 1000) {
        messages = messages.slice(-1000);
      }

      // Сохраняем обратно в Blob
      const { url } = await put(BLOB_PATH, JSON.stringify(messages), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false, // Важно: не добавляем суффикс!
      });

      return response.status(200).json({ 
        success: true, 
        url: url,
        messageCount: messages.length 
      });
    }

    return response.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('Blob storage error:', error);
    return response.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
