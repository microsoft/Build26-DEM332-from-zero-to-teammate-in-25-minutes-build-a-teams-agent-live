# Demo instructions: convert a web app into a Teams agent

This demo shows how quickly an existing web application can become a Microsoft Teams agent.

The point of the demo is not to hand-code every Teams integration step. The point is to show that, with the Teams Developer CLI and agent skills installed, a coding agent can discover the right Teams workflow, modify the existing server, configure the app registration, and return an onboarding/install link with very little manual glue.

## What this project demonstrates

You start with a working web application: a Project Management Helper with a browser chat UI and an existing server endpoint.

Then you ask a coding agent to integrate that application into Microsoft Teams. The agent should:

1. Inspect the existing app and server.
2. Add Teams bot support to the existing server instead of creating a separate service.
3. Register the Teams messaging endpoint at `/api/messages`.
4. Use the Teams Developer CLI to inspect or update the Teams app registration.
5. Use a dev tunnel when the app needs a public endpoint.
6. Return the Teams onboarding/install link.

The talk uses this flow to show how an existing app can become a Teams agent with extreme ease.

## Prerequisites

### Install the Teams Developer CLI

```bash
npm install -g @microsoft/teams.cli
```

Verify it is available:

```bash
teams --version
teams status
```

If needed, sign in before the demo:

```bash
teams login
```

### Install the Teams agent skills

Follow the official agent skills setup instructions:

```text
https://microsoft.github.io/teams-sdk/developer-tools/agent-skills
```

These skills teach the coding agent how to create, inspect, update, and troubleshoot Teams apps using the Teams Developer CLI and Teams SDK.

## Starting point

The starter web application is in:

```text
src/webapp
```

Install dependencies, create a local `.env`, add AI credentials, and run it locally:

```bash
cd src/webapp
npm install
cp .env.example .env
# Edit .env and add your Azure OpenAI or OpenAI credentials.
npm run dev
```

The app runs on:

```text
http://localhost:3978
```

At minimum, set either Azure OpenAI credentials:

```env
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_API_VERSION=...
AZURE_OPENAI_ENDPOINT=...
AZURE_OPENAI_MODEL_DEPLOYMENT_NAME=...
```

or regular OpenAI credentials:

```env
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini
```

## The coding-agent prompt

Once the CLI and skills are installed, open Copilot CLI, Pi, or your favorite coding agent from the web app folder.

Use a prompt like:

```text
Integrate this web app into Microsoft Teams. Give me the onboarding link once you do that.
```

An example of a completed run is available in:

```text
src/completed
```

The `.env` files have been removed for security, but the Teams integration code in that folder was generated entirely with Copilot.

The expected result is that the coding agent:

- reads the Teams agent skill
- identifies that this is an existing server integration
- adds the Teams SDK packages
- wires the Teams app into the existing Express server
- uses `/api/messages` as the Teams endpoint
- checks `.env` for existing Teams app credentials
- updates the registered Teams app endpoint if needed
- starts or uses a dev tunnel for local development
- builds the app to catch TypeScript issues
- returns a Teams install/onboarding link

## What to emphasize during the talk

### 1. This starts as a normal web app

Show the web app first. It has project context, transcripts, and a PM helper chat experience.

The important framing:

> We already have a useful app. The question is: how do we bring it to where the team works — Teams?

### 2. Teams integration usually has multiple setup steps

Briefly explain the normal work:

- register a Teams app/bot
- get app credentials
- expose a public endpoint
- add `/api/messages`
- authenticate incoming Teams messages
- send Teams responses back
- update the app manifest/endpoint
- install or reinstall the app in Teams

### 3. The CLI and skills compress the workflow

The Teams Developer CLI handles the app registration and endpoint update work.

The agent skills give the coding agent the right Teams-specific workflow so it does not have to guess.

### 4. The prompt is intentionally simple

The demo prompt should feel almost too small for the amount of work being done:

```text
Integrate this web app into Microsoft Teams. Give me the onboarding link once you do that.
```

### 5. The result is still the same app

The integration should reuse the existing PM helper logic. Teams is another interface over the same capability, not a brand-new app.

## Demo validation checklist

Before presenting, verify:

```bash
cd src/webapp
npm install
cp .env.example .env # if .env does not already exist
# Edit .env and add AI credentials.
npm run build
npm run dev
```

Then check:

- Teams CLI is installed and signed in.
- Agent skills are available to the coding agent.
- `.env` contains Teams app credentials if reusing a registered app.
- Local server runs on port `3978`.
- Dev tunnel points to the same port.
- Teams app endpoint is `<tunnel-url>/api/messages`.
- The returned install link belongs to the app ID in `.env`.

## Suggested narration

> This is a regular web app. It has a server, a chat UI, and some project context. Now I want this same capability inside Teams. Instead of manually wiring every Teams-specific step, I have the Teams CLI and the Teams agent skill installed. So I can ask my coding agent to do the integration in one sentence.

> The important thing is that the agent is not creating a separate service. It is integrating Teams into the existing server, registering the `/api/messages` endpoint, updating the Teams app, and giving me the onboarding link.

> That means we can move from web app to Teams agent very quickly — and then use the same pattern to create scoped teammate experiences.
