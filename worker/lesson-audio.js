import { vocabulary } from '../src/vocabulary-content.js';

const appOrigin = 'https://building-with-ai-f26.github.io';
const lessons = new Map(vocabulary.map(({ id, spanish }) =>
  [`/api/lesson-audio/${encodeURIComponent(id)}`, spanish]));
lessons.set('/api/lesson-audio/pink-house', 'una casa rosa');

function withCors(response) {
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', appOrigin);
  headers.set('Vary', 'Origin');
  return new Response(response.body, { status: response.status, headers });
}

function failure(status, reason) {
  const headers = { 'Cache-Control': 'no-store' };
  if (reason) headers['X-Speech-Status'] = reason;
  return withCors(new Response(null, { status, headers }));
}

export default {
  async fetch(request, env) {
    if (request.headers.get('Origin') !== appOrigin) return new Response(null, { status: 403 });
    if (request.method !== 'GET') return failure(405);

    const url = new URL(request.url);
    const input = lessons.get(url.pathname);
    if (url.search || !input) return failure(404);
    if (!env.OPENROUTER_API_KEY || !env.SPEECH_VISITORS || !env.SPEECH_GENERATIONS) {
      return failure(503, 'configuration-unavailable');
    }

    const visitor = request.headers.get('CF-Connecting-IP');
    if (!visitor) return failure(403);
    const cacheKey = new Request(url);

    let stage = 'visitor-limit';
    try {
      if (!(await env.SPEECH_VISITORS.limit({ key: visitor })).success) return failure(429);
      stage = 'cache-read';
      const cached = await caches.default.match(cacheKey);
      if (cached) return withCors(cached);
      stage = 'generation-limit';
      if (!(await env.SPEECH_GENERATIONS.limit({ key: 'word-of-mouth' })).success) return failure(429);

      stage = 'provider-request';
      const upstream = await fetch('https://openrouter.ai/api/v1/audio/speech', {
        method: 'POST',
        // Workers supports manual redirects. Reject any non-2xx response below.
        redirect: 'manual',
        signal: AbortSignal.timeout(10_000),
        headers: {
          Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'fish-audio/s2.1-pro-free:free',
          input,
          response_format: 'mp3',
          provider: { allow_fallbacks: false },
        }),
      });
      if (!upstream.ok || !upstream.headers.get('Content-Type')?.startsWith('audio/')) {
        await upstream.body?.cancel();
        return failure(upstream.status === 429 ? 429 : 503, `provider-${upstream.status}`);
      }

      stage = 'decode-response';
      const clip = await upstream.arrayBuffer();
      if (!clip.byteLength || clip.byteLength > 512 * 1024) return failure(503, 'invalid-audio');
      const response = new Response(clip, {
        headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'public, max-age=86400' },
      });
      // A cache write failure should not hide audio the provider already returned.
      await caches.default.put(cacheKey, response.clone()).catch(() => {});
      return withCors(response);
    } catch (error) {
      return failure(503, error?.name === 'TimeoutError' ? 'provider-timeout' : stage);
    }
  },
};
