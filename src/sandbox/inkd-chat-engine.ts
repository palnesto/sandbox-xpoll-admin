// Sandbox-only: shared in-memory engine backing the INKD agent chat feature.
//
// Both the REST routes in mock-api.ts (list/history/send/active-job/cancel) and the
// EventSource stub (stubs/eventsource.ts) import this module and operate on the SAME
// underlying store, so whichever transport the real hook happens to use (live SSE, or
// its REST fallback if SSE stalls) sees consistent state. The hook itself
// (src/hooks/use-inkd-chat.ts) is never touched — this only stands in for its network
// calls.
import { getCollection } from "./state";
import { SANDBOX_ADMIN_USER } from "./config";
import { findInkdAgent } from "./fixtures";

export type InkDMessagePart = { type: string; text?: string; content?: string };
export type InkDChatMessage = {
  _id: string;
  chatId: string;
  author: { role: string; internalAccountId?: string; inkdAgentId?: string };
  parts: InkDMessagePart[];
  messageStatus: { status: "pending" | "success" | "failure" | "cancelled" } | null;
  stream: { state: "streaming" | "completed" | "failed" | "cancelled"; version: number; seq: number } | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type InkDChat = {
  _id: string;
  inkdAgentId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

type ScriptEvent =
  | { t: number; kind: "snapshot"; name: "queued" | "running" | "completed" | "failed" | "cancelled"; isTerminal: boolean }
  | { t: number; kind: "assistant"; name: "assistant_start" | "assistant_done"; message: InkDChatMessage }
  | { t: number; kind: "delta"; delta: string; streamVersion: number; streamSeq: number };

type Job = {
  jobId: string;
  chatId: string;
  inkdAgentId: string;
  internalAccountId: string;
  adminMessageId: string;
  mode: "chat" | "plan" | "build";
  prompt: string;
  referencedBlogIds: string[];
  state: string;
  stage: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  eventsPath: string;
  script: ScriptEvent[];
  startedAtMs: number;
  assistantMessageId: string;
};

function nowIso() {
  return new Date().toISOString();
}

function genId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function chats() {
  return getCollection<InkDChat[]>("inkdChats", () => []);
}
function messagesByChat() {
  return getCollection<Record<string, InkDChatMessage[]>>("inkdChatMessages", () => ({}));
}
function activeJobs() {
  return getCollection<Record<string, Job | null>>("inkdActiveJobs", () => ({}));
}

export function listChats(agentId: string): InkDChat[] {
  return chats()
    .filter((c) => c.inkdAgentId === agentId)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function getHistory(chatId: string) {
  const chat = chats().find((c) => c._id === chatId) ?? null;
  const entries = messagesByChat()[chatId] ?? [];
  return { chat, entries, meta: { total: entries.length, page: 1, pageSize: 100, totalPages: 1 } };
}

function mkTextMessage(chatId: string, role: string, text: string, stream: InkDChatMessage["stream"]): InkDChatMessage {
  return {
    _id: genId("msg"),
    chatId,
    author: role === "internalAccount" ? { role, internalAccountId: SANDBOX_ADMIN_USER.id } : { role: "assistant" },
    parts: [{ type: "text", text }],
    messageStatus: { status: "success" },
    stream,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

const REPLY_OPENERS = [
  "Here's what I found looking into that.",
  "Good question — I dug through the available sources for this.",
  "I pulled together a few angles on this before answering.",
];
const REPLY_BODIES = [
  "The short version is that community sentiment has been shifting steadily over the last few cycles, with participation concentrated among a handful of highly engaged locations. I'd recommend framing the next trial around the specific tradeoff rather than the general topic, since that's what tends to move response rates.",
  "Looking at the linked blogs and trials for this agent, the pattern that stands out is a split roughly two-to-one in favor of the status quo, but with a long tail of undecided responses that a well-worded follow-up poll could actually resolve.",
  "There isn't a clean consensus yet. What I can say is that the sourced articles agree on the underlying facts even where they disagree on framing, so a neutral poll option set should hold up well here.",
];
const REPLY_CLOSERS = [
  "Want me to draft a follow-up trial around this?",
  "I can turn this into a blog post if that's useful.",
  "Let me know if you want this narrowed to a specific region.",
];

function generateAssistantReply(prompt: string) {
  const opener = REPLY_OPENERS[prompt.length % REPLY_OPENERS.length];
  const body = REPLY_BODIES[prompt.length % REPLY_BODIES.length];
  const closer = REPLY_CLOSERS[prompt.length % REPLY_CLOSERS.length];
  return `${opener} ${body} ${closer}`;
}

function chunkWords(text: string, chunkSize = 6) {
  const words = text.split(" ");
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(" ") + (i + chunkSize < words.length ? " " : ""));
  }
  return chunks;
}

function buildScript(chatId: string, assistantMessageId: string, replyText: string): ScriptEvent[] {
  const startMsg = mkTextMessage(chatId, "assistant", "", { state: "streaming", version: 1, seq: 0 });
  startMsg._id = assistantMessageId;
  startMsg.parts = [];

  const chunks = chunkWords(replyText, 7);
  const script: ScriptEvent[] = [
    { t: 250, kind: "snapshot", name: "queued", isTerminal: false },
    { t: 500, kind: "snapshot", name: "running", isTerminal: false },
    { t: 650, kind: "assistant", name: "assistant_start", message: startMsg },
  ];

  let t = 900;
  chunks.forEach((chunk, i) => {
    script.push({ t, kind: "delta", delta: chunk, streamVersion: 1, streamSeq: i + 1 });
    t += 260;
  });

  const doneMsg = mkTextMessage(chatId, "assistant", replyText, { state: "completed", version: 1, seq: chunks.length + 1 });
  doneMsg._id = assistantMessageId;
  script.push({ t, kind: "assistant", name: "assistant_done", message: doneMsg });
  script.push({ t: t + 150, kind: "snapshot", name: "completed", isTerminal: true });
  return script;
}

export function scriptDuration(script: ScriptEvent[]) {
  return script.reduce((max, e) => Math.max(max, e.t), 0) + 200;
}

export function sendMessage(opts: {
  chatId?: string;
  inkdAgentId?: string;
  mode: "chat" | "plan" | "build";
  prompt: string;
  referencedBlogIds?: string[];
}) {
  const store = chats();
  let chat = opts.chatId ? store.find((c) => c._id === opts.chatId) : undefined;
  if (!chat) {
    const agentId = opts.inkdAgentId || findInkdAgent("inkd-agent-001")?._id || "inkd-agent-001";
    chat = {
      _id: genId("inkdchat"),
      inkdAgentId: agentId,
      title: opts.prompt.slice(0, 60) || "Untitled chat",
      createdAt: nowIso(),
      updatedAt: nowIso(),
      archivedAt: null,
    };
    store.unshift(chat);
  } else {
    chat.updatedAt = nowIso();
  }

  const byChat = messagesByChat();
  byChat[chat._id] = byChat[chat._id] ?? [];
  const userMessage = mkTextMessage(chat._id, "internalAccount", opts.prompt, null);
  byChat[chat._id].push(userMessage);

  const jobId = genId("job");
  const assistantMessageId = genId("msg");
  const eventsPath = `/internal/inkd-internal-agents/chat/${chat._id}/jobs/${jobId}/events`;
  const replyText = generateAssistantReply(opts.prompt);
  const script = buildScript(chat._id, assistantMessageId, replyText);

  const job: Job = {
    jobId,
    chatId: chat._id,
    inkdAgentId: chat.inkdAgentId,
    internalAccountId: SANDBOX_ADMIN_USER.id,
    adminMessageId: userMessage._id,
    mode: opts.mode,
    prompt: opts.prompt,
    referencedBlogIds: opts.referencedBlogIds ?? [],
    state: "queued",
    stage: "queued",
    error: null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    eventsPath,
    script,
    startedAtMs: Date.now(),
    assistantMessageId,
  };
  activeJobs()[chat._id] = job;

  return {
    delivery: {
      status: "queued" as const,
      reason: "ok",
      jobId,
      state: "queued",
      eventsPath,
      activeJobPath: `/internal/inkd-internal-agents/chat/${chat._id}/active-job`,
    },
    chat,
    userMessage,
    assistantMessage: null,
  };
}

function publicJobView(job: Job) {
  const { script: _script, startedAtMs: _startedAtMs, assistantMessageId: _assistantMessageId, ...rest } = job;
  return rest;
}

// Applies every scripted event up to `elapsedMs` to the message store, and — if the
// script has fully played out — clears the active job. Called both lazily from
// getActiveJob() (REST fallback polling) and directly by the EventSource stub once it
// finishes replaying, so both transports converge on the same end state.
export function settleJob(chatId: string, elapsedMs: number) {
  const job = activeJobs()[chatId];
  if (!job) return;
  const byChat = messagesByChat();
  byChat[chatId] = byChat[chatId] ?? [];
  const list = byChat[chatId];

  const duration = scriptDuration(job.script);
  const due = job.script.filter((e) => e.t <= elapsedMs);
  const latestSnapshot = [...due].reverse().find((e) => e.kind === "snapshot") as
    | Extract<ScriptEvent, { kind: "snapshot" }>
    | undefined;
  const latestAssistant = [...due].reverse().find((e) => e.kind === "assistant") as
    | Extract<ScriptEvent, { kind: "assistant" }>
    | undefined;

  if (latestAssistant) {
    const idx = list.findIndex((m) => m._id === latestAssistant.message._id);
    if (idx === -1) list.push(latestAssistant.message);
    else list[idx] = latestAssistant.message;
  }
  if (latestSnapshot) {
    job.stage = latestSnapshot.name;
    job.state = latestSnapshot.name;
  }

  if (elapsedMs >= duration) {
    activeJobs()[chatId] = null;
  }
}

export function getActiveJob(chatId: string) {
  const job = activeJobs()[chatId];
  if (!job) return null;
  const elapsed = Date.now() - job.startedAtMs;
  settleJob(chatId, elapsed);
  const stillActive = activeJobs()[chatId];
  return stillActive ? publicJobView(stillActive) : null;
}

export function getJobForEvents(chatId: string, jobId: string) {
  const job = activeJobs()[chatId];
  if (!job || job.jobId !== jobId) return null;
  return job;
}

export function cancelJob(chatId: string, jobId: string) {
  const job = activeJobs()[chatId];
  if (!job || job.jobId !== jobId) {
    return { outcome: "missing" as const, jobId, chatId, state: null, userMessage: null, assistantMessage: null, updatedAt: null };
  }
  const byChat = messagesByChat();
  const list = byChat[chatId] ?? [];
  const partial = list.find((m) => m._id === job.assistantMessageId);
  const cancelledMsg = mkTextMessage(
    chatId,
    "assistant",
    partial ? (partial.parts[0]?.text ?? "") : "",
    { state: "cancelled", version: 1, seq: 999 },
  );
  cancelledMsg._id = job.assistantMessageId;
  const idx = list.findIndex((m) => m._id === job.assistantMessageId);
  if (idx === -1) list.push(cancelledMsg);
  else list[idx] = cancelledMsg;
  byChat[chatId] = list;

  activeJobs()[chatId] = null;
  return {
    outcome: "cancelled" as const,
    jobId,
    chatId,
    state: "cancelled",
    userMessage: null,
    assistantMessage: cancelledMsg,
    updatedAt: nowIso(),
  };
}
