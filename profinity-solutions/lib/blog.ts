// ── Blog content ───────────────────────────────────────────────────────────
// Each post is a plain-English CASE STUDY for one service: an anonymous client
// had a problem, here's how we fixed it, how it works (a simple flow chart), and
// the money math in numbers a non-technical owner can follow. This is a static
// site, so posts live here as data and render at build time — add an entry,
// rebuild, and re-upload to publish.

import type { LucideIcon } from 'lucide-react';
import {
  ClipboardList,
  Bot,
  Users,
  MessageSquare,
  FileText,
  PhoneIncoming,
  PhoneCall,
  UserCheck,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  Zap,
  Send,
  Route,
  ShoppingCart,
  Search,
  Rocket,
  ClipboardCheck,
  Sparkles,
} from 'lucide-react';

export type FlowStep = { icon: LucideIcon; title: string; desc: string };

export type PostBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'callout'; variant: 'problem' | 'result'; label: string; text: string }
  | { type: 'flow'; steps: FlowStep[] }
  | {
      type: 'calc';
      title: string;
      rows: { label: string; value: string }[];
      result: { label: string; value: number; prefix?: string; suffix?: string };
    };

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readingTime: string;
  author: string;
  service: string; // service name
  serviceSlug: string; // /services/<slug>
  industry: string;
  body: PostBlock[];
};

export const POSTS: Post[] = [
  // 1 ── AI Automations ─────────────────────────────────────────────────────
  {
    slug: 'home-services-automation-case-study',
    title: 'How a home-services company got 15 hours a week back',
    excerpt:
      'A busy plumbing team was drowning in manual job entry. We wired their tools together so the busywork runs itself — here’s exactly how, in plain numbers.',
    date: 'Jul 22, 2026',
    readingTime: '4 min read',
    author: 'Profinity Solutions',
    service: 'AI Automations',
    serviceSlug: 'ai-automations',
    industry: 'Home services',
    body: [
      {
        type: 'callout',
        variant: 'problem',
        label: 'The client',
        text: 'A home-services company (plumbing and heating) booking dozens of jobs a week. Every job was typed in by hand, twice — once from the phone, once into the schedule.',
      },
      {
        type: 'p',
        text: 'The office manager was spending half her day copying details between a booking form, a spreadsheet, and the calendar. Jobs slipped through. Customers weren’t told who was coming. Invoices went out late — or not at all.',
      },
      { type: 'h2', text: 'What we did' },
      {
        type: 'p',
        text: 'We connected the tools they already used and put an automation in the middle. No new software to learn — the same booking form, the same calendar, just no more typing things twice.',
      },
      { type: 'h2', text: 'How it works' },
      {
        type: 'flow',
        steps: [
          { icon: ClipboardList, title: 'Job request comes in', desc: 'A customer books online or a lead form is filled.' },
          { icon: Bot, title: 'Details captured', desc: 'The job is logged automatically — no copy-paste, no typos.' },
          { icon: Users, title: 'Right tech assigned', desc: 'It picks who’s free and nearest, and adds it to their day.' },
          { icon: MessageSquare, title: 'Customer gets a text', desc: 'An instant confirmation with the time and who’s coming.' },
          { icon: FileText, title: 'Invoice sent', desc: 'After the job, the invoice goes out on its own.' },
        ],
      },
      { type: 'h2', text: 'The math, in plain numbers' },
      {
        type: 'p',
        text: 'She was spending about 15 hours a week on this. Staff time costs roughly $18 an hour. So every week that’s 15 × $18 = $270. Over a year, that’s 52 weeks of it.',
      },
      {
        type: 'calc',
        title: 'The time this gives back',
        rows: [
          { label: 'Hours spent on this by hand, each week', value: '15 hrs' },
          { label: 'What an hour of staff time costs', value: '$18' },
          { label: 'Cost each week (15 × $18)', value: '$270' },
          { label: 'Weeks in a year', value: '52' },
        ],
        result: { label: 'Saved every year', value: 14040, prefix: '$' },
      },
      {
        type: 'callout',
        variant: 'result',
        label: 'The result',
        text: 'About $14,000 a year back — and no more jobs slipping through the cracks. The office manager now spends that time on customers instead of copy-paste.',
      },
      {
        type: 'p',
        text: 'That’s the whole idea behind AI Automations: find the work nobody should be doing by hand, and let it run in the background.',
      },
    ],
  },

  // 2 ── AI Calling Agents ──────────────────────────────────────────────────
  {
    slug: 'dental-clinic-calling-agent-case-study',
    title: 'How a dental clinic stopped losing after-hours bookings',
    excerpt:
      'Nearly a third of this clinic’s calls went to voicemail — and voicemail doesn’t book appointments. A voice agent that never sleeps fixed it. Here’s the math.',
    date: 'Jul 18, 2026',
    readingTime: '4 min read',
    author: 'Profinity Solutions',
    service: 'AI Calling Agents',
    serviceSlug: 'ai-calling-agents',
    industry: 'Dental clinic',
    body: [
      {
        type: 'callout',
        variant: 'problem',
        label: 'The client',
        text: 'A single-location dental clinic. The front desk is busy during the day and closed in the evening — so a lot of people who called to book never got through.',
      },
      {
        type: 'p',
        text: 'When someone wants a dentist, they call the next one on the list if nobody answers. Every missed call was a patient booked somewhere else.',
      },
      { type: 'h2', text: 'What we did' },
      {
        type: 'p',
        text: 'We gave them an AI calling agent that answers every call in a natural voice — during the lunch rush, after hours, whenever the desk can’t pick up. It books straight into their existing calendar.',
      },
      { type: 'h2', text: 'How it works' },
      {
        type: 'flow',
        steps: [
          { icon: PhoneIncoming, title: 'Phone rings', desc: 'Someone calls to book — even at 9pm.' },
          { icon: PhoneCall, title: 'The agent answers', desc: 'A friendly voice picks up on the first ring.' },
          { icon: UserCheck, title: 'It asks the basics', desc: 'New or existing patient? What do they need?' },
          { icon: CalendarCheck, title: 'It books them in', desc: 'Reads the calendar and offers real open slots.' },
          { icon: CheckCircle2, title: 'Confirmation sent', desc: 'The patient gets a text with the details.' },
        ],
      },
      { type: 'h2', text: 'The math, in plain numbers' },
      {
        type: 'p',
        text: 'The clinic gets about 200 calls a month. Roughly 30 out of every 100 were missed — that’s 60 calls. If even 24 of those people would have booked, and one booking is worth about $150, look what was slipping away:',
      },
      {
        type: 'calc',
        title: 'The bookings this saves',
        rows: [
          { label: 'Calls the clinic gets each month', value: '200' },
          { label: 'Calls missed before (about 30%)', value: '60' },
          { label: 'Of those, how many would book', value: '24' },
          { label: 'What one booking is worth', value: '$150' },
        ],
        result: { label: 'Recovered each month', value: 3600, prefix: '$' },
      },
      {
        type: 'callout',
        variant: 'result',
        label: 'The result',
        text: 'About $3,600 a month that used to go to voicemail — now booked. And the front desk isn’t glued to the phone during patient visits.',
      },
      {
        type: 'p',
        text: 'A calling agent doesn’t replace the team. It just makes sure no call — and no patient — ever gets missed.',
      },
    ],
  },

  // 3 ── Instant Lead Response ──────────────────────────────────────────────
  {
    slug: 'real-estate-instant-lead-response-case-study',
    title: 'How a real-estate team won 6 more deals a month by replying first',
    excerpt:
      'Leads were sitting for hours before an agent saw them. We made the reply happen in seconds — and the close rate climbed. Here’s the simple math.',
    date: 'Jul 14, 2026',
    readingTime: '4 min read',
    author: 'Profinity Solutions',
    service: 'Instant Lead Response',
    serviceSlug: 'instant-lead-response',
    industry: 'Real estate',
    body: [
      {
        type: 'callout',
        variant: 'problem',
        label: 'The client',
        text: 'A real-estate team getting plenty of enquiries from listing sites — but agents were out showing homes, so replies took hours. By then, buyers had moved on.',
      },
      {
        type: 'p',
        text: 'In real estate, the first agent to reply usually gets the conversation. Waiting an hour means someone else already answered.',
      },
      { type: 'h2', text: 'What we did' },
      {
        type: 'p',
        text: 'We set up an instant-response system. The moment a lead comes in, it replies in seconds, asks a couple of simple questions, and hands the hot ones straight to an available agent.',
      },
      { type: 'h2', text: 'How it works' },
      {
        type: 'flow',
        steps: [
          { icon: Zap, title: 'A new lead arrives', desc: 'They fill in a form on a listing.' },
          { icon: Send, title: 'Reply in seconds', desc: 'They get a real answer before they cool off.' },
          { icon: UserCheck, title: 'Quick qualifying', desc: 'Budget, area, timeline — a few smart questions.' },
          { icon: Route, title: 'Sent to the right agent', desc: 'Hot leads land with whoever can talk now.' },
        ],
      },
      { type: 'h2', text: 'The math, in plain numbers' },
      {
        type: 'p',
        text: 'They get about 150 leads a month. Before, they closed roughly 8 out of every 100 — that’s 12 deals. Replying first lifted that to about 12 out of 100 — that’s 18 deals. Same leads, 6 more closings.',
      },
      {
        type: 'calc',
        title: 'The extra deals this wins',
        rows: [
          { label: 'New leads each month', value: '150' },
          { label: 'Deals closed before (8 in 100)', value: '12' },
          { label: 'Deals closed after replying first (12 in 100)', value: '18' },
        ],
        result: { label: 'Extra closed deals / month', value: 6, prefix: '+' },
      },
      {
        type: 'callout',
        variant: 'result',
        label: 'The result',
        text: '6 more deals a month from leads they already had — just by being the first to reply. In real estate, that pays for itself many times over.',
      },
      {
        type: 'p',
        text: 'Speed is the cheapest advantage you can buy. Instant Lead Response makes sure you always have it.',
      },
    ],
  },

  // 4 ── Ecommerce Chat Agents ──────────────────────────────────────────────
  {
    slug: 'ecommerce-chat-agent-case-study',
    title: 'How an online store brought back $6,000 in carts a month',
    excerpt:
      'Most shoppers leave without buying. A chat agent that answers questions and rescues carts turned some of them back into customers — no new hires. Here’s how.',
    date: 'Jul 10, 2026',
    readingTime: '4 min read',
    author: 'Profinity Solutions',
    service: 'Ecommerce Chat Agents',
    serviceSlug: 'ecommerce-chat-agents',
    industry: 'E-commerce',
    body: [
      {
        type: 'callout',
        variant: 'problem',
        label: 'The client',
        text: 'An online store with steady traffic but a lot of abandoned carts. Shoppers had questions at checkout and nobody was there to answer — especially at night.',
      },
      {
        type: 'p',
        text: 'A shopper with a question and no answer doesn’t wait. They close the tab. That’s a sale that was almost made, gone.',
      },
      { type: 'h2', text: 'What we did' },
      {
        type: 'p',
        text: 'We added a chat agent that lives on the storefront. It answers product questions instantly, suggests the right item, and steps in when someone’s about to leave with a full cart.',
      },
      { type: 'h2', text: 'How it works' },
      {
        type: 'flow',
        steps: [
          { icon: MessageSquare, title: 'Shopper has a question', desc: 'Size, shipping, “will this work for me?”' },
          { icon: Bot, title: 'Answered instantly', desc: 'Right on the page, day or night.' },
          { icon: ShoppingCart, title: 'Nudged to buy', desc: 'A helpful recommendation moves them along.' },
          { icon: CheckCircle2, title: 'Cart recovered', desc: 'About to leave? It steps in to bring them back.' },
        ],
      },
      { type: 'h2', text: 'The math, in plain numbers' },
      {
        type: 'p',
        text: 'About 1,000 carts a month were being left behind. The agent brings back roughly 10 out of every 100 — that’s 100 carts. With an average order of $60, that adds up fast.',
      },
      {
        type: 'calc',
        title: 'The sales this brings back',
        rows: [
          { label: 'Carts left behind each month', value: '1,000' },
          { label: 'How many it brings back (10%)', value: '100' },
          { label: 'Average order value', value: '$60' },
        ],
        result: { label: 'Recovered each month', value: 6000, prefix: '$' },
      },
      {
        type: 'callout',
        variant: 'result',
        label: 'The result',
        text: 'Around $6,000 a month in sales that were walking out the door — recovered automatically, without adding a single person to support.',
      },
      {
        type: 'p',
        text: 'An Ecommerce Chat Agent works the night shift you can’t staff, and turns browsers into buyers.',
      },
    ],
  },

  // 5 ── Content on Autopilot ───────────────────────────────────────────────
  {
    slug: 'med-spa-content-autopilot-case-study',
    title: 'How a med spa kept posting without spending a single afternoon on it',
    excerpt:
      'Great service, quiet feed. This med spa never had time to post. We put content on autopilot — they just approve. Here’s the time it handed back.',
    date: 'Jul 6, 2026',
    readingTime: '3 min read',
    author: 'Profinity Solutions',
    service: 'Content on Autopilot',
    serviceSlug: 'content-on-autopilot',
    industry: 'Med spa',
    body: [
      {
        type: 'callout',
        variant: 'problem',
        label: 'The client',
        text: 'A med spa with happy clients but a silent social feed. Posting always lost to running the business, so it just… didn’t happen.',
      },
      {
        type: 'p',
        text: 'When the feed goes quiet, new clients wonder if you’re still busy. Staying visible matters — but nobody had a spare afternoon to write.',
      },
      { type: 'h2', text: 'What we did' },
      {
        type: 'p',
        text: 'We set up a content agent that does the heavy lifting — research, drafting, and scheduling — and leaves the owner one easy job: a quick yes or no.',
      },
      { type: 'h2', text: 'How it works' },
      {
        type: 'flow',
        steps: [
          { icon: Search, title: 'Finds topics', desc: 'It spots what your audience actually cares about.' },
          { icon: FileText, title: 'Writes the draft', desc: 'A ready-to-review post in your voice.' },
          { icon: CheckCircle2, title: 'You approve', desc: 'One look, one tap — you stay in control.' },
          { icon: CalendarClock, title: 'Schedules it', desc: 'Posts go out across the blog and socials on time.' },
        ],
      },
      { type: 'h2', text: 'The math, in plain numbers' },
      {
        type: 'p',
        text: 'They wanted about 12 posts a month. Each used to take around 2 hours to research and write — that’s 24 hours. At $25 an hour of someone’s time, that’s real money and a whole lot of afternoons.',
      },
      {
        type: 'calc',
        title: 'The time this hands back',
        rows: [
          { label: 'Posts published each month', value: '12' },
          { label: 'Hours each post used to take', value: '2 hrs' },
          { label: 'Hours saved (12 × 2)', value: '24 hrs' },
          { label: 'What an hour is worth', value: '$25' },
        ],
        result: { label: 'Time saved / month', value: 600, prefix: '$' },
      },
      {
        type: 'callout',
        variant: 'result',
        label: 'The result',
        text: 'A feed that never goes quiet, 24 hours a month handed back, and the owner still has the final say on every post.',
      },
      {
        type: 'p',
        text: 'Content on Autopilot keeps you visible without stealing your time.',
      },
    ],
  },

  // 6 ── AI Ready Websites ──────────────────────────────────────────────────
  {
    slug: 'ai-ready-website-case-study',
    title: 'How a new website turned twice as many visitors into leads',
    excerpt:
      'Same traffic, an old site that just sat there. We rebuilt it with AI in the back end — smart forms, better search — and the leads doubled. Here’s the math.',
    date: 'Jul 2, 2026',
    readingTime: '4 min read',
    author: 'Profinity Solutions',
    service: 'AI Ready Websites',
    serviceSlug: 'ai-ready-websites',
    industry: 'Service business',
    body: [
      {
        type: 'callout',
        variant: 'problem',
        label: 'The client',
        text: 'A service business with a slow, dated website. Plenty of people visited, but very few ever got in touch. The site looked fine — it just didn’t do anything.',
      },
      {
        type: 'p',
        text: 'A website that only sits there is a brochure. It should be helping visitors find what they need and turning them into enquiries.',
      },
      { type: 'h2', text: 'What we did' },
      {
        type: 'p',
        text: 'We built a fast, modern site with AI wired into the back end — forms that qualify as people fill them in, search that understands plain questions, and pages that adapt to each visitor.',
      },
      { type: 'h2', text: 'How it works' },
      {
        type: 'flow',
        steps: [
          { icon: Rocket, title: 'A fast, modern site', desc: 'Loads quickly and looks right on any device.' },
          { icon: ClipboardCheck, title: 'Smart forms', desc: 'They qualify visitors as they type.' },
          { icon: Search, title: 'AI search', desc: 'Visitors find the right page by asking in plain words.' },
          { icon: Sparkles, title: 'Personalized pages', desc: 'The site adapts to who’s looking.' },
        ],
      },
      { type: 'h2', text: 'The math, in plain numbers' },
      {
        type: 'p',
        text: 'About 2,000 people visited each month. The old site turned 1 in 100 into a lead — that’s 20. The new one turns about 2.5 in 100 into a lead — that’s 50. With each lead worth around $100, the difference is big.',
      },
      {
        type: 'calc',
        title: 'The leads this adds',
        rows: [
          { label: 'Visitors each month', value: '2,000' },
          { label: 'Turned into leads before (1%)', value: '20' },
          { label: 'Turned into leads after (2.5%)', value: '50' },
          { label: 'What one lead is worth', value: '$100' },
        ],
        result: { label: 'Extra value / month', value: 3000, prefix: '$' },
      },
      {
        type: 'callout',
        variant: 'result',
        label: 'The result',
        text: '30 more leads a month — about $3,000 in value — from the exact same traffic. The site finally works as hard as the team does.',
      },
      {
        type: 'p',
        text: 'An AI Ready Website doesn’t just look modern. It quietly sells for you, around the clock.',
      },
    ],
  },
];
