# AGENTS.md — Coding Agent Operating Manual

> Give this file to your coding agent and check that it is using these instructions. Keep the stack, commands, and ground rules current.

## 1. Project Overview
- **What this repo builds:** Spanish Study teaches beginner Spanish through vocabulary cards and sentence exercises that explain why answers work.
- **Primary user & core workflow:** [See the living PRD in `docs/index.html`]
- **Tech stack:** Vite, HTML, CSS, and JavaScript with JSON lesson content

## 2. Commands
- **Install dependencies:** `npm ci`
- **Run locally:** `npm run dev`
- **Verify the build:** `npm run build`
- **Course verification guidance:** `tests/README.md`

## 3. Non-Negotiable Engineering Rules
1. **Plan before coding:** Before touching multiple files, propose a brief plan and wait for approval.
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
