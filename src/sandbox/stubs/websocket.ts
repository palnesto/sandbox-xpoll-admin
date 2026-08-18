// Sandbox-only: window.WebSocket patch for the Xaman (XRP) sign flow.
//
// components/walletconnect/xamanconnect.tsx and the Batch Transfer page both open a
// raw WebSocket to the `websocketStatus` URL returned by the create-payload call.
// Raw sockets bypass the axios adapter entirely, so without this the connect flow
// would hang forever waiting for a sign event that never arrives.
//
// Only sandbox URLs are intercepted; anything else falls through to the real
// implementation so nothing else in the app changes behaviour.

const SANDBOX_WS_PREFIX = "wss://sandbox-xaman.local/";

export function installWebSocketStub() {
  if (typeof window === "undefined" || !window.WebSocket) return;
  const RealWebSocket = window.WebSocket;

  class SandboxWebSocket {
    static readonly CONNECTING = 0;
    static readonly OPEN = 1;
    static readonly CLOSING = 2;
    static readonly CLOSED = 3;

    readonly CONNECTING = 0;
    readonly OPEN = 1;
    readonly CLOSING = 2;
    readonly CLOSED = 3;

    url: string;
    readyState = 0;
    onopen: ((ev: unknown) => void) | null = null;
    onmessage: ((ev: { data: string }) => void) | null = null;
    onerror: ((ev: unknown) => void) | null = null;
    onclose: ((ev: unknown) => void) | null = null;

    private timers: ReturnType<typeof setTimeout>[] = [];

    constructor(url: string) {
      this.url = url;
      // Open, then report a successful signature — the shape xamanconnect expects.
      this.timers.push(
        setTimeout(() => {
          this.readyState = this.OPEN;
          this.onopen?.({});
        }, 120),
      );
      this.timers.push(
        setTimeout(() => {
          this.onmessage?.({ data: JSON.stringify({ signed: true }) });
        }, 1200),
      );
    }

    send() {}

    close() {
      this.timers.forEach(clearTimeout);
      this.timers = [];
      this.readyState = this.CLOSED;
      this.onclose?.({});
    }

    addEventListener(type: string, listener: (ev: never) => void) {
      if (type === "open") this.onopen = listener as never;
      if (type === "message") this.onmessage = listener as never;
      if (type === "error") this.onerror = listener as never;
      if (type === "close") this.onclose = listener as never;
    }

    removeEventListener(type: string) {
      if (type === "open") this.onopen = null;
      if (type === "message") this.onmessage = null;
      if (type === "error") this.onerror = null;
      if (type === "close") this.onclose = null;
    }
  }

  window.WebSocket = new Proxy(RealWebSocket, {
    construct(target, args: [string, ...unknown[]]) {
      const url = String(args[0] ?? "");
      if (url.startsWith(SANDBOX_WS_PREFIX)) {
        return new SandboxWebSocket(url) as unknown as WebSocket;
      }
      return Reflect.construct(target, args);
    },
  });
}

export { SANDBOX_WS_PREFIX };
