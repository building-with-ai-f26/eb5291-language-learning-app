import { defineConfig, loadEnv } from 'vite';
import { vocabulary } from './src/vocabulary-content.js';

const lessonText = new Map(vocabulary.map(({ id, spanish }) => [`/${encodeURIComponent(id)}`, spanish]));
lessonText.set('/pink-house', 'una casa rosa');

function lessonAudio(apiKey) {
  const clips = new Map();

  async function generateClip(input) {
    if (!apiKey) return null;

    try {
      const response = await fetch('https://openrouter.ai/api/v1/audio/speech', {
        method: 'POST',
        redirect: 'error',
        signal: AbortSignal.timeout(10_000),
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'fish-audio/s2.1-pro-free:free',
          input,
          response_format: 'mp3',
          provider: { allow_fallbacks: false },
        }),
      });
      if (!response.ok || !response.headers.get('content-type')?.startsWith('audio/')) {
        await response.body?.cancel();
        return null;
      }
      const audio = Buffer.from(await response.arrayBuffer());
      return audio.length ? audio : null;
    } catch {
      return null;
    }
  }

  return {
    name: 'local-lesson-audio',
    configureServer(server) {
      server.middlewares.use('/api/lesson-audio', async (request, response) => {
        response.setHeader('Cache-Control', 'no-store');
        const input = lessonText.get(request.url);
        if (!input) {
          response.writeHead(404).end();
          return;
        }
        if (request.method !== 'GET') {
          response.writeHead(405, { Allow: 'GET' }).end();
          return;
        }
        if (request.headers['sec-fetch-site'] === 'cross-site') {
          response.writeHead(403).end();
          return;
        }

        // Share each in-flight request and remember failures until the dev server restarts.
        if (!clips.has(input)) clips.set(input, generateClip(input));
        const audio = await clips.get(input);
        if (!audio) {
          response.writeHead(503).end();
          return;
        }
        response.writeHead(200, {
          'Content-Type': 'audio/mpeg',
          'Content-Length': audio.length,
        }).end(audio);
      });
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [lessonAudio(loadEnv(mode, process.cwd(), 'OPENROUTER_API_KEY').OPENROUTER_API_KEY?.trim())],
}));
