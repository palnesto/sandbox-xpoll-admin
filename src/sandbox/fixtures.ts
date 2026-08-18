// Sandbox-only: static payloads standing in for real backend responses.
// Shapes are traced from the exact fields each component/hook dereferences.

export const totalSupply = {
  totalSupply: "500000000",
};

// Consumed by pages/dashboard.tsx via stats?.data?.data — every field below is read there.
export const overallPollStats = {
  users: {
    total: 9842,
    byCountry: [
      { country: "IN", count: 2947 },
      { country: "US", count: 2510 },
      { country: "UNKNOWN", count: 118 },
      { country: "KR", count: 1188 },
      { country: "VN", count: 662 },
      { country: "GB", count: 540 },
      { country: "DE", count: 401 },
    ],
  },
  content: {
    polls: 1342,
    trials: 58,
  },
  assets: {
    totalCurrencies: 6,
    // totalAmount is in atomic/minor units, scaled by assetSpecs[assetId].decimal
    balances: {
      byAsset: [
        { assetId: "xPoll", totalAmount: "128500" }, // decimal 0 -> 128,500 XPOLL
        { assetId: "xOcta", totalAmount: "45236000000" }, // decimal 8 -> 452.36 xOCTA
        { assetId: "xMYST", totalAmount: "9820500000000" }, // decimal 9 -> 9,820.5 XMYST
        { assetId: "xDrop", totalAmount: "61250750000" }, // decimal 6 -> 61,250.75 XDROP
        { assetId: "xHigh", totalAmount: "3400000000000" }, // decimal 6 -> 3,400,000 XHIGH
        { assetId: "xGive", totalAmount: "1875000" }, // decimal 2 -> 18,750.00 XGIVE
      ],
    },
  },
};

// ============================= REFERENCE DATA =============================
// Backs the shared country/state/city MultiInfiniteSelect filters reused across
// Trials, Polls, Ads, Users, and Industry listing pages (GET /common/location/*).
export const countries = [
  { _id: "country-in", name: "India", iso3: "IND" },
  { _id: "country-us", name: "United States", iso3: "USA" },
  { _id: "country-gb", name: "United Kingdom", iso3: "GBR" },
  { _id: "country-de", name: "Germany", iso3: "DEU" },
  { _id: "country-kr", name: "South Korea", iso3: "KOR" },
  { _id: "country-vn", name: "Vietnam", iso3: "VNM" },
  { _id: "country-fr", name: "France", iso3: "FRA" },
  { _id: "country-jp", name: "Japan", iso3: "JPN" },
  { _id: "country-br", name: "Brazil", iso3: "BRA" },
  { _id: "country-ca", name: "Canada", iso3: "CAN" },
  { _id: "country-au", name: "Australia", iso3: "AUS" },
  { _id: "country-sg", name: "Singapore", iso3: "SGP" },
];

export const states = [
  { _id: "state-mh", name: "Maharashtra", country: { _id: "country-in", name: "India" } },
  { _id: "state-ka", name: "Karnataka", country: { _id: "country-in", name: "India" } },
  { _id: "state-dl", name: "Delhi", country: { _id: "country-in", name: "India" } },
  { _id: "state-ca", name: "California", country: { _id: "country-us", name: "United States" } },
  { _id: "state-ny", name: "New York", country: { _id: "country-us", name: "United States" } },
  { _id: "state-tx", name: "Texas", country: { _id: "country-us", name: "United States" } },
  { _id: "state-eng", name: "England", country: { _id: "country-gb", name: "United Kingdom" } },
];

export const cities = [
  { _id: "city-mumbai", name: "Mumbai", state: { _id: "state-mh", name: "Maharashtra" }, country: { _id: "country-in", name: "India" } },
  { _id: "city-pune", name: "Pune", state: { _id: "state-mh", name: "Maharashtra" }, country: { _id: "country-in", name: "India" } },
  { _id: "city-bengaluru", name: "Bengaluru", state: { _id: "state-ka", name: "Karnataka" }, country: { _id: "country-in", name: "India" } },
  { _id: "city-newdelhi", name: "New Delhi", state: { _id: "state-dl", name: "Delhi" }, country: { _id: "country-in", name: "India" } },
  { _id: "city-la", name: "Los Angeles", state: { _id: "state-ca", name: "California" }, country: { _id: "country-us", name: "United States" } },
  { _id: "city-sf", name: "San Francisco", state: { _id: "state-ca", name: "California" }, country: { _id: "country-us", name: "United States" } },
  { _id: "city-nyc", name: "New York City", state: { _id: "state-ny", name: "New York" }, country: { _id: "country-us", name: "United States" } },
  { _id: "city-austin", name: "Austin", state: { _id: "state-tx", name: "Texas" }, country: { _id: "country-us", name: "United States" } },
  { _id: "city-london", name: "London", state: { _id: "state-eng", name: "England" }, country: { _id: "country-gb", name: "United Kingdom" } },
];

// ============================= TRIALS =============================
// Consumed by pages/analytics/trials/index.tsx via payload.entries / payload.meta.
// Row fields traced: _id, title, viewCount, responsesCount, expireRewardAt.
export const trials = [
  { _id: "trial-001", title: "Future of Remote Work 2026", viewCount: 18420, responsesCount: 4310, expireRewardAt: "2026-09-30T00:00:00.000Z" },
  { _id: "trial-002", title: "Crypto Adoption in Southeast Asia", viewCount: 12980, responsesCount: 3021, expireRewardAt: "2026-10-15T00:00:00.000Z" },
  { _id: "trial-003", title: "AI Tools Developers Actually Use", viewCount: 25640, responsesCount: 7112, expireRewardAt: "2026-08-25T00:00:00.000Z" },
  { _id: "trial-004", title: "Best Budget Smartphones of the Year", viewCount: 9310, responsesCount: 2204, expireRewardAt: "2026-01-10T00:00:00.000Z" },
  { _id: "trial-005", title: "Streaming Service Loyalty Survey", viewCount: 15200, responsesCount: 3890, expireRewardAt: null },
  { _id: "trial-006", title: "College Students & Side Hustles", viewCount: 7830, responsesCount: 1655, expireRewardAt: "2026-11-05T00:00:00.000Z" },
  { _id: "trial-007", title: "Public Transit Satisfaction Index", viewCount: 6120, responsesCount: 1289, expireRewardAt: "2025-12-01T00:00:00.000Z" },
  { _id: "trial-008", title: "Web3 Gaming: Hype or Habit?", viewCount: 19870, responsesCount: 5230, expireRewardAt: "2026-09-12T00:00:00.000Z" },
  { _id: "trial-009", title: "Remote Team Communication Tools", viewCount: 8890, responsesCount: 1920, expireRewardAt: "2026-08-01T00:00:00.000Z" },
  { _id: "trial-010", title: "EV Ownership: One Year Later", viewCount: 11430, responsesCount: 2765, expireRewardAt: "2026-12-20T00:00:00.000Z" },
  { _id: "trial-011", title: "Freelancer Payment Preferences", viewCount: 5410, responsesCount: 980, expireRewardAt: null },
  { _id: "trial-012", title: "Short-Form Video Habits by Age Group", viewCount: 30210, responsesCount: 8830, expireRewardAt: "2026-09-05T00:00:00.000Z" },
  { _id: "trial-013", title: "Home Coffee Setup Spending Survey", viewCount: 4120, responsesCount: 705, expireRewardAt: "2026-02-14T00:00:00.000Z" },
  { _id: "trial-014", title: "Cross-Chain Bridge Trust Survey", viewCount: 13650, responsesCount: 3410, expireRewardAt: "2026-10-01T00:00:00.000Z" },
  { _id: "trial-015", title: "Four-Day Work Week Pilot Feedback", viewCount: 21980, responsesCount: 6120, expireRewardAt: "2026-08-22T00:00:00.000Z" },
  { _id: "trial-016", title: "Mobile Wallet Security Concerns", viewCount: 9650, responsesCount: 2011, expireRewardAt: "2026-11-18T00:00:00.000Z" },
  { _id: "trial-017", title: "NFT Ticketing for Live Events", viewCount: 7040, responsesCount: 1442, expireRewardAt: "2025-10-30T00:00:00.000Z" },
  { _id: "trial-018", title: "Grocery Delivery App Comparison", viewCount: 16230, responsesCount: 4005, expireRewardAt: "2026-09-28T00:00:00.000Z" },
  { _id: "trial-019", title: "Gen Z Investing Habits", viewCount: 27650, responsesCount: 7920, expireRewardAt: "2026-08-30T00:00:00.000Z" },
  { _id: "trial-020", title: "Smart Home Adoption Barriers", viewCount: 6580, responsesCount: 1330, expireRewardAt: null },
  { _id: "trial-021", title: "DAO Governance Participation Study", viewCount: 5230, responsesCount: 990, expireRewardAt: "2026-12-01T00:00:00.000Z" },
  { _id: "trial-022", title: "Airline Loyalty Program Rankings", viewCount: 10120, responsesCount: 2450, expireRewardAt: "2026-07-05T00:00:00.000Z" },
  { _id: "trial-023", title: "Language Learning App Retention", viewCount: 14320, responsesCount: 3670, expireRewardAt: "2026-10-22T00:00:00.000Z" },
  { _id: "trial-024", title: "Renewable Energy at Home", viewCount: 8210, responsesCount: 1810, expireRewardAt: "2026-11-30T00:00:00.000Z" },
  { _id: "trial-025", title: "Stablecoin Usage for Remittances", viewCount: 12040, responsesCount: 2990, expireRewardAt: "2026-09-15T00:00:00.000Z" },
  { _id: "trial-026", title: "Coworking Space Preferences 2026", viewCount: 4870, responsesCount: 860, expireRewardAt: "2026-08-19T00:00:00.000Z" },
];

// ============================= POLLS =============================
// Consumed by pages/analytics/polls/index.tsx (listing) and [slug].tsx (per-poll
// analytics). Row fields traced: _id, title, externalAuthor, expireRewardAt,
// viewCount, voteCount. `optionTexts` is sandbox-only (not part of the real API) —
// used purely to synthesize a plausible per-poll analytics breakdown below.
export const polls = [
  { _id: "poll-001", title: "Which AI coding assistant do you use daily?", externalAuthor: false, expireRewardAt: "2026-09-30T00:00:00.000Z", viewCount: 22400, voteCount: 8120, optionTexts: ["GitHub Copilot", "Claude", "Cursor", "None"] },
  { _id: "poll-002", title: "Best chain for everyday payments?", externalAuthor: false, expireRewardAt: "2026-10-05T00:00:00.000Z", viewCount: 15600, voteCount: 5210, optionTexts: ["SUI", "XRP", "Aptos", "Base"] },
  { _id: "poll-003", title: "Do you trust AI-generated news summaries?", externalAuthor: true, expireRewardAt: "2026-08-28T00:00:00.000Z", viewCount: 31200, voteCount: 12040, optionTexts: ["Yes", "No", "Depends on source"], trialId: "trial-002" },
  { _id: "poll-004", title: "Favorite way to track daily habits?", externalAuthor: false, expireRewardAt: null, viewCount: 8930, voteCount: 2410, optionTexts: ["Notion", "Paper journal", "An app", "I don't track"] },
  { _id: "poll-005", title: "Should remote teams have mandatory video calls?", externalAuthor: false, expireRewardAt: "2026-09-12T00:00:00.000Z", viewCount: 12870, voteCount: 4330, optionTexts: ["Yes", "No", "Only weekly"] },
  { _id: "poll-006", title: "Most useful browser extension in 2026?", externalAuthor: true, expireRewardAt: "2026-11-01T00:00:00.000Z", viewCount: 9840, voteCount: 3105, optionTexts: ["Ad blocker", "Password manager", "AI assistant", "Grammar checker"] },
  { _id: "poll-007", title: "Would you buy a foldable phone?", externalAuthor: false, expireRewardAt: "2026-01-15T00:00:00.000Z", viewCount: 17650, voteCount: 6012, optionTexts: ["Yes", "No", "Waiting for price drop"], trialId: "trial-002" },
  { _id: "poll-008", title: "How do you back up your crypto wallet seed phrase?", externalAuthor: false, expireRewardAt: "2026-10-20T00:00:00.000Z", viewCount: 14320, voteCount: 4870, optionTexts: ["Metal plate", "Paper", "Password manager", "Memorized only"] },
  { _id: "poll-009", title: "Best day of the week to launch a product?", externalAuthor: false, expireRewardAt: "2026-08-25T00:00:00.000Z", viewCount: 6420, voteCount: 1980, optionTexts: ["Monday", "Tuesday", "Wednesday", "Thursday"] },
  { _id: "poll-010", title: "Do you read Terms & Conditions before signing up?", externalAuthor: true, expireRewardAt: null, viewCount: 27800, voteCount: 9430, optionTexts: ["Always", "Sometimes", "Never"] },
  { _id: "poll-011", title: "Which stablecoin do you hold most of?", externalAuthor: false, expireRewardAt: "2026-09-18T00:00:00.000Z", viewCount: 11230, voteCount: 3760, optionTexts: ["USDC", "USDT", "DAI", "None"] },
  { _id: "poll-012", title: "Preferred format for product updates?", externalAuthor: false, expireRewardAt: "2026-12-01T00:00:00.000Z", viewCount: 5340, voteCount: 1520, optionTexts: ["Changelog page", "Email", "In-app banner", "I don't check"], trialId: "trial-003" },
  { _id: "poll-013", title: "Is a 4-day work week realistic for your team?", externalAuthor: false, expireRewardAt: "2026-08-24T00:00:00.000Z", viewCount: 19870, voteCount: 7220, optionTexts: ["Yes", "No", "Already do it"] },
  { _id: "poll-014", title: "Which onboarding step do users skip most?", externalAuthor: true, expireRewardAt: "2026-10-10T00:00:00.000Z", viewCount: 7650, voteCount: 2140, optionTexts: ["Profile photo", "Preferences", "Tutorial", "Email verification"] },
  { _id: "poll-015", title: "Favorite way to discover new music in 2026?", externalAuthor: false, expireRewardAt: "2026-09-22T00:00:00.000Z", viewCount: 24100, voteCount: 8890, optionTexts: ["Algorithmic playlist", "Friends", "Radio", "Short-form video"] },
  { _id: "poll-016", title: "Would you trust an AI financial advisor?", externalAuthor: false, expireRewardAt: "2026-11-15T00:00:00.000Z", viewCount: 16540, voteCount: 5430, optionTexts: ["Yes, fully", "Only for basics", "No"] },
  { _id: "poll-017", title: "Most annoying part of airport security?", externalAuthor: false, expireRewardAt: "2025-12-20T00:00:00.000Z", viewCount: 8120, voteCount: 2650, optionTexts: ["Long lines", "Liquids rule", "Shoes off", "Random checks"] },
  { _id: "poll-018", title: "Which wallet do you trust most for NFTs?", externalAuthor: true, expireRewardAt: "2026-09-28T00:00:00.000Z", viewCount: 10230, voteCount: 3340, optionTexts: ["MetaMask", "Phantom", "Sui Wallet", "Xaman"] },
  { _id: "poll-019", title: "Do subscription fatigue concerns affect your spending?", externalAuthor: false, expireRewardAt: "2026-08-30T00:00:00.000Z", viewCount: 20450, voteCount: 7660, optionTexts: ["Yes, cutting back", "No change", "Never had many"] },
  { _id: "poll-020", title: "Best format for team standups?", externalAuthor: false, expireRewardAt: null, viewCount: 4210, voteCount: 980, optionTexts: ["Async written", "Live video", "Slack thread", "We skip it"] },
  { _id: "poll-021", title: "Which layer-2 do you use most for low fees?", externalAuthor: false, expireRewardAt: "2026-10-30T00:00:00.000Z", viewCount: 13560, voteCount: 4520, optionTexts: ["Base", "Arbitrum", "Optimism", "zkSync"] },
  { _id: "poll-022", title: "How often do you switch phone plans for a better deal?", externalAuthor: false, expireRewardAt: "2026-12-05T00:00:00.000Z", viewCount: 6890, voteCount: 1870, optionTexts: ["Every year", "Rarely", "Never switched"] },
  { _id: "poll-023", title: "Preferred way to learn a new skill?", externalAuthor: true, expireRewardAt: "2026-09-08T00:00:00.000Z", viewCount: 18760, voteCount: 6540, optionTexts: ["Video course", "Docs/books", "Hands-on project", "Mentor"] },
  { _id: "poll-024", title: "Would you use a DAO to vote on local community issues?", externalAuthor: false, expireRewardAt: "2026-11-25T00:00:00.000Z", viewCount: 9340, voteCount: 2980, optionTexts: ["Yes", "No", "Need to learn more"] },
  { _id: "poll-025", title: "Which season do you prefer for travel?", externalAuthor: false, expireRewardAt: "2026-08-21T00:00:00.000Z", viewCount: 15230, voteCount: 5120, optionTexts: ["Spring", "Summer", "Autumn", "Winter"] },
  { _id: "poll-026", title: "Do you check crypto prices daily?", externalAuthor: false, expireRewardAt: "2026-09-14T00:00:00.000Z", viewCount: 26400, voteCount: 9870, optionTexts: ["Multiple times a day", "Once a day", "Rarely", "Never"] },
];

// Deterministic per-poll analytics breakdown (options/levels/stats), synthesized from
// the base row so we don't hand-author a full PollDetailsResponse for every poll.
const OPTION_WEIGHTS = [0.42, 0.31, 0.18, 0.09];
const LEVEL_WEIGHTS = [0.35, 0.25, 0.2, 0.12, 0.08];

export function buildPollAnalytics(poll: (typeof polls)[number]) {
  const totalViews = poll.viewCount ?? 0;
  const totalVoters = poll.voteCount ?? 0;
  const totalRewardsClaimed = Math.round(totalVoters * 0.62);
  const totalShares = Math.round(totalVoters * 0.08);

  const optionTexts = poll.optionTexts?.length ? poll.optionTexts : ["Option A", "Option B"];
  const weights = OPTION_WEIGHTS.slice(0, optionTexts.length);
  const weightSum = weights.reduce((a, b) => a + b, 0);

  const monthLabels = [
    "2026-03-01T00:00:00.000Z",
    "2026-04-01T00:00:00.000Z",
    "2026-05-01T00:00:00.000Z",
    "2026-06-01T00:00:00.000Z",
    "2026-07-01T00:00:00.000Z",
    "2026-08-01T00:00:00.000Z",
  ];

  const options = optionTexts.map((text, i) => {
    const totalCumulative = Math.round(totalVoters * (weights[i] / weightSum));
    let cumulative = 0;
    const series = monthLabels.map((bucket, bi) => {
      const share = (bi + 1) / monthLabels.length;
      const nextCumulative = Math.round(totalCumulative * share);
      const count = nextCumulative - cumulative;
      cumulative = nextCumulative;
      return { bucket, count, cumulative };
    });
    return { _id: `${poll._id}-opt-${i}`, text, archivedAt: null, series, totalCumulative };
  });

  const distribution = LEVEL_WEIGHTS.map((w, i) => ({
    level: i + 1,
    count: Math.round(totalVoters * w),
  }));

  return {
    optionDistribution: {
      pollId: poll._id,
      createdAt: "2026-02-01T00:00:00.000Z",
      granularity: "month",
      includeArchivedVotes: false,
      countryFilter: "ALL",
      options,
      summary: {
        totalVotes: totalVoters,
        optionBreakdown: options.map((o) => ({
          optionId: o._id,
          text: o.text,
          archivedAt: null,
          totalCumulative: o.totalCumulative,
        })),
      },
    },
    levelDistribution: {
      pollId: poll._id,
      includeArchivedVotes: false,
      distribution,
    },
    stats: {
      pollId: poll._id,
      title: poll.title,
      filtersApplied: { cities: "", states: "", countries: "" },
      stats: {
        totalViews,
        totalRewardsClaimed,
        totalVoters,
        totalShares,
      },
    },
  };
}

// ============================= FULL POLL / TRIAL DETAIL =============================
// The listing rows above (polls/trials) only carry the fields the analytics listing
// reads. The view/edit pages (pages/polls/[id], pages/trials/[id]/index) read a much
// richer object — built here on top of the listing row so both stay in sync.
import pollCoverImage from "@/assets/chart.png";
import trialCoverImage from "@/assets/bubble.png";

function findTrialTitle(trialId?: string) {
  return trials.find((t) => t._id === trialId)?.title;
}

export function buildFullPoll(row: (typeof polls)[number] & { trialId?: string }) {
  const options = (row.optionTexts?.length ? row.optionTexts : ["Option A", "Option B"]).map(
    (text, i) => ({ _id: `${row._id}-opt-${i}`, text, archivedAt: null as string | null }),
  );
  return {
    _id: row._id,
    pollId: row._id,
    title: row.title,
    description: `Community poll: ${row.title} Cast your vote and see how the community is responding in real time.`,
    createdAt: "2026-02-01T00:00:00.000Z",
    archivedAt: null as string | null,
    resourceAssets: [{ type: "image" as const, value: pollCoverImage }],
    media: undefined as string | undefined,
    rewards: [
      { assetId: "xPoll", amount: 50, rewardAmountCap: 5000, rewardType: "min" as const },
    ],
    expireRewardAt: row.expireRewardAt ?? null,
    options,
    targetGeo: {
      countries: [{ _id: "country-in", name: "India" }, { _id: "country-us", name: "United States" }],
      states: [] as { _id: string; name: string }[],
      cities: [] as { _id: string; name: string }[],
    },
    trialId: row.trialId,
    trial: row.trialId ? { _id: row.trialId, title: findTrialTitle(row.trialId) } : undefined,
    externalAuthor: row.externalAuthor,
    externalAuthorInfo: row.externalAuthor
      ? { username: "community_member", city: { name: "Mumbai" }, state: { name: "Maharashtra" }, country: { name: "India" } }
      : undefined,
    viewCount: row.viewCount,
    voteCount: row.voteCount,
  };
}

export function buildFullTrial(row: (typeof trials)[number]) {
  return {
    _id: row._id,
    title: row.title,
    description: `Multi-poll trial series: ${row.title} Track how responses evolve across every poll in this trial.`,
    createdAt: "2026-01-15T00:00:00.000Z",
    archivedAt: null as string | null,
    resourceAssets: [{ type: "image" as const, value: trialCoverImage }],
    media: undefined as string | undefined,
    rewards: [{ assetId: "xPoll", amount: 100, rewardAmountCap: 10000 }],
    expireRewardAt: row.expireRewardAt ?? null,
    targetGeo: {
      countries: [{ _id: "country-in", name: "India" }],
      states: [] as { _id: string; name: string }[],
      cities: [] as { _id: string; name: string }[],
    },
    viewCount: row.viewCount,
    responsesCount: row.responsesCount,
  };
}

export function buildEntityReferralAnalytics(entityId: string, views: number, uniques: number) {
  return {
    entityId,
    uniqueLinks: Math.max(1, Math.round(uniques / 40)),
    totals: { views, uniques },
  };
}

// ============================= REFERRAL LINKS =============================
// Backs GET /internal/referral/listing (per-entity sharer rows) and
// GET /internal/referral/listing-uniques (per-link unique visitors), consumed by
// pages/{polls,trials}/[id]/[referralLink]/(index|[uniqueLinks]).tsx.
import { LEVELS } from "@/utils/levelConfig";

const REFERRAL_USERNAMES = [
  "nova_trader", "cipher_jane", "lunar_fox", "pixel_raja", "echo_wave",
  "atlas_kim", "delta_moon", "solstice_ray", "nomad_lee", "ember_stone",
  "quartz_win", "vertex_dao",
];

export function generateReferralRows(kind: "poll" | "trial", entityId: string, count = 9) {
  return Array.from({ length: count }).map((_, i) => {
    const username = REFERRAL_USERNAMES[i % REFERRAL_USERNAMES.length];
    const level = LEVELS[i % LEVELS.length];
    const city = cities[i % cities.length];
    const views = 240 - i * 19;
    const uniques = Math.max(6, Math.round(views * 0.42));
    const day = String((i % 27) + 1).padStart(2, "0");
    return {
      _id: `${entityId}-ref-${i}`,
      archivedAt: null as string | null,
      counts: { uniques, views },
      createdAt: `2026-03-${day}T00:00:00.000Z`,
      entityId,
      firstVisitAt: `2026-03-${day}T06:00:00.000Z`,
      hasAnyVisitor: true,
      kind,
      lastVisitAt: `2026-08-${day}T06:00:00.000Z`,
      level: level.id,
      sharerExternalAccountId: `user-${entityId}-${i}`,
      username,
      avatar: { name: username, imageUrl: level.image },
      city: {
        _id: city._id,
        countryId: city.country._id,
        stateId: city.state._id,
        name: city.name,
        stateName: city.state.name,
        countryName: city.country.name,
      },
    };
  });
}

export function generateUniqueVisitors(linkId: string, count = 6) {
  return Array.from({ length: count }).map((_, i) => {
    const username = REFERRAL_USERNAMES[(i + 3) % REFERRAL_USERNAMES.length];
    const level = LEVELS[(i + 2) % LEVELS.length];
    const city = cities[(i + 2) % cities.length];
    const day = String((i % 27) + 1).padStart(2, "0");
    return {
      _id: `${linkId}-visit-${i}`,
      linkId,
      viewerExternalAccountId: `viewer-${linkId}-${i}`,
      firstAt: `2026-03-${day}T08:00:00.000Z`,
      lastAt: `2026-08-${day}T08:00:00.000Z`,
      visits: 3 + i,
      username,
      avatar: { name: username, imageUrl: level.image },
      level: level.id,
      civicScore: 40 + i * 7,
      city: {
        _id: city._id,
        countryId: city.country._id,
        stateId: city.state._id,
        name: city.name,
        stateName: city.state.name,
        countryName: city.country.name,
      },
    };
  });
}

// ============================= EXTERNAL USERS =============================
// Consumed by pages/users/index.tsx (listing — only `_id` is ever read there),
// pages/users/[userId]/index.tsx (full profile), and the sharer referral-analytics
// block on that same page. Extra fields beyond `_id` are used to build the richer
// per-user detail payload below; the listing page ignores them.
export const externalUsers = [
  { _id: "user-001", username: "nova_trader", gender: "female", dob: "1996-04-12", level: 6, civicScore: 812, hasEmail: true, googleEmail: "nova.trader@gmail.com", twitter: false, linkedGrwb: true, city: cities[0] },
  { _id: "user-002", username: "cipher_jane", gender: "female", dob: "1993-11-02", level: 3, civicScore: 340, hasEmail: false, googleEmail: null, twitter: true, linkedGrwb: false, city: cities[1] },
  { _id: "user-003", username: "lunar_fox", gender: "male", dob: "1999-02-27", level: 8, civicScore: 1240, hasEmail: true, googleEmail: "lunar.fox@gmail.com", twitter: true, linkedGrwb: true, city: cities[2] },
  { _id: "user-004", username: "pixel_raja", gender: "male", dob: "1990-07-19", level: 2, civicScore: 155, hasEmail: false, googleEmail: null, twitter: false, linkedGrwb: false, city: cities[3] },
  { _id: "user-005", username: "echo_wave", gender: "non-binary", dob: "1998-01-08", level: 5, civicScore: 690, hasEmail: true, googleEmail: "echo.wave@gmail.com", twitter: false, linkedGrwb: false, city: cities[4] },
  { _id: "user-006", username: "atlas_kim", gender: "male", dob: "1995-09-30", level: 10, civicScore: 2210, hasEmail: true, googleEmail: "atlas.kim@gmail.com", twitter: true, linkedGrwb: true, city: cities[5] },
  { _id: "user-007", username: "delta_moon", gender: "female", dob: "1997-05-16", level: 4, civicScore: 505, hasEmail: false, googleEmail: null, twitter: true, linkedGrwb: false, city: cities[6] },
  { _id: "user-008", username: "solstice_ray", gender: "male", dob: "1992-12-24", level: 7, civicScore: 980, hasEmail: true, googleEmail: "solstice.ray@gmail.com", twitter: false, linkedGrwb: false, city: cities[7] },
  { _id: "user-009", username: "nomad_lee", gender: "female", dob: "2000-03-03", level: 1, civicScore: 40, hasEmail: false, googleEmail: null, twitter: false, linkedGrwb: false, city: cities[8] },
  { _id: "user-010", username: "ember_stone", gender: "male", dob: "1994-06-21", level: 9, civicScore: 1780, hasEmail: true, googleEmail: "ember.stone@gmail.com", twitter: true, linkedGrwb: true, city: cities[0] },
  { _id: "user-011", username: "quartz_win", gender: "female", dob: "1996-10-11", level: 3, civicScore: 300, hasEmail: true, googleEmail: "quartz.win@gmail.com", twitter: false, linkedGrwb: false, city: cities[1] },
  { _id: "user-012", username: "vertex_dao", gender: "male", dob: "1991-08-05", level: 6, civicScore: 845, hasEmail: false, googleEmail: null, twitter: true, linkedGrwb: false, city: cities[2] },
];

function xpollAssetMappings() {
  return {
    xPoll: { assetType: "xPoll", amount: "1240" },
    xOcta: { assetType: "xOcta", amount: "12.5" },
    xDrop: { assetType: "xDrop", amount: "980.25" },
  };
}

export function buildUserDetails(row: (typeof externalUsers)[number]) {
  const level = LEVELS[Math.min(row.level, LEVELS.length) - 1] ?? LEVELS[0];
  return {
    id: row._id,
    hasEmail: row.hasEmail,
    connectedProviders: [
      ...(row.hasEmail ? ["google"] : []),
      ...(row.twitter ? ["twitter"] : []),
    ],
    providerCount: (row.hasEmail ? 1 : 0) + (row.twitter ? 1 : 0),
    googleEmail: row.googleEmail,
    twitterUsername: row.twitter ? `${row.username}_x` : null,
    twitterName: row.twitter ? row.username.replace("_", " ") : null,
    profile: {
      level: row.level,
      civicScore: row.civicScore,
      apps: {
        xpoll: {
          username: row.username,
          avatar: { _id: `${row._id}-avatar`, name: level.title, imageUrl: level.image },
          gender: row.gender,
          dob: row.dob,
          meta: {
            isDisclaimerAccepted: true,
            isPreferenceSubmitted: row.level > 1,
            isCertificateGiven: row.level > 3,
          },
        },
      },
      meta: {
        city: {
          _id: row.city._id,
          countryId: row.city.country._id,
          countryName: row.city.country.name,
          name: row.city.name,
          stateId: row.city.state._id,
          stateName: row.city.state.name,
        },
        state: { _id: row.city.state._id, countryId: row.city.country._id, name: row.city.state.name },
        country: { _id: row.city.country._id, name: row.city.country.name },
      },
    },
    highestLevel: row.level,
    linkedGrwbAccount: row.linkedGrwb
      ? { name: row.username.replace("_", " "), email: `${row.username}@grwb.app`, level: row.level }
      : null,
    assetMappings: xpollAssetMappings(),
  };
}

export function buildSharerAnalytics(userId: string, views: number, uniques: number, linksWithTraffic: number) {
  return {
    sharerExternalAccountId: userId,
    linksWithTraffic,
    totals: { views, uniques },
  };
}

// Referral links this user has SHARED (as sharer), across a mix of polls and trials —
// consumed by pages/users/[userId]/[refferalLink].tsx via sharerExternalAccountIds.
export function generateSharerReferralRows(row: (typeof externalUsers)[number], count = 8) {
  const level = LEVELS[Math.min(row.level, LEVELS.length) - 1] ?? LEVELS[0];
  return Array.from({ length: count }).map((_, i) => {
    const isPoll = i % 2 === 0;
    const entity = isPoll ? polls[i % polls.length] : trials[i % trials.length];
    const views = 180 - i * 13;
    const uniques = Math.max(4, Math.round(views * 0.4));
    const day = String((i % 27) + 1).padStart(2, "0");
    return {
      _id: `${row._id}-link-${i}`,
      archivedAt: null as string | null,
      counts: { uniques, views },
      createdAt: `2026-04-${day}T00:00:00.000Z`,
      entityId: entity._id,
      firstVisitAt: `2026-04-${day}T05:00:00.000Z`,
      hasAnyVisitor: true,
      kind: isPoll ? "poll" : "trial",
      lastVisitAt: `2026-08-${day}T05:00:00.000Z`,
      level: row.level,
      sharerExternalAccountId: row._id,
      username: row.username,
      avatar: { name: level.title, imageUrl: level.image },
      city: {
        _id: row.city._id,
        countryId: row.city.country._id,
        stateId: row.city.state._id,
        name: row.city.name,
        stateName: row.city.state.name,
        countryName: row.city.country.name,
      },
    };
  });
}

// ============================= REFERRAL CONFIG =============================
// Consumed by pages/referral-config/index.tsx. GET amounts are PARENT-unit strings;
// PUT sends them back as BASE-unit strings, so mock-api.ts converts on save via
// levelsFromBaseAmounts() below (mirrors the page's own toBase/toParent round trip).
import { amount as convertAmount, unwrapString } from "@/utils/currency-assets/base";

export const referralConfigLevels = [
  { totalUniqueVisitsRequired: 5, rewards: [{ assetId: "xPoll", amount: "25" }] },
  { totalUniqueVisitsRequired: 20, rewards: [{ assetId: "xPoll", amount: "75" }, { assetId: "xOcta", amount: "0.5" }] },
  { totalUniqueVisitsRequired: 50, rewards: [{ assetId: "xPoll", amount: "200" }, { assetId: "xMYST", amount: "5" }] },
];

export function levelsFromBaseAmounts(
  levels: { totalUniqueVisitsRequired: number; rewards: { assetId: string; amount: string }[] }[],
) {
  return levels.map((lvl) => ({
    totalUniqueVisitsRequired: lvl.totalUniqueVisitsRequired,
    rewards: lvl.rewards.map((r) => ({
      assetId: r.assetId,
      amount: unwrapString(
        convertAmount({ op: "toParent", assetId: r.assetId as any, value: r.amount, output: "string", trim: true }),
        r.amount,
      ),
    })),
  }));
}

// ============================= CAMPAIGN PLANS =============================
// GET /common/campaigns/plans returns a BARE ARRAY at data.data (create.tsx does
// `?.data?.data ?? ...` then `.filter`, so an {entries} wrapper would crash it).
// prices[].amountMinor is in MINOR units (cents) — formatMoneyFromMinor divides by 100.
// Plans must cover every (isPolitical x donationSupported) combination or the plan
// card shows "No plans available for this selection".
export const campaignPlans = [
  { _id: "plan-np-30", name: "Starter — 30 days", durationDays: 30, isPolitical: false, donationSupported: false, isActive: true, archivedAt: null, prices: [{ amountMinor: 4900, currency: "USD" }] },
  { _id: "plan-np-90", name: "Growth — 90 days", durationDays: 90, isPolitical: false, donationSupported: false, isActive: true, archivedAt: null, prices: [{ amountMinor: 12900, currency: "USD" }] },
  { _id: "plan-np-180", name: "Scale — 180 days", durationDays: 180, isPolitical: false, donationSupported: false, isActive: true, archivedAt: null, prices: [{ amountMinor: 22900, currency: "USD" }] },
  { _id: "plan-npd-30", name: "Starter + Donations — 30 days", durationDays: 30, isPolitical: false, donationSupported: true, isActive: true, archivedAt: null, prices: [{ amountMinor: 7900, currency: "USD" }] },
  { _id: "plan-npd-90", name: "Growth + Donations — 90 days", durationDays: 90, isPolitical: false, donationSupported: true, isActive: true, archivedAt: null, prices: [{ amountMinor: 18900, currency: "USD" }] },
  { _id: "plan-pol-30", name: "Civic — 30 days", durationDays: 30, isPolitical: true, donationSupported: false, isActive: true, archivedAt: null, prices: [{ amountMinor: 9900, currency: "USD" }] },
  { _id: "plan-pol-90", name: "Civic Plus — 90 days", durationDays: 90, isPolitical: true, donationSupported: false, isActive: true, archivedAt: null, prices: [{ amountMinor: 24900, currency: "USD" }] },
  { _id: "plan-pold-90", name: "Civic + Donations — 90 days", durationDays: 90, isPolitical: true, donationSupported: true, isActive: true, archivedAt: null, prices: [{ amountMinor: 34900, currency: "USD" }] },
  { _id: "plan-pold-180", name: "Civic + Donations — 180 days", durationDays: 180, isPolitical: true, donationSupported: true, isActive: true, archivedAt: null, prices: [{ amountMinor: 54900, currency: "USD" }] },
];

// ============================= CAMPAIGNS =============================
// Listing (advanced-listing) reads a THIRD envelope shape: {entries, total} at the
// payload root — no `meta`, no `items`. `externalAuthor` is a plain id string in the
// listing but a populated object on the detail endpoint.
export const campaigns = [
  { _id: "campaign-001", name: "Clean Rivers Initiative", goal: "Fund quarterly river cleanups across three metro regions and publish open water-quality data.", status: "live", isPolitical: false, externalAuthor: "user-001", description: "A community-led effort to restore urban waterways through recurring cleanup drives and transparent reporting.", createdAt: "2026-03-02T00:00:00.000Z", updatedAt: "2026-08-10T00:00:00.000Z", planId: "plan-npd-90", donation: true },
  { _id: "campaign-002", name: "Transit Fare Reform", goal: "Petition the transit authority for a capped daily fare and expanded off-peak discounts.", status: "live", isPolitical: true, externalAuthor: "user-003", description: "Riders across the metro are calling for a fairer fare structure that protects daily commuters.", createdAt: "2026-02-18T00:00:00.000Z", updatedAt: "2026-08-14T00:00:00.000Z", planId: "plan-pol-90", donation: false },
  { _id: "campaign-003", name: "Open Source Grants Fund", goal: "Raise a community fund to sponsor maintainers of critical open source infrastructure.", status: "live", isPolitical: false, externalAuthor: "user-006", description: "Small recurring grants aimed at the unglamorous libraries everything else depends on.", createdAt: "2026-01-25T00:00:00.000Z", updatedAt: "2026-08-05T00:00:00.000Z", planId: "plan-npd-30", donation: true },
  { _id: "campaign-004", name: "Neighborhood Solar Co-op", goal: "Sign up 500 households for a bulk-purchase rooftop solar programme.", status: "draft", isPolitical: false, externalAuthor: "user-002", description: "Collective buying power to bring rooftop solar within reach for ordinary households.", createdAt: "2026-04-11T00:00:00.000Z", updatedAt: "2026-07-29T00:00:00.000Z", planId: "plan-np-180", donation: false },
  { _id: "campaign-005", name: "School Meal Standards", goal: "Campaign for published nutrition standards in every public school district.", status: "scheduled", isPolitical: true, externalAuthor: "user-005", description: "Parents and teachers pushing for transparency in what gets served at lunch.", createdAt: "2026-02-02T00:00:00.000Z", updatedAt: "2026-06-20T00:00:00.000Z", planId: "plan-pol-30", donation: false },
  { _id: "campaign-006", name: "Local Journalism Fund", goal: "Sustain three independent newsrooms covering municipal government.", status: "live", isPolitical: false, externalAuthor: "user-010", description: "Civic reporting is disappearing; this fund keeps reporters in council chambers.", createdAt: "2026-03-19T00:00:00.000Z", updatedAt: "2026-08-16T00:00:00.000Z", planId: "plan-npd-90", donation: true },
  { _id: "campaign-007", name: "Bike Lane Expansion", goal: "Secure protected bike lanes on the six highest-collision corridors.", status: "ended", isPolitical: true, externalAuthor: "user-007", description: "A data-driven proposal built from three years of collision reports.", createdAt: "2025-11-08T00:00:00.000Z", updatedAt: "2026-05-30T00:00:00.000Z", planId: "plan-pold-180", donation: true },
  { _id: "campaign-008", name: "Digital Literacy for Seniors", goal: "Run free weekly workshops on online safety in twelve community centres.", status: "live", isPolitical: false, externalAuthor: "user-008", description: "Practical, patient training that helps older residents avoid scams and stay connected.", createdAt: "2026-05-06T00:00:00.000Z", updatedAt: "2026-08-12T00:00:00.000Z", planId: "plan-np-90", donation: false },
  { _id: "campaign-009", name: "Affordable Housing Audit", goal: "Publish an independent audit of stalled affordable-housing commitments.", status: "draft", isPolitical: true, externalAuthor: "user-012", description: "Tracking the gap between what was promised and what actually got built.", createdAt: "2026-06-14T00:00:00.000Z", updatedAt: "2026-08-01T00:00:00.000Z", planId: "plan-pold-90", donation: true },
  { _id: "campaign-010", name: "Urban Tree Canopy", goal: "Plant and maintain 10,000 street trees in low-canopy neighbourhoods.", status: "live", isPolitical: false, externalAuthor: "user-004", description: "Shade, cleaner air, and cooler streets where they are needed most.", createdAt: "2026-04-28T00:00:00.000Z", updatedAt: "2026-08-15T00:00:00.000Z", planId: "plan-npd-30", donation: true },
  { _id: "campaign-011", name: "Small Business Recovery", goal: "Connect 300 independent shops with low-interest recovery microloans.", status: "scheduled", isPolitical: false, externalAuthor: "user-011", description: "Bridging the gap for main-street businesses that fall through traditional lending.", createdAt: "2026-01-12T00:00:00.000Z", updatedAt: "2026-07-04T00:00:00.000Z", planId: "plan-np-30", donation: false },
  { _id: "campaign-012", name: "Election Poll Worker Drive", goal: "Recruit and train 2,000 poll workers ahead of the municipal election.", status: "live", isPolitical: true, externalAuthor: "user-009", description: "Well-staffed polling places mean shorter lines and smoother elections for everyone.", createdAt: "2026-05-21T00:00:00.000Z", updatedAt: "2026-08-17T00:00:00.000Z", planId: "plan-pol-90", donation: false },
  { _id: "campaign-013", name: "Community Fridge Network", goal: "Stock and maintain fifteen neighbourhood fridges year-round.", status: "live", isPolitical: false, externalAuthor: "user-001", description: "Take what you need, leave what you can — a simple answer to local food insecurity.", createdAt: "2026-06-02T00:00:00.000Z", updatedAt: "2026-08-13T00:00:00.000Z", planId: "plan-npd-90", donation: true },
  { _id: "campaign-014", name: "Public Wi-Fi Access", goal: "Extend free municipal Wi-Fi to every public library and park.", status: "ended", isPolitical: false, externalAuthor: "user-003", description: "Closing the connectivity gap for students and jobseekers without home broadband.", createdAt: "2025-09-15T00:00:00.000Z", updatedAt: "2026-03-22T00:00:00.000Z", planId: "plan-np-180", donation: false },
];

const CAMPAIGN_INDUSTRIES = [
  { _id: "industry-001", name: "Environment" },
  { _id: "industry-002", name: "Civic Technology" },
  { _id: "industry-003", name: "Public Health" },
  { _id: "industry-004", name: "Education" },
  { _id: "industry-005", name: "Transportation" },
];

export function buildCampaignDetail(row: (typeof campaigns)[number]) {
  const author = externalUsers.find((u) => u._id === row.externalAuthor);
  const level = author ? LEVELS[Math.min(author.level, LEVELS.length) - 1] ?? LEVELS[0] : LEVELS[0];
  const slug = row.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const industries = CAMPAIGN_INDUSTRIES.slice(0, 2 + (row.name.length % 3));
  return {
    _id: row._id,
    name: row.name,
    goal: row.goal,
    status: row.status,
    isPolitical: row.isPolitical,
    description: row.description,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    externalAuthor: author
      ? {
          _id: author._id,
          username: author.username,
          avatar: { name: level.title, imageUrl: level.image },
        }
      : null,
    websiteLink: `https://${slug}.org`,
    twitterLink: `https://x.com/${slug.replace(/-/g, "")}`,
    instagramLink: `https://instagram.com/${slug.replace(/-/g, "")}`,
    telegramLink: `https://t.me/${slug.replace(/-/g, "")}`,
    videoLink: "",
    emailLink: `hello@${slug}.org`,
    // campaign-detail-sections.tsx renders these with .join(", "), so they must be
    // plain name strings here — unlike poll/trial targetGeo, which holds {_id,name}.
    targetGeo: {
      countries: ["India", "United States"],
      states: ["Maharashtra"],
      cities: ["Mumbai"],
    },
    linkedIndustries: {
      campaignId: row._id,
      industryIds: industries.map((i) => i._id),
      industries,
    },
    currentPlan: {
      campaignId: row._id,
      active: row.status === "live",
      reason:
        row.status === "live"
          ? "Plan is active and billing is current."
          : row.status === "scheduled"
            ? "Plan scheduled to start on the campaign's launch date."
            : row.status === "ended"
              ? "Campaign completed; plan has ended."
              : "Plan not yet activated for this draft.",
    },
    shareFeatureField: {
      isEnabled: row.status === "live",
      referral_levels: referralConfigLevels,
    },
    isDonationSupported: row.donation,
    isPetitionEnabled: row.isPolitical,
    rewardSums: { activeTrials: [], computedByAsset: [], rewardAmountByAsset: [], rewardCapByAsset: [] },
    imageLinks: [],
    uploadedVideoLinks: [],
    latestPetition: null,
    seenAt: null,
    bookmarkAt: null,
  };
}

// ============================= INDUSTRIES =============================
// One endpoint serves two different envelope readers: pages/industry/index.tsx reads
// {entries,total} while IndustryInfiniteSelect (useApiInfiniteQuery) reads
// entries+meta — mock-api.ts returns both keys off the same payload.
export const industries = [
  { _id: "industry-001", name: "Environment", description: "Climate, conservation, energy transition, and sustainability initiatives.", archivedAt: null, createdAt: "2026-01-05T00:00:00.000Z", updatedAt: "2026-06-11T00:00:00.000Z", internalAuthor: null },
  { _id: "industry-002", name: "Civic Technology", description: "Digital public infrastructure, open data, and government service delivery.", archivedAt: null, createdAt: "2026-01-08T00:00:00.000Z", updatedAt: "2026-07-02T00:00:00.000Z", internalAuthor: null },
  { _id: "industry-003", name: "Public Health", description: "Healthcare access, preventive care, and community health programmes.", archivedAt: null, createdAt: "2026-01-12T00:00:00.000Z", updatedAt: "2026-05-28T00:00:00.000Z", internalAuthor: null },
  { _id: "industry-004", name: "Education", description: "Schools, higher education, vocational training, and lifelong learning.", archivedAt: null, createdAt: "2026-01-19T00:00:00.000Z", updatedAt: "2026-08-01T00:00:00.000Z", internalAuthor: null },
  { _id: "industry-005", name: "Transportation", description: "Public transit, road safety, cycling infrastructure, and mobility policy.", archivedAt: null, createdAt: "2026-02-01T00:00:00.000Z", updatedAt: "2026-07-19T00:00:00.000Z", internalAuthor: null },
  { _id: "industry-006", name: "Financial Services", description: "Banking, payments, lending, and consumer financial protection.", archivedAt: null, createdAt: "2026-02-14T00:00:00.000Z", updatedAt: "2026-06-30T00:00:00.000Z", internalAuthor: null },
  { _id: "industry-007", name: "Web3 & Digital Assets", description: "Blockchain networks, custody, tokenised assets, and on-chain governance.", archivedAt: null, createdAt: "2026-02-22T00:00:00.000Z", updatedAt: "2026-08-09T00:00:00.000Z", internalAuthor: null },
  { _id: "industry-008", name: "Media & Journalism", description: "News publishing, local reporting, and information integrity.", archivedAt: null, createdAt: "2026-03-03T00:00:00.000Z", updatedAt: "2026-07-25T00:00:00.000Z", internalAuthor: null },
  { _id: "industry-009", name: "Retail & E-commerce", description: "Consumer goods, marketplaces, and direct-to-consumer brands.", archivedAt: null, createdAt: "2026-03-15T00:00:00.000Z", updatedAt: "2026-06-05T00:00:00.000Z", internalAuthor: null },
  { _id: "industry-010", name: "Housing & Urban Planning", description: "Affordable housing, zoning reform, and urban development.", archivedAt: null, createdAt: "2026-03-27T00:00:00.000Z", updatedAt: "2026-08-04T00:00:00.000Z", internalAuthor: null },
  { _id: "industry-011", name: "Food & Agriculture", description: "Food security, supply chains, and sustainable farming practices.", archivedAt: null, createdAt: "2026-04-08T00:00:00.000Z", updatedAt: "2026-07-12T00:00:00.000Z", internalAuthor: null },
  { _id: "industry-012", name: "Arts & Culture", description: "Museums, live performance, public art, and creative funding.", archivedAt: null, createdAt: "2026-04-20T00:00:00.000Z", updatedAt: "2026-06-18T00:00:00.000Z", internalAuthor: null },
  { _id: "industry-013", name: "Telecommunications", description: "Broadband access, spectrum policy, and network infrastructure.", archivedAt: "2026-05-30T00:00:00.000Z", createdAt: "2026-01-30T00:00:00.000Z", updatedAt: "2026-05-30T00:00:00.000Z", internalAuthor: null },
  { _id: "industry-014", name: "Legacy Print Media", description: "Deprecated category retained for historical campaign records.", archivedAt: "2026-04-02T00:00:00.000Z", createdAt: "2025-11-11T00:00:00.000Z", updatedAt: "2026-04-02T00:00:00.000Z", internalAuthor: null },
];

// ============================= AD OWNERS =============================
// Same dual-envelope situation as industries: the listing page reads {entries,total}
// while AdOwnerInfiniteSelect reads entries+meta.
export const adOwners = [
  { _id: "adowner-001", name: "Northwind Beverages", description: "Sparkling water and cold-brew brand running seasonal awareness pushes.", archivedAt: null, createdAt: "2026-01-09T00:00:00.000Z", updatedAt: "2026-07-14T00:00:00.000Z", internalAuthor: null },
  { _id: "adowner-002", name: "Meridian Financial", description: "Retail banking group promoting savings products to first-time earners.", archivedAt: null, createdAt: "2026-01-21T00:00:00.000Z", updatedAt: "2026-08-02T00:00:00.000Z", internalAuthor: null },
  { _id: "adowner-003", name: "Vantage Mobility", description: "EV subscription service targeting metro commuters.", archivedAt: null, createdAt: "2026-02-03T00:00:00.000Z", updatedAt: "2026-06-27T00:00:00.000Z", internalAuthor: null },
  { _id: "adowner-004", name: "Harbor Health", description: "Telehealth provider advertising preventive screening programmes.", archivedAt: null, createdAt: "2026-02-17T00:00:00.000Z", updatedAt: "2026-07-30T00:00:00.000Z", internalAuthor: null },
  { _id: "adowner-005", name: "Bright Path Learning", description: "Online skills academy running enrolment campaigns each term.", archivedAt: null, createdAt: "2026-03-01T00:00:00.000Z", updatedAt: "2026-08-06T00:00:00.000Z", internalAuthor: null },
  { _id: "adowner-006", name: "Orchard Grocers", description: "Regional grocery chain promoting weekly fresh-produce offers.", archivedAt: null, createdAt: "2026-03-14T00:00:00.000Z", updatedAt: "2026-07-08T00:00:00.000Z", internalAuthor: null },
  { _id: "adowner-007", name: "Summit Outdoor Co.", description: "Hiking and camping gear retailer with seasonal product launches.", archivedAt: null, createdAt: "2026-03-26T00:00:00.000Z", updatedAt: "2026-08-11T00:00:00.000Z", internalAuthor: null },
  { _id: "adowner-008", name: "Lumen Energy", description: "Residential solar installer advertising rebate-backed packages.", archivedAt: null, createdAt: "2026-04-07T00:00:00.000Z", updatedAt: "2026-06-22T00:00:00.000Z", internalAuthor: null },
  { _id: "adowner-009", name: "Cobalt Studios", description: "Independent game studio marketing upcoming title releases.", archivedAt: null, createdAt: "2026-04-19T00:00:00.000Z", updatedAt: "2026-08-08T00:00:00.000Z", internalAuthor: null },
  { _id: "adowner-010", name: "Terrace Hospitality", description: "Boutique hotel group promoting off-season city breaks.", archivedAt: null, createdAt: "2026-05-02T00:00:00.000Z", updatedAt: "2026-07-21T00:00:00.000Z", internalAuthor: null },
  { _id: "adowner-011", name: "Ledger & Co.", description: "Accounting software vendor targeting small business owners.", archivedAt: null, createdAt: "2026-05-15T00:00:00.000Z", updatedAt: "2026-08-03T00:00:00.000Z", internalAuthor: null },
  { _id: "adowner-012", name: "Atlas Freight", description: "Logistics operator advertising same-week regional shipping.", archivedAt: "2026-06-12T00:00:00.000Z", createdAt: "2026-02-28T00:00:00.000Z", updatedAt: "2026-06-12T00:00:00.000Z", internalAuthor: null },
  { _id: "adowner-013", name: "Copperline Telecom", description: "Deprecated owner record retained for historical ad reporting.", archivedAt: "2026-05-05T00:00:00.000Z", createdAt: "2025-12-01T00:00:00.000Z", updatedAt: "2026-05-05T00:00:00.000Z", internalAuthor: null },
];

// ============================= ADS =============================
// Status literals must match the listing filter dropdown: draft|scheduled|live|ended.
// uploadedImageLinks point at repo assets so creatives always render.
import adCreativeA from "@/assets/cmpn.png";
import adCreativeB from "@/assets/chart.png";
import adCreativeC from "@/assets/bubble.png";
import adCreativeD from "@/assets/terra.png";

const AD_CREATIVES = [adCreativeA, adCreativeB, adCreativeC, adCreativeD];

type AdSeed = {
  _id: string;
  adOwnerId: string;
  title: string;
  description: string;
  status: "draft" | "scheduled" | "live" | "ended";
  hyperlink: string | null;
  buttonText: string | null;
  startTime: string | null;
  endTime: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  industryIds: string[];
  creativeIndex: number;
};

export const ads: AdSeed[] = [
  { _id: "ad-001", adOwnerId: "adowner-001", title: "Sparkling Citrus — Summer Launch", description: "Introducing three new citrus flavours, brewed with sparkling spring water and zero added sugar.", status: "live", hyperlink: "https://northwind-beverages.example.com/citrus", buttonText: "Shop the range", startTime: "2026-07-01T09:00:00.000Z", endTime: "2026-09-30T21:00:00.000Z", archivedAt: null, createdAt: "2026-06-20T00:00:00.000Z", updatedAt: "2026-08-01T00:00:00.000Z", industryIds: ["industry-011", "industry-009"], creativeIndex: 0 },
  { _id: "ad-002", adOwnerId: "adowner-002", title: "Start Saving with Zero Fees", description: "Open a Meridian savings account in minutes and earn competitive interest with no monthly charges.", status: "live", hyperlink: "https://meridian-financial.example.com/savings", buttonText: "Open an account", startTime: "2026-06-15T08:00:00.000Z", endTime: "2026-12-15T20:00:00.000Z", archivedAt: null, createdAt: "2026-06-01T00:00:00.000Z", updatedAt: "2026-07-28T00:00:00.000Z", industryIds: ["industry-006"], creativeIndex: 1 },
  { _id: "ad-003", adOwnerId: "adowner-003", title: "Drive Electric, Skip the Showroom", description: "An all-inclusive EV subscription covering insurance, servicing, and charging for one monthly price.", status: "live", hyperlink: "https://vantage-mobility.example.com/subscribe", buttonText: "See plans", startTime: "2026-05-10T07:00:00.000Z", endTime: "2026-11-10T19:00:00.000Z", archivedAt: null, createdAt: "2026-05-01T00:00:00.000Z", updatedAt: "2026-08-09T00:00:00.000Z", industryIds: ["industry-005", "industry-001"], creativeIndex: 2 },
  { _id: "ad-004", adOwnerId: "adowner-004", title: "Book a Free Health Screening", description: "Preventive screening appointments now available same week, online or at a clinic near you.", status: "scheduled", hyperlink: "https://harbor-health.example.com/screening", buttonText: "Book now", startTime: "2026-09-01T06:00:00.000Z", endTime: "2026-10-31T18:00:00.000Z", archivedAt: null, createdAt: "2026-08-05T00:00:00.000Z", updatedAt: "2026-08-12T00:00:00.000Z", industryIds: ["industry-003"], creativeIndex: 3 },
  { _id: "ad-005", adOwnerId: "adowner-005", title: "Autumn Term Enrolment Is Open", description: "Short, practical courses in data, design, and product — taught live by working professionals.", status: "scheduled", hyperlink: "https://brightpath-learning.example.com/enrol", buttonText: "Browse courses", startTime: "2026-08-25T08:00:00.000Z", endTime: "2026-10-15T20:00:00.000Z", archivedAt: null, createdAt: "2026-08-01T00:00:00.000Z", updatedAt: "2026-08-14T00:00:00.000Z", industryIds: ["industry-004"], creativeIndex: 0 },
  { _id: "ad-006", adOwnerId: "adowner-006", title: "Fresh Produce, Half Price Fridays", description: "Every Friday, seasonal fruit and vegetables are half price across all Orchard Grocers stores.", status: "live", hyperlink: "https://orchard-grocers.example.com/offers", buttonText: "View this week", startTime: "2026-04-01T05:00:00.000Z", endTime: "2026-12-31T22:00:00.000Z", archivedAt: null, createdAt: "2026-03-20T00:00:00.000Z", updatedAt: "2026-08-15T00:00:00.000Z", industryIds: ["industry-011", "industry-009"], creativeIndex: 1 },
  { _id: "ad-007", adOwnerId: "adowner-007", title: "Trail Season Starts Here", description: "New lightweight packs and all-weather shells, tested on long-distance routes.", status: "ended", hyperlink: "https://summit-outdoor.example.com/trail", buttonText: "Shop gear", startTime: "2026-02-01T07:00:00.000Z", endTime: "2026-05-31T19:00:00.000Z", archivedAt: null, createdAt: "2026-01-15T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z", industryIds: ["industry-009"], creativeIndex: 2 },
  { _id: "ad-008", adOwnerId: "adowner-008", title: "Solar Rebates End This Year", description: "Lock in current rebate rates on a rooftop solar install before the scheme changes.", status: "live", hyperlink: "https://lumen-energy.example.com/rebates", buttonText: "Get a quote", startTime: "2026-06-01T06:00:00.000Z", endTime: "2026-12-20T20:00:00.000Z", archivedAt: null, createdAt: "2026-05-18T00:00:00.000Z", updatedAt: "2026-08-07T00:00:00.000Z", industryIds: ["industry-001"], creativeIndex: 3 },
  { _id: "ad-009", adOwnerId: "adowner-009", title: "Wishlist Our Next Release", description: "A hand-drawn puzzle adventure arriving next spring. Add it to your wishlist for launch-day pricing.", status: "draft", hyperlink: "https://cobalt-studios.example.com/wishlist", buttonText: "Add to wishlist", startTime: null, endTime: null, archivedAt: null, createdAt: "2026-08-10T00:00:00.000Z", updatedAt: "2026-08-16T00:00:00.000Z", industryIds: ["industry-012"], creativeIndex: 0 },
  { _id: "ad-010", adOwnerId: "adowner-010", title: "City Breaks, Off-Season Rates", description: "Midweek stays at boutique properties in six cities, with breakfast and late checkout included.", status: "live", hyperlink: "https://terrace-hospitality.example.com/citybreaks", buttonText: "Find a stay", startTime: "2026-07-15T08:00:00.000Z", endTime: "2026-11-30T20:00:00.000Z", archivedAt: null, createdAt: "2026-07-01T00:00:00.000Z", updatedAt: "2026-08-13T00:00:00.000Z", industryIds: ["industry-012"], creativeIndex: 1 },
  { _id: "ad-011", adOwnerId: "adowner-011", title: "Close Your Books in Half the Time", description: "Automated reconciliation and tax-ready reports built for independent businesses.", status: "live", hyperlink: "https://ledger-co.example.com/smallbusiness", buttonText: "Try it free", startTime: "2026-03-01T07:00:00.000Z", endTime: "2026-12-01T19:00:00.000Z", archivedAt: null, createdAt: "2026-02-20T00:00:00.000Z", updatedAt: "2026-08-04T00:00:00.000Z", industryIds: ["industry-006", "industry-002"], creativeIndex: 2 },
  { _id: "ad-012", adOwnerId: "adowner-001", title: "Cold Brew, Delivered Weekly", description: "A recurring cold-brew subscription with free delivery and pause-anytime flexibility.", status: "draft", hyperlink: "https://northwind-beverages.example.com/coldbrew", buttonText: "Start subscription", startTime: null, endTime: null, archivedAt: null, createdAt: "2026-08-12T00:00:00.000Z", updatedAt: "2026-08-17T00:00:00.000Z", industryIds: ["industry-011"], creativeIndex: 3 },
  { _id: "ad-013", adOwnerId: "adowner-003", title: "Refer a Friend, Get a Free Month", description: "Existing subscribers earn a free month for every friend who completes their first booking.", status: "ended", hyperlink: "https://vantage-mobility.example.com/refer", buttonText: "Refer now", startTime: "2026-01-10T07:00:00.000Z", endTime: "2026-04-10T19:00:00.000Z", archivedAt: null, createdAt: "2025-12-20T00:00:00.000Z", updatedAt: "2026-04-11T00:00:00.000Z", industryIds: ["industry-005"], creativeIndex: 0 },
  { _id: "ad-014", adOwnerId: "adowner-012", title: "Same-Week Regional Shipping", description: "Guaranteed regional delivery windows for wholesale and bulk consignments.", status: "ended", hyperlink: "https://atlas-freight.example.com/regional", buttonText: "Get rates", startTime: "2026-02-15T06:00:00.000Z", endTime: "2026-06-01T18:00:00.000Z", archivedAt: "2026-06-12T00:00:00.000Z", createdAt: "2026-02-01T00:00:00.000Z", updatedAt: "2026-06-12T00:00:00.000Z", industryIds: ["industry-005"], creativeIndex: 1 },
  { _id: "ad-015", adOwnerId: "adowner-005", title: "Scholarship Applications Close Soon", description: "Fifty fully funded places available across all autumn cohorts. Applications close at the end of the month.", status: "scheduled", hyperlink: "https://brightpath-learning.example.com/scholarships", buttonText: "Apply now", startTime: "2026-09-05T08:00:00.000Z", endTime: "2026-09-30T20:00:00.000Z", archivedAt: null, createdAt: "2026-08-14T00:00:00.000Z", updatedAt: "2026-08-16T00:00:00.000Z", industryIds: ["industry-004"], creativeIndex: 2 },
];

export function buildAdDetail(row: AdSeed) {
  const owner = adOwners.find((o) => o._id === row.adOwnerId);
  const linked = industries.filter((i) => row.industryIds.includes(i._id));
  return {
    _id: row._id,
    adOwnerId: row.adOwnerId,
    adOwner: owner ? { _id: owner._id, name: owner.name, description: owner.description } : null,
    internalAuthor: null,
    title: row.title,
    description: row.description,
    uploadedImageLinks: [AD_CREATIVES[row.creativeIndex % AD_CREATIVES.length]],
    uploadedVideoLinks: [] as string[],
    hyperlink: row.hyperlink,
    buttonText: row.buttonText,
    startTime: row.startTime,
    endTime: row.endTime,
    status: row.status,
    archivedAt: row.archivedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    industries: linked,
  };
}

// Listing rows carry a lighter shape than the detail object.
export function buildAdListItem(row: AdSeed) {
  const owner = adOwners.find((o) => o._id === row.adOwnerId);
  return {
    _id: row._id,
    adOwnerId: row.adOwnerId,
    adOwner: owner ? { _id: owner._id, name: owner.name, description: owner.description } : null,
    title: row.title,
    description: row.description,
    status: row.status,
    archivedAt: row.archivedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// GET /internal/advertisement/ad/stats returns [{ "<adId>": payload }].
// All counts are raw integers as {total, unique} — no scaling anywhere.
export function buildAdStats(row: AdSeed, basis: string) {
  const seed = row._id.split("-")[1] ? parseInt(row._id.split("-")[1], 10) : 1;
  const scale = basis === "click" ? 0.18 : 1;
  const mk = (total: number) => ({
    total: Math.round(total * scale),
    unique: Math.round(total * scale * 0.68),
  });
  const baseVisits = 12000 + seed * 1350;
  const visits = mk(baseVisits);
  const clicks = {
    total: Math.round(baseVisits * 0.14 * (basis === "click" ? 1 : 1)),
    unique: Math.round(baseVisits * 0.14 * 0.7),
  };

  const countryWise = [
    { _id: "country-in", name: "India", iso3: "IND", visits: mk(baseVisits * 0.34), clicks: mk(baseVisits * 0.34 * 0.14) },
    { _id: "country-us", name: "United States", iso3: "USA", visits: mk(baseVisits * 0.27), clicks: mk(baseVisits * 0.27 * 0.14) },
    { _id: "country-gb", name: "United Kingdom", iso3: "GBR", visits: mk(baseVisits * 0.14), clicks: mk(baseVisits * 0.14 * 0.14) },
    { _id: "country-de", name: "Germany", iso3: "DEU", visits: mk(baseVisits * 0.11), clicks: mk(baseVisits * 0.11 * 0.14) },
    { _id: "country-sg", name: "Singapore", iso3: "SGP", visits: mk(baseVisits * 0.08), clicks: mk(baseVisits * 0.08 * 0.14) },
    { _id: "country-au", name: "Australia", iso3: "AUS", visits: mk(baseVisits * 0.06), clicks: mk(baseVisits * 0.06 * 0.14) },
  ];

  const stateWise = [
    { _id: "state-mh", name: "Maharashtra", countryId: "country-in", iso_3166_2: "IN-MH", visits: mk(baseVisits * 0.19), clicks: mk(baseVisits * 0.19 * 0.14) },
    { _id: "state-ka", name: "Karnataka", countryId: "country-in", iso_3166_2: "IN-KA", visits: mk(baseVisits * 0.15), clicks: mk(baseVisits * 0.15 * 0.14) },
    { _id: "state-ca", name: "California", countryId: "country-us", iso_3166_2: "US-CA", visits: mk(baseVisits * 0.16), clicks: mk(baseVisits * 0.16 * 0.14) },
    { _id: "state-ny", name: "New York", countryId: "country-us", iso_3166_2: "US-NY", visits: mk(baseVisits * 0.11), clicks: mk(baseVisits * 0.11 * 0.14) },
    { _id: "state-eng", name: "England", countryId: "country-gb", iso_3166_2: "GB-ENG", visits: mk(baseVisits * 0.14), clicks: mk(baseVisits * 0.14 * 0.14) },
  ];

  const cityWise = [
    { _id: "city-mumbai", name: "Mumbai", stateId: "state-mh", countryId: "country-in", stateName: "Maharashtra", countryName: "India", visits: mk(baseVisits * 0.12), clicks: mk(baseVisits * 0.12 * 0.14) },
    { _id: "city-bengaluru", name: "Bengaluru", stateId: "state-ka", countryId: "country-in", stateName: "Karnataka", countryName: "India", visits: mk(baseVisits * 0.1), clicks: mk(baseVisits * 0.1 * 0.14) },
    { _id: "city-sf", name: "San Francisco", stateId: "state-ca", countryId: "country-us", stateName: "California", countryName: "United States", visits: mk(baseVisits * 0.09), clicks: mk(baseVisits * 0.09 * 0.14) },
    { _id: "city-nyc", name: "New York City", stateId: "state-ny", countryId: "country-us", stateName: "New York", countryName: "United States", visits: mk(baseVisits * 0.08), clicks: mk(baseVisits * 0.08 * 0.14) },
    { _id: "city-london", name: "London", stateId: "state-eng", countryId: "country-gb", stateName: "England", countryName: "United Kingdom", visits: mk(baseVisits * 0.11), clicks: mk(baseVisits * 0.11 * 0.14) },
    { _id: "city-pune", name: "Pune", stateId: "state-mh", countryId: "country-in", stateName: "Maharashtra", countryName: "India", visits: mk(baseVisits * 0.07), clicks: mk(baseVisits * 0.07 * 0.14) },
  ];

  // levelWise keys are numeric level ids as strings, joined against LEVELS (1..10).
  const levelWeights = [0.24, 0.19, 0.15, 0.12, 0.1, 0.08, 0.05, 0.04, 0.02, 0.01];
  const levelWise: Record<string, { visits: { total: number; unique: number }; clicks: { total: number; unique: number } }> = {};
  levelWeights.forEach((w, i) => {
    levelWise[String(i + 1)] = {
      visits: mk(baseVisits * w),
      clicks: mk(baseVisits * w * 0.14),
    };
  });

  return {
    ad: {
      _id: row._id,
      adOwnerId: row.adOwnerId,
      title: row.title,
      status: row.status,
      archivedAt: row.archivedAt,
      createdAt: row.createdAt,
    },
    visits,
    clicks,
    levelWise,
    countryWise,
    stateWise,
    cityWise,
  };
}

// ============================= BLOGS =============================
// GET /internal/blogs returns {entries:[{_id,title,archivedAt}]} — the listing page
// only ever reads those three fields. Detail nests one level deeper under `.blog`.
import blogCoverA from "@/assets/chart.png";
import blogCoverB from "@/assets/bubble.png";
import blogCoverC from "@/assets/terra.png";

const BLOG_COVERS = [blogCoverA, blogCoverB, blogCoverC];

type BlogSeed = {
  _id: string;
  title: string;
  pollStatement: string;
  content: string;
  archivedAt: string | null;
  createdAt: string;
  responses: { type: string; count: number; percentage: string }[];
  coverCount: number;
};

export const blogs: BlogSeed[] = [
  { _id: "blog-001", title: "Why Civic Polling Needs Real-Time Data", pollStatement: "Should local governments publish poll results within 24 hours?", content: "<p>Civic engagement platforms live or die on trust, and trust depends on speed. When a community poll closes, every day the results sit unpublished is a day the story moves on without them.</p><p>We looked at three cities that switched to same-day reporting and found participation in the next poll rose by double digits.</p>", archivedAt: null, createdAt: "2026-03-04T00:00:00.000Z", responses: [{ type: "Yes", count: 4210, percentage: "68.4" }, { type: "No", count: 1120, percentage: "18.2" }, { type: "Unsure", count: 820, percentage: "13.4" }], coverCount: 2 },
  { _id: "blog-002", title: "Inside a Trial: How Multi-Poll Series Work", pollStatement: "Would you follow a five-part poll series on one topic?", content: "<p>A trial isn't just a bundle of polls — it's a narrative arc. Each poll in the series builds on what the last one revealed, and the best trials know when to introduce a new angle versus when to double down.</p>", archivedAt: null, createdAt: "2026-02-18T00:00:00.000Z", responses: [{ type: "Yes", count: 2980, percentage: "71.0" }, { type: "No", count: 1218, percentage: "29.0" }], coverCount: 1 },
  { _id: "blog-003", title: "Referral Rewards, Explained", pollStatement: "Do referral rewards make you more likely to share a poll?", content: "<p>The referral system pays out in tiers keyed to unique visits, not raw clicks — a deliberate choice to reward genuine reach over link spam.</p><p>We break down how the tiers are set and why the curve gets steeper at higher levels.</p>", archivedAt: null, createdAt: "2026-04-22T00:00:00.000Z", responses: [{ type: "Yes", count: 5510, percentage: "82.1" }, { type: "No", count: 1200, percentage: "17.9" }], coverCount: 3 },
  { _id: "blog-004", title: "Reading Level-Wise Ad Performance", pollStatement: "Should advertisers see which civic levels their ad reaches?", content: "<p>Higher-level users visit more often and share more links — but they're also a smaller slice of the audience. We walk through how to read a level-wise breakdown without over-indexing on your most active users.</p>", archivedAt: null, createdAt: "2026-05-09T00:00:00.000Z", responses: [{ type: "Yes", count: 3040, percentage: "64.3" }, { type: "No", count: 1685, percentage: "35.7" }], coverCount: 1 },
  { _id: "blog-005", title: "A Field Guide to Campaign Plans", pollStatement: "Should political and non-political campaigns follow the same pricing?", content: "<p>Political campaigns carry different disclosure obligations, and our plan tiers reflect that — separate pricing, separate donation rules, same underlying infrastructure.</p>", archivedAt: "2026-06-01T00:00:00.000Z", createdAt: "2026-01-30T00:00:00.000Z", responses: [{ type: "Yes", count: 1890, percentage: "51.2" }, { type: "No", count: 1802, percentage: "48.8" }], coverCount: 2 },
  { _id: "blog-006", title: "What We Learned From 100 Archived Polls", pollStatement: "Should archived polls stay searchable after expiry?", content: "<p>Archiving isn't deletion. Looking back across a hundred closed polls, the ones that kept driving traffic after expiry were almost always the ones left publicly searchable.</p>", archivedAt: null, createdAt: "2026-07-11T00:00:00.000Z", responses: [{ type: "Yes", count: 4021, percentage: "77.5" }, { type: "No", count: 1167, percentage: "22.5" }], coverCount: 1 },
];

export function buildBlogDetail(row: BlogSeed) {
  const images = Array.from({ length: row.coverCount }).map((_, i) => BLOG_COVERS[(row._id.length + i) % BLOG_COVERS.length]);
  return {
    blog: {
      _id: row._id,
      title: row.title,
      pollStatement: row.pollStatement,
      content: row.content,
      imageUrls: images,
      archivedAt: row.archivedAt,
      createdAt: row.createdAt,
      responses: row.responses,
    },
  };
}

// ============================= PAYMENTS =============================
// all-payments/index.tsx carries its OWN local currency helpers rather than the shared
// utils, so the wire contract is specific:
//   - fiat amounts are MINOR units (cents) as `number`, divided by a hardcoded /100
//   - `currency` must be a valid ISO code or Intl.NumberFormat throws a RangeError
//   - crypto `amountAtomic` is a plain integer STRING fed straight to BigInt() —
//     any non-integer string crashes the render
//   - crypto decimals come from `tokenDecimals` on the payload, NOT assetSpecs
// Crypto rows also need `amountMinorEquivalent` or they contribute 0 to the per-card
// "Total Payment done (USD eq.)" aggregate.
const PAYMENT_PLAN_IDS = [
  "NP_1M_PLAN", "NP_3M_PLUS_PLAN", "NP_6M_PLAN", "P_1M_PLUS_PLAN", "P_3M_PLAN", "P_6M_PLUS_PLAN",
];

const PAYMENT_CAMPAIGN_NAMES = [
  "Clean Rivers Initiative", "Transit Fare Reform", "Open Source Grants Fund",
  "Neighborhood Solar Co-op", "Local Journalism Fund", "Urban Tree Canopy",
];

function paymentUser(i: number) {
  const u = externalUsers[i % externalUsers.length];
  const level = LEVELS[Math.min(u.level, LEVELS.length) - 1] ?? LEVELS[0];
  return {
    _id: u._id,
    username: u.username,
    avatar: { name: level.title, imageUrl: level.image },
  };
}

export function generatePayments(count = 23) {
  const statuses = ["succeeded", "processing", "created", "succeeded", "succeeded"];
  return Array.from({ length: count }).map((_, i) => {
    const isCrypto = i % 4 === 3;
    const isPlan = i % 3 !== 2;
    const status = statuses[i % statuses.length];
    // Cents. Plan purchases mirror the campaign plan prices; token buys are smaller.
    const amountMinor = isPlan ? [4900, 12900, 22900, 7900, 18900, 9900][i % 6] : [2500, 5000, 10000][i % 3];
    const day = String((i % 27) + 1).padStart(2, "0");
    const month = String((i % 8) + 1).padStart(2, "0");
    const createdAt = `2026-${month}-${day}T10:${String(i % 60).padStart(2, "0")}:00.000Z`;
    // Two consecutive entries share a campaign so the per-card campaign total is non-trivial.
    const campaignIdx = Math.floor(i / 2) % PAYMENT_CAMPAIGN_NAMES.length;

    const base: any = {
      _id: `pay-${String(i + 1).padStart(3, "0")}`,
      status,
      purpose: isPlan ? "purchase-campaign-plan" : "purchase-asset-token",
      currency: "USD",
      amount: amountMinor,
      createdAt,
      updatedAt: createdAt,
      externalAccountId: paymentUser(i),
      invoiceUrl: status === "succeeded" ? `https://invoices.xpoll.ai/${`pay-${String(i + 1).padStart(3, "0")}`}.pdf` : null,
      context: isPlan
        ? {
            planId: PAYMENT_PLAN_IDS[i % PAYMENT_PLAN_IDS.length],
            create_campaign: { name: PAYMENT_CAMPAIGN_NAMES[campaignIdx] },
            fulfillment: { campaignId: `campaign-${String(campaignIdx + 1).padStart(3, "0")}` },
          }
        : {},
      paymentBreakdown: {
        paymentAmountMinor: amountMinor,
        processingAmountMinor: Math.round(amountMinor * 0.029) + 30,
        platformFeesAmountMinor: Math.round(amountMinor * 0.01),
        netReceivedAmountMinor: amountMinor - (Math.round(amountMinor * 0.029) + 30) - Math.round(amountMinor * 0.01),
      },
    };

    if (isCrypto) {
      // USDC has 6 decimals: amountMinor cents -> atomic USDC (x10^4).
      const atomic = String(amountMinor * 10000);
      base.provider = { family: "crypto", code: "evm", refs: { intentId: `pi_crypto_${i + 1}` } };
      base.display = {
        rail: "crypto",
        crypto: {
          currency: "USDC",
          tokenSymbol: "USDC",
          amountAtomic: atomic,
          tokenDecimals: 6,
          txHash: `0x${(i + 1).toString(16).padStart(8, "0")}${"a4f9c2e17b3d86051f2c9b7e4a0d3856cf1b29e7d4a6"}`,
          amountMinorEquivalent: amountMinor,
        },
      };
      base.quote = {
        kind: "crypto",
        pricing: { currency: "USD", amountMinor },
        payload: { tokenSymbol: "USDC", tokenDecimals: 6, expectedAmountAtomic: atomic },
      };
      base.settlement = {
        kind: "crypto",
        payload: {
          txHash: base.display.crypto.txHash,
          tokenSymbol: "USDC",
          tokenDecimals: 6,
          amountAtomic: atomic,
          amountMinorEquivalent: amountMinor,
        },
      };
    } else {
      base.provider = { family: "fiat", code: "stripe", refs: { intentId: `pi_3Q${(i + 1).toString(36)}XkLm2ePfGh` } };
      base.display = {
        rail: "fiat",
        fiat: {
          currency: "USD",
          amountMinor,
          amountReceivedMinor: amountMinor - (Math.round(amountMinor * 0.029) + 30),
        },
      };
      base.quote = { kind: "fiat", pricing: { currency: "USD", amountMinor } };
      base.settlement = { kind: "fiat", payload: {} };
    }

    return base;
  });
}

// ============================= OFFLINE PAYMENTS =============================
// Served by the SAME /internal/payment/all-payments endpoint as regular payments,
// differentiated only by offlineOnly=true. Different purpose + status vocabularies.
const OFFLINE_PURPOSES = [
  "soul-bound-subscription",
  "ad-experience-subscription",
  "web3-launch-campaign",
] as const;

export function generateOfflinePayments(count = 17) {
  const statuses = ["succeeded", "processing", "created", "failed", "canceled"];
  return Array.from({ length: count }).map((_, i) => {
    const purpose = OFFLINE_PURPOSES[i % OFFLINE_PURPOSES.length];
    const status = statuses[i % statuses.length];
    const amountMinor = [149900, 249900, 99900, 349900][i % 4];
    const day = String((i % 27) + 1).padStart(2, "0");
    const createdAt = `2026-0${(i % 8) + 1}-${day}T09:${String(i % 60).padStart(2, "0")}:00.000Z`;
    const addressed = i % 3 === 0;
    // Some expiries are in the future so the live countdown ticks; others have passed.
    const expiresAt = i % 4 === 1
      ? `2026-08-${String((i % 9) + 20).padStart(2, "0")}T12:00:00.000Z`
      : `2027-0${(i % 6) + 1}-${day}T12:00:00.000Z`;

    const offline: any = { addressStatus: addressed ? "addressed" : "unaddressed", expiresAt };
    const metadata: any = { offline };
    const context: any = {};

    if (purpose === "web3-launch-campaign") {
      context.campaignId = `campaign-${String((i % 12) + 1).padStart(3, "0")}`;
      context.productName = "Web3 Launch Campaign";
      context.offlineProductId = "prod-web3-launch";
    } else if (purpose === "ad-experience-subscription") {
      context.adId = `ad-${String((i % 15) + 1).padStart(3, "0")}`;
      context.productName = "Ad Experience Subscription";
      context.offlineProductId = "prod-ad-experience";
    } else {
      context.productName = "Soul-bound Subscription";
      context.offlineProductId = "prod-soul-bound";
      if (addressed) {
        metadata.soulBoundSubscription = {
          reportLink: `https://reports.xpoll.ai/soul-bound/${`off-${String(i + 1).padStart(3, "0")}`}.pdf`,
        };
      }
    }

    return {
      _id: `off-${String(i + 1).padStart(3, "0")}`,
      status,
      purpose,
      currency: "USD",
      amount: amountMinor,
      createdAt,
      updatedAt: createdAt,
      externalAccountId: paymentUser(i + 2),
      provider: { family: "fiat", code: "offline", refs: { intentId: `off_intent_${i + 1}` } },
      display: { rail: "fiat", fiat: { currency: "USD", amountMinor, amountReceivedMinor: amountMinor } },
      quote: { kind: "fiat", pricing: { currency: "USD", amountMinor } },
      settlement: { kind: "fiat", payload: {} },
      metadata,
      context,
      invoiceUrl: status === "succeeded" ? `https://invoices.xpoll.ai/off-${String(i + 1).padStart(3, "0")}.pdf` : null,
      paymentBreakdown: {
        paymentAmountMinor: amountMinor,
        processingAmountMinor: 0,
        platformFeesAmountMinor: Math.round(amountMinor * 0.02),
        netReceivedAmountMinor: amountMinor - Math.round(amountMinor * 0.02),
      },
    };
  });
}

// ============================= ASSET LEDGER =============================
// GET /internal/asset-ledger/all uses the FLAT `items` envelope (not entries).
// leg.amount is BASE/atomic and goes through toParent, which requires a strict
// integer — a float or decimal string renders as an em-dash instead of a number.
// Note xPoll has decimal 0, so its base amounts are plain counts.
const LEDGER_ACTIONS = [
  "mint", "burn", "fund", "withdraw", "poll-reward", "trial-reward",
  "referral-reward", "sell-intent-approve", "campaign-purchase",
];

const LEDGER_ASSET_UNITS: Record<string, number> = {
  xPoll: 1,            // decimal 0
  xGive: 100,          // decimal 2
  xDrop: 1_000_000,    // decimal 6
  xHigh: 1_000_000,    // decimal 6
  xOcta: 100_000_000,  // decimal 8
  xMYST: 1_000_000_000, // decimal 9
};

const LEDGER_ASSET_IDS = Object.keys(LEDGER_ASSET_UNITS);

export function generateLedgerEntries(count = 96) {
  return Array.from({ length: count }).map((_, i) => {
    const action = LEDGER_ACTIONS[i % LEDGER_ACTIONS.length];
    const user = externalUsers[i % externalUsers.length];
    const isAdminAction = ["mint", "burn", "fund", "withdraw"].includes(action);
    const assetId = LEDGER_ASSET_IDS[i % LEDGER_ASSET_IDS.length];
    const unit = LEDGER_ASSET_UNITS[assetId];
    // Whole-token amounts scaled into base units, kept as integer strings.
    const tokens = [5, 12, 25, 50, 100, 250][i % 6];
    const baseAmount = String(tokens * unit);
    const day = String((i % 27) + 1).padStart(2, "0");
    const month = String((i % 8) + 1).padStart(2, "0");

    return {
      _id: `ledger-${String(i + 1).padStart(4, "0")}`,
      action,
      chain: "base",
      createdAt: `2026-${month}-${day}T${String(i % 24).padStart(2, "0")}:${String(i % 60).padStart(2, "0")}:00.000Z`,
      metadata: isAdminAction ? { assetId, amount: baseAmount } : { username: user.username, assetId, amount: baseAmount },
      legs: [
        { _id: `ledger-${String(i + 1).padStart(4, "0")}-leg-0`, assetId, amount: baseAmount, legName: isAdminAction ? "treasury" : "credit", legType: "credit" },
        { _id: `ledger-${String(i + 1).padStart(4, "0")}-leg-1`, assetId, amount: baseAmount, legName: isAdminAction ? "supply" : "debit", legType: "debit" },
      ],
    };
  });
}

// GET /common/assets/coins — a BARE ARRAY; _id doubles as the assetId.
export const assetCoins = [
  { _id: "xPoll", symbol: "XPL", name: "XPOLL", parent: "XPOLL" },
  { _id: "xOcta", symbol: "XOT", name: "xOCTA", parent: "xAptos" },
  { _id: "xMYST", symbol: "XMT", name: "XMYST", parent: "xSUI" },
  { _id: "xDrop", symbol: "XDP", name: "XDROP", parent: "xXRP" },
  { _id: "xHigh", symbol: "XHG", name: "XHIGH", parent: "xStrain" },
  { _id: "xGive", symbol: "XGV", name: "XGIVE", parent: "xCampaign" },
];

// ============================= SYSTEM REPORT =============================
// Every number here is BASE/atomic and must be a SAFE INTEGER — a float silently
// renders as "0". accountId is read without a guard, so it must always be present.
const SYSTEM_ACCOUNT_IDS = {
  treasury: "aaaaaaaaaaaaaaaaaaaaaaaa",
  exchange: "bbbbbbbbbbbbbbbbbbbbbbbb",
  "poll-funds": "cccccccccccccccccccccccc",
};

export function buildSystemReport() {
  const store = getSystemBalances();
  const mkBlock = (role: keyof typeof SYSTEM_ACCOUNT_IDS) => ({
    role,
    accountId: SYSTEM_ACCOUNT_IDS[role],
    balances: store[role],
    meta: {},
  });

  const summaryByAsset: Record<string, number> = {};
  (Object.keys(store) as (keyof typeof store)[]).forEach((role) => {
    Object.entries(store[role]).forEach(([assetId, amt]) => {
      summaryByAsset[assetId] = (summaryByAsset[assetId] ?? 0) + (amt as number);
    });
  });

  const pollFunds = store["poll-funds"];
  const byAsset: Record<string, { outstanding: number; balance: number; shortfall: number; surplus: number }> = {};
  Object.entries(pollFunds).forEach(([assetId, balance], i) => {
    const bal = balance as number;
    // Alternate between under- and over-funded so both the red shortfall and the
    // green surplus branches are exercised.
    const outstanding = i % 2 === 0 ? Math.round(bal * 1.35) : Math.round(bal * 0.72);
    byAsset[assetId] = {
      outstanding,
      balance: bal,
      shortfall: Math.max(0, outstanding - bal),
      surplus: Math.max(0, bal - outstanding),
    };
  });

  const totals = Object.values(byAsset).reduce(
    (acc, v) => ({
      outstanding: acc.outstanding + v.outstanding,
      balance: acc.balance + v.balance,
      shortfall: acc.shortfall + v.shortfall,
      surplus: acc.surplus + v.surplus,
    }),
    { outstanding: 0, balance: 0, shortfall: 0, surplus: 0 },
  );

  const mintPlan = Object.entries(byAsset)
    .filter(([, v]) => v.shortfall > 0)
    .map(([assetId, v]) => ({ assetId, amount: v.shortfall }));

  return {
    generatedAt: new Date().toISOString(),
    balances: {
      treasury: mkBlock("treasury"),
      exchange: mkBlock("exchange"),
      "poll-funds": mkBlock("poll-funds"),
      summary: { byAsset: summaryByAsset },
    },
    pollFundingNeeds: { byAsset, totals, mintPlan },
  };
}

// Mutable so the Ledger Actions panel (mint/burn/fund/withdraw) visibly moves balances.
import { getCollection } from "./state";

export function getSystemBalances() {
  return getCollection<Record<string, Record<string, number>>>("systemBalances", () => ({
    treasury: { xPoll: 5_000_000, xOcta: 120_00000000, xMYST: 8_400_000_000_000, xDrop: 92_000_000_000, xHigh: 4_500_000_000_000, xGive: 3_200_000 },
    exchange: { xPoll: 1_250_000, xOcta: 45_00000000, xMYST: 2_100_000_000_000, xDrop: 31_000_000_000, xHigh: 1_200_000_000_000, xGive: 875_000 },
    "poll-funds": { xPoll: 820_000, xOcta: 28_00000000, xMYST: 1_450_000_000_000, xDrop: 19_500_000_000, xHigh: 760_000_000_000, xGive: 540_000 },
  }));
}

// ============================= BUY CONFIG MANAGEMENT =============================
// A single config object, no pagination. rateInMinor values are integers in that
// rail's minor units (USD scale 2, USDC scale 6) and must be > 0 and <= the caps,
// or the row renders as invalid before the user touches it. `limits` must satisfy
// maxXRateInMinor === maxXMajor * 10**xMinorScale or the error copy lies.
export const buyConfigLimits = {
  maxUsdMajor: 5000,
  maxUsdcMajor: 5000,
  usdMinorScale: 2,
  usdcMinorScale: 6,
  maxUsdRateInMinor: 500000,
  maxUsdcRateInMinor: 5000000000,
  maxParentTokensPerOrder: 5000,
};

function mkBuyConfig(opts: {
  enable: boolean;
  usdMajor: number;
  usdcMajor: number;
  subscription?: { intervalUnit: "day" | "month"; intervalCount: number; usdcMajor: number } | null;
  minParentTokensPerOrder?: number;
}) {
  const cfg: any = {
    enable: opts.enable,
    fiat: { enable: true, usd: { enable: true, rateInMinor: Math.round(opts.usdMajor * 100) } },
    crypto: { enable: true, usdc: { enable: true, rateInMinor: Math.round(opts.usdcMajor * 1_000_000) } },
  };
  if (opts.subscription !== undefined) {
    cfg.subscription = {
      enable: opts.subscription !== null,
      cadence: opts.subscription
        ? { intervalUnit: opts.subscription.intervalUnit, intervalCount: opts.subscription.intervalCount }
        : null,
      crypto: {
        enable: opts.subscription !== null,
        usdc: {
          enable: opts.subscription !== null,
          rateInMinor: Math.round((opts.subscription?.usdcMajor ?? 1) * 1_000_000),
        },
      },
    };
  }
  if (opts.minParentTokensPerOrder !== undefined) {
    cfg.minParentTokensPerOrder = opts.minParentTokensPerOrder;
  }
  return cfg;
}

export const buyConfigAssets = [
  { entityType: "asset", entityId: "xPoll", title: "XPOLL", subtitle: "Core platform participation token", chain: "base", isActive: true, imageUrl: null, buyConfig: mkBuyConfig({ enable: true, usdMajor: 0.25, usdcMajor: 0.25, minParentTokensPerOrder: 100 }) },
  { entityType: "asset", entityId: "xOcta", title: "xAptos", subtitle: "Aptos-linked reward asset", chain: "aptos", isActive: true, imageUrl: null, buyConfig: mkBuyConfig({ enable: true, usdMajor: 4.8, usdcMajor: 4.8, minParentTokensPerOrder: 5 }) },
  { entityType: "asset", entityId: "xMYST", title: "xSUI", subtitle: "Sui-linked reward asset", chain: "sui", isActive: true, imageUrl: null, buyConfig: mkBuyConfig({ enable: true, usdMajor: 2.15, usdcMajor: 2.15, minParentTokensPerOrder: 10 }) },
  { entityType: "asset", entityId: "xDrop", title: "xXRP", subtitle: "XRP-linked reward asset", chain: "xrpl", isActive: true, imageUrl: null, buyConfig: mkBuyConfig({ enable: false, usdMajor: 0.6, usdcMajor: 0.6, minParentTokensPerOrder: 50 }) },
  { entityType: "asset", entityId: "xHigh", title: "xStrain", subtitle: "Strain community token", chain: "base", isActive: true, imageUrl: null, buyConfig: mkBuyConfig({ enable: true, usdMajor: 1.4, usdcMajor: 1.4, minParentTokensPerOrder: 25 }) },
  { entityType: "asset", entityId: "xGive", title: "xCampaign", subtitle: "Campaign donation token", chain: "base", isActive: false, imageUrl: null, buyConfig: mkBuyConfig({ enable: false, usdMajor: 1, usdcMajor: 1, minParentTokensPerOrder: 20 }) },
];

export const buyConfigCampaignPlans = [
  { entityType: "campaignPlan", entityId: "NP_1M_PLAN", title: "Non-political — 1 Month", subtitle: "Standard monthly campaign plan", isActive: true, supportsSubscriptionCryptoConfig: true, buyConfig: mkBuyConfig({ enable: true, usdMajor: 49, usdcMajor: 49, subscription: { intervalUnit: "month", intervalCount: 1, usdcMajor: 45 } }) },
  { entityType: "campaignPlan", entityId: "NP_3M_PLUS_PLAN", title: "Non-political — 3 Month Plus", subtitle: "Quarterly plan with data access", isActive: true, supportsSubscriptionCryptoConfig: true, buyConfig: mkBuyConfig({ enable: true, usdMajor: 129, usdcMajor: 129, subscription: { intervalUnit: "month", intervalCount: 3, usdcMajor: 119 } }) },
  { entityType: "campaignPlan", entityId: "NP_6M_PLAN", title: "Non-political — 6 Month", subtitle: "Half-year campaign plan", isActive: true, supportsSubscriptionCryptoConfig: false, buyConfig: mkBuyConfig({ enable: true, usdMajor: 229, usdcMajor: 229 }) },
  { entityType: "campaignPlan", entityId: "P_1M_PLUS_PLAN", title: "Political — 1 Month Plus", subtitle: "Civic plan with data access", isActive: true, supportsSubscriptionCryptoConfig: true, buyConfig: mkBuyConfig({ enable: true, usdMajor: 99, usdcMajor: 99, subscription: { intervalUnit: "month", intervalCount: 1, usdcMajor: 92 } }) },
  { entityType: "campaignPlan", entityId: "P_3M_PLAN", title: "Political — 3 Month", subtitle: "Civic quarterly plan", isActive: true, supportsSubscriptionCryptoConfig: false, buyConfig: mkBuyConfig({ enable: true, usdMajor: 249, usdcMajor: 249 }) },
  { entityType: "campaignPlan", entityId: "P_6M_PLUS_PLAN", title: "Political — 6 Month Plus", subtitle: "Civic half-year plan with donations", isActive: false, supportsSubscriptionCryptoConfig: true, buyConfig: mkBuyConfig({ enable: false, usdMajor: 549, usdcMajor: 549, subscription: { intervalUnit: "month", intervalCount: 6, usdcMajor: 499 } }) },
];

export const buyConfigOfflineProducts = [
  { entityType: "offlineProduct", entityId: "prod-soul-bound", title: "Soul-bound Subscription", subtitle: "Annual identity-linked membership", isActive: true, supportsSubscriptionCryptoConfig: true, buyConfig: mkBuyConfig({ enable: true, usdMajor: 1499, usdcMajor: 1499, subscription: { intervalUnit: "month", intervalCount: 12, usdcMajor: 1399 } }) },
  { entityType: "offlineProduct", entityId: "prod-ad-experience", title: "Ad Experience Subscription", subtitle: "Managed ad placement package", isActive: true, supportsSubscriptionCryptoConfig: true, buyConfig: mkBuyConfig({ enable: true, usdMajor: 2499, usdcMajor: 2499, subscription: { intervalUnit: "month", intervalCount: 3, usdcMajor: 2299 } }) },
  { entityType: "offlineProduct", entityId: "prod-web3-launch", title: "Web3 Launch Campaign", subtitle: "End-to-end token launch support", isActive: true, supportsSubscriptionCryptoConfig: false, buyConfig: mkBuyConfig({ enable: true, usdMajor: 3499, usdcMajor: 3499 }) },
  { entityType: "offlineProduct", entityId: "prod-legacy-print", title: "Legacy Print Bundle", subtitle: "Deprecated offline placement bundle", isActive: false, supportsSubscriptionCryptoConfig: false, buyConfig: mkBuyConfig({ enable: false, usdMajor: 999, usdcMajor: 999 }) },
];

export function getBuyConfigPayload() {
  return {
    limits: buyConfigLimits,
    assets: getCollection("buyConfigAssets", () => buyConfigAssets),
    campaignPlans: getCollection("buyConfigCampaignPlans", () => buyConfigCampaignPlans),
    offlineProducts: getCollection("buyConfigOfflineProducts", () => buyConfigOfflineProducts),
  };
}

// ============================= SELL INTENTS =============================
// Three separate endpoints back the three queues (pending / approved / rejected),
// all using the FLAT `items` envelope. The amount lives on a leg with
// legType "intent-amount" and is BASE/atomic — it must be an INTEGER STRING or
// toParent bails and the cell renders an em-dash.
// Only xOcta/xMYST/xDrop are sellable, each pinned to its own chain.
const SELLABLE = [
  { assetId: "xOcta", chain: "APTOS", unit: 100_000_000 },      // 8 decimals
  { assetId: "xMYST", chain: "SUI", unit: 1_000_000_000 },      // 9 decimals
  { assetId: "xDrop", chain: "XRP", unit: 1_000_000 },          // 6 decimals
];

function walletForChain(chain: string, i: number) {
  const hex = (n: number, len: number) =>
    n.toString(16).padStart(4, "0").repeat(Math.ceil(len / 4)).slice(0, len);
  if (chain === "XRP") return `r${hex(i + 91, 8)}Nq7dK4pXvB2mHs${hex(i + 17, 6)}Ttz`;
  return `0x${hex(i + 41, 64)}`;
}

type SellIntentSeed = {
  _id: string;
  createdAt: string;
  metadata: { username: string; walletAddress: string; chain: string; status: string; txnHash?: string };
  legs: { legType: string; assetId: string; amount: string }[];
};

function makeSellIntent(i: number, status: "PENDING" | "APPROVE" | "REJECT"): SellIntentSeed {
  const asset = SELLABLE[i % SELLABLE.length];
  const user = externalUsers[i % externalUsers.length];
  // Whole-token amounts with a .5 case, scaled to atomic and kept as integer strings.
  const halves = [10, 25, 5, 100, 250, 50][i % 6] * 2 + (i % 3 === 0 ? 1 : 0);
  const atomic = String((BigInt(halves) * BigInt(asset.unit)) / 2n);
  const day = String((i % 27) + 1).padStart(2, "0");
  const month = String((i % 8) + 1).padStart(2, "0");
  const meta: SellIntentSeed["metadata"] = {
    username: user.username,
    walletAddress: walletForChain(asset.chain, i),
    chain: asset.chain,
    status,
  };
  if (status === "APPROVE") {
    meta.txnHash = `0x${(i + 7).toString(16).padStart(6, "0")}b3f19d7c25ae8014f6d2a9c7be350184cf627ad9e4b1`;
  }
  return {
    _id: `sell-${status.toLowerCase()}-${String(i + 1).padStart(3, "0")}`,
    createdAt: `2026-${month}-${day}T${String(i % 24).padStart(2, "0")}:${String(i % 60).padStart(2, "0")}:00.000Z`,
    metadata: meta,
    legs: [{ legType: "intent-amount", assetId: asset.assetId, amount: atomic }],
  };
}

export function generateSellIntentsPending(count = 14) {
  return Array.from({ length: count }).map((_, i) => makeSellIntent(i, "PENDING"));
}
export function generateSellIntentsApproved(count = 21) {
  return Array.from({ length: count }).map((_, i) => makeSellIntent(i + 40, "APPROVE"));
}
export function generateSellIntentsRejected(count = 8) {
  return Array.from({ length: count }).map((_, i) => makeSellIntent(i + 70, "REJECT"));
}

// ============================= XAMAN (XRP wallet) =============================
// The connect card renders refs.qr_png directly as an <img src>, so it needs a real
// image; a tiny inline SVG data URI keeps it self-contained.
export const SANDBOX_XRP_ADDRESS = "rPbSandbox9XvKq4mHs2NqDk7TtzB3wLpQe";

export const xamanQrPng =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220">
<rect width="220" height="220" fill="#ffffff"/>
<g fill="#000000">
<rect x="16" y="16" width="56" height="56"/><rect x="28" y="28" width="32" height="32" fill="#ffffff"/><rect x="36" y="36" width="16" height="16"/>
<rect x="148" y="16" width="56" height="56"/><rect x="160" y="28" width="32" height="32" fill="#ffffff"/><rect x="168" y="36" width="16" height="16"/>
<rect x="16" y="148" width="56" height="56"/><rect x="28" y="160" width="32" height="32" fill="#ffffff"/><rect x="36" y="168" width="16" height="16"/>
<rect x="88" y="16" width="12" height="12"/><rect x="112" y="28" width="12" height="12"/><rect x="88" y="52" width="12" height="12"/>
<rect x="16" y="88" width="12" height="12"/><rect x="40" y="100" width="12" height="12"/><rect x="64" y="88" width="12" height="12"/>
<rect x="88" y="88" width="12" height="12"/><rect x="112" y="100" width="12" height="12"/><rect x="136" y="88" width="12" height="12"/>
<rect x="160" y="100" width="12" height="12"/><rect x="184" y="88" width="12" height="12"/>
<rect x="88" y="124" width="12" height="12"/><rect x="112" y="148" width="12" height="12"/><rect x="88" y="172" width="12" height="12"/>
<rect x="136" y="136" width="12" height="12"/><rect x="160" y="160" width="12" height="12"/><rect x="184" y="184" width="12" height="12"/>
<rect x="136" y="184" width="12" height="12"/><rect x="184" y="136" width="12" height="12"/>
</g></svg>`,
  );

// ============================= LLM QUERIES =============================
// POST /internal/llm/generate returns an id; GET /internal/llm/poll-query-result/:id
// is polled every 3s until status is "complete"|"failed". uiConfig must be the full
// QueryUIResponse shape from UILayoutRenderer — several block types crash on a
// missing array field, so every block below carries its required arrays even when
// empty. See UILayoutRenderer.tsx for the block-type contract.
function llmSteps() {
  return [
    "Parsing your query...",
    "Scanning poll and trial data...",
    "Aggregating vote counts...",
    "Generating insights...",
    "Formatting report...",
  ];
}

export function buildLlmQueryResult(prompt: string, _createdAtMs: number) {
  // The detail page's refetchInterval only ever fires its first poll in practice (it
  // calls setState from inside the interval callback, which appears to prevent
  // TanStack Query from scheduling the next tick — a pre-existing quirk in that page,
  // not something sandbox-side data can influence). So the one poll that does fire
  // resolves straight to "complete" rather than simulating a multi-poll pending phase
  // that would never be observed.
  const steps = llmSteps();
  const topPolls = polls.slice(0, 5).map((p) => ({
    _id: p._id,
    title: p.title,
    description: `Community poll: ${p.title}`,
    options: (p.optionTexts ?? ["Yes", "No"]).map((label) => ({ meaning: label, label })),
  }));
  const totalVotes = polls.reduce((sum, p) => sum + (p.voteCount ?? 0), 0);

  return {
    status: "complete",
    input: { prompt },
    steps,
    llmResponse: `Here's what I found across ${polls.length} polls and ${trials.length} trials.`,
    error: null,
    structuredResult: {
      uiConfig: {
        meta: {
          query: prompt,
          generatedAt: new Date().toISOString(),
          confidence: { score: 0.87, level: "High" },
          coverage: { pollsConsidered: polls.length, totalVotes },
        },
        layout: [
          { type: "text", variant: "heading", content: "Poll Engagement Report" },
          {
            type: "text",
            variant: "body",
            content: `Based on your query "${prompt}", here's a summary of current poll engagement across the platform. Crypto and civic-tech topics are drawing the most sustained participation this quarter.`,
          },
          {
            type: "stat-cards",
            cards: [
              { label: "Total Polls", value: polls.length, trend: "up", change: 8 },
              { label: "Total Votes", value: totalVotes, unit: "votes", trend: "up", change: 14 },
              { label: "Active Trials", value: trials.length, trend: "neutral" },
              { label: "Avg. Votes / Poll", value: Math.round(totalVotes / Math.max(1, polls.length)), unit: "votes" },
            ],
          },
          {
            type: "chart",
            chartType: "bar",
            title: "Votes by Poll",
            xAxis: "Poll",
            yAxis: "Votes",
            data: topPolls.map((p, i) => ({
              label: p.title.length > 18 ? p.title.slice(0, 18) + "…" : p.title,
              value: polls[i]?.voteCount ?? 0,
            })),
          },
          {
            type: "table",
            title: "Top Polls by Votes",
            columns: ["Title", "Views", "Votes"],
            rows: polls
              .slice(0, 6)
              .map((p) => [p.title, p.viewCount ?? 0, p.voteCount ?? 0]),
          },
          {
            type: "highlight-cards",
            title: "Key Insights",
            cards: [
              { label: "Momentum", content: "Voting activity is up week-over-week across the top five polls." },
              { label: "Geography", content: "India and the United States account for the largest share of votes." },
              { label: "Watch", content: "Two polls are approaching their expiry window within 7 days." },
            ],
          },
        ],
        excelData: {
          polls: topPolls,
          totalPolls: polls.length,
          totalVotes,
        },
      },
    },
  };
}

// ============================= SLUGS =============================
// GET /internal/preference/slugs uses the flat envelope PaginatedTable expects:
// {data:{entries,page,pageSize,total,totalPages}} — the page reads `.entries` (not
// `.items`) directly off that same payload.
export const slugs = [
  { _id: "slug-001", name: "clean-rivers-initiative", createdAt: "2026-03-02T00:00:00.000Z", archivedAt: null },
  { _id: "slug-002", name: "transit-fare-reform", createdAt: "2026-02-18T00:00:00.000Z", archivedAt: null },
  { _id: "slug-003", name: "open-source-grants-fund", createdAt: "2026-01-25T00:00:00.000Z", archivedAt: null },
  { _id: "slug-004", name: "neighborhood-solar-co-op", createdAt: "2026-04-11T00:00:00.000Z", archivedAt: null },
  { _id: "slug-005", name: "school-meal-standards", createdAt: "2026-02-02T00:00:00.000Z", archivedAt: null },
  { _id: "slug-006", name: "local-journalism-fund", createdAt: "2026-03-19T00:00:00.000Z", archivedAt: null },
  { _id: "slug-007", name: "bike-lane-expansion", createdAt: "2025-11-08T00:00:00.000Z", archivedAt: "2026-05-30T00:00:00.000Z" },
  { _id: "slug-008", name: "digital-literacy-for-seniors", createdAt: "2026-05-06T00:00:00.000Z", archivedAt: null },
  { _id: "slug-009", name: "affordable-housing-audit", createdAt: "2026-06-14T00:00:00.000Z", archivedAt: null },
  { _id: "slug-010", name: "urban-tree-canopy", createdAt: "2026-04-28T00:00:00.000Z", archivedAt: null },
  { _id: "slug-011", name: "small-business-recovery", createdAt: "2026-01-12T00:00:00.000Z", archivedAt: null },
  { _id: "slug-012", name: "election-poll-worker-drive", createdAt: "2026-05-21T00:00:00.000Z", archivedAt: null },
  { _id: "slug-013", name: "community-fridge-network", createdAt: "2026-06-02T00:00:00.000Z", archivedAt: null },
  { _id: "slug-014", name: "public-wifi-access", createdAt: "2025-09-15T00:00:00.000Z", archivedAt: "2026-03-22T00:00:00.000Z" },
];

// ============================= BULLMQ JOB RUNS =============================
// Every entry MUST carry a non-null `bullmq` sub-object — the page dereferences
// entry.bullmq.* without optional chaining and throws if it's missing.
const TASK_TYPES = [
  "inkd.chat.process",
  "invoice.generateUpload",
  "llm.query.generate",
  "poll.embed.bulkArchive",
  "poll.embed.bulkCreate",
  "poll.embed.edit",
] as const;

const JOB_STATES = [
  "succeeded", "succeeded", "succeeded", "running", "queued",
  "failed", "enqueue_pending", "cancelled", "enqueue_failed",
] as const;

export function generateBullMqJobRuns(count = 47) {
  return Array.from({ length: count }).map((_, i) => {
    const taskType = TASK_TYPES[i % TASK_TYPES.length];
    const state = JOB_STATES[i % JOB_STATES.length];
    const day = String((i % 27) + 1).padStart(2, "0");
    const hour = String(i % 24).padStart(2, "0");
    const minute = String((i * 7) % 60).padStart(2, "0");
    const createdAt = `2026-08-${day}T${hour}:${minute}:00.000Z`;
    const isTerminal = ["succeeded", "failed", "cancelled", "enqueue_failed"].includes(state);
    const isFailure = state === "failed" || state === "enqueue_failed";
    const attemptCount = isFailure ? 1 + (i % 3) : state === "succeeded" ? 1 : 0;

    return {
      _id: `jobrun-${String(i + 1).padStart(4, "0")}`,
      jobId: `${taskType}-${(1000 + i).toString(36)}`,
      taskType,
      state,
      attemptCount,
      failedAttempts: isFailure ? attemptCount : 0,
      claimedByWorkerId: state === "running" || state === "queued" ? `worker-${(i % 4) + 1}` : null,
      claimedUntilUtc: state === "running" ? `2026-08-${day}T${hour}:${String((Number(minute) + 5) % 60).padStart(2, "0")}:00.000Z` : null,
      lastHeartbeatAt: state === "running" ? `2026-08-${day}T${hour}:${minute}:30.000Z` : null,
      lastErrorCode: isFailure ? ["TIMEOUT", "RATE_LIMITED", "QUEUE_ERROR", "VALIDATION_ERROR"][i % 4] : null,
      lastErrorMessage: isFailure
        ? `Job ${taskType} failed on attempt ${attemptCount}: upstream service returned a non-2xx response while processing payload.`
        : null,
      createdAt,
      updatedAt: isTerminal ? `2026-08-${day}T${hour}:${String((Number(minute) + 2) % 60).padStart(2, "0")}:00.000Z` : createdAt,
      cancelledAt: state === "cancelled" ? `2026-08-${day}T${hour}:${String((Number(minute) + 1) % 60).padStart(2, "0")}:00.000Z` : null,
      completedAt: state === "succeeded" ? `2026-08-${day}T${hour}:${String((Number(minute) + 3) % 60).padStart(2, "0")}:00.000Z` : null,
      failedAt: isFailure ? `2026-08-${day}T${hour}:${String((Number(minute) + 2) % 60).padStart(2, "0")}:00.000Z` : null,
      bullmq: {
        queueName: "default",
        attemptsConfigured: 3,
        attemptsMade: attemptCount,
        lastObservedState: state === "enqueue_pending" ? null : state === "enqueue_failed" ? "failed" : state,
        lastEventName: isTerminal ? (isFailure ? "failed" : state === "cancelled" ? "removed" : "completed") : state === "running" ? "active" : "waiting",
        lastEventAt: isTerminal ? updatedAtFor(day, hour, minute) : null,
      },
    };
  });
}

function updatedAtFor(day: string, hour: string, minute: string) {
  return `2026-08-${day}T${hour}:${String((Number(minute) + 2) % 60).padStart(2, "0")}:00.000Z`;
}

// ============================= INKD: AGENTS =============================
import inkdAgentAvatarA from "@/assets/chart.png";
import inkdAgentAvatarB from "@/assets/bubble.png";
import inkdAgentAvatarC from "@/assets/terra.png";

export type InkdAgentSeed = {
  _id: string;
  name: string;
  status: "active" | "idle";
  foundationalInformation: string;
  brandLanguage: string;
  maxBlogDescriptionLength: number;
  maxLinkedTrial: number;
  maxLinkedPoll: number;
  prioritySources: string[];
  industryIds: string[];
  targetGeo: { countries: string[]; states: string[]; cities: string[] } | null;
  fallbackImageUrl: string;
  nextSchedule: string | null;
  rewards: { assetId: string; amount: number; rewardAmountCap: number; rewardType: "min" | "max" }[];
  scheduleRules: { weekdays: string[]; timeUtc: string }[];
};

export const inkdAgents: InkdAgentSeed[] = [
  {
    _id: "inkd-agent-001", name: "Civic Pulse", status: "active",
    foundationalInformation: "Civic Pulse tracks municipal policy debates and translates them into digestible community polls, always sourcing from public council records and verified local reporting.",
    brandLanguage: "Warm, neutral, and fact-first. Avoids partisan framing, leads with the question voters actually care about.",
    maxBlogDescriptionLength: 6000, maxLinkedTrial: 3, maxLinkedPoll: 5,
    prioritySources: ["https://reuters.com/world", "https://apnews.com/hub/politics"],
    industryIds: ["industry-002", "industry-001"],
    targetGeo: { countries: ["country-in", "country-us"], states: [], cities: [] },
    fallbackImageUrl: inkdAgentAvatarA, nextSchedule: "2026-08-20T06:00:00.000Z",
    rewards: [{ assetId: "xPoll", amount: 25, rewardAmountCap: 2500, rewardType: "min" }],
    scheduleRules: [{ weekdays: ["monday", "wednesday", "friday"], timeUtc: "06:00" }],
  },
  {
    _id: "inkd-agent-002", name: "Chain Watch", status: "active",
    foundationalInformation: "Chain Watch summarizes major crypto and Web3 protocol changes into digestible community trials, cross-referencing on-chain data with mainstream coverage.",
    brandLanguage: "Sharp, technical but accessible. No hype, no price speculation — protocol mechanics only.",
    maxBlogDescriptionLength: 8000, maxLinkedTrial: 4, maxLinkedPoll: 6,
    prioritySources: ["https://theblock.co", "https://cointelegraph.com"],
    industryIds: ["industry-007"],
    targetGeo: null, fallbackImageUrl: inkdAgentAvatarB, nextSchedule: "2026-08-19T14:00:00.000Z",
    rewards: [{ assetId: "xOcta", amount: 2, rewardAmountCap: 200, rewardType: "max" }],
    scheduleRules: [{ weekdays: ["tuesday", "thursday"], timeUtc: "14:00" }],
  },
  {
    _id: "inkd-agent-003", name: "Health Signal", status: "idle",
    foundationalInformation: "Health Signal covers public health policy shifts and translates clinical guidance changes into plain-language community polls.",
    brandLanguage: "Calm, careful, always cites the underlying study or agency guidance.",
    maxBlogDescriptionLength: 7000, maxLinkedTrial: 2, maxLinkedPoll: 4,
    prioritySources: ["https://www.who.int/news"],
    industryIds: ["industry-003"],
    targetGeo: { countries: ["country-us"], states: [], cities: [] },
    fallbackImageUrl: inkdAgentAvatarC, nextSchedule: null,
    rewards: [{ assetId: "xPoll", amount: 20, rewardAmountCap: 2000, rewardType: "min" }],
    scheduleRules: [],
  },
  {
    _id: "inkd-agent-004", name: "Campus Watch", status: "active",
    foundationalInformation: "Campus Watch follows higher-education policy and student-life issues, generating polls on tuition, housing, and campus governance.",
    brandLanguage: "Direct, student-first tone. Skeptical of administrative jargon.",
    maxBlogDescriptionLength: 6000, maxLinkedTrial: 3, maxLinkedPoll: 5,
    prioritySources: ["https://insidehighered.com"],
    industryIds: ["industry-004"],
    targetGeo: { countries: [], states: ["state-mh", "state-ca"], cities: [] },
    fallbackImageUrl: inkdAgentAvatarA, nextSchedule: "2026-08-21T09:30:00.000Z",
    rewards: [{ assetId: "xGive", amount: 15, rewardAmountCap: 1200, rewardType: "min" }],
    scheduleRules: [{ weekdays: ["sunday"], timeUtc: "09:30" }],
  },
  {
    _id: "inkd-agent-005", name: "Grid & Ground", status: "idle",
    foundationalInformation: "Grid & Ground covers energy transition and infrastructure investment, turning utility filings and grid reports into accessible community trials.",
    brandLanguage: "Grounded and practical — cost and reliability framing over ideology.",
    maxBlogDescriptionLength: 7500, maxLinkedTrial: 3, maxLinkedPoll: 4,
    prioritySources: ["https://www.eia.gov/todayinenergy"],
    industryIds: ["industry-001", "industry-005"],
    targetGeo: null, fallbackImageUrl: inkdAgentAvatarB, nextSchedule: null,
    rewards: [{ assetId: "xHigh", amount: 40, rewardAmountCap: 3000, rewardType: "min" }],
    scheduleRules: [],
  },
];

export function findInkdAgent(id: string) {
  return (getCollection("inkdAgents", () => inkdAgents) as InkdAgentSeed[]).find((a) => a._id === id);
}

// ============================= INKD: BLOGS + TRIALS =============================
export type InkdBlogSeed = {
  _id: string;
  createdByInkdInternalAgentId: string;
  title: string;
  description: string; // markdown, min 2000 chars per edit-page validation
  uploadedImageLinks: string[];
  uploadedVideoLinks: string[];
  ytVideoLinks: string[];
  externalLinks: string[];
  targetGeo: { countries: string[]; states: string[]; cities: string[] } | null;
  uniqueTargetLocations: number;
  linkedIndustries: { _id: string; name: string; description?: string }[];
  reviewVote: "upvote" | "downvote" | null;
  createdAt: string;
  archivedAt: string | null;
};

function longMarkdown(topic: string, agentName: string) {
  const para = `${agentName} pulled together public reporting, prior community responses, and the latest available data to put together this brief on ${topic}. The goal isn't to tell you what to think — it's to lay out the actual state of play clearly enough that you can form your own view and vote with confidence.`;
  const filler = "Every section below links back to a primary source where one exists, and every poll option was written to avoid leading language. If something here looks off, flag it — corrections get folded into the next scheduled run.";
  return `## Overview\n\n${para}\n\n${filler}\n\n## Why it matters\n\n${para} ${filler}\n\n## What changed recently\n\n${filler} ${para}\n\n## What the community is split on\n\n${para}\n\n${filler}\n\n## Sources and further reading\n\n${filler} ${para} ${filler}`;
}

export const inkdBlogs: InkdBlogSeed[] = [
  { _id: "inkd-blog-001", createdByInkdInternalAgentId: "inkd-agent-001", title: "Should city council meetings require live captioning?", description: longMarkdown("live captioning at council meetings", "Civic Pulse"), uploadedImageLinks: [blogCoverA], uploadedVideoLinks: [], ytVideoLinks: [], externalLinks: ["https://apnews.com/hub/politics"], targetGeo: { countries: ["country-us"], states: [], cities: [] }, uniqueTargetLocations: 4, linkedIndustries: [{ _id: "industry-002", name: "Civic Technology" }], reviewVote: "upvote", createdAt: "2026-06-01T00:00:00.000Z", archivedAt: null },
  { _id: "inkd-blog-002", createdByInkdInternalAgentId: "inkd-agent-001", title: "Participatory budgeting: is it working in mid-size cities?", description: longMarkdown("participatory budgeting outcomes", "Civic Pulse"), uploadedImageLinks: [blogCoverB], uploadedVideoLinks: [], ytVideoLinks: [], externalLinks: [], targetGeo: null, uniqueTargetLocations: 7, linkedIndustries: [{ _id: "industry-002", name: "Civic Technology" }, { _id: "industry-010", name: "Housing & Urban Planning" }], reviewVote: null, createdAt: "2026-06-18T00:00:00.000Z", archivedAt: null },
  { _id: "inkd-blog-003", createdByInkdInternalAgentId: "inkd-agent-002", title: "Rollup fee markets after the latest network upgrade", description: longMarkdown("rollup fee market changes", "Chain Watch"), uploadedImageLinks: [blogCoverC], uploadedVideoLinks: [], ytVideoLinks: [], externalLinks: ["https://theblock.co"], targetGeo: null, uniqueTargetLocations: 12, linkedIndustries: [{ _id: "industry-007", name: "Web3 & Digital Assets" }], reviewVote: "upvote", createdAt: "2026-07-02T00:00:00.000Z", archivedAt: null },
  { _id: "inkd-blog-004", createdByInkdInternalAgentId: "inkd-agent-002", title: "Are validator rewards concentrating among fewer operators?", description: longMarkdown("validator reward concentration", "Chain Watch"), uploadedImageLinks: [], uploadedVideoLinks: [], ytVideoLinks: ["dQw4w9WgXcQ"], externalLinks: [], targetGeo: null, uniqueTargetLocations: 9, linkedIndustries: [{ _id: "industry-007", name: "Web3 & Digital Assets" }], reviewVote: null, createdAt: "2026-07-14T00:00:00.000Z", archivedAt: null },
  { _id: "inkd-blog-005", createdByInkdInternalAgentId: "inkd-agent-003", title: "New guidance on seasonal booster timing", description: longMarkdown("booster timing guidance", "Health Signal"), uploadedImageLinks: [blogCoverA], uploadedVideoLinks: [], ytVideoLinks: [], externalLinks: ["https://www.who.int/news"], targetGeo: { countries: ["country-us"], states: [], cities: [] }, uniqueTargetLocations: 5, linkedIndustries: [{ _id: "industry-003", name: "Public Health" }], reviewVote: "downvote", createdAt: "2026-05-20T00:00:00.000Z", archivedAt: "2026-07-01T00:00:00.000Z" },
  { _id: "inkd-blog-006", createdByInkdInternalAgentId: "inkd-agent-004", title: "Should meal plans be unbundled from housing contracts?", description: longMarkdown("unbundling meal plans from housing", "Campus Watch"), uploadedImageLinks: [blogCoverB], uploadedVideoLinks: [], ytVideoLinks: [], externalLinks: [], targetGeo: { countries: [], states: ["state-mh"], cities: [] }, uniqueTargetLocations: 3, linkedIndustries: [{ _id: "industry-004", name: "Education" }], reviewVote: null, createdAt: "2026-07-22T00:00:00.000Z", archivedAt: null },
  { _id: "inkd-blog-007", createdByInkdInternalAgentId: "inkd-agent-005", title: "Grid interconnection queues are getting longer — why?", description: longMarkdown("interconnection queue delays", "Grid & Ground"), uploadedImageLinks: [blogCoverC], uploadedVideoLinks: [], ytVideoLinks: [], externalLinks: ["https://www.eia.gov/todayinenergy"], targetGeo: null, uniqueTargetLocations: 6, linkedIndustries: [{ _id: "industry-001", name: "Environment" }], reviewVote: "upvote", createdAt: "2026-06-30T00:00:00.000Z", archivedAt: null },
  { _id: "inkd-blog-008", createdByInkdInternalAgentId: "inkd-agent-001", title: "Do open-data portals actually get used by residents?", description: longMarkdown("open-data portal usage", "Civic Pulse"), uploadedImageLinks: [blogCoverA], uploadedVideoLinks: [], ytVideoLinks: [], externalLinks: [], targetGeo: null, uniqueTargetLocations: 8, linkedIndustries: [{ _id: "industry-002", name: "Civic Technology" }], reviewVote: null, createdAt: "2026-08-05T00:00:00.000Z", archivedAt: null },
];

function getInkdBlogTrialCollection(blogId: string) {
  return getCollection(`inkdBlogTrials:${blogId}`, () => {
    const covers = [blogCoverA, blogCoverB, blogCoverC];
    return Array.from({ length: 2 }).map((_, i) => ({
      _id: `${blogId}-trial-${i}`,
      title: `${i === 0 ? "Primary" : "Follow-up"} trial for this blog`,
      description: "A short multi-poll series generated alongside this blog to gauge community sentiment.",
      resourceAssets: [{ type: "image", value: covers[i % covers.length] }],
      rewards: [{ assetId: "xPoll", amount: 10 + i * 5, rewardAmountCap: 1000 }],
    }));
  });
}

export function buildInkdBlogTrialsPayload(blogId: string) {
  return { activeTrials: getInkdBlogTrialCollection(blogId) };
}

export function buildInkdBlogAnalytics(blog: InkdBlogSeed) {
  const trials = getInkdBlogTrialCollection(blog._id);
  const levelWiseBlog: Record<string, { seens: number; participation: number; totalShares: number; uniqueShares: number }> = {};
  for (let lvl = 1; lvl <= 10; lvl++) {
    const weight = 1 / lvl;
    levelWiseBlog[String(lvl)] = {
      seens: Math.round(4000 * weight), participation: Math.round(1200 * weight),
      totalShares: Math.round(300 * weight), uniqueShares: Math.round(210 * weight),
    };
  }
  const byTrial = trials.map((trial, i) => {
    const options = ["Yes", "No", "Not sure"].map((label, oi) => ({
      optionId: `${trial._id}-opt-${oi}`, optionText: label,
      votes: 800 - oi * 220 - i * 40, percentage: [58.2, 28.6, 13.2][oi],
    }));
    return {
      trialId: trial._id, trialTitle: trial.title,
      totalParticipation: options.reduce((s, o) => s + o.votes, 0),
      rewardDistribution: [{ assetId: "xPoll", amount: String(5000 - i * 800) }],
      polls: [{ pollId: `${trial._id}-poll-0`, pollTitle: trial.title, options }],
    };
  });
  return {
    blog: {
      totalSeens: 24500, totalParticipation: 8120, totalShares: 1420, totalUniqueShares: 980,
      levelWise: levelWiseBlog,
    },
    trials: {
      totalParticipation: byTrial.reduce((s, t) => s + t.totalParticipation, 0),
      totalRewardDistribution: [{ assetId: "xPoll", amount: "9000" }],
      levelWise: levelWiseBlog,
      byTrial,
    },
  };
}

// ============================= INKD: TASK LOGS =============================
export function generateInkdTaskLogs(agentId: string, count = 6) {
  const states = ["completed", "completed", "running", "queued", "failed", "cancelled"] as const;
  return Array.from({ length: count }).map((_, i) => {
    const state = states[i % states.length];
    const day = String((i % 27) + 1).padStart(2, "0");
    const createdAt = `2026-08-${day}T0${i % 9}:00:00.000Z`;
    const metadata: any = {};
    if (state === "completed") {
      metadata.success = { data: { createdInkDArtifacts: { blogId: inkdBlogs[i % inkdBlogs.length]._id, trialIds: [], pollIds: [] } } };
    } else if (state === "failed") {
      metadata.failure = { lastCode: "GENERATION_ERROR", lastMessage: "Source fetch timed out before a draft could be produced." };
    } else if (state === "cancelled") {
      metadata.cancellation = { reason: "Superseded by a newer manual run." };
    }
    return {
      _id: `${agentId}-log-${i}`,
      triggerSource: i % 3 === 0 ? "manual" : "scheduled",
      scheduledForUtc: createdAt,
      state,
      metadata,
    };
  });
}

// ============================= INKD: TOP INDUSTRIES =============================
const MAX_TOP_INDUSTRIES = 20;

function topIndustryIds() {
  return getCollection<string[]>("inkdTopIndustryIds", () => ["industry-002", "industry-007", "industry-003", "industry-001"]);
}

export function buildTopIndustriesPayload() {
  const ids = topIndustryIds();
  const entries = ids
    .map((id) => (industries as any[]).find((i) => i._id === id))
    .filter(Boolean)
    .map((i) => ({ _id: i._id, name: i.name, description: i.description, archivedAt: i.archivedAt }));
  return {
    maxIndustries: MAX_TOP_INDUSTRIES,
    remainingSlots: Math.max(0, MAX_TOP_INDUSTRIES - entries.length),
    industryIds: ids,
    entries,
    total: entries.length,
  };
}

export function addTopIndustry(industryId: string) {
  const ids = topIndustryIds();
  if (!ids.includes(industryId)) ids.push(industryId);
}

export function removeTopIndustry(industryId: string) {
  const ids = topIndustryIds();
  const idx = ids.indexOf(industryId);
  if (idx !== -1) ids.splice(idx, 1);
}
