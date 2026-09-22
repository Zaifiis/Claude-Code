<?php
/**
 * ════════════════════════════════════════════════════════════════════════════
 *  ALL SITE COPY LIVES HERE.
 *
 *  This is the one file you edit to make the site yours — services, prices,
 *  process, FAQ, build notes, audit questions. No HTML, no database: change a
 *  string, reload the page.
 *
 *  Before you launch, read the three notes marked  ▸ EDIT ME  below.
 * ════════════════════════════════════════════════════════════════════════════
 */
declare(strict_types=1);

/** The services grid on the home page and /services. */
function services(): array
{
    return [
        'content-engine' => [
            'name'    => 'Content Engine',
            'icon'    => 'broadcast',
            'summary' => 'A pipeline that turns the work you already do into publishable posts — drafted, queued for your approval, and posted on schedule.',
            'points'  => [
                'Daily drafts generated from your actual work, not generic prompts',
                'An approval queue so nothing publishes without your say-so',
                'Scheduling and posting across LinkedIn, X, Instagram and Facebook',
                'A calendar view of what went out and what is coming',
            ],
            'best_for' => 'Founders and agencies who know they should be posting daily and never do.',
        ],
        'ai-agents' => [
            'name'    => 'Custom AI Agents',
            'icon'    => 'spark',
            'summary' => 'Agents built for one job in your business, wired into the tools you already pay for.',
            'points'  => [
                'Research, summarise, draft, triage, classify — pick the job',
                'Runs on a schedule or on a trigger, with a human checkpoint where it matters',
                'Connected to your inbox, CRM, docs and database',
                'Written down and handed over, not locked in a black box',
            ],
            'best_for' => 'Teams with one repetitive, judgement-light task eating hours a week.',
        ],
        'workflow-automation' => [
            'name'    => 'Workflow Automation',
            'icon'    => 'flow',
            'summary' => 'The plumbing between your tools, built properly: retries, logging and alerts, not a fragile chain of zaps.',
            'points'  => [
                'n8n or your existing stack — self-hosted or managed',
                'Error handling and alerting so silent failures stop being a thing',
                'Onboarding, invoicing, reporting, handoffs, data sync',
                'Documented so your team can change it without calling us',
            ],
            'best_for' => 'Operations that live in spreadsheets and copy-paste.',
        ],
        'inbox-crm' => [
            'name'    => 'Inbox & CRM Automation',
            'icon'    => 'inbox',
            'summary' => 'Enquiries captured, enriched, scored, routed and followed up without anybody remembering to do it.',
            'points'  => [
                'Every lead lands in one place with its source attached',
                'Automatic enrichment and qualification scoring',
                'Follow-up sequences that stop the moment someone replies',
                'Clean handoff into your CRM of choice',
            ],
            'best_for' => 'Anyone losing deals to a slow first response.',
        ],
        'reporting' => [
            'name'    => 'Reporting & Dashboards',
            'icon'    => 'chart',
            'summary' => 'One dashboard your team actually opens, fed automatically from the systems that hold the numbers.',
            'points'  => [
                'Pulled from your database, ad platforms and tools on a schedule',
                'Weekly digest in your inbox, no login required',
                'Alerts when a number moves further than it should',
                'Built on your own data — you keep it',
            ],
            'best_for' => 'Leaders assembling the same report by hand every Monday.',
        ],
    ];
}

/** How an engagement actually runs — the /services process section. */
function process_steps(): array
{
    return [
        [
            'step'  => '01',
            'name'  => 'Audit',
            'time'  => 'Week 1',
            'body'  => 'We map where your hours go: every recurring task, who does it, how long it takes, what it touches. You get the map whether or not you hire us.',
        ],
        [
            'step'  => '02',
            'name'  => 'Blueprint',
            'time'  => 'Week 1–2',
            'body'  => 'We pick the two or three automations with the best hours-saved-to-effort ratio and write down exactly what gets built, what it costs to run, and how we will know it worked.',
        ],
        [
            'step'  => '03',
            'name'  => 'Build',
            'time'  => 'Week 2–5',
            'body'  => 'We build in short cycles with something working at the end of each one. You see it running on your real data before it handles anything that matters.',
        ],
        [
            'step'  => '04',
            'name'  => 'Handover',
            'time'  => 'Ongoing',
            'body'  => 'Documentation, a walkthrough with your team, and monitoring so failures page us, not you. Keep us on retainer or take the keys — both are fine.',
        ],
    ];
}

/**
 * ▸ EDIT ME (1/3) — Build notes.
 *
 * These describe systems and architectures rather than naming clients or
 * quoting numbers, because inventing client results is the fastest way to lose
 * a deal in the room. Replace them with your own work as you ship it, and add
 * real figures once you have a client who has agreed to be quoted.
 */
function build_notes(): array
{
    return [
        [
            'slug'    => 'content-engine',
            'title'   => 'A content engine that runs on your own work',
            'label'   => 'In-house build',
            'problem' => 'Posting consistently on LinkedIn means sitting down every day to write, and the day always wins. The content that would prove competence never gets published.',
            'build'   => 'An agent reads the day’s actual work, drafts a post in the founder’s voice, and files it into an approval queue. Nothing publishes on its own — a human approves or rejects from a phone, and a scheduled workflow posts what was approved and marks it done.',
            'stack'   => ['n8n', 'Postgres', 'Next.js', 'Claude', 'LinkedIn API'],
            'result'  => 'Drafting a daily post drops from a blank-page hour to a thirty-second review. The queue makes the backlog visible, so a missed day is obvious instead of invisible.',
        ],
        [
            'slug'    => 'lead-desk',
            'title'   => 'One desk for every inbound enquiry',
            'label'   => 'Template build',
            'problem' => 'Enquiries arrive across a web form, a personal inbox and DMs. Nobody knows which are new, response times slip past the day that matters, and attribution is guesswork.',
            'build'   => 'Every channel writes into one table with its source and campaign attached. New enquiries score themselves on fit, notify the right person immediately, and enter a follow-up sequence that stops the moment a human replies.',
            'stack'   => ['PHP', 'MySQL', 'SMTP', 'n8n'],
            'result'  => 'First response stops depending on who happens to be looking at their phone, and the source of each closed deal is a field rather than a memory.',
        ],
        [
            'slug'    => 'ops-reporting',
            'title'   => 'The Monday report, assembled overnight',
            'label'   => 'Template build',
            'problem' => 'A weekly report pulled by hand from four tools: hours of copy-paste, stale by the time it is read, and quietly skipped whenever the week gets busy.',
            'build'   => 'A scheduled workflow pulls each source into one store overnight, reconciles the numbers, and renders a dashboard plus an emailed digest. Threshold alerts fire when a metric moves further than it should.',
            'stack'   => ['n8n', 'Postgres', 'Scheduled jobs'],
            'result'  => 'The report is waiting before the week starts, and the alerting catches the outliers that a weekly cadence used to hide for six days.',
        ],
    ];
}

/**
 * ▸ EDIT ME (2/3) — Testimonials.
 *
 * Deliberately empty. The section does not render until there is something
 * real in here, because a fabricated quote on a site that sells trust is a
 * liability. Add entries only with the client's permission, e.g.:
 *
 *   ['quote' => '…', 'name' => 'Jane Doe', 'role' => 'COO, Acme']
 */
function testimonials(): array
{
    return [];
}

/**
 * ▸ EDIT ME (3/3) — Pricing.
 *
 * Set your real numbers and what each tier includes. `price` is displayed
 * verbatim, so "From £4,800" or "Custom" both work.
 */
function pricing_tiers(): array
{
    return [
        [
            'name'     => 'Audit',
            'price'    => 'Free',
            'cadence'  => '45 minutes',
            'pitch'    => 'A map of where your hours go and what is worth automating first.',
            'features' => [
                'Walkthrough of your current process',
                'Shortlist of automations ranked by hours saved',
                'Rough build effort and running cost for each',
                'The written map is yours either way',
            ],
            'cta'      => ['label' => 'Book the audit', 'href' => '/audit'],
            'featured' => false,
        ],
        [
            'name'     => 'Build Sprint',
            'price'    => 'From £4,800',
            'cadence'  => 'one-off, 3–5 weeks',
            'pitch'    => 'One system, built, tested on your real data, documented and handed over.',
            'features' => [
                'Blueprint signed off before a line is written',
                'Weekly working demo, not a status email',
                'Error handling, logging and alerting included',
                'Documentation and a team walkthrough',
                '30 days of support after handover',
            ],
            'cta'      => ['label' => 'Scope a sprint', 'href' => '/contact'],
            'featured' => true,
        ],
        [
            'name'     => 'Automation Partner',
            'price'    => 'From £2,400',
            'cadence'  => 'per month',
            'pitch'    => 'We keep building and keep it running. For teams with a queue rather than one project.',
            'features' => [
                'A standing build queue you set the priorities on',
                'Monitoring and fixes on everything we run for you',
                'Monthly review against the hours-saved number',
                'Direct line for the fire drills',
                'Pause any month, cancel any time',
            ],
            'cta'      => ['label' => 'Talk it through', 'href' => '/contact'],
            'featured' => false,
        ],
    ];
}

function faqs(): array
{
    return [
        [
            'q' => 'How fast does something actually go live?',
            'a' => 'First automation live inside three to five weeks from the blueprint sign-off, and you see it running on your data well before that. If a project cannot show something working in week two, it is scoped wrong and we will say so.',
        ],
        [
            'q' => 'Do we need to move off the tools we already use?',
            'a' => 'No. Almost everything we build wires into what you already pay for. Replacing a tool is a decision with its own cost — we only raise it when the integration is genuinely the thing standing in your way.',
        ],
        [
            'q' => 'What happens if it breaks at 2am?',
            'a' => 'Every workflow ships with error handling and alerting, and the alert comes to us. On a retainer we fix it; after a handover you have documentation and the alerting to catch it yourself.',
        ],
        [
            'q' => 'Who owns what you build?',
            'a' => 'You do — code, workflows, data, credentials. It runs in your accounts on your infrastructure. There is no version of this where leaving us means losing the system.',
        ],
        [
            'q' => 'Is our data used to train a model?',
            'a' => 'No. We use commercial API endpoints that do not train on submitted data, and we keep what gets sent to a model down to what the task actually needs. Anything sensitive stays on your side of the line.',
        ],
        [
            'q' => 'Will this replace people on our team?',
            'a' => 'The work we take on is the work nobody wanted: copy-paste, reformatting, chasing, reporting. The jobs worth keeping are the judgement ones, and those stay with humans — usually with a checkpoint we build in on purpose.',
        ],
        [
            'q' => 'What does it cost to run once it is built?',
            'a' => 'Usually tens rather than hundreds per month — model usage plus a small server. You get the estimate in the blueprint before anything gets built, and we design around it when the numbers look wrong.',
        ],
        [
            'q' => 'We are not technical. Is that a problem?',
            'a' => 'No, and you do not need to become technical. You need to be able to describe how the work happens today. We handle the rest and write it down in language your team can actually use.',
        ],
    ];
}

/** Checkbox options on the automation-audit form (/audit). */
function audit_tasks(): array
{
    return [
        'content'    => 'Writing and posting content',
        'leads'      => 'Chasing and qualifying leads',
        'onboarding' => 'Onboarding new clients or staff',
        'reporting'  => 'Building the same report every week',
        'data-entry' => 'Moving data between tools by hand',
        'inbox'      => 'Sorting and replying to the inbox',
        'invoicing'  => 'Invoicing, chasing and reconciling',
        'scheduling' => 'Scheduling and rescheduling meetings',
        'research'   => 'Research and summarising documents',
        'support'    => 'Answering the same support questions',
    ];
}

function team_sizes(): array
{
    return ['just-me' => 'Just me', '2-10' => '2–10', '11-50' => '11–50', '51-200' => '51–200', '200+' => '200+'];
}

function budgets(): array
{
    return [
        'exploring'  => 'Still exploring',
        'under-5k'   => 'Under £5k',
        '5k-15k'     => '£5k – £15k',
        '15k-50k'    => '£15k – £50k',
        '50k-plus'   => '£50k+',
    ];
}

function timelines(): array
{
    return [
        'asap'      => 'As soon as possible',
        '1-month'   => 'Within a month',
        'quarter'   => 'This quarter',
        'exploring' => 'No date yet',
    ];
}
