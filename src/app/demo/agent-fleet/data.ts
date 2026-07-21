/* Demo data for the iceKore Mission Control replica.
   The team, roles, and standing deliverables mirror the real hub.
   All metrics, statuses and feed events are example numbers, not live data. */

export type AgentStatus = "online" | "busy" | "idle" | "blocked";
export type Cadence = "live" | "daily" | "weekly" | "monthly" | "quarterly";

export interface DemoKpi {
  label: string;
  value: string;
  delta: string;
  up?: boolean;
  tone?: "good" | "warn" | "mute";
  target?: string;
}

export interface DemoDuty {
  label: string;
  cadence: Cadence;
  detail?: string;
}

export interface DemoKanban {
  todo: string[];
  doing: string[];
  blocked: string[];
  review: string[];
  done: string[];
}

export interface DemoAgent {
  id: string;
  name: string;
  role: string;
  initials: string;
  bg: string;
  dept: "Marketing" | "Operations";
  isManager?: boolean;
  status: AgentStatus;
  workingOn: string;
  /** Alternate "working on" lines the simulation rotates through. */
  alsoWorksOn: string[];
  tasksWk: number;
  trend: number[];
  reviewCount: number;
  bio: string;
  duties: DemoDuty[];
  kpis: DemoKpi[];
  kanban: DemoKanban;
}

export const AGENTS: DemoAgent[] = [
  {
    id: "marketing-cos",
    name: "Camille",
    role: "Chief of Staff · Marketing",
    initials: "CM",
    bg: "linear-gradient(140deg, #475569 0%, #0f172a 100%)",
    dept: "Marketing",
    isManager: true,
    status: "busy",
    workingOn: "Compiling the Monday CEO brief",
    alsoWorksOn: [
      "Reviewing overnight outputs from every agent",
      "Prioritising this week's asks against the plan",
    ],
    tasksWk: 6,
    trend: [1, 1, 1, 0, 1, 1, 1],
    reviewCount: 0,
    bio: "Marketing chief of staff. Sets quarterly strategy, briefs the marketing org, prioritises against business goals. Manages all marketing specialists.",
    duties: [
      { cadence: "daily", label: "Morning standup digest", detail: "Overnight outputs from every agent, distilled into one page for Wolf." },
      { cadence: "weekly", label: "CMO brief: wins, losses, decisions needed", detail: "The week across all channels, synthesized." },
      { cadence: "monthly", label: "Board prep & goal review", detail: "MER, channel mix, top decisions, next-month priorities." },
    ],
    kpis: [
      { label: "Briefs on time", value: "4/4", delta: "this month", tone: "good" },
      { label: "Open decisions", value: "3", delta: "queued for Wolf", tone: "warn" },
      { label: "Agents on plan", value: "10/12", delta: "2 re-briefed", tone: "mute" },
    ],
    kanban: {
      todo: ["Q3 goal review outline"],
      doing: ["Monday CEO brief"],
      blocked: [],
      review: [],
      done: ["Standup digest", "Agent KPI pass"],
    },
  },
  {
    id: "media-buying",
    name: "Marco",
    role: "Media Buyer",
    initials: "MB",
    bg: "linear-gradient(140deg, #14b8a6 0%, #134e4a 100%)",
    dept: "Marketing",
    status: "busy",
    workingOn: "Drafting kill / scale calls for the weekly ad review",
    alsoWorksOn: [
      "Pulling yesterday's spend & ROAS snapshot",
      "Sketching Monday's 15 creative ideas",
      "Sweeping the competitor ad library",
    ],
    tasksWk: 12,
    trend: [2, 2, 2, 1, 2, 2, 1],
    reviewCount: 1,
    bio: "Runs paid acquisition across Meta and Google. Watches ROAS daily, drafts creative briefs, proposes kill/scale/pullback actions to Camille.",
    duties: [
      { cadence: "live", label: "Ad-anomaly watch", detail: "Intraday pulse: runaway spend, zero delivery, disapprovals, API throttle." },
      { cadence: "daily", label: "Spend & ROAS pull", detail: "Yesterday's account, campaign by campaign, snapshot to vault." },
      { cadence: "weekly", label: "Ad review: kill / scale / pullback calls", detail: "Week-over-week movers with proposed actions for approval." },
      { cadence: "weekly", label: "15-20 new creative idea sketches", detail: "Monday creative engine. Wolf picks, Marco expands to full briefs." },
      { cadence: "weekly", label: "Competitor ad-library spy", detail: "Live + recently-disabled competitor ads from the Meta Ad Library." },
      { cadence: "monthly", label: "Meta strategy: MER, saturation, next-month plan" },
    ],
    kpis: [
      { label: "ROAS (7d)", value: "3.1", delta: "+0.2 wk/wk", up: true, tone: "good", target: "Mål: 3.0+ blended" },
      { label: "Spend (7d)", value: "38k kr", delta: "on plan", tone: "mute" },
      { label: "CTR", value: "2.4%", delta: "+0.3pp", up: true, tone: "good" },
    ],
    kanban: {
      todo: ["Creative sketch batch W30"],
      doing: ["Weekly ad review"],
      blocked: [],
      review: ["Ad review W30 sign-off"],
      done: ["Daily spend pull", "Anomaly sweep"],
    },
  },
  {
    id: "seo-blog",
    name: "Sage",
    role: "SEO Writer",
    initials: "SB",
    bg: "linear-gradient(140deg, #16a34a 0%, #14532d 100%)",
    dept: "Marketing",
    status: "online",
    workingOn: "Drafting this week's second blog post",
    alsoWorksOn: [
      "Checking Search Console for yesterday's movers",
      "Scoring the finished draft before launch",
    ],
    tasksWk: 4,
    trend: [1, 0, 1, 1, 0, 1, 0],
    reviewCount: 0,
    bio: "Researches, drafts, and ships long-form articles for icekore.dk. Owns the blog cluster, tracks ranking and refresh windows.",
    duties: [
      { cadence: "weekly", label: "2x blog posts drafted & launched", detail: "Researched, drafted, scored, and shipped to icekore.dk." },
      { cadence: "daily", label: "Search Console performance check", detail: "Impressions, clicks, CTR, position for every published post." },
      { cadence: "weekly", label: "Rank check: movers flagged", detail: "Tracked-keyword scan; anything moving more than 5 positions gets flagged." },
      { cadence: "monthly", label: "Content audit: refresh & prune queue" },
    ],
    kpis: [
      { label: "Organic clicks (28d)", value: "6.1k", delta: "+9%", up: true, tone: "good" },
      { label: "Posts live", value: "61", delta: "+2 this week", up: true, tone: "good", target: "Mål: 2 per uge" },
      { label: "Avg. position", value: "8.2", delta: "-0.5", tone: "good" },
    ],
    kanban: {
      todo: ["Sauna vs. isbad draft"],
      doing: ["Post #2 this week"],
      blocked: [],
      review: [],
      done: ["Post #1 launched", "GSC check"],
    },
  },
  {
    id: "seo-strategist",
    name: "Sten",
    role: "SEO Strategist",
    initials: "ST",
    bg: "linear-gradient(140deg, #047857 0%, #064e3b 100%)",
    dept: "Marketing",
    status: "online",
    workingOn: "Running the weekly SEO review",
    alsoWorksOn: ["Daily tripwire scan: all green"],
    tasksWk: 3,
    trend: [1, 0, 0, 1, 0, 1, 0],
    reviewCount: 0,
    bio: "Owns the SEO programme. Monthly technical audits, keyword strategy, AI-presence checks, refresh queue. Tripwires on traffic dips.",
    duties: [
      { cadence: "daily", label: "Technical SEO tripwire scan", detail: "Broken canonicals, indexation drops, 404 spikes. Silent when green." },
      { cadence: "weekly", label: "SEO review", detail: "Blog performance + competitor moves + tripwire state, synthesized." },
      { cadence: "monthly", label: "Full technical site audit", detail: "Site crawl, schema, canonicals, redirects." },
      { cadence: "monthly", label: "Strategy refresh: pillar plan & content queue" },
      { cadence: "quarterly", label: "Keyword universe & 90-day plan reset" },
    ],
    kpis: [
      { label: "Tripwires open", value: "0", delta: "all green", tone: "good" },
      { label: "Indexed pages", value: "214", delta: "+6", up: true, tone: "good" },
      { label: "Audit findings", value: "3", delta: "2 fixed", tone: "mute" },
    ],
    kanban: {
      todo: ["Schema pass on category pages"],
      doing: ["Weekly SEO review"],
      blocked: [],
      review: [],
      done: ["Tripwire scan"],
    },
  },
  {
    id: "cro-analyst",
    name: "Cleo",
    role: "CRO Analyst",
    initials: "CL",
    bg: "linear-gradient(140deg, #57534e 0%, #1c1917 100%)",
    dept: "Marketing",
    status: "idle",
    workingOn: "Next funnel audit Friday 06:00",
    alsoWorksOn: [],
    tasksWk: 2,
    trend: [0, 1, 0, 0, 1, 0, 0],
    reviewCount: 0,
    bio: "Heuristic page audits, A/B test design, hypothesis backlog. Calls winners and writes the post-mortems.",
    duties: [
      { cadence: "weekly", label: "Funnel audit: checkout, PDP, cart friction" },
      { cadence: "monthly", label: "A/B hypothesis backlog & test designs", detail: "Testable hypotheses with predicted lift, plus specced tests." },
    ],
    kpis: [
      { label: "Tests live", value: "2", delta: "1 closing soon", tone: "mute" },
      { label: "Hypothesis backlog", value: "14", delta: "prioritised", tone: "mute" },
      { label: "Last winner", value: "+11%", delta: "CVR on PDP test", up: true, tone: "good" },
    ],
    kanban: {
      todo: ["Cart friction audit"],
      doing: [],
      blocked: [],
      review: [],
      done: ["PDP test post-mortem"],
    },
  },
  {
    id: "email-marketer",
    name: "Elin",
    role: "Email Marketer",
    initials: "EM",
    bg: "linear-gradient(140deg, #db2777 0%, #500724 100%)",
    dept: "Marketing",
    status: "online",
    workingOn: "Drafting this week's Klaviyo campaign",
    alsoWorksOn: ["Reviewing welcome-flow open rates"],
    tasksWk: 5,
    trend: [1, 1, 0, 1, 1, 0, 1],
    reviewCount: 1,
    bio: "Newsletters, welcome flows, lifecycle email. Drafts campaigns in Klaviyo, tracks open / click / unsubscribe.",
    duties: [
      { cadence: "weekly", label: "Week's email campaigns drafted", detail: "Subject, hero, body. Full HTML, Klaviyo-ready, self-reviewed." },
      { cadence: "monthly", label: "Flow audit: welcome, abandonment, post-purchase" },
    ],
    kpis: [
      { label: "Open rate", value: "48%", delta: "+2pp", up: true, tone: "good", target: "Mål: 45%+" },
      { label: "Click rate", value: "1.9%", delta: "steady", tone: "mute" },
      { label: "List growth", value: "+312", delta: "this month", up: true, tone: "good" },
    ],
    kanban: {
      todo: ["Flow audit prep"],
      doing: ["Weekly campaign"],
      blocked: [],
      review: ["Campaign draft"],
      done: ["Last week's campaign"],
    },
  },
  {
    id: "social-media-rep",
    name: "Sofie",
    role: "Social Media Rep",
    initials: "SM",
    bg: "linear-gradient(140deg, #7c3aed 0%, #2e1065 100%)",
    dept: "Marketing",
    status: "online",
    workingOn: "Slotting next week's IG + TikTok grid",
    alsoWorksOn: ["Adapting the week's beat to LinkedIn tone"],
    tasksWk: 5,
    trend: [1, 1, 1, 0, 1, 1, 0],
    reviewCount: 0,
    bio: "Drafts native posts for Instagram, TikTok, LinkedIn. Adapts the same beat to each platform's tone and pacing.",
    duties: [
      { cadence: "weekly", label: "Social calendar: IG, TikTok, FB posts drafted", detail: "Hooks, captions, hashtags per channel, slotted into a posting grid." },
    ],
    kpis: [
      { label: "Posts drafted", value: "9", delta: "this week", tone: "mute" },
      { label: "Scheduled", value: "6", delta: "next 7 days", tone: "good" },
      { label: "Best hook", value: "3.1%", delta: "CTR last week", up: true, tone: "good" },
    ],
    kanban: {
      todo: ["FB variant pass"],
      doing: ["Next week's grid"],
      blocked: [],
      review: [],
      done: ["This week's calendar"],
    },
  },
  {
    id: "community-manager",
    name: "Caro",
    role: "Community Manager",
    initials: "CN",
    bg: "linear-gradient(140deg, #d97706 0%, #451a03 100%)",
    dept: "Marketing",
    status: "online",
    workingOn: "Sweeping reviews, 3 replies queued for approval",
    alsoWorksOn: ["Compiling the voice-of-customer digest"],
    tasksWk: 9,
    trend: [1, 2, 1, 1, 2, 1, 1],
    reviewCount: 1,
    bio: "Watches Trustpilot, Google reviews, Reddit, IG comments. Synthesises sentiment, drafts replies, escalates the spicy ones.",
    duties: [
      { cadence: "daily", label: "Review & DM sweep with drafted replies", detail: "Trustpilot, Google, Shopify reviews + Meta DMs; replies queued for approval." },
      { cadence: "weekly", label: "Voice-of-customer digest", detail: "What people asked, praised, complained about. Feeds the other agents." },
    ],
    kpis: [
      { label: "Reviews swept", value: "41", delta: "this week", tone: "mute" },
      { label: "Replies drafted", value: "12", delta: "3 awaiting approval", tone: "warn" },
      { label: "Avg. rating", value: "4.7", delta: "steady", tone: "good" },
    ],
    kanban: {
      todo: [],
      doing: ["Daily sweep"],
      blocked: [],
      review: ["3 drafted replies"],
      done: ["VoC digest W29"],
    },
  },
  {
    id: "competitive-intel",
    name: "Cato",
    role: "Competitive Intel",
    initials: "CI",
    bg: "linear-gradient(140deg, #4f46e5 0%, #1e1b4b 100%)",
    dept: "Marketing",
    status: "idle",
    workingOn: "Next competitor pulse Monday 06:00",
    alsoWorksOn: [],
    tasksWk: 2,
    trend: [1, 0, 0, 0, 1, 0, 0],
    reviewCount: 0,
    bio: "Weekly competitor monitoring: pricing, creative angles, content moves, partnerships. Flags positioning shifts.",
    duties: [
      { cadence: "weekly", label: "Competitor pulse", detail: "Pricing, creative angles, content moves, partnerships. Max 7 bullets; silent if nothing moved." },
      { cadence: "monthly", label: "New-entrant sweep", detail: "Broad DK-market SERP exploration for entrants the ad cross-ref missed." },
    ],
    kpis: [
      { label: "Competitors tracked", value: "9", delta: "DK market", tone: "mute" },
      { label: "Moves flagged", value: "3", delta: "this month", tone: "mute" },
      { label: "Price changes", value: "1", delta: "logged this week", tone: "warn" },
    ],
    kanban: {
      todo: [],
      doing: [],
      blocked: [],
      review: [],
      done: ["Pulse W29", "Ad-library cross-ref"],
    },
  },
  {
    id: "audience-trend",
    name: "Aksel",
    role: "Trend Scout",
    initials: "AT",
    bg: "linear-gradient(140deg, #06b6d4 0%, #164e63 100%)",
    dept: "Marketing",
    status: "idle",
    workingOn: "Next trends digest Thursday",
    alsoWorksOn: [],
    tasksWk: 1,
    trend: [0, 0, 1, 0, 0, 0, 0],
    reviewCount: 0,
    bio: "Weekly Reddit + TikTok + RSS digest. Surfaces what audiences are actually talking about so creative and content stays current.",
    duties: [
      { cadence: "weekly", label: "Organic trends digest", detail: "TikTok + Reddit + news, synthesized so creative and content stay current." },
    ],
    kpis: [
      { label: "Sources scanned", value: "26", delta: "per digest", tone: "mute" },
      { label: "Trends surfaced", value: "4", delta: "last digest", tone: "mute" },
      { label: "Adopted by creative", value: "2", delta: "this month", up: true, tone: "good" },
    ],
    kanban: {
      todo: [],
      doing: [],
      blocked: [],
      review: [],
      done: ["Digest W29"],
    },
  },
  {
    id: "influencer-marketer",
    name: "Iben",
    role: "Influencer Marketer",
    initials: "IN",
    bg: "linear-gradient(140deg, #db2777 0%, #831843 100%)",
    dept: "Marketing",
    status: "online",
    workingOn: "Scoring 4 new creator profiles",
    alsoWorksOn: ["Drafting outreach for the A-list shortlist"],
    tasksWk: 3,
    trend: [0, 1, 0, 1, 0, 1, 0],
    reviewCount: 0,
    bio: "Scouts creators in cold-plunge / wellness, writes dossiers, drafts outreach. Tracks negotiations and deliverables.",
    duties: [
      { cadence: "weekly", label: "Creator discovery, shortlist & outreach", detail: "New creators scouted, rated A/B/C, personalized outreach sent." },
    ],
    kpis: [
      { label: "Creators scouted", value: "11", delta: "this week", tone: "mute" },
      { label: "Outreach sent", value: "6", delta: "2 replies", up: true, tone: "good" },
      { label: "In negotiation", value: "2", delta: "awaiting terms", tone: "warn" },
    ],
    kanban: {
      todo: ["B-list second pass"],
      doing: ["Scoring new profiles"],
      blocked: [],
      review: [],
      done: ["Outreach batch"],
    },
  },
  {
    id: "marketing-analyst",
    name: "Maya",
    role: "Marketing Analyst",
    initials: "MA",
    bg: "linear-gradient(140deg, #0891b2 0%, #0c4a6e 100%)",
    dept: "Operations",
    status: "busy",
    workingOn: "Pulling yesterday's numbers across channels",
    alsoWorksOn: [
      "Writing the insights overlay for the CMO brief",
      "Checking an anomaly flag from the daily pulse",
    ],
    tasksWk: 7,
    trend: [1, 1, 1, 1, 1, 1, 1],
    reviewCount: 0,
    bio: "CMO right hand. Pulls weekly data, writes the insights overlay, drafts the CMO decision brief. Reads agent outputs from vault.",
    duties: [
      { cadence: "daily", label: "Data pulse: anomaly flags", detail: "Yesterday across Meta, Shopify, Klaviyo; anomalies flagged to the CoS." },
      { cadence: "weekly", label: "Numbers brief with commentary", detail: "All channel outputs synthesized into a CMO-ready brief with narrative." },
      { cadence: "monthly", label: "Board pack: full-month numbers & narrative" },
    ],
    kpis: [
      { label: "Anomalies flagged", value: "2", delta: "this week", tone: "warn" },
      { label: "Brief on time", value: "100%", delta: "12 weeks straight", tone: "good" },
      { label: "Channels covered", value: "4", delta: "Meta, Shopify, Klaviyo, GSC", tone: "mute" },
    ],
    kanban: {
      todo: ["Board pack outline"],
      doing: ["Daily data pulse"],
      blocked: [],
      review: [],
      done: ["Numbers brief W29", "Anomaly check"],
    },
  },
];

/* ─── Header / stat strip ─────────────── */

export const TOTALS = {
  agents: AGENTS.length,
  online: AGENTS.filter((a) => a.status === "online" || a.status === "busy").length,
  idle: AGENTS.filter((a) => a.status === "idle").length,
  blocked: AGENTS.filter((a) => a.status === "blocked").length,
  tasksThisWeek: AGENTS.reduce((s, a) => s + a.tasksWk, 0),
  weekTrend: [6, 9, 11, 7, 10, 9, 7],
  needsReview: 3,
};

/* ─── Needs-you queue ─────────────── */

export interface DemoHandoff {
  id: string;
  title: string;
  agentId: string;
  ago: string;
  urgent?: boolean;
}

export const HANDOFFS: DemoHandoff[] = [
  {
    id: "h1",
    title: "Ad review W30: 2 kills, 1 scale proposed. Approve?",
    agentId: "media-buying",
    ago: "3h",
    urgent: true,
  },
  {
    id: "h2",
    title: "This week's campaign draft ready for Klaviyo",
    agentId: "email-marketer",
    ago: "6h",
  },
  {
    id: "h3",
    title: "3 review replies queued for Trustpilot",
    agentId: "community-manager",
    ago: "1d",
  },
];

/* ─── Live feed ─────────────── */

export interface DemoFeedEvent {
  agentId: string;
  what: string;
  live?: boolean;
}

/** Initial items, newest first. Rendered identically on server and client. */
export const FEED_SEED: DemoFeedEvent[] = [
  { agentId: "media-buying", what: "pulled yesterday's spend & ROAS snapshot", live: true },
  { agentId: "marketing-cos", what: "filed the morning standup digest", live: true },
  { agentId: "community-manager", what: "drafted replies to 3 new reviews" },
  { agentId: "marketing-analyst", what: "ran the daily data pulse, 1 anomaly flagged" },
  { agentId: "seo-blog", what: "shipped this week's first blog post" },
  { agentId: "seo-strategist", what: "tripwire scan: all green" },
];

/** Script the simulation cycles through, one event at a time. */
export const FEED_SCRIPT: DemoFeedEvent[] = [
  { agentId: "email-marketer", what: "drafted this week's campaign for Klaviyo", live: true },
  { agentId: "competitive-intel", what: "logged a competitor price change" },
  { agentId: "media-buying", what: "flagged a fatigued ad set in the anomaly watch", live: true },
  { agentId: "social-media-rep", what: "slotted 6 posts into next week's grid" },
  { agentId: "audience-trend", what: "filed the weekly trends digest" },
  { agentId: "influencer-marketer", what: "sent outreach to 2 shortlisted creators" },
  { agentId: "marketing-analyst", what: "finished the insights overlay for the brief", live: true },
  { agentId: "community-manager", what: "escalated one review to the handoff queue" },
  { agentId: "seo-blog", what: "flagged 2 keyword movers in the rank check" },
  { agentId: "marketing-cos", what: "updated this week's priorities for the team", live: true },
];

/** Age labels by feed position. Purely cosmetic, keeps SSR deterministic. */
export const FEED_AGES = ["just now", "2m", "5m", "9m", "14m", "22m", "31m", "48m"];

/* ─── Sidebar (mirrors the hub's nav) ─────────────── */

export type NavIconName =
  | "home" | "inbox" | "team" | "org"
  | "dashboard" | "brain" | "tools"
  | "jarvis" | "chat";

export interface NavItem {
  label: string;
  sub: string;
  icon: NavIconName;
  active?: boolean;
  badge?: string;
}

export const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "Workspace",
    items: [
      { label: "For You", sub: "Your board, briefs and reports", icon: "home" },
      { label: "Inbox", sub: "Handoffs awaiting your review", icon: "inbox", badge: "3" },
      { label: "Team", sub: "Live agent mission control", icon: "team", active: true },
      { label: "Org", sub: "Org chart", icon: "org" },
    ],
  },
  {
    title: "Insight",
    items: [
      { label: "Dashboard", sub: "Marketing and revenue dashboard", icon: "dashboard" },
      { label: "Brain", sub: "Company knowledge vault", icon: "brain" },
      { label: "Tools", sub: "Company tools and apps", icon: "tools" },
    ],
  },
  {
    title: "Assistants",
    items: [
      { label: "Jarvis", sub: "Voice assistant", icon: "jarvis" },
      { label: "Chat", sub: "Talk with Claude", icon: "chat" },
    ],
  },
];
