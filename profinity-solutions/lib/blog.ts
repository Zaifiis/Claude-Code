// ── Blog content ───────────────────────────────────────────────────────────
// This is a static site, so posts live here as data and render at build time.
// Add a new entry to POSTS, rebuild, and re-upload — that publishes the post.
// (See the note in README on wiring a dashboard / automation instead.)

export type PostBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'ul'; items: string[] };

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  date: string; // display date
  readingTime: string;
  author: string;
  body: PostBlock[];
};

export const POSTS: Post[] = [
  {
    slug: 'speed-to-lead-highest-roi-automation',
    title: 'Speed-to-lead: the highest-ROI automation most businesses skip',
    excerpt:
      'The business that replies first usually wins the deal. Here’s why speed-to-lead beats almost every other automation you could start with.',
    date: 'Jul 22, 2026',
    readingTime: '4 min read',
    author: 'Profinity Solutions',
    body: [
      {
        type: 'p',
        text: 'Ask most owners what their biggest growth lever is and they’ll point at more traffic, more ads, a better offer. Almost nobody says “reply faster.” Yet the speed of your first response to a new lead is one of the few things that reliably moves your close rate — and it’s usually the cheapest to fix.',
      },
      { type: 'h2', text: 'Why the first reply matters so much' },
      {
        type: 'p',
        text: 'A lead is never more interested than the moment they hit send. Every minute after that, attention drifts, they message a competitor, or life gets in the way. Studies of inbound sales have found that responding within the first few minutes dramatically lifts the odds of ever connecting — and buyers overwhelmingly go with whoever replies first.',
      },
      {
        type: 'p',
        text: 'The problem is that “within a few minutes” is nearly impossible for a human team to sustain. People are on calls, at lunch, asleep. So leads sit. And the ones that sit, cool.',
      },
      { type: 'h2', text: 'What an instant-response setup actually does' },
      {
        type: 'ul',
        items: [
          'Replies the second a form is submitted or a message lands — not an autoresponder, a real, relevant first message.',
          'Asks a few qualifying questions to sort serious buyers from tyre-kickers.',
          'Routes the hot leads straight to whoever closes, with the context attached.',
          'Books the meeting on the spot when the lead is ready.',
        ],
      },
      { type: 'h2', text: 'The math is hard to argue with' },
      {
        type: 'p',
        text: 'Say you get 200 leads a month, close 20% of the ones you actually reach, and each customer is worth $900. If slow replies mean you’re effectively missing a third of them, that’s not a rounding error — it’s tens of thousands of dollars a year walking out the door. Instant response doesn’t create new leads; it stops you from wasting the ones you already paid for.',
      },
      { type: 'h2', text: 'Where to start' },
      {
        type: 'p',
        text: 'You don’t need to automate everything at once. Start where the money is leaking fastest — usually the gap between “lead arrives” and “someone replies.” Close that gap and you’ll often see the impact in the first month. From there, the same plumbing extends to missed calls, follow-ups, and re-engagement.',
      },
    ],
  },
  {
    slug: 'ai-calling-agents-vs-receptionist',
    title: 'AI calling agents vs. a receptionist: what actually changes',
    excerpt:
      'A voice agent isn’t here to replace your team — it’s here to make sure no call ever goes unanswered. Here’s the honest comparison.',
    date: 'Jul 18, 2026',
    readingTime: '5 min read',
    author: 'Profinity Solutions',
    body: [
      {
        type: 'p',
        text: 'The phrase “AI calling agent” makes some people picture a robotic voice reading a script. The good ones are nothing like that. They answer in a natural voice, understand what the caller wants, and get things done — booking, qualifying, answering the questions you field a hundred times a week. So how do they really compare to hiring another front-desk person?',
      },
      { type: 'h2', text: 'Coverage' },
      {
        type: 'p',
        text: 'A receptionist works set hours and can take one call at a time. A voice agent answers on the first ring at 2pm or 2am, and it can handle many calls at once. For any business where after-hours or lunch-rush calls quietly become lost customers, that difference alone often pays for the whole thing.',
      },
      { type: 'h2', text: 'Consistency' },
      {
        type: 'p',
        text: 'People have good days and bad days. An agent asks the same qualifying questions, follows the same booking flow, and never forgets to capture a phone number. It’s not better than your best person on their best day — it’s better than the average of a busy team over a whole month.',
      },
      { type: 'h2', text: 'What it should NOT do' },
      {
        type: 'p',
        text: 'This is the part that matters. A well-built agent is scoped to what it’s good at and hands everything else to a human — with the full context attached, so the caller never has to repeat themselves.',
      },
      {
        type: 'ul',
        items: [
          'Routine, repeatable calls: the agent handles them end to end.',
          'Judgment, empathy, negotiation, edge cases: straight to your team.',
          'Anything outside its knowledge: escalated, never guessed.',
        ],
      },
      { type: 'h2', text: 'So do you still need people?' },
      {
        type: 'p',
        text: 'Yes — for the work only people should do. The agent takes the repetitive load off the front desk so your team spends their time on relationships and closing, not on being a human answering machine. The goal isn’t fewer people; it’s zero missed calls and a team that isn’t drowning in the phone.',
      },
    ],
  },
  {
    slug: 'where-to-start-with-ai-automation',
    title: 'Where to start with AI automation: a simple 4-step playbook',
    excerpt:
      '“Automate everything” is how projects stall. Here’s the focused, low-risk way to get your first AI win in weeks, not quarters.',
    date: 'Jul 12, 2026',
    readingTime: '4 min read',
    author: 'Profinity Solutions',
    body: [
      {
        type: 'p',
        text: 'The fastest way to get nowhere with AI is to try to automate everything at once. The teams that win pick one painful, repeatable process, prove it, and expand from there. Here’s the playbook we use.',
      },
      { type: 'h2', text: '1. Find the leak, not the shiny object' },
      {
        type: 'p',
        text: 'Don’t start with the coolest use case — start with the most expensive problem. Where are you losing money or hours right now? Missed calls? Slow lead replies? Hours lost to copy-paste busywork? Follow the pain, not the hype.',
      },
      { type: 'h2', text: '2. Scope it small' },
      {
        type: 'p',
        text: 'Pick one workflow with a clear start and end — “every new lead gets qualified and routed in under a minute,” for example. A tight scope is easy to build, easy to measure, and easy to trust before you expand.',
      },
      { type: 'h2', text: '3. Build around the tools you already use' },
      {
        type: 'p',
        text: 'The best automation is invisible. It should plug into your CRM, calendar, phone system, and storefront — not force your team onto a new platform. If a tool has an API, it can almost certainly be wired in.',
      },
      { type: 'h2', text: '4. Launch, measure, then expand' },
      {
        type: 'ul',
        items: [
          'Go live on the one workflow and watch real numbers, not vibes.',
          'Tune it for a couple of weeks until it’s boringly reliable.',
          'Only then add the next workflow — using the same plumbing.',
        ],
      },
      {
        type: 'p',
        text: 'Do this and your first agent usually pays for itself before you’ve built the second. Momentum comes from a proven win, not a grand plan.',
      },
    ],
  },
];
