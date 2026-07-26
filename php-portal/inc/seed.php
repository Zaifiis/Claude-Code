<?php
/**
 * First-run seed: creates the owner account and a realistic set of references,
 * content items (spread across every pipeline stage), tags and metrics so the
 * portal is populated the moment it loads. Runs once, only when users is empty.
 */

function seed_database(PDO $pdo, array $cfg): void
{
    $pdo->beginTransaction();

    $userId = uuid();
    $hash = password_hash($cfg['default_password'], PASSWORD_DEFAULT);
    $pdo->prepare('INSERT INTO users (id, name, email, password_hash, created_at) VALUES (?,?,?,?,?)')
        ->execute([$userId, $cfg['owner_name'], $cfg['owner_email'], $hash, now_sql()]);

    $daysAgo   = fn(int $n) => date('Y-m-d H:i:s', strtotime("-$n days"));
    $daysAhead = fn(int $n, int $h = 9) => date('Y-m-d H:i:s', strtotime("+$n days " . sprintf('%02d:00:00', $h)));
    $thisMonth = fn(int $day, int $h = 10) => date('Y-m-d H:i:s', strtotime(date('Y-m-') . sprintf('%02d %02d:00:00', $day, $h)));

    // --- Tag helper: get-or-create by name, returns id ---------------------
    $tagCache = [];
    $tag = function (string $name) use ($pdo, &$tagCache): string {
        $name = trim($name);
        if (isset($tagCache[$name])) {
            return $tagCache[$name];
        }
        $stmt = $pdo->prepare('SELECT id FROM tags WHERE name = ?');
        $stmt->execute([$name]);
        $id = $stmt->fetchColumn();
        if (!$id) {
            $id = uuid();
            $pdo->prepare('INSERT INTO tags (id, name, created_at) VALUES (?,?,?)')
                ->execute([$id, $name, now_sql()]);
        }
        return $tagCache[$name] = $id;
    };

    // --- References --------------------------------------------------------
    $references = [
        ['url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'title' => 'Storytelling structure that keeps retention high', 'notes' => 'The 3-act mini structure at 2:14 is gold for short-form hooks.', 'tags' => ['retention', 'storytelling']],
        ['url' => 'https://youtu.be/aqz-KE-bpKQ', 'title' => 'How this creator scripts a 60-second explainer', 'notes' => 'Great pacing reference — one idea per sentence.', 'tags' => ['scripting', 'shorts']],
        ['url' => 'https://www.youtube.com/shorts/5qap5aO4i9A', 'title' => 'Pattern interrupt in the first 2 seconds', 'notes' => '', 'tags' => ['hooks', 'shorts']],
        ['url' => 'https://www.linkedin.com/posts/example_ai-automation-activity-123456789', 'title' => 'Contrarian take on AI tools that went viral', 'notes' => 'Opening line does the heavy lifting. Note the whitespace formatting.', 'tags' => ['linkedin', 'hooks']],
        ['url' => 'https://www.instagram.com/reel/CxYzAbCdEfG/', 'title' => 'Restaurant automation reel — clean B-roll', 'notes' => 'Reference for the voice-agent demo visuals.', 'tags' => ['reels', 'b-roll']],
        ['url' => 'https://x.com/example/status/1780000000000000000', 'title' => 'Thread: lead follow-up that closes deals', 'notes' => '', 'tags' => ['threads', 'leads']],
        ['url' => 'https://www.tiktok.com/@creator/video/7300000000000000000', 'title' => 'Fast-cut editing style worth stealing', 'notes' => '', 'tags' => ['editing', 'tiktok']],
        ['url' => 'https://every.to/p/the-anti-tool-manifesto', 'title' => 'Essay: why more tools rarely means more output', 'notes' => 'Solid supporting argument for the LinkedIn post.', 'tags' => ['research']],
    ];

    $refIdByUrl = [];
    foreach ($references as $r) {
        $parsed = parse_reference($r['url']);
        $id = uuid();
        $pdo->prepare(
            'INSERT INTO refs (id, user_id, url, platform, title, thumbnail_url, embed_url, notes, archived, created_at)
             VALUES (?,?,?,?,?,?,?,?,0,?)'
        )->execute([
            $id, $userId, $parsed['url'], $parsed['platform'],
            $r['title'] !== '' ? $r['title'] : title_from_url($r['url']),
            $parsed['thumbnail_url'], $parsed['embed_url'], $r['notes'], $daysAgo(random_int(4, 40)),
        ]);
        foreach ($r['tags'] ?? [] as $t) {
            $pdo->prepare('INSERT IGNORE INTO reference_tags (reference_id, tag_id) VALUES (?,?)')
                ->execute([$id, $tag($t)]);
        }
        $refIdByUrl[$r['url']] = $id;
    }

    // --- Content items -----------------------------------------------------
    $items = [
        [
            'title' => "Why Businesses Don't Need More AI Tools",
            'description' => 'A contrarian LinkedIn post arguing that most teams have a workflow problem, not a tooling problem.',
            'hook' => "Your business doesn't need another AI tool. It needs to actually use the three you already pay for.",
            'script' => "Your business doesn't need another AI tool.\n\nIt needs to actually use the three you already pay for.\n\nEvery week I talk to a founder drowning in subscriptions:\n— an AI notetaker nobody reads\n— a chatbot that answers zero real questions\n— an \"automation platform\" wired to nothing\n\nThe problem was never access to tools.\nThe problem is that tools don't create workflows. People do.\n\nBefore you buy the next thing, ask:\n1. What is the actual bottleneck?\n2. Would removing a step beat adding a tool?\n3. Who owns this after the demo hype fades?\n\nThe teams winning with AI aren't the ones with the most tools.\nThey're the ones who deleted the busywork the tool was hiding.",
            'cta' => "What's one tool you pay for but never actually use? Reply below — I read every one.",
            'notes' => 'Post Tuesday morning. Keep the formatting airy for mobile.',
            'angle' => 'Contrarian / pattern interrupt', 'category' => 'Thought leadership', 'content_pillar' => 'AI strategy',
            'platform' => 'linkedin', 'format' => 'text_post', 'status' => 'scripting', 'priority' => 'high',
            'created_at' => $daysAgo(3), 'updated_at' => $daysAgo(1),
            'tags' => ['ai', 'contrarian', 'linkedin'],
            'refs' => ['https://www.linkedin.com/posts/example_ai-automation-activity-123456789', 'https://every.to/p/the-anti-tool-manifesto'],
        ],
        [
            'title' => 'Voice AI books a table live on camera',
            'description' => 'Demo reel: an AI voice agent taking a restaurant reservation end to end.',
            'hook' => 'I let an AI answer my restaurant phone for a week. Here is what happened.',
            'script' => "Cold open: phone rings, AI picks up, books the table.\nCut to dashboard showing the reservation appear.\nVoiceover: no app, no training, no missed calls.",
            'cta' => 'Want the setup? Comment "VOICE" and I\'ll send the build.',
            'notes' => 'Shoot the B-roll at the counter. Keep under 30s.',
            'angle' => 'Show, don\'t tell', 'category' => 'Demo', 'content_pillar' => 'Automation',
            'platform' => 'instagram', 'format' => 'reel', 'status' => 'ready_to_record', 'priority' => 'high',
            'created_at' => $daysAgo(6), 'updated_at' => $daysAgo(2),
            'tags' => ['voice-ai', 'demo', 'restaurant'],
            'refs' => ['https://www.instagram.com/reel/CxYzAbCdEfG/'],
        ],
        [
            'title' => 'The 3-second hook formula',
            'description' => 'Short teaching the pattern-interrupt hook.',
            'hook' => 'If your first 3 seconds are a summary, you already lost them.',
            'script' => "State the enemy. Promise the fix. Show the proof. Go.",
            'cta' => 'Save this before your next post.',
            'notes' => '', 'angle' => 'Teaching', 'category' => 'Education', 'content_pillar' => 'Content strategy',
            'platform' => 'youtube_shorts', 'format' => 'short', 'status' => 'editing', 'priority' => 'medium',
            'created_at' => $daysAgo(8), 'updated_at' => $daysAgo(1),
            'tags' => ['hooks', 'shorts', 'retention'],
            'refs' => ['https://www.youtube.com/shorts/5qap5aO4i9A', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'],
        ],
        [
            'title' => 'Lead follow-up automation teardown',
            'description' => 'Long-form breakdown of an automated follow-up sequence that closes deals.',
            'hook' => 'This 4-step follow-up made more sales than our whole ad budget.',
            'script' => "Walk through the trigger, the wait, the personalization, the hand-off.",
            'cta' => 'Full template in the description.',
            'notes' => 'Screen-record the automation canvas.',
            'angle' => 'Case study', 'category' => 'Tutorial', 'content_pillar' => 'Automation',
            'platform' => 'youtube', 'format' => 'long_form', 'status' => 'recording', 'priority' => 'medium',
            'created_at' => $daysAgo(10), 'updated_at' => $daysAgo(3),
            'tags' => ['leads', 'automation', 'sales'],
            'refs' => ['https://x.com/example/status/1780000000000000000'],
        ],
        [
            'title' => 'Fast-cut editing walkthrough',
            'description' => 'Research notes for an editing-style breakdown.',
            'hook' => 'Why do these edits feel so fast? It\'s not the cuts.',
            'script' => '', 'cta' => '', 'notes' => 'Study the TikTok reference frame by frame.',
            'angle' => 'Breakdown', 'category' => 'Education', 'content_pillar' => 'Editing',
            'platform' => 'tiktok', 'format' => 'tutorial', 'status' => 'research', 'priority' => 'low',
            'created_at' => $daysAgo(5), 'updated_at' => $daysAgo(4),
            'tags' => ['editing', 'tiktok'],
            'refs' => ['https://www.tiktok.com/@creator/video/7300000000000000000'],
        ],
        [
            'title' => 'AI won\'t take your job. This will.',
            'description' => 'Punchy opinion post.',
            'hook' => 'AI won\'t take your job. Someone using AI to do your job in half the time will.',
            'script' => "AI won't take your job.\n\nBut the person who learned to point it at the boring 80% will.",
            'cta' => 'Agree or cope? 👇',
            'notes' => '', 'angle' => 'Provocative', 'category' => 'Thought leadership', 'content_pillar' => 'AI strategy',
            'platform' => 'x', 'format' => 'text_post', 'status' => 'ready_to_post', 'priority' => 'high',
            'created_at' => $daysAgo(2), 'updated_at' => $daysAgo(1),
            'tags' => ['ai', 'opinion'],
            'refs' => [],
        ],
        [
            'title' => 'Notion dashboard for content planning',
            'description' => 'Carousel walking through a simple content dashboard.',
            'hook' => 'Steal my content dashboard (it fits on one screen).',
            'script' => "Slide 1: the problem. Slides 2-6: each view. Slide 7: CTA.",
            'cta' => 'Comment "BOARD" for the template.',
            'notes' => 'Design 7 slides, brand colors.',
            'angle' => 'Resource', 'category' => 'Resource', 'content_pillar' => 'Content strategy',
            'platform' => 'instagram', 'format' => 'carousel', 'status' => 'scheduled', 'priority' => 'medium',
            'created_at' => $daysAgo(12), 'updated_at' => $daysAgo(2), 'scheduled_at' => $daysAhead(2, 9),
            'tags' => ['notion', 'planning', 'carousel'],
            'refs' => [],
        ],
        [
            'title' => 'One prompt to plan a week of content',
            'description' => 'Scheduled short on batch-planning with a single prompt.',
            'hook' => 'This one prompt plans my entire week of content in 4 minutes.',
            'script' => "Show the prompt. Show the output. Show the calendar filling up.",
            'cta' => 'Follow for the prompt pack.',
            'notes' => '', 'angle' => 'Value bomb', 'category' => 'Education', 'content_pillar' => 'AI strategy',
            'platform' => 'youtube_shorts', 'format' => 'short', 'status' => 'scheduled', 'priority' => 'high',
            'created_at' => $daysAgo(7), 'updated_at' => $daysAgo(1), 'scheduled_at' => $daysAhead(5, 12),
            'tags' => ['prompts', 'planning', 'shorts'],
            'refs' => ['https://youtu.be/aqz-KE-bpKQ'],
        ],
        [
            'title' => 'The anti-tool manifesto (posted)',
            'description' => 'The flagship LinkedIn post that started the series.',
            'hook' => 'More tools rarely means more output. Here\'s the proof.',
            'script' => "The full essay adapted for LinkedIn, airy formatting.",
            'cta' => 'What would you delete first?',
            'notes' => 'Performed well — repurpose into a short.',
            'angle' => 'Contrarian', 'category' => 'Thought leadership', 'content_pillar' => 'AI strategy',
            'platform' => 'linkedin', 'format' => 'text_post', 'status' => 'posted', 'priority' => 'medium',
            'created_at' => $daysAgo(20), 'updated_at' => $daysAgo(14), 'published_at' => $daysAgo(14),
            'tags' => ['ai', 'contrarian', 'linkedin'],
            'refs' => ['https://every.to/p/the-anti-tool-manifesto'],
            'metrics' => ['views' => 48200, 'likes' => 1310, 'comments' => 214, 'shares' => 96, 'saves' => 388, 'leads' => 31],
        ],
        [
            'title' => 'Chatbot that actually answers (posted)',
            'description' => 'Short demo of a support bot wired to real docs.',
            'hook' => 'Most chatbots are useless. This one reads your actual docs.',
            'script' => "Ask a hard question. Get a real answer with a source. Mic drop.",
            'cta' => 'Build guide pinned in comments.',
            'notes' => '', 'angle' => 'Demo', 'category' => 'Demo', 'content_pillar' => 'Automation',
            'platform' => 'youtube_shorts', 'format' => 'short', 'status' => 'posted', 'priority' => 'medium',
            'created_at' => $daysAgo(18), 'updated_at' => $daysAgo(11), 'published_at' => $daysAgo(11),
            'tags' => ['chatbot', 'demo', 'support'],
            'refs' => [],
            'metrics' => ['views' => 15600, 'likes' => 540, 'comments' => 63, 'shares' => 22, 'saves' => 140, 'leads' => 12],
        ],
        [
            'title' => 'Idea: "Automations I regret building"',
            'description' => 'A candid list of over-engineered automations.',
            'hook' => 'I built 40 automations last year. I\'d delete half of them.',
            'script' => '', 'cta' => '', 'notes' => 'Could be a carousel or a thread.',
            'angle' => 'Confession', 'category' => 'Thought leadership', 'content_pillar' => 'Automation',
            'platform' => 'linkedin', 'format' => 'text_post', 'status' => 'idea', 'priority' => 'low',
            'created_at' => $daysAgo(1), 'updated_at' => $daysAgo(1),
            'tags' => ['automation', 'lessons'],
            'refs' => [],
        ],
        [
            'title' => 'Inbox: voice-agent cost breakdown',
            'description' => 'Raw idea captured from a call — cost per booking of a voice agent.',
            'hook' => '', 'script' => '', 'cta' => '', 'notes' => 'Someone asked "does it actually save money?" — answer it with real numbers.',
            'angle' => '', 'category' => '', 'content_pillar' => 'Automation',
            'platform' => 'other', 'format' => 'other', 'status' => 'inbox', 'priority' => 'medium',
            'created_at' => $daysAgo(0), 'updated_at' => $daysAgo(0),
            'tags' => ['voice-ai', 'idea'],
            'refs' => [],
        ],
    ];

    $insItem = $pdo->prepare(
        'INSERT INTO content_items
         (id, user_id, title, description, hook, script, cta, notes, angle, category, content_pillar,
          platform, format, status, priority, thumbnail_url, archived, repurposed_from,
          scheduled_at, published_at, created_at, updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,NULL,?,?,?,?)'
    );

    foreach ($items as $it) {
        $id = uuid();
        $insItem->execute([
            $id, $userId, $it['title'], $it['description'] ?? '', $it['hook'] ?? '', $it['script'] ?? '',
            $it['cta'] ?? '', $it['notes'] ?? '', $it['angle'] ?? '', $it['category'] ?? '', $it['content_pillar'] ?? '',
            $it['platform'], $it['format'], $it['status'], $it['priority'], $it['thumbnail_url'] ?? null,
            $it['scheduled_at'] ?? null, $it['published_at'] ?? null, $it['created_at'], $it['updated_at'],
        ]);

        foreach ($it['tags'] ?? [] as $t) {
            $pdo->prepare('INSERT IGNORE INTO content_tags (content_id, tag_id) VALUES (?,?)')
                ->execute([$id, $tag($t)]);
        }
        foreach ($it['refs'] ?? [] as $url) {
            if (isset($refIdByUrl[$url])) {
                $pdo->prepare('INSERT IGNORE INTO content_references (content_id, reference_id) VALUES (?,?)')
                    ->execute([$id, $refIdByUrl[$url]]);
            }
        }
        if (!empty($it['metrics'])) {
            $m = $it['metrics'];
            $pdo->prepare(
                'INSERT INTO performance_metrics (content_id, views, likes, comments, shares, saves, leads, updated_at)
                 VALUES (?,?,?,?,?,?,?,?)'
            )->execute([$id, $m['views'], $m['likes'], $m['comments'], $m['shares'], $m['saves'], $m['leads'], now_sql()]);
        }
    }

    $pdo->commit();
}
