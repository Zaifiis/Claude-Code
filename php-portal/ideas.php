<?php
require __DIR__ . '/inc/bootstrap.php';
render_list_view(
    'Ideas',
    'ideas',
    ['status' => 'idea', 'order' => "FIELD(priority,'urgent','high','medium','low'), updated_at DESC"],
    'No ideas yet. Add one and start building your pipeline.',
    'Concepts waiting to enter production.'
);
