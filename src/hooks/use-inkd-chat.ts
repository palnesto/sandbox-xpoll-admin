import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import apiInstance, { BASE_URL, queryClient } from "@/api/queryClient";
import { endpoints } from "@/api/endpoints";
import { appToast } from "@/utils/toast";

type InkDChatMode = "chat" | "plan" | "build";

type InkDTargetGeo = {
  countries?: string[];
  states?: string[];
  cities?: string[];
} | null;

type InkDRewardInput = {
  assetId: string;
  amount: string;
  rewardAmountCap?: string;
  currentDistribution?: string;
  rewardType?: string;
};

type InkDChatConfig = {
  foundationalInformation?: string;
  brandLanguage?: string;
  minBlogTitleLength?: number;
  maxBlogTitleLength?: number;
  minBlogDescriptionLength?: number;
  maxBlogDescriptionLength?: number;
  maxLinkedTrial?: number;
  maxLinkedPoll?: number;
  prioritySources?: string[];
  targetGeo?: InkDTargetGeo;
  fallbackImageUrl?: string;
  rewards?: InkDRewardInput[];
};

type InkDGeneratedPoll = {
  question: string;
  options: string[];
  explanation: string;
};

type InkDGeneratedTrial = {
  title: string;
  description: string;
  polls: InkDGeneratedPoll[];
};

type InkDGeneratedBlog = {
  blogId?: string;
  title: string;
  content: string;
  version: number;
  postedVersion?: number;
  postedAt?: string;
};

type InkDChatMetadata = {
  mode?: "plan" | "build";
  theme?: string;
  chat_sys?: string;
  userConfig?: Record<string, unknown>;
  planner?: Record<string, unknown>;
  plan?: Record<string, unknown>;
  blog?: InkDGeneratedBlog;
  trials?: InkDGeneratedTrial[];
  [key: string]: unknown;
};

type ApiEnvelope<T> = {
  data: T;
  message: string;
  success: boolean;
  statusCode: number;
};

type InkDChatMessage = {
  _id: string;
  chatId: string;
  author: {
    role: string;
    internalAccountId?: string;
    inkdAgentId?: string;
  };
  parts: Array<{
    type: string;
    text?: string;
    content?: string;
  }>;
  messageStatus?: {
    status: "pending" | "success" | "failure" | "cancelled";
  } | null;
  stream?: {
    state: "streaming" | "completed" | "failed" | "cancelled";
    version: number;
    seq: number;
  } | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type InkDChat = {
  _id: string;
  inkdAgentId: string;
  title: string | null;
  config?: InkDChatConfig;
  metadata?: InkDChatMetadata;
  createdAt?: string | null;
  updatedAt?: string | null;
  archivedAt?: string | null;
};

type InkDChatListData = {
  entries: InkDChat[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

type InkDChatHistoryData = {
  chat: InkDChat;
  entries: InkDChatMessage[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

type InkDActiveJob = {
  jobId: string;
  chatId: string;
  inkdAgentId: string;
  internalAccountId: string;
  adminMessageId: string;
  mode: InkDChatMode;
  prompt: string;
  referencedBlogIds: string[];
  state: string;
  stage: string | null;
  error: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  eventsPath: string;
};

type InkDQueuedResponse = {
  delivery: {
    status: "queued";
    reason: string;
    jobId: string;
    state: string;
    eventsPath: string;
    activeJobPath: string;
  };
  chat: InkDChat;
  userMessage: InkDChatMessage;
  assistantMessage: null;
};

type InkDStreamSnapshot = {
  eventType: "queued" | "running" | "completed" | "failed" | "cancelled";
  jobId: string;
  chatId: string;
  state: string;
  stage: string | null;
  isTerminal: boolean;
  error: string | null;
  userMessage: InkDChatMessage | null;
  assistantMessage: InkDChatMessage | null;
  updatedAt: string | null;
};

type InkDAssistantStreamMessageEvent = {
  type: "assistant_start" | "assistant_restart" | "assistant_done" | "assistant_failed" | "assistant_cancelled";
  jobId: string;
  chatId: string;
  message: InkDChatMessage;
  error?: string | null;
};

type InkDAssistantStreamDeltaEvent = {
  type: "assistant_delta";
  jobId: string;
  chatId: string;
  messageId: string;
  streamVersion: number;
  streamSeq: number;
  delta: string;
  updatedAt: string | null;
};

type InkDChatCancelResponse = {
  outcome: "cancelled" | "stopping" | "already_terminal" | "missing";
  jobId: string;
  chatId: string;
  state: string | null;
  userMessage: InkDChatMessage | null;
  assistantMessage: InkDChatMessage | null;
  updatedAt: string | null;
};

type SubmitInkDChatOptions = {
  prompt?: string;
  referencedBlogIds?: string[];
  mode?: InkDChatMode;
};

const CHAT_HISTORY_PAGE_SIZE = 100;
const CHAT_LIST_PAGE_SIZE = 50;
const LIVE_SNAPSHOT_TIMEOUT_MS = 4_500;
const FALLBACK_SYNC_POLL_MS = 1_500;

function toAbsoluteEventUrl(path: string) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  const base = BASE_URL?.replace(/\/+$/, "") ?? "";
  return base ? `${base}${path}` : path;
}

function chatModeStorageKey(agentId: string) {
  return `inkd-chat:mode:${agentId}`;
}

function readStoredValue(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStoredValue(key: string, value: string | null) {
  try {
    if (value === null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // ignore storage failures
  }
}

function sortMessagesAscending(messages: InkDChatMessage[]) {
  return [...messages].sort((a, b) => {
    const aTime = new Date(a.createdAt ?? 0).getTime();
    const bTime = new Date(b.createdAt ?? 0).getTime();
    if (aTime !== bTime) return aTime - bTime;
    return String(a._id).localeCompare(String(b._id));
  });
}

function mergeMessages(current: InkDChatMessage[], incoming: InkDChatMessage[]) {
  const byId = new Map<string, InkDChatMessage>();
  for (const message of current) byId.set(message._id, message);
  for (const message of incoming) byId.set(message._id, message);
  return sortMessagesAscending(Array.from(byId.values()));
}

function applyAssistantDelta(current: InkDChatMessage[], event: InkDAssistantStreamDeltaEvent) {
  let matched = false;

  const nextMessages = current.map((message) => {
    if (message._id !== event.messageId) return message;
    matched = true;

    const currentVersion = message.stream?.version ?? 0;
    const currentSeq = message.stream?.seq ?? 0;

    if (currentVersion > event.streamVersion) {
      return message;
    }

    if (currentVersion === event.streamVersion && currentSeq >= event.streamSeq) {
      return message;
    }

    const previousText = getInkDChatMessageText(message);
    const nextText = currentVersion === event.streamVersion ? `${previousText}${event.delta}` : event.delta;

    return {
      ...message,
      parts: [{ type: "text", text: nextText }],
      stream: {
        state: "streaming",
        version: event.streamVersion,
        seq: event.streamSeq,
      },
      updatedAt: event.updatedAt ?? message.updatedAt ?? null,
    };
  });

  return matched ? sortMessagesAscending(nextMessages) : current;
}

function getHistoryQueryKey(chatId: string | null) {
  return ["inkd-chat-history", chatId];
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object"
  ) {
    const responseData = error.response.data as {
      message?: unknown;
      error?: unknown;
    };
    if (typeof responseData.message === "string" && responseData.message.trim()) {
      return responseData.message;
    }
    if (typeof responseData.error === "string" && responseData.error.trim()) {
      return responseData.error;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

export function getInkDChatMessageText(message: InkDChatMessage | null | undefined) {
  if (!message) return "";
  return message.parts
    .map((part) => {
      if (part.type === "text") return part.text ?? "";
      if (part.type === "rich_text") return part.content ?? "";
      return "";
    })
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

export function useInkdChat(inkdInternalAgentId: string | null) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const modeStorageKey = useMemo(
    () => (inkdInternalAgentId ? chatModeStorageKey(inkdInternalAgentId) : ""),
    [inkdInternalAgentId],
  );
  const requestedChatId = useMemo(() => {
    const chatId = searchParams.get("chatId")?.trim();
    return chatId ? chatId : null;
  }, [searchParams]);

  const [selectedChatId, setSelectedChatIdState] = useState<string | null>(null);
  const [mode, setModeState] = useState<InkDChatMode>(() => {
    const stored = modeStorageKey ? readStoredValue(modeStorageKey) : null;
    return stored === "chat" || stored === "build" || stored === "plan" ? stored : "plan";
  });
  const [prompt, setPrompt] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [messages, setMessages] = useState<InkDChatMessage[]>([]);
  const [activeJob, setActiveJob] = useState<InkDActiveJob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [liveEventTick, setLiveEventTick] = useState(0);

  const eventSourceRef = useRef<EventSource | null>(null);
  const eventSourceKeyRef = useRef<string | null>(null);
  const openEventSourceRef = useRef<((job: Pick<InkDActiveJob, "chatId" | "jobId" | "eventsPath">) => void) | null>(null);
  const snapshotTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackPollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackJobKeyRef = useRef<string | null>(null);
  const selectedChatIdRef = useRef<string | null>(selectedChatId);
  const activeJobRef = useRef<InkDActiveJob | null>(activeJob);

  useEffect(() => {
    selectedChatIdRef.current = selectedChatId;
  }, [selectedChatId]);

  useEffect(() => {
    activeJobRef.current = activeJob;
  }, [activeJob]);

  useEffect(() => {
    if (!modeStorageKey) {
      setModeState("plan");
      return;
    }
    const stored = readStoredValue(modeStorageKey);
    setModeState(stored === "chat" || stored === "build" || stored === "plan" ? stored : "plan");
  }, [modeStorageKey]);

  const chatsRoute = useMemo(() => {
    if (!inkdInternalAgentId) return "";
    return endpoints.entities.inkd.chat.list({
      page: 1,
      pageSize: CHAT_LIST_PAGE_SIZE,
      inkDInternalAgentIds: inkdInternalAgentId,
    });
  }, [inkdInternalAgentId]);

  const chatsQuery = useQuery<ApiEnvelope<InkDChatListData>>({
    queryKey: ["inkd-chat-list", inkdInternalAgentId],
    enabled: !!inkdInternalAgentId,
    queryFn: async () => {
      const response = await apiInstance.get<ApiEnvelope<InkDChatListData>>(chatsRoute);
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const chats = useMemo(
    () => chatsQuery.data?.data?.entries ?? [],
    [chatsQuery.data],
  );
  const refetchChats = chatsQuery.refetch;

  useEffect(() => {
    if (!inkdInternalAgentId) {
      setSelectedChatIdState(null);
      setMessages([]);
      setActiveJob(null);
      setIsStopping(false);
      return;
    }
  }, [inkdInternalAgentId]);

  const historyQuery = useQuery<ApiEnvelope<InkDChatHistoryData>>({
    queryKey: ["inkd-chat-history", selectedChatId],
    enabled: !!selectedChatId,
    queryFn: async () => {
      const response = await apiInstance.get<ApiEnvelope<InkDChatHistoryData>>(
        endpoints.entities.inkd.chat.history(selectedChatId!, {
          page: 1,
          pageSize: CHAT_HISTORY_PAGE_SIZE,
        }),
      );
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  useEffect(() => {
    const entries = historyQuery.data?.data?.entries ?? [];
    if (!selectedChatId) {
      setMessages([]);
      return;
    }
    if (activeJobRef.current?.chatId === selectedChatId) {
      return;
    }
    setMessages(sortMessagesAscending(entries));
  }, [historyQuery.data, selectedChatId]);

  const clearLiveRecovery = useCallback(() => {
    if (snapshotTimeoutRef.current) {
      clearTimeout(snapshotTimeoutRef.current);
      snapshotTimeoutRef.current = null;
    }
    if (fallbackPollTimeoutRef.current) {
      clearTimeout(fallbackPollTimeoutRef.current);
      fallbackPollTimeoutRef.current = null;
    }
    fallbackJobKeyRef.current = null;
  }, []);

  const closeEventSource = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    eventSourceKeyRef.current = null;
  }, []);

  const syncHistoryIntoState = useCallback(
    (chatId: string, history: InkDChatHistoryData) => {
      queryClient.setQueryData<ApiEnvelope<InkDChatHistoryData>>(getHistoryQueryKey(chatId), {
        success: true,
        statusCode: 200,
        message: "Chat history fetched",
        data: history,
      });

      if (selectedChatIdRef.current === chatId) {
        setMessages(sortMessagesAscending(history.entries ?? []));
      }
    },
    [],
  );

  const fetchChatHistory = useCallback(async (chatId: string) => {
    const response = await apiInstance.get<ApiEnvelope<InkDChatHistoryData>>(
      endpoints.entities.inkd.chat.history(chatId, {
        page: 1,
        pageSize: CHAT_HISTORY_PAGE_SIZE,
      }),
    );
    return response.data.data;
  }, []);

  const setUrlChatId = useCallback(
    (chatId: string | null, replace = false) => {
      const nextSearchParams = new URLSearchParams(searchParams);
      if (chatId) {
        nextSearchParams.set("chatId", chatId);
      } else {
        nextSearchParams.delete("chatId");
      }

      const nextSearch = nextSearchParams.toString();
      const currentSearch = searchParams.toString();
      if (nextSearch === currentSearch) return;

      const nextUrl = `${location.pathname}${nextSearch ? `?${nextSearch}` : ""}`;
      navigate(nextUrl, {
        replace,
        state: location.state,
      });
    },
    [location.pathname, location.state, navigate, searchParams],
  );

  useEffect(() => {
    closeEventSource();
    clearLiveRecovery();
    setActiveJob(null);
    setIsStopping(false);
    activeJobRef.current = null;
    setMessages([]);
    setHistoryOpen(false);
    setPrompt("");
    selectedChatIdRef.current = null;
    setSelectedChatIdState(null);
  }, [clearLiveRecovery, closeEventSource, inkdInternalAgentId]);

  useEffect(() => {
    let cancelled = false;

    if (!inkdInternalAgentId) return () => undefined;

    if (!requestedChatId) {
      if (selectedChatId !== null) {
        closeEventSource();
        clearLiveRecovery();
        setActiveJob(null);
        activeJobRef.current = null;
        selectedChatIdRef.current = null;
        setSelectedChatIdState(null);
        setMessages([]);
        setHistoryOpen(false);
        setPrompt("");
      }
      return () => undefined;
    }

    if (requestedChatId === selectedChatId) {
      return () => undefined;
    }

    if (chats.some((chat) => chat._id === requestedChatId)) {
      selectedChatIdRef.current = requestedChatId;
      setSelectedChatIdState(requestedChatId);
      setMessages([]);
      return () => undefined;
    }

    if (chatsQuery.isLoading) {
      return () => undefined;
    }

    void (async () => {
      try {
        const history = await fetchChatHistory(requestedChatId);
        if (cancelled) return;

        if (history.chat?._id === requestedChatId && history.chat.inkdAgentId === inkdInternalAgentId) {
          selectedChatIdRef.current = requestedChatId;
          setSelectedChatIdState(requestedChatId);
          syncHistoryIntoState(requestedChatId, history);
          return;
        }
      } catch (error) {
        if (!cancelled) {
          console.warn("[inkd-chat] invalid chatId in URL", {
            chatId: requestedChatId,
            inkdInternalAgentId,
            error,
          });
        }
      }

      if (cancelled) return;

      closeEventSource();
      clearLiveRecovery();
      setActiveJob(null);
      setIsStopping(false);
      activeJobRef.current = null;
      selectedChatIdRef.current = null;
      setSelectedChatIdState(null);
      setMessages([]);
      setHistoryOpen(false);
      setPrompt("");
      setUrlChatId(null, true);
    })();

    return () => {
      cancelled = true;
    };
  }, [
    chats,
    chatsQuery.isLoading,
    clearLiveRecovery,
    closeEventSource,
    fetchChatHistory,
    inkdInternalAgentId,
    requestedChatId,
    selectedChatId,
    setUrlChatId,
    syncHistoryIntoState,
  ]);

  const fetchActiveJob = useCallback(
    async (chatId: string) => {
      const response = await apiInstance.get<ApiEnvelope<InkDActiveJob | null>>(
        endpoints.entities.inkd.chat.activeJob(chatId),
      );
      return response.data.data ?? null;
    },
    [],
  );

  const startFallbackSync = useCallback(
    (job: Pick<InkDActiveJob, "chatId" | "jobId">, reason: string) => {
      const jobKey = `${job.chatId}:${job.jobId}`;
      if (fallbackJobKeyRef.current === jobKey) return;

      clearLiveRecovery();
      fallbackJobKeyRef.current = jobKey;
      closeEventSource();
      console.debug("[inkd-chat] fallback sync triggered", { jobKey, reason });

      const poll = async () => {
        if (fallbackJobKeyRef.current !== jobKey) return;

        try {
          const active = await fetchActiveJob(job.chatId);
          if (fallbackJobKeyRef.current !== jobKey) return;

          if (active && active.jobId === job.jobId) {
            setActiveJob(active);
            activeJobRef.current = active;
            if (openEventSourceRef.current) {
              openEventSourceRef.current(active);
              return;
            }
            fallbackPollTimeoutRef.current = setTimeout(() => {
              void poll();
            }, FALLBACK_SYNC_POLL_MS);
            return;
          }

          await queryClient.cancelQueries({ queryKey: getHistoryQueryKey(job.chatId) });
          const history = await fetchChatHistory(job.chatId);
          syncHistoryIntoState(job.chatId, history);
          setActiveJob(null);
          setIsStopping(false);
          activeJobRef.current = null;
          clearLiveRecovery();
          await refetchChats();
        } catch (error) {
          console.error("[inkd-chat] fallback sync failed", { jobKey, error });
          fallbackPollTimeoutRef.current = setTimeout(() => {
            void poll();
          }, FALLBACK_SYNC_POLL_MS);
        }
      };

      fallbackPollTimeoutRef.current = setTimeout(() => {
        void poll();
      }, FALLBACK_SYNC_POLL_MS);
    },
    [clearLiveRecovery, closeEventSource, fetchActiveJob, fetchChatHistory, refetchChats, syncHistoryIntoState],
  );

  const armSnapshotTimeout = useCallback(
    (job: Pick<InkDActiveJob, "chatId" | "jobId">) => {
      if (snapshotTimeoutRef.current) {
        clearTimeout(snapshotTimeoutRef.current);
      }

      snapshotTimeoutRef.current = setTimeout(() => {
        if (activeJobRef.current?.jobId !== job.jobId) return;
        void startFallbackSync(job, "snapshot-timeout");
      }, LIVE_SNAPSHOT_TIMEOUT_MS);
    },
    [startFallbackSync],
  );

  const handleSnapshot = useCallback(
    async (snapshot: InkDStreamSnapshot) => {
      console.debug("[inkd-chat] snapshot received", snapshot);

      const selectedChatId = selectedChatIdRef.current;
      const activeJob = activeJobRef.current;
      const matchesSelectedChat = snapshot.chatId === selectedChatId;
      const matchesActiveJob = !!activeJob && activeJob.jobId === snapshot.jobId;

      if (!matchesSelectedChat && !matchesActiveJob) return;

      clearLiveRecovery();
      setLiveEventTick((current) => current + 1);

      if (!matchesSelectedChat) {
        selectedChatIdRef.current = snapshot.chatId;
        setSelectedChatIdState(snapshot.chatId);
      }

      const liveMessages = [snapshot.userMessage, snapshot.assistantMessage].filter(Boolean) as InkDChatMessage[];
      if (liveMessages.length > 0) {
        setMessages((current) => mergeMessages(current, liveMessages));
      }

      setActiveJob((current) => {
        if (snapshot.isTerminal) return null;
        if (current && current.jobId === snapshot.jobId) {
          return {
            ...current,
            state: snapshot.state,
            stage: snapshot.stage,
            error: snapshot.error,
            updatedAt: snapshot.updatedAt,
          };
        }
        return current;
      });

      if (snapshot.isTerminal) {
        console.debug("[inkd-chat] terminal snapshot handled", snapshot);
        activeJobRef.current = null;
        closeEventSource();
        setActiveJob(null);
        setIsStopping(false);

        try {
          await queryClient.cancelQueries({ queryKey: getHistoryQueryKey(snapshot.chatId) });
          const history = await fetchChatHistory(snapshot.chatId);
          syncHistoryIntoState(snapshot.chatId, history);
        } finally {
          await refetchChats();
        }
        return;
      }

      setIsStopping(snapshot.stage === "cancel_requested");

      if (activeJobRef.current) {
        armSnapshotTimeout({
          chatId: snapshot.chatId,
          jobId: snapshot.jobId,
        });
      }
    },
    [armSnapshotTimeout, clearLiveRecovery, closeEventSource, fetchChatHistory, refetchChats, syncHistoryIntoState],
  );

  const handleAssistantEvent = useCallback(
    async (event: InkDAssistantStreamMessageEvent | InkDAssistantStreamDeltaEvent) => {
      console.debug("[inkd-chat] assistant stream event received", event);

      const selectedChatId = selectedChatIdRef.current;
      const activeJob = activeJobRef.current;
      const matchesSelectedChat = event.chatId === selectedChatId;
      const matchesActiveJob = !!activeJob && activeJob.jobId === event.jobId;

      if (!matchesSelectedChat && !matchesActiveJob) return;

      clearLiveRecovery();
      setLiveEventTick((current) => current + 1);

      if (!matchesSelectedChat) {
        selectedChatIdRef.current = event.chatId;
        setSelectedChatIdState(event.chatId);
      }

      if (event.type === "assistant_delta") {
        setMessages((current) => applyAssistantDelta(current, event));
      } else {
        setMessages((current) => mergeMessages(current, [event.message]));
      }

      if (activeJobRef.current) {
        armSnapshotTimeout({
          chatId: event.chatId,
          jobId: event.jobId,
        });
      }
    },
    [armSnapshotTimeout, clearLiveRecovery],
  );

  const openEventSource = useCallback(
    (job: Pick<InkDActiveJob, "chatId" | "jobId" | "eventsPath">) => {
      const nextKey = `${job.chatId}:${job.jobId}`;
      if (eventSourceKeyRef.current === nextKey) return;

      closeEventSource();
      clearLiveRecovery();

      const source = new EventSource(toAbsoluteEventUrl(job.eventsPath), {
        withCredentials: true,
      });

      const onSnapshot = (event: MessageEvent<string>) => {
        try {
          const snapshot = JSON.parse(event.data) as InkDStreamSnapshot;
          void handleSnapshot(snapshot);
        } catch (error) {
          console.error("[inkd-chat] failed to parse SSE snapshot", error);
        }
      };

      const onAssistantEvent = (event: MessageEvent<string>) => {
        try {
          const payload = JSON.parse(event.data) as InkDAssistantStreamMessageEvent | InkDAssistantStreamDeltaEvent;
          void handleAssistantEvent(payload);
        } catch (error) {
          console.error("[inkd-chat] failed to parse assistant stream event", error);
        }
      };

      source.onopen = () => {
        console.debug("[inkd-chat] EventSource opened", { jobKey: nextKey });
      };

      source.addEventListener("snapshot", onSnapshot as EventListener);
      source.addEventListener("queued", onSnapshot as EventListener);
      source.addEventListener("running", onSnapshot as EventListener);
      source.addEventListener("completed", onSnapshot as EventListener);
      source.addEventListener("failed", onSnapshot as EventListener);
      source.addEventListener("cancelled", onSnapshot as EventListener);
      source.addEventListener("assistant_start", onAssistantEvent as EventListener);
      source.addEventListener("assistant_delta", onAssistantEvent as EventListener);
      source.addEventListener("assistant_restart", onAssistantEvent as EventListener);
      source.addEventListener("assistant_done", onAssistantEvent as EventListener);
      source.addEventListener("assistant_failed", onAssistantEvent as EventListener);
      source.addEventListener("assistant_cancelled", onAssistantEvent as EventListener);
      source.onerror = () => {
        console.error("[inkd-chat] EventSource error", { jobKey: nextKey });
        if (eventSourceKeyRef.current !== nextKey) return;
        if (activeJobRef.current?.jobId !== job.jobId) return;
        void startFallbackSync(job, "sse-error");
      };

      eventSourceRef.current = source;
      eventSourceKeyRef.current = nextKey;
      armSnapshotTimeout(job);
    },
    [armSnapshotTimeout, clearLiveRecovery, closeEventSource, handleAssistantEvent, handleSnapshot, startFallbackSync],
  );

  useEffect(() => {
    openEventSourceRef.current = openEventSource;
    return () => {
      openEventSourceRef.current = null;
    };
  }, [openEventSource]);

  useEffect(() => {
    if (!modeStorageKey) return;
    writeStoredValue(modeStorageKey, mode);
  }, [mode, modeStorageKey]);

  useEffect(() => {
    let cancelled = false;

    if (!selectedChatId) return () => undefined;

    const existingJob = activeJobRef.current;
    const existingEventSourceKey = eventSourceKeyRef.current;
    if (
      existingJob &&
      existingJob.chatId === selectedChatId &&
      existingEventSourceKey === `${existingJob.chatId}:${existingJob.jobId}`
    ) {
      return () => undefined;
    }

    closeEventSource();
    clearLiveRecovery();
    setActiveJob(null);
    setIsStopping(false);
    activeJobRef.current = null;

    void (async () => {
      try {
        const job = await fetchActiveJob(selectedChatId);
        if (cancelled) return;
        console.debug("[inkd-chat] active job fetched", {
          chatId: selectedChatId,
          jobId: job?.jobId ?? null,
          eventsPath: job?.eventsPath ?? null,
        });
        setActiveJob(job);
        setIsStopping(job?.stage === "cancel_requested");
        activeJobRef.current = job;
        if (job) {
          openEventSource(job);
        }
      } catch (error) {
        if (cancelled) return;
        console.error("[inkd-chat] failed to fetch active job", error);
        setActiveJob(null);
        setIsStopping(false);
      }
    })();

    return () => {
      cancelled = true;
      closeEventSource();
      clearLiveRecovery();
    };
  }, [selectedChatId, clearLiveRecovery, closeEventSource, fetchActiveJob, openEventSource]);

  const setSelectedChatId = useCallback(
    (nextChatId: string | null) => {
      if (activeJobRef.current) return;
      clearLiveRecovery();
      setHistoryOpen(false);
      setMessages([]);
      selectedChatIdRef.current = nextChatId;
      setSelectedChatIdState(nextChatId);
      setUrlChatId(nextChatId);
    },
    [clearLiveRecovery, setUrlChatId],
  );

  const startNewChat = useCallback(() => {
    if (activeJobRef.current) return;
    clearLiveRecovery();
    closeEventSource();
    setHistoryOpen(false);
    setActiveJob(null);
    activeJobRef.current = null;
    selectedChatIdRef.current = null;
    setSelectedChatIdState(null);
    setMessages([]);
    setPrompt("");
    setUrlChatId(null);
  }, [clearLiveRecovery, closeEventSource, setUrlChatId]);

  const submit = useCallback(async (options?: SubmitInkDChatOptions) => {
    const promptValue = options?.prompt ?? prompt;
    const trimmedPrompt = promptValue.trim();
    const nextMode = options?.mode ?? mode;
    const referencedBlogIds = Array.isArray(options?.referencedBlogIds)
      ? Array.from(new Set(options.referencedBlogIds.map((value) => value.trim()).filter(Boolean)))
      : [];

    if (!inkdInternalAgentId || !trimmedPrompt || activeJobRef.current || isSubmitting) return false;

    setIsSubmitting(true);
    try {
      const response = await apiInstance.post<ApiEnvelope<InkDQueuedResponse>>(endpoints.entities.inkd.chat.send, {
        ...(selectedChatId ? { chatId: selectedChatId } : { inkdAgentId: inkdInternalAgentId }),
        mode: nextMode,
        prompt: trimmedPrompt,
        ...(referencedBlogIds.length > 0 ? { referencedBlogIds } : {}),
      });

      const payload = response.data.data;
      console.debug("[inkd-chat] queued response received", {
        chatId: payload.chat._id,
        jobId: payload.delivery.jobId,
        eventsPath: payload.delivery.eventsPath,
        activeJobPath: payload.delivery.activeJobPath,
        mode: nextMode,
      });
      const nextChatId = payload.chat._id;
      const nextJob: InkDActiveJob = {
        jobId: payload.delivery.jobId,
        chatId: nextChatId,
        inkdAgentId: payload.chat.inkdAgentId,
        internalAccountId: "",
        adminMessageId: payload.userMessage._id,
        mode: nextMode,
        prompt: trimmedPrompt,
        referencedBlogIds,
        state: payload.delivery.state,
        stage: "enqueued",
        error: null,
        createdAt: payload.userMessage.createdAt ?? null,
        updatedAt: payload.userMessage.updatedAt ?? null,
        eventsPath: payload.delivery.eventsPath,
      };

      await queryClient.cancelQueries({ queryKey: getHistoryQueryKey(nextChatId) });
      clearLiveRecovery();
      selectedChatIdRef.current = nextChatId;
      activeJobRef.current = nextJob;
      setSelectedChatIdState(nextChatId);
      setActiveJob(nextJob);
      setMessages((current) => mergeMessages(current, [payload.userMessage]));
      if (!options?.prompt) {
        setPrompt("");
      }
      setHistoryOpen(false);
      if (!selectedChatId) {
        setUrlChatId(nextChatId, true);
      }
      openEventSource(nextJob);
      await refetchChats();
      return true;
    } catch (error: unknown) {
      setIsStopping(false);
      const message = getApiErrorMessage(error, "Failed to queue chat");
      appToast.error(message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [clearLiveRecovery, inkdInternalAgentId, isSubmitting, mode, openEventSource, prompt, refetchChats, selectedChatId, setUrlChatId]);

  const stop = useCallback(async () => {
    const job = activeJobRef.current;
    if (!job || isStopping) return;

    setIsStopping(true);
    try {
      const response = await apiInstance.post<ApiEnvelope<InkDChatCancelResponse>>(
        endpoints.entities.inkd.chat.cancelJob(job.chatId, job.jobId),
      );
      const payload = response.data.data;

      if (payload.userMessage || payload.assistantMessage) {
        setMessages((current) =>
          mergeMessages(
            current,
            [payload.userMessage, payload.assistantMessage].filter(Boolean) as InkDChatMessage[],
          ),
        );
      }

      if (payload.outcome === "stopping") {
        setActiveJob((current) =>
          current && current.jobId === job.jobId
            ? {
                ...current,
                stage: "cancel_requested",
                updatedAt: payload.updatedAt ?? current.updatedAt,
              }
            : current,
        );
        activeJobRef.current = activeJobRef.current && activeJobRef.current.jobId === job.jobId
          ? {
              ...activeJobRef.current,
              stage: "cancel_requested",
              updatedAt: payload.updatedAt ?? activeJobRef.current.updatedAt,
            }
          : activeJobRef.current;
        return;
      }

      closeEventSource();
      clearLiveRecovery();
      activeJobRef.current = null;
      setActiveJob(null);

      if (payload.outcome !== "missing") {
        await queryClient.cancelQueries({ queryKey: getHistoryQueryKey(job.chatId) });
        const history = await fetchChatHistory(job.chatId);
        syncHistoryIntoState(job.chatId, history);
      }

      await refetchChats();
    } catch (error: unknown) {
      const message = getApiErrorMessage(error, "Failed to stop chat");
      appToast.error(message);
    } finally {
      if (!activeJobRef.current) {
        setIsStopping(false);
      }
    }
  }, [clearLiveRecovery, closeEventSource, fetchChatHistory, isStopping, refetchChats, syncHistoryIntoState]);

  useEffect(() => {
    return () => {
      closeEventSource();
      clearLiveRecovery();
    };
  }, [clearLiveRecovery, closeEventSource]);

  const currentChat = useMemo(
    () => chats.find((chat) => chat._id === selectedChatId) ?? historyQuery.data?.data?.chat ?? null,
    [chats, historyQuery.data, selectedChatId],
  );

  const visibleChats = useMemo(() => {
    if (!currentChat) return chats;
    if (chats.some((chat) => chat._id === currentChat._id)) return chats;
    return [currentChat, ...chats];
  }, [chats, currentChat]);

  return {
    chats: visibleChats,
    currentChat,
    selectedChatId,
    setSelectedChatId,
    messages,
    mode,
    setMode: setModeState,
    prompt,
    setPrompt,
    historyOpen,
    setHistoryOpen,
    startNewChat,
    submit,
    stop,
    activeJob,
    isBusy: !!activeJob || isSubmitting || isStopping,
    isSubmitting,
    isStopping,
    isLoadingChats: chatsQuery.isLoading,
    isLoadingHistory: historyQuery.isLoading,
    liveEventTick,
    refreshChats: chatsQuery.refetch,
  };
}
