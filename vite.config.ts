import react from "@vitejs/plugin-react-swc";
import path from "node:path";
import { defineConfig, loadEnv, ConfigEnv } from "vite";
import Pages from "vite-plugin-pages";

export default defineConfig(({ mode }: ConfigEnv) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  return {
    plugins: [react(), Pages()],
    resolve: {
      alias: [
        { find: "@", replacement: path.resolve(__dirname, "./src") },
        // sandbox: redirect web3/wallet SDK entry points to local stubs so the app
        // never opens real wallet/RPC/WalletConnect connections. Exact-match regexes
        // so subpath imports (e.g. "@mysten/dapp-kit/dist/index.css") stay untouched.
        {
          find: /^@mysten\/dapp-kit$/,
          replacement: path.resolve(__dirname, "./src/sandbox/stubs/mysten-dapp-kit.tsx"),
        },
        {
          find: /^wagmi$/,
          replacement: path.resolve(__dirname, "./src/sandbox/stubs/wagmi.tsx"),
        },
        {
          find: /^@reown\/appkit\/react$/,
          replacement: path.resolve(__dirname, "./src/sandbox/stubs/reown-appkit-react.tsx"),
        },
        {
          find: /^@reown\/appkit-adapter-wagmi$/,
          replacement: path.resolve(__dirname, "./src/sandbox/stubs/reown-appkit-adapter-wagmi.ts"),
        },
      ],
    },
    build: {
      outDir: "dist", // or set to "/app/dist"
    },
    server:
      env.VITE_MODE === "development" || env.VITE_MODE === "local"
        ? {
            proxy: {
              "/api": env.VITE_BACKEND_URL,
            },
            port: 5174,
          }
        : undefined,
  };
});
