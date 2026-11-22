# Accessibility and responsiveness check

B8 technical requirements: responsive on mobile, tablet and desktop, no broken links, alt text, readable contrast, keyboard-friendly navigation.

- **Checked by:** Adeepa Aryaprema (Scrum Master)
- **Date:** 22 November 2026
- **Branch:** `landing-a1-a3` (after the A1 and A2 commits)
- **Tools:** Lighthouse 12 (Accessibility, SEO, Best Practices), axe-core (WCAG 2 A and AA), Playwright for keyboard, link and viewport checks

> **Note on where it was run:** the scores below are from a local production build (`next build` + `next start`), because the live site could not be reached from the test machine. The code is the same. Re-run Lighthouse on https://www.tyode.com before the viva and add the live scores to the table.

## Lighthouse scores (home page)

| Run | Accessibility | SEO | Best Practices |
| --- | --- | --- | --- |
| Before, mobile | 92 | 100 | 96 |
| Before, desktop | 92 | 100 | 96 |
| After fix 1, mobile | 92 | 100 | 96 |
| After fix 1, desktop | 92 | 100 | 96 |
| Live site (tyode.com) | _to fill in_ | | |

Fix 1 removed the How it works closing line from the contrast results. The Accessibility score stays at 92 because Lighthouse fails the whole contrast audit while any element fails it, and the elements still failing are all in Features (fix 2). Once fix 2 and the footer tap targets (fix 3) are in, re-run and add a row: the score should rise to about 98–100.

Best Practices loses points only because the Vercel Analytics and Speed Insights scripts return 404 outside Vercel. On the live site they load normally, so this is not a real issue.

## Checklist

### Images and text alternatives
- [x] Every image has alt text or is marked decorative (Lighthouse `image-alt` passes)
- [x] Every link and button has a name (`link-name`, `button-name` pass)
- [x] The 3D canvases and decorative SVGs are hidden from screen readers (`aria-hidden`)
- [x] The new Today / With Tyode block is a real table with column headers and a caption

### Colour contrast
- [x] **How it works, closing line** ("Nothing lost on the way."): was #8a8a90 on #ececed = 2.9:1. Now #77777c = 3.8:1, passes the 3:1 minimum for large text (fix 1)
- [ ] **Features, closing line** (grey half of the heading): #929293 on #ececed = 2.63:1, needs 3:1
- [ ] **Features, small note under the closing line** (11px): 2.63:1, needs 4.5:1
- [ ] **Features, step names and group labels** (Passport, Containment… and Trace / Check / Explain): flagged on desktop. They are `aria-hidden`, but Lighthouse still checks visible text contrast
- [ ] **/passport, step label ("kicker")**: #949495 on white = 3.03:1, needs 4.5:1
- [ ] **/privacy and /terms, contents list**: #7c7c7d on #ececed = 3.53:1, needs 4.5:1 (26 items)
- [ ] **/privacy and /terms, email links inside text**: only colour sets them apart (2.58:1 against the text). They need an underline.

### Keyboard
- [x] Every link and button on the home page can be reached with Tab, in a logical order (nav, overview, how it works, features, team, footer)
- [x] Every focused element shows a visible focus ring
- [x] "Book a walkthrough" and "Get in touch" open as dialogs. Focus moves inside, stays inside while tabbing, Esc closes, and focus returns to the link that opened it.
- [x] The scroll-driven stage buttons (How it works, Features) are removed from the Tab order and hidden from screen readers. Their content is in the page text, so nothing is lost.
- [ ] **Contact form spam-trap checkbox** has no label, so screen readers announce an unnamed checkbox. It should be hidden from assistive technology (`aria-hidden`).
- [ ] **/passport progress bar** uses `aria-label` on a plain `div`, which screen readers ignore. It needs `role="progressbar"` (or move the text into the page).
- [ ] _Optional:_ add a "Skip to content" link as the first Tab stop

### Touch targets
- [ ] **Footer navigation links** (Overview, How it works, Features, Team) are 22px tall, under the 24px minimum, and sit close together

### Links
- [x] No broken internal links: all 20 internal pages and demo links return 200
- [x] Every `#` anchor on the home page points to a section that exists
- [x] No empty `href="#"` links
- [ ] External links checked by hand (could not be fetched from the test machine):
  - [ ] Cal.com booking page: https://cal.com/tyode-0vitvo/30min
  - [ ] Tyode LinkedIn, Instagram and GitHub
  - [ ] Each team member's LinkedIn and GitHub (10 links)
  - [ ] Email links open a new message (contact@tyode.com and the 5 team addresses)

### Responsive
- [x] 375px (phone): no sideways scrolling, every section fits
- [x] 768px (tablet): no sideways scrolling, every section fits
- [x] 1440px (desktop): no sideways scrolling, every section fits
- [x] The Today / With Tyode table becomes stacked cards under 620px

### SEO basics
- [x] Page title, meta description, `lang="en"`, canonical URL
- [x] Favicon and Apple touch icon
- [x] Open Graph and Twitter preview images with alt text
- [x] `robots.txt` and `sitemap.xml`

## Fixes

| # | Issue | Where | Owner | Status | Commit |
| --- | --- | --- | --- | --- | --- |
| 1 | Closing line contrast | How it works | Adeepa | Done | `0340939` fix(a11y): raise contrast of the how-it-works closing line |
| 2 | Closing line, note and step labels contrast | Features | Teammate (section owner) | Handed over | |
| 3 | Footer link tap size | Footer | Teammate (section owner) | Handed over | |
| 4 | Spam-trap checkbox announced | Contact form | Teammate (section owner) | Handed over | |
| 5 | Progress label and step label contrast | /passport | Teammate (section owner) | Handed over | |
| 6 | Contents list contrast, links in text | /privacy, /terms | Teammate (section owner) | Handed over | |

Items 2–6 were shared in the team chat and are being fixed by the owners of those sections. Each owner should tick their item above, add their commit here, and re-run Lighthouse.
