// Sandbox stub for "@reown/appkit-adapter-wagmi". The real WagmiAdapter builds a live
// wagmi config wired to WalletConnect; here it's an inert placeholder object so
// WagmiProvider (also stubbed) has something to accept as `config`.
export class WagmiAdapter {
  wagmiConfig: Record<string, never>;
  constructor(_opts: unknown) {
    this.wagmiConfig = {};
  }
}
