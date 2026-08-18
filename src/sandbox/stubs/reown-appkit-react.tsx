// Sandbox stub for "@reown/appkit/react". Production boots a real WalletConnect modal
// and network client at module load (createAppKit) — here it's a no-op so the app never
// makes outbound WalletConnect relay/network calls just to render.
export function createAppKit(_config: unknown) {
  return {};
}

export function useAppKit() {
  return { open: () => {}, close: () => {} };
}
