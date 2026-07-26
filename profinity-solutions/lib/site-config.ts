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

export type CaseStudy = {
  id: string;
  industry: string; // clients stay anonymous — label by industry
  service: string;
  result: string;
  // I will supply real media later. Leave empty to show the branded poster.
  video: string; // TODO: mp4 URL or YouTube embed URL
};

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
  },
  {
    id: 'real-estate-routing',
    industry: 'Real estate — lead routing',
    service: 'Speed-to-Lead Chatbot',
    result: 'New enquiries qualified in seconds and routed to the right agent instantly.',
    video: '', // TODO
  },
  {
    id: 'ecommerce-cart',
    industry: 'E-commerce brand — cart recovery',
    service: 'E-commerce AI Chat Agent',
    result: 'Abandoned carts recovered in real time, turning browsers into buyers.',
    video: '', // TODO
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
