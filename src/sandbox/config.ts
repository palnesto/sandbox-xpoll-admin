// Sandbox-only: fixed demo credentials and small feature flags.
// Production auth (real /public/admin/login + cookie session) is bypassed entirely
// by src/sandbox/mock-api.ts, which checks requests against these values.
export const SANDBOX_CREDENTIALS = {
  email: "admin@xpoll.ai",
  password: "Xpoll@2026",
};

export const SANDBOX_ADMIN_USER = {
  id: "admin-000000000000000000000001",
  email: SANDBOX_CREDENTIALS.email,
  isSuperAdmin: true,
  name: "Admin",
  highestLevel: 10,
};

// Simulated network latency so loading/skeleton states remain visible, like the real API.
export const SANDBOX_LATENCY_MS = 350;
