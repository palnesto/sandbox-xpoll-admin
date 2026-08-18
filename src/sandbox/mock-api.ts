// Sandbox-only: a custom axios adapter that stands in for the real backend.
// api/queryClient.ts passes this as `adapter` on the shared axios instance, so every
// hook (useApiQuery/useApiMutation/useApiInfiniteQuery) keeps calling apiInstance
// exactly as before — nothing outside this folder knows requests never leave the browser.
//
// Routes are registered with route(method, pattern, handler) below, grouped by page/
// feature as the sandbox is built out page-by-page. `:param` segments in a pattern
// capture into ctx.params; query string (from either the URL or axios `params`) lands
// in ctx.query.
import axios, {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { endpoints } from "@/api/endpoints";
import { hasSession, startSession, endSession } from "./session";
import {
  SANDBOX_ADMIN_USER,
  SANDBOX_CREDENTIALS,
  SANDBOX_LATENCY_MS,
} from "./config";
import * as fx from "./fixtures";
import { getCollection } from "./state";
import "./fetch-stub"; // side-effect: patches window.fetch for the raw-fetch image upload flow
import { installWebSocketStub, SANDBOX_WS_PREFIX } from "./stubs/websocket";
import { installEventSourceStub } from "./stubs/eventsource";
import * as inkdChat from "./inkd-chat-engine";

// The Xaman sign flow listens on a raw WebSocket, which the axios adapter cannot see.
installWebSocketStub();
// The INKD agent-chat feature streams over a raw EventSource, same problem.
installEventSourceStub();

function delay(ms: number = SANDBOX_LATENCY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseBody(config: AxiosRequestConfig): any {
  const data = config.data;
  if (data === undefined || data === null) return {};
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }
  return data;
}

function resolveRequest(config: AxiosRequestConfig) {
  const rawUrl = config.url || "";
  let pathname = rawUrl;
  let search = "";
  if (/^https?:\/\//i.test(rawUrl)) {
    const u = new URL(rawUrl);
    pathname = u.pathname;
    search = u.search;
  } else {
    const [p, q] = rawUrl.split("?");
    pathname = p;
    search = q ? `?${q}` : "";
  }
  const query = new URLSearchParams(search);
  if (config.params && typeof config.params === "object") {
    Object.entries(config.params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") query.set(k, String(v));
    });
  }
  return { pathname, query };
}

// Compiles "/internal/poll/:id" into a regex + the ordered param names it captures.
function compile(pattern: string) {
  const paramNames: string[] = [];
  const regexStr =
    "^" +
    pattern
      .replace(/\/+$/, "")
      .split("/")
      .map((seg) => {
        if (seg.startsWith(":")) {
          paramNames.push(seg.slice(1));
          return "([^/]+)";
        }
        return seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      })
      .join("/") +
    "/?$";
  return { regex: new RegExp(regexStr), paramNames };
}

export type SandboxCtx = {
  params: Record<string, string>;
  query: URLSearchParams;
  body: any;
  config: AxiosRequestConfig;
};

export type SandboxResult = { status?: number; data: any };
type Handler = (ctx: SandboxCtx) => SandboxResult | Promise<SandboxResult>;

type Route = {
  method: string;
  regex: RegExp;
  paramNames: string[];
  handler: Handler;
};

const routes: Route[] = [];

// Registers a mock route. Later routes never shadow earlier ones silently — duplicate
// (method, pattern) registrations throw at import time so a copy/paste mistake is loud.
function route(method: string, pattern: string, handler: Handler) {
  const { regex, paramNames } = compile(pattern);
  const upper = method.toUpperCase();
  if (routes.some((r) => r.method === upper && r.regex.source === regex.source)) {
    throw new Error(`[sandbox] duplicate mock route: ${upper} ${pattern}`);
  }
  routes.push({ method: upper, regex, paramNames, handler });
}

function buildResponse(
  config: AxiosRequestConfig,
  status: number,
  data: any,
): AxiosResponse {
  return {
    data,
    status,
    statusText: status < 400 ? "OK" : "Error",
    headers: {},
    config: config as InternalAxiosRequestConfig,
    request: {},
  };
}

export function sandboxError(
  config: AxiosRequestConfig,
  status: number,
  data: any,
  message?: string,
) {
  const response = buildResponse(config, status, data);
  return new AxiosError(
    message || data?.message || "Request failed",
    String(status),
    config as InternalAxiosRequestConfig,
    {},
    response,
  );
}

// ============================= AUTH ROUTES =============================

route("POST", endpoints.adminLogin, async ({ body, config }) => {
  await delay();
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");
  if (
    email === SANDBOX_CREDENTIALS.email.toLowerCase() &&
    password === SANDBOX_CREDENTIALS.password
  ) {
    startSession();
    return { status: 200, data: { success: true, data: { isSuperAdmin: true } } };
  }
  throw sandboxError(config, 401, {
    success: false,
    message: "Invalid email or password",
  });
});

route("POST", endpoints.adminLogout, async () => {
  await delay(150);
  endSession();
  return { status: 200, data: { success: true, data: null } };
});

route("GET", endpoints.adminMe, async ({ config }) => {
  await delay(150);
  if (!hasSession()) {
    throw sandboxError(config, 401, { success: false, message: "Not authenticated" });
  }
  return { status: 200, data: { success: true, data: SANDBOX_ADMIN_USER } };
});

// ============================= DASHBOARD ROUTES =============================

route("GET", endpoints.assets.totalSupply, async () => {
  await delay();
  return { status: 200, data: { success: true, data: fx.totalSupply } };
});

route("GET", endpoints.entities.polls.overallPollStats, async () => {
  await delay();
  return { status: 200, data: { success: true, data: fx.overallPollStats } };
});

// Shared pagination helper: returns the nested {entries, meta} shape every
// advancedListing / infinite-select endpoint in this app expects.
function paginate<T>(items: T[], page: number, pageSize: number) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    entries: items.slice(start, start + pageSize),
    meta: { total, page: safePage, pageSize, totalPages },
  };
}

function intParam(query: URLSearchParams, key: string, fallback: number) {
  const raw = query.get(key);
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

// ============================= REFERENCE DATA (location selects) =============================

function locationRoute(pattern: string, source: Record<string, unknown>[]) {
  route("GET", pattern, async ({ query }) => {
    await delay(150);
    const q = (query.get("q") || "").trim().toLowerCase();
    const page = intParam(query, "page", 1);
    const pageSize = intParam(query, "pageSize", 50);
    const filtered = q
      ? source.filter((item) => String(item.name).toLowerCase().includes(q))
      : source;
    return { status: 200, data: { success: true, data: paginate(filtered, page, pageSize) } };
  });
}

locationRoute("/common/location/countries", fx.countries);
locationRoute("/common/location/states", fx.states);
locationRoute("/common/location/cities", fx.cities);

// Full poll/trial detail objects (view+edit pages) are richer than the listing row and
// are edited in place (title, options, rewards, ...), so they're cached separately —
// lazily built from the listing row on first access, then mutated directly by
// subsequent PUT/PATCH/POST handlers below.
function getPollDetail(id: string): any {
  const store = getCollection<Record<string, any>>("pollDetails", () => ({}));
  if (!store[id]) {
    const row = getCollection("polls", () => fx.polls).find((p) => p._id === id);
    if (!row) return null;
    store[id] = fx.buildFullPoll(row as any);
  }
  return store[id];
}

function getTrialDetail(id: string): any {
  const store = getCollection<Record<string, any>>("trialDetails", () => ({}));
  if (!store[id]) {
    const row = getCollection("trials", () => fx.trials).find((t) => t._id === id);
    if (!row) return null;
    store[id] = fx.buildFullTrial(row as any);
  }
  return store[id];
}

// ============================= TRIALS (analytics listing) =============================

route("GET", endpoints.entities.trials.advancedListing, async ({ query }) => {
  await delay();
  const all = getCollection("trials", () => fx.trials);
  const page = intParam(query, "page", 1);
  const pageSize = intParam(query, "pageSize", 10);
  const title = (query.get("title") || "").trim().toLowerCase();
  const expiredParam = query.get("expired");
  const sortedByHighestResponses = query.get("sortedByHighestResponses");

  let filtered = all as typeof fx.trials;
  if (title) {
    filtered = filtered.filter((t) => t.title.toLowerCase().includes(title));
  }
  if (expiredParam === "true" || expiredParam === "false") {
    const wantExpired = expiredParam === "true";
    const now = Date.now();
    filtered = filtered.filter((t) => {
      const isExpired = !!t.expireRewardAt && new Date(t.expireRewardAt).getTime() < now;
      return isExpired === wantExpired;
    });
  }
  if (sortedByHighestResponses) {
    filtered = [...filtered].sort((a, b) => (b.responsesCount ?? 0) - (a.responsesCount ?? 0));
  }

  return { status: 200, data: { success: true, data: paginate(filtered, page, pageSize) } };
});

route("DELETE", endpoints.entities.trials.delete, async ({ body }) => {
  await delay(300);
  const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];
  const all = getCollection("trials", () => fx.trials);
  const remaining = all.filter((t) => !ids.includes(t._id));
  all.length = 0;
  all.push(...remaining);
  return { status: 200, data: { success: true, data: null } };
});

// ============================= POLLS (analytics listing + detail) =============================

route("GET", endpoints.entities.polls.advancedListing, async ({ query }) => {
  await delay();
  const all = getCollection("polls", () => fx.polls);
  const page = intParam(query, "page", 1);
  const pageSize = intParam(query, "pageSize", 10);
  const title = (query.get("title") || "").trim().toLowerCase();
  const expiredParam = query.get("expired");
  const sortedByHighestVotes = query.get("sortedByHighestVotes");

  let filtered = all as typeof fx.polls;
  if (title) {
    filtered = filtered.filter((p) => p.title.toLowerCase().includes(title));
  }
  if (expiredParam === "true" || expiredParam === "false") {
    const wantExpired = expiredParam === "true";
    const now = Date.now();
    filtered = filtered.filter((p) => {
      const isExpired = !!p.expireRewardAt && new Date(p.expireRewardAt).getTime() < now;
      return isExpired === wantExpired;
    });
  }
  if (sortedByHighestVotes) {
    filtered = [...filtered].sort((a, b) => (b.voteCount ?? 0) - (a.voteCount ?? 0));
  }

  return { status: 200, data: { success: true, data: paginate(filtered, page, pageSize) } };
});

route("DELETE", endpoints.entities.polls.delete, async ({ body }) => {
  await delay(300);
  const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];
  const all = getCollection("polls", () => fx.polls);
  const remaining = all.filter((p) => !ids.includes(p._id));
  all.length = 0;
  all.push(...remaining);
  return { status: 200, data: { success: true, data: null } };
});

route("GET", endpoints.entities.polls.getdetailsById(":id"), async ({ params, config }) => {
  await delay();
  const all = getCollection("polls", () => fx.polls);
  const poll = all.find((p) => p._id === params.id);
  if (!poll) {
    throw sandboxError(config, 404, { success: false, message: "Poll not found" });
  }
  return { status: 200, data: { success: true, data: fx.buildPollAnalytics(poll) } };
});

// Plain CRUD listing at /polls (distinct from the analytics advanced-listing page) —
// reads {entries} off the payload and passes the whole envelope to PaginatedTable for
// total/page/pageSize/totalPages, so each row needs full detail fields, not just the
// trimmed listing shape.
route("GET", endpoints.entities.polls.all, async ({ query }) => {
  await delay();
  const page = intParam(query, "page", 1);
  const pageSize = intParam(query, "pageSize", 18);
  const rows = (getCollection("polls", () => fx.polls) as any[]).map((p) => getPollDetail(p._id));
  const { entries, meta } = paginate(rows, page, pageSize);
  return {
    status: 200,
    data: {
      success: true,
      data: { entries, total: meta.total, page: meta.page, pageSize: meta.pageSize, totalPages: meta.totalPages },
    },
  };
});

route("GET", endpoints.entities.polls.getById(":id"), async ({ params, config }) => {
  await delay();
  const detail = getPollDetail(params.id);
  if (!detail) throw sandboxError(config, 404, { success: false, message: "Poll not found" });
  return { status: 200, data: { success: true, data: detail } };
});

route("POST", endpoints.entities.polls.create, async ({ body }) => {
  await delay(400);
  const id = `poll-new-${Date.now().toString(36)}`;
  const options = Array.isArray(body?.options) && body.options.length
    ? body.options
    : [{ text: "Option A" }, { text: "Option B" }];
  const row = {
    _id: id,
    title: body?.title || "Untitled poll",
    externalAuthor: false,
    expireRewardAt: body?.expireRewardAt ?? null,
    viewCount: 0,
    voteCount: 0,
    optionTexts: options.map((o: any) => o.text),
  };
  getCollection("polls", () => fx.polls).unshift(row as any);
  const detailStore = getCollection<Record<string, any>>("pollDetails", () => ({}));
  detailStore[id] = {
    _id: id,
    pollId: id,
    title: row.title,
    description: body?.description || "",
    createdAt: new Date().toISOString(),
    archivedAt: null,
    resourceAssets: body?.resourceAssets ?? [],
    media: undefined,
    rewards: body?.rewards ?? [],
    expireRewardAt: body?.expireRewardAt ?? null,
    options: options.map((o: any, i: number) => ({ _id: `${id}-opt-${i}`, text: o.text, archivedAt: null })),
    targetGeo: body?.targetGeo ?? { countries: [], states: [], cities: [] },
    trialId: undefined,
    trial: undefined,
    externalAuthor: false,
    externalAuthorInfo: undefined,
    viewCount: 0,
    voteCount: 0,
  };
  return { status: 200, data: { success: true, data: null } };
});

route("PUT", endpoints.entities.polls.edit.details, async ({ body, config }) => {
  await delay(300);
  const id = body?.pollId;
  const detail = getPollDetail(id);
  if (!detail) throw sandboxError(config, 404, { success: false, message: "Poll not found" });
  Object.assign(detail, body);
  delete detail.pollId;
  detail._id = id;
  detail.pollId = id;
  const row = getCollection("polls", () => fx.polls).find((p) => p._id === id) as any;
  if (row) {
    if (body?.title !== undefined) row.title = body.title;
    if (body?.expireRewardAt !== undefined) row.expireRewardAt = body.expireRewardAt;
  }
  return { status: 200, data: { success: true, data: null } };
});

route("POST", endpoints.entities.polls.edit.addOption, async ({ body, config }) => {
  await delay(200);
  const detail = getPollDetail(body?.pollId);
  if (!detail) throw sandboxError(config, 404, { success: false, message: "Poll not found" });
  detail.options = detail.options ?? [];
  detail.options.push({ _id: `${body.pollId}-opt-${Date.now().toString(36)}`, text: body?.text ?? "", archivedAt: null });
  return { status: 200, data: { success: true, data: null } };
});

route("PUT", endpoints.entities.polls.edit.editOption, async ({ body, config }) => {
  await delay(200);
  const detail = getPollDetail(body?.pollId);
  if (!detail) throw sandboxError(config, 404, { success: false, message: "Poll not found" });
  const opt = (detail.options ?? []).find((o: any) => o._id === body?.optionId);
  if (opt) opt.text = body?.text ?? opt.text;
  return { status: 200, data: { success: true, data: null } };
});

route("PATCH", endpoints.entities.polls.edit.toggleArchiveOption, async ({ body, config }) => {
  await delay(200);
  const detail = getPollDetail(body?.pollId);
  if (!detail) throw sandboxError(config, 404, { success: false, message: "Poll not found" });
  const opt = (detail.options ?? []).find((o: any) => o._id === body?.optionId);
  const archivedAt = body?.archived ? new Date().toISOString() : null;
  if (opt) opt.archivedAt = archivedAt;
  return { status: 200, data: { success: true, data: { option: { archivedAt } } } };
});

route("GET", endpoints.entities.polls.getPollsByTrialId(":id"), async ({ params }) => {
  await delay();
  const all = getCollection("polls", () => fx.polls) as any[];
  // TrialPollTable renders title/description/createdAt, which only exist on the full
  // detail object — resolve through it so no column renders blank.
  const entries = all
    .filter((p) => p.trialId === params.id)
    .map((p) => getPollDetail(p._id) ?? p);
  return {
    status: 200,
    data: { success: true, data: { entries, total: entries.length, page: 1, pageSize: entries.length || 1, totalPages: 1 } },
  };
});

// ============================= TRIAL DETAIL (view/edit/create) =============================

// Plain CRUD listing at /trials (distinct from the analytics advanced-listing page).
route("GET", endpoints.entities.trials.all, async ({ query }) => {
  await delay();
  const page = intParam(query, "page", 1);
  const pageSize = intParam(query, "pageSize", 18);
  const rows = (getCollection("trials", () => fx.trials) as any[]).map((t) => getTrialDetail(t._id));
  const { entries, meta } = paginate(rows, page, pageSize);
  return {
    status: 200,
    data: {
      success: true,
      data: { entries, total: meta.total, page: meta.page, pageSize: meta.pageSize, totalPages: meta.totalPages },
    },
  };
});

route("GET", endpoints.entities.trials.getById(":id"), async ({ params, config }) => {
  await delay();
  const detail = getTrialDetail(params.id);
  if (!detail) throw sandboxError(config, 404, { success: false, message: "Trial not found" });
  return { status: 200, data: { success: true, data: detail } };
});

route("PUT", endpoints.entities.trials.update, async ({ body, config }) => {
  await delay(300);
  const id = body?.trialId;
  const detail = getTrialDetail(id);
  if (!detail) throw sandboxError(config, 404, { success: false, message: "Trial not found" });
  Object.assign(detail, body);
  detail._id = id;
  const row = getCollection("trials", () => fx.trials).find((t) => t._id === id) as any;
  if (row) {
    if (body?.title !== undefined) row.title = body.title;
    if (body?.expireRewardAt !== undefined) row.expireRewardAt = body.expireRewardAt;
  }
  return { status: 200, data: { success: true, data: null } };
});

route("POST", endpoints.entities.trials.create, async ({ body }) => {
  await delay(400);
  const trialId = `trial-new-${Date.now().toString(36)}`;
  const trialIn = body?.trial ?? {};
  const trialRow = {
    _id: trialId,
    title: trialIn.title || "Untitled trial",
    viewCount: 0,
    responsesCount: 0,
    expireRewardAt: trialIn.expireRewardAt ?? null,
  };
  getCollection("trials", () => fx.trials).unshift(trialRow as any);
  const trialDetailStore = getCollection<Record<string, any>>("trialDetails", () => ({}));
  trialDetailStore[trialId] = {
    _id: trialId,
    title: trialRow.title,
    description: trialIn.description || "",
    createdAt: new Date().toISOString(),
    archivedAt: null,
    resourceAssets: trialIn.resourceAssets ?? [],
    media: undefined,
    rewards: trialIn.rewards ?? [],
    expireRewardAt: trialIn.expireRewardAt ?? null,
    targetGeo: trialIn.targetGeo ?? { countries: [], states: [], cities: [] },
    viewCount: 0,
    responsesCount: 0,
  };

  const pollsIn = Array.isArray(body?.polls) ? body.polls : [];
  const pollsCollection = getCollection("polls", () => fx.polls);
  const pollDetailStore = getCollection<Record<string, any>>("pollDetails", () => ({}));
  pollsIn.forEach((p: any, i: number) => {
    const pollId = `${trialId}-poll-${i}`;
    const options = Array.isArray(p.options) && p.options.length ? p.options : [{ text: "Option A" }, { text: "Option B" }];
    pollsCollection.unshift({
      _id: pollId,
      title: p.title || "Untitled poll",
      externalAuthor: false,
      expireRewardAt: trialIn.expireRewardAt ?? null,
      viewCount: 0,
      voteCount: 0,
      optionTexts: options.map((o: any) => o.text),
      trialId,
    } as any);
    pollDetailStore[pollId] = {
      _id: pollId,
      pollId,
      title: p.title || "Untitled poll",
      description: p.description || "",
      createdAt: new Date().toISOString(),
      archivedAt: null,
      resourceAssets: p.resourceAssets ?? [],
      media: undefined,
      rewards: [],
      expireRewardAt: trialIn.expireRewardAt ?? null,
      options: options.map((o: any, oi: number) => ({ _id: `${pollId}-opt-${oi}`, text: o.text, archivedAt: null })),
      targetGeo: trialIn.targetGeo ?? { countries: [], states: [], cities: [] },
      trialId,
      trial: { _id: trialId, title: trialRow.title },
      externalAuthor: false,
      externalAuthorInfo: undefined,
      viewCount: 0,
      voteCount: 0,
    };
  });

  return { status: 200, data: { success: true, data: null } };
});

// ============================= REFERRAL ANALYTICS + LINKS =============================

route("GET", endpoints.referral.analytics.entity(":id"), async ({ params }) => {
  await delay();
  const id = params.id;
  let views = 5000;
  let uniques = 1600;
  if (id.startsWith("poll")) {
    const p = getCollection("polls", () => fx.polls).find((x) => x._id === id) as any;
    if (p) { views = p.viewCount ?? views; uniques = Math.round((p.voteCount ?? uniques) * 0.6); }
  } else {
    const t = getCollection("trials", () => fx.trials).find((x) => x._id === id) as any;
    if (t) { views = t.viewCount ?? views; uniques = Math.round((t.responsesCount ?? uniques) * 0.6); }
  }
  return { status: 200, data: { success: true, data: fx.buildEntityReferralAnalytics(id, views, uniques) } };
});

route("GET", endpoints.referral.listing, async ({ query }) => {
  await delay();
  const page = intParam(query, "page", 1);
  const pageSize = intParam(query, "pageSize", 100);
  const sortBy = query.get("sortBy");
  const sortDir = query.get("sortDir") || "desc";
  const sharerId = query.get("sharerExternalAccountIds");

  let rows: any[];
  if (sharerId) {
    // pages/users/[userId]/[refferalLink].tsx — links SHARED by one user, no kind/entityId sent
    const user = fx.externalUsers.find((u) => u._id === sharerId);
    rows = getCollection(`referral-by-sharer:${sharerId}`, () =>
      user ? fx.generateSharerReferralRows(user) : [],
    );
  } else {
    const kind = (query.get("kind") as "poll" | "trial") || "poll";
    const entityId = query.get("entityId") || "";
    rows = getCollection(`referral:${kind}:${entityId}`, () => fx.generateReferralRows(kind, entityId));
  }

  let sorted = rows;
  if (sortBy === "views") {
    sorted = [...rows].sort((a, b) => (sortDir === "asc" ? a.counts.views - b.counts.views : b.counts.views - a.counts.views));
  }
  const { entries, meta } = paginate(sorted, page, pageSize);
  return {
    status: 200,
    data: { success: true, data: { page: meta.page, pageSize: meta.pageSize, total: meta.total, totalPages: meta.totalPages, items: entries } },
  };
});

// ============================= EXTERNAL USERS =============================

// Two different consumers hit this one endpoint with different envelope expectations:
// pages/users/index.tsx reads a flat `items` array, while ExternalAccountSelect goes
// through useApiInfiniteQuery and reads `entries` + `meta`. Serving both keys off the
// same payload satisfies each without touching either caller.
route("GET", endpoints.users.all, async ({ query }) => {
  await delay();
  const page = intParam(query, "page", 1);
  const pageSize = intParam(query, "pageSize", 20);
  const term = (query.get("q") || query.get("username") || query.get("googleEmail") || "")
    .trim()
    .toLowerCase();
  let rows = fx.externalUsers as any[];
  if (term) {
    rows = rows.filter(
      (u) =>
        u._id.toLowerCase().includes(term) ||
        u.username.toLowerCase().includes(term) ||
        String(u.googleEmail ?? "").toLowerCase().includes(term),
    );
  }
  const shaped = rows.map((u) => ({
    _id: u._id,
    externalAccountId: u._id,
    username: u.username,
    name: u.username.replace("_", " "),
    email: u.googleEmail ?? `${u.username}@xpoll.ai`,
    googleEmail: u.googleEmail,
    title: u.username,
    label: u.username,
  }));
  const { entries, meta } = paginate(shaped, page, pageSize);
  return {
    status: 200,
    data: {
      success: true,
      data: {
        page: meta.page,
        pageSize: meta.pageSize,
        total: meta.total,
        totalPages: meta.totalPages,
        items: entries,
        entries,
        meta,
      },
    },
  };
});

// ============================= INDUSTRIES =============================

function industryListingHandler() {
  return async ({ query }: SandboxCtx): Promise<SandboxResult> => {
    await delay();
    const page = intParam(query, "page", 1);
    const pageSize = intParam(query, "pageSize", 10);
    const includeArchived = query.get("includeArchived") === "true";
    const name = (query.get("name") || "").trim().toLowerCase();
    const description = (query.get("description") || "").trim().toLowerCase();
    const excludeIds = (query.get("excludeIds") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    let rows = getCollection("industries", () => fx.industries) as any[];
    if (!includeArchived) rows = rows.filter((i) => i.archivedAt == null);
    if (name) rows = rows.filter((i) => i.name.toLowerCase().includes(name));
    if (description) {
      rows = rows.filter((i) => String(i.description ?? "").toLowerCase().includes(description));
    }
    if (excludeIds.length) rows = rows.filter((i) => !excludeIds.includes(i._id));

    const { entries, meta } = paginate(rows, page, pageSize);
    // Listing page reads {entries,total}; IndustryInfiniteSelect reads entries+meta.
    return { status: 200, data: { success: true, data: { entries, total: meta.total, meta } } };
  };
}

route("GET", endpoints.entities.industry.advancedListing, industryListingHandler());
route("GET", endpoints.entities.industry.commonAdvancedListing, industryListingHandler());

route("GET", endpoints.entities.industry.getById({ industryId: ":id" }, {}), async ({ params, config }) => {
  await delay();
  const row = (getCollection("industries", () => fx.industries) as any[]).find(
    (i) => i._id === params.id,
  );
  if (!row) throw sandboxError(config, 404, { success: false, message: "Industry not found" });
  return { status: 200, data: { success: true, data: row } };
});

route("POST", endpoints.entities.industry.create, async ({ body, config }) => {
  await delay(300);
  const name = String(body?.name ?? "").trim();
  const rows = getCollection("industries", () => fx.industries) as any[];
  if (rows.some((i) => i.name.toLowerCase() === name.toLowerCase())) {
    // create.tsx special-cases a message containing "already exists" into a field error.
    throw sandboxError(config, 409, {
      success: false,
      message: "An industry with this name already exists",
    });
  }
  const nowIso = new Date().toISOString();
  const row = {
    _id: `industry-new-${Date.now().toString(36)}`,
    name: name || "Untitled industry",
    description: body?.description ?? null,
    archivedAt: null,
    createdAt: nowIso,
    updatedAt: nowIso,
    internalAuthor: null,
  };
  rows.unshift(row);
  // create.tsx reads data.data._id off the mutation body to redirect to the new record.
  return { status: 200, data: { success: true, data: row } };
});

route("PATCH", endpoints.entities.industry.edit(":id"), async ({ params, body, config }) => {
  await delay(300);
  const row = (getCollection("industries", () => fx.industries) as any[]).find(
    (i) => i._id === params.id,
  );
  if (!row) throw sandboxError(config, 404, { success: false, message: "Industry not found" });
  if (body?.name !== undefined) row.name = body.name;
  if (body?.description !== undefined) row.description = body.description;
  row.updatedAt = new Date().toISOString();
  return { status: 200, data: { success: true, data: row } };
});

route("DELETE", endpoints.entities.industry.delete(":id"), async ({ params, config }) => {
  await delay(300);
  const row = (getCollection("industries", () => fx.industries) as any[]).find(
    (i) => i._id === params.id,
  );
  if (!row) throw sandboxError(config, 404, { success: false, message: "Industry not found" });
  // "Delete" is an archive in this product — the row stays but drops out of active lists.
  row.archivedAt = new Date().toISOString();
  row.updatedAt = row.archivedAt;
  return { status: 200, data: { success: true, data: null } };
});

// ============================= AD OWNERS =============================

route("GET", endpoints.entities.ad.adOwners.advancedListing, async ({ query }) => {
  await delay();
  const page = intParam(query, "page", 1);
  const pageSize = intParam(query, "pageSize", 10);
  const includeArchived = query.get("includeArchived") === "true";
  const name = (query.get("name") || "").trim().toLowerCase();
  const description = (query.get("description") || "").trim().toLowerCase();
  const excludeIds = (query.get("excludeIds") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  let rows = getCollection("adOwners", () => fx.adOwners) as any[];
  if (!includeArchived) rows = rows.filter((o) => o.archivedAt == null);
  if (name) rows = rows.filter((o) => o.name.toLowerCase().includes(name));
  if (description) {
    rows = rows.filter((o) => String(o.description ?? "").toLowerCase().includes(description));
  }
  if (excludeIds.length) rows = rows.filter((o) => !excludeIds.includes(o._id));

  const { entries, meta } = paginate(rows, page, pageSize);
  // Listing reads {entries,total}; AdOwnerInfiniteSelect reads entries+meta.
  return { status: 200, data: { success: true, data: { entries, total: meta.total, meta } } };
});

route("GET", endpoints.entities.ad.adOwners.getById({ adOwnerId: ":id" }, {}), async ({ params, config }) => {
  await delay();
  const row = (getCollection("adOwners", () => fx.adOwners) as any[]).find(
    (o) => o._id === params.id,
  );
  if (!row) throw sandboxError(config, 404, { success: false, message: "Ad owner not found" });
  return { status: 200, data: { success: true, data: row } };
});

route("POST", endpoints.entities.ad.adOwners.create, async ({ body, config }) => {
  await delay(300);
  const name = String(body?.name ?? "").trim();
  const rows = getCollection("adOwners", () => fx.adOwners) as any[];
  if (rows.some((o) => o.name.toLowerCase() === name.toLowerCase())) {
    throw sandboxError(config, 409, {
      success: false,
      message: "An ad owner with this name already exists",
    });
  }
  const nowIso = new Date().toISOString();
  const row = {
    _id: `adowner-new-${Date.now().toString(36)}`,
    name: name || "Untitled owner",
    description: body?.description ?? null,
    archivedAt: null,
    createdAt: nowIso,
    updatedAt: nowIso,
    internalAuthor: null,
  };
  rows.unshift(row);
  // create.tsx reads data.data._id to redirect to the new owner.
  return { status: 200, data: { success: true, data: row } };
});

route("PATCH", endpoints.entities.ad.adOwners.edit(":id"), async ({ params, body, config }) => {
  await delay(300);
  const row = (getCollection("adOwners", () => fx.adOwners) as any[]).find(
    (o) => o._id === params.id,
  );
  if (!row) throw sandboxError(config, 404, { success: false, message: "Ad owner not found" });
  if (body?.name !== undefined) row.name = body.name;
  if (body?.description !== undefined) row.description = body.description;
  row.updatedAt = new Date().toISOString();
  return { status: 200, data: { success: true, data: row } };
});

route("DELETE", endpoints.entities.ad.adOwners.delete(":id"), async ({ params, config }) => {
  await delay(300);
  const row = (getCollection("adOwners", () => fx.adOwners) as any[]).find(
    (o) => o._id === params.id,
  );
  if (!row) throw sandboxError(config, 404, { success: false, message: "Ad owner not found" });
  row.archivedAt = new Date().toISOString();
  row.updatedAt = row.archivedAt;
  return { status: 200, data: { success: true, data: null } };
});

// ============================= ADS =============================

function adSeeds() {
  return getCollection("ads", () => fx.ads) as (typeof fx.ads)[number][];
}

route("GET", endpoints.entities.ad.ad.advancedListing, async ({ query }) => {
  await delay();
  const page = intParam(query, "page", 1);
  const pageSize = intParam(query, "pageSize", 10);
  const includeArchived = query.get("includeArchived") === "true";
  const title = (query.get("title") || "").trim().toLowerCase();
  const description = (query.get("description") || "").trim().toLowerCase();
  const status = query.get("status");
  const adOwnerId = query.get("adOwnerId") || query.get("adOwner");
  const industryIds = (query.get("industryIds") || "").split(",").map((s) => s.trim()).filter(Boolean);
  const excludeIds = (query.get("excludeIds") || "").split(",").map((s) => s.trim()).filter(Boolean);

  let rows = adSeeds();
  if (!includeArchived) rows = rows.filter((a) => a.archivedAt == null);
  if (title) rows = rows.filter((a) => a.title.toLowerCase().includes(title));
  if (description) rows = rows.filter((a) => a.description.toLowerCase().includes(description));
  if (status) rows = rows.filter((a) => a.status === status);
  // The owner's ads section filters by `adOwner`; the ads page uses `adOwnerId`. Both
  // arrive here as an owner id, but `adOwner` is also the free-text owner-name search
  // on the ads listing, so match on either id or name.
  if (adOwnerId) {
    rows = rows.filter((a) => {
      if (a.adOwnerId === adOwnerId) return true;
      const owner = (getCollection("adOwners", () => fx.adOwners) as any[]).find(
        (o) => o._id === a.adOwnerId,
      );
      return owner ? owner.name.toLowerCase().includes(adOwnerId.toLowerCase()) : false;
    });
  }
  if (industryIds.length) {
    rows = rows.filter((a) => a.industryIds.some((i) => industryIds.includes(i)));
  }
  if (excludeIds.length) rows = rows.filter((a) => !excludeIds.includes(a._id));

  const { entries, meta } = paginate(rows.map((r) => fx.buildAdListItem(r)), page, pageSize);
  // Listing pages read {entries,total}; AdInfiniteSelect reads entries+meta.
  return { status: 200, data: { success: true, data: { entries, total: meta.total, meta } } };
});

// Registered before getById so "/internal/advertisement/ad/stats" isn't captured as :id.
route("GET", endpoints.entities.ad.ad.stats({}), async ({ query }) => {
  await delay();
  const basis = query.get("basis") || "visit";
  const ids = (query.get("adIds") || "").split(",").map((s) => s.trim()).filter(Boolean);
  const rows = adSeeds().filter((a) => (ids.length ? ids.includes(a._id) : true));
  const payload = rows.map((r) => ({ [r._id]: fx.buildAdStats(r, basis) }));
  return { status: 200, data: { success: true, data: payload } };
});

route("GET", endpoints.entities.ad.ad.getById({ adId: ":id" }, {}), async ({ params, config }) => {
  await delay();
  const row = adSeeds().find((a) => a._id === params.id);
  if (!row) throw sandboxError(config, 404, { success: false, message: "Ad not found" });
  return { status: 200, data: { success: true, data: fx.buildAdDetail(row) } };
});

route("POST", endpoints.entities.ad.ad.create, async ({ body }) => {
  await delay(400);
  const nowIso = new Date().toISOString();
  const row = {
    _id: `ad-new-${Date.now().toString(36)}`,
    adOwnerId: body?.adOwnerId || "adowner-001",
    title: body?.title || "Untitled ad",
    description: body?.description || "",
    status: (body?.startTime ? "scheduled" : "draft") as "draft" | "scheduled" | "live" | "ended",
    hyperlink: body?.hyperlink ?? null,
    buttonText: body?.buttonText ?? null,
    startTime: body?.startTime ?? null,
    endTime: body?.endTime ?? null,
    archivedAt: null,
    createdAt: nowIso,
    updatedAt: nowIso,
    industryIds: Array.isArray(body?.industries) ? body.industries : [],
    creativeIndex: 0,
  };
  adSeeds().unshift(row as any);
  // create.tsx digs for _id through several shapes; {data:{_id,...}} satisfies it.
  return { status: 200, data: { success: true, data: fx.buildAdDetail(row as any) } };
});

route("PATCH", endpoints.entities.ad.ad.edit(":id"), async ({ params, body, config }) => {
  await delay(300);
  const row = adSeeds().find((a) => a._id === params.id) as any;
  if (!row) throw sandboxError(config, 404, { success: false, message: "Ad not found" });
  ["title", "description", "hyperlink", "buttonText", "startTime", "endTime"].forEach((k) => {
    if (body?.[k] !== undefined) row[k] = body[k];
  });
  if (Array.isArray(body?.industries)) row.industryIds = body.industries;
  row.updatedAt = new Date().toISOString();
  return { status: 200, data: { success: true, data: fx.buildAdDetail(row) } };
});

// The archive modal issues DELETE against the edit path (not adOwners.delete, which
// production points at the wrong resource).
route("DELETE", endpoints.entities.ad.ad.edit(":id"), async ({ params, config }) => {
  await delay(300);
  const row = adSeeds().find((a) => a._id === params.id) as any;
  if (!row) throw sandboxError(config, 404, { success: false, message: "Ad not found" });
  row.archivedAt = new Date().toISOString();
  row.updatedAt = row.archivedAt;
  return { status: 200, data: { success: true, data: null } };
});

// ============================= ASSET LEDGER =============================

route("GET", endpoints.entities.assetLedger.all, async ({ query }) => {
  await delay();
  const page = intParam(query, "page", 1);
  const pageSize = intParam(query, "pageSize", 18);
  const rows = getCollection("ledgerEntries", () => fx.generateLedgerEntries()) as any[];
  const { entries, meta } = paginate(rows, page, pageSize);
  // This page reads the FLAT `items` envelope, unlike the entries-based listings.
  return {
    status: 200,
    data: {
      success: true,
      data: { items: entries, page: meta.page, pageSize: meta.pageSize, total: meta.total, totalPages: meta.totalPages },
    },
  };
});

route("GET", endpoints.entities.assetLedger.coins, async () => {
  await delay(150);
  // Consumed as a bare array by the Ledger Actions asset picker.
  return { status: 200, data: { success: true, data: fx.assetCoins } };
});

route("GET", endpoints.entities.assetLedger.systemReport, async () => {
  await delay();
  return { status: 200, data: { success: true, data: fx.buildSystemReport() } };
});

// Ledger actions: mint/burn move supply against Treasury; fund/withdraw move balance
// between Treasury and the chosen system account. Applying them for real makes the
// System Report visibly change after each action, which is the whole point of the panel.
const SYSTEM_ACCOUNT_BY_ID: Record<string, "exchange" | "poll-funds"> = {
  bbbbbbbbbbbbbbbbbbbbbbbb: "exchange",
  cccccccccccccccccccccccc: "poll-funds",
};

function applyLedgerAction(kind: "mint" | "burn" | "fund" | "withdraw", body: any) {
  const balances = fx.getSystemBalances();
  const assetId = String(body?.assetId ?? "xPoll");
  const amount = Number(body?.amount ?? 0) || 0;
  const target = SYSTEM_ACCOUNT_BY_ID[String(body?.systemAccountId ?? "")] ?? "exchange";
  const bump = (role: string, delta: number) => {
    balances[role] = balances[role] ?? {};
    balances[role][assetId] = Math.max(0, (balances[role][assetId] ?? 0) + delta);
  };
  if (kind === "mint") bump("treasury", amount);
  if (kind === "burn") bump("treasury", -amount);
  if (kind === "fund") { bump("treasury", -amount); bump(target, amount); }
  if (kind === "withdraw") { bump(target, -amount); bump("treasury", amount); }

  const stamp = Date.now().toString(36);
  // Record the action in the ledger so All Ledgers reflects it too.
  (getCollection("ledgerEntries", () => fx.generateLedgerEntries()) as any[]).unshift({
    _id: `ledger-${kind}-${stamp}`,
    action: kind,
    chain: "base",
    createdAt: new Date().toISOString(),
    metadata: { assetId, amount: String(amount) },
    legs: [
      { _id: `ledger-${kind}-${stamp}-leg-0`, assetId, amount: String(amount), legName: "treasury", legType: "credit" },
      { _id: `ledger-${kind}-${stamp}-leg-1`, assetId, amount: String(amount), legName: "supply", legType: "debit" },
    ],
  });

  return {
    actionId: `action-${kind}-${stamp}`,
    legIds: [`ledger-${kind}-${stamp}-leg-0`, `ledger-${kind}-${stamp}-leg-1`],
  };
}

(["mint", "burn", "fund", "withdraw"] as const).forEach((kind) => {
  route("POST", endpoints.entities.actions[kind], async ({ body }) => {
    await delay(300);
    return { status: 200, data: { success: true, data: applyLedgerAction(kind, body) } };
  });
});

// ============================= INKD: AGENTS =============================

function inkdAgentsCollection() {
  return getCollection("inkdAgents", () => fx.inkdAgents) as any[];
}

route("GET", endpoints.entities.inkd.internalAgent.advancedListings, async ({ query }) => {
  await delay();
  const page = intParam(query, "page", 1);
  const pageSize = intParam(query, "pageSize", 20);
  const rows = inkdAgentsCollection().map((a) => ({
    _id: a._id,
    internalAgentId: a._id,
    name: a.name,
    status: a.status,
    nextSchedule: a.nextSchedule,
    totalInkBlogsCreated: {
      archivedIncluded: fx.inkdBlogs.filter((b) => b.createdByInkdInternalAgentId === a._id).length,
      archivedExcluded: fx.inkdBlogs.filter((b) => b.createdByInkdInternalAgentId === a._id && !b.archivedAt).length,
    },
    uniqueTargetLocations: a.targetGeo
      ? a.targetGeo.countries.length + a.targetGeo.states.length + a.targetGeo.cities.length
      : 0,
    linkedIndustries: a.industryIds
      .map((id: string) => (industriesCollection().find((i) => i._id === id)))
      .filter(Boolean)
      .map((i: any) => ({ _id: i._id, name: i.name, description: i.description })),
  }));
  const { entries, meta } = paginate(rows, page, pageSize);
  return {
    status: 200,
    data: { data: { entries, meta: { total: meta.total, page: meta.page, pageSize: meta.pageSize, totalPages: meta.totalPages } } },
  };
});

function industriesCollection() {
  return getCollection("industries", () => fx.industries) as any[];
}


route("GET", endpoints.entities.inkd.internalAgent.checkNameAvailability(":name"), async ({ params }) => {
  await delay(300);
  const taken = inkdAgentsCollection().some(
    (a) => a.name.toLowerCase() === decodeURIComponent(params.name).toLowerCase(),
  );
  return { status: 200, data: { data: { available: !taken } } };
});

route("POST", endpoints.entities.inkd.internalAgent.create, async ({ body }) => {
  await delay(500);
  const id = `inkd-agent-new-${Date.now().toString(36)}`;
  inkdAgentsCollection().unshift({
    _id: id,
    name: body?.name || "Untitled Signal AI",
    status: "active",
    foundationalInformation: body?.foundationalInformation || "",
    brandLanguage: body?.brandLanguage || "",
    maxBlogDescriptionLength: body?.maxBlogDescriptionLength ?? 6000,
    maxLinkedTrial: body?.maxLinkedTrial ?? 3,
    maxLinkedPoll: body?.maxLinkedPoll ?? 5,
    prioritySources: body?.prioritySources ?? [],
    industryIds: body?.industryIds ?? [],
    targetGeo: body?.targetGeo ?? null,
    fallbackImageUrl: body?.fallbackImageUrl || "",
    nextSchedule: null,
    rewards: body?.rewards ?? [],
    scheduleRules: body?.scheduleRules ?? [],
  });
  return { status: 200, data: { data: { internalAgentId: id } } };
});

route("POST", endpoints.entities.inkd.internalAgent.changeAgentStatus, async ({ body }) => {
  await delay(300);
  const agent = inkdAgentsCollection().find((a) => a._id === body?.inkDInternalAgentId);
  if (agent) agent.status = body?.status === "idle" ? "idle" : "active";
  return { status: 200, data: { success: true, data: null } };
});

route("GET", endpoints.entities.inkd.internalAgent.taskLogsAdvanced, async ({ query }) => {
  await delay();
  const csv = (query.get("inkdInternalAgentIdCSV") || "").split(",").filter(Boolean);
  const agentId = csv[0] || inkdAgentsCollection()[0]?._id;
  const entries = getCollection(`inkdTaskLogs:${agentId}`, () => fx.generateInkdTaskLogs(agentId));
  return { status: 200, data: { data: { entries, meta: { total: entries.length, page: 1, pageSize: 10, totalPages: 1 } } } };
});

route("POST", endpoints.entities.inkd.internalAgent.manualRun(":id"), async () => {
  await delay(400);
  return { status: 200, data: { success: true, data: null } };
});

// ============================= INKD: BLOGS =============================

function inkdBlogsCollection() {
  return getCollection("inkdBlogs", () => fx.inkdBlogs) as any[];
}

route("GET", endpoints.entities.inkd.blogs.advancedListings, async ({ query }) => {
  await delay();
  const page = intParam(query, "page", 1);
  const pageSize = intParam(query, "pageSize", 20);
  const agentId = query.get("createdByInkdInternalAgentId");
  const q = (query.get("q") || "").trim().toLowerCase();
  let rows = inkdBlogsCollection();
  if (agentId) rows = rows.filter((b) => b.createdByInkdInternalAgentId === agentId);
  if (q) rows = rows.filter((b) => b.title.toLowerCase().includes(q));
  const { entries, meta } = paginate(rows, page, pageSize);
  return {
    status: 200,
    data: { data: { entries, meta: { total: meta.total, page: meta.page, pageSize: meta.pageSize, totalPages: meta.totalPages } } },
  };
});

route("GET", endpoints.entities.inkd.blogs.getById(":id"), async ({ params, config }) => {
  await delay();
  const blog = inkdBlogsCollection().find((b) => b._id === params.id);
  if (!blog) throw sandboxError(config, 404, { success: false, message: "Blog not found" });
  return {
    status: 200,
    data: { data: { ...blog, totalActiveTrials: 2, rewardsAlignment: { activeTrialsOnly: [], nonActiveTrialsIncluded: [] }, inkDInternalAgentFallbackImage: null } },
  };
});

route("GET", endpoints.entities.inkd.blogs.getActiveTrails(":id"), async ({ params }) => {
  await delay();
  return { status: 200, data: { data: fx.buildInkdBlogTrialsPayload(params.id) } };
});

route("GET", endpoints.entities.inkd.blogs.analytics(":id", {}), async ({ params, config }) => {
  await delay();
  const blog = inkdBlogsCollection().find((b) => b._id === params.id);
  if (!blog) throw sandboxError(config, 404, { success: false, message: "Blog not found" });
  return { status: 200, data: { data: fx.buildInkdBlogAnalytics(blog) } };
});

route("PATCH", endpoints.entities.inkd.blogs.update(":id"), async ({ params, body, config }) => {
  await delay(300);
  const blog = inkdBlogsCollection().find((b) => b._id === params.id);
  if (!blog) throw sandboxError(config, 404, { success: false, message: "Blog not found" });
  Object.assign(blog, body);
  return { status: 200, data: { success: true, data: blog } };
});

route("DELETE", endpoints.entities.inkd.blogs.delete(":id"), async ({ params }) => {
  await delay(300);
  const rows = inkdBlogsCollection();
  const idx = rows.findIndex((b) => b._id === params.id);
  if (idx !== -1) rows.splice(idx, 1);
  return { status: 200, data: { success: true, data: null } };
});

route("PATCH", endpoints.entities.inkd.blogs.reviewVote(":id"), async ({ params, body, config }) => {
  await delay(200);
  const blog = inkdBlogsCollection().find((b) => b._id === params.id);
  if (!blog) throw sandboxError(config, 404, { success: false, message: "Blog not found" });
  blog.reviewVote = body?.reviewVote ?? null;
  return { status: 200, data: { success: true, data: null } };
});

// ============================= INKD: TOP INDUSTRIES =============================

route("GET", endpoints.entities.inkd.topIndustries.list, async () => {
  await delay();
  return { status: 200, data: { data: fx.buildTopIndustriesPayload() } };
});

route("POST", endpoints.entities.inkd.topIndustries.add, async ({ body }) => {
  await delay(300);
  if (body?.industryId) fx.addTopIndustry(body.industryId);
  return { status: 200, data: { success: true, data: null } };
});

route("DELETE", endpoints.entities.inkd.topIndustries.remove(":industryId"), async ({ params }) => {
  await delay(300);
  fx.removeTopIndustry(params.industryId);
  return { status: 200, data: { success: true, data: null } };
});

// ============================= INKD: CHAT =============================
// Real transport is REST (list/history/send/active-job/cancel) plus a raw EventSource
// for live streaming — the EventSource itself is intercepted by stubs/eventsource.ts,
// which shares inkd-chat-engine.ts's store with the routes below so both transports
// agree on state.

route("GET", endpoints.entities.inkd.chat.list({}), async ({ query }) => {
  await delay();
  const agentId = query.get("inkDInternalAgentIds") || query.get("inkdAgentId") || "";
  const entries = inkdChat.listChats(agentId);
  return { status: 200, data: { data: { entries, meta: { total: entries.length, page: 1, pageSize: 50, totalPages: 1 } } } };
});

route("GET", endpoints.entities.inkd.chat.history(":id", {}), async ({ params }) => {
  await delay(150);
  return { status: 200, data: { data: inkdChat.getHistory(params.id) } };
});

route("GET", endpoints.entities.inkd.chat.activeJob(":id"), async ({ params }) => {
  await delay(150);
  return { status: 200, data: { data: inkdChat.getActiveJob(params.id) } };
});

route("POST", endpoints.entities.inkd.chat.send, async ({ body }) => {
  await delay(250);
  const result = inkdChat.sendMessage({
    chatId: body?.chatId,
    inkdAgentId: body?.inkdAgentId,
    mode: body?.mode || "chat",
    prompt: String(body?.prompt || ""),
    referencedBlogIds: body?.referencedBlogIds,
  });
  return { status: 200, data: { data: result } };
});

route("POST", endpoints.entities.inkd.chat.cancelJob(":chatId", ":jobId"), async ({ params }) => {
  await delay(200);
  return { status: 200, data: { data: inkdChat.cancelJob(params.chatId, params.jobId) } };
});

route("PATCH", endpoints.entities.inkd.chat.updateMetadata(":id"), async () => {
  await delay(200);
  return { status: 200, data: { success: true, data: null } };
});

// Registered last among its siblings: this 3-segment ":id" pattern would otherwise
// shadow literal sibling paths of the same length (.../blogs, .../chat, .../task-logs)
// since the mock adapter matches the first registered route, not the most specific.
route("GET", endpoints.entities.inkd.internalAgent.getById(":id"), async ({ params, config }) => {
  await delay();
  const agent = inkdAgentsCollection().find((a) => a._id === params.id);
  if (!agent) throw sandboxError(config, 404, { success: false, message: "Agent not found" });
  return { status: 200, data: { success: true, data: agent } };
});

// ============================= LLM QUERIES =============================
// generate() hands back an id the detail page then polls every 3s. The result is
// derived on the fly from (prompt, createdAt) rather than stored, so no separate
// "advance the job" step is needed — status just depends on elapsed time.

route("POST", endpoints.entities.llm.generate, async ({ body }) => {
  await delay(300);
  const id = `llmq-${Date.now().toString(36)}`;
  const store = getCollection<Record<string, { prompt: string; createdAtMs: number }>>(
    "llmQueries",
    () => ({}),
  );
  store[id] = { prompt: String(body?.query ?? "").trim(), createdAtMs: Date.now() };
  return { status: 200, data: { success: true, data: { llmQueryId: id } } };
});

// LLMSideSheet (rendered on both /llm/queries and /llm/queries/:id) hits this
// literal path directly rather than through an endpoints.* builder, and reads it via
// useApiInfiniteQuery, which needs entries+meta.
route("GET", "/internal/llm/list", async ({ query }) => {
  await delay(150);
  const page = intParam(query, "page", 1);
  const pageSize = intParam(query, "pageSize", 20);
  const store = getCollection<Record<string, { prompt: string; createdAtMs: number }>>(
    "llmQueries",
    () => ({}),
  );
  const rows = Object.entries(store)
    .sort((a, b) => b[1].createdAtMs - a[1].createdAtMs)
    .map(([id, entry]) => ({ _id: id, input: { prompt: entry.prompt } }));
  const { entries, meta } = paginate(rows, page, pageSize);
  return { status: 200, data: { data: { entries, meta } } };
});

route("GET", endpoints.entities.llm.pollQueryResult(":id"), async ({ params, config }) => {
  await delay(200);
  const store = getCollection<Record<string, { prompt: string; createdAtMs: number }>>(
    "llmQueries",
    () => ({}),
  );
  const entry = store[params.id];
  if (!entry) throw sandboxError(config, 404, { success: false, message: "Query not found" });
  return {
    status: 200,
    data: { success: true, data: fx.buildLlmQueryResult(entry.prompt, entry.createdAtMs) },
  };
});

// ============================= QUEUES (BullMQ) =============================

route("GET", endpoints.entities.queues.bullMqJobRuns({}), async ({ query }) => {
  await delay();
  const page = intParam(query, "page", 1);
  const pageSize = intParam(query, "pageSize", 20);
  const taskTypeCSV = (query.get("taskTypeCSV") || "").split(",").map((s) => s.trim()).filter(Boolean);

  let rows = getCollection("bullMqJobRuns", () => fx.generateBullMqJobRuns()) as any[];
  if (taskTypeCSV.length) rows = rows.filter((r) => taskTypeCSV.includes(r.taskType));

  const { entries, meta } = paginate(rows, page, pageSize);
  // Page reads data?.data?.data off the raw axios response, so the body needs an
  // extra nesting level versus the {success,data} convention used elsewhere.
  return {
    status: 200,
    data: {
      data: { entries, meta: { total: meta.total, page: meta.page, pageSize: meta.pageSize, totalPages: meta.totalPages } },
    },
  };
});

// ============================= SLUGS =============================

route("GET", endpoints.entities.slug.all, async ({ query }) => {
  await delay();
  const page = intParam(query, "page", 1);
  const pageSize = intParam(query, "pageSize", 18);
  const includeArchived = query.get("includeArchived") !== "false";
  let rows = getCollection("slugs", () => fx.slugs) as any[];
  if (!includeArchived) rows = rows.filter((s) => s.archivedAt == null);
  const { entries, meta } = paginate(rows, page, pageSize);
  return {
    status: 200,
    data: {
      success: true,
      data: { entries, page: meta.page, pageSize: meta.pageSize, total: meta.total, totalPages: meta.totalPages },
    },
  };
});

// ============================= STRAIN COIN =============================
// The rest of the Strain page is on-chain (handled by the wagmi stub); only the
// Web2 sell switch talks to the API. The value is persisted so the toggle's
// post-save refetch reflects the change instead of snapping back.

function strainSellState() {
  return getCollection<{ isSellStrainActive: boolean }>("strainWeb2Sell", () => ({
    isSellStrainActive: true,
  }));
}

route("GET", endpoints.strain.getWeb2SellStatus, async () => {
  await delay(200);
  return { status: 200, data: { success: true, data: strainSellState() } };
});

route("POST", endpoints.strain.setWeb2SellStatus, async ({ body }) => {
  await delay(300);
  const state = strainSellState();
  state.isSellStrainActive = Boolean(body?.isSellStrainActive);
  return { status: 200, data: { success: true, data: state } };
});

// ============================= SELL INTENTS =============================
// Three queues, three endpoints, all on the flat `items` envelope. Approve/reject
// physically move rows between the collections so the queues visibly drain and fill.

function sellPending() {
  return getCollection("sellPending", () => fx.generateSellIntentsPending()) as any[];
}
function sellApproved() {
  return getCollection("sellApproved", () => fx.generateSellIntentsApproved()) as any[];
}
function sellRejected() {
  return getCollection("sellRejected", () => fx.generateSellIntentsRejected()) as any[];
}

function itemsEnvelope(rows: any[], query: URLSearchParams, defaultPageSize = 18) {
  const page = intParam(query, "page", 1);
  const pageSize = intParam(query, "pageSize", defaultPageSize);
  const { entries, meta } = paginate(rows, page, pageSize);
  return {
    status: 200,
    data: {
      success: true,
      data: { items: entries, page: meta.page, pageSize: meta.pageSize, total: meta.total, totalPages: meta.totalPages },
    },
  };
}

route("GET", endpoints.entities.assetLedger.sellIntentAdmin, async ({ query }) => {
  await delay();
  const status = query.get("status");
  let rows = sellPending();
  if (status && status !== "PENDING") {
    rows = status === "APPROVE" ? sellApproved() : status === "REJECT" ? sellRejected() : [];
  }
  return itemsEnvelope(rows, query);
});

route("GET", endpoints.entities.assetLedger.sellApproveOrder, async ({ query }) => {
  await delay();
  return itemsEnvelope(sellApproved(), query);
});

route("GET", endpoints.entities.assetLedger.sellRejectOrder, async ({ query }) => {
  await delay();
  return itemsEnvelope(sellRejected(), query);
});

// The batch page reads this one; same rows as the pending queue.
route("GET", endpoints.entities.assetLedger.sellIntent, async ({ query }) => {
  await delay();
  return itemsEnvelope(sellPending(), query);
});

function moveSellIntents(ids: string[], to: "APPROVE" | "REJECT", txnHashById: Record<string, string>) {
  const pending = sellPending();
  const target = to === "APPROVE" ? sellApproved() : sellRejected();
  ids.forEach((id) => {
    const idx = pending.findIndex((r) => r._id === id);
    if (idx === -1) return;
    const [row] = pending.splice(idx, 1);
    row.metadata = { ...row.metadata, status: to };
    if (to === "APPROVE") row.metadata.txnHash = txnHashById[id] || row.metadata.txnHash;
    target.unshift(row);
  });
}

route("POST", endpoints.entities.actions.createSellApprove, async ({ body }) => {
  await delay(400);
  // Body is [{actionId, txnHash}, ...] plus internalAccountId.
  const list: any[] = Array.isArray(body?.actionIds) ? body.actionIds : [];
  const ids = list.map((a) => (typeof a === "string" ? a : a?.actionId)).filter(Boolean);
  const hashes: Record<string, string> = {};
  list.forEach((a) => {
    if (a && typeof a === "object" && a.actionId) hashes[a.actionId] = a.txnHash;
  });
  moveSellIntents(ids, "APPROVE", hashes);
  // The Batch Transfer page reads `approvedIds` off the TOP LEVEL of the body
  // (useApiMutation already unwraps to response.data), while the queue modal ignores
  // the response entirely — so it goes at the root, alongside the usual envelope.
  return {
    status: 200,
    data: {
      success: true,
      approvedIds: ids,
      data: { actionId: `bulk-approve-${Date.now().toString(36)}`, approvedIds: ids },
    },
  };
});

// ============================= BATCH TRANSFER (web3) =============================
// The Batch Transfer page drives XRP via Xaman, SUI via the dapp-kit stub, and APTOS
// via a redirect round-trip. These routes cover every server call it makes.

route("POST", endpoints.web3.checkAddressActivation, async ({ body }) => {
  await delay(400);
  const addresses: any[] = Array.isArray(body?.addresses) ? body.addresses : [];
  // Consumers read `id` (not `_id`); returning any inactive address aborts the batch.
  return {
    status: 200,
    data: {
      data: {
        results: addresses.map((a) => ({
          id: a?.id,
          walletAddress: a?.walletAddress,
          active: true,
        })),
      },
    },
  };
});

route("POST", endpoints.web3.createbatchTransfer, async ({ body }) => {
  await delay(600);
  const transfers: any[] = Array.isArray(body?.transfers) ? body.transfers : [];
  return {
    status: 200,
    data: {
      success: true,
      data: {
        batchId: `xrp-batch-${Date.now().toString(36)}`,
        accepted: transfers.length,
      },
    },
  };
});

// VITE_APTOS_TRANSFER_BASE_URL is empty in the sandbox, so this resolves to a
// relative path and still comes through the axios adapter.
route("POST", "/aptos/transfer/batch", async ({ body }) => {
  await delay(600);
  const transfers: any[] = Array.isArray(body?.transfers) ? body.transfers : [];
  return {
    status: 200,
    data: {
      data: {
        results: transfers.map((t, i) => ({
          id: t?.ref,
          success: true,
          txHash: `0xapt${Date.now().toString(16)}${i.toString(16).padStart(2, "0")}`,
        })),
      },
    },
  };
});

route("POST", endpoints.web3.recordAptosBatchResult, async () => {
  await delay(250);
  return { status: 200, data: { success: true, data: null } };
});

// --- Xaman (XRP wallet) ---------------------------------------------------------
// createXamanPayload reads uuid/next/refs off `data`, and the websocket_status URL is
// handed to the WebSocket stub, which reports a successful signature shortly after.

route("POST", endpoints.web3.createXamanPayload, async () => {
  await delay(400);
  const uuid = `sandbox-xaman-${Date.now().toString(36)}`;
  return {
    status: 200,
    data: {
      success: true,
      data: {
        uuid,
        next: { always: `${SANDBOX_WS_PREFIX.replace("wss://", "https://")}sign/${uuid}` },
        refs: {
          qr_png: fx.xamanQrPng,
          websocket_status: `${SANDBOX_WS_PREFIX}${uuid}`,
        },
      },
    },
  };
});

route("GET", "/internal/web3/getxamanpayload", async () => {
  await delay(200);
  // waitForXamanAccount digs for response.account; returning it on the first poll
  // keeps the connect flow snappy instead of walking the backoff ladder.
  return {
    status: 200,
    data: {
      success: true,
      data: {
        meta: { signed: true, expired: false },
        response: { account: fx.SANDBOX_XRP_ADDRESS },
      },
    },
  };
});

route("POST", endpoints.entities.actions.createSellReject, async ({ body }) => {
  await delay(400);
  // Reject sends a plain string array, not objects.
  const list: any[] = Array.isArray(body?.actionIds) ? body.actionIds : [];
  const ids = list.map((a) => (typeof a === "string" ? a : a?.actionId)).filter(Boolean);
  moveSellIntents(ids, "REJECT", {});
  return { status: 200, data: { success: true, data: { actionId: `bulk-reject-${Date.now().toString(36)}` } } };
});

// ============================= PAYMENTS (online + offline) =============================
// One endpoint serves both pages; `offlineOnly=true` selects the offline dataset,
// which has its own purpose/status vocabulary and offline metadata.

route("GET", endpoints.entities.assetLedger.allPayments, async ({ query }) => {
  await delay();
  const page = intParam(query, "page", 1);
  const pageSize = intParam(query, "pageSize", 5);
  const offlineOnly = query.get("offlineOnly") === "true";
  const statuses = (query.get("status") || "").split(",").map((s) => s.trim()).filter(Boolean);
  const purposes = (query.get("paymentIntentPurpose") || "").split(",").map((s) => s.trim()).filter(Boolean);

  let rows = offlineOnly
    ? (getCollection("offlinePayments", () => fx.generateOfflinePayments()) as any[])
    : (getCollection("payments", () => fx.generatePayments()) as any[]);
  if (statuses.length) rows = rows.filter((p) => statuses.includes(p.status));
  if (purposes.length) rows = rows.filter((p) => purposes.includes(p.purpose));

  const { entries, meta } = paginate(rows, page, pageSize);
  return {
    status: 200,
    data: {
      success: true,
      data: { total: meta.total, entries, page: meta.page, pageSize: meta.pageSize },
    },
  };
});

route("PATCH", endpoints.entities.assetLedger.updateOfflinePaymentAddressStatus(":id"), async ({ params, body, config }) => {
  await delay(300);
  const rows = getCollection("offlinePayments", () => fx.generateOfflinePayments()) as any[];
  const row = rows.find((p) => p._id === params.id);
  if (!row) throw sandboxError(config, 404, { success: false, message: "Payment not found" });
  row.metadata = row.metadata ?? {};
  row.metadata.offline = row.metadata.offline ?? {};
  row.metadata.offline.addressStatus = body?.addressStatus ?? "addressed";
  if (body?.campaignId) row.context = { ...(row.context ?? {}), campaignId: body.campaignId };
  if (body?.adId) row.context = { ...(row.context ?? {}), adId: body.adId };
  if (body?.reportLink) {
    row.metadata.soulBoundSubscription = { ...(row.metadata.soulBoundSubscription ?? {}), reportLink: body.reportLink };
  }
  return { status: 200, data: { success: true, data: null } };
});

// ============================= BUY CONFIG MANAGEMENT =============================

route("GET", endpoints.buyConfigManagement.list, async () => {
  await delay();
  return { status: 200, data: { success: true, data: fx.getBuyConfigPayload() } };
});

// Written as a literal rather than endpoints.buyConfigManagement.update(":entityType",
// ":entityId") — that helper runs entityId through encodeURIComponent, which turns the
// ":" placeholder into "%3A" and stops the route from ever matching.
route("PATCH", "/internal/buy-config-management/:entityType/:entityId", async ({ params, body, config }) => {
  await delay(300);
  const bucket =
    params.entityType === "asset"
      ? "buyConfigAssets"
      : params.entityType === "campaignPlan"
        ? "buyConfigCampaignPlans"
        : "buyConfigOfflineProducts";
  const seed =
    params.entityType === "asset"
      ? fx.buyConfigAssets
      : params.entityType === "campaignPlan"
        ? fx.buyConfigCampaignPlans
        : fx.buyConfigOfflineProducts;
  const rows = getCollection(bucket, () => seed) as any[];
  const row = rows.find((r) => r.entityId === decodeURIComponent(params.entityId));
  if (!row) throw sandboxError(config, 404, { success: false, message: "Buy config entry not found" });

  // The UI refetches immediately after saving, so the write has to actually persist.
  row.buyConfig = {
    ...row.buyConfig,
    enable: body?.enable ?? row.buyConfig.enable,
    fiat: body?.fiat ?? row.buyConfig.fiat,
    crypto: body?.crypto ?? row.buyConfig.crypto,
    // The PATCH body drops `cadence`, which is read-only — preserve the existing one.
    ...(body?.subscription
      ? {
          subscription: {
            ...body.subscription,
            cadence: row.buyConfig.subscription?.cadence ?? null,
          },
        }
      : {}),
    ...(body?.minParentTokensPerOrder !== undefined
      ? { minParentTokensPerOrder: body.minParentTokensPerOrder }
      : {}),
  };
  return { status: 200, data: { success: true, data: row } };
});

// ============================= BLOGS =============================

route("GET", endpoints.entities.blogs.all, async () => {
  await delay();
  const rows = getCollection("blogs", () => fx.blogs) as any[];
  const entries = rows.map((b) => ({ _id: b._id, title: b.title, archivedAt: b.archivedAt }));
  return { status: 200, data: { success: true, data: { entries } } };
});

route("GET", endpoints.entities.blogs.advancedListing, async ({ query }) => {
  await delay();
  const page = intParam(query, "page", 1);
  const pageSize = intParam(query, "pageSize", 50);
  const title = (query.get("title") || "").trim().toLowerCase();
  let rows = getCollection("blogs", () => fx.blogs) as any[];
  if (title) rows = rows.filter((b) => b.title.toLowerCase().includes(title));
  const { entries, meta } = paginate(
    rows.map((b) => ({ _id: b._id, title: b.title, archivedAt: b.archivedAt })),
    page,
    pageSize,
  );
  return { status: 200, data: { success: true, data: { entries, total: meta.total, meta } } };
});

route("GET", endpoints.entities.blogs.getById(":id"), async ({ params, config }) => {
  await delay();
  const row = (getCollection("blogs", () => fx.blogs) as any[]).find((b) => b._id === params.id);
  if (!row) throw sandboxError(config, 404, { success: false, message: "Blog not found" });
  return { status: 200, data: { success: true, data: fx.buildBlogDetail(row) } };
});

route("POST", endpoints.entities.blogs.create, async ({ body }) => {
  await delay(400);
  const nowIso = new Date().toISOString();
  const row = {
    _id: `blog-new-${Date.now().toString(36)}`,
    title: body?.title || "Untitled blog",
    pollStatement: body?.pollStatement || "",
    content: body?.content || "",
    archivedAt: null,
    createdAt: nowIso,
    responses: [],
    coverCount: Array.isArray(body?.imageUrls) ? body.imageUrls.length : 0,
  };
  (getCollection("blogs", () => fx.blogs) as any[]).unshift(row);
  // create.tsx requires statusCode===201 and reads data.data._id to redirect.
  return { status: 201, data: { statusCode: 201, success: true, data: { _id: row._id } } };
});

route("PATCH", endpoints.entities.blogs.update(":id"), async ({ params, body, config }) => {
  await delay(300);
  const row = (getCollection("blogs", () => fx.blogs) as any[]).find((b) => b._id === params.id) as any;
  if (!row) throw sandboxError(config, 404, { success: false, message: "Blog not found" });
  if (body?.title !== undefined) row.title = body.title;
  if (body?.pollStatement !== undefined) row.pollStatement = body.pollStatement;
  if (body?.content !== undefined) row.content = body.content;
  if (Array.isArray(body?.imageUrls)) row.coverCount = body.imageUrls.length;
  // edit page requires statusCode===200 to navigate; response body content is unread.
  return { status: 200, data: { statusCode: 200, success: true, data: { _id: row._id } } };
});

route("DELETE", endpoints.entities.blogs.delete, async ({ body }) => {
  await delay(300);
  const ids: string[] = Array.isArray(body?.blogIds) ? body.blogIds : [];
  const rows = getCollection("blogs", () => fx.blogs) as any[];
  const remaining = rows.filter((b) => !ids.includes(b._id));
  rows.length = 0;
  rows.push(...remaining);
  return { status: 200, data: { success: true, data: null } };
});

// ============================= CAMPAIGNS =============================

route("GET", endpoints.entities.campaigns.plans, async () => {
  await delay();
  // create.tsx does `?.data?.data ?? ...` then `.filter(...)`, so this must be a bare array.
  return { status: 200, data: { success: true, data: fx.campaignPlans } };
});

route("GET", endpoints.entities.campaigns.advancedListing, async ({ query }) => {
  await delay();
  const page = intParam(query, "page", 1);
  const pageSize = intParam(query, "pageSize", 12);
  const name = (query.get("name") || "").trim().toLowerCase();
  const status = query.get("status");
  const externalAuthor = query.get("externalAuthor");

  let rows = getCollection("campaigns", () => fx.campaigns) as any[];
  if (name) rows = rows.filter((c) => c.name.toLowerCase().includes(name));
  if (status) rows = rows.filter((c) => c.status === status);
  if (externalAuthor) rows = rows.filter((c) => c.externalAuthor === externalAuthor);

  const { entries, meta } = paginate(rows, page, pageSize);
  // This listing reads {entries, total} off the payload root — no `meta`, no `items`.
  return { status: 200, data: { success: true, data: { entries, total: meta.total } } };
});

route("GET", endpoints.entities.campaigns.getById(":id"), async ({ params, config }) => {
  await delay();
  const row = (getCollection("campaigns", () => fx.campaigns) as any[]).find(
    (c) => c._id === params.id,
  );
  if (!row) throw sandboxError(config, 404, { success: false, message: "Campaign not found" });
  return { status: 200, data: { success: true, data: fx.buildCampaignDetail(row) } };
});

route("POST", endpoints.entities.campaigns.create, async ({ body }) => {
  await delay(400);
  const id = `campaign-new-${Date.now().toString(36)}`;
  const plan = fx.campaignPlans.find((p) => p._id === body?.initialPlanId);
  const nowIso = new Date().toISOString();
  (getCollection("campaigns", () => fx.campaigns) as any[]).unshift({
    _id: id,
    name: body?.name || "Untitled campaign",
    goal: body?.goal || "",
    status: "draft",
    isPolitical: Boolean(body?.isPolitical),
    externalAuthor: body?.externalAuthor || "user-001",
    description: body?.goal || "",
    createdAt: nowIso,
    updatedAt: nowIso,
    planId: body?.initialPlanId || "plan-np-30",
    donation: Boolean(plan?.donationSupported),
  });
  return { status: 200, data: { success: true, data: { _id: id } } };
});

route("GET", endpoints.users.details(":id"), async ({ params, config }) => {
  await delay();
  const row = fx.externalUsers.find((u) => u._id === params.id);
  if (!row) throw sandboxError(config, 404, { success: false, message: "User not found" });
  return { status: 200, data: { success: true, data: fx.buildUserDetails(row) } };
});

route("GET", endpoints.users.sharerAnalytics(":id"), async ({ params }) => {
  await delay();
  const row = fx.externalUsers.find((u) => u._id === params.id);
  const rows = row
    ? getCollection(`referral-by-sharer:${row._id}`, () => fx.generateSharerReferralRows(row))
    : [];
  const views = rows.reduce((sum, r) => sum + r.counts.views, 0);
  const uniques = rows.reduce((sum, r) => sum + r.counts.uniques, 0);
  const linksWithTraffic = rows.filter((r) => r.hasAnyVisitor).length;
  return {
    status: 200,
    data: { success: true, data: fx.buildSharerAnalytics(params.id, views, uniques, linksWithTraffic) },
  };
});

// ============================= REFERRAL CONFIG =============================

route("GET", endpoints.referral.getConfig, async () => {
  await delay();
  const levels = getCollection("referralConfig", () => fx.referralConfigLevels);
  return { status: 200, data: { success: true, data: { referral_levels: levels } } };
});

route("PUT", endpoints.referral.updateReferral, async ({ body }) => {
  await delay(300);
  const incoming = Array.isArray(body?.referral_levels) ? body.referral_levels : [];
  const converted = fx.levelsFromBaseAmounts(incoming);
  const store = getCollection<any[]>("referralConfig", () => fx.referralConfigLevels);
  store.length = 0;
  store.push(...converted);
  return { status: 200, data: { success: true, data: null } };
});

route("GET", endpoints.referral.uniques, async ({ query }) => {
  await delay();
  const linkId = query.get("referralLinkIds") || "";
  const page = intParam(query, "page", 1);
  const pageSize = intParam(query, "pageSize", 20);
  const sortBy = query.get("sortBy");
  const sortDir = query.get("sortDir") || "desc";

  const rows = getCollection(`referral-uniques:${linkId}`, () => fx.generateUniqueVisitors(linkId));
  let sorted = rows;
  if (sortBy === "visits") {
    sorted = [...rows].sort((a, b) => (sortDir === "asc" ? a.visits - b.visits : b.visits - a.visits));
  }
  const { entries, meta } = paginate(sorted, page, pageSize);
  return {
    status: 200,
    data: { success: true, data: { page: meta.page, pageSize: meta.pageSize, total: meta.total, totalPages: meta.totalPages, items: entries } },
  };
});

// ============================= ENTITY LINKS =============================
// No cross-entity links are modeled in fixtures; the listing UI handles an empty
// result gracefully ("No linked entities yet."), and add/remove just need to resolve.

route("GET", endpoints.entities.entityLink.listForward(":type", ":id"), async () => {
  await delay(150);
  return { status: 200, data: { success: true, data: [] } };
});

route("POST", endpoints.entities.entityLink.add, async () => {
  await delay(200);
  return { status: 200, data: { success: true, data: null } };
});

route("POST", endpoints.entities.entityLink.remove, async () => {
  await delay(200);
  return { status: 200, data: { success: true, data: null } };
});

// ============================= ADAPTER =============================

export async function sandboxAdapter(
  config: AxiosRequestConfig,
): Promise<AxiosResponse> {
  const method = (config.method || "get").toUpperCase();
  const { pathname, query } = resolveRequest(config);

  for (const r of routes) {
    if (r.method !== method) continue;
    const match = r.regex.exec(pathname);
    if (!match) continue;
    const params: Record<string, string> = {};
    r.paramNames.forEach((name, i) => {
      params[name] = decodeURIComponent(match[i + 1]);
    });
    const body = parseBody(config);
    try {
      const result = await r.handler({ params, query, body, config });
      return buildResponse(config, result.status ?? 200, result.data);
    } catch (err) {
      if (err instanceof AxiosError) throw err;
      console.error("[sandbox] handler threw", method, pathname, err);
      throw sandboxError(
        config,
        500,
        { success: false, message: "Sandbox handler error" },
        "Sandbox handler error",
      );
    }
  }

  console.warn(`[sandbox] no mock route for ${method} ${pathname}`);
  throw sandboxError(
    config,
    404,
    { success: false, message: `No sandbox route for ${method} ${pathname}` },
    "Not Found",
  );
}

// re-export so axios.isCancel etc. keep working for callers that import axios directly
export { axios };
