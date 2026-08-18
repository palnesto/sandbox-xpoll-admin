import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity, ChevronLeft, ChevronRight, Clock3, Filter, LoaderCircle, RefreshCw } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { endpoints } from "@/api/endpoints";
import ListingPagination from "@/components/commons/listing-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiQuery } from "@/hooks/useApiQuery";
import { cn } from "@/lib/utils";
import { utcToAdminFormatted, utcToAdminTimeWithZone } from "@/utils/time";

type QueueTaskRunState =
  | "enqueue_pending"
  | "queued"
  | "running"
  | "cancelled"
  | "succeeded"
  | "failed"
  | "enqueue_failed";

type BullMqJobRunEntry = {
  _id: string;
  jobId: string;
  taskType: string;
  state: QueueTaskRunState;
  attemptCount: number;
  failedAttempts: number;
  claimedByWorkerId: string | null;
  claimedUntilUtc: string | null;
  lastHeartbeatAt: string | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  cancelledAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  bullmq: {
    queueName: string | null;
    attemptsConfigured: number | null;
    attemptsMade: number;
    lastObservedState: string | null;
    lastEventName: string | null;
    lastEventAt: string | null;
  };
};

type BullMqJobRunsData = {
  entries: BullMqJobRunEntry[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MANUAL_REFRESH_DEBOUNCE_MS = 800;
const PAGE_SIZE_OPTIONS = ["20", "50", "100"] as const;
const TASK_TYPE_OPTIONS = [
  { value: "inkd.chat.process", label: "InkD Chat Process" },
  { value: "invoice.generateUpload", label: "Invoice Generate Upload" },
  { value: "llm.query.generate", label: "LLM Query Generate" },
  { value: "poll.embed.bulkArchive", label: "Poll Embed Bulk Archive" },
  { value: "poll.embed.bulkCreate", label: "Poll Embed Bulk Create" },
  { value: "poll.embed.edit", label: "Poll Embed Edit" },
] as const;

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parsePageSize(value: string | null) {
  const parsed = String(parsePositiveInt(value, DEFAULT_PAGE_SIZE));
  return PAGE_SIZE_OPTIONS.includes(parsed as (typeof PAGE_SIZE_OPTIONS)[number])
    ? Number(parsed)
    : DEFAULT_PAGE_SIZE;
}

function parseTaskTypeCsv(value: string | null) {
  const allowed = new Set(TASK_TYPE_OPTIONS.map((option) => option.value));
  return Array.from(
    new Set(
      String(value ?? "")
        .split(",")
        .map((entry) => entry.trim())
        .filter((entry) => entry && allowed.has(entry)),
    ),
  );
}

function getTaskTypeLabel(taskType: string) {
  return TASK_TYPE_OPTIONS.find((option) => option.value === taskType)?.label ?? taskType;
}

function getStatusLabel(state: QueueTaskRunState) {
  if (state === "enqueue_pending") return "Enqueue Pending";
  if (state === "queued") return "Queued";
  if (state === "running") return "Running";
  if (state === "cancelled") return "Cancelled";
  if (state === "succeeded") return "Succeeded";
  if (state === "failed") return "Failed";
  return "Enqueue Failed";
}

function getStatusBadgeClass(state: QueueTaskRunState) {
  if (state === "running") return "border-[#4b8ef6]/40 bg-[#4b8ef6]/15 text-[#7db4ff]";
  if (state === "queued") return "border-[#625df5]/40 bg-[#625df5]/15 text-[#9d9bff]";
  if (state === "enqueue_pending") return "border-[#8e5cf7]/40 bg-[#8e5cf7]/15 text-[#c79dff]";
  if (state === "cancelled") return "border-[#8b95a7]/35 bg-[#8b95a7]/12 text-[#c6cfdd]";
  if (state === "succeeded") return "border-[#2d9b54]/30 bg-[#2d9b54]/12 text-[#7adf9f]";
  if (state === "failed") return "border-[#e95b35]/30 bg-[#e95b35]/12 text-[#ffab8e]";
  return "border-[#d24c74]/30 bg-[#d24c74]/12 text-[#ff9db9]";
}

function getRowClass(state: QueueTaskRunState) {
  if (state === "running") return "bg-[#0f1d38]/45 hover:bg-[#122348]/55";
  if (state === "queued") return "bg-[#151338]/40 hover:bg-[#1a1848]/55";
  if (state === "enqueue_pending") return "bg-[#26143c]/35 hover:bg-[#311953]/50";
  return "";
}

function getDisplayedTimestamp(entry: BullMqJobRunEntry) {
  return (
    entry.lastHeartbeatAt ??
    entry.bullmq.lastEventAt ??
    entry.updatedAt ??
    entry.cancelledAt ??
    entry.completedAt ??
    entry.failedAt ??
    entry.createdAt
  );
}

function formatTimestamp(value: string | null) {
  if (!value) return "—";
  const formatted = utcToAdminFormatted(value);
  return formatted || "—";
}

function formatTimeZoneLabel(value: string | null) {
  if (!value) return null;
  const formatted = utcToAdminTimeWithZone(value);
  return formatted || null;
}

function trimMessage(value: string | null | undefined, maxLength = 120) {
  const normalized = String(value ?? "").trim().replace(/\s+/g, " ");
  if (!normalized) return "—";
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

export default function BullMqJobRunsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const manualRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isManualRefreshQueued, setIsManualRefreshQueued] = useState(false);

  const page = parsePositiveInt(searchParams.get("page"), DEFAULT_PAGE);
  const pageSize = parsePageSize(searchParams.get("pageSize"));
  const selectedTaskTypes = useMemo(() => parseTaskTypeCsv(searchParams.get("taskTypeCSV")), [searchParams]);

  const setParams = useCallback(
    (patch: Record<string, string | null>, resetPage = false) => {
      const next = new URLSearchParams(searchParams);

      if (resetPage) {
        next.set("page", "1");
      }

      Object.entries(patch).forEach(([key, value]) => {
        if (!value) {
          next.delete(key);
          return;
        }
        next.set(key, value);
      });

      setSearchParams(next);
    },
    [searchParams, setSearchParams],
  );

  const route = useMemo(
    () =>
      endpoints.entities.queues.bullMqJobRuns({
        page,
        pageSize,
        taskTypeCSV: selectedTaskTypes.length ? selectedTaskTypes.join(",") : undefined,
      }),
    [page, pageSize, selectedTaskTypes],
  );

  const { data, isLoading, isFetching, error, refetch } = useApiQuery(route, {
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  } as any);

  const payload = (data?.data?.data ?? {
    entries: [],
    meta: {
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    },
  }) as BullMqJobRunsData;

  const entries = Array.isArray(payload.entries) ? payload.entries : [];
  const total = typeof payload.meta?.total === "number" ? payload.meta.total : 0;
  const totalPages =
    typeof payload.meta?.totalPages === "number" && payload.meta.totalPages > 0
      ? payload.meta.totalPages
      : Math.max(1, Math.ceil((total || 1) / pageSize));
  const currentPage =
    typeof payload.meta?.page === "number" && payload.meta.page > 0 ? payload.meta.page : page;

  const toggleTaskType = useCallback(
    (taskType: string) => {
      const next = selectedTaskTypes.includes(taskType)
        ? selectedTaskTypes.filter((value) => value !== taskType)
        : [...selectedTaskTypes, taskType].sort();

      setParams(
        {
          taskTypeCSV: next.length ? next.join(",") : null,
        },
        true,
      );
    },
    [selectedTaskTypes, setParams],
  );

  const clearTaskTypes = useCallback(() => {
    setParams({ taskTypeCSV: null }, true);
  }, [setParams]);

  const scheduleManualRefresh = useCallback(() => {
    if (manualRefreshTimerRef.current) {
      clearTimeout(manualRefreshTimerRef.current);
    }

    setIsManualRefreshQueued(true);
    manualRefreshTimerRef.current = setTimeout(() => {
      manualRefreshTimerRef.current = null;
      setIsManualRefreshQueued(false);
      void refetch();
    }, MANUAL_REFRESH_DEBOUNCE_MS);
  }, [refetch]);

  useEffect(() => {
    return () => {
      if (manualRefreshTimerRef.current) {
        clearTimeout(manualRefreshTimerRef.current);
        manualRefreshTimerRef.current = null;
      }
    };
  }, []);

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6">
      <section className="rounded-3xl border border-zinc-800 bg-sidebar p-6 shadow-[0_18px_50px_rgba(0,0,0,0.16)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#4b8ef6]/30 bg-[#4b8ef6]/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#7db4ff]">
              <Activity size={12} />
              Queues
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-white">BullMQ Job Runs</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                Live dashboard for the shared BullMQ queue. Active jobs surface first, and the table refreshes
                automatically every 5 seconds.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={isFetching || isManualRefreshQueued}
              onClick={scheduleManualRefresh}
              className="gap-2 border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
            >
              {isFetching || isManualRefreshQueued ? (
                <LoaderCircle size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
              {isManualRefreshQueued ? "Refresh queued…" : isFetching ? "Refreshing…" : "Refresh now"}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800">
                  <Filter size={14} />
                  Task Types
                  {selectedTaskTypes.length ? ` (${selectedTaskTypes.length})` : ""}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 bg-zinc-950 text-zinc-100">
                <DropdownMenuLabel>Filter by task type</DropdownMenuLabel>
                <DropdownMenuItem onSelect={(event) => {
                  event.preventDefault();
                  clearTaskTypes();
                }}>
                  Show all task types
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {TASK_TYPE_OPTIONS.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={selectedTaskTypes.includes(option.value)}
                    onCheckedChange={() => toggleTaskType(option.value)}
                  >
                    {option.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="w-[120px]">
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  setParams({
                    pageSize: value,
                    page: "1",
                  });
                }}
              >
                <SelectTrigger className="h-10 border-zinc-700 bg-zinc-900 text-zinc-100">
                  <SelectValue placeholder="Page size" />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value} / page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Badge className="rounded-full border-zinc-700 bg-zinc-900 px-3 py-1 text-zinc-200">
            {total} total job{total === 1 ? "" : "s"}
          </Badge>
          <Badge className="rounded-full border-zinc-700 bg-zinc-900 px-3 py-1 text-zinc-200">
            Page {currentPage} of {Math.max(1, totalPages)}
          </Badge>
          <Badge className="rounded-full border-[#4b8ef6]/30 bg-[#4b8ef6]/10 px-3 py-1 text-[#7db4ff]">
            <span className="mr-2 inline-flex h-2 w-2 rounded-full bg-current" />
            Refresh every 5s
          </Badge>
          <div className="inline-flex items-center gap-2 text-xs text-zinc-400">
            {isFetching ? <LoaderCircle size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {isFetching ? "Refreshing…" : "Live updates enabled"}
          </div>
        </div>

        {selectedTaskTypes.length ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {selectedTaskTypes.map((taskType) => (
              <Badge
                key={taskType}
                className="cursor-pointer rounded-full border-[#625df5]/30 bg-[#625df5]/12 px-3 py-1 text-[#aca8ff]"
                onClick={() => toggleTaskType(taskType)}
              >
                {getTaskTypeLabel(taskType)} ×
              </Badge>
            ))}
            <button
              type="button"
              onClick={clearTaskTypes}
              className="text-xs font-medium text-zinc-400 transition hover:text-white"
            >
              Clear filters
            </button>
          </div>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-3xl border border-zinc-800 bg-sidebar shadow-[0_18px_50px_rgba(0,0,0,0.16)]">
        {error ? (
          <div className="px-6 py-10 text-sm text-red-300">
            Failed to load BullMQ job runs. Please retry or check the backend logs.
          </div>
        ) : isLoading ? (
          <div className="flex items-center gap-3 px-6 py-10 text-sm text-zinc-300">
            <LoaderCircle size={18} className="animate-spin" />
            Loading BullMQ job runs…
          </div>
        ) : entries.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-base font-medium text-white">No BullMQ job runs found</p>
            <p className="mt-2 text-sm text-zinc-400">
              Adjust the task-type filter or wait for the next queue activity.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-zinc-900/90">
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="px-4 text-zinc-400">Job</TableHead>
                <TableHead className="px-4 text-zinc-400">Status</TableHead>
                <TableHead className="px-4 text-zinc-400">Attempts</TableHead>
                <TableHead className="px-4 text-zinc-400">Worker / Lease</TableHead>
                <TableHead className="px-4 text-zinc-400">Latest Activity</TableHead>
                <TableHead className="px-4 text-zinc-400">Last Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => {
                const activityAt = getDisplayedTimestamp(entry);
                const activityTimeZone = formatTimeZoneLabel(activityAt);

                return (
                  <TableRow key={entry._id} className={cn("border-zinc-800/80", getRowClass(entry.state))}>
                    <TableCell className="px-4 py-4 align-top">
                      <div className="space-y-1.5">
                        <p className="font-medium text-white">{getTaskTypeLabel(entry.taskType)}</p>
                        <p className="break-all font-mono text-[11px] text-zinc-400">{entry.jobId}</p>
                        <p className="text-[11px] text-zinc-500">Created {formatTimestamp(entry.createdAt)}</p>
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-4 align-top">
                      <div className="space-y-2">
                        <Badge className={cn("rounded-full px-3 py-1 text-[11px]", getStatusBadgeClass(entry.state))}>
                          {getStatusLabel(entry.state)}
                        </Badge>
                        <div className="text-[11px] text-zinc-500">
                          Event: {entry.bullmq.lastEventName ?? "—"}
                          {entry.bullmq.lastObservedState ? ` • ${entry.bullmq.lastObservedState}` : ""}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-4 align-top">
                      <div className="space-y-1 text-sm text-zinc-200">
                        <p>
                          {entry.attemptCount} total
                          {typeof entry.bullmq.attemptsConfigured === "number"
                            ? ` / ${entry.bullmq.attemptsConfigured} configured`
                            : ""}
                        </p>
                        <p className="text-[12px] text-zinc-400">
                          BullMQ attempts made: {entry.bullmq.attemptsMade}
                        </p>
                        <p className="text-[12px] text-zinc-400">Failed attempts: {entry.failedAttempts}</p>
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-4 align-top">
                      <div className="space-y-1 text-sm text-zinc-200">
                        <p className="font-mono text-[12px] text-zinc-300">
                          {entry.claimedByWorkerId ? trimMessage(entry.claimedByWorkerId, 32) : "No worker lease"}
                        </p>
                        <p className="text-[12px] text-zinc-400">
                          Lease until: {formatTimestamp(entry.claimedUntilUtc)}
                        </p>
                        <p className="text-[12px] text-zinc-400">
                          Heartbeat: {formatTimestamp(entry.lastHeartbeatAt)}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-4 align-top">
                      <div className="space-y-1 text-sm text-zinc-200">
                        <div className="inline-flex items-center gap-2">
                          <Clock3 size={14} className="text-zinc-500" />
                          <span>{formatTimestamp(activityAt)}</span>
                        </div>
                        <p className="text-[12px] text-zinc-400">{activityTimeZone ?? "—"}</p>
                        {entry.completedAt ? (
                          <p className="text-[12px] text-[#7adf9f]">Completed {formatTimestamp(entry.completedAt)}</p>
                        ) : null}
                        {entry.failedAt ? (
                          <p className="text-[12px] text-[#ffab8e]">Failed {formatTimestamp(entry.failedAt)}</p>
                        ) : null}
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-4 align-top">
                      {entry.lastErrorMessage ? (
                        <div className="space-y-1">
                          <p className="text-sm text-[#ffb39a]">{trimMessage(entry.lastErrorMessage)}</p>
                          <p className="text-[11px] text-zinc-500">{entry.lastErrorCode ?? "QUEUE_ERROR"}</p>
                        </div>
                      ) : (
                        <span className="text-sm text-zinc-500">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </section>

      <section className="mt-2 flex flex-col gap-4 rounded-3xl border border-zinc-800 bg-sidebar px-4 py-4 shadow-[0_12px_36px_rgba(0,0,0,0.14)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-zinc-400">
            Showing page <span className="font-medium text-zinc-100">{currentPage}</span> of{" "}
            <span className="font-medium text-zinc-100">{Math.max(1, totalPages)}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canGoPrevious}
              onClick={() => {
                if (!canGoPrevious) return;
                setParams({ page: String(currentPage - 1) });
              }}
              className="gap-1 border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
            >
              <ChevronLeft size={14} />
              Previous
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canGoNext}
              onClick={() => {
                if (!canGoNext) return;
                setParams({ page: String(currentPage + 1) });
              }}
              className="gap-1 border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
            >
              Next
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>

        <ListingPagination
          page={currentPage}
          totalPages={totalPages}
          onPageChange={(nextPage) => {
            setParams({ page: String(nextPage) });
          }}
          variant="primary"
          className="mx-auto flex w-fit justify-center rounded-2xl bg-zinc-950/60 px-2 py-3"
        />
      </section>
    </div>
  );
}
