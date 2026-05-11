# Amit's Design Website

Hebrew RTL event invitations landing page — static HTML/CSS/JS, no build tools.

## Stack

- HTML5 / CSS3 / Vanilla JS
- Google Fonts: `Frank Ruhl Libre` (headings) + `Heebo` (body)
- No dependencies, no build step — open `index.html` directly in browser

## Structure

```
index.html          # Main landing page
pages/              # Category + legal pages
css/style.css       # All styles + design tokens
css/accessibility.css
js/main.js          # Hamburger menu, smooth scroll
js/accessibility.js # Accessibility widget
```

## Design Tokens (css/style.css :root)

| Token | Value | Use |
|---|---|---|
| `--bg` | `#faf8f4` | Page background |
| `--gold` | `#b8955a` | Primary accent |
| `--text` | `#2c2418` | Body text |
| `--text-secondary` | `#7a6e5f` | Captions, meta |
| `--border` | `#e8dfd0` | Dividers, card borders |

## CRITICAL Rules

**RTL:**
- ALWAYS `<html dir="rtl" lang="he-IL">` on every page
- ALWAYS use `margin-inline-start/end` and `padding-inline-start/end` — never bare `margin-left/right`
- NEVER `float: left/right` — use flexbox/grid (RTL-aware)
- NEVER `text-align: left` for body text — use `start`

**Accessibility:**
- Accessibility widget (`css/accessibility.css` + `js/accessibility.js`) MUST be included on every page
- Every `<img>` needs a meaningful `alt` attribute in Hebrew
- All interactive elements need visible focus styles

**Content:**
- All UI text in Hebrew only — exception: "SAVE THE DATE" (brand term)
- NO emojis anywhere in HTML, CSS, or JS
- NO brand icons (WhatsApp logo, social icons) — text links only

**Code style:**
- Mobile-first CSS — use `min-width` breakpoints: `768px` (tablet), `1024px` (desktop)
- CSS custom properties for all colors and spacing
- No inline styles

## Pages

| File | Title |
|---|---|
| `index.html` | דף ראשי |
| `pages/weddings.html` | הזמנות לחתונות |
| `pages/henna.html` | הזמנות לחינה |
| `pages/challah.html` | הזמנות להפרשת חלה |
| `pages/birthdays.html` | הזמנות לימי הולדת ילדים |
| `pages/bar-bat-mitzvah.html` | הזמנות לבר/בת מצווה |
| `pages/brit-milah.html` | הזמנות לברית מילה |
| `pages/mimouna.html` | הזמנות למימונה |
| `pages/menus.html` | תפריטים לאירועים |
| `pages/save-the-date.html` | SAVE THE DATE |
| `pages/privacy.html` | מדיניות פרטיות |
| `pages/terms.html` | תנאי שימוש |

## Accessibility Widget

Controls toggled via CSS classes on `<html>`:
`.a11y-large-text` / `.a11y-readable-font` / `.a11y-high-contrast` / `.a11y-inverted` /
`.a11y-grayscale` / `.a11y-highlight-links` / `.a11y-no-animations` / `.a11y-large-cursor` / `.a11y-keyboard-focus`

Persisted in `localStorage` key `a11y-prefs`.
