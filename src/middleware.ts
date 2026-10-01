// Sin cache en API: cada respuesta /api/* sale con no-store.
export async function onRequest(
  { request }: { request: Request },
  next: () => Promise<Response>,
): Promise<Response> {
  const res = await next();
  if (new URL(request.url).pathname.startsWith('/api/')) {
    const h = new Headers(res.headers);
    h.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    h.set('Pragma', 'no-cache');
    return new Response(res.body, { status: res.status, headers: h });
  }
  return res;
}
