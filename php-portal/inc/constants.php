<?php
/**
 * Domain constants for Content OS — single source of truth for platforms,
 * formats, pipeline statuses and priorities, including badge colours.
 * Ported from the original lib/domain/constants.ts.
 */

const PLATFORMS = [
    'instagram'      => ['label' => 'Instagram',      'color' => '#e1306c'],
    'youtube'        => ['label' => 'YouTube',        'color' => '#ff0033'],
    'youtube_shorts' => ['label' => 'YouTube Shorts', 'color' => '#ff0033'],
    'linkedin'       => ['label' => 'LinkedIn',       'color' => '#0a66c2'],
    'tiktok'         => ['label' => 'TikTok',         'color' => '#111114'],
    'x'              => ['label' => 'X',              'color' => '#111114'],
    'facebook'       => ['label' => 'Facebook',       'color' => '#1877f2'],
    'other'          => ['label' => 'Other',          'color' => '#8b8d98'],
];

const FORMATS = [
    'reel'           => ['label' => 'Reel'],
    'short'          => ['label' => 'Short'],
    'long_form'      => ['label' => 'Long-form video'],
    'carousel'       => ['label' => 'Carousel'],
    'text_post'      => ['label' => 'Text post'],
    'thread'         => ['label' => 'Thread'],
    'case_study'     => ['label' => 'Case study'],
    'tutorial'       => ['label' => 'Tutorial'],
    'tool_breakdown' => ['label' => 'Tool breakdown'],
    'story'          => ['label' => 'Story'],
    'opinion'        => ['label' => 'Opinion'],
    'other'          => ['label' => 'Other'],
];

/** Pipeline columns, in workflow order. */
const STATUSES = [
    'inbox'           => ['label' => 'Inbox',           'color' => '#8b8d98'],
    'idea'            => ['label' => 'Idea',            'color' => '#7d7bff'],
    'research'        => ['label' => 'Research',        'color' => '#0ea5e9'],
    'scripting'       => ['label' => 'Scripting',       'color' => '#8b5cf6'],
    'ready_to_record' => ['label' => 'Ready to Record', 'color' => '#14b8a6'],
    'recording'       => ['label' => 'Recording',       'color' => '#f59e0b'],
    'editing'         => ['label' => 'Editing',         'color' => '#ec4899'],
    'ready_to_post'   => ['label' => 'Ready to Post',   'color' => '#22c55e'],
    'scheduled'       => ['label' => 'Scheduled',       'color' => '#3b82f6'],
    'posted'          => ['label' => 'Posted',          'color' => '#1a8a52'],
];

const PRIORITIES = [
    'low'    => ['label' => 'Low',    'color' => '#8b8d98'],
    'medium' => ['label' => 'Medium', 'color' => '#3b82f6'],
    'high'   => ['label' => 'High',   'color' => '#f59e0b'],
    'urgent' => ['label' => 'Urgent', 'color' => '#ef4444'],
];

const STATUS_ORDER = [
    'inbox', 'idea', 'research', 'scripting', 'ready_to_record',
    'recording', 'editing', 'ready_to_post', 'scheduled', 'posted',
];

const PRIORITY_RANK = ['urgent' => 0, 'high' => 1, 'medium' => 2, 'low' => 3];

/** Statuses considered "in production" for dashboard stats. */
const IN_PRODUCTION_STATUSES = ['research', 'scripting', 'ready_to_record', 'recording', 'editing'];
const READY_STATUSES = ['ready_to_post', 'scheduled'];

/** Look up a label from one of the maps above, with a fallback. */
function label_for(array $map, ?string $key, string $fallback = '—'): string
{
    if ($key === null || $key === '') {
        return $fallback;
    }
    return $map[$key]['label'] ?? $key;
}

function color_for(array $map, ?string $key, string $fallback = '#8b8d98'): string
{
    if ($key === null || $key === '') {
        return $fallback;
    }
    return $map[$key]['color'] ?? $fallback;
}
