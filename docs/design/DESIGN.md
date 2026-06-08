# sceniK Design System

## Overview

sceniK uses a clean institutional blue design language adapted for a K-content travel planner. The app should feel calm, premium, trustworthy, and mobile-first: mostly white canvas, soft gray elevation bands, deep ink text, and one decisive blue accent for primary actions and selected states.

The brand color is sceniK Blue (`--color-primary`, `#0052ff`). Use it sparingly for primary CTA pills, the wordmark, active navigation, selected controls, and inline emphasis. The rest of the interface should be quiet: white surfaces, pale gray cards, hairline borders, and measured spacing.

The strongest visual contrast is a deep near-black editorial surface (`--color-surface-dark`, `#0a0b0d`) used for important product moments such as AI result hero panels, route proof, or product-mockup style sections. Dark surfaces should feel intentional, not decorative.

The official product name is always `sceniK`.

## Key Characteristics

- Single accent color: sceniK Blue (`--color-primary`, `#0052ff`) carries every primary CTA, selected state, active nav state, and brand emphasis.
- Quiet white-canvas product feel: most screens are white or soft gray, not colorful.
- Pretendard is the primary UI font for Korean and English app copy.
- CTA geometry is pill-shaped. Cards use larger rounded corners and subtle hairline borders.
- Shadows are minimal. Use one soft shadow tier only where a card needs slight lift.
- Trading-like semantic colors exist for status text only, not for button fills.
- Home recent places and recommended content must remain horizontally swipeable rails.

## Colors

### Brand And Accent

- sceniK Blue (`--color-primary`, `#0052ff`): primary CTA, wordmark, active bottom nav, selected chips, inline brand links.
- sceniK Blue Active (`--color-primary-active`, `#003ecc`): pressed or active state for primary actions.
- sceniK Blue Disabled (`--color-primary-disabled`, `#a8b8cc`): disabled primary CTAs.
- Accent Yellow (`--color-accent-yellow`, `#f4b000`): small illustrative highlight only. Do not use as a CTA color.

### Surfaces

- Canvas (`--color-canvas`, `#ffffff`): default page and card background.
- Surface Soft (`--color-surface-soft`, `#f7f7f7`): page background and alternating sections.
- Surface Strong (`--color-surface-strong`, `#eef0f3`): secondary button fill, search pill fill, icon plates, low-priority cards.
- Surface Dark (`--color-surface-dark`, `#0a0b0d`): full-bleed or card-level dark hero/product surfaces.
- Surface Dark Elevated (`--color-surface-dark-elevated`, `#16181c`): floating cards inside dark surfaces.

### Hairlines

- Hairline (`--color-hairline`, `#dee1e6`): default 1px divider and card border.
- Hairline Soft (`--color-hairline-soft`, `#eef0f3`): softer separators.
- Hairline Input (`--color-hairline-input`, `#dee1e6`): form input border.

### Text

- Ink (`--color-ink`, `#0a0b0d`): headings, primary body emphasis, top nav text.
- Body (`--color-ink-mute`, `#5b616e`): default running text and card descriptions.
- Muted (`--color-ink-mute-2`, `#7c828a`): metadata, helper copy, captions, secondary nav text.
- Muted Soft (`--color-muted-soft`, `#a8acb3`): disabled or very low-emphasis labels.
- On Primary (`--color-on-primary`, `#ffffff`): text on blue buttons.
- On Dark (`--color-on-dark`, `#ffffff`): text on dark surfaces.
- On Dark Soft (`--color-on-dark-soft`, `#a8acb3`): secondary text on dark surfaces.

### Semantic

- Semantic Up (`--color-semantic-up`, `#05b169`): positive text only.
- Semantic Down (`--color-semantic-down`, `#cf202f`): negative/destructive text only.

## Typography

### Font Family

The app uses Pretendard as the primary font:

`"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", "Segoe UI", Roboto, Helvetica, Arial, sans-serif`

Do not add a remote font dependency. If the local environment does not have Pretendard installed, the system fallback stack is acceptable until local font files are added.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
| --- | --- | --- | --- | --- | --- |
| Display XL | 28px | 400 | 1.08 | -0.4px | Mobile page opener |
| Display LG | 26px | 400 | 1.12 | -0.4px | Result/detail hero titles |
| Title LG | 22px | 600 | 1.2 | -0.2px | Large card or profile titles |
| Title MD | 18px | 600 | 1.33 | 0 | Section headers |
| Title SM | 16px | 600 | 1.25 | 0 | List labels and card titles |
| Body MD | 15px | 400 | 1.5 | 0 | Default UI body |
| Body SM | 13px | 400 | 1.5 | 0 | Cards, comments, helper text |
| Caption | 11px | 400 | 1.5 | 0 | Metadata and nav labels |
| Button | 15-16px | 600 | 1.15 | 0 | CTA pills |
| Numeric | 13-18px | 500-600 | 1.4 | 0 | Counts, dates, route stats |

### Principles

- Display copy stays at moderate weight, usually 400. Avoid heavy 700+ hero titles.
- Body text uses 400. Use 600 for component titles, buttons, tabs, and selected states.
- Negative letter-spacing belongs only to display or large title text.
- Numeric UI should use tabular figures through `font-feature-settings: "tnum"` where practical.

## Layout

### Spacing System

- Base unit: 4px.
- Common spacing: 8px, 12px, 16px, 20px, 24px, 32px.
- Mobile section gap: 16-24px.
- Card internal padding: 12-16px for compact cards, 24px for larger panels.
- Bottom padding must account for the fixed bottom navigation and safe area.

### App Frame

- Mobile canvas max width: 430px.
- App background: white canvas transitioning into soft gray bands.
- Top nav: white translucent surface, 56px high, hairline bottom border.
- Bottom nav: white translucent surface, subtle top shadow, blue active state.

## Elevation And Depth

| Level | Treatment | Use |
| --- | --- | --- |
| Flat | No shadow, no border | Most white surfaces |
| Hairline | 1px `--color-hairline` | Cards, rows, panels |
| Soft Drop | `0 4px 12px rgba(0, 0, 0, 0.04)` | Floating cards, map previews, sheets |
| Dark Editorial | `--color-surface-dark` with elevated cards | AI result hero and product moments |

Avoid stacked heavy shadows. The app should feel crisp, not glossy.

## Shapes

| Token | Value | Use |
| --- | --- | --- |
| `--radius-sm` | 4px | Small badges |
| `--radius-md` | 12px | Inputs and compact media |
| `--radius-lg` | 16px | Standard cards |
| `--radius-xl` | 24px | Large panels and sheets |
| `--radius-pill` | 100px | Buttons, chips, search pills |
| `--radius-full` | 9999px | Avatars and circular icon plates |

Pills are for interactions. Larger card radius is for containers. Sharp corners should be avoided.

## Components

### Top Navigation

`top-nav-light` uses white canvas, ink text, and blue wordmark. It should stay compact, fixed, and quiet.

### Bottom Navigation

The bottom nav order remains:

1. AI Course
2. Explore
3. Home
4. Community
5. My Page

Active state uses sceniK Blue with a pale blue icon plate. Do not add oversized glow or colored shadows.

### Buttons

Primary buttons:

- Background: `--color-primary`
- Active: `--color-primary-active`
- Text: `--color-on-primary`
- Height: 44px minimum
- Radius: `--radius-pill`
- Padding: 12px 20px
- Weight: 600

Secondary buttons use `--color-surface-strong` with ink text and the same pill geometry.

### Chips

Default chips use `--color-surface-strong` with ink text. Selected chips use sceniK Blue with white text. Chips should not have drop shadows.

### Cards

Cards use white background, hairline border, 16-24px radius, and optional soft drop. Most cards should feel flat and editorial. Poster cards should prioritize imagery; place and route cards should keep metadata readable.

### Dark Hero/Product Panels

Use dark editorial panels sparingly for high-value moments:

- AI result summary
- Route proof/trust panel
- Product-mockup style map or itinerary highlights

Text on dark panels must use `--color-on-dark` and `--color-on-dark-soft`.

### Home Rails

Home keeps horizontal swipe rails for:

- Recent viewed places
- Recommended content

Recent place cards show one primary card with a hint of the next card. Recommended content shows roughly 1.5-2 poster cards depending on width. Both rails use `overflow-x: auto` and `scroll-snap-type: x mandatory`.

### Map And Timeline

Map previews use soft gray surfaces, blue route lines, blue pins, and no broken-map feel. Timelines use a blue connector and blue visit-order markers.

## Do

- Use sceniK Blue sparingly and consistently.
- Keep the interface mostly white, gray, and ink.
- Use Pretendard for UI copy.
- Keep CTAs as pills.
- Keep cards calm with hairline borders and minimal shadow.
- Preserve all product behavior, route validation, auth, localStorage, and API contracts during visual passes.

## Do Not

- Do not reintroduce pastel mesh/indigo/ruby-heavy styling.
- Do not use green/teal as the dominant palette.
- Do not use yellow, green, or red as primary action colors.
- Do not add Tailwind, Bootstrap, external UI libraries, or remote fonts.
- Do not add large Home heroes, Home search, or Home top AI Course CTA unless explicitly requested.
- Do not change AI Course generation, route validation, auth behavior, or localStorage keys in a visual-only pass.

## Responsive Behavior

- Mobile first, with 390px as a primary QA width.
- Touch targets should be at least 44px for primary interactive controls.
- Home rails must stay horizontally swipeable on mobile.
- Poster rails show about 1.5-2 cards per viewport.
- Recent place rails show one main card and a next-card hint.
- Desktop/tablet may keep the mobile app frame unless a future task explicitly changes layout.

## Implementation Notes

- Primary token implementation: `frontend/src/styles.css`.
- Behavior source of truth remains Vue views, stores, adapters, and services.
- The visual system must not weaken route validation or verified-place constraints.
- Add local Pretendard font files later only if exact font rendering is required across machines.
