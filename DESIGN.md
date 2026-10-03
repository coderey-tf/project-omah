---
name: Omah (Starbucks Heritage)
description: A warm, confident household management interface inspired by Starbucks retail flagship — warm cream canvas, four-tier greens, full-pill geometry, and whispered layered shadows.

colors:
  primary: "#006241"           # Starbucks Green (Headings & Brand)
  primary-accent: "#00754A"    # Green Accent (CTAs & Frap)
  house-green: "#1E3932"       # Deep House Green (Feature bands, dark anchors)
  green-uplift: "#2b5148"      # Mid-dark green accents
  green-light: "#d4e9e2"       # Pale mint wash
  gold: "#cba258"              # Reserved for status ceremony / stars
  gold-light: "#dfc49d"        # Gold soft wash
  gold-lightest: "#faf6ee"     # Cream-gold surface wash

  canvas: "#f2f0eb"            # Neutral Warm (Cream page background)
  canvas-card: "#ffffff"       # Pure White (Card containers)
  canvas-soft: "#edebe9"       # Ceramic off-white (Separators, section washes)
  canvas-cool: "#f9f9f9"       # Neutral Cool (Dropdowns, subtle wraps)

  text-black: "rgba(0, 0, 0, 0.87)"       # Primary text on light
  text-black-soft: "rgba(0, 0, 0, 0.58)"  # Secondary/metadata on light
  text-white: "rgba(255, 255, 255, 1.00)" # Primary text on dark green
  text-white-soft: "rgba(255, 255, 255, 0.70)" # Secondary on dark green

  border-card: "#e5e3dd"       # Subtle hairline for cards
  border-input: "#d6dbde"      # Input border

  danger: "#c82014"            # Semantic red
  warning: "#fbbc05"           # Semantic yellow
  success: "#00754A"           # Semantic green accent

typography:
  display-lg:
    fontFamily: Inter, -apple-system, sans-serif
    fontSize: 48px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.16px
  display-md:
    fontFamily: Inter, -apple-system, sans-serif
    fontSize: 36px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.16px
  heading-1:
    fontFamily: Inter, -apple-system, sans-serif
    fontSize: 24px
    fontWeight: 600
    lineHeight: 36px
    letterSpacing: -0.16px
  heading-2:
    fontFamily: Inter, -apple-system, sans-serif
    fontSize: 24px
    fontWeight: 400
    lineHeight: 36px
    letterSpacing: -0.16px
  body-lg:
    fontFamily: Inter, -apple-system, sans-serif
    fontSize: 18px
    fontWeight: 400
    lineHeight: 28px
    letterSpacing: -0.16px
  body-md:
    fontFamily: Inter, -apple-system, sans-serif
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
    letterSpacing: -0.01em
  body-sm:
    fontFamily: Inter, -apple-system, sans-serif
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
    letterSpacing: -0.01em
  caption-mono:
    fontFamily: Geist Mono, monospace
    fontSize: 13px
    fontWeight: 500
    letterSpacing: 0.1em

rounded:
  card: 12px
  pill: 50px
  circle: 50%

shadows:
  card: "0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)"
  nav: "0 1px 3px rgba(0,0,0,0.1), 0 2px 2px rgba(0,0,0,0.06), 0 0 2px rgba(0,0,0,0.07)"
  frap: "0 0 6px rgba(0,0,0,0.24), 0 8px 12px rgba(0,0,0,0.14)"
---

# Design System: Omah (Starbucks Heritage)

## 1. Overview & Atmosphere
Omah adopts the warm, confident hospitality of Starbucks' retail flagship. Moving away from technical starkness, the app embraces warmth, natural café materials, and organic domestic comfort.
- **Canvas:** Neutral Warm cream (`#f2f0eb`) replaces cold white or near-black.
- **The Four Greens:** 
  1. *Starbucks Green* (`#006241`) for primary headers & brand marks.
  2. *Green Accent* (`#00754A`) for CTAs, active pills, and floating action button.
  3. *House Green* (`#1E3932`) for deep feature bands and grounding surfaces.
  4. *Green Light* (`#d4e9e2`) for delicate mint washes and status backgrounds.
- **Gold Accent (`#cba258`):** Reserved for special milestones, transparency badges, and rewards stars.
- **Full-Pill Geometry:** Every button and chip is a `50px` full pill with `scale(0.95)` press feedback.
- **Cards & Elevation:** 12px rounded-rectangle white cards with whispered dual-layered shadow.
- **The Floating "Frap" CTA:** 56px circular button floating in Green Accent with layered shadow.
