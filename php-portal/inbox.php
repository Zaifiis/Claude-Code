<?php
require __DIR__ . '/inc/bootstrap.php';
render_list_view(
    'Inbox',
    'inbox',
    ['status' => 'inbox', 'order' => 'created_at DESC'],
    'Your inbox is empty. Capture raw ideas here before they become content.',
    'Unsorted captures. Triage each into an idea when you are ready to work on it.'
);
