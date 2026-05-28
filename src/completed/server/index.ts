import 'dotenv/config';

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createAzure } from '@ai-sdk/azure';
import { createOpenAI } from '@ai-sdk/openai';
import { App as TeamsApp, ExpressAdapter } from '@microsoft/teams.apps';
import { MessageActivity } from '@microsoft/teams.api';
import { convertToModelMessages, streamText, type LanguageModel, type UIMessage } from 'ai';
import { demoProjects, getDemoProject, type DemoProject } from '../shared/projects.js';
import { getGeneralPmHelperSystemPrompt, getPmHelperSystemPrompt } from './pmPrompt.js';
import {
  buildMockGeneralPmAgentReply,
  buildMockPmAgentReply,
  streamMockGeneralPmAgent,
  streamMockPmAgent,
  streamTextResponse,
} from './mockPmAgent.js';

const isProduction = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT ?? 3978);
const hmrPort = Number(process.env.VITE_HMR_PORT ?? 3979);
const transcriptFilePath = path.join(process.cwd(), 'data', 'transcripts.json');
const contextFilePath = path.join(process.cwd(), 'data', 'project-contexts.json');

const generalChatId = 'general';
let jsonWriteQueue = Promise.resolve();

type TranscriptMap = Record<string, UIMessage[]>;
type ContextMap = Record<string, string>;

async function sendWebResponse(res: express.Response, response: Response) {
  res.status(response.status);
  response.headers.forEach((value, key) => res.setHeader(key, value));

  if (!response.body) {
    res.end();
    return;
  }

  const reader = response.body.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
  } finally {
    res.end();
  }
}

function getAzureBaseUrl(endpoint: string) {
  const normalizedEndpoint = endpoint.replace(/\/+$/, '');
  return normalizedEndpoint.endsWith('/openai') ? normalizedEndpoint : `${normalizedEndpoint}/openai`;
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const contents = await readFile(filePath, 'utf-8');
    return JSON.parse(contents) as T;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return fallback;
    }

    throw error;
  }
}

async function writeJsonFile<T>(filePath: string, value: T) {
  const write = async () => {
    await mkdir(path.dirname(filePath), { recursive: true });
    const tempFilePath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(tempFilePath, `${JSON.stringify(value, null, 2)}\n`);
    await rename(tempFilePath, filePath);
  };

  jsonWriteQueue = jsonWriteQueue.then(write, write);
  await jsonWriteQueue;
}

async function readTranscripts() {
  return readJsonFile<TranscriptMap>(transcriptFilePath, {});
}

async function writeTranscripts(transcripts: TranscriptMap) {
  await writeJsonFile(transcriptFilePath, transcripts);
}

async function readContexts() {
  const fallback = Object.fromEntries(demoProjects.map((project) => [project.id, project.context.trim()]));
  return readJsonFile<ContextMap>(contextFilePath, fallback);
}

async function writeContexts(contexts: ContextMap) {
  await writeJsonFile(contextFilePath, contexts);
}

function getTranscriptKey(projectId: string | undefined) {
  return projectId === generalChatId ? generalChatId : getDemoProject(projectId).id;
}

function getMessageText(message: UIMessage) {
  return message.parts
    ?.map((part) => (part.type === 'text' ? part.text : ''))
    .join('')
    .trim() ?? '';
}

function createTextMessage(role: 'user' | 'assistant', text: string, id = `${role}-${Date.now()}`): UIMessage {
  return {
    id,
    role,
    parts: [{ type: 'text', text }],
  };
}

function findProjectByNameOrId(projectNameOrId: string) {
  const normalized = projectNameOrId.trim().toLowerCase();
  return demoProjects.find(
    (project) => project.id.toLowerCase() === normalized || project.name.toLowerCase() === normalized,
  );
}

function parseGeneralContextAdd(messages: UIMessage[]) {
  const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user');
  const text = lastUserMessage ? getMessageText(lastUserMessage) : '';
  const match = text.match(/^(?:add|save|remember)\s+context\s+(?:to|for)\s+(.+?)\s*:\s*(.+)$/i);

  if (!match) return undefined;

  const project = findProjectByNameOrId(match[1]);
  const context = match[2]?.trim();

  if (!project || !context) return undefined;

  return { project, context };
}

function getConfiguredModel(): LanguageModel | undefined {
  if (process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT) {
    const azure = createAzure({
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION,
      baseURL: getAzureBaseUrl(process.env.AZURE_OPENAI_ENDPOINT),
      useDeploymentBasedUrls: true,
    });

    return azure.chat(
      process.env.AZURE_OPENAI_MODEL_DEPLOYMENT_NAME ?? process.env.AZURE_OPENAI_MODEL ?? 'gpt-4o-mini',
    );
  }

  if (process.env.OPENAI_API_KEY) {
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    return openai(process.env.OPENAI_MODEL ?? 'gpt-4o-mini');
  }

  return undefined;
}

function createTeamsAiMessage(text = '') {
  return new MessageActivity(text).addAiGenerated().addFeedback();
}

function isPersonalTeamsChat(conversationType: string | undefined) {
  return conversationType === 'personal';
}

async function generatePmReplyText({
  messages,
  mode,
  project,
  contexts,
  transcripts,
  onChunk,
}: {
  messages: UIMessage[];
  mode: typeof generalChatId | 'project';
  project: DemoProject;
  contexts: ContextMap;
  transcripts: TranscriptMap;
  onChunk?: (chunk: string) => void;
}) {
  const model = getConfiguredModel();

  if (!model) {
    return mode === generalChatId
      ? buildMockGeneralPmAgentReply(messages, demoProjects, contexts, transcripts)
      : buildMockPmAgentReply(messages, project, contexts[project.id] ?? project.context);
  }

  const result = streamText({
    model,
    system:
      mode === generalChatId
        ? getGeneralPmHelperSystemPrompt({ projects: demoProjects, contexts, transcripts })
        : getPmHelperSystemPrompt(project, contexts[project.id] ?? project.context),
    messages: await convertToModelMessages(messages),
  });

  let reply = '';
  for await (const chunk of result.textStream) {
    reply += chunk;
    onChunk?.(chunk);
  }

  return reply;
}

async function setupTeams(app: express.Application) {
  const adapter = new ExpressAdapter(app);
  const teamsApp = new TeamsApp({ httpServerAdapter: adapter });

  teamsApp.on('message', async ({ activity, send, stream }) => {
    const userText = activity.text ?? '';
    const transcriptKey = generalChatId;
    const userMessage = createTextMessage('user', userText, activity.id ? `teams-user-${activity.id}` : undefined);
    const contexts = await readContexts();
    const transcripts = await readTranscripts();
    const messages = [...(transcripts[transcriptKey] ?? []), userMessage];
    const isPersonalChat = isPersonalTeamsChat(String(activity.conversation.conversationType));

    const replyText = await generatePmReplyText({
      messages,
      mode: generalChatId,
      project: demoProjects[0],
      contexts,
      transcripts,
      onChunk: isPersonalChat ? (chunk) => stream.emit(chunk) : undefined,
    });

    if (isPersonalChat) {
      stream.emit(createTeamsAiMessage());
    } else {
      await send(createTeamsAiMessage(replyText));
    }

    transcripts[transcriptKey] = [...messages, createTextMessage('assistant', replyText)];
    await writeTranscripts(transcripts);
  });

  teamsApp.on('message.submit.feedback', async ({ activity, log }) => {
    const { reaction, feedback } = activity.value.actionValue;
    const messageId = activity.replyToId ?? activity.relatesTo?.activityId ?? activity.id;
    log.info(`Teams feedback for message ${messageId}: ${reaction}${feedback ? ` - ${feedback}` : ''}`);
  });

  await teamsApp.initialize();
}

async function createApp() {
  const app = express();

  app.use(express.json({ limit: '1mb' }));
  await setupTeams(app);

  app.get('/api/transcripts/:projectId', async (req, res) => {
    try {
      const transcriptKey = getTranscriptKey(req.params.projectId);
      const transcripts = await readTranscripts();
      res.json({ messages: transcripts[transcriptKey] ?? [] });
    } catch (error) {
      console.error('Failed to read transcript:', error);
      res.status(500).json({ error: 'Failed to read transcript.' });
    }
  });

  app.put('/api/transcripts/:projectId', async (req, res) => {
    const messages = req.body?.messages as UIMessage[] | undefined;

    if (!Array.isArray(messages)) {
      res.status(400).json({ error: 'Expected a messages array.' });
      return;
    }

    try {
      const transcriptKey = getTranscriptKey(req.params.projectId);
      const transcripts = await readTranscripts();
      transcripts[transcriptKey] = messages;
      await writeTranscripts(transcripts);
      res.json({ ok: true });
    } catch (error) {
      console.error('Failed to save transcript:', error);
      res.status(500).json({ error: 'Failed to save transcript.' });
    }
  });

  app.get('/api/contexts', async (_req, res) => {
    try {
      res.json({ contexts: await readContexts() });
    } catch (error) {
      console.error('Failed to read contexts:', error);
      res.status(500).json({ error: 'Failed to read contexts.' });
    }
  });

  app.post('/api/chat', async (req, res) => {
    const messages = req.body?.messages as UIMessage[] | undefined;
    const mode = req.body?.mode === generalChatId ? generalChatId : 'project';
    const project = getDemoProject(req.body?.projectId);

    if (!Array.isArray(messages)) {
      res.status(400).json({ error: 'Expected a messages array.' });
      return;
    }

    try {
      const contexts = await readContexts();
      const transcripts = await readTranscripts();

      if (mode === generalChatId) {
        const addContextRequest = parseGeneralContextAdd(messages);

        if (addContextRequest) {
          const existingContext = contexts[addContextRequest.project.id] ?? addContextRequest.project.context.trim();
          contexts[addContextRequest.project.id] = `${existingContext}\n\nAdded from all-projects view:\n- ${addContextRequest.context}`;
          await writeContexts(contexts);
          await sendWebResponse(
            res,
            streamTextResponse(
              `Added that to **${addContextRequest.project.name}** context. Future project-specific chats for ${addContextRequest.project.name} will see it.`,
            ),
          );
          return;
        }
      }

      const model = getConfiguredModel();

      if (!model) {
        await sendWebResponse(
          res,
          mode === generalChatId
            ? streamMockGeneralPmAgent(messages, demoProjects, contexts, transcripts)
            : streamMockPmAgent(messages, project, contexts[project.id] ?? project.context),
        );
        return;
      }

      const result = streamText({
        model,
        system:
          mode === generalChatId
            ? getGeneralPmHelperSystemPrompt({ projects: demoProjects, contexts, transcripts })
            : getPmHelperSystemPrompt(project, contexts[project.id] ?? project.context),
        messages: await convertToModelMessages(messages),
      });

      await sendWebResponse(res, result.toTextStreamResponse());
    } catch (error) {
      console.error('Chat API error:', error);
      res.status(500).json({
        error: 'The PM helper hit an issue while responding.',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  if (isProduction) {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => res.sendFile('dist/index.html', { root: process.cwd() }));
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { port: hmrPort },
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  }

  return app;
}

const app = await createApp();

app.listen(port, () => {
  console.log(`Project Management Helper running at http://localhost:${port}`);

  if (process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT) {
    console.log('Using Azure OpenAI for PM helper responses.');
  } else if (process.env.OPENAI_API_KEY) {
    console.log('Using OpenAI for PM helper responses.');
  } else {
    console.log('No model key is set, so the demo mock PM agent is active.');
  }
});
