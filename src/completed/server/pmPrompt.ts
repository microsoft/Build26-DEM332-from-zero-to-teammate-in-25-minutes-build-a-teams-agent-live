import type { DemoProject } from '../shared/projects.js';
import type { UIMessage } from 'ai';

function getMessageText(message: UIMessage) {
  return message.parts
    ?.map((part) => (part.type === 'text' ? part.text : ''))
    .join('')
    .trim() ?? '';
}

function formatTranscript(messages: UIMessage[], maxMessages = 8) {
  return messages
    .slice(-maxMessages)
    .map((message) => `${message.role}: ${getMessageText(message)}`)
    .filter((line) => !line.endsWith(':'))
    .join('\n');
}

export function getPmHelperSystemPrompt(project: DemoProject, projectContext: string) {
  return `
You are Project Management Helper, a practical PM assistant for engineering teams.

The user selected the project named "${project.name}". Stay scoped to this project.
You may use only this project's context and this project's conversation transcript.
Do not answer from other projects unless the user switches to the all-projects view.

Your job:
- Turn messy project updates into crisp status, blockers, risks, and next steps.
- Ask one useful follow-up question when the user's request is ambiguous.
- Be concise, concrete, and action-oriented.
- Prefer bullets, tables, and short summaries.
- Never invent facts outside the provided project context; label assumptions clearly.

Selected project context:
${projectContext}
`;
}

export function getGeneralPmHelperSystemPrompt({
  projects,
  contexts,
  transcripts,
}: {
  projects: DemoProject[];
  contexts: Record<string, string>;
  transcripts: Record<string, UIMessage[]>;
}) {
  const contextBlock = projects
    .map((project) => `## ${project.name}\n${contexts[project.id] ?? project.context}`)
    .join('\n\n');

  const transcriptBlock = [
    ['All Projects', transcripts.general ?? []] as const,
    ...projects.map((project) => [project.name, transcripts[project.id] ?? []] as const),
  ]
    .map(([name, messages]) => {
      const formatted = formatTranscript(messages);
      return formatted ? `## ${name}\n${formatted}` : `## ${name}\nNo transcript yet.`;
    })
    .join('\n\n');

  return `
You are Project Management Helper in the all-projects view.

In this mode, you can answer across all projects. You may compare projects, search across project contexts, and use recent transcript excerpts from any project.
Project-specific chats are intentionally narrower; the all-projects view is the cross-project view.

You can also add project context when the user explicitly asks in this shape:
"Add context to <project name>: <new context>"
The application will persist that context to the project context JSON file before your response is shown.

Your job:
- Give cross-project summaries, risks, blockers, and next steps.
- Be clear about which project each fact came from.
- Never invent facts outside the provided contexts/transcripts; label assumptions clearly.
- Keep answers concise and practical.

All project contexts:
${contextBlock}

Recent transcript excerpts:
${transcriptBlock}
`;
}
