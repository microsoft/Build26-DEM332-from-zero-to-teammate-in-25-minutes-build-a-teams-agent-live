# Project Management Helper — existing agent

This is the first demo app for the talk: a standalone project-management helper agent running in a web chat.

It is intentionally simple:

- Vite + React for the chat UI
- Express for `/api/chat`
- AI SDK for the chat transport and model streaming
- A left-side chat picker with **All Projects** plus project-specific chats
- Per-chat transcripts persisted in `data/transcripts.json`
- Project contexts persisted in `data/project-contexts.json`
- Starter conversations checked into the JSON file for demo day
- Optional Azure OpenAI or OpenAI-backed responses
- Deterministic mock PM responses when no model key is set, so the demo still works offline

## Run it

```bash
npm install
npm run dev
```

Open <http://localhost:3978>.

## Optional real model

```bash
cp .env.example .env
# add Azure OpenAI vars, or OPENAI_API_KEY
npm run dev
```

Azure OpenAI is preferred when configured. Otherwise the app falls back to OpenAI, then mock responses.

## Starter state

Conversations live in:

```text
data/transcripts.json
```

Project context lives in:

```text
data/project-contexts.json
```

Edit those files before build/demo day to reset the app to a known starter state.

## Chat modes

- **All Projects** can look across all project contexts and recent transcripts.
- **All Projects** can add context with a message like:

  ```text
  Add context to Conference Demo: The permissions demo now uses RSC in a group chat.
  ```

- A project-specific chat only sees that project’s transcript and that project’s context.

## Demo beats

1. Show this as the existing project-management helper.
2. Use All Projects to ask what is risky across all projects.
3. Pick a project from the left side.
4. Ask for a status update and show that the answer is scoped.
5. Switch projects and show that each project keeps its own transcript.
6. Then transition: “Cool, but my team lives in Teams. How do I bring this same agent there?”
