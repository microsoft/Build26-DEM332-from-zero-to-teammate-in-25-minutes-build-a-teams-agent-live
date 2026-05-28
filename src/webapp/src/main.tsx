import React from 'react';
import ReactDOM from 'react-dom/client';
import { useChat } from '@ai-sdk/react';
import { TextStreamChatTransport, type UIMessage } from 'ai';
import { demoProjects, type DemoProject } from '../shared/projects';
import './styles.css';

type TranscriptMap = Record<string, UIMessage[]>;
type ChatTarget =
  | { id: 'general'; name: string; summary: string; mode: 'general' }
  | (DemoProject & { mode: 'project' });

const generalChat: ChatTarget = {
  id: 'general',
  name: 'All Projects',
  summary: 'Search across project contexts and transcripts, or add new context to a project.',
  mode: 'general',
};

async function loadProjectTranscript(projectId: string) {
  const response = await fetch(`/api/transcripts/${projectId}`);

  if (!response.ok) {
    throw new Error('Failed to load project transcript.');
  }

  const body = (await response.json()) as { messages?: UIMessage[] };
  return body.messages ?? [];
}

async function saveProjectTranscript(projectId: string, messages: UIMessage[]) {
  const response = await fetch(`/api/transcripts/${projectId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    throw new Error('Failed to save project transcript.');
  }
}

function getMessageText(message: { parts?: Array<{ type: string; text?: string }> }) {
  return message.parts
    ?.map((part) => (part.type === 'text' ? part.text : ''))
    .join('') ?? '';
}

function getLastDiscussed(messages: UIMessage[]) {
  const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user');
  const text = lastUserMessage ? getMessageText(lastUserMessage).trim() : '';

  return text || 'No conversation yet';
}

function ChatPanel({
  target,
  onTranscriptChange,
}: {
  target: ChatTarget;
  onTranscriptChange: (projectId: string, messages: UIMessage[]) => void;
}) {
  const [input, setInput] = React.useState('');
  const [isTranscriptLoaded, setIsTranscriptLoaded] = React.useState(false);
  const [transcriptError, setTranscriptError] = React.useState<string | undefined>();
  const skipNextSaveRef = React.useRef(false);

  const transport = React.useMemo(
    () =>
      new TextStreamChatTransport({
        api: '/api/chat',
        prepareSendMessagesRequest({ messages }) {
          return {
            body: {
              messages,
              mode: target.mode,
              projectId: target.mode === 'project' ? target.id : undefined,
            },
          };
        },
      }),
    [target.id, target.mode],
  );

  const { messages, sendMessage, setMessages, status, stop, error } = useChat({
    id: target.id,
    messages: [],
    transport,
  });

  const isThinking = status === 'submitted' || status === 'streaming';
  const emptyTitle = target.mode === 'general' ? 'Start with all projects.' : `Start talking about ${target.name}.`;
  const emptyDescription =
    target.mode === 'general'
      ? 'Ask about risks across every project, search recent transcripts, or add context with “Add context to Conference Demo: ...”.'
      : 'Ask for a status update, blockers, risks, or next steps. This chat only sees its own project context and transcript.';

  React.useEffect(() => {
    let isCurrent = true;

    setIsTranscriptLoaded(false);
    setTranscriptError(undefined);

    loadProjectTranscript(target.id)
      .then((loadedMessages) => {
        if (!isCurrent) return;
        skipNextSaveRef.current = true;
        setMessages(loadedMessages);
        onTranscriptChange(target.id, loadedMessages);
        setIsTranscriptLoaded(true);
      })
      .catch((loadError: unknown) => {
        if (!isCurrent) return;
        setTranscriptError(loadError instanceof Error ? loadError.message : 'Failed to load transcript.');
        setIsTranscriptLoaded(true);
      });

    return () => {
      isCurrent = false;
    };
  }, [target.id, setMessages, onTranscriptChange]);

  React.useEffect(() => {
    if (!isTranscriptLoaded) return;

    onTranscriptChange(target.id, messages);

    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }

    // During streaming, AI SDK updates the assistant message chunk-by-chunk.
    // Persist only after streaming settles so the JSON file never stores a partial response.
    if (isThinking) return;

    saveProjectTranscript(target.id, messages).catch((saveError: unknown) => {
      setTranscriptError(saveError instanceof Error ? saveError.message : 'Failed to save transcript.');
    });
  }, [messages, target.id, isTranscriptLoaded, onTranscriptChange, isThinking]);

  async function submitPrompt(prompt: string) {
    if (!prompt.trim() || isThinking || !isTranscriptLoaded) return;
    setInput('');
    await sendMessage({ text: prompt });
  }

  function clearTranscript() {
    stop();
    setMessages([]);
  }

  return (
    <section className="chat-panel" aria-label={`Chat: ${target.name}`}>
      <div className="messages">
        {!isTranscriptLoaded ? (
          <div className="empty-state">
            <h3>Loading {target.name}.</h3>
            <p>Pulling the saved transcript from the project JSON file.</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="empty-state">
            <h3>{emptyTitle}</h3>
            <p>{emptyDescription}</p>
          </div>
        ) : (
          messages.map((message) => (
            <article key={message.id} className={`message ${message.role}`}>
              <div className="avatar">{message.role === 'user' ? 'You' : 'PM'}</div>
              <div className="bubble">{getMessageText(message)}</div>
            </article>
          ))
        )}
      </div>

      {transcriptError ? <p className="error">{transcriptError}</p> : null}
      {error ? <p className="error">{error.message}</p> : null}

      <form
        className="composer"
        onSubmit={async (event) => {
          event.preventDefault();
          await submitPrompt(input);
        }}
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={target.mode === 'general' ? 'Ask across all projects…' : `Ask about ${target.name}…`}
          disabled={isThinking || !isTranscriptLoaded}
        />
        {messages.length > 0 && !isThinking && isTranscriptLoaded ? (
          <button className="secondary-button" type="button" onClick={clearTranscript}>
            Clear
          </button>
        ) : null}
        {isThinking ? (
          <button type="button" onClick={stop}>
            Stop
          </button>
        ) : (
          <button type="submit" disabled={!input.trim() || !isTranscriptLoaded}>
            Send
          </button>
        )}
      </form>
    </section>
  );
}

function App() {
  const [selectedTargetId, setSelectedTargetId] = React.useState<ChatTarget['id']>('general');
  const [transcripts, setTranscripts] = React.useState<TranscriptMap>({});
  const projectTargets: ChatTarget[] = demoProjects.map((project) => ({ ...project, mode: 'project' }));
  const targets = [generalChat, ...projectTargets];
  const selectedTarget = targets.find((target) => target.id === selectedTargetId) ?? generalChat;
  const lastDiscussed = getLastDiscussed(transcripts[selectedTarget.id] ?? []);
  const refreshTranscriptSummary = React.useCallback((projectId: string, messages: UIMessage[]) => {
    setTranscripts((current) => ({
      ...current,
      [projectId]: messages,
    }));
  }, []);

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Projects">
        <div className="sidebar-header">
          <p className="eyebrow">PM Helper</p>
          <h1>Projects</h1>
        </div>

        <nav className="project-list">
          {targets.map((target) => (
            <button
              key={target.id}
              className={`project-item ${target.id === selectedTarget.id ? 'active' : ''}`}
              onClick={() => setSelectedTargetId(target.id)}
            >
              <span className="project-name">{target.name}</span>
              <span className="project-summary">{target.summary}</span>
            </button>
          ))}
        </nav>
      </aside>

      <section className="workspace">
        {selectedTarget.mode === 'project' ? (
          <header className="project-header">
            <div>
              <p className="eyebrow">Latest conversation topic</p>
              <h2>{selectedTarget.name}</h2>
              <p>Last discussed: {lastDiscussed}</p>
            </div>
          </header>
        ) : null}

        <ChatPanel key={selectedTarget.id} target={selectedTarget} onTranscriptChange={refreshTranscriptSummary} />
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
