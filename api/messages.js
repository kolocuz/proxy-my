import { kv } from '@vercel/kv';

export default async function handler(request, response) {
  // CORS для вашего GitHub Pages сайта
  response.setHeader('Access-Control-Allow-Origin', 'https://kolocuz.github.io');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  const { seed } = request.query; // seed = ID чата (как раньше)

  if (!seed) {
    return response.status(400).json({ error: 'Missing seed parameter' });
  }

  const key = `chat:${seed}`; // ключ в KV для этого чата

  try {
    if (request.method === 'GET') {
      // Получить все сообщения чата
      const messages = await kv.get(key) || [];
      return response.status(200).json(messages);
    }

    if (request.method === 'POST') {
      // Добавить новое сообщение
      const { message } = request.body;
      if (!message) {
        return response.status(400).json({ error: 'Missing message' });
      }

      // Текущие сообщения
      const messages = await kv.get(key) || [];
      
      // Добавляем новое (в конец)
      messages.push(message);
      
      // Ограничим количество сообщений (например, последние 1000)
      if (messages.length > 1000) {
        messages.shift();
      }

      // Сохраняем
      await kv.set(key, messages);

      return response.status(200).json({ success: true });
    }

    return response.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('KV error:', error);
    return response.status(500).json({ error: error.message });
  }
}
