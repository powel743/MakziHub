---
name: design
description: MakaziHub UI design system for the existing React + Vite + Tailwind + lucide-react + shadcn/ui stack. Brand tokens, typography, spacing, component patterns (buttons, cards, inputs, listing card, badges, empty/loading states, tables, nav, modals), layout patterns, mobile-first rules, micro-interactions, and anti-patterns. Use BEFORE any UI/styling work in apps/web. Improve within the existing component structure — never suggest a full redesign.
---

# MakaziHub UI Design Skill
## Stack: React + Vite + Tailwind CSS + lucide-react + shadcn/ui

---

## BEFORE ANY UI WORK
Read this file fully. Then:
1. Check the existing component for current classes before adding new ones
2. Never remove working functionality while improving styles
3. Always keep mobile-first (375px → 768px → 1024px)
4. Run tsc --noEmit after changes — 0 new errors

---

## Brand tokens (use these everywhere, not raw hex)

Primary green:    text-green-600 / bg-green-600 / border-green-600
                  hover: hover:bg-green-700
                  light bg: bg-green-50, text: text-green-700

Neutral scale:
  Page bg:        bg-white dark:bg-[#0a0a0a]
  Card bg:        bg-white dark:bg-[#111111]
  Elevated:       bg-gray-50 dark:bg-[#1a1a1a]
  Border:         border-gray-200 dark:border-white/8
  Text primary:   text-gray-900 dark:text-[#ededed]
  Text secondary: text-gray-500 dark:text-[#a1a1a1]
  Text tertiary:  text-gray-400 dark:text-[#666]

Error:   text-red-600 bg-red-50 border-red-200
Warning: text-amber-600 bg-amber-50 border-amber-200
Success: text-green-600 bg-green-50 border-green-200

---

## Typography rules

Headings:
  Page title (h1):   text-2xl sm:text-3xl font-bold tracking-tight text-gray-900
  Section title (h2): text-xl font-semibold tracking-tight text-gray-900
  Card title (h3):   text-base font-semibold text-gray-900
  Never use font-black or font-extrabold

Body:
  Default:    text-sm text-gray-600 leading-relaxed
  Small:      text-xs text-gray-500
  Label:      text-xs font-medium text-gray-700 uppercase tracking-wide

Price (important — always prominent):
  text-xl font-bold text-gray-900
  Prefix "KES" in text-sm font-normal text-gray-500

---

## Spacing rules

Page wrapper:     max-w-6xl mx-auto px-4 sm:px-6 lg:px-8
Section gap:      space-y-8 or py-12
Card padding:     p-4 sm:p-5
Form field gap:   space-y-4
Button gap:       gap-2
Icon + text gap:  gap-1.5

Never use p-1 or p-2 as card padding — too tight.
Never use max-w-full for content containers.

---

## Component patterns

### Buttons
Primary CTA:
  className="bg-green-600 hover:bg-green-700 active:scale-[0.98] 
             text-white font-medium text-sm px-4 py-2.5 rounded-lg 
             transition-all duration-150 disabled:opacity-50 
             disabled:cursor-not-allowed"

Secondary:
  className="border border-gray-200 hover:border-gray-300 hover:bg-gray-50 
             text-gray-700 font-medium text-sm px-4 py-2.5 rounded-lg 
             transition-all duration-150"

Ghost/link:
  className="text-green-600 hover:text-green-700 font-medium text-sm 
             hover:underline underline-offset-2 transition-colors"

Destructive:
  className="bg-red-50 hover:bg-red-100 text-red-600 font-medium 
             text-sm px-4 py-2.5 rounded-lg transition-colors"

Icon button:
  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 
             hover:text-gray-700 transition-colors"

### Cards
Standard card:
  className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 
             hover:border-gray-300 transition-colors"

Clickable card:
  className="bg-white border border-gray-200 rounded-xl overflow-hidden 
             hover:border-gray-300 hover:shadow-sm transition-all 
             duration-200 cursor-pointer group"

Stat card (dashboard):
  className="bg-white border border-gray-200 rounded-xl p-5"
  Title: text-sm font-medium text-gray-500
  Value: text-2xl font-bold text-gray-900 mt-1
  Icon:  p-2.5 bg-green-50 rounded-lg text-green-600

### Inputs & forms
Input:
  className="w-full px-3 py-2.5 text-sm border border-gray-200 
             rounded-lg bg-white placeholder:text-gray-400
             focus:outline-none focus:ring-2 focus:ring-green-500/20 
             focus:border-green-500 transition-colors"

Select: same as input + appearance-none with ChevronDown icon overlay

Label:
  className="block text-sm font-medium text-gray-700 mb-1.5"

Error message:
  className="text-xs text-red-500 mt-1"

Helper text:
  className="text-xs text-gray-500 mt-1"

Form section divider:
  <div className="border-t border-gray-100 pt-5 mt-5">

### Listing card (core component — used everywhere)
Structure:
  - Aspect ratio photo: aspect-[4/3] overflow-hidden rounded-t-xl
  - Photo hover: group-hover:scale-105 transition-transform duration-300
  - Content: p-4
  - Estate badge: absolute top-3 left-3 bg-white/90 backdrop-blur-sm 
                  text-xs font-medium px-2 py-0.5 rounded-full
  - Verified badge: inline-flex items-center gap-1 text-green-600 text-xs
  - Price: text-lg font-bold text-gray-900
  - Details row: flex items-center gap-3 text-xs text-gray-500
  - Icons: w-3.5 h-3.5 (never larger in cards)

### Badges & tags
Status badge:
  available: bg-green-50 text-green-700 border border-green-200
  taken:     bg-red-50 text-red-700 border border-red-200
  pending:   bg-amber-50 text-amber-700 border border-amber-200
  
  className="inline-flex items-center px-2 py-0.5 rounded-full 
             text-xs font-medium border"

Verified:
  className="inline-flex items-center gap-1 text-xs font-medium 
             text-green-600"
  Icon: ShieldCheck w-3.5 h-3.5

### Empty states
  className="flex flex-col items-center justify-center py-16 text-center"
  Icon: relevant lucide icon, w-10 h-10 text-gray-300 mb-3
  Title: text-base font-medium text-gray-900 mb-1
  Body: text-sm text-gray-500 mb-4
  CTA: primary button (optional)

### Loading states
Skeleton:
  className="animate-pulse bg-gray-100 rounded-lg"
  
Spinner (inline):
  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />

Page loading:
  <div className="flex items-center justify-center py-24">
    <Loader2 className="w-6 h-6 animate-spin text-green-600" />
  </div>

### Tables (admin)
Wrapper:   overflow-x-auto rounded-xl border border-gray-200
Table:     w-full min-w-[640px] text-sm
Header:    bg-gray-50 text-xs font-medium text-gray-500 uppercase 
           tracking-wide px-4 py-3 text-left
Row:       border-t border-gray-100 hover:bg-gray-50 transition-colors
Cell:      px-4 py-3 text-gray-700

### Navigation
Top nav:
  bg-white border-b border-gray-200 sticky top-0 z-40
  Height: h-14 (56px)
  Logo: text-lg font-bold text-gray-900 (no gradient)
  Nav links: text-sm font-medium text-gray-600 hover:text-gray-900
  Active link: text-green-600
  CTA button: primary button style, text-sm px-3 py-1.5

Sidebar (portal):
  w-56 border-r border-gray-200 bg-white min-h-screen
  Nav item: flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm
             font-medium text-gray-600 hover:bg-gray-100 
             hover:text-gray-900 transition-colors
  Active:   bg-green-50 text-green-700

### Modals / dialogs
Overlay:   fixed inset-0 bg-black/40 backdrop-blur-sm z-50
Panel:     bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4
Header:    text-lg font-semibold text-gray-900 mb-1
Subtext:   text-sm text-gray-500 mb-5
Footer:    flex items-center justify-end gap-2 mt-6 pt-4 
           border-t border-gray-100

---

## Layout patterns

### Public listing page
<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {/* Photos + details: col-span-2 */}
    {/* Sticky contact card: col-span-1 */}
  </div>
</div>

### Dashboard layout
<div className="flex min-h-screen bg-gray-50">
  {/* Sidebar: hidden on mobile, w-56 on lg */}
  <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl">
</div>

### Stats row
<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
  {/* StatCard × 4 */}
</div>

---

## Mobile rules (375px first)

- Stack everything vertically on mobile by default
- Horizontal scroll for tables only (overflow-x-auto + min-width)
- Bottom sticky CTA on listing detail:
  className="fixed bottom-0 left-0 right-0 bg-white border-t 
             border-gray-200 p-4 lg:hidden z-30"
- Touch targets minimum 44px height (py-2.5 on buttons = ~40px, acceptable)
- No hover-only interactions — all interactive states must work on tap
- Sidebar: hidden on mobile, slide-in drawer or bottom sheet

---

## Micro-interactions (no framer-motion needed)

All via Tailwind transitions:
- Buttons:     transition-all duration-150, active:scale-[0.98]
- Cards:       transition-all duration-200
- Links:       transition-colors duration-150
- Icons:       transition-transform duration-200 (for toggles/chevrons)
- Photo zoom:  group-hover:scale-105 transition-transform duration-300

---

## Anti-patterns — never do these in MakaziHub

- No gradient text (text with bg-gradient-to-r + bg-clip-text)
- No rounded-3xl or rounded-full on rectangular cards
- No colored section backgrounds (use white + borders)
- No shadow-lg or shadow-xl (use border + shadow-sm only)
- No text-xs on body content (only labels/badges/meta)
- No flex justify-center on body text
- No multiple accent colors (green only)
- No skeleton screens that take longer than the actual load
- No empty href="#" links — use buttons or Link components
- No inline styles — Tailwind classes only
