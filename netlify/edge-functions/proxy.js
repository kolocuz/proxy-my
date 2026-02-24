export default async (request) => {
  const url = new URL(request.url);
  
  // Обработка preflight-запросов
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Target-URL',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Маршрутизация запросов
  if (url.pathname.startsWith('/disk/')) {
    // Прокси для API-запросов
    const path = url.pathname.replace(/^\/disk/, '') || '/';
    const targetUrl = 'https://cloud-api.yandex.net' + path + url.search;
    
    const modifiedRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });

    const response = await fetch(modifiedRequest);
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
    newResponse.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');

    return newResponse;
  }
  
  if (url.pathname.startsWith('/download/')) {
    // Прокси для скачивания файлов
    const downloadUrl = url.searchParams.get('url');
    if (!downloadUrl) {
      return new Response('Missing download URL', { status: 400 });
    }
    const targetUrl = decodeURIComponent(downloadUrl);
    
    const modifiedRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });

    const response = await fetch(modifiedRequest);
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
    newResponse.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');

    return newResponse;
  }
  
  if (url.pathname === '/upload/' && request.method === 'PUT') {
    // Прокси для загрузки файлов (получает целевой URL из заголовка X-Target-URL)
    const targetUrl = request.headers.get('X-Target-URL');
    if (!targetUrl) {
      return new Response('Missing X-Target-URL header', { status: 400 });
    }
    
    const modifiedRequest = new Request(targetUrl, {
      method: 'PUT',
      headers: request.headers,
      body: request.body,
    });

    const response = await fetch(modifiedRequest);
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
    newResponse.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Target-URL');

    return newResponse;
  }

  return new Response('Not found', { status: 404 });
};

export const config = {
  path: "/*"
};
