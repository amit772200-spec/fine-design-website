# Fine Design — Design System

Hebrew RTL boutique studio for event invitations. The aesthetic is **editorial boutique warmth**: magazine-grade typography, generous whitespace, warm terracotta accent, intimate-but-premium tone.

---

## Voice & Tone

- Hebrew first. No mixed-language UI (exception: brand mark "Fine Design", and the term "SAVE THE DATE").
- Intimate, never corporate. Talks *with* the customer, not *at* her.
- Warm but precise. Specific verbs ("נעצב יחד", "בואו נדבר") beat generic ones ("צרו קשר").
- No emojis, ever. No icon-fonts of brand logos (WhatsApp/Instagram glyphs). Text links only.

---

## Color tokens

```css
--ink:        #1a1612;   /* primary text, headings — warm near-black */
--ink-soft:   #544a3e;   /* secondary text, meta */
--paper:      #fbf7f2;   /* page background — warm off-white */
--paper-tint: #f3ebe0;   /* alt section bg */
--clay:       #c9684e;   /* PRIMARY ACCENT — terracotta CTA */
--clay-deep:  #a44e36;   /* hover/pressed clay */
--blush:      #f0d9cf;   /* soft pink accent surface */
--rose-gold:  #b8775c;   /* secondary luxe accent */
--line:       #e8ddd0;   /* dividers, card borders */
--surface:    #ffffff;   /* cards, panels */
--shadow-sm:  0 1px 4px rgba(26,22,18,0.06);
--shadow-md:  0 8px 28px rgba(26,22,18,0.10);
--shadow-lg:  0 20px 60px rgba(26,22,18,0.16);
```

Never use raw hex in components. Always go through the token.

---

## Typography

**Families** (already loaded via Google Fonts):
- `Frank Ruhl Libre` — display/headings (Hebrew serif with elegant terminals)
- `Heebo` — body/UI (Hebrew sans, neutral, highly legible)

**Scale** (fluid):
```css
--text-eyebrow:  0.75rem;                /* 12px caps */
--text-meta:     0.875rem;               /* 14px */
--text-body:     1.0625rem;              /* 17px — comfortable for RTL Hebrew */
--text-lede:     1.25rem;                /* 20px intro paragraph */
--text-h4:       clamp(1.125rem, 1.6vw, 1.375rem);
--text-h3:       clamp(1.375rem, 2vw, 1.75rem);
--text-h2:       clamp(2rem, 5vw, 3.25rem);
--text-h1:       clamp(3rem, 8vw, 6.5rem);
```

**Rules:**
- Hero H1 is always `--text-h1` with negative letter-spacing `-0.015em` and line-height `0.95`.
- Section H2 always preceded by an **eyebrow** (`.eyebrow` — uppercase caps, 12px, letter-spacing `0.2em`, color `--clay`).
- Body line-height `1.7` for paragraphs, `1.3` for headings.

---

## Spacing scale

8px rhythm:
```
--space-1:   8px
--space-2:  16px
--space-3:  24px
--space-4:  32px
--space-5:  48px
--space-6:  64px
--space-7:  96px
--space-8: 144px  /* large section padding on desktop */
```

Section vertical padding: `clamp(64px, 10vw, 144px)`.
Container max-width: `1240px` (slightly wider than before to let the editorial grid breathe).

---

## Radii & borders

- `--radius-sm: 4px` (inputs, small chips)
- `--radius-md: 12px` (cards, modals)
- `--radius-lg: 24px` (hero floating cards, feature surfaces)
- Pills (CTAs): `999px` — soft, feminine, modern.
- Hairline divider: `1px solid var(--line)`.

---

## Motion

- `--ease: cubic-bezier(0.2, 0.7, 0.2, 1)` (gentle, anticipatory)
- `--ease-out: cubic-bezier(0, 0, 0.2, 1)`
- Durations: `150ms` (state), `300ms` (transitions), `600ms` (scroll-reveals).
- **Respect `prefers-reduced-motion`** — full disable inside `@media (prefers-reduced-motion: reduce)`.

---

## Components

### Buttons
Two primary shapes — both pill (`border-radius: 999px`), generous padding `14px 32px`, font 600.

```css
.btn--primary  { background: var(--clay); color: #fff; }
.btn--primary:hover { background: var(--clay-deep); transform: translateY(-1px); }

.btn--ghost    { background: transparent; color: var(--ink); border: 1.5px solid var(--ink); }
.btn--ghost:hover { background: var(--ink); color: var(--paper); }
```

Min height 48px (touch).

### Eyebrow
```html
<span class="eyebrow">01 · Studio</span>
```
12px caps, letter-spacing `0.2em`, color `--clay`, font-family `Heebo` 600.

### Card (.category-card, .invitation-card)
- `background: var(--surface)`
- `border-radius: var(--radius-md)`
- `box-shadow: var(--shadow-sm)` → on hover `var(--shadow-md)` + `translateY(-6px)`
- Image area: aspect `4/5` (more poster-like than the previous `4/3`), `object-fit: cover`.
- Title `Frank Ruhl Libre`, 1.0625rem, 700.

### Floating hero stack
Three cards layered with rotations (`-4deg`, `+6deg`, `-2deg`), each ~280px wide, gradient backgrounds (`linear-gradient(135deg, var(--blush) 0%, #fff 60%)`), each showing **mocked Hebrew couple-names and date** in `Frank Ruhl Libre` so visitors instantly read it as an invitation preview.

### Marquee
Decorative horizontal strip between hero and grid. Single line, animation `45s linear infinite`. Items separated by a small middle-dot `·`. Pauses on `:hover`.

### Section header
```
[eyebrow]
[H2 — large editorial]
[lede paragraph, max 56ch, color --ink-soft]
```
Always left-aligned in RTL (so `text-align: start`) except hero & contact-CTA which are center-aligned.

---

## Layout patterns

### Asymmetric category grid (desktop)
```
[ wide 2x  ][ 1x ]
[ 1x ][ 1x ][ 1x ]
[ 1x ][ wide 2x  ]
[ 1x ][ 1x ][ 1x ]
```
Implemented via CSS Grid: `grid-template-columns: repeat(3, 1fr)`, with `.category-card--wide { grid-column: span 2; }` applied to selected cards. Tablets collapse to 2 columns; mobile to 1.

### Header (two-row centered)
- Row 1 (64px): logo centered with decorative hairlines on both sides.
- Row 2 (52px): horizontal nav, centered, all 10 items in single line. Overflow-x scroll quietly on small viewports until hamburger kicks in at <1024px.

---

## RTL rules (recap from CLAUDE.md)

- `<html dir="rtl" lang="he-IL">` on every page.
- Always `margin-inline-*` / `padding-inline-*`; never bare `margin-left/right`.
- `text-align: start`, never `left`.
- Flexbox / Grid (RTL-aware) instead of floats.

---

## Accessibility (Israeli Standard 5568)

- Accessibility widget (`a11y-widget-btn` + `a11y-panel`) on every page.
- Every `<img>` has Hebrew `alt`.
- Visible focus styles: `outline: 3px solid var(--clay)` with `outline-offset: 3px`.
- Min touch target 44×44px.
- Color contrast AA verified for `--ink` on `--paper` and `--paper` on `--clay`.
