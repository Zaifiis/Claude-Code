<?php
/**
 * Grades Guru — Referral System
 * Handles recording referrals, confirming them, and applying tiered discounts.
 */

declare(strict_types=1);

require_once dirname(__DIR__) . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/functions.php';

// ─── Referral Processing ───────────────────────────────────────────────────────

/**
 * Records a new referral when a user signs up using a referral code.
 * Looks up the referrer by referral_code and inserts a pending referral row.
 *
 * @param PDO    $pdo           Active database connection.
 * @param string $referralCode  The code the new user entered.
 * @param int    $newUserId     The newly created user's ID.
 * @return bool  true on success, false if the code is invalid or a duplicate.
 */
function processReferral(PDO $pdo, string $referralCode, int $newUserId): bool
{
    // Find the referrer by their referral code
    $stmt = $pdo->prepare(
        'SELECT id FROM users WHERE referral_code = ? AND status = "active" LIMIT 1'
    );
    $stmt->execute([strtoupper(trim($referralCode))]);
    $referrer = $stmt->fetch();

    if (!$referrer) {
        return false; // Invalid or inactive code
    }

    $referrerId = (int)$referrer['id'];

    // Prevent self-referral
    if ($referrerId === $newUserId) {
        return false;
    }

    // Prevent duplicate referral records
    $dupCheck = $pdo->prepare(
        'SELECT id FROM referrals WHERE referrer_id = ? AND referred_id = ? LIMIT 1'
    );
    $dupCheck->execute([$referrerId, $newUserId]);
    if ($dupCheck->fetch()) {
        return false;
    }

    // Record the referral as pending (admin must confirm)
    $insert = $pdo->prepare(
        'INSERT INTO referrals (referrer_id, referred_id, referral_code, status)
         VALUES (?, ?, ?, "pending")'
    );
    $insert->execute([$referrerId, $newUserId, strtoupper(trim($referralCode))]);

    // Store the referring code on the new user's record
    $pdo->prepare('UPDATE users SET referred_by = ? WHERE id = ?')
        ->execute([strtoupper(trim($referralCode)), $newUserId]);

    // Notify the referrer (pending — not yet rewarded)
    createNotification(
        $pdo,
        $referrerId,
        'Someone signed up using your referral code! Your discount will be applied once their account is confirmed.',
        'info'
    );

    return true;
}

/**
 * Confirms a referral (admin action) and applies the appropriate discount tier
 * to the referrer.  Also notifies both parties.
 *
 * Discount tiers (referral_count AFTER confirmation):
 *   1st referral  → 10%  discount on referrer's next order
 *   2nd referral  → 25%  discount on referrer's next order
 *   3rd+          → flat 25% (capped)
 *
 * @param PDO $pdo        Active database connection.
 * @param int $referralId The referrals.id to confirm.
 * @return array{success: bool, message: string}
 */
function confirmReferral(PDO $pdo, int $referralId): array
{
    // Load the referral
    $stmt = $pdo->prepare(
        'SELECT r.*, u.referral_count, u.discount_percentage, u.name AS referrer_name, u.email AS referrer_email
         FROM referrals r
         JOIN users u ON u.id = r.referrer_id
         WHERE r.id = ? AND r.status = "pending"
         LIMIT 1'
    );
    $stmt->execute([$referralId]);
    $referral = $stmt->fetch();

    if (!$referral) {
        return ['success' => false, 'message' => 'Referral not found or already confirmed.'];
    }

    // Read tier bonuses from settings
    $bonus1 = (float)getSetting($pdo, 'referral_bonus_1'); // e.g. 10
    $bonus2 = (float)getSetting($pdo, 'referral_bonus_2'); // e.g. 25

    $referrerId      = (int)$referral['referrer_id'];
    $newCount        = (int)$referral['referral_count'] + 1;
    $currentDiscount = (float)$referral['discount_percentage'];

    // Determine discount to award
    $discountToApply = match (true) {
        $newCount === 1 => $bonus1,
        $newCount >= 2  => $bonus2,
        default         => $bonus1,
    };

    // The referrer gets the higher of their current discount or the new tier
    $finalDiscount = min(25.00, max($currentDiscount, $discountToApply));

    Database::beginTransaction();
    try {
        // Mark referral as confirmed + discount_given
        $pdo->prepare(
            'UPDATE referrals SET status = "confirmed", discount_given = 1 WHERE id = ?'
        )->execute([$referralId]);

        // Update referrer's count and discount
        $pdo->prepare(
            'UPDATE users SET referral_count = ?, discount_percentage = ? WHERE id = ?'
        )->execute([$newCount, $finalDiscount, $referrerId]);

        Database::commit();
    } catch (PDOException $e) {
        Database::rollBack();
        error_log('[GG Referral] confirmReferral failed: ' . $e->getMessage());
        return ['success' => false, 'message' => 'Database error. Please try again.'];
    }

    // Notify referrer
    createNotification(
        $pdo,
        $referrerId,
        "Referral confirmed! You now have a {$finalDiscount}% discount applied to your account.",
        'success'
    );

    // Send email reward notification
    $referrerUser = [
        'name'  => $referral['referrer_name'],
        'email' => $referral['referrer_email'],
    ];
    sendReferralConfirmedEmail($referrerUser, $finalDiscount);

    return [
        'success'  => true,
        'message'  => "Referral confirmed. {$referral['referrer_name']} now has {$finalDiscount}% discount.",
        'discount' => $finalDiscount,
    ];
}

// ─── Referral Queries ──────────────────────────────────────────────────────────

/**
 * Returns the total confirmed referral count for a user.
 */
function getReferralCount(PDO $pdo, int $userId): int
{
    $stmt = $pdo->prepare(
        'SELECT referral_count FROM users WHERE id = ? LIMIT 1'
    );
    $stmt->execute([$userId]);
    $row = $stmt->fetch();
    return $row ? (int)$row['referral_count'] : 0;
}

/**
 * Returns the current discount percentage for a user.
 */
function getUserDiscount(PDO $pdo, int $userId): float
{
    $stmt = $pdo->prepare(
        'SELECT discount_percentage FROM users WHERE id = ? LIMIT 1'
    );
    $stmt->execute([$userId]);
    $row = $stmt->fetch();
    return $row ? (float)$row['discount_percentage'] : 0.0;
}

/**
 * Directly sets the discount percentage on a user record.
 * Clamps the value between 0 and 100.
 */
function applyReferralDiscount(PDO $pdo, int $userId, float $discountPct): bool
{
    $clamped = max(0.0, min(100.0, $discountPct));
    $stmt    = $pdo->prepare(
        'UPDATE users SET discount_percentage = ? WHERE id = ?'
    );
    return $stmt->execute([$clamped, $userId]);
}

/**
 * Returns all pending referrals (admin overview).
 */
function getPendingReferrals(PDO $pdo): array
{
    $stmt = $pdo->query(
        'SELECT r.id, r.referral_code, r.created_at,
                u1.name AS referrer_name, u1.email AS referrer_email,
                u2.name AS referred_name, u2.email AS referred_email,
                u2.created_at AS joined_at
         FROM referrals r
         JOIN users u1 ON u1.id = r.referrer_id
         JOIN users u2 ON u2.id = r.referred_id
         WHERE r.status = "pending"
         ORDER BY r.created_at DESC'
    );
    return $stmt->fetchAll();
}

/**
 * Returns the full referral list for a specific referrer (their dashboard view).
 */
function getUserReferrals(PDO $pdo, int $referrerId): array
{
    $stmt = $pdo->prepare(
        'SELECT r.id, r.status, r.discount_given, r.created_at,
                u.name AS referred_name, u.created_at AS joined_at
         FROM referrals r
         JOIN users u ON u.id = r.referred_id
         WHERE r.referrer_id = ?
         ORDER BY r.created_at DESC'
    );
    $stmt->execute([$referrerId]);
    return $stmt->fetchAll();
}
