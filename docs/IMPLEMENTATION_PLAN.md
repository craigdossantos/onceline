# Onceline Implementation Plan - Minimal Storyteller

**Date:** 2026-02-01
**Decision:** Direction A - Minimal Storyteller
**Goal:** Ship a beautiful, story-focused timeline app

## Design Tokens

### Colors
```css
--color-bg: #FAFAF9 (warm white)
--color-text: #1C1917 (warm black)
--color-text-muted: #78716C (warm gray)
--color-accent: #D97706 (warm amber)
--color-accent-light: #FEF3C7 (amber tint)
--color-border: #E7E5E4 (warm border)
```

### Typography
- **Headlines:** Playfair Display (serif) - for emotional weight
- **Body:** Inter (sans-serif) - for readability
- **Quotes/Memories:** Playfair Display italic

### Spacing
- Generous whitespace
- 8px base unit
- Large padding on containers

---

## Phase 1: Onboarding Flow (Priority 1)

### Screens
1. **Welcome** - "Every life is a story worth telling" + fade in
2. **Origin** - "Where does your story begin?" + location input
3. **Birth** - "When were you born?" + date picker
4. **First Event** - Auto-creates birth event, shows on timeline
5. **Ready** - "Your timeline is ready. Let's fill it with memories."

### Implementation
- [ ] Create `src/components/Onboarding.tsx`
- [ ] Create `src/components/OnboardingStep.tsx`
- [ ] Add Framer Motion animations
- [ ] Store onboarding state in Zustand
- [ ] Skip onboarding if timeline exists

---

## Phase 2: UI Redesign

### Layout Changes
- [ ] Full-screen timeline (not split view)
- [ ] Chat as bottom sheet (slide up)
- [ ] Floating action button to open chat

### Timeline Redesign
- [ ] Horizontal scroll with year markers
- [ ] Event cards with serif typography
- [ ] Subtle paper texture background
- [ ] Warm amber accent for pins

### Chat Redesign
- [ ] Bottom sheet with drag handle
- [ ] Minimal, conversational UI
- [ ] Typing indicator with warmth

---

## Phase 3: Micro-interactions

- [ ] Event appear animation (fade + scale)
- [ ] Pin drop animation when event created
- [ ] Subtle parallax on timeline scroll
- [ ] Celebration moment when first event added

---

## Phase 4: Polish

- [ ] Loading states
- [ ] Error handling
- [ ] Empty states with guidance
- [ ] Keyboard shortcuts (j/k to navigate, space to expand)

---

## Phase 5: Testing

- [ ] E2E tests with Playwright
- [ ] Test onboarding flow
- [ ] Test chat → event creation
- [ ] Test timeline interactions

---

## Success Metrics
- Onboarding completion in < 30 seconds
- First event created within 1 minute
- Clean, bug-free experience

---

## Files to Create/Modify

### New Files
- `src/components/Onboarding.tsx`
- `src/components/OnboardingStep.tsx`
- `src/components/ChatSheet.tsx`
- `src/components/EventCard.tsx`
- `src/components/FloatingChatButton.tsx`
- `src/app/globals.css` (design tokens)
- `tests/e2e/onboarding.spec.ts`
- `tests/e2e/timeline.spec.ts`

### Modified Files
- `src/app/page.tsx` - New layout
- `src/components/Timeline.tsx` - Redesign
- `src/components/Chat.tsx` - Bottom sheet version
- `src/lib/store.ts` - Onboarding state
- `tailwind.config.ts` - Custom theme
