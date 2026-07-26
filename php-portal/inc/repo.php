<?php
/**
 * Data access for content items and references. Every page reads through here
 * so query logic lives in one place.
 */

/** Attach tag-name arrays and metrics to a list of content rows (batched). */
function decorate_content(array $rows): array
{
    if (!$rows) {
        return [];
    }
    $ids = array_column($rows, 'id');
    $ph = implode(',', array_fill(0, count($ids), '?'));

    // Tags
    $tagsById = [];
    $stmt = db()->prepare(
        "SELECT ct.content_id, t.name FROM content_tags ct
         JOIN tags t ON t.id = ct.tag_id
         WHERE ct.content_id IN ($ph) ORDER BY t.name"
    );
    $stmt->execute($ids);
    foreach ($stmt->fetchAll() as $r) {
        $tagsById[$r['content_id']][] = $r['name'];
    }

    // Metrics
    $metricsById = [];
    $stmt = db()->prepare("SELECT * FROM performance_metrics WHERE content_id IN ($ph)");
    $stmt->execute($ids);
    foreach ($stmt->fetchAll() as $r) {
        $metricsById[$r['content_id']] = $r;
    }

    foreach ($rows as &$row) {
        $row['tags'] = $tagsById[$row['id']] ?? [];
        $row['metrics'] = $metricsById[$row['id']] ?? null;
    }
    return $rows;
}

/**
 * Flexible content list.
 * @param array $opts status(string|array), archived(int), scheduled(bool),
 *                    has_script(bool), search(string), order(string)
 */
function content_list(array $opts = []): array
{
    $where = [];
    $args = [];

    $archived = $opts['archived'] ?? 0;
    $where[] = 'archived = ?';
    $args[] = (int) $archived;

    if (!empty($opts['status'])) {
        $statuses = (array) $opts['status'];
        $ph = implode(',', array_fill(0, count($statuses), '?'));
        $where[] = "status IN ($ph)";
        array_push($args, ...$statuses);
    }
    if (!empty($opts['scheduled'])) {
        $where[] = 'scheduled_at IS NOT NULL';
    }
    if (!empty($opts['has_script'])) {
        $where[] = "script <> ''";
    }
    if (!empty($opts['search'])) {
        $where[] = '(title LIKE ? OR description LIKE ? OR hook LIKE ? OR script LIKE ? OR category LIKE ? OR content_pillar LIKE ?)';
        $like = '%' . $opts['search'] . '%';
        array_push($args, $like, $like, $like, $like, $like, $like);
    }
    if (!empty($opts['platform'])) {
        $where[] = 'platform = ?';
        $args[] = $opts['platform'];
    }

    $order = $opts['order'] ?? 'updated_at DESC';
    $allowedOrder = [
        'updated_at DESC', 'created_at DESC', 'scheduled_at ASC', 'published_at DESC',
        "FIELD(priority,'urgent','high','medium','low'), updated_at DESC",
    ];
    if (!in_array($order, $allowedOrder, true)) {
        $order = 'updated_at DESC';
    }

    $sql = 'SELECT * FROM content_items WHERE ' . implode(' AND ', $where) . ' ORDER BY ' . $order;
    $stmt = db()->prepare($sql);
    $stmt->execute($args);
    return decorate_content($stmt->fetchAll());
}

/** Count of non-archived items grouped by status. */
function content_counts_by_status(): array
{
    $rows = db()->query(
        'SELECT status, COUNT(*) AS c FROM content_items WHERE archived = 0 GROUP BY status'
    )->fetchAll();
    $out = array_fill_keys(STATUS_ORDER, 0);
    foreach ($rows as $r) {
        $out[$r['status']] = (int) $r['c'];
    }
    return $out;
}

/** Full single content record with tags, references, attachments, metrics. */
function content_get(string $id): ?array
{
    $stmt = db()->prepare('SELECT * FROM content_items WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $item = $stmt->fetch();
    if (!$item) {
        return null;
    }
    [$item] = decorate_content([$item]);

    // References
    $stmt = db()->prepare(
        'SELECT r.* FROM content_references cr JOIN refs r ON r.id = cr.reference_id
         WHERE cr.content_id = ? ORDER BY r.created_at DESC'
    );
    $stmt->execute([$id]);
    $item['references'] = $stmt->fetchAll();

    // Attachments
    $stmt = db()->prepare('SELECT * FROM attachments WHERE content_id = ? ORDER BY created_at');
    $stmt->execute([$id]);
    $item['attachments'] = $stmt->fetchAll();

    // Repurpose relationships
    $stmt = db()->prepare('SELECT COUNT(*) FROM content_items WHERE repurposed_from = ?');
    $stmt->execute([$id]);
    $item['repurposedCount'] = (int) $stmt->fetchColumn();

    $item['repurposedFromTitle'] = null;
    if (!empty($item['repurposed_from'])) {
        $stmt = db()->prepare('SELECT title FROM content_items WHERE id = ?');
        $stmt->execute([$item['repurposed_from']]);
        $item['repurposedFromTitle'] = $stmt->fetchColumn() ?: null;
    }
    return $item;
}

/** References decorated with tag names and how many items cite each. */
function references_list(array $opts = []): array
{
    $where = ['r.archived = ?'];
    $args = [(int) ($opts['archived'] ?? 0)];
    if (!empty($opts['search'])) {
        $where[] = '(r.title LIKE ? OR r.url LIKE ? OR r.notes LIKE ?)';
        $like = '%' . $opts['search'] . '%';
        array_push($args, $like, $like, $like);
    }
    if (!empty($opts['platform'])) {
        $where[] = 'r.platform = ?';
        $args[] = $opts['platform'];
    }

    $sql = 'SELECT r.*, (SELECT COUNT(*) FROM content_references cr WHERE cr.reference_id = r.id) AS usedCount
            FROM refs r WHERE ' . implode(' AND ', $where) . ' ORDER BY r.created_at DESC';
    $stmt = db()->prepare($sql);
    $stmt->execute($args);
    $rows = $stmt->fetchAll();
    if (!$rows) {
        return [];
    }

    $ids = array_column($rows, 'id');
    $ph = implode(',', array_fill(0, count($ids), '?'));
    $tagsById = [];
    $stmt = db()->prepare(
        "SELECT rt.reference_id, t.name FROM reference_tags rt JOIN tags t ON t.id = rt.tag_id
         WHERE rt.reference_id IN ($ph) ORDER BY t.name"
    );
    $stmt->execute($ids);
    foreach ($stmt->fetchAll() as $r) {
        $tagsById[$r['reference_id']][] = $r['name'];
    }
    foreach ($rows as &$row) {
        $row['tags'] = $tagsById[$row['id']] ?? [];
        $row['usedCount'] = (int) $row['usedCount'];
    }
    return $rows;
}

function reference_get(string $id): ?array
{
    $stmt = db()->prepare('SELECT * FROM refs WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) {
        return null;
    }
    $stmt = db()->prepare(
        'SELECT t.name FROM reference_tags rt JOIN tags t ON t.id = rt.tag_id
         WHERE rt.reference_id = ? ORDER BY t.name'
    );
    $stmt->execute([$id]);
    $row['tags'] = array_column($stmt->fetchAll(), 'name');
    return $row;
}

/** Get-or-create a tag id by name (used by save handlers). */
function tag_id(string $name): string
{
    $name = trim($name);
    $stmt = db()->prepare('SELECT id FROM tags WHERE name = ?');
    $stmt->execute([$name]);
    $id = $stmt->fetchColumn();
    if ($id) {
        return $id;
    }
    $id = uuid();
    db()->prepare('INSERT INTO tags (id, name, created_at) VALUES (?,?,?)')
        ->execute([$id, $name, now_sql()]);
    return $id;
}

/** Parse a comma/space separated tag string into clean names. */
function parse_tags(string $raw): array
{
    $parts = preg_split('/[,\n]+/', $raw) ?: [];
    $out = [];
    foreach ($parts as $p) {
        $p = trim($p);
        $p = ltrim($p, '#');
        $p = trim($p);
        if ($p !== '' && !in_array($p, $out, true)) {
            $out[] = mb_strtolower($p);
        }
    }
    return $out;
}

/** Replace the tag set on a content item. */
function set_content_tags(string $contentId, array $tagNames): void
{
    db()->prepare('DELETE FROM content_tags WHERE content_id = ?')->execute([$contentId]);
    foreach ($tagNames as $name) {
        db()->prepare('INSERT IGNORE INTO content_tags (content_id, tag_id) VALUES (?,?)')
            ->execute([$contentId, tag_id($name)]);
    }
}

function set_reference_tags(string $refId, array $tagNames): void
{
    db()->prepare('DELETE FROM reference_tags WHERE reference_id = ?')->execute([$refId]);
    foreach ($tagNames as $name) {
        db()->prepare('INSERT IGNORE INTO reference_tags (reference_id, tag_id) VALUES (?,?)')
            ->execute([$refId, tag_id($name)]);
    }
}

/** Aggregate metrics across all posted items, for the analytics page. */
function metrics_totals(): array
{
    $row = db()->query(
        'SELECT
           COALESCE(SUM(views),0)    AS views,
           COALESCE(SUM(likes),0)    AS likes,
           COALESCE(SUM(comments),0) AS comments,
           COALESCE(SUM(shares),0)   AS shares,
           COALESCE(SUM(saves),0)    AS saves,
           COALESCE(SUM(leads),0)    AS leads,
           COUNT(*)                  AS tracked
         FROM performance_metrics'
    )->fetch();
    return array_map('intval', $row);
}
