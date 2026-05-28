import type { UIMessage } from 'ai';
import type { DemoProject } from '../shared/projects.js';

function getText(message: UIMessage): string {
  return message.parts
    ?.map((part) => (part.type === 'text' ? part.text : ''))
    .join('')
    .trim() ?? '';
}

function firstContextLine(context: string, label: string) {
  return context
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.startsWith(label));
}

export function buildMockPmAgentReply(messages: UIMessage[], project: DemoProject, projectContext: string): string {
  const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user');
  const request = lastUserMessage ? getText(lastUserMessage).toLowerCase() : '';
  const goal = firstContextLine(projectContext, 'Goal:')?.replace('Goal:', '').trim() ?? project.summary;
  const timeline = firstContextLine(projectContext, 'Timeline:')?.replace('Timeline:', '').trim() ?? 'No timeline captured.';

  if (request.includes('status') || request.includes('summary')) {
    return `Here’s the project status I’d send:\n\n**${project.name} — status**\n- **Goal:** ${goal}\n- **Timeline:** ${timeline}\n- **Summary:** ${project.summary}\n\nWant me to turn this into an exec-style update or a standup update?`;
  }

  if (request.includes('blocker') || request.includes('risk')) {
    return `Here are the risks I’m tracking for **${project.name}**:\n\n${projectContext
      .split('\n')
      .filter((line) => line.trim().startsWith('-'))
      .slice(-3)
      .join('\n')}\n\nBiggest next move: pick the highest-risk item and define the next checkpoint.`;
  }

  if (request.includes('next') || request.includes('todo') || request.includes('action')) {
    return `Recommended action plan for **${project.name}**:\n\n1. Confirm the next milestone: ${timeline}\n2. Identify the single highest-risk workstream.\n3. Turn each risk into a concrete next step and date.\n4. Send a short status update to stakeholders.\n5. Re-check the plan after the next checkpoint.`;
  }

  return `I’m scoped to **${project.name}**.\n\n${projectContext.trim()}\n\nI can help with status updates, risks, next steps, or a quick project brief.`;
}

export function buildMockGeneralPmAgentReply(
  messages: UIMessage[],
  projects: DemoProject[],
  contexts: Record<string, string>,
  transcripts: Record<string, UIMessage[]>,
) {
  const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user');
  const request = lastUserMessage ? getText(lastUserMessage).toLowerCase() : '';

  if (request.includes('transcript') || request.includes('last discussed')) {
    return projects
      .map((project) => {
        const latest = [...(transcripts[project.id] ?? [])].reverse().find((message) => message.role === 'user');
        return `- **${project.name}:** ${latest ? getText(latest) : 'No project-specific transcript yet.'}`;
      })
      .join('\n');
  }

  if (request.includes('risk') || request.includes('blocker')) {
    return `Across all projects, I’d watch these:\n\n${projects
      .map((project) => {
        const context = contexts[project.id] ?? project.context;
        const risks = context
          .split('\n')
          .filter((line) => line.trim().startsWith('-'))
          .slice(-2)
          .join(' ');
        return `- **${project.name}:** ${risks || project.summary}`;
      })
      .join('\n')}\n\nThe all-projects view can inspect every project context; project-specific chats only see their own context.`;
  }

  return `I can look across all project contexts and transcripts.\n\nProjects I can search:\n${projects
    .map((project) => `- ${project.name}`)
    .join('\n')}\n\nYou can also say: “Add context to Conference Demo: <new detail>”.`;
}

export function streamTextResponse(reply: string): Response {
  const chunks = reply.match(/.{1,18}(\s|$)/g) ?? [reply];

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
        await new Promise((resolve) => setTimeout(resolve, 18));
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
}

export function streamMockPmAgent(messages: UIMessage[], project: DemoProject, projectContext: string): Response {
  return streamTextResponse(buildMockPmAgentReply(messages, project, projectContext));
}

export function streamMockGeneralPmAgent(
  messages: UIMessage[],
  projects: DemoProject[],
  contexts: Record<string, string>,
  transcripts: Record<string, UIMessage[]>,
): Response {
  return streamTextResponse(buildMockGeneralPmAgentReply(messages, projects, contexts, transcripts));
}
