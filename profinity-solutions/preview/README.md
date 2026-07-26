# Home page preview (single-file showcase)

`home-preview.html` is a self-contained visual preview of the Profinity Solutions
home page. It mirrors the real Next.js site's identity, sections, and copy in one
static HTML file (inline CSS + JS, no build step, no external requests).

Open it directly in a browser, or view the published version:
https://claude.ai/code/artifact/59a6c6f7-73d4-4652-9733-b5230ab3bf03

## What it contains
- Canvas wireframe-cube hero with a word-by-word headline reveal
- Authority / trust strip
- Services grid + Services mega-menu in the nav
- Pain points + interactive ROI calculator (two tabs, live count-up)
- Animated results charts (before/after bars, growth line, progress ring)
- Testimonial carousel + drifting avatar wall
- Sales FAQ accordion
- Cinematic footer (page scrolls over it) with email capture and social row

## Notes for next session
- Copy here was rewritten in a plain human voice with **no em dashes or hyphens**.
  The real Next project (`../lib/site-config.ts` etc.) still uses the earlier copy
  and hyphenated service names — porting the human copy + the canvas hero into the
  Next app is the pending follow-up.
- Avatar wall uses gradient tiles (the artifact sandbox blocks remote images);
  the Next site loads the real photos from `TESTIMONIAL_AVATARS`.
