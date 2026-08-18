import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Eye,
  Layers3,
  PieChart,
  RefreshCw,
  Share2,
  Users,
} from "lucide-react";
import apiInstance from "@/api/queryClient";
import { endpoints } from "@/api/endpoints";
import { FullScreenLoader } from "@/components/full-screen-loader";
import { useApiQuery } from "@/hooks/useApiQuery";
import { amount, unwrapString } from "@/utils/currency-assets/base";
import { assetSpecs, type AssetType } from "@/utils/currency-assets/asset";
import { LEVELS } from "@/utils/levelConfig";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type RewardTotalsEntry = {
  assetId: string;
  amount: string;
};

type BlogLevelRow = {
  seens: number;
  participation: number;
  totalShares: number;
  uniqueShares: number;
};

type TrialLevelRow = {
  participation: number;
  rewardsDistributed: RewardTotalsEntry[];
};

type PollOptionRow = {
  optionId: string;
  optionText: string;
  votes: number;
  percentage: number;
};

type PollAnalyticsRow = {
  pollId: string;
  pollTitle: string | null;
  options: PollOptionRow[];
};

type TrialPollGroup = {
  trialId: string;
  trialTitle: string | null;
  totalParticipation: number;
  rewardDistribution: RewardTotalsEntry[];
  levelWise?: Record<string, TrialLevelRow>;
  polls: PollAnalyticsRow[];
};

function RewardTotalsChips({ rows }: { rows?: RewardTotalsEntry[] }) {
  if (!rows?.length) {
    return (
      <div className="rounded-[14px] bg-[#f5f5f7] px-3 py-2 text-[13px] text-[#7e7e86]">
        No rewards distributed yet.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {rows.map((row) => {
        const assetId = row.assetId as AssetType;
        const meta = assetSpecs[assetId];
        const parentAmount = meta
          ? unwrapString(
              amount({
                op: "toParent",
                assetId,
                value: row.amount,
                output: "string",
                trim: true,
                group: true,
              }),
              "0",
            )
          : String(row.amount ?? "0");

        return (
          <span
            key={`${row.assetId}-${row.amount}`}
            className="inline-flex items-center gap-2 rounded-full border border-[#ececef] bg-[#f8f9fa] px-3 py-1.5 text-[13px] font-medium text-[#202024]"
          >
            {meta?.img ? (
              <img
                src={meta.img}
                alt={meta.parent || row.assetId}
                className="h-4 w-4 object-contain"
              />
            ) : null}
            <span>
              {parentAmount} {meta?.parent ?? row.assetId}
            </span>
          </span>
        );
      })}
    </div>
  );
}

function SummaryStatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-[20px] border border-[#ececef] bg-white p-5 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset]">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#f1f2f8] text-[#727DD5]">
        {icon}
      </div>
      <p className="text-[13px] uppercase tracking-[0.18em] text-[#8a8a91]">
        {label}
      </p>
      <p className="mt-2 text-[34px] leading-none text-[#202024]">{value}</p>
    </div>
  );
}

function LevelCard({
  level,
  image,
  title,
  items,
}: {
  level: string;
  image?: string;
  title?: string;
  items: { label: string; value: number | string }[];
}) {
  return (
    <div className="rounded-[18px] border border-[#ececef] bg-white p-4 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {image ? (
            <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#f5f7fb]">
              <img
                src={image}
                alt={title || `Level ${level}`}
                className="h-9 w-9 object-contain"
              />
            </div>
          ) : null}
          <div>
            <span className="inline-flex rounded-full bg-[#ececec] px-3 py-1 text-[12px] font-medium uppercase tracking-[0.16em] text-[#5f5f68]">
              Level {level}
            </span>
            {title ? (
              <p className="mt-2 text-[15px] font-medium text-[#202024]">
                {title}
              </p>
            ) : null}
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={`${level}-${item.label}`}
            className="flex items-center justify-between gap-3 text-[14px]"
          >
            <span className="text-[#7e7e86]">{item.label}</span>
            <span className="font-medium text-[#202024]">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function InkDAnalyticsDetailPage() {
  const navigate = useNavigate();
  const { inkdBlogId = "" } = useParams<{ inkdBlogId: string }>();
  const [includeArchived, setIncludeArchived] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const analyticsRoute = useMemo(
    () =>
      endpoints.entities.inkd.blogs.analytics(inkdBlogId, {
        includeArchived: String(includeArchived),
      }),
    [inkdBlogId, includeArchived],
  );

  const blogRoute = inkdBlogId
    ? endpoints.entities.inkd.blogs.getById(inkdBlogId)
    : "";

  const { data: blogData } = useApiQuery(blogRoute, {
    enabled: Boolean(blogRoute),
    key: ["inkd-blog-analytics-header", blogRoute],
  } as any);

  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useApiQuery(analyticsRoute, {
    enabled: Boolean(inkdBlogId),
    key: ["inkd-blog-analytics", analyticsRoute],
  } as any);

  const analytics = data?.data?.data ?? null;
  const blog = blogData?.data?.data ?? null;
  const blogTitle = blog?.title ?? "InkD blog analytics";
  const blogLevelWise = (analytics?.blog?.levelWise ?? {}) as Record<
    string,
    BlogLevelRow
  >;
  const trialLevelWise = (analytics?.trials?.levelWise ?? {}) as Record<
    string,
    TrialLevelRow
  >;
  const trialEntries = (
    analytics?.trials?.byTrial ?? analytics?.polls?.byTrial ?? []
  ) as TrialPollGroup[];
  const levels = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
  const levelConfigById = useMemo(
    () =>
      new Map(
        LEVELS.filter((level) => !level.isHidden).map((level) => [
          String(level.id),
          level,
        ]),
      ),
    [],
  );

  const backToBlogRoute =
    blog?.createdByInkdInternalAgentId && inkdBlogId
      ? `/inkd/inkd-internal-agents/details/${blog.createdByInkdInternalAgentId}/inkd-blogs/details/${inkdBlogId}`
      : "/inkd";

  async function handleRefresh() {
    if (!inkdBlogId) return;

    setIsRefreshing(true);
    try {
      await apiInstance.get(
        endpoints.entities.inkd.blogs.analytics(inkdBlogId, {
          includeArchived: String(includeArchived),
          refresh: "true",
        }),
      );
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }

  if (isLoading && !analytics && !blog) {
    return <FullScreenLoader />;
  }

  return (
    <div className="min-h-screen w-full bg-white px-4 pb-16 pt-4 md:px-6 xl:px-8 2xl:px-10">
      <div className="mx-auto w-full max-w-[1880px]">
      <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                blog?.createdByInkdInternalAgentId
                  ? navigate(backToBlogRoute)
                  : navigate(-1)
              }
              className="flex h-[34px] w-[50px] items-center justify-center rounded-full border-b-2 border-b-white bg-[#ececec] text-[#2a2a2a]"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="rounded-full bg-[#ececec] px-4 py-2 text-[13px] uppercase tracking-[0.18em] text-[#5f5f68]">
              InkD analytics
            </div>
            {(isFetching || isRefreshing) && (
              <div className="rounded-full border border-[#d9dcf0] bg-[#f5f6ff] px-4 py-2 text-[12px] font-medium text-[#5d67bf]">
                Updating snapshot...
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-[28px] border border-[#e7eaf2] bg-[linear-gradient(135deg,#e9edf8_0%,#eef2fb_58%,#e4e9f2_100%)] p-6 shadow-[0_10px_28px_rgba(17,24,39,0.06)] md:p-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#727DD5] shadow-sm">
              <BarChart3 size={22} />
            </div>
            <p className="text-[13px] uppercase tracking-[0.22em] text-[#8a8a91]">
              Blog performance
            </p>
            <h1 className="mt-3 text-[30px] font-normal uppercase leading-[1.1] text-[#1a1a1d]">
              {blogTitle}
            </h1>
          </div>
        </div>

        <div className="flex w-full max-w-[430px] flex-col gap-3 rounded-[28px] border border-[#e7eaf2] bg-[#eef1f7] p-4 shadow-[0_10px_28px_rgba(17,24,39,0.06)]">
          <div className="rounded-[18px] bg-[#f3f4f7] p-1">
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => setIncludeArchived(false)}
                className={`rounded-[14px] px-4 py-3 text-[13px] font-medium transition-all duration-200 ${
                  !includeArchived
                    ? "bg-white text-[#202024] shadow-sm"
                    : "text-[#7e7e86]"
                }`}
              >
                Active only
              </button>
              <button
                type="button"
                onClick={() => setIncludeArchived(true)}
                className={`rounded-[14px] px-4 py-3 text-[13px] font-medium transition-all duration-200 ${
                  includeArchived
                    ? "bg-white text-[#202024] shadow-sm"
                    : "text-[#7e7e86]"
                }`}
              >
                Include archived
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex h-[44px] items-center justify-center gap-2 rounded-full bg-[#727DD5] px-4 text-[15px] text-white transition-all duration-300 hover:bg-[#5765c2] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <RefreshCw
              size={16}
              className={isRefreshing ? "animate-spin" : undefined}
            />
            Refresh analytics
          </button>
        </div>
      </div>

      {!analytics ? (
        <div className="rounded-[28px] border border-[#e7eaf2] bg-[#eef1f7] p-8 text-center shadow-[0_10px_28px_rgba(17,24,39,0.06)]">
          <p className="text-[18px] text-[#202024]">Analytics unavailable.</p>
          <p className="mt-2 text-[14px] text-[#7e7e86]">
            Try refreshing the page or recomputing the snapshot.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <SummaryStatCard
              icon={<Eye size={18} />}
              label="Total views"
              value={analytics.blog.totalSeens}
            />
            <SummaryStatCard
              icon={<Activity size={18} />}
              label="Participation"
              value={analytics.blog.totalParticipation}
            />
            <SummaryStatCard
              icon={<Share2 size={18} />}
              label="Total shares"
              value={analytics.blog.totalShares}
            />
            <SummaryStatCard
              icon={<Users size={18} />}
              label="Unique shares"
              value={analytics.blog.totalUniqueShares}
            />
          </div>

          <div className="mt-10 rounded-[28px] border border-[#e7eaf2] bg-[#eef1f7] p-5 shadow-[0_10px_28px_rgba(17,24,39,0.06)] md:p-6">
            <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[13px] uppercase tracking-[0.2em] text-[#8a8a91]">
                  Blog signals
                </p>
                <h2 className="mt-2 text-[24px] text-[#202024]">
                  Level-wise reach and sharing
                </h2>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {levels.map((level) => {
                const row = blogLevelWise[level] ?? {
                  seens: 0,
                  participation: 0,
                  totalShares: 0,
                  uniqueShares: 0,
                };

                return (
                  <LevelCard
                    key={level}
                    level={level}
                    image={levelConfigById.get(level)?.image}
                    title={levelConfigById.get(level)?.title}
                    items={[
                      { label: "Views", value: row.seens },
                      { label: "Participation", value: row.participation },
                      { label: "Total shares", value: row.totalShares },
                      { label: "Unique shares", value: row.uniqueShares },
                    ]}
                  />
                );
              })}
            </div>
          </div>

          <div className="mt-10 grid gap-4 xl:grid-cols-[1.1fr_1.6fr]">
            <div className="rounded-[28px] border border-[#e7eaf2] bg-[#eef1f7] p-5 shadow-[0_10px_28px_rgba(17,24,39,0.06)] md:p-6">
              <div className="mb-5">
                <p className="text-[13px] uppercase tracking-[0.2em] text-[#8a8a91]">
                  Trial outcomes
                </p>
                <h2 className="mt-2 text-[24px] text-[#202024]">
                  Overall Trial Stats
                </h2>
              </div>

              <div className="space-y-4">
                <div className="rounded-[20px] bg-white p-4">
                  <p className="text-[13px] uppercase tracking-[0.18em] text-[#8a8a91]">
                    Total participation
                  </p>
                  <p className="mt-2 text-[34px] leading-none text-[#202024]">
                    {analytics.trials.totalParticipation}
                  </p>
                </div>

                <div className="rounded-[20px] bg-white p-4">
                  <div className="mb-3 flex items-center gap-2 text-[#202024]">
                    <Layers3 size={16} className="text-[#727DD5]" />
                    <span className="text-[14px] font-medium">
                      Reward distribution
                    </span>
                  </div>
                  <RewardTotalsChips
                    rows={analytics.trials.totalRewardDistribution}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-[#e7eaf2] bg-[#eef1f7] p-5 shadow-[0_10px_28px_rgba(17,24,39,0.06)] md:p-6">
              <div className="mb-5">
                <p className="text-[13px] uppercase tracking-[0.2em] text-[#8a8a91]">
                  Trial depth
                </p>
                <h2 className="mt-2 text-[24px] text-[#202024]">
                  Level-wise participation and rewards
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {levels.map((level) => {
                  const row = trialLevelWise[level] ?? {
                    participation: 0,
                    rewardsDistributed: [],
                  };

                  return (
                    <div
                      key={level}
                      className="rounded-[20px] border border-[#e1e5ee] bg-white p-4"
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {levelConfigById.get(level)?.image ? (
                            <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#f5f7fb]">
                              <img
                                src={levelConfigById.get(level)?.image}
                                alt={levelConfigById.get(level)?.title || `Level ${level}`}
                                className="h-9 w-9 object-contain"
                              />
                            </div>
                          ) : null}
                          <div>
                            <span className="inline-flex rounded-full bg-[#ececec] px-3 py-1 text-[12px] font-medium uppercase tracking-[0.16em] text-[#5f5f68]">
                              Level {level}
                            </span>
                            {levelConfigById.get(level)?.title ? (
                              <p className="mt-2 text-[15px] font-medium text-[#202024]">
                                {levelConfigById.get(level)?.title}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <span className="text-[13px] text-[#666]">
                          {row.participation} participation
                        </span>
                      </div>
                      <RewardTotalsChips rows={row.rewardsDistributed} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-[28px] border border-[#e7eaf2] bg-[#eef1f7] p-5 shadow-[0_10px_28px_rgba(17,24,39,0.06)] md:p-6">
            <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[13px] uppercase tracking-[0.2em] text-[#8a8a91]">
                  Trials and polls
                </p>
                <h2 className="mt-2 text-[24px] text-[#202024]">
                  Trial list with nested poll stats
                </h2>
              </div>
              <div className="flex items-center gap-2 text-[13px] text-[#7e7e86]">
                <PieChart size={14} className="text-[#727DD5]" />
                {trialEntries.length} trial{trialEntries.length === 1 ? "" : "s"} listed
              </div>
            </div>

            {trialEntries.length === 0 ? (
              <div className="rounded-[20px] bg-white p-6 text-[14px] text-[#7e7e86]">
                No trial or poll analytics are available for this blog yet.
              </div>
            ) : (
              <Accordion type="multiple" className="space-y-4">
                {trialEntries.map((group) => (
                  <AccordionItem
                    key={group.trialId}
                    value={group.trialId}
                    className="overflow-hidden rounded-[22px] border border-[#e1e5ee] bg-white px-0"
                  >
                    <AccordionTrigger className="px-5 py-4 hover:no-underline">
                      <div className="flex flex-1 flex-col gap-4 pr-4 text-left xl:flex-row xl:items-center xl:justify-between">
                        <div className="min-w-0">
                          <p className="text-[12px] uppercase tracking-[0.18em] text-[#8a8a91]">
                            Trial
                          </p>
                          <h3 className="mt-2 text-[18px] text-[#202024]">
                            {group.trialTitle || group.trialId}
                          </h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[#eef1f7] px-3 py-1 text-[12px] font-medium text-[#5f5f68]">
                            {group.totalParticipation} participation
                          </span>
                          <span className="rounded-full bg-[#eef1f7] px-3 py-1 text-[12px] font-medium text-[#5f5f68]">
                            {group.polls.length} poll{group.polls.length === 1 ? "" : "s"}
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-5 pb-5 pt-0">
                      <div className="space-y-4">
                        <div className="rounded-[18px] bg-[#f7f8fc] p-4">
                          <div className="mb-3 flex items-center gap-2 text-[#202024]">
                            <Layers3 size={16} className="text-[#727DD5]" />
                            <span className="text-[14px] font-medium">
                              Trial reward distribution
                            </span>
                          </div>
                          <RewardTotalsChips rows={group.rewardDistribution} />
                        </div>

                        <Accordion
                          type="single"
                          collapsible
                          className="rounded-[18px] border border-[#d9def7] bg-[linear-gradient(180deg,#f2f5ff_0%,#eef2ff_100%)]"
                        >
                          <AccordionItem value={`trial-levelwise-${group.trialId}`} className="border-none">
                            <AccordionTrigger className="px-4 py-3 hover:no-underline">
                              <div className="flex flex-1 flex-wrap items-center justify-between gap-3 pr-3 text-left">
                                <div>
                                  <p className="text-[12px] uppercase tracking-[0.18em] text-[#6d77bf]">
                                    Level-wise trial stats
                                  </p>
                                  <p className="mt-1 text-[15px] font-medium text-[#202024]">
                                    Reward distribution by participant level
                                  </p>
                                </div>
                                <span className="rounded-full bg-white/85 px-3 py-1 text-[12px] font-medium text-[#5d67bf]">
                                  {levels.filter((level) => {
                                    const row = group.levelWise?.[level];
                                    return (row?.participation ?? 0) > 0 || (row?.rewardsDistributed?.length ?? 0) > 0;
                                  }).length} active level{levels.filter((level) => {
                                    const row = group.levelWise?.[level];
                                    return (row?.participation ?? 0) > 0 || (row?.rewardsDistributed?.length ?? 0) > 0;
                                  }).length === 1 ? "" : "s"}
                                </span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4 pt-0">
                              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                                {levels.map((level) => {
                                  const row = group.levelWise?.[level] ?? {
                                    participation: 0,
                                    rewardsDistributed: [],
                                  };

                                  return (
                                    <div
                                      key={`${group.trialId}-${level}`}
                                      className="rounded-[18px] border border-[#dce2fb] bg-[#f8f9ff] p-3"
                                    >
                                      <div className="mb-3 flex items-center gap-3">
                                        {levelConfigById.get(level)?.image ? (
                                          <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-white">
                                            <img
                                              src={levelConfigById.get(level)?.image}
                                              alt={levelConfigById.get(level)?.title || `Level ${level}`}
                                              className="h-8 w-8 object-contain"
                                            />
                                          </div>
                                        ) : null}
                                        <div>
                                          <span className="inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-[#5d67bf]">
                                            Level {level}
                                          </span>
                                          {levelConfigById.get(level)?.title ? (
                                            <p className="mt-2 text-[14px] font-medium text-[#202024]">
                                              {levelConfigById.get(level)?.title}
                                            </p>
                                          ) : null}
                                        </div>
                                      </div>

                                      <div className="mb-3 flex items-center justify-between gap-3 text-[13px]">
                                        <span className="text-[#7e7e86]">Participation</span>
                                        <span className="font-medium text-[#202024]">
                                          {row.participation}
                                        </span>
                                      </div>

                                      <RewardTotalsChips rows={row.rewardsDistributed} />
                                    </div>
                                  );
                                })}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>

                        {group.polls.length === 0 ? (
                          <div className="rounded-[16px] bg-[#f8f9fa] p-4 text-[14px] text-[#7e7e86]">
                            No polls available for this trial.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {group.polls.map((poll) => (
                              <div
                                key={poll.pollId}
                                className="rounded-[18px] border border-[#e8ebf1] bg-[#fcfcfd] p-4"
                              >
                                <div className="mb-4">
                                  <p className="text-[12px] uppercase tracking-[0.18em] text-[#8a8a91]">
                                    Poll
                                  </p>
                                  <h4 className="mt-2 text-[16px] font-medium text-[#202024]">
                                    {poll.pollTitle || poll.pollId}
                                  </h4>
                                </div>

                                <div className="space-y-3">
                                  {(poll.options ?? []).map((option) => {
                                    const width = Math.min(
                                      100,
                                      Math.max(0, Number(option.percentage ?? 0)),
                                    );

                                    return (
                                      <div
                                        key={option.optionId}
                                        className="rounded-[16px] bg-white p-4 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset]"
                                      >
                                        <div className="mb-2 flex items-center justify-between gap-3 text-[14px]">
                                          <span className="font-medium text-[#202024]">
                                            {option.optionText}
                                          </span>
                                          <span className="text-[#7e7e86]">
                                            {option.votes} votes · {option.percentage}%
                                          </span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-[#eceff7]">
                                          <div
                                            className="h-full rounded-full bg-[#727DD5]"
                                            style={{ width: `${width}%` }}
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </>
      )}
      </div>
    </div>
  );
}
