// Sandbox-only: tiny reactive store shared between the wagmi and Reown AppKit stubs.
//
// Production wires these up via a real WalletConnect session: `useAppKit().open()`
// shows a picker, the user approves in their wallet, and `useAccount()` reactively
// flips to connected once the session lands. Splitting "connect" (Reown) from
// "read connection state" (wagmi) across two different SDKs means the sandbox stubs
// for each need to share one source of truth to reproduce that — otherwise clicking
// Connect in one stub has no way to notify the other.
const listeners = new Set<() => void>();
let connected = false;

export function getConnected() {
  return connected;
}

export function subscribeConnection(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function setConnected(next: boolean) {
  if (connected === next) return;
  connected = next;
  listeners.forEach((cb) => cb());
}

// Simulates the round trip through a wallet picker + approval prompt before the
// session comes up, so the UI shows a believable "connecting" beat instead of
// snapping straight to connected.
export function connectWithDelay(delayMs = 900) {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      setConnected(true);
      resolve();
    }, delayMs);
  });
}
