import type { LucideIcon } from 'lucide-react';
import {
  Bot,
  PhoneCall,
  Zap,
  ShoppingCart,
  FileText,
  Code2,
} from 'lucide-react';

export type Service = {
  id: string;
  icon: LucideIcon;
  name: string;
  short: string; // the 2-sentence marketing copy
  whatYouGet: string[]; // expanded bullets derived from the copy
};

export type CaseMetric = {
  label: string;
  // The animated chart to draw. `bars` for before/after or trend columns,
  // `line` for a growth curve, `ring` for a single headline percentage.
  kind: 'bars' | 'line' | 'ring';
  // 0–100 values. `ring` uses the first value only.
  values: number[];
  captions?: string[]; // optional labels under each bar
  display: string; // the big headline number, e.g. "+63%"
  note: string; // one line explaining the metric
};

export type CaseStudy = {
  id: string;
  industry: string; // clients stay anonymous — label by industry
  service: string;
  result: string;
  // I will supply real media later. Leave empty to show the branded poster.
  video: string; // TODO: mp4 URL or YouTube embed URL
  // Illustrative outcome metric rendered as an animated chart. Numbers are
  // representative placeholders — swap for verified client figures.
  metric?: CaseMetric;
};

export type Testimonial = {
  quote: string;
  name: string; // TODO: real name or keep anonymous
  role: string;
  company: string;
  rating: number; // 1–5
};

export type SalesFaq = { q: string; a: string };

export type DemoScenario = {
  id: string;
  serviceName: string;
  title: string;
  stats: { value: string; label: string }[];
  ping: string;
};

export const SITE_CONFIG = {
  name: 'Profinity Solutions',
  domain: 'profinitysolution.com',
  url: 'https://profinitysolution.com',
  // Tagline is pending — swap this one constant when finalised.
  heroHeadline: 'Automate the busywork. Run your business on AI.',
  heroSubline:
    'Profinity Solutions builds AI agents that call, chat, and work around the clock — wired into the tools your team already uses.',
  description:
    'Profinity Solutions is an AI automation agency. We build AI calling agents, chatbots, and automation workflows that run your business 24/7.',

  // ── Contact — ALL pending. Fill these in; rendered everywhere from here. ──
  contact: {
    email: 'hello@profinitysolution.com', // TODO: real email
    phone: '+92 000 0000000', // TODO: real phone
    address: 'TODO: street, city, country', // TODO: real address
    mapsUrl: '', // TODO: Google Maps link (optional)
  },
  socials: {
    linkedin: '', // TODO: LinkedIn URL
    instagram: '', // TODO: Instagram URL
    facebook: '', // TODO: Facebook URL
    x: '', // TODO: X/Twitter URL
    youtube: '', // TODO: YouTube URL
  },

  // Contact form endpoint. Static hosting has no server, so point this at a
  // Formspree-style POST URL. If left blank, the form falls back to mailto:.
  formEndpoint: '', // TODO: e.g. https://formspree.io/f/xxxxxxx

  primaryCta: { label: 'Book a Free Automation Audit', href: '/contact' },
  secondaryCta: { label: 'Explore Services', href: '/services' },
} as const;

export const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Services', href: '/services' },
  { label: 'Portfolio', href: '/portfolio' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact', href: '/contact' },
] as const;

export const SERVICES: Service[] = [
  {
    id: 'ai-automations',
    icon: Bot,
    name: 'AI Automations',
    short:
      'Custom AI automation workflows that eliminate repetitive manual work across your business, from lead intake to order processing. Every workflow is built around your existing tools, so your team gets the speed of automation without disrupting how you already work.',
    whatYouGet: [
      'Workflows mapped to your real processes, from lead intake to order processing',
      'Built around the tools you already use — no rip-and-replace',
      'Repetitive manual tasks removed so your team focuses on higher-value work',
      'Reliable, monitored automations that scale as you grow',
    ],
  },
  {
    id: 'ai-calling-agents',
    icon: PhoneCall,
    name: 'AI Calling Agents',
    short:
      'AI calling agents handle inbound and outbound calls around the clock, qualifying leads, booking appointments, and answering common questions in a natural voice. They never miss a call and hand off complex conversations to your team seamlessly.',
    whatYouGet: [
      'Inbound and outbound calls handled 24/7 in a natural voice',
      'Leads qualified and appointments booked automatically',
      'Common questions answered instantly, day or night',
      'Seamless handoff to your team for complex conversations',
    ],
  },
  {
    id: 'speed-to-lead-chatbots',
    icon: Zap,
    name: 'Speed-to-Lead Chatbots',
    short:
      'The moment a lead comes in, our chatbots respond in seconds instead of hours, qualifying them and routing hot leads straight to your sales team. Faster first response means higher conversion and fewer leads lost to competitors.',
    whatYouGet: [
      'Instant first response — seconds, not hours',
      'Automatic lead qualification the moment they arrive',
      'Hot leads routed straight to your sales team',
      'Higher conversion and fewer leads lost to competitors',
    ],
  },
  {
    id: 'ecommerce-ai-chat',
    icon: ShoppingCart,
    name: 'E-commerce AI Chat Agents',
    short:
      'AI chat agents live on your storefront, answering product questions, recommending items, and recovering abandoned carts in real time. They work 24/7 to turn browsers into buyers without adding headcount to support.',
    whatYouGet: [
      'Product questions answered in real time, right on your storefront',
      'Smart product recommendations that lift average order value',
      'Abandoned carts recovered automatically',
      'Round-the-clock support without adding headcount',
    ],
  },
  {
    id: 'content-automation',
    icon: FileText,
    name: 'Content Automation AI Agents',
    short:
      'AI agents that research, draft, and schedule content across your blog and social channels, keeping your brand visible without your team spending hours writing. You review and approve — the agent handles the rest.',
    whatYouGet: [
      'Research, drafting, and scheduling handled end to end',
      'Consistent presence across your blog and social channels',
      'A review-and-approve step keeps you in full control',
      'Hours of writing time given back to your team',
    ],
  },
  {
    id: 'ai-web-development',
    icon: Code2,
    name: 'AI-Connected Web Development',
    short:
      "Websites and web apps with AI tools wired directly into the backend, from smart forms to AI-assisted search and personalization. Your site doesn't just look modern, it works smarter.",
    whatYouGet: [
      'Modern, fast websites and web apps built to convert',
      'AI wired into the backend — smart forms, search, personalization',
      'Experiences tailored to each visitor',
      'A site that works smarter, not just looks the part',
    ],
  },
];

export const STATS = [
  { value: 24, suffix: '/7', label: 'Always-On Automation' },
  { value: 2, prefix: '~', suffix: 's', label: 'Avg. AI First Response' },
  { value: 100, suffix: '%', label: 'Custom-Built Workflows' },
  { value: 6, suffix: '+', label: 'Core AI Services' },
] as const;

// Real client work — anonymous, labelled by industry. Add more freely.
export const CASE_STUDIES: CaseStudy[] = [
  {
    id: 'dental-front-desk',
    industry: 'Dental clinic — front desk',
    service: 'AI Calling Agent',
    result: 'Zero missed calls and 24/7 appointment booking without extra staff.',
    video: '', // TODO
    metric: {
      label: 'Calls answered',
      kind: 'bars',
      values: [58, 100],
      captions: ['Before', 'With AI'],
      display: '100%',
      note: 'Every inbound call answered, day or night — up from ~58% before.',
    },
  },
  {
    id: 'real-estate-routing',
    industry: 'Real estate — lead routing',
    service: 'Speed-to-Lead Chatbot',
    result: 'New enquiries qualified in seconds and routed to the right agent instantly.',
    video: '', // TODO
    metric: {
      label: 'Lead-to-contact time',
      kind: 'line',
      values: [12, 28, 46, 63, 78, 88],
      display: '−96%',
      note: 'First response cut from hours to seconds, lifting qualified conversions.',
    },
  },
  {
    id: 'ecommerce-cart',
    industry: 'E-commerce brand — cart recovery',
    service: 'E-commerce AI Chat Agent',
    result: 'Abandoned carts recovered in real time, turning browsers into buyers.',
    video: '', // TODO
    metric: {
      label: 'Carts recovered',
      kind: 'ring',
      values: [34],
      display: '+34%',
      note: 'A third of abandoning shoppers brought back to checkout automatically.',
    },
  },
];

// ── Social proof & authority ──────────────────────────────────────────────
// Anonymous trust markers. Replace `clients` with real (permitted) names/logos
// and `badges` with anything you can substantiate.
export const AUTHORITY = {
  eyebrow: 'Built for operators who count on it',
  // Text "logos" so nothing is faked. Swap for <Image> logos when you have them.
  clients: [
    'Dental Clinics',
    'Real Estate Teams',
    'E-commerce Brands',
    'Home Services',
    'Med Spas',
    'Agencies',
  ],
  badges: [
    { value: '24/7', label: 'Agents on shift' },
    { value: '~2s', label: 'First response' },
    { value: '6+', label: 'AI services' },
    { value: '100%', label: 'Custom-built' },
  ],
} as const;

// ── Client testimonials (quotes) ──────────────────────────────────────────
// Representative placeholder voices — replace with real, approved quotes.
export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'The AI calling agent picks up every call now. We stopped losing after-hours bookings overnight — it paid for itself in the first month.',
    name: 'Practice Manager',
    role: 'Operations',
    company: 'Dental clinic',
    rating: 5,
  },
  {
    quote:
      'Leads used to sit for hours. Now they get a reply in seconds and land on the right agent’s desk already qualified. Our close rate went up, full stop.',
    name: 'Team Lead',
    role: 'Sales',
    company: 'Real estate group',
    rating: 5,
  },
  {
    quote:
      'It feels like we hired a night shift that never sleeps. Carts get recovered, questions get answered, and support tickets dropped.',
    name: 'Founder',
    role: 'Owner',
    company: 'E-commerce brand',
    rating: 5,
  },
  {
    quote:
      'They built everything around the tools we already run. No rip-and-replace, no drama — just automations that quietly do the busywork.',
    name: 'Operations Director',
    role: 'Operations',
    company: 'Home services company',
    rating: 5,
  },
];

// Avatar wall for the animated testimonial grid. Using remote stock photos as
// clearly-swappable placeholders (no client is named). Drop local files into
// /public and point these at them when you have real photos.
export const TESTIMONIAL_AVATARS: { imgSrc: string; alt: string }[] = [
  { imgSrc: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=300', alt: 'Client portrait' },
  { imgSrc: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=300', alt: 'Client portrait' },
  { imgSrc: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300', alt: 'Client portrait' },
  { imgSrc: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=300', alt: 'Client portrait' },
  { imgSrc: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=300', alt: 'Client portrait' },
  { imgSrc: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300', alt: 'Client portrait' },
  { imgSrc: 'https://images.unsplash.com/photo-1557862921-37829c790f19?q=80&w=300', alt: 'Client portrait' },
  { imgSrc: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300', alt: 'Client portrait' },
  { imgSrc: 'https://images.unsplash.com/photo-1619895862022-09114b41f16f?q=80&w=300', alt: 'Client portrait' },
  { imgSrc: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=300', alt: 'Client portrait' },
  { imgSrc: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=300', alt: 'Client portrait' },
  { imgSrc: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=300', alt: 'Client portrait' },
];

// ── Pain points that lead into the ROI calculator ─────────────────────────
export const PAIN_POINTS = [
  {
    stat: '78%',
    title: 'of buyers pick whoever replies first',
    body: 'Every hour a lead waits, it cools. Miss the first-response window and a competitor closes them instead.',
  },
  {
    stat: '~27%',
    title: 'of calls to small businesses go unanswered',
    body: 'Voicemail is where revenue goes to die. After-hours and lunch-rush calls quietly become lost customers.',
  },
  {
    stat: '13+ hrs',
    title: 'a week lost to repetitive manual work',
    body: 'Copy-paste follow-ups, data entry, and triage burn your team’s time on work an agent can do instantly.',
  },
];

// Defaults for the interactive ROI calculator. All numbers are user-editable.
export const CALCULATOR_DEFAULTS = {
  leadsPerMonth: 200,
  dealValue: 900, // avg. value of a won customer
  closeRate: 20, // % of qualified leads that close today
  missedPct: 30, // % of leads currently missed / replied to too slowly
  speedUplift: 35, // % relative lift in close rate from instant response
  // Automation-hours tab
  hoursPerWeek: 15, // hours spent on automatable busywork
  hourlyCost: 18, // blended hourly staff cost
  automatablePct: 70, // % of those hours an agent can take over
} as const;

// ── Deep sales / objection FAQ (separate from the short home FAQ) ──────────
export const SALES_FAQS: SalesFaq[] = [
  {
    q: 'How much does this cost, really?',
    a: 'Projects typically start in the low four figures for a single focused agent and scale with scope. You get a fixed, itemised proposal after the free audit — no open-ended hourly billing, no surprises. Most clients frame it against the revenue they’re already losing to missed and slow-handled leads, which the calculator above estimates for you.',
  },
  {
    q: 'How is this different from ChatGPT or an off-the-shelf bot?',
    a: 'Generic bots answer questions. We build agents wired into your actual stack — your CRM, calendar, phone system, and storefront — so they take real actions: booking the appointment, qualifying and routing the lead, recovering the cart, updating the record. It’s an operator, not a chat window.',
  },
  {
    q: 'What if the AI says something wrong or goes off-script?',
    a: 'Agents are scoped to your approved knowledge and guardrails, not the open internet. Anything outside their remit is handed to a human with full context. You review behaviour before launch, and we monitor and tune continuously after go-live.',
  },
  {
    q: 'We already have a team. Will this replace them?',
    a: 'No — it removes the busywork so your team does the work only humans should. Agents cover the after-hours calls, the instant first replies, and the repetitive triage; your people handle judgment, relationships, and closing.',
  },
  {
    q: 'How long until it’s live and we see results?',
    a: 'Most first agents go live within a few weeks. Because we start where the ROI is clearest — usually speed-to-lead or missed calls — impact tends to show up in the first billing cycle after launch.',
  },
  {
    q: 'Will it actually integrate with the tools we use?',
    a: 'Yes. We build around your existing stack rather than forcing a migration. If a tool has an API or automation hook — and almost all modern CRMs, phone systems, and storefronts do — we can connect it.',
  },
  {
    q: 'Is our data safe?',
    a: 'We work within your accounts and permissions, pass data over secure connections, and limit each agent to only the data it needs. We’ll walk through exactly what’s accessed and stored during scoping.',
  },
  {
    q: 'What if it doesn’t work for us?',
    a: 'That’s what the free audit is for — if we don’t see a clear, worthwhile automation opportunity, we’ll tell you. We scope in focused phases so you can validate results on the first agent before expanding.',
  },
];

// Illustrative demo scenarios — clearly labelled as examples.
export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'dental',
    serviceName: 'AI Calling Agents',
    title: 'Dental clinic front desk',
    stats: [
      { value: '0', label: 'Missed Calls' },
      { value: '24/7', label: 'Booking' },
    ],
    ping: 'Booked a cleaning 4 seconds ago',
  },
  {
    id: 'realestate',
    serviceName: 'Speed-to-Lead Chatbots',
    title: 'Real estate lead routing',
    stats: [
      { value: '~2s', label: 'First Reply' },
      { value: '100%', label: 'Leads Triaged' },
    ],
    ping: 'Routed a hot lead 2 seconds ago',
  },
  {
    id: 'ecommerce',
    serviceName: 'E-commerce AI Chat Agents',
    title: 'Storefront cart recovery',
    stats: [
      { value: '24/7', label: 'On the Store' },
      { value: '3x', label: 'Faster Replies' },
    ],
    ping: 'Recovered a cart 1 second ago',
  },
  {
    id: 'automations',
    serviceName: 'AI Automations',
    title: 'Lead-to-order workflow',
    stats: [
      { value: '0', label: 'Manual Steps' },
      { value: '100%', label: 'Hands-Off' },
    ],
    ping: 'Processed an order just now',
  },
  {
    id: 'content',
    serviceName: 'Content Automation AI Agents',
    title: 'Always-on content engine',
    stats: [
      { value: '5x', label: 'More Output' },
      { value: '1-click', label: 'Approval' },
    ],
    ping: 'Drafted a post 6 seconds ago',
  },
  {
    id: 'web',
    serviceName: 'AI-Connected Web Development',
    title: 'AI-powered storefront',
    stats: [
      { value: 'AI', label: 'Smart Search' },
      { value: '1:1', label: 'Personalized' },
    ],
    ping: 'Personalized a visitor just now',
  },
];

export const PROCESS_STEPS = [
  { n: '01', title: 'Audit', body: 'We map your workflows and find where AI removes the most friction.' },
  { n: '02', title: 'Design', body: 'We design agents and automations around the tools you already use.' },
  { n: '03', title: 'Build', body: 'We build, integrate, and rigorously test every workflow end to end.' },
  { n: '04', title: 'Launch & optimize', body: 'We go live, monitor performance, and keep tuning for results.' },
];

export const VALUES = [
  { title: 'Built around your stack', body: 'We integrate with the tools you already run — no rip-and-replace.' },
  { title: 'Agents that actually work', body: 'Calling, chatting, and working 24/7 — measured on real outcomes.' },
  { title: 'You stay in control', body: 'Human review where it matters. AI handles the busywork, not the judgment.' },
  { title: 'Speed as a feature', body: 'Seconds-fast responses that win leads before competitors reply.' },
];

export const FAQS = [
  {
    q: 'How does your pricing work?',
    a: 'Every engagement is scoped to your workflows, so pricing depends on the agents and automations you need. Book a free automation audit and we will give you a clear, fixed proposal.',
  },
  {
    q: 'How long does a build take?',
    a: 'Most first agents go live within a few weeks. After the audit we share a timeline with clear milestones for design, build, and launch.',
  },
  {
    q: 'Will it work with the tools we already use?',
    a: 'Yes. We build around your existing stack — your CRM, phone system, storefront, and more — so nothing disrupts how your team already works.',
  },
  {
    q: 'What happens when a conversation gets complex?',
    a: 'Agents handle the routine and hand off seamlessly to your team for anything that needs a human, with full context passed along.',
  },
];

export const POSTS: { slug: string; title: string; excerpt: string; date: string }[] = [];
