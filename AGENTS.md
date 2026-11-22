# AGENTS.md — Coding Agent Operating Manual

> Give this file to your coding agent and check that it is using these instructions. Keep the stack, commands, and ground rules current.

## 1. Project Overview
- **What this repo builds:** Word of Mouth teaches languages through vocabulary, pronunciation, and sentence practice. Spanish is the first language being tested.
- **Primary user & core workflow:** [See the living PRD in `docs/index.html`]
- **Tech stack:** Vite, HTML, CSS, and JavaScript with JSON lesson content

## 2. Commands
- **Install dependencies:** `npm ci`
- **Run locally:** `npm run dev`
- **Verify the build:** `npm run build`
- **Course verification guidance:** `tests/README.md`

## 3. Non-Negotiable Engineering Rules
1. For local tasks I’ve requested, make the code, test, and documentation edits needed to finish the task. The number of files alone does not require approval. Ask me first if you need to expand the scope, refactor shared code beyond what the task requires, or change how learner progress, user data, or secrets are handled. All other approval rules still apply. After changing the app, summarize what changed and give me one quick browser check.
2. **Small batches:** Make small, focused changes that can be reviewed and explained by a human in a single Pull Request.
3. **Explainability:** Avoid unnecessary abstractions or dependencies. Help the human builder understand the main components, what changed, why it matters, what could break, and how it was checked.
4. **Verify changes:** Run relevant checks. For a reproducible logic bug, use a failing test to demonstrate the fix when practical. Record manual checks and known limitations; follow the selected Build 4 evaluation track.
5. **Zero secrets in code:** Never hardcode API keys, tokens, or credentials. Always read from environment variables (`.env`) and update `.env.example` when new variables are needed.
6. **Stop when looping:** If a fix fails twice in a row, stop, summarize what failed, and ask the human before trying a third approach.

## 4. App workflow

- `index.html` holds the opening screen and `src/styles.css` styles it. Keep lesson content separate from exercise rendering and scoring.
- Explain changed files and give Emma a check she can do in her browser.
- Keep work in this project folder. Leave Keep in Touch and its repository untouched.
- Ask Emma before creating a remote repository, publishing, deploying, or submitting.

## 5. Shipping

- GitHub Pages publishes the learner app at `https://building-with-ai-f26.github.io/eb5291-language-learning-app/` from the root of `gh-pages`. The learner’s profile and progress stay in the browser. There are no hosted accounts or databases.
- Pronunciation runs on the existing Cloudflare Worker. Keep `OPENROUTER_API_KEY` in the Worker secret store. It is never a Pages build variable. The Worker uses known lesson IDs, rate limits requests, and uses the free OpenRouter model with no paid fallback. See `SECURITY.md` for verified evidence.
- In a clean release checkout, run `npm ci`. Put the existing browser-facing `VITE_POSTHOG_TOKEN` and `VITE_POSTHOG_API_HOST` in the ignored `.env`. Build the learner app with:

  ```sh
  VITE_LESSON_AUDIO_ORIGIN=https://word-of-mouth-speech.language-learning-app.workers.dev \
  VITE_POSTHOG_REPLAY_TEST=true npm run build:learner
  ```

  This includes the production speaker. In a private window, manually enter **Build 2 Demo** as the fictional learner’s name to reveal the separate replay control after analytics opt-in. The app does not display or prefill that name. Omit `VITE_POSTHOG_REPLAY_TEST` to ship with the test control hidden. If the shared PostHog project does not allow recording, document that result without changing project settings.

- Verify the build before publishing. In a separate checkout of `gh-pages`, copy the generated learner `index.html` and `assets/` into the branch root. Preserve `.nojekyll` and any existing `/product/` files. Keep the separate local Product Page draft out of a learner-only release. After approval, commit and push that branch, check GitHub Pages build status, and test the public app on desktop and phone.
- Live smoke test: in a fresh tab, verify that declining analytics makes no PostHog requests. With a fictional profile, allow analytics and tap the speaker on **agua**. Verify playback and filter PostHog for `app=word_of_mouth` and `surface=learner_app`. If recording is allowed, start a separately opted-in masked replay and match it to the speaker event’s session ID.

### Ask me first

- Destructive commands, data deletion or migration, and any change to learner data or databases.
- Creating, moving, rotating, or revoking keys or secrets, and changing permissions or account settings.
- Anything that costs money or changes a plan, spending cap, or billing setting.
- Publishing, deploying, or submitting course work.

### Lesson from a real mistake

- A credential-like value once appeared while inspecting `.env.example`. Never print a dotenv file, including an example file. Check only the names and whether required values are set, and pass secrets directly to the authorized server-side store.
