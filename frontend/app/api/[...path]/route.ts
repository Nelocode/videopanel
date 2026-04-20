import { NextRequest } from 'next/server';

const getBackendUrl = () => {
  return process.env.BACKEND_URL || 'http://localhost:8000';
};

async function handleRequest(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const backendUrl = getBackendUrl();
  const url = new URL(`${backendUrl}/api/${resolvedParams.path.join('/')}`);

  url.search = request.nextUrl.search;

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('connection');

  const fetchOptions: RequestInit = {
    method: request.method,
    headers,
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    fetchOptions.body = request.body;
    // @ts-ignore
    fetchOptions.duplex = 'half';
  }

  try {
    const res = await fetch(url.toString(), fetchOptions);

    // Create new headers from backend response
    const resHeaders = new Headers(res.headers);
    // Remove content-encoding so Next.js can handle it properly
    resHeaders.delete('content-encoding');

    return new Response(res.body, {
      status: res.status,
      headers: resHeaders,
    });
  } catch (error) {
    console.error(`[Proxy Error] Failed to reach ${url.toString()}:`, error);
    return new Response(JSON.stringify({ detail: 'Error de conexión con el backend.' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
