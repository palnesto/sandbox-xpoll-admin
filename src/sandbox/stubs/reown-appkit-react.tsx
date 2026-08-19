// Sandbox stub for "@reown/appkit/react". Production boots a real WalletConnect modal
// and network client at module load (createAppKit) — here it's a no-op so the app never
// makes outbound WalletConnect relay/network calls just to render.
import { connectWithDelay } from "./wallet-connection-state";

export function createAppKit(_config: unknown) {
  return {};
}

// Real `open()` shows a wallet picker and resolves once the user approves in their
// wallet. There's no modal here to click through, so `open()` just plays out that same
// "picking → approving → connected" beat on a timer, updating the shared connection
// state that the wagmi stub's useAccount() reads. `close()` (used for the already-
// connected "Manage Wallet" button) is a no-op, same as closing a real AppKit modal
// without disconnecting.
export function useAppKit() {
  return {
    open: () => {
      void connectWithDelay();
    },
    close: () => {},
  };
}
