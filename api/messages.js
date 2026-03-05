import { kv } from '@vercel/kv';

export default async function handler(request, response) {
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

  const key = `chat:${seed}`;

  try {
    if (request.method === 'GET') {
      const messages = await kv.get(key) || [];
      return response.status(200).json(messages);
    }

    if (request.method === 'POST') {
      const { message } = request.body;
      if (!message) {
        return response.status(400).json({ error: 'Missing message' });
      }

      const messages = await kv.get(key) || [];
      messages.push(message);
      
      if (messages.length > 1000) {
        messages.shift();
      }

      await kv.set(key, messages);
      return response.status(200).json({ success: true });
    }

    return response.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('KV error:', error);
    return response.status(500).json({ error: error.message });
  }
}
