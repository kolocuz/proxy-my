exports.handler = async (event) => {
  // Обработка preflight запросов (OPTIONS)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Max-Age': '86400'
      },
      body: ''
    };
  }

  const targetUrl = event.queryStringParameters.url;
  
  if (!targetUrl) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: 'Missing url parameter'
    };
  }

  try {
    // Формируем заголовки для целевого запроса
    const headers = {};
    
    // Сохраняем Authorization если есть
    if (event.headers.authorization || event.headers.Authorization) {
      headers['Authorization'] = event.headers.authorization || event.headers.Authorization;
    }
    
    // Сохраняем другие важные заголовки
    const preserveHeaders = [
      'content-type', 'accept', 'user-agent',
      'if-none-match', 'if-modified-since'
    ];
    
    preserveHeaders.forEach(header => {
      const value = event.headers[header] || event.headers[header.toLowerCase()];
      if (value) {
        headers[header] = value;
      }
    });

    // Делаем запрос к целевому URL
    const response = await fetch(targetUrl, {
      method: event.httpMethod,
      headers: headers,
      body: event.body || undefined
    });

    // Читаем тело ответа
    let body;
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      body = await response.json();
      body = JSON.stringify(body);
    } else {
      body = await response.text();
    }

    // Формируем успешный ответ
    return {
      statusCode: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Expose-Headers': '*',
        'Content-Type': contentType || 'application/json'
      },
      body: body
    };
    
  } catch (error) {
    console.error('Proxy error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Proxy error',
        message: error.message
      })
    };
  }
};