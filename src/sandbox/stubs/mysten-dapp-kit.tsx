// Sandbox stub for "@mysten/dapp-kit". Production connects to a real wallet-standard
// Sui wallet and issues live RPC calls; here every hook resolves against a fixed,
// already-"connected" address (matching VITE_ADMIN_SUI_ADDRESS, which admin-only flows
// validate against) so approval/transfer UI can be exercised with no real wallet.
import { ReactNode } from "react";

const SANDBOX_SUI_ADDRESS =
  (import.meta.env.VITE_ADMIN_SUI_ADDRESS as string) ||
  "0xc124c5807d310220ee63c059895aa2f4b3523eb6e410c39497ad91053d12fd6";

export function SuiClientProvider({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

export function WalletProvider({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

export function useWallets() {
  return [{ name: "Sandbox Sui Wallet", icon: "" }];
}

// suiconnect.tsx destructures `mutateAsync` from both of these, so exposing only
// `mutate` would make it call undefined and surface a "not a function" error card.
export function useConnectWallet() {
  return {
    mutate: (_args: unknown, opts?: { onSuccess?: () => void }) => {
      opts?.onSuccess?.();
    },
    mutateAsync: async (_args: unknown) => {
      await new Promise((r) => setTimeout(r, 250));
      return { accounts: [{ address: SANDBOX_SUI_ADDRESS }] };
    },
  };
}

export function useDisconnectWallet() {
  return {
    mutate: () => {},
    mutateAsync: async () => {
      await new Promise((r) => setTimeout(r, 150));
    },
  };
}

export function useCurrentAccount() {
  return { address: SANDBOX_SUI_ADDRESS };
}

export function useSuiClient() {
  return {
    getBalance: async (_args: { owner: string; coinType: string }) => ({
      // The page's ensureSuiFunds() sums the whole batch plus per-transfer gas before
      // it will proceed, so this has to comfortably exceed the seeded sell intents
      // (~575 SUI) or a full "Transfer all SUI" run aborts as underfunded.
      totalBalance: String(1_000_000n * 1_000_000_000n), // 1,000,000 SUI in mist
    }),
  };
}

export function useSignAndExecuteTransaction() {
  return {
    mutateAsync: async (_args: { transaction: unknown }) => {
      await new Promise((r) => setTimeout(r, 700));
      return {
        digest: `SANDBOXSUI${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
      };
    },
  };
}
