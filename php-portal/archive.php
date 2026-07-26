<?php
require __DIR__ . '/inc/bootstrap.php';
render_list_view(
    'Archive',
    'archive',
    ['archived' => 1, 'order' => 'updated_at DESC'],
    'Nothing archived. Archived content items live here and can be restored anytime.',
    'Archived content. Open an item to restore it.'
);
