import { randomUUID } from "node:crypto";
import type { DB } from "./index";
import { parseReference } from "@/lib/domain/references";
import type {
  PlatformKey,
  FormatKey,
  StatusKey,
  PriorityKey,
} from "@/lib/domain/constants";

const LOCAL_USER_ID = "local-user";

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};
const daysAhead = (n: number, hour = 9) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};
const thisMonth = (day: number) => {
  const d = new Date();
  d.setDate(day);
  d.setHours(10, 0, 0, 0);
  return d.toISOString();
};

interface SeedItem {
  title: string;
  description?: string;
  hook?: string;
  script?: string;
  cta?: string;
  notes?: string;
  angle?: string;
  category?: string;
  content_pillar?: string;
  platform: PlatformKey;
  format: FormatKey;
  status: StatusKey;
  priority: PriorityKey;
  thumbnail_url?: string | null;
  scheduled_at?: string | null;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
  tags?: string[];
  refUrls?: string[];
  metrics?: { views: number; likes: number; comments: number; shares: number; saves: number; leads: number };
}

const REFERENCES: { url: string; title: string; notes?: string; tags?: string[] }[] = [
  {
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    title: "Storytelling structure that keeps retention high",
    notes: "The 3-act mini structure at 2:14 is gold for short-form hooks.",
    tags: ["retention", "storytelling"],
  },
  {
    url: "https://youtu.be/aqz-KE-bpKQ",
    title: "How this creator scripts a 60-second explainer",
    notes: "Great pacing reference — one idea per sentence.",
    tags: ["scripting", "shorts"],
  },
  {
    url: "https://www.youtube.com/shorts/5qap5aO4i9A",
    title: "Pattern interrupt in the first 2 seconds",
    tags: ["hooks", "shorts"],
  },
  {
    url: "https://www.linkedin.com/posts/example_ai-automation-activity-123456789",
    title: "Contrarian take on AI tools that went viral",
    notes: "Opening line does the heavy lifting. Note the whitespace formatting.",
    tags: ["linkedin", "hooks"],
  },
  {
    url: "https://www.instagram.com/reel/CxYzAbCdEfG/",
    title: "Restaurant automation reel — clean B-roll",
    notes: "Reference for the voice-agent demo visuals.",
    tags: ["reels", "b-roll"],
  },
  {
    url: "https://x.com/example/status/1780000000000000000",
    title: "Thread: lead follow-up that closes deals",
    tags: ["threads", "leads"],
  },
  {
    url: "https://www.tiktok.com/@creator/video/7300000000000000000",
    title: "Fast-cut editing style worth stealing",
    tags: ["editing", "tiktok"],
  },
  {
    url: "https://every.to/p/the-anti-tool-manifesto",
    title: "Essay: why more tools rarely means more output",
    notes: "Solid supporting argument for the LinkedIn post.",
    tags: ["research"],
  },
];

const ITEMS: SeedItem[] = [
  {
    title: "Why Businesses Don't Need More AI Tools",
    description: "A contrarian LinkedIn post arguing that most teams have a workflow problem, not a tooling problem.",
    hook: "Your business doesn't need another AI tool. It needs to actually use the three you already pay for.",
    script:
      "Your business doesn't need another AI tool.\n\nIt needs to actually use the three you already pay for.\n\nEvery week I talk to a founder drowning in subscriptions:\n— an AI notetaker nobody reads\n— a chatbot that answers zero real questions\n— an \"automation platform\" wired to nothing\n\nThe problem was never access to tools.\nThe problem is that tools don't create workflows. People do.\n\nBefore you buy the next thing, ask:\n1. What is the actual bottleneck?\n2. Would removing a step beat adding a tool?\n3. Who owns this after the demo hype fades?\n\nThe teams winning with AI aren't the ones with the most tools.\nThey're the ones who deleted the busywork the tool was hiding.",
    cta: "What's one tool you pay for but never actually use? Reply below — I read every one.",
    notes: "Post Tuesday morning. Keep the formatting airy for mobile.",
    angle: "Contrarian / pattern interrupt",
    category: "Thought leadership",
    content_pillar: "AI strategy",
    platform: "linkedin",
    format: "text_post",
    status: "scripting",
    priority: "high",
    created_at: daysAgo(3),
    updated_at: daysAgo(1),
    tags: ["ai", "linkedin", "opinion"],
    refUrls: [
      "https://www.linkedin.com/posts/example_ai-automation-activity-123456789",
      "https://every.to/p/the-anti-tool-manifesto",
    ],
  },
  {
    title: "AI Voice Agent for Restaurants",
    description: "Reel demoing a voice agent that answers the phone, books tables and upsells specials.",
    hook: "This restaurant hasn't missed a phone call in 3 weeks — and there's no host answering.",
    script:
      "This restaurant hasn't missed a phone call in 3 weeks.\n\nAnd there's no host answering.\n\n[cut to phone ringing → AI picks up]\n\nIt books the table.\nIt knows tonight's specials.\nIt texts a confirmation before you hang up.\n\n[show dashboard: 42 calls handled, 0 missed]\n\nDuring the dinner rush, every missed call is a lost table.\nThe agent handles them all — at once.\n\nWant the build breakdown? Comment \"AGENT\".",
    cta: "Comment \"AGENT\" and I'll send the full build.",
    notes: "Need clean B-roll of the phone + dashboard. See the Instagram reference for the visual style.",
    angle: "Demo / result-first",
    category: "Product demo",
    content_pillar: "Automation builds",
    platform: "instagram",
    format: "reel",
    status: "ready_to_record",
    priority: "urgent",
    created_at: daysAgo(6),
    updated_at: daysAgo(2),
    tags: ["voice-agent", "reels", "demo"],
    refUrls: ["https://www.instagram.com/reel/CxYzAbCdEfG/", "https://www.tiktok.com/@creator/video/7300000000000000000"],
  },
  {
    title: "Automating Lead Follow-Up",
    description: "Tutorial walking through an automated follow-up sequence that revives cold leads.",
    hook: "80% of your leads never hear from you a second time. Here's the automation that fixes it.",
    script: "",
    notes: "Long-form YouTube tutorial. Storyboard the n8n workflow screen-share.",
    angle: "How-to / educational",
    category: "Tutorial",
    content_pillar: "Automation builds",
    platform: "youtube",
    format: "tutorial",
    status: "idea",
    priority: "medium",
    created_at: daysAgo(2),
    updated_at: daysAgo(2),
    tags: ["leads", "tutorial", "automation"],
    refUrls: ["https://x.com/example/status/1780000000000000000"],
  },
  {
    title: "The 2-second hook framework",
    description: "Short breaking down how to earn the first 2 seconds of attention.",
    hook: "You have 2 seconds. Here's how to not waste them.",
    script:
      "You have 2 seconds.\n\nHere's how to not waste them.\n\n1. Open on the result, not the setup.\n2. Say the thing they're scared is true.\n3. Cut every word before the point.\n\nThat's it. Rewatch your last 3 posts — how long until the point lands?",
    cta: "Save this before your next post.",
    angle: "Framework",
    category: "Education",
    content_pillar: "Content strategy",
    platform: "youtube_shorts",
    format: "short",
    status: "editing",
    priority: "high",
    created_at: daysAgo(9),
    updated_at: daysAgo(1),
    tags: ["hooks", "shorts"],
    refUrls: ["https://www.youtube.com/shorts/5qap5aO4i9A", "https://youtu.be/aqz-KE-bpKQ"],
  },
  {
    title: "Notion vs. a real system",
    description: "Opinion thread on why tools don't equal systems.",
    hook: "Your Notion workspace isn't a system. It's a very organized way to procrastinate.",
    script:
      "Your Notion workspace isn't a system.\n\nIt's a very organized way to procrastinate.\n\nA system has:\n— a trigger\n— a next action\n— a place things go when done\n\nA workspace has vibes and 40 databases.\n\nBuild the flow first. Decorate later.",
    cta: "Steal the flow, skip the decoration.",
    angle: "Contrarian",
    category: "Opinion",
    content_pillar: "Content strategy",
    platform: "x",
    format: "thread",
    status: "ready_to_post",
    priority: "medium",
    created_at: daysAgo(4),
    updated_at: daysAgo(1),
    tags: ["opinion", "systems"],
  },
  {
    title: "Client onboarding, fully automated",
    description: "Carousel case study of an onboarding flow that cut manual work by 6 hours/client.",
    hook: "We deleted 6 hours of manual onboarding per client. Here's the exact flow.",
    script:
      "Slide 1: 6 hours saved per client. No new hires.\nSlide 2: The old way — 11 manual steps, 4 tools, endless copy-paste.\nSlide 3: The trigger — signed contract in the CRM.\nSlide 4: Auto-create workspace + folders.\nSlide 5: Auto-send welcome + intake form.\nSlide 6: Intake answers route the kickoff call.\nSlide 7: The result — clients feel it's premium, you do nothing.\nSlide 8: Want the template? Comment \"FLOW\".",
    cta: "Comment \"FLOW\" for the template.",
    angle: "Case study",
    category: "Case study",
    content_pillar: "Automation builds",
    platform: "linkedin",
    format: "carousel",
    status: "scheduled",
    priority: "high",
    scheduled_at: daysAhead(2, 8),
    created_at: daysAgo(10),
    updated_at: daysAgo(3),
    tags: ["case-study", "onboarding", "automation"],
  },
  {
    title: "3 automations every agency should steal",
    description: "Scheduled reel rounding up three high-leverage automations.",
    hook: "Three automations that quietly run my agency while I sleep.",
    script:
      "Three automations that quietly run my agency while I sleep.\n\n1. Lead → CRM → instant personalized reply.\n2. Call recording → summary → tasks in the PM tool.\n3. Invoice paid → onboarding kickoff, automatically.\n\nNone of these are fancy. All of them compound.",
    cta: "Which one are you building first?",
    angle: "Listicle",
    category: "Education",
    content_pillar: "Automation builds",
    platform: "instagram",
    format: "reel",
    status: "scheduled",
    priority: "medium",
    scheduled_at: daysAhead(5, 12),
    created_at: daysAgo(8),
    updated_at: daysAgo(2),
    tags: ["automation", "agency", "reels"],
  },
  {
    title: "Cold email is not dead — you are boring",
    description: "Inbox capture to develop into a punchy opinion post.",
    hook: "Cold email isn't dead. Your cold email is just boring.",
    platform: "linkedin",
    format: "text_post",
    status: "inbox",
    priority: "low",
    created_at: daysAgo(1),
    updated_at: daysAgo(1),
    tags: ["cold-email"],
  },
  {
    title: "Behind the scenes: how I batch a week of content",
    description: "Research-stage long-form on the batching workflow.",
    hook: "I record a week of content in one afternoon. Here's the system.",
    notes: "Pull the retention structure from the storytelling reference.",
    angle: "Behind the scenes",
    category: "Education",
    content_pillar: "Content strategy",
    platform: "youtube",
    format: "long_form",
    status: "research",
    priority: "medium",
    created_at: daysAgo(40),
    updated_at: daysAgo(35),
    tags: ["batching", "workflow"],
    refUrls: ["https://www.youtube.com/watch?v=dQw4w9WgXcQ"],
  },
  {
    title: "The tool breakdown nobody asked for (but needs)",
    description: "Tool breakdown currently being recorded.",
    hook: "I replaced 6 subscriptions with 2. Here's the stack.",
    script:
      "I replaced 6 subscriptions with 2.\n\nHere's the exact stack and what each one does.\n\n[screen share the stack]\n\nThe trick isn't the tools — it's refusing to add a tool until the workflow hurts.",
    cta: "Full stack list in the description.",
    angle: "Tool breakdown",
    category: "Education",
    content_pillar: "AI strategy",
    platform: "youtube",
    format: "tool_breakdown",
    status: "recording",
    priority: "medium",
    created_at: daysAgo(12),
    updated_at: daysAgo(1),
    tags: ["tools", "stack"],
  },
  {
    title: "Why we niched down and doubled revenue",
    description: "Posted case study — strong performer.",
    hook: "We turned away half our leads and doubled revenue. Here's why.",
    script:
      "We turned away half our leads and doubled revenue.\n\nHere's why niching down worked.\n\nWhen you serve everyone, you compete on price.\nWhen you serve one type of client, you compete on results.\n\nWe picked restaurants. Learned their exact problems.\nNow every case study sells the next deal.",
    cta: "Niche you're considering? Tell me below.",
    angle: "Case study",
    category: "Case study",
    content_pillar: "Business",
    platform: "linkedin",
    format: "text_post",
    status: "posted",
    priority: "medium",
    published_at: thisMonth(6),
    created_at: daysAgo(28),
    updated_at: thisMonth(6),
    tags: ["business", "case-study"],
    metrics: { views: 18400, likes: 642, comments: 88, shares: 41, saves: 120, leads: 7 },
  },
  {
    title: "The 5-minute morning automation audit",
    description: "Posted short — decent reach.",
    hook: "Do this 5-minute audit before you build another automation.",
    script:
      "Do this 5-minute audit before you build another automation.\n\nList your last 10 repetitive tasks.\nCircle the 3 you did more than twice.\nAutomate only those.\n\nEverything else is a shiny distraction.",
    cta: "Save this for your next build day.",
    angle: "Framework",
    category: "Education",
    content_pillar: "Automation builds",
    platform: "youtube_shorts",
    format: "short",
    status: "posted",
    priority: "low",
    published_at: thisMonth(12),
    created_at: daysAgo(22),
    updated_at: thisMonth(12),
    tags: ["audit", "shorts"],
    metrics: { views: 9200, likes: 310, comments: 24, shares: 18, saves: 64, leads: 2 },
  },
];

export function seedDatabase(db: DB): void {
  const nowIso = new Date().toISOString();
  const tx = db.transaction(() => {
    db.prepare("INSERT INTO users (id, name, email, created_at) VALUES (?, ?, ?, ?)").run(
      LOCAL_USER_ID,
      "You",
      "you@contentos.local",
      nowIso,
    );

    // References
    const refIdByUrl = new Map<string, string>();
    const insRef = db.prepare(
      `INSERT INTO refs (id, user_id, url, platform, title, thumbnail_url, embed_url, notes, created_at)
       VALUES (@id, @user_id, @url, @platform, @title, @thumbnail_url, @embed_url, @notes, @created_at)`,
    );
    const ensureTag = db.prepare("INSERT OR IGNORE INTO tags (id, name, created_at) VALUES (?, ?, ?)");
    const tagIdByName = new Map<string, string>();
    const tagId = (name: string) => {
      const key = name.trim();
      if (!key) return null;
      if (!tagIdByName.has(key)) {
        const tid = randomUUID();
        ensureTag.run(tid, key, nowIso);
        const row = db.prepare("SELECT id FROM tags WHERE name = ?").get(key) as { id: string };
        tagIdByName.set(key, row.id);
      }
      return tagIdByName.get(key)!;
    };
    const insRefTag = db.prepare(
      "INSERT OR IGNORE INTO reference_tags (reference_id, tag_id) VALUES (?, ?)",
    );

    REFERENCES.forEach((r, i) => {
      const parsed = parseReference(r.url);
      const rid = randomUUID();
      insRef.run({
        id: rid,
        user_id: LOCAL_USER_ID,
        url: parsed.url,
        platform: parsed.platform,
        title: r.title,
        thumbnail_url: parsed.thumbnailUrl,
        embed_url: parsed.embedUrl,
        notes: r.notes ?? "",
        created_at: daysAgo(i + 2),
      });
      refIdByUrl.set(r.url, rid);
      for (const t of r.tags ?? []) {
        const tid = tagId(t);
        if (tid) insRefTag.run(rid, tid);
      }
    });

    // Content items
    const insItem = db.prepare(
      `INSERT INTO content_items
        (id, user_id, title, description, hook, script, cta, notes, angle, category, content_pillar,
         platform, format, status, priority, thumbnail_url, archived, repurposed_from, scheduled_at, published_at, created_at, updated_at)
       VALUES
        (@id, @user_id, @title, @description, @hook, @script, @cta, @notes, @angle, @category, @content_pillar,
         @platform, @format, @status, @priority, @thumbnail_url, 0, NULL, @scheduled_at, @published_at, @created_at, @updated_at)`,
    );
    const insContentTag = db.prepare(
      "INSERT OR IGNORE INTO content_tags (content_id, tag_id) VALUES (?, ?)",
    );
    const insContentRef = db.prepare(
      "INSERT OR IGNORE INTO content_references (content_id, reference_id) VALUES (?, ?)",
    );
    const insMetrics = db.prepare(
      `INSERT INTO performance_metrics (content_id, views, likes, comments, shares, saves, leads, updated_at)
       VALUES (@content_id, @views, @likes, @comments, @shares, @saves, @leads, @updated_at)`,
    );

    for (const item of ITEMS) {
      const cid = randomUUID();
      insItem.run({
        id: cid,
        user_id: LOCAL_USER_ID,
        title: item.title,
        description: item.description ?? "",
        hook: item.hook ?? "",
        script: item.script ?? "",
        cta: item.cta ?? "",
        notes: item.notes ?? "",
        angle: item.angle ?? "",
        category: item.category ?? "",
        content_pillar: item.content_pillar ?? "",
        platform: item.platform,
        format: item.format,
        status: item.status,
        priority: item.priority,
        thumbnail_url: item.thumbnail_url ?? null,
        scheduled_at: item.scheduled_at ?? null,
        published_at: item.published_at ?? null,
        created_at: item.created_at,
        updated_at: item.updated_at,
      });
      for (const t of item.tags ?? []) {
        const tid = tagId(t);
        if (tid) insContentTag.run(cid, tid);
      }
      for (const url of item.refUrls ?? []) {
        const rid = refIdByUrl.get(url);
        if (rid) insContentRef.run(cid, rid);
      }
      if (item.metrics) {
        insMetrics.run({ content_id: cid, ...item.metrics, updated_at: nowIso });
      }
    }
  });
  tx();
}
