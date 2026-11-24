# DESIGN: ascendai design system (D64-D67)

Premium, minimal, vibrant. Indigo is the brand, lime is the spark, Pip is the mascot. Tokens live in `src/app/globals.css`; Tailwind sees them through `@theme inline`. Always use the token class (`bg-panel`, `text-muted`), never a raw hex.

## Themes
Light and dark are both designed. next-themes follows the system setting by default (`defaultTheme="system"`), toggled from the sidebar/header, settings (system / light / dark) and the command menu. Dark is the `.dark` class on `<html>`. `.paper-doc` re-declares light tokens so resumes stay paper in dark mode.

## Tokens
| Token (Tailwind) | Light | Dark | Use |
|---|---|---|---|
| `bg` / `background` | #F8FAFC | #0A0A0F | page |
| `panel` / `card` | #FFFFFF | #111118 | cards, sidebar, dialogs |
| `soft` / `secondary` / `accent` | #F1F2F8 | #1A1A24 | hover, inset surfaces |
| `line` / `border` | #E4E4EC | #26262F | borders, dividers |
| `text` / `foreground` | #14141F | #F4F4F8 | body text |
| `muted` | #5A5A6E | #A3A3B5 | secondary text |
| `faint` | #6E6E82 | #8C8CA0 | tertiary text, labels (still AA) |
| `primary` | #4F46E5 | #5B52EC | indigo fills, buttons (white text on top) |
| `primary-hover` | #4338CA | #6E66F0 | hover fill |
| `primary-ink` | #4F46E5 | #A5B4FC | indigo used AS TEXT or icons |
| `lime` / `lime-foreground` | #A3E635 / #0A0A0F | same | accent fill, highlight, glow; dark text on top |
| `success` `warning` `danger` | #15803D #B45309 #DC2626 | #4ADE80 #FBBF24 #F87171 | text-safe status colours |
| `destructive` | #DC2626 | #DC2626 | red fill with white text |
| `pip` / `pip-soft` / `pip-ink` | indigo aliases (#4F46E5 / #ECEBFD / #3730A3) | #5B52EC / #1E1B4B / #C7D2FE | legacy names, now brand indigo |
| `ring` | #4F46E5 | #A5B4FC | focus ring |
| `glow` | indigo 16% | lime 14% | card hover glow, CTA shadow |

Contrast (WCAG AA, checked): text/bg 17.5 and 18.0; muted/bg 6.4 and 7.6; faint/panel 5.0 and 5.7; white on primary 6.3 and 5.4; lime-foreground on lime 13.1; primary-ink on bg 6.0 (light) and 9.9 (dark); white on destructive 4.8. Lime on white is 1.5, so lime is never text on a light surface.

## Type
Geist (`font-sans`) for all UI; headings are Geist 700, tight tracking, lowercase (brand voice). Newsreader (`font-doc`) only inside the resume paper. Pixelify Sans (`font-pixel`) only for Pip accents, small labels and step numbers. All fonts load via `next/font`.

## Spacing, radius, elevation
4px rhythm; sections `py-16`, cards `p-5` / `p-6`. Radius: inputs `rounded-lg`, cards `rounded-2xl`, buttons/pills `rounded-full`. Elevation: `shadow-card` (resting card), `shadow-pop` (menus, dialogs, slide-overs). Borders carry most of the structure; shadows stay soft.

## Motion
Short (150-300ms) and purposeful. Everything respects `prefers-reduced-motion` (global rule in globals.css plus `motion-reduce:` utilities). One animated hero line only, one spotlight, no full-page canvases.

## Components
- Primitives (`src/components/ui`): `Button` (default, glow, lime, outline, secondary, ghost, destructive, link), `Input`, `Textarea`, `Card`, `Badge`, `Tabs`, `Dialog`, `DropdownMenu`, `Sonner`. Focus is always a visible 2px `ring`.
- Aceternity-style kit (`src/components/ui/aceternity`, adapted from Aceternity UI, MIT, notice in each header): `Spotlight`, `BackgroundGrid`/`BackgroundDots`, `GlowCard` (alias `CardSpotlight`, the standard premium card), `BentoGrid`/`BentoGridItem`, `HoverBorderGradient` (primary CTA), `MovingBorder` (running pipeline step), `TextGenerateEffect` (hero line only; CSS, no JS).
- Shell: sidebar with an indigo active pill and lime dot, needs-you count badge, search, theme toggle, user card; mobile top bar and bottom tab bar; command menu and chat slide-over are `panel` surfaces with `shadow-pop`.
- Legacy helpers kept: `.panel-cozy`, `.panel-soft`, `.btn-pill-primary|secondary|pip`, `.highlight-match` (lime highlight), `.strike-weak`, `.paper-doc`.

## Do
- Use tokens and `text-primary-ink` for indigo text. Pair `bg-lime` with `text-lime-foreground`.
- Label sample data as a sample; use fictional names.
- Keep Pip and pixel art to small accents (empty states, status, onboarding).
- Give every data view loading, empty and error states.

## Don't
- Don't use lime as text on light backgrounds, or raw hex colours in classes.
- Don't add canvases or heavy dependencies to every page.
- Don't invent numbers or claims on marketing pages (D48).
