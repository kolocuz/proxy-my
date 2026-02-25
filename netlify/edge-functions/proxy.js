const allowedOrigins = [
  'http://localhost:3000',
  'https://your-site.netlify.app'
];

exports.handler = async (event) => {
  const origin = event.headers.origin || '';
  const allowOrigin = allowedOrigins.includes(origin) ? origin : 'null';

  const headers = {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, User-Agent, X-Requested-With',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  const targetUrl = event.queryStringParameters?.url;
  if (!targetUrl) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing "url" parameter' }),
    };
  }

  try {
    const response = await fetch(targetUrl, {
      method: event.httpMethod,
      headers: {
        'Authorization': event.headers.authorization || '',
        'User-Agent': event.headers['user-agent'] || 'Mozilla/5.0 (compatible; Netlify Proxy)',
      },
    });

    const body = await response.text();
    return {
      statusCode: response.status,
      headers: {
        ...headers,
        'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
      },
      body,
    };
  } catch (error) {
    console.error('Proxy error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch target URL' }),
    };
  }
};