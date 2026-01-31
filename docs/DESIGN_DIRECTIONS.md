# Onceline Design Directions

## Research Summary

### Best-in-Class Onboarding Patterns
1. **Progressive Disclosure** - Don't overwhelm, reveal complexity gradually
2. **Immediate Value** - Show results within 30 seconds
3. **Guided First Action** - One clear thing to do, not a blank page
4. **Celebration Moments** - Reward progress with micro-animations
5. **Zero Friction Start** - No signup required to try

### Reference Apps
- **Linear** - Clean, fast, keyboard-first, beautiful dark mode
- **Notion** - Flexible, approachable, great empty states
- **Loom** - Instant value, minimal onboarding, celebration moments
- **Duolingo** - Gamified progress, streak motivation
- **Spotify Wrapped** - Timeline visualization, shareable moments

---

## Design Direction A: "Minimal Storyteller"

### Philosophy
Clean, typographic, focused on the narrative. The timeline is a story, not data.

### Visual Style
- Monochrome with one accent color (warm amber)
- Large serif typography for quotes/memories
- Sans-serif for UI elements
- Generous whitespace
- Subtle paper texture

### Onboarding
1. Fade in: "Every life is a story worth telling"
2. Single question appears: "Where does your story begin?"
3. User types location → first pin drops with gentle animation
4. "When were you born?" → timeline anchors
5. Chat appears below, already has context

### Key Features
- Full-screen timeline that scrolls horizontally
- Chat slides up from bottom as a sheet
- Events expand into full "memory cards" on click
- Elegant typography for dates and descriptions

---

## Design Direction B: "Playful Journey"

### Philosophy
Warm, approachable, almost game-like. Makes documenting life feel fun.

### Visual Style
- Soft gradients (peach, lavender, sky blue)
- Rounded shapes everywhere
- Playful illustrations for categories
- Confetti/celebration animations
- Custom illustrated icons

### Onboarding
1. Animated character waves: "Let's map your adventure!"
2. Interactive globe spins → "Where did you start?"
3. First pin drops with bounce animation + confetti
4. Progress bar fills: "Great! 1 memory saved ✨"
5. Quick prompts with emoji suggestions

### Key Features
- Vertical timeline (mobile-first feel)
- Each event is a "memory bubble" with category icon
- Streak counter for consecutive days logging
- Achievement badges ("First Memory", "Time Traveler", etc.)
- Share cards with custom backgrounds

---

## Design Direction C: "Modern Data"

### Philosophy  
Information-dense but elegant. For people who want to see their life as data.

### Visual Style
- Dark mode primary, high contrast
- Geist/Inter typography
- Grid-based layout
- Accent colors per category
- Data visualization elements

### Onboarding
1. Terminal-style typing: "Initializing timeline..."
2. Quick form: birthdate, birthplace
3. Timeline renders with smooth GSAP animation
4. Stats appear: "0 events • Span: 0 years"
5. Chat panel opens: "Let's populate your timeline"

### Key Features
- Zoomable timeline with year/month/day views
- Category filters in sidebar
- Stats dashboard (events by year, category breakdown)
- Keyboard shortcuts for everything
- Export to JSON/CSV

---

## Design Direction D: "Cinematic Memoir"

### Philosophy
Premium, immersive, like flipping through a beautiful photo album.

### Visual Style
- Full-bleed imagery when photos available
- Soft focus backgrounds
- Film grain overlay option
- Elegant transitions (cross-dissolve)
- Vintage-inspired color grading

### Onboarding
1. Slow fade from black: ambient music option
2. Single line appears: "Tell me about you"
3. Voice input option with waveform visualization
4. First memory creates a "polaroid" style card
5. Timeline builds cinematically

### Key Features
- Photo-first design (prompts for photos)
- "Slideshow mode" for presentations
- Background music integration
- Video clips support
- Beautiful share cards for social

---

## Recommended Stack

### Animation
- **Framer Motion** - Main animation library
- **GSAP** - For complex timeline animations
- **Lottie** - For micro-interactions

### Components
- **shadcn/ui** - Base components
- **Radix Primitives** - Accessibility
- **react-virtuoso** - Virtual scrolling for long timelines

### Design System
- Tailwind CSS with custom theme
- CSS variables for theming
- Support light/dark mode

---

## Implementation Plan

1. **Branch: main** - Keep current MVP
2. **Branch: design/minimal-storyteller** - Direction A
3. **Branch: design/playful-journey** - Direction B  
4. **Branch: design/modern-data** - Direction C
5. **Branch: design/cinematic-memoir** - Direction D

For each branch:
1. Create design tokens (colors, typography, spacing)
2. Build onboarding flow
3. Restyle Chat component
4. Restyle Timeline component
5. Add animations
6. Polish and micro-interactions
