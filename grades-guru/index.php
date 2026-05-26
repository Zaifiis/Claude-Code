<?php
/**
 * Grades Guru — Public Landing Page
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/functions.php';

// Redirect logged-in users to their dashboard
if (isLoggedIn()) {
    redirectToDashboard();
}

$csrfToken = getCsrfToken();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Grades Guru — Academic Excellence, Simplified</title>
    <meta name="description" content="Premium academic writing services. Essays, technical assignments, data analysis and more. 98% satisfaction rate.">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        /* ── Reset & Base ── */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
            --navy:    #0A1628;
            --navy-light: #112240;
            --gold:    #F4C430;
            --gold-dark: #D4A820;
            --emerald: #10B981;
            --off-white: #F8F9FA;
            --white:   #FFFFFF;
            --gray-100: #F1F3F5;
            --gray-200: #E9ECEF;
            --gray-400: #ADB5BD;
            --gray-600: #6C757D;
            --gray-800: #343A40;
            --shadow-sm: 0 2px 8px rgba(10,22,40,.08);
            --shadow-md: 0 8px 32px rgba(10,22,40,.12);
            --shadow-lg: 0 20px 60px rgba(10,22,40,.18);
            --radius:  12px;
            --radius-lg: 20px;
            --transition: .25s cubic-bezier(.4,0,.2,1);
        }
        html { scroll-behavior: smooth; }
        body {
            font-family: 'DM Sans', sans-serif;
            background: var(--white);
            color: var(--gray-800);
            line-height: 1.6;
            overflow-x: hidden;
        }

        /* ── Typography ── */
        h1,h2,h3,h4 { font-family: 'Playfair Display', serif; line-height: 1.2; }
        .text-gold    { color: var(--gold); }
        .text-emerald { color: var(--emerald); }
        .text-navy    { color: var(--navy); }

        /* ── Layout ── */
        .container { max-width: 1160px; margin: 0 auto; padding: 0 24px; }
        .section    { padding: 96px 0; }
        .section-sm { padding: 64px 0; }

        /* ── Buttons ── */
        .btn {
            display: inline-flex; align-items: center; gap: 8px;
            padding: 14px 28px; border-radius: 50px; font-family: 'DM Sans', sans-serif;
            font-weight: 600; font-size: .95rem; cursor: pointer; border: none;
            text-decoration: none; transition: var(--transition); white-space: nowrap;
        }
        .btn-gold {
            background: var(--gold); color: var(--navy);
        }
        .btn-gold:hover { background: var(--gold-dark); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(244,196,48,.4); }
        .btn-outline {
            background: transparent; color: var(--white);
            border: 2px solid rgba(255,255,255,.4);
        }
        .btn-outline:hover { background: rgba(255,255,255,.1); border-color: var(--white); }
        .btn-navy {
            background: var(--navy); color: var(--white);
        }
        .btn-navy:hover { background: var(--navy-light); transform: translateY(-2px); box-shadow: var(--shadow-md); }
        .btn-emerald {
            background: var(--emerald); color: var(--white);
        }
        .btn-emerald:hover { background: #0EA572; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(16,185,129,.4); }
        .btn-lg { padding: 18px 36px; font-size: 1.05rem; }
        .btn-sm { padding: 10px 20px; font-size: .875rem; }

        /* ════════════════════════════════
           NAVIGATION
        ════════════════════════════════ */
        .nav {
            position: sticky; top: 0; z-index: 1000;
            background: rgba(10,22,40,.96);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-bottom: 1px solid rgba(244,196,48,.15);
        }
        .nav-inner {
            display: flex; align-items: center; justify-content: space-between;
            padding: 16px 24px; max-width: 1160px; margin: 0 auto;
        }
        .nav-logo {
            display: flex; align-items: center; gap: 12px;
            text-decoration: none;
        }
        .nav-logo-circle {
            width: 42px; height: 42px; border-radius: 50%;
            background: linear-gradient(135deg, var(--gold) 0%, var(--gold-dark) 100%);
            display: flex; align-items: center; justify-content: center;
            font-family: 'Playfair Display', serif; font-weight: 700;
            color: var(--navy); font-size: 1rem; letter-spacing: -.5px;
            box-shadow: 0 4px 12px rgba(244,196,48,.35);
            flex-shrink: 0;
        }
        .nav-logo-text {
            font-family: 'Playfair Display', serif; font-weight: 700;
            color: var(--white); font-size: 1.3rem; letter-spacing: -.3px;
        }
        .nav-logo-text span { color: var(--gold); }
        .nav-links { display: flex; align-items: center; gap: 12px; }
        .nav-link {
            color: rgba(255,255,255,.75); text-decoration: none;
            font-size: .9rem; font-weight: 500; padding: 8px 16px;
            border-radius: 8px; transition: var(--transition);
        }
        .nav-link:hover { color: var(--white); background: rgba(255,255,255,.08); }
        .hamburger {
            display: none; background: none; border: none; cursor: pointer;
            padding: 8px; color: var(--white);
        }
        .hamburger svg { display: block; }
        .nav-mobile { display: none; }

        /* ════════════════════════════════
           HERO
        ════════════════════════════════ */
        .hero {
            background: linear-gradient(135deg, var(--navy) 0%, #0D1F3C 50%, #0A2540 100%);
            position: relative; overflow: hidden; padding: 120px 0 100px;
        }
        .hero::before {
            content: '';
            position: absolute; inset: 0;
            background:
                radial-gradient(ellipse 60% 50% at 70% 50%, rgba(244,196,48,.07) 0%, transparent 70%),
                radial-gradient(ellipse 40% 60% at 20% 80%, rgba(16,185,129,.05) 0%, transparent 60%);
            pointer-events: none;
        }
        .hero-grid {
            display: grid; grid-template-columns: 1fr 1fr; gap: 64px;
            align-items: center; position: relative; z-index: 1;
        }
        .hero-badge {
            display: inline-flex; align-items: center; gap: 8px;
            background: rgba(244,196,48,.12); border: 1px solid rgba(244,196,48,.3);
            color: var(--gold); padding: 8px 18px; border-radius: 50px;
            font-size: .85rem; font-weight: 600; margin-bottom: 28px;
        }
        .hero-badge-dot {
            width: 8px; height: 8px; border-radius: 50%;
            background: var(--emerald);
            box-shadow: 0 0 0 3px rgba(16,185,129,.25);
            animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
            0%,100% { box-shadow: 0 0 0 3px rgba(16,185,129,.25); }
            50%      { box-shadow: 0 0 0 6px rgba(16,185,129,.12); }
        }
        .hero h1 {
            font-size: clamp(2.4rem, 4.5vw, 3.6rem);
            color: var(--white); margin-bottom: 24px; letter-spacing: -.5px;
        }
        .hero h1 em { font-style: normal; color: var(--gold); }
        .hero-subtitle {
            font-size: 1.1rem; color: rgba(255,255,255,.7);
            max-width: 480px; margin-bottom: 40px; line-height: 1.75;
        }
        .hero-ctas { display: flex; gap: 16px; flex-wrap: wrap; }
        .hero-visual {
            display: flex; justify-content: flex-end; align-items: center;
        }
        .hero-card {
            background: rgba(255,255,255,.06);
            border: 1px solid rgba(255,255,255,.1);
            border-radius: var(--radius-lg); padding: 32px;
            backdrop-filter: blur(8px); width: 100%; max-width: 360px;
        }
        .hero-card-header {
            display: flex; align-items: center; gap: 12px; margin-bottom: 24px;
        }
        .hero-card-icon {
            width: 48px; height: 48px; border-radius: 12px;
            background: linear-gradient(135deg, var(--gold) 0%, var(--gold-dark) 100%);
            display: flex; align-items: center; justify-content: center;
            font-size: 1.4rem;
        }
        .hero-card-title { color: var(--white); font-weight: 600; font-size: 1rem; }
        .hero-card-sub   { color: rgba(255,255,255,.5); font-size: .8rem; }
        .hero-stat-row {
            display: flex; gap: 16px; margin-top: 20px;
        }
        .hero-stat {
            flex: 1; background: rgba(255,255,255,.05); border-radius: 10px;
            padding: 16px; text-align: center; border: 1px solid rgba(255,255,255,.08);
        }
        .hero-stat-val {
            display: block; font-family: 'Playfair Display', serif;
            font-size: 1.6rem; font-weight: 700; color: var(--gold);
        }
        .hero-stat-lbl { font-size: .75rem; color: rgba(255,255,255,.55); }
        .hero-order-item {
            display: flex; align-items: center; gap: 12px;
            background: rgba(255,255,255,.04); border-radius: 10px;
            padding: 14px; border: 1px solid rgba(255,255,255,.07);
            margin-bottom: 10px;
        }
        .hero-order-icon {
            width: 36px; height: 36px; border-radius: 8px;
            background: rgba(16,185,129,.15); display: flex;
            align-items: center; justify-content: center;
            color: var(--emerald); font-size: 1rem; flex-shrink: 0;
        }
        .hero-order-name { color: var(--white); font-size: .875rem; font-weight: 500; }
        .hero-order-badge {
            margin-left: auto; background: rgba(16,185,129,.2);
            color: var(--emerald); padding: 3px 10px; border-radius: 20px;
            font-size: .75rem; font-weight: 600;
        }

        /* ════════════════════════════════
           STATS BAR
        ════════════════════════════════ */
        .stats-bar {
            background: var(--gold); padding: 28px 0;
        }
        .stats-row {
            display: flex; justify-content: center; align-items: center;
            gap: 0; flex-wrap: wrap;
        }
        .stat-item {
            display: flex; align-items: center; gap: 16px;
            padding: 12px 40px; text-align: center;
        }
        .stat-item + .stat-item {
            border-left: 2px solid rgba(10,22,40,.15);
        }
        .stat-icon {
            font-size: 1.8rem;
        }
        .stat-val {
            font-family: 'Playfair Display', serif; font-size: 2rem;
            font-weight: 700; color: var(--navy); line-height: 1;
        }
        .stat-lbl { font-size: .85rem; color: rgba(10,22,40,.7); font-weight: 500; }

        /* ════════════════════════════════
           SECTION HEADERS
        ════════════════════════════════ */
        .section-tag {
            display: inline-block;
            background: rgba(244,196,48,.12); color: var(--gold-dark);
            border: 1px solid rgba(244,196,48,.3); border-radius: 50px;
            padding: 6px 18px; font-size: .8rem; font-weight: 600;
            letter-spacing: .5px; text-transform: uppercase; margin-bottom: 16px;
        }
        .section-tag.dark {
            background: rgba(244,196,48,.15); color: var(--gold); border-color: rgba(244,196,48,.35);
        }
        .section-title {
            font-size: clamp(1.8rem, 3.5vw, 2.6rem); margin-bottom: 16px;
        }
        .section-subtitle {
            font-size: 1.05rem; color: var(--gray-600); max-width: 560px;
        }
        .section-subtitle.light { color: rgba(255,255,255,.65); }
        .section-head { text-align: center; margin-bottom: 60px; }
        .section-head .section-subtitle { margin: 0 auto; }

        /* ════════════════════════════════
           PRICING
        ════════════════════════════════ */
        .pricing-grid {
            display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px;
            align-items: stretch;
        }
        .pricing-card {
            background: var(--white); border-radius: var(--radius-lg);
            border: 1.5px solid var(--gray-200); padding: 40px 32px;
            position: relative; transition: var(--transition);
            display: flex; flex-direction: column;
        }
        .pricing-card:hover {
            transform: translateY(-6px); border-color: var(--gold);
            box-shadow: var(--shadow-lg);
        }
        .pricing-card.featured {
            background: var(--navy); border-color: var(--gold);
            box-shadow: 0 24px 80px rgba(10,22,40,.25);
            transform: scale(1.03);
        }
        .pricing-card.featured:hover { transform: scale(1.03) translateY(-6px); }
        .featured-badge {
            position: absolute; top: -14px; left: 50%; transform: translateX(-50%);
            background: var(--gold); color: var(--navy);
            padding: 6px 24px; border-radius: 50px;
            font-size: .8rem; font-weight: 700; letter-spacing: .5px;
            text-transform: uppercase; white-space: nowrap;
        }
        .pricing-icon {
            width: 56px; height: 56px; border-radius: 14px; margin-bottom: 24px;
            display: flex; align-items: center; justify-content: center;
            font-size: 1.5rem;
        }
        .pricing-icon.simple   { background: rgba(244,196,48,.1); }
        .pricing-icon.tech     { background: rgba(16,185,129,.15); }
        .pricing-icon.custom   { background: rgba(10,22,40,.06); }
        .pricing-plan-name {
            font-family: 'Playfair Display', serif; font-size: 1.3rem;
            font-weight: 700; margin-bottom: 6px;
        }
        .pricing-card.featured .pricing-plan-name { color: var(--white); }
        .pricing-desc {
            font-size: .875rem; color: var(--gray-600); margin-bottom: 24px;
        }
        .pricing-card.featured .pricing-desc { color: rgba(255,255,255,.55); }
        .pricing-price {
            margin-bottom: 28px; padding-bottom: 28px;
            border-bottom: 1px solid var(--gray-200);
        }
        .pricing-card.featured .pricing-price { border-color: rgba(255,255,255,.12); }
        .pricing-amount {
            font-family: 'Playfair Display', serif; font-size: 2.4rem;
            font-weight: 700; color: var(--navy);
        }
        .pricing-card.featured .pricing-amount { color: var(--gold); }
        .pricing-unit {
            font-size: .9rem; color: var(--gray-600); font-weight: 500;
        }
        .pricing-card.featured .pricing-unit { color: rgba(255,255,255,.55); }
        .pricing-contact {
            font-family: 'Playfair Display', serif; font-size: 1.6rem;
            font-weight: 700; color: var(--navy);
        }
        .pricing-features { list-style: none; flex: 1; margin-bottom: 32px; }
        .pricing-features li {
            display: flex; align-items: center; gap: 10px;
            padding: 8px 0; font-size: .9rem; color: var(--gray-700);
            border-bottom: 1px solid var(--gray-100);
        }
        .pricing-card.featured .pricing-features li {
            color: rgba(255,255,255,.8); border-color: rgba(255,255,255,.08);
        }
        .pricing-features .check {
            width: 20px; height: 20px; border-radius: 50%;
            background: rgba(16,185,129,.15); color: var(--emerald);
            display: flex; align-items: center; justify-content: center;
            font-size: .65rem; flex-shrink: 0; font-weight: 700;
        }
        .pricing-card.featured .pricing-features .check {
            background: rgba(244,196,48,.2); color: var(--gold);
        }

        /* ════════════════════════════════
           HOW IT WORKS
        ════════════════════════════════ */
        .how-section { background: var(--off-white); }
        .steps-grid {
            display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px;
            position: relative;
        }
        .steps-grid::before {
            content: '';
            position: absolute; top: 36px; left: calc(16.66% + 24px);
            right: calc(16.66% + 24px); height: 2px;
            background: linear-gradient(90deg, var(--gold), var(--emerald), var(--gold));
            z-index: 0;
        }
        .step-card {
            text-align: center; position: relative; z-index: 1;
        }
        .step-number {
            width: 72px; height: 72px; border-radius: 50%;
            background: var(--white); border: 2px solid var(--gold);
            box-shadow: 0 0 0 8px rgba(244,196,48,.1), var(--shadow-sm);
            display: flex; align-items: center; justify-content: center;
            font-size: 1.5rem; margin: 0 auto 24px;
        }
        .step-badge {
            position: absolute; top: -4px; right: calc(50% - 52px);
            background: var(--gold); color: var(--navy);
            width: 22px; height: 22px; border-radius: 50%;
            font-size: .7rem; font-weight: 700; display: flex;
            align-items: center; justify-content: center;
        }
        .step-title {
            font-family: 'Playfair Display', serif; font-size: 1.15rem;
            font-weight: 600; margin-bottom: 10px; color: var(--navy);
        }
        .step-desc { font-size: .9rem; color: var(--gray-600); line-height: 1.6; }

        /* ════════════════════════════════
           REFERRAL
        ════════════════════════════════ */
        .referral-section {
            background: var(--navy);
            position: relative; overflow: hidden;
        }
        .referral-section::before {
            content: ''; position: absolute; inset: 0;
            background:
                radial-gradient(ellipse 50% 80% at 90% 50%, rgba(244,196,48,.08) 0%, transparent 70%),
                radial-gradient(ellipse 40% 60% at 10% 50%, rgba(16,185,129,.06) 0%, transparent 60%);
            pointer-events: none;
        }
        .referral-inner {
            display: grid; grid-template-columns: 1fr 1fr; gap: 80px;
            align-items: center; position: relative; z-index: 1;
        }
        .referral-steps {
            display: flex; flex-direction: column; gap: 24px; margin-top: 32px;
        }
        .referral-step {
            display: flex; align-items: flex-start; gap: 16px;
        }
        .referral-step-icon {
            width: 48px; height: 48px; border-radius: 12px; flex-shrink: 0;
            background: rgba(244,196,48,.12); border: 1px solid rgba(244,196,48,.25);
            display: flex; align-items: center; justify-content: center; font-size: 1.2rem;
        }
        .referral-step-title {
            color: var(--white); font-weight: 600; margin-bottom: 4px;
        }
        .referral-step-desc {
            color: rgba(255,255,255,.55); font-size: .875rem; line-height: 1.5;
        }
        .referral-visual {
            display: flex; justify-content: center; align-items: center;
        }
        .referral-code-demo {
            background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1);
            border-radius: var(--radius-lg); padding: 40px; text-align: center;
            width: 100%; max-width: 340px;
        }
        .referral-code-label {
            color: rgba(255,255,255,.5); font-size: .8rem; text-transform: uppercase;
            letter-spacing: 1px; margin-bottom: 12px;
        }
        .referral-code-value {
            font-family: 'Playfair Display', serif; font-size: 2rem;
            font-weight: 700; color: var(--gold); letter-spacing: 4px;
            background: rgba(244,196,48,.08); border: 2px dashed rgba(244,196,48,.35);
            border-radius: 10px; padding: 16px 24px; margin-bottom: 20px;
        }
        .referral-rewards {
            display: flex; flex-direction: column; gap: 10px;
        }
        .referral-reward {
            display: flex; align-items: center; justify-content: space-between;
            background: rgba(255,255,255,.04); border-radius: 8px; padding: 10px 14px;
        }
        .referral-reward-name { color: rgba(255,255,255,.7); font-size: .85rem; }
        .referral-reward-val  {
            color: var(--emerald); font-weight: 700; font-size: .85rem;
        }

        /* ════════════════════════════════
           SPIN TO WIN
        ════════════════════════════════ */
        .spin-section { background: var(--off-white); }
        .spin-inner {
            display: grid; grid-template-columns: 1fr 1fr; gap: 80px;
            align-items: center;
        }
        .spin-wheel-preview {
            display: flex; justify-content: center; align-items: center;
        }
        .wheel-container {
            position: relative; width: 280px; height: 280px;
        }
        .wheel-svg { width: 100%; height: 100%; animation: spin-slow 18s linear infinite; }
        @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
        }
        .wheel-center {
            position: absolute; top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            width: 60px; height: 60px; border-radius: 50%;
            background: var(--white); border: 4px solid var(--navy);
            display: flex; align-items: center; justify-content: center;
            font-size: 1.4rem; box-shadow: var(--shadow-md);
            z-index: 2;
        }
        .wheel-pointer {
            position: absolute; top: -18px; left: 50%;
            transform: translateX(-50%);
            width: 0; height: 0;
            border-left: 12px solid transparent;
            border-right: 12px solid transparent;
            border-top: 28px solid var(--navy);
            z-index: 3;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,.2));
        }
        .spin-badges {
            display: flex; flex-wrap: wrap; gap: 10px; margin: 24px 0;
        }
        .spin-badge {
            background: var(--white); border: 1.5px solid var(--gray-200);
            border-radius: 50px; padding: 6px 16px; font-size: .85rem;
            font-weight: 600; color: var(--navy); display: flex; align-items: center; gap: 6px;
        }
        .spin-badge.gold   { background: rgba(244,196,48,.1); border-color: rgba(244,196,48,.4); color: var(--gold-dark); }
        .spin-badge.green  { background: rgba(16,185,129,.1); border-color: rgba(16,185,129,.35); color: var(--emerald); }

        /* ════════════════════════════════
           TESTIMONIALS
        ════════════════════════════════ */
        .testimonials-section { background: var(--white); }
        .testimonials-grid {
            display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px;
        }
        .testimonial-card {
            background: var(--off-white); border-radius: var(--radius-lg);
            padding: 32px; border: 1.5px solid var(--gray-200);
            transition: var(--transition); position: relative;
        }
        .testimonial-card:hover {
            transform: translateY(-4px); border-color: var(--gold);
            box-shadow: var(--shadow-md);
        }
        .testimonial-quote {
            position: absolute; top: 24px; right: 28px;
            font-family: 'Playfair Display', serif; font-size: 4rem;
            color: rgba(244,196,48,.25); line-height: 1;
        }
        .testimonial-stars {
            display: flex; gap: 4px; margin-bottom: 16px;
            color: var(--gold); font-size: 1rem;
        }
        .testimonial-text {
            font-size: .925rem; color: var(--gray-700); line-height: 1.75;
            margin-bottom: 24px; font-style: italic;
        }
        .testimonial-author {
            display: flex; align-items: center; gap: 12px;
        }
        .testimonial-avatar {
            width: 44px; height: 44px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-weight: 700; color: var(--white); font-size: .9rem; flex-shrink: 0;
        }
        .testimonial-name { font-weight: 600; font-size: .9rem; color: var(--navy); }
        .testimonial-role { font-size: .8rem; color: var(--gray-600); }

        /* ════════════════════════════════
           CTA BANNER
        ════════════════════════════════ */
        .cta-banner {
            background: linear-gradient(135deg, var(--navy) 0%, #0D2545 100%);
            position: relative; overflow: hidden;
        }
        .cta-banner::before {
            content: ''; position: absolute; inset: 0;
            background: radial-gradient(ellipse 60% 80% at 80% 50%, rgba(244,196,48,.1) 0%, transparent 60%);
            pointer-events: none;
        }
        .cta-inner {
            text-align: center; position: relative; z-index: 1;
        }
        .cta-title {
            font-size: clamp(1.8rem, 3vw, 2.8rem);
            color: var(--white); margin-bottom: 16px;
        }
        .cta-title em { font-style: normal; color: var(--gold); }
        .cta-subtitle {
            color: rgba(255,255,255,.65); font-size: 1.1rem; margin-bottom: 40px;
        }
        .cta-buttons { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
        .cta-note {
            margin-top: 20px; color: rgba(255,255,255,.4);
            font-size: .8rem; display: flex; align-items: center; gap: 6px;
            justify-content: center;
        }

        /* ════════════════════════════════
           FOOTER
        ════════════════════════════════ */
        .footer {
            background: #060E1A; padding: 64px 0 32px;
        }
        .footer-grid {
            display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px;
            margin-bottom: 48px;
        }
        .footer-brand { }
        .footer-logo {
            display: flex; align-items: center; gap: 10px; margin-bottom: 16px;
            text-decoration: none;
        }
        .footer-logo-circle {
            width: 38px; height: 38px; border-radius: 50%;
            background: linear-gradient(135deg, var(--gold) 0%, var(--gold-dark) 100%);
            display: flex; align-items: center; justify-content: center;
            font-family: 'Playfair Display', serif; font-weight: 700;
            color: var(--navy); font-size: .9rem;
        }
        .footer-logo-text {
            font-family: 'Playfair Display', serif; font-weight: 700;
            color: var(--white); font-size: 1.2rem;
        }
        .footer-logo-text span { color: var(--gold); }
        .footer-desc {
            color: rgba(255,255,255,.45); font-size: .875rem; line-height: 1.7;
            max-width: 260px;
        }
        .footer-social {
            display: flex; gap: 10px; margin-top: 20px;
        }
        .footer-social-link {
            width: 36px; height: 36px; border-radius: 50%;
            background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.1);
            display: flex; align-items: center; justify-content: center;
            text-decoration: none; transition: var(--transition);
            color: rgba(255,255,255,.6); font-size: .85rem;
        }
        .footer-social-link:hover { background: rgba(244,196,48,.15); border-color: rgba(244,196,48,.4); color: var(--gold); }
        .footer-col-title {
            color: var(--white); font-weight: 600; font-size: .9rem;
            letter-spacing: .3px; margin-bottom: 20px;
        }
        .footer-links { list-style: none; }
        .footer-links li { margin-bottom: 10px; }
        .footer-links a {
            color: rgba(255,255,255,.45); text-decoration: none;
            font-size: .875rem; transition: var(--transition);
        }
        .footer-links a:hover { color: var(--gold); padding-left: 4px; }
        .footer-contact-item {
            display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px;
        }
        .footer-contact-icon { color: var(--gold); font-size: .9rem; margin-top: 2px; flex-shrink: 0; }
        .footer-contact-text { color: rgba(255,255,255,.45); font-size: .875rem; line-height: 1.5; }
        .footer-divider {
            border: none; border-top: 1px solid rgba(255,255,255,.07);
            margin-bottom: 28px;
        }
        .footer-bottom {
            display: flex; align-items: center; justify-content: space-between;
            flex-wrap: wrap; gap: 12px;
        }
        .footer-copyright {
            color: rgba(255,255,255,.3); font-size: .8rem;
        }
        .footer-bottom-links {
            display: flex; gap: 20px;
        }
        .footer-bottom-links a {
            color: rgba(255,255,255,.3); text-decoration: none; font-size: .8rem;
            transition: var(--transition);
        }
        .footer-bottom-links a:hover { color: var(--gold); }

        /* ════════════════════════════════
           WHATSAPP BUTTON
        ════════════════════════════════ */
        .whatsapp-float {
            position: fixed; bottom: 28px; right: 28px; z-index: 9999;
            width: 60px; height: 60px; border-radius: 50%;
            background: #25D366; box-shadow: 0 8px 28px rgba(37,211,102,.5);
            display: flex; align-items: center; justify-content: center;
            text-decoration: none; transition: var(--transition);
        }
        .whatsapp-float:hover {
            transform: scale(1.1) translateY(-3px);
            box-shadow: 0 12px 36px rgba(37,211,102,.6);
        }
        .whatsapp-float svg { width: 30px; height: 30px; }
        .whatsapp-tooltip {
            position: absolute; right: 70px; background: var(--navy);
            color: var(--white); padding: 8px 14px; border-radius: 8px;
            font-size: .8rem; font-weight: 500; white-space: nowrap;
            opacity: 0; pointer-events: none; transition: var(--transition);
        }
        .whatsapp-float:hover .whatsapp-tooltip { opacity: 1; }
        .whatsapp-tooltip::after {
            content: ''; position: absolute; left: 100%; top: 50%; transform: translateY(-50%);
            border: 6px solid transparent; border-left-color: var(--navy);
        }

        /* ════════════════════════════════
           RESPONSIVE
        ════════════════════════════════ */
        @media (max-width: 1024px) {
            .hero-grid   { grid-template-columns: 1fr; gap: 48px; }
            .hero-visual { justify-content: center; }
            .hero h1     { text-align: center; }
            .hero-subtitle { text-align: center; margin: 0 auto 40px; }
            .hero-ctas   { justify-content: center; }
            .hero-badge  { display: flex; width: fit-content; margin: 0 auto 28px; }
            .pricing-grid { grid-template-columns: 1fr; max-width: 420px; margin: 0 auto; }
            .pricing-card.featured { transform: scale(1); }
            .pricing-card.featured:hover { transform: translateY(-6px); }
            .steps-grid::before { display: none; }
            .steps-grid  { grid-template-columns: 1fr; gap: 32px; }
            .referral-inner { grid-template-columns: 1fr; gap: 48px; }
            .spin-inner  { grid-template-columns: 1fr; gap: 48px; text-align: center; }
            .spin-badges { justify-content: center; }
            .testimonials-grid { grid-template-columns: 1fr; }
            .footer-grid { grid-template-columns: 1fr 1fr; gap: 36px; }
        }
        @media (max-width: 768px) {
            .section  { padding: 72px 0; }
            .nav-links { display: none; }
            .hamburger { display: flex; }
            .nav-mobile {
                display: none; position: absolute; top: 100%; left: 0; right: 0;
                background: var(--navy); border-top: 1px solid rgba(255,255,255,.08);
                padding: 16px 24px; flex-direction: column; gap: 4px;
            }
            .nav-mobile.open { display: flex; }
            .nav-mobile .btn { width: 100%; justify-content: center; }
            .nav-mobile .nav-link { padding: 12px 16px; }
            .nav { position: relative; }
            .stat-item { padding: 12px 20px; }
            .stats-row { gap: 0; }
            .footer-grid { grid-template-columns: 1fr; gap: 28px; }
            .footer-bottom { flex-direction: column; align-items: flex-start; }
            .hero { padding: 80px 0 72px; }
            .pricing-grid { max-width: 100%; }
        }
        @media (max-width: 480px) {
            .stat-item + .stat-item { border-left: none; border-top: 1px solid rgba(10,22,40,.15); }
            .stats-row { flex-direction: column; }
            .hero-ctas { flex-direction: column; align-items: stretch; }
            .hero-ctas .btn { justify-content: center; }
            .cta-buttons { flex-direction: column; align-items: stretch; }
            .cta-buttons .btn { justify-content: center; }
            .whatsapp-float { bottom: 20px; right: 20px; width: 52px; height: 52px; }
        }
    </style>
</head>
<body>

<!-- ════════════════ NAVIGATION ════════════════ -->
<nav class="nav" id="nav">
    <div class="nav-inner">
        <a href="/" class="nav-logo">
            <div class="nav-logo-circle">GG</div>
            <span class="nav-logo-text">Grades <span>Guru</span></span>
        </a>
        <div class="nav-links">
            <a href="#pricing"      class="nav-link">Pricing</a>
            <a href="#how-it-works" class="nav-link">How It Works</a>
            <a href="#testimonials" class="nav-link">Reviews</a>
            <a href="login.php"     class="btn btn-outline btn-sm">Login</a>
            <a href="signup.php"    class="btn btn-gold btn-sm">Sign Up Free</a>
        </div>
        <button class="hamburger" id="hamburger" aria-label="Toggle menu">
            <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <line x1="3" y1="7" x2="21" y2="7"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="17" x2="21" y2="17"/>
            </svg>
        </button>
    </div>
    <div class="nav-mobile" id="navMobile">
        <a href="#pricing"      class="nav-link">Pricing</a>
        <a href="#how-it-works" class="nav-link">How It Works</a>
        <a href="#testimonials" class="nav-link">Reviews</a>
        <a href="login.php"     class="btn btn-outline btn-sm">Login</a>
        <a href="signup.php"    class="btn btn-gold btn-sm">Sign Up Free</a>
    </div>
</nav>

<!-- ════════════════ HERO ════════════════ -->
<section class="hero">
    <div class="container">
        <div class="hero-grid">
            <div class="hero-content">
                <div class="hero-badge">
                    <span class="hero-badge-dot"></span>
                    Trusted by 500+ Students
                </div>
                <h1>Academic <em>Excellence,</em> Simplified</h1>
                <p class="hero-subtitle">
                    Professional academic writing, technical assignments, and data analysis — delivered on time, every time. Your success is our expertise.
                </p>
                <div class="hero-ctas">
                    <a href="signup.php" class="btn btn-gold btn-lg">
                        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                        Sign Up Free
                    </a>
                    <a href="https://wa.me/<?= WHATSAPP_NUMBER ?>" target="_blank" rel="noopener" class="btn btn-outline btn-lg">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        WhatsApp Us
                    </a>
                </div>
            </div>
            <div class="hero-visual">
                <div class="hero-card">
                    <div class="hero-card-header">
                        <div class="hero-card-icon">📚</div>
                        <div>
                            <div class="hero-card-title">Order Dashboard</div>
                            <div class="hero-card-sub">Track your assignments</div>
                        </div>
                    </div>
                    <div class="hero-order-item">
                        <div class="hero-order-icon">📝</div>
                        <div>
                            <div class="hero-order-name">Business Report</div>
                            <div style="font-size:.75rem;color:rgba(255,255,255,.45);">2,400 words · Simple</div>
                        </div>
                        <div class="hero-order-badge">In Progress</div>
                    </div>
                    <div class="hero-order-item">
                        <div class="hero-order-icon">📊</div>
                        <div>
                            <div class="hero-order-name">Data Analysis (Python)</div>
                            <div style="font-size:.75rem;color:rgba(255,255,255,.45);">Technical · Excel + Charts</div>
                        </div>
                        <div class="hero-order-badge">Completed</div>
                    </div>
                    <div class="hero-stat-row">
                        <div class="hero-stat">
                            <span class="hero-stat-val">98%</span>
                            <span class="hero-stat-lbl">Satisfaction</span>
                        </div>
                        <div class="hero-stat">
                            <span class="hero-stat-val">24/7</span>
                            <span class="hero-stat-lbl">Support</span>
                        </div>
                        <div class="hero-stat">
                            <span class="hero-stat-val">500+</span>
                            <span class="hero-stat-lbl">Orders</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- ════════════════ STATS BAR ════════════════ -->
<div class="stats-bar">
    <div class="container">
        <div class="stats-row">
            <div class="stat-item">
                <div class="stat-icon">🎓</div>
                <div>
                    <div class="stat-val">500+</div>
                    <div class="stat-lbl">Orders Completed</div>
                </div>
            </div>
            <div class="stat-item">
                <div class="stat-icon">⭐</div>
                <div>
                    <div class="stat-val">98%</div>
                    <div class="stat-lbl">Satisfaction Rate</div>
                </div>
            </div>
            <div class="stat-item">
                <div class="stat-icon">🕐</div>
                <div>
                    <div class="stat-val">24/7</div>
                    <div class="stat-lbl">Support Available</div>
                </div>
            </div>
            <div class="stat-item">
                <div class="stat-icon">✅</div>
                <div>
                    <div class="stat-val">100%</div>
                    <div class="stat-lbl">Original Work</div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- ════════════════ PRICING ════════════════ -->
<section class="section" id="pricing">
    <div class="container">
        <div class="section-head">
            <div class="section-tag">Transparent Pricing</div>
            <h2 class="section-title">Simple, Honest Rates</h2>
            <p class="section-subtitle">No hidden fees. Pay per word for exactly what you need.</p>
        </div>
        <div class="pricing-grid">

            <!-- Card 1: Simple -->
            <div class="pricing-card">
                <div class="pricing-icon simple">📝</div>
                <div class="pricing-plan-name">Simple Assignments</div>
                <div class="pricing-desc">Perfect for standard academic tasks and reports</div>
                <div class="pricing-price">
                    <span class="pricing-amount">1.5</span>
                    <span class="pricing-unit"> PKR / word</span>
                </div>
                <ul class="pricing-features">
                    <li><span class="check">✓</span> Essays &amp; Research Papers</li>
                    <li><span class="check">✓</span> Business Reports</li>
                    <li><span class="check">✓</span> Assignment Templates</li>
                    <li><span class="check">✓</span> Business Management</li>
                    <li><span class="check">✓</span> 100% Original Content</li>
                    <li><span class="check">✓</span> Free Revisions</li>
                    <li><span class="check">✓</span> On-Time Delivery</li>
                </ul>
                <a href="signup.php" class="btn btn-navy" style="width:100%;justify-content:center;">Get Started</a>
            </div>

            <!-- Card 2: Technical (FEATURED) -->
            <div class="pricing-card featured">
                <div class="featured-badge">⚡ Most Popular</div>
                <div class="pricing-icon tech">💻</div>
                <div class="pricing-plan-name">Technical Assignments</div>
                <div class="pricing-desc" style="color:rgba(255,255,255,.55);">Advanced technical work requiring specialized skills</div>
                <div class="pricing-price">
                    <span class="pricing-amount">3</span>
                    <span class="pricing-unit"> PKR / word</span>
                </div>
                <ul class="pricing-features">
                    <li><span class="check">✓</span> Excel &amp; Spreadsheets</li>
                    <li><span class="check">✓</span> Power BI Dashboards</li>
                    <li><span class="check">✓</span> Python &amp; Data Science</li>
                    <li><span class="check">✓</span> Data Analysis &amp; Viz</li>
                    <li><span class="check">✓</span> Coding Assignments</li>
                    <li><span class="check">✓</span> Priority Support</li>
                    <li><span class="check">✓</span> Expert Specialists</li>
                </ul>
                <a href="signup.php" class="btn btn-gold" style="width:100%;justify-content:center;">Get Started</a>
            </div>

            <!-- Card 3: Custom -->
            <div class="pricing-card">
                <div class="pricing-icon custom">🎯</div>
                <div class="pricing-plan-name">Custom / Lengthy</div>
                <div class="pricing-desc">Complex, multi-chapter or highly specialized work</div>
                <div class="pricing-price">
                    <div class="pricing-contact">Contact Us</div>
                    <span class="pricing-unit">Admin sets custom price</span>
                </div>
                <ul class="pricing-features">
                    <li><span class="check">✓</span> Dissertations &amp; Theses</li>
                    <li><span class="check">✓</span> Complex Projects</li>
                    <li><span class="check">✓</span> Multi-chapter Work</span></li>
                    <li><span class="check">✓</span> Custom Requirements</li>
                    <li><span class="check">✓</span> Dedicated Writer</li>
                    <li><span class="check">✓</span> Direct Consultation</li>
                    <li><span class="check">✓</span> Flexible Timeline</li>
                </ul>
                <a href="https://wa.me/<?= WHATSAPP_NUMBER ?>" target="_blank" rel="noopener" class="btn btn-emerald" style="width:100%;justify-content:center;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    WhatsApp Us
                </a>
            </div>

        </div>
    </div>
</section>

<!-- ════════════════ HOW IT WORKS ════════════════ -->
<section class="section how-section" id="how-it-works">
    <div class="container">
        <div class="section-head">
            <div class="section-tag">Simple Process</div>
            <h2 class="section-title">How It Works</h2>
            <p class="section-subtitle">Get your assignment done in three easy steps</p>
        </div>
        <div class="steps-grid">
            <div class="step-card">
                <div class="step-number">
                    <span class="step-badge">1</span>
                    💬
                </div>
                <h3 class="step-title">Place Order via WhatsApp</h3>
                <p class="step-desc">Send us your assignment details, topic, word count, and deadline on WhatsApp. We'll confirm the price and timeline within minutes.</p>
            </div>
            <div class="step-card">
                <div class="step-number">
                    <span class="step-badge">2</span>
                    📊
                </div>
                <h3 class="step-title">Track Progress Here</h3>
                <p class="step-desc">Sign up to access your personal portal. Watch your order status update in real time — from "In Progress" to "Ready for Review."</p>
            </div>
            <div class="step-card">
                <div class="step-number">
                    <span class="step-badge">3</span>
                    🎓
                </div>
                <h3 class="step-title">Receive &amp; Pay</h3>
                <p class="step-desc">Download your completed assignment, review it, and pay once you're satisfied. No payment upfront for new clients.</p>
            </div>
        </div>
    </div>
</section>

<!-- ════════════════ REFERRAL BENEFITS ════════════════ -->
<section class="section referral-section">
    <div class="container">
        <div class="referral-inner">
            <div>
                <div class="section-tag dark">Refer &amp; Earn</div>
                <h2 class="section-title" style="color:var(--white);margin-bottom:12px;">
                    Share the Love,<br><span style="color:var(--gold);">Earn Discounts</span>
                </h2>
                <p class="section-subtitle light">
                    Every friend you refer earns you a 5% discount on your next order. Stack up to 25% off — that's 5 referrals to maximum savings!
                </p>
                <div class="referral-steps">
                    <div class="referral-step">
                        <div class="referral-step-icon">🔗</div>
                        <div>
                            <div class="referral-step-title">Share Your Unique Code</div>
                            <div class="referral-step-desc">Get your personal referral code when you sign up. Share it anywhere.</div>
                        </div>
                    </div>
                    <div class="referral-step">
                        <div class="referral-step-icon">👥</div>
                        <div>
                            <div class="referral-step-title">Friend Signs Up</div>
                            <div class="referral-step-desc">Your friend creates an account using your code. No purchase needed.</div>
                        </div>
                    </div>
                    <div class="referral-step">
                        <div class="referral-step-icon">💰</div>
                        <div>
                            <div class="referral-step-title">You Earn 5% Discount</div>
                            <div class="referral-step-desc">Your discount is added automatically. Stack multiple referrals up to 25% off.</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="referral-visual">
                <div class="referral-code-demo">
                    <div class="referral-code-label">Your Referral Code</div>
                    <div class="referral-code-value">ALIR7K2P</div>
                    <div style="color:rgba(255,255,255,.4);font-size:.8rem;margin-bottom:20px;">Generated when you sign up</div>
                    <div class="referral-rewards">
                        <div class="referral-reward">
                            <span class="referral-reward-name">1 Referral</span>
                            <span class="referral-reward-val">+5% Discount</span>
                        </div>
                        <div class="referral-reward">
                            <span class="referral-reward-name">3 Referrals</span>
                            <span class="referral-reward-val">+15% Discount</span>
                        </div>
                        <div class="referral-reward">
                            <span class="referral-reward-name">5 Referrals</span>
                            <span class="referral-reward-val">+25% Max!</span>
                        </div>
                    </div>
                    <a href="signup.php" class="btn btn-gold" style="width:100%;justify-content:center;margin-top:24px;">Get My Code</a>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- ════════════════ SPIN TO WIN ════════════════ -->
<section class="section spin-section">
    <div class="container">
        <div class="spin-inner">
            <div class="spin-wheel-preview">
                <div class="wheel-container">
                    <div class="wheel-pointer"></div>
                    <svg class="wheel-svg" viewBox="0 0 200 200">
                        <circle cx="100" cy="100" r="98" fill="none" stroke="#E9ECEF" stroke-width="2"/>
                        <!-- 8 segments -->
                        <path d="M100 100 L100 2 A98 98 0 0 1 169.3 30.7 Z" fill="#F4C430"/>
                        <path d="M100 100 L169.3 30.7 A98 98 0 0 1 198 100 Z" fill="#10B981"/>
                        <path d="M100 100 L198 100 A98 98 0 0 1 169.3 169.3 Z" fill="#F4C430" opacity=".7"/>
                        <path d="M100 100 L169.3 169.3 A98 98 0 0 1 100 198 Z" fill="#0A1628"/>
                        <path d="M100 100 L100 198 A98 98 0 0 1 30.7 169.3 Z" fill="#10B981" opacity=".7"/>
                        <path d="M100 100 L30.7 169.3 A98 98 0 0 1 2 100 Z" fill="#F4C430"/>
                        <path d="M100 100 L2 100 A98 98 0 0 1 30.7 30.7 Z" fill="#10B981"/>
                        <path d="M100 100 L30.7 30.7 A98 98 0 0 1 100 2 Z" fill="#0A1628" opacity=".8"/>
                        <!-- Labels -->
                        <text x="140" y="62"  text-anchor="middle" fill="white" font-size="8" font-weight="bold" transform="rotate(22.5,140,62)">10%</text>
                        <text x="164" y="100" text-anchor="middle" fill="white" font-size="8" font-weight="bold">5%</text>
                        <text x="140" y="140" text-anchor="middle" fill="#0A1628" font-size="7" font-weight="bold" transform="rotate(-22.5,140,140)">Free</text>
                        <text x="100" y="172" text-anchor="middle" fill="white" font-size="8" font-weight="bold">15%</text>
                        <text x="60"  y="140" text-anchor="middle" fill="white" font-size="7" font-weight="bold" transform="rotate(22.5,60,140)">Free</text>
                        <text x="38"  y="100" text-anchor="middle" fill="#0A1628" font-size="7" font-weight="bold">20%</text>
                        <text x="60"  y="62"  text-anchor="middle" fill="white" font-size="8" font-weight="bold" transform="rotate(-22.5,60,62)">25%</text>
                        <text x="100" y="30"  text-anchor="middle" fill="white" font-size="7" font-weight="bold">5%</text>
                    </svg>
                    <div class="wheel-center">🎯</div>
                </div>
            </div>
            <div>
                <div class="section-tag">New Member Perk</div>
                <h2 class="section-title" style="color:var(--navy);">Spin to Win <span style="color:var(--gold);">Discounts!</span></h2>
                <p style="color:var(--gray-600);font-size:1.05rem;line-height:1.7;margin:16px 0 24px;">
                    Every new member gets <strong>one free spin</strong> of the reward wheel after signing up. Land on discounts from 5% all the way up to 25% off your first order!
                </p>
                <div class="spin-badges">
                    <div class="spin-badge gold">🎰 Up to 25% Off</div>
                    <div class="spin-badge green">✅ One Free Spin</div>
                    <div class="spin-badge">🎁 Instant Reward</div>
                    <div class="spin-badge gold">⚡ New Members Only</div>
                </div>
                <div style="background:linear-gradient(135deg,#F8F9FA,#FFF);border:1.5px solid var(--gray-200);border-radius:14px;padding:24px;margin-top:12px;">
                    <div style="font-weight:600;color:var(--navy);margin-bottom:8px;">Possible Prizes:</div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                        <div style="display:flex;align-items:center;gap:8px;font-size:.875rem;color:var(--gray-700);"><span style="color:var(--gold);">●</span>5% Discount</div>
                        <div style="display:flex;align-items:center;gap:8px;font-size:.875rem;color:var(--gray-700);"><span style="color:var(--emerald);">●</span>10% Discount</div>
                        <div style="display:flex;align-items:center;gap:8px;font-size:.875rem;color:var(--gray-700);"><span style="color:var(--gold);">●</span>15% Discount</div>
                        <div style="display:flex;align-items:center;gap:8px;font-size:.875rem;color:var(--gray-700);"><span style="color:var(--emerald);">●</span>20% Discount</div>
                        <div style="display:flex;align-items:center;gap:8px;font-size:.875rem;color:var(--gray-700);"><span style="color:var(--gold);">●</span>25% Discount</div>
                        <div style="display:flex;align-items:center;gap:8px;font-size:.875rem;color:var(--gray-700);"><span style="color:var(--gray-400);">●</span>Free Bonus</div>
                    </div>
                </div>
                <a href="signup.php" class="btn btn-gold btn-lg" style="margin-top:24px;">
                    🎰 Sign Up &amp; Spin Now
                </a>
            </div>
        </div>
    </div>
</section>

<!-- ════════════════ TESTIMONIALS ════════════════ -->
<section class="section testimonials-section" id="testimonials">
    <div class="container">
        <div class="section-head">
            <div class="section-tag">Student Reviews</div>
            <h2 class="section-title">What Students Say</h2>
            <p class="section-subtitle">Thousands of students trust Grades Guru for their academic success</p>
        </div>
        <div class="testimonials-grid">

            <div class="testimonial-card">
                <div class="testimonial-quote">"</div>
                <div class="testimonial-stars">★★★★★</div>
                <p class="testimonial-text">
                    "Absolutely amazing service. My business management report was delivered 2 days early and was exactly what I needed. The quality was far beyond my expectations."
                </p>
                <div class="testimonial-author">
                    <div class="testimonial-avatar" style="background:linear-gradient(135deg,#0A1628,#112240);">AK</div>
                    <div>
                        <div class="testimonial-name">Ayesha Khan</div>
                        <div class="testimonial-role">MBA Student, Karachi</div>
                    </div>
                </div>
            </div>

            <div class="testimonial-card">
                <div class="testimonial-quote">"</div>
                <div class="testimonial-stars">★★★★★</div>
                <p class="testimonial-text">
                    "The Python data analysis assignment was perfect — clean code, proper visualizations, and full explanation. My professor was impressed. Definitely using again!"
                </p>
                <div class="testimonial-author">
                    <div class="testimonial-avatar" style="background:linear-gradient(135deg,#10B981,#0D9668);">MH</div>
                    <div>
                        <div class="testimonial-name">Muhammad Hassan</div>
                        <div class="testimonial-role">CS Student, Lahore</div>
                    </div>
                </div>
            </div>

            <div class="testimonial-card">
                <div class="testimonial-quote">"</div>
                <div class="testimonial-stars">★★★★★</div>
                <p class="testimonial-text">
                    "I referred 3 friends and got 15% off my dissertation. The quality is consistently excellent and the WhatsApp communication makes everything so convenient."
                </p>
                <div class="testimonial-author">
                    <div class="testimonial-avatar" style="background:linear-gradient(135deg,#F4C430,#D4A820);color:#0A1628;">SR</div>
                    <div>
                        <div class="testimonial-name">Sara Raza</div>
                        <div class="testimonial-role">Final Year, Islamabad</div>
                    </div>
                </div>
            </div>

        </div>
    </div>
</section>

<!-- ════════════════ CTA BANNER ════════════════ -->
<section class="section-sm cta-banner">
    <div class="container">
        <div class="cta-inner">
            <h2 class="cta-title">Ready to <em>Ace Your Assignments?</em></h2>
            <p class="cta-subtitle">Sign up now, spin the wheel, and win your first discount — then place your first order in minutes.</p>
            <div class="cta-buttons">
                <a href="signup.php" class="btn btn-gold btn-lg">
                    🎓 Create Free Account
                </a>
                <a href="https://wa.me/<?= WHATSAPP_NUMBER ?>" target="_blank" rel="noopener" class="btn btn-outline btn-lg">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    Chat on WhatsApp
                </a>
            </div>
            <p class="cta-note">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                No credit card required &bull; Free to join &bull; Cancel anytime
            </p>
        </div>
    </div>
</section>

<!-- ════════════════ FOOTER ════════════════ -->
<footer class="footer">
    <div class="container">
        <div class="footer-grid">
            <div class="footer-brand">
                <a href="/" class="footer-logo">
                    <div class="footer-logo-circle">GG</div>
                    <span class="footer-logo-text">Grades <span>Guru</span></span>
                </a>
                <p class="footer-desc">
                    Pakistan's trusted platform for professional academic writing and technical assignments. Quality, integrity, and results.
                </p>
                <div class="footer-social">
                    <a href="https://wa.me/<?= WHATSAPP_NUMBER ?>" class="footer-social-link" target="_blank" rel="noopener" aria-label="WhatsApp">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </a>
                </div>
            </div>
            <div>
                <div class="footer-col-title">Quick Links</div>
                <ul class="footer-links">
                    <li><a href="#pricing">Pricing</a></li>
                    <li><a href="#how-it-works">How It Works</a></li>
                    <li><a href="#testimonials">Reviews</a></li>
                    <li><a href="signup.php">Sign Up</a></li>
                    <li><a href="login.php">Login</a></li>
                </ul>
            </div>
            <div>
                <div class="footer-col-title">Services</div>
                <ul class="footer-links">
                    <li><a href="signup.php">Simple Assignments</a></li>
                    <li><a href="signup.php">Technical Work</a></li>
                    <li><a href="https://wa.me/<?= WHATSAPP_NUMBER ?>">Custom Projects</a></li>
                    <li><a href="signup.php">Data Analysis</a></li>
                    <li><a href="signup.php">Python &amp; Coding</a></li>
                </ul>
            </div>
            <div>
                <div class="footer-col-title">Contact Us</div>
                <div class="footer-contact-item">
                    <span class="footer-contact-icon">📱</span>
                    <span class="footer-contact-text">+92 300 1234567</span>
                </div>
                <div class="footer-contact-item">
                    <span class="footer-contact-icon">📧</span>
                    <span class="footer-contact-text">admin@gradesguru.com</span>
                </div>
                <div class="footer-contact-item">
                    <span class="footer-contact-icon">🕐</span>
                    <span class="footer-contact-text">24/7 WhatsApp Support</span>
                </div>
                <div class="footer-contact-item">
                    <span class="footer-contact-icon">📍</span>
                    <span class="footer-contact-text">Pakistan (Online Service)</span>
                </div>
            </div>
        </div>
        <hr class="footer-divider">
        <div class="footer-bottom">
            <div class="footer-copyright">
                &copy; <?= date('Y') ?> Grades Guru. All rights reserved. Powered by expertise.
            </div>
            <div class="footer-bottom-links">
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Service</a>
                <a href="#">Refund Policy</a>
            </div>
        </div>
    </div>
</footer>

<!-- ════════════════ WHATSAPP FLOAT ════════════════ -->
<a href="https://wa.me/<?= WHATSAPP_NUMBER ?>" class="whatsapp-float" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">
    <div class="whatsapp-tooltip">Chat with us!</div>
    <svg viewBox="0 0 24 24" fill="white">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
</a>

<script>
// Hamburger menu
const hamburger = document.getElementById('hamburger');
const navMobile  = document.getElementById('navMobile');
hamburger.addEventListener('click', () => {
    navMobile.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', navMobile.classList.contains('open'));
});

// Close mobile nav on link click
navMobile.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => navMobile.classList.remove('open'));
});

// Smooth scroll offset for sticky nav
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            e.preventDefault();
            const offset = 80;
            window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
        }
    });
});

// Nav scroll shadow
window.addEventListener('scroll', () => {
    const nav = document.getElementById('nav');
    nav.style.boxShadow = window.scrollY > 20
        ? '0 4px 24px rgba(0,0,0,.3)'
        : 'none';
});
</script>

</body>
</html>
