# Word of Mouth speech Worker

GitHub Pages serves the learner app. Cloudflare Workers serves pronunciation
for known lesson IDs using the free Fish Audio model and its default voice.
The Worker uses the Cloudflare secret `OPENROUTER_API_KEY`. The browser build
only needs the Worker’s public origin.

Build from a clean release checkout:

```sh
VITE_LESSON_AUDIO_ORIGIN=https://word-of-mouth-speech.language-learning-app.workers.dev npm run build -- --base=./
```

Publish the learner build at the root of the existing `gh-pages` branch.
Preserve its `.nojekyll` file and any separately published Product Page.
