<?php
require __DIR__ . '/inc/bootstrap.php';
render_list_view(
    'Ideas',
    'ideas',
    ['status' => 'idea', 'order' => PRIORITY_ORDER_SQL],
    'No ideas yet. Add one and start building your pipeline.',
    'Concepts waiting to enter production.'
);
