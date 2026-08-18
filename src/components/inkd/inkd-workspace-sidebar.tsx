import {
  type SyntheticEvent,
  type UIEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Cog,
  Copy,
  CopyCheck,
  FileText,
  LoaderCircle,
  MessageSquareText,
  Send,
  Sparkles,
  Square,
  X,
} from "lucide-react";
import apiInstance, { queryClient } from "@/api/queryClient";
import { endpoints } from "@/api/endpoints";
import { MarkdownPreview } from "@/components/markdown-preview";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { getInkDChatMessageText, useInkdChat } from "@/hooks/use-inkd-chat";
import { appToast } from "@/utils/toast";

type Props = {
  inkdInternalAgentId: string | null;
  agentName: string;
  onBack: () => void;
  onConfigure: () => void;
  canConfigure: boolean;
};

type ApiEnvelope<T> = {
  data: T;
  message: string;
  success: boolean;
  statusCode: number;
};

type ReferencedBlog = {
  _id: string;
  title: string;
  description?: string;
};

type ReferencedBlogListData = {
  entries: ReferencedBlog[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

type ActiveMention = {
  start: number;
  end: number;
  query: string;
};

type DraftBlog = {
  blogId?: string;
  title: string;
  content: string;
  version: number;
  postedVersion?: number;
  postedAt?: string;
};

type DraftTrial = {
  title: string;
  description: string;
  polls: Array<{
    question: string;
    options: string[];
    explanation: string;
  }>;
};

type DraftPostResponse = {
  blog?: {
    _id?: string;
  };
};

const MODE_LABELS = {
  chat: "Chat",
  plan: "Plan",
  build: "Build",
} as const;

const BLOG_REFERENCE_PAGE_SIZE = 20;
const SCROLL_BOTTOM_THRESHOLD_PX = 48;
const MENTION_LIST_LOAD_MORE_THRESHOLD_PX = 72;
const DEFAULT_DRAFT_IMAGE_URL = "https://example.com/inkd-trigger-default.jpg";
const DEFAULT_TRIAL_SOCIAL_LINKS = {
  instagram: null,
  telegram: null,
  twitterX: null,
  tiktok: null,
} as const;

function formatBubbleTime(value?: string | null) {
  if (!value) return "now";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "now";

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function buildReferenceBlogsUrl(
  inkdInternalAgentId: string,
  page: number,
  query: string,
) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(BLOG_REFERENCE_PAGE_SIZE),
    createdByInkdInternalAgentId: inkdInternalAgentId,
  });

  if (query.trim()) {
    params.set("q", query.trim());
  }

  return `${endpoints.entities.inkd.blogs.advancedListings}?${params.toString()}`;
}

function buildReferenceToken(title: string) {
  return `@{${title}} `;
}

function findActiveMention(value: string, caretIndex: number | null) {
  if (caretIndex === null || caretIndex < 0) return null;

  const beforeCaret = value.slice(0, caretIndex);
  const atIndex = beforeCaret.lastIndexOf("@");
  if (atIndex < 0) return null;

  const charBeforeAt = atIndex === 0 ? "" : value.charAt(atIndex - 1);
  if (
    charBeforeAt &&
    !/\s/.test(charBeforeAt) &&
    charBeforeAt !== "(" &&
    charBeforeAt !== "[" &&
    charBeforeAt !== "{"
  ) {
    return null;
  }

  const query = value.slice(atIndex + 1, caretIndex);
  if (
    /[\s\r\n]/.test(query) ||
    query.includes("{") ||
    query.includes("}") ||
    query.includes("[") ||
    query.includes("]") ||
    query.includes("(") ||
    query.includes(")")
  ) {
    return null;
  }

  return {
    start: atIndex,
    end: caretIndex,
    query,
  } satisfies ActiveMention;
}

function truncateDescription(value?: string, maxLength = 120) {
  if (!value) return "No description yet.";

  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return "No description yet.";
  if (normalized.length <= maxLength) return normalized;

  return `${normalized.slice(0, maxLength - 1)}...`;
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

function isValidHttpUrl(value?: string | null) {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function InkdWorkspaceSidebar({
  inkdInternalAgentId,
  agentName,
  onBack,
  onConfigure,
  canConfigure,
}: Props) {
  const {
    chats,
    currentChat,
    selectedChatId,
    setSelectedChatId,
    messages,
    mode,
    setMode,
    prompt,
    setPrompt,
    historyOpen,
    setHistoryOpen,
    startNewChat,
    submit,
    stop,
    activeJob,
    isBusy,
    isSubmitting,
    isStopping,
    isLoadingChats,
    isLoadingHistory,
    liveEventTick,
  } = useInkdChat(inkdInternalAgentId);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesBottomRef = useRef<HTMLDivElement | null>(null);
  const promptTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const copyResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const liveEventScrollFrameRef = useRef<number | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const pendingSubmitScrollRef = useRef(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [isPostingDraft, setIsPostingDraft] = useState(false);
  const [activeMention, setActiveMention] = useState<ActiveMention | null>(
    null,
  );
  const [highlightedMentionIndex, setHighlightedMentionIndex] = useState(0);
  const [selectedReferencedBlogs, setSelectedReferencedBlogs] = useState<
    ReferencedBlog[]
  >([]);

  const draftBlog = useMemo(
    () => (currentChat?.metadata?.blog ?? null) as DraftBlog | null,
    [currentChat?.metadata?.blog],
  );
  const draftTrials = useMemo(
    () =>
      Array.isArray(currentChat?.metadata?.trials)
        ? (currentChat.metadata.trials as DraftTrial[])
        : [],
    [currentChat?.metadata?.trials],
  );
  const hasDraftBlog = !!draftBlog?.title?.trim() && !!draftBlog?.content?.trim();
  const hasDraftTrials = draftTrials.length > 0;
  const isDraftAlreadyPosted =
    !!draftBlog &&
    typeof draftBlog.version === "number" &&
    typeof draftBlog.postedVersion === "number" &&
    draftBlog.postedVersion >= draftBlog.version;
  const canOpenDraft = hasDraftBlog;
  const canPostDraft =
    hasDraftBlog &&
    hasDraftTrials &&
    !isDraftAlreadyPosted &&
    !isBusy &&
    !isPostingDraft;

  const placeholder = useMemo(() => {
    if (mode === "chat")
      return 'Ask a question or type "@" to reference earlier blogs.';
    if (mode === "plan")
      return 'Plan a blog on housing policy with a practical angle. Type "@" to reference prior blogs.';
    return 'Build the full draft and linked trials for this topic. Type "@" to bring in older blogs.';
  }, [mode]);

  const syncScrollState = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container || historyOpen || messages.length === 0) {
      shouldAutoScrollRef.current = true;
      setShowScrollToBottom(false);
      return;
    }

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    const isAtBottom = distanceFromBottom <= SCROLL_BOTTOM_THRESHOLD_PX;
    shouldAutoScrollRef.current = isAtBottom;
    setShowScrollToBottom(!isAtBottom);
  }, [historyOpen, messages.length]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    shouldAutoScrollRef.current = true;
    setShowScrollToBottom(false);
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior,
      });
    }
    messagesBottomRef.current?.scrollIntoView({
      block: "end",
      behavior,
    });
  }, []);

  const syncMentionFromValue = useCallback(
    (nextValue: string, caretIndex: number | null) => {
      if (!inkdInternalAgentId || historyOpen || isBusy) {
        setActiveMention(null);
        return;
      }

      setActiveMention(findActiveMention(nextValue, caretIndex));
    },
    [historyOpen, inkdInternalAgentId, isBusy],
  );

  const mentionQuery = activeMention?.query ?? "";
  const mentionPickerOpen =
    !!activeMention && !historyOpen && !!inkdInternalAgentId && !isBusy;

  const referenceBlogsQuery = useInfiniteQuery({
    queryKey: [
      "inkd-chat-reference-blogs",
      inkdInternalAgentId,
      mentionQuery.trim(),
    ],
    enabled: mentionPickerOpen && !!inkdInternalAgentId,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const response = await apiInstance.get<ApiEnvelope<ReferencedBlogListData>>(
        buildReferenceBlogsUrl(
          inkdInternalAgentId!,
          Number(pageParam),
          mentionQuery,
        ),
      );
      return response.data.data;
    },
    getNextPageParam: (lastPage) => {
      const nextPage = (lastPage.meta.page ?? 0) + 1;
      return nextPage <= (lastPage.meta.totalPages ?? 0)
        ? nextPage
        : undefined;
    },
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  const mentionBlogs = useMemo(() => {
    const entries =
      referenceBlogsQuery.data?.pages.flatMap((page) => page.entries ?? []) ??
      [];
    const seen = new Set<string>();

    return entries.filter((entry) => {
      if (!entry?._id || seen.has(entry._id)) return false;
      seen.add(entry._id);
      return !selectedReferencedBlogs.some(
        (selected) => selected._id === entry._id,
      );
    });
  }, [referenceBlogsQuery.data, selectedReferencedBlogs]);

  const lastMessageId = messages[messages.length - 1]?._id;
  const lastMessageUpdatedAt = messages[messages.length - 1]?.updatedAt;
  const {
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isReferenceBlogsLoading,
  } = referenceBlogsQuery;

  useEffect(() => {
    setHighlightedMentionIndex(0);
  }, [mentionQuery, mentionBlogs.length]);

  useEffect(() => {
    shouldAutoScrollRef.current = true;
    setShowScrollToBottom(false);
  }, [historyOpen, selectedChatId]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      syncScrollState();
    };

    handleScroll();
    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [historyOpen, messages.length, selectedChatId, syncScrollState]);

  useEffect(() => {
    if (historyOpen) return;
    if (!messagesContainerRef.current) return;

    requestAnimationFrame(() => {
      if (pendingSubmitScrollRef.current) {
        pendingSubmitScrollRef.current = false;
        scrollToBottom("auto");
        requestAnimationFrame(() => {
          scrollToBottom("auto");
        });
        return;
      }

      if (shouldAutoScrollRef.current) {
        scrollToBottom("smooth");
        return;
      }

      syncScrollState();
    });
  }, [
    activeJob?.jobId,
    historyOpen,
    isLoadingHistory,
    lastMessageId,
    lastMessageUpdatedAt,
    messages.length,
    scrollToBottom,
    selectedChatId,
    syncScrollState,
  ]);

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current) {
        clearTimeout(copyResetTimeoutRef.current);
      }
      if (liveEventScrollFrameRef.current !== null) {
        cancelAnimationFrame(liveEventScrollFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!activeJob || historyOpen || liveEventTick === 0) return;

    if (liveEventScrollFrameRef.current !== null) {
      cancelAnimationFrame(liveEventScrollFrameRef.current);
    }

    liveEventScrollFrameRef.current = requestAnimationFrame(() => {
      liveEventScrollFrameRef.current = null;
      scrollToBottom("smooth");
    });
  }, [activeJob, historyOpen, liveEventTick, scrollToBottom]);

  useEffect(() => {
    setIsPostingDraft(false);
    setSelectedReferencedBlogs([]);
    setActiveMention(null);
    setDraftModalOpen(false);
  }, [selectedChatId]);

  const handleCopy = async (messageId: string, text: string) => {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      if (copyResetTimeoutRef.current) {
        clearTimeout(copyResetTimeoutRef.current);
      }
      copyResetTimeoutRef.current = setTimeout(() => {
        setCopiedMessageId((current) =>
          current === messageId ? null : current,
        );
      }, 2000);
    } catch (error) {
      console.error("[inkd-chat] failed to copy bubble text", {
        messageId,
        error,
      });
    }
  };

  const handleSubmit = useCallback(async () => {
    pendingSubmitScrollRef.current = true;
    shouldAutoScrollRef.current = true;
    setShowScrollToBottom(false);
    scrollToBottom("auto");
    requestAnimationFrame(() => {
      scrollToBottom("auto");
    });

    const didSubmit = await submit({
      referencedBlogIds: selectedReferencedBlogs.map((blog) => blog._id),
    });

    if (didSubmit) {
      setSelectedReferencedBlogs([]);
      setActiveMention(null);
    }
  }, [scrollToBottom, selectedReferencedBlogs, submit]);

  const handlePostDraft = useCallback(async () => {
    if (
      !canPostDraft ||
      !selectedChatId ||
      !currentChat ||
      !draftBlog ||
      !inkdInternalAgentId
    ) {
      return;
    }

    const effectiveAgentId = currentChat.inkdAgentId || inkdInternalAgentId;
    if (!effectiveAgentId) {
      appToast.error("Missing InkD agent for this draft");
      return;
    }

    const normalizedTargetGeo = currentChat.config?.targetGeo
      ? {
          countries: Array.isArray(currentChat.config.targetGeo.countries)
            ? currentChat.config.targetGeo.countries
            : [],
          states: Array.isArray(currentChat.config.targetGeo.states)
            ? currentChat.config.targetGeo.states
            : [],
          cities: Array.isArray(currentChat.config.targetGeo.cities)
            ? currentChat.config.targetGeo.cities
            : [],
        }
      : null;
    const fallbackImageUrl = isValidHttpUrl(currentChat.config?.fallbackImageUrl)
      ? currentChat.config?.fallbackImageUrl
      : null;
    const trialAssetUrl = fallbackImageUrl ?? DEFAULT_DRAFT_IMAGE_URL;
    const rewards = Array.isArray(currentChat.config?.rewards)
      ? currentChat.config.rewards.flatMap((reward) => {
          if (
            !reward ||
            typeof reward.assetId !== "string" ||
            typeof reward.amount !== "string" ||
            typeof reward.rewardAmountCap !== "string"
          ) {
            return [];
          }

          return [
            {
              assetId: reward.assetId,
              amount: reward.amount,
              rewardAmountCap: reward.rewardAmountCap,
              ...(typeof reward.rewardType === "string"
                ? { rewardType: reward.rewardType }
                : {}),
            },
          ];
        })
      : [];

    setIsPostingDraft(true);
    try {
      const response = await apiInstance.post<ApiEnvelope<DraftPostResponse>>(
        endpoints.entities.inkd.blogs.createWithTrials,
        {
          blog: {
            title: draftBlog.title,
            description: draftBlog.content,
            createdByInkdInternalAgentId: effectiveAgentId,
            uploadedImageLinks: fallbackImageUrl ? [fallbackImageUrl] : [],
            uploadedVideoLinks: [],
            ytVideoLinks: [],
            externalLinks: [],
            targetGeo: normalizedTargetGeo,
          },
          trials: draftTrials.map((trial) => ({
            trial: {
              title: trial.title,
              description: trial.description,
              resourceAssets: [{ type: "image", value: trialAssetUrl }],
              socialMediaLinks: DEFAULT_TRIAL_SOCIAL_LINKS,
              ...(normalizedTargetGeo ? { targetGeo: normalizedTargetGeo } : {}),
              ...(rewards.length > 0 ? { rewards } : {}),
            },
            polls: trial.polls.map((poll) => ({
              title: poll.question,
              description: poll.explanation,
              resourceAssets: [],
              options: poll.options.map((option) => ({
                text: option,
              })),
            })),
          })),
        },
      );

      const postedBlogId = response.data.data?.blog?._id?.trim();
      if (!postedBlogId) {
        throw new Error("Blog created without a returned id");
      }

      const postedAt = new Date().toISOString();
      await apiInstance.patch(
        endpoints.entities.inkd.chat.updateMetadata(selectedChatId),
        {
          blog: {
            ...draftBlog,
            blogId: postedBlogId,
            postedVersion: draftBlog.version,
            postedAt,
          },
        },
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["inkd-chat-history", selectedChatId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["inkd-chat-list", inkdInternalAgentId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["inkd-blogs-advanced"],
        }),
      ]);

      appToast.success("Blog posted successfully");
      setDraftModalOpen(false);
    } catch (error: unknown) {
      appToast.error(getApiErrorMessage(error, "Failed to post blog"));
    } finally {
      setIsPostingDraft(false);
    }
  }, [
    canPostDraft,
    currentChat,
    draftBlog,
    draftTrials,
    inkdInternalAgentId,
    selectedChatId,
  ]);
  const handleComposerSelection = useCallback(
    (event: SyntheticEvent<HTMLTextAreaElement>) => {
      syncMentionFromValue(
        event.currentTarget.value,
        event.currentTarget.selectionStart,
      );
    },
    [syncMentionFromValue],
  );
  const handleSelectReferencedBlog = useCallback(
    (blog: ReferencedBlog) => {
      if (!activeMention) return;

      const nextToken = buildReferenceToken(blog.title);
      const nextPrompt = `${prompt.slice(0, activeMention.start)}${nextToken}${prompt.slice(activeMention.end)}`;
      const nextCaretIndex = activeMention.start + nextToken.length;

      setPrompt(nextPrompt);
      setSelectedReferencedBlogs((current) =>
        current.some((entry) => entry._id === blog._id)
          ? current
          : [...current, blog],
      );
      setActiveMention(null);

      requestAnimationFrame(() => {
        promptTextareaRef.current?.focus();
        promptTextareaRef.current?.setSelectionRange(
          nextCaretIndex,
          nextCaretIndex,
        );
      });
    },
    [activeMention, prompt, setPrompt],
  );
  const handleRemoveReferencedBlog = useCallback((blogId: string) => {
    setSelectedReferencedBlogs((current) =>
      current.filter((entry) => entry._id !== blogId),
    );
  }, []);
  const handleMentionListScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      if (
        !hasNextPage ||
        isFetchingNextPage
      ) {
        return;
      }

      const container = event.currentTarget;
      const remaining =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      if (remaining <= MENTION_LIST_LOAD_MORE_THRESHOLD_PX) {
        void fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

  return (
    <>
      <aside className="flex h-full w-[400px] max-w-[500px] flex-col border-r-2 border-[#5649FF1A] bg-white pt-2 xl:w-[500px]">
        <div className="mx-2 flex items-center justify-between rounded-[20px] bg-[#eef0f3] px-2 py-3">
          <div className="flex min-w-0 items-center gap-1">
            <button
              onClick={onBack}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#4a4a4a] transition hover:bg-white/60"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-[18px] font-medium text-[#202020]">
                {agentName}
              </h1>
              <p className="truncate text-[11px] text-[#7a7a87]">
                {currentChat?.title ||
                  (selectedChatId
                    ? "Existing chat"
                    : "Start a new conversation")}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onConfigure}
            disabled={!canConfigure}
            className="flex items-center gap-2 rounded-full bg-[#5b4df7] px-4 py-2 text-xs text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50 xl:text-sm"
          >
            <Cog size={14} />
            Configure AI Foundation
          </button>
        </div>

        <div className="border-b border-[#edeef4] px-3 pb-3 pt-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8f8fa2]">
                Next message mode
              </p>
              <p className="mt-1 text-[12px] text-[#6e6e80]">
                {activeJob
                  ? `Current run is ${MODE_LABELS[activeJob.mode]}.`
                  : "Choose how the next message should be handled."}
              </p>
            </div>

            <div className="w-[120px] shrink-0">
              <Select
                value={mode}
                onValueChange={(value) => setMode(value as typeof mode)}
              >
                <SelectTrigger className="h-10 rounded-full border-[#dfdff0] bg-[#f7f7fb] text-[13px] text-[#353541]">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chat">Chat</SelectItem>
                  <SelectItem value="plan">Plan</SelectItem>
                  <SelectItem value="build">Build</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {activeJob ? (
            <div className="mt-3 flex items-center gap-2 rounded-[16px] border border-[#e5e3ff] bg-[#f4f2ff] px-3 py-2 text-[12px] text-[#4f46d6]">
              {isStopping ? (
                <Square size={12} className="fill-current" />
              ) : (
                <LoaderCircle size={14} className="animate-spin" />
              )}
              <span className="truncate">
                {isStopping
                  ? "Stopping current response"
                  : `Processing ${MODE_LABELS[activeJob.mode].toLowerCase()} request`}
                {activeJob.stage
                  ? ` - ${activeJob.stage.replace(/_/g, " ")}`
                  : ""}
              </span>
            </div>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-hidden px-3 pb-3 pt-3">
          <div ref={messagesContainerRef} className="h-full overflow-y-auto pr-1">
            {historyOpen ? (
              <div className="space-y-2">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-[13px] font-semibold text-[#30303a]">
                    Recent chats
                  </h2>
                  {isLoadingChats ? (
                    <span className="text-[11px] text-[#8b8b96]">Loading...</span>
                  ) : null}
                </div>

                {chats.length === 0 ? (
                  <div className="rounded-[18px] border border-dashed border-[#dfdff0] bg-[#fafaff] px-4 py-5 text-center text-[13px] text-[#89899a]">
                    No chats yet for this agent.
                  </div>
                ) : (
                  chats.map((chat) => {
                    const isSelected = chat._id === selectedChatId;
                    return (
                      <button
                        key={chat._id}
                        type="button"
                        disabled={isBusy}
                        onClick={() => setSelectedChatId(chat._id)}
                        className={cn(
                          "w-full rounded-[18px] border px-4 py-3 text-left transition",
                          isSelected
                            ? "border-[#5b4df7] bg-[#f4f2ff]"
                            : "border-[#ececf5] bg-white hover:border-[#d8d7eb] hover:bg-[#fafafe]",
                          isBusy && "cursor-not-allowed opacity-60",
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-[14px] font-medium text-[#22222b]">
                            {chat.title || "Untitled chat"}
                          </p>
                          {activeJob?.chatId === chat._id ? (
                            <span className="rounded-full bg-[#ece8ff] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#5649ff]">
                              Active
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-[11px] text-[#848495]">
                          {chat.updatedAt
                            ? new Date(chat.updatedAt).toLocaleString()
                            : "Just now"}
                        </p>
                      </button>
                    );
                  })
                )}
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center rounded-[24px] border border-dashed border-[#dfdff0] bg-[#fafaff] px-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#efeefe] text-[#5649FF]">
                  <Sparkles size={22} />
                </div>
                <h2 className="mt-4 text-[16px] font-semibold text-[#23232d]">
                  Ready when you are
                </h2>
                <p className="mt-2 max-w-[280px] text-[13px] leading-6 text-[#7e7e8d]">
                  {placeholder}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {isLoadingHistory ? (
                  <p className="text-[12px] text-[#8d8d99]">Loading chat...</p>
                ) : null}

                {messages.map((message) => {
                  const isUser = message.author.role === "internalAccount";
                  const text = getInkDChatMessageText(message);
                  const status = message.messageStatus?.status ?? null;
                  const isStreamingAssistant =
                    !isUser && message.stream?.state === "streaming";
                  const isCopied = copiedMessageId === message._id;

                  return (
                    <div
                      key={message._id}
                      className={cn(
                        "flex",
                        isUser ? "justify-end" : "justify-start",
                      )}
                    >
                      <div
                        className={cn(
                          "flex max-w-[84%] flex-col",
                          isUser ? "items-end" : "items-start",
                        )}
                      >
                        <div
                          className={cn(
                            "w-full rounded-[20px] px-4 py-3 text-[13px] leading-6 shadow-[0_1px_0_rgba(255,255,255,0.65)_inset]",
                            isUser
                              ? "bg-[#5649FF] text-white"
                              : "border border-[#ececf4] bg-[#f7f7fb] text-[#242430]",
                          )}
                        >
                          {text ? (
                            isUser ? (
                              <p className="whitespace-pre-wrap break-words">
                                {text}
                              </p>
                            ) : (
                              <MarkdownPreview
                                content={text}
                                className="break-words prose-p:text-[13px] prose-p:leading-6 prose-li:text-[13px] prose-li:leading-6 prose-ul:my-3 prose-ol:my-3 prose-pre:my-3 prose-h1:text-[21px] prose-h2:text-[18px] prose-h3:text-[16px]"
                              />
                            )
                          ) : isStreamingAssistant ? (
                            <div className="flex items-center gap-2 text-[#6a6a7b]">
                              <LoaderCircle size={14} className="animate-spin" />
                              <span>Thinking...</span>
                            </div>
                          ) : !isUser && message.stream?.state === "cancelled" ? (
                            <p className="text-[#6a6a7b]">Stopped</p>
                          ) : null}
                          <div
                            className={cn(
                              "mt-2 flex items-center justify-between gap-3 text-[10px]",
                              isUser ? "text-white/70" : "text-[#8c8c98]",
                            )}
                          >
                            <span>{formatBubbleTime(message.createdAt)}</span>
                            {status ? (
                              <span className="uppercase tracking-[0.08em]">
                                {status === "pending"
                                  ? "Pending"
                                  : status === "failure"
                                    ? "Failed"
                                    : status === "cancelled"
                                      ? "Stopped"
                                      : "Done"}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        {text ? (
                          <button
                            type="button"
                            onClick={() => void handleCopy(message._id, text)}
                            aria-label={isCopied ? "Copied" : "Copy message"}
                            title={isCopied ? "Copied" : "Copy message"}
                            className={cn(
                              "mt-2 inline-flex items-center rounded-full p-1.5 text-[11px] transition",
                              isUser
                                ? "justify-end text-[#5649FF] hover:bg-[#f0ebff]"
                                : "justify-start text-[#666677] hover:bg-[#f3f3f8]",
                            )}
                          >
                            {isCopied ? (
                              <CopyCheck size={13} />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesBottomRef} aria-hidden="true" />
              </div>
            )}
          </div>
        </div>

        <div className="relative border-t border-[#e8e8ed] p-3">
          {!historyOpen && messages.length > 0 ? (
            <button
              type="button"
              onClick={() => scrollToBottom("smooth")}
              aria-label="Scroll to bottom"
              title="Scroll to bottom"
              className={cn(
                "absolute left-1/2 top-0 z-10 flex h-9 w-9 -translate-x-1/2 -translate-y-[calc(100%+8px)] items-center justify-center rounded-full border border-[#dddaf7] bg-white text-[#5649FF] shadow-[0_8px_24px_rgba(86,73,255,0.12)] transition-all duration-200 ease-out hover:border-[#c9c3ff] hover:bg-[#f7f5ff]",
                showScrollToBottom
                  ? "pointer-events-auto scale-100 opacity-100"
                  : "pointer-events-none scale-95 opacity-0",
              )}
            >
              <ArrowDown size={16} />
            </button>
          ) : null}

          <div className="relative">
            {mentionPickerOpen ? (
              <div className="absolute bottom-full left-0 right-0 z-20 mb-2 overflow-hidden rounded-[20px] border border-[#dddff0] bg-white shadow-[0_20px_45px_rgba(31,35,53,0.12)]">
                <div className="border-b border-[#edf0f6] px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8c90a2]">
                    Reference a blog
                  </p>
                  <p className="mt-1 text-[12px] text-[#666b7d]">
                    {mentionQuery.trim()
                      ? `Showing results for @${mentionQuery.trim()}`
                      : "Type after @ or pick from recent blogs."}
                  </p>
                </div>

                <div
                  className="max-h-[260px] overflow-y-auto"
                  onScroll={handleMentionListScroll}
                >
                  {isReferenceBlogsLoading ? (
                    <div className="flex items-center gap-2 px-4 py-4 text-[13px] text-[#6b7083]">
                      <LoaderCircle size={14} className="animate-spin" />
                      Loading blogs...
                    </div>
                  ) : mentionBlogs.length === 0 ? (
                    <div className="px-4 py-4 text-[13px] text-[#8c90a2]">
                      No blogs found for this agent.
                    </div>
                  ) : (
                    mentionBlogs.map((blog, index) => (
                      <button
                        key={blog._id}
                        type="button"
                        onClick={() => handleSelectReferencedBlog(blog)}
                        className={cn(
                          "w-full border-b border-[#f1f3f8] px-4 py-3 text-left last:border-b-0",
                          highlightedMentionIndex === index
                            ? "bg-[#f4f2ff]"
                            : "bg-white hover:bg-[#f8f8fc]",
                        )}
                      >
                        <p className="truncate text-[13px] font-medium text-[#242430]">
                          {blog.title}
                        </p>
                        <p className="mt-1 text-[12px] leading-5 text-[#767b8f]">
                          {truncateDescription(blog.description)}
                        </p>
                      </button>
                    ))
                  )}

                  {isFetchingNextPage ? (
                    <div className="flex items-center justify-center gap-2 px-4 py-3 text-[12px] text-[#7c8195]">
                      <LoaderCircle size={13} className="animate-spin" />
                      Loading more...
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="rounded-[18px] bg-[#f2f2f6]">
              <Textarea
                ref={promptTextareaRef}
                value={prompt}
                onChange={(event) => {
                  const nextPrompt = event.target.value;
                  setPrompt(nextPrompt);
                  syncMentionFromValue(
                    nextPrompt,
                    event.target.selectionStart,
                  );
                }}
                onSelect={handleComposerSelection}
                onClick={handleComposerSelection}
                onKeyUp={handleComposerSelection}
                onKeyDown={(event) => {
                  if (mentionPickerOpen && mentionBlogs.length > 0) {
                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      setHighlightedMentionIndex((current) =>
                        current + 1 >= mentionBlogs.length ? 0 : current + 1,
                      );
                      return;
                    }

                    if (event.key === "ArrowUp") {
                      event.preventDefault();
                      setHighlightedMentionIndex((current) =>
                        current - 1 < 0 ? mentionBlogs.length - 1 : current - 1,
                      );
                      return;
                    }

                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      const blog =
                        mentionBlogs[
                          Math.min(highlightedMentionIndex, mentionBlogs.length - 1)
                        ];
                      if (blog) {
                        handleSelectReferencedBlog(blog);
                      }
                      return;
                    }
                  }

                  if (event.key === "Escape" && mentionPickerOpen) {
                    event.preventDefault();
                    setActiveMention(null);
                    return;
                  }

                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void handleSubmit();
                  }
                }}
                placeholder={placeholder}
                disabled={isBusy || !inkdInternalAgentId}
                className="min-h-[112px] resize-none rounded-[18px] bg-transparent px-4 py-4 text-[14px] text-[#1f1f27] placeholder:text-[#9a9aa8]"
              />
            </div>
          </div>

          {selectedReferencedBlogs.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedReferencedBlogs.map((blog) => (
                <span
                  key={blog._id}
                  className="inline-flex items-center gap-1 rounded-full bg-[#ececff] px-3 py-1 text-[12px] text-[#5649FF]"
                >
                  <span className="max-w-[220px] truncate">{blog.title}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveReferencedBlog(blog._id)}
                    className="rounded-full text-[#5649FF]/80 transition hover:text-[#4338ca]"
                    aria-label={`Remove ${blog.title}`}
                    title={`Remove ${blog.title}`}
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isBusy || !inkdInternalAgentId}
                onClick={() => setHistoryOpen((current) => !current)}
                className="flex items-center gap-1 rounded-full bg-[#ececff] px-3 py-1.5 text-sm text-[#5649FF] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <MessageSquareText size={17} className="pt-1" />
                {historyOpen ? "Close history" : "History"}
              </button>

              <button
                type="button"
                disabled={isBusy || !inkdInternalAgentId}
                onClick={startNewChat}
                className="rounded-full bg-[#ececff] px-3 py-1.5 text-sm text-[#5649FF] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Start new chat
              </button>

              <button
                type="button"
                disabled={!canOpenDraft || isBusy}
                onClick={() => setDraftModalOpen(true)}
                className="inline-flex items-center gap-1 rounded-full bg-[#eef1f6] px-3 py-1.5 text-sm text-[#374151] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FileText size={15} />
                View draft
              </button>

              <button
                type="button"
                disabled={!canPostDraft}
                onClick={() => void handlePostDraft()}
                className="inline-flex items-center gap-1 rounded-full bg-[#e9f9ef] px-3 py-1.5 text-sm text-[#147a3f] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPostingDraft ? (
                  <LoaderCircle size={15} className="animate-spin" />
                ) : (
                  <Send size={15} />
                )}
                {isPostingDraft
                  ? "Posting..."
                  : isDraftAlreadyPosted
                    ? "Posted"
                    : "Post blog"}
              </button>
            </div>

            {activeJob ? (
              <button
                type="button"
                disabled={isStopping || !inkdInternalAgentId}
                onClick={() => void stop()}
                className="flex h-11 w-16 items-center justify-center rounded-full bg-[#ef4444] text-white transition hover:bg-[#dc2626] disabled:cursor-not-allowed disabled:opacity-60"
                aria-label={isStopping ? "Stopping response" : "Stop response"}
                title={isStopping ? "Stopping response" : "Stop response"}
              >
                {isStopping ? (
                  <LoaderCircle size={18} className="animate-spin" />
                ) : (
                  <Square size={16} className="fill-current" />
                )}
              </button>
            ) : (
              <button
                type="button"
                disabled={isBusy || !prompt.trim() || !inkdInternalAgentId}
                onClick={() => void handleSubmit()}
                className="flex h-11 w-16 items-center justify-center rounded-full bg-[#5649FF] text-white transition hover:bg-[#4f42f4] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <LoaderCircle size={18} className="animate-spin" />
                ) : (
                  <ArrowUp size={20} />
                )}
              </button>
            )}
          </div>
        </div>
      </aside>

      <Dialog open={draftModalOpen} onOpenChange={setDraftModalOpen}>
        <DialogContent className="max-w-4xl rounded-[28px] border border-[#e6e8f1] bg-white p-0">
          <DialogHeader className="border-b border-[#eceff6] px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="text-[20px] text-[#1f2430]">
                  {draftBlog?.title?.trim() || "Draft blog"}
                </DialogTitle>
                <p className="mt-2 text-[13px] text-[#6e7386]">
                  {hasDraftBlog
                    ? `Version ${draftBlog?.version ?? 1}${draftBlog?.postedVersion ? ` - last posted version ${draftBlog.postedVersion}` : ""}`
                    : "No draft is available for this chat yet."}
                </p>
              </div>

              {hasDraftBlog ? (
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]",
                    isDraftAlreadyPosted
                      ? "bg-[#e9f9ef] text-[#147a3f]"
                      : "bg-[#f4f2ff] text-[#5649FF]",
                  )}
                >
                  {isDraftAlreadyPosted ? "Posted" : "Draft ready"}
                </span>
              ) : null}
            </div>
          </DialogHeader>

          <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
            {hasDraftBlog ? (
              <div className="space-y-5">
                <div className="rounded-[20px] bg-[#f7f8fc] p-4">
                  <div className="flex flex-wrap items-center gap-2 text-[12px] text-[#666b7d]">
                    <span className="rounded-full bg-white px-3 py-1 text-[#303446]">
                      Linked trials: {draftTrials.length}
                    </span>
                    {draftBlog?.postedAt ? (
                      <span className="rounded-full bg-white px-3 py-1 text-[#303446]">
                        Posted on {new Date(draftBlog.postedAt).toLocaleString()}
                      </span>
                    ) : null}
                  </div>
                </div>

                <MarkdownPreview
                  content={draftBlog?.content ?? ""}
                  className="prose-p:text-[14px] prose-p:leading-7 prose-li:text-[14px] prose-li:leading-7"
                />
              </div>
            ) : (
              <div className="rounded-[20px] border border-dashed border-[#dde1ef] bg-[#fafbff] px-5 py-8 text-center text-[14px] text-[#7b8093]">
                Build a draft in this chat first, then you can preview or post it from here.
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-[#eceff6] px-6 py-4 sm:justify-between">
            <p className="text-[12px] text-[#7b8093]">
              {hasDraftBlog && !hasDraftTrials
                ? "This draft still needs trials before it can be posted."
                : isDraftAlreadyPosted
                  ? "This draft version has already been posted."
                  : 'Use "Post blog" to publish the latest saved draft.'}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDraftModalOpen(false)}
                className="rounded-full border border-[#d7dceb] px-4 py-2 text-sm text-[#3f4658] transition hover:bg-[#f6f7fb]"
              >
                Close
              </button>
              <button
                type="button"
                disabled={!canPostDraft}
                onClick={() => void handlePostDraft()}
                className="inline-flex items-center gap-2 rounded-full bg-[#147a3f] px-4 py-2 text-sm text-white transition hover:bg-[#126a37] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPostingDraft ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                {isPostingDraft ? "Posting..." : "Post blog"}
              </button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
