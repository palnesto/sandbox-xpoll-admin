// Sandbox stub for "wagmi". Production connects a real EVM wallet via WalletConnect;
// here every hook resolves against a fixed, already-"connected" address so the Strain
// Coin Management page's mint/burn/fund/withdraw UI can be exercised with no real wallet
// or chain. Refined per-call in pages/strain/manage.tsx once that page is wired up.
import { ReactNode } from "react";

const SANDBOX_EVM_ADDRESS = "0x1234567890AbcdEF1234567890aBcdEf12345678";

export function WagmiProvider({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

export function useAccount() {
  return { address: SANDBOX_EVM_ADDRESS, isConnected: true };
}

export function useDisconnect() {
  return { disconnect: () => {} };
}

// Mutable chain state so pause/unpause writes are reflected by the next contract read,
// the way the page's refetchInterval would pick up a real on-chain change.
let relayerPaused = false;

// Contract reads are answered per `functionName`. `owner()` must match the connected
// account: the Strain page compares the two and blocks the whole control panel behind
// an "Admin Access Required" screen when they differ.
export function useReadContract(args?: {
  functionName?: string;
  [key: string]: unknown;
}) {
  const functionName = args?.functionName;
  let data: unknown = undefined;
  if (functionName === "owner") data = SANDBOX_EVM_ADDRESS;
  else if (functionName === "paused") data = relayerPaused;
  return { data, refetch: async () => {}, isLoading: false, isError: false };
}

// The page keeps a submit button in "Processing…" until a receipt resolves, so this
// has to report a mined, successful transaction rather than an undefined result.
export function useWaitForTransactionReceipt(args?: { hash?: string }) {
  const hash = args?.hash;
  return {
    isLoading: false,
    isSuccess: Boolean(hash),
    isError: false,
    data: hash ? { status: "success" as const, transactionHash: hash } : undefined,
  };
}

export function useWriteContract() {
  return {
    writeContractAsync: async (args: { functionName?: string } = {}) => {
      await new Promise((r) => setTimeout(r, 700));
      if (args?.functionName === "pause") relayerPaused = true;
      if (args?.functionName === "unpause") relayerPaused = false;
      // Shaped like a real 32-byte tx hash so the truncated display looks right.
      const body = Array.from({ length: 64 }, () =>
        "0123456789abcdef"[Math.floor(Math.random() * 16)],
      ).join("");
      return `0x${body}`;
    },
    isPending: false,
  };
}
