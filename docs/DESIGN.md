# UniSphere Design System: "Say Briefly"

> **Concept**: Creative agency sketchbook on cream paper.
> **Key Traits**: Flat elevations (strict zero shadow), pastel washes, high-contrast darks, and geometric/grotesque typographic dominance.

## Typography
- **Headers / Display**: Bricolage Grotesque (Bold / Black weighting)
- **Body / Interface**: Inter (Regular / Medium / SemiBold weighting)

## Global Geometry
- **Border Radius**: Strictly `6px` (`rounded-[6px]`) across all interactive surfaces (Cards, Inputs, Buttons)
- **Shadows**: None (`shadow-none`, `box-shadow: none !important`). Rely on 2px borders for depth.

## Theme Tokens

### Light Theme
- **Background**: Cream Paper (`#F8F5EC` / `oklch(0.97 0.01 90)`)
- **Primary / Foreground**: Forest Ink (`#1A2E24` / `oklch(0.2 0.03 160)`) — used for text and primary buttons.
- **Card / Surface**: Pure White (`#FFFFFF`) or slight cream.
- **Borders / Muted Elements**: Soft marker lines (`#D2CDC2` / `oklch(0.85 0.01 90)`)
- **Accents**: Pastel washes (e.g. Pastel Yellow `#FCEEA9` / `oklch(0.95 0.1 100)`)
- **Destructive**: Subdued Red (`#E53E3E`)

### Dark Theme (Inverted)
- **Background**: Charcoal Sketchbook (`#141414` / `oklch(0.2 0.01 160)`)
- **Primary / Foreground**: Cream Paper (`#F8F5EC` / `oklch(0.97 0.01 90)`)
- **Card / Surface**: Dark Grey / Dark Forest (`#1C1C1C` / `oklch(0.23 0.01 160)`)
- **Borders / Muted Elements**: Dark borders (`#333333` / `oklch(0.3 0.01 160)`)
- **Accents**: Muted high-contrast washes
- **Destructive**: Rose Red (`#F56565`)

## Implementations
- **Web**: Implemented globally via Tailwind v4 in `apps/web/src/index.css`.
- **Native**: Implemented via global theme objects in `apps/native/lib/constants.ts`.
