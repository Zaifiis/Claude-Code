<?php
require __DIR__ . '/inc/bootstrap.php';
render_list_view(
    'Scripts',
    'scripts',
    ['has_script' => true, 'order' => 'updated_at DESC'],
    'No scripts written yet. Open any content item and draft its hook, script and CTA.',
    'Everything with a written script, hook or CTA — your writing desk.'
);
