// Sandbox-only: window.EventSource patch for the INKD agent-chat SSE stream.
//
// src/hooks/use-inkd-chat.ts opens a raw EventSource against a job's `eventsPath`,
// which bypasses the axios adapter entirely (same category of problem as the Xaman
// WebSocket elsewhere in this project). This replays the same scripted event sequence
// that src/sandbox/inkd-chat-engine.ts also uses for REST fallback polling, so the
// chat hook is never touched — only the transport it happens to use is intercepted.
import { getJobForEvents, settleJob, scriptDuration } from "../inkd-chat-engine";

const JOB_EVENTS_RE = /\/internal\/inkd-internal-agents\/chat\/([^/]+)\/jobs\/([^/]+)\/events/;

type Listener = (ev: { data: string }) => void;

class SandboxChatEventSource {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 2;
  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSED = 2;

  url: string;
  readyState = 0;
  onopen: ((ev: unknown) => void) | null = null;
  onmessage: Listener | null = null;
  onerror: ((ev: unknown) => void) | null = null;

  private listeners = new Map<string, Set<Listener>>();
  private timers: ReturnType<typeof setTimeout>[] = [];

  constructor(url: string) {
    this.url = url;
    const match = url.match(JOB_EVENTS_RE);
    if (!match) {
      // Not a chat job stream — fail closed rather than silently doing nothing, so a
      // mismatched pattern is obvious in the console instead of a chat that just hangs.
      this.timers.push(setTimeout(() => this.onerror?.({}), 50));
      return;
    }
    const [, chatId, jobId] = match;
    const job = getJobForEvents(chatId, jobId);
    if (!job) {
      this.timers.push(setTimeout(() => this.onerror?.({}), 50));
      return;
    }

    this.timers.push(
      setTimeout(() => {
        this.readyState = this.OPEN;
        this.onopen?.({});
      }, 80),
    );

    const elapsedAtOpen = Date.now() - job.startedAtMs;
    job.script.forEach((event) => {
      const delay = Math.max(0, event.t - elapsedAtOpen);
      this.timers.push(
        setTimeout(() => {
          if (event.kind === "snapshot") {
            const assistantDone = job.script.find(
              (e) => e.kind === "assistant" && e.name === "assistant_done",
            ) as any;
            this.dispatch(event.name, {
              eventType: event.name,
              jobId: job.jobId,
              chatId: job.chatId,
              state: event.name,
              stage: event.name,
              isTerminal: event.isTerminal,
              error: null,
              userMessage: null,
              assistantMessage: event.isTerminal ? (assistantDone?.message ?? null) : null,
              updatedAt: new Date().toISOString(),
            });
            if (event.isTerminal) settleJob(job.chatId, scriptDuration(job.script));
          } else if (event.kind === "assistant") {
            this.dispatch(event.name, {
              type: event.name,
              jobId: job.jobId,
              chatId: job.chatId,
              message: event.message,
              error: null,
            });
          } else {
            this.dispatch("assistant_delta", {
              type: "assistant_delta",
              jobId: job.jobId,
              chatId: job.chatId,
              messageId: job.assistantMessageId,
              streamVersion: event.streamVersion,
              streamSeq: event.streamSeq,
              delta: event.delta,
              updatedAt: new Date().toISOString(),
            });
          }
        }, delay),
      );
    });
  }

  private dispatch(type: string, payload: unknown) {
    const data = JSON.stringify(payload);
    this.listeners.get(type)?.forEach((cb) => cb({ data }));
    if (type === "message") this.onmessage?.({ data });
  }

  addEventListener(type: string, cb: Listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(cb);
  }

  removeEventListener(type: string, cb: Listener) {
    this.listeners.get(type)?.delete(cb);
  }

  close() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.readyState = this.CLOSED;
  }
}

export function installEventSourceStub() {
  if (typeof window === "undefined") return;
  const RealEventSource = window.EventSource;
  window.EventSource = new Proxy(RealEventSource, {
    construct(target, args: [string, ...unknown[]]) {
      const url = String(args[0] ?? "");
      if (JOB_EVENTS_RE.test(url)) {
        return new SandboxChatEventSource(url) as unknown as EventSource;
      }
      return Reflect.construct(target, args);
    },
  });
}
