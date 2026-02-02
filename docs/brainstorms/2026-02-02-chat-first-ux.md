---
date: 2026-02-02
topic: chat-first-ux
---

# Chat-First UX Redesign

## What We're Building

Shifting Onceline from a form-based "add moment" UX to a conversation-first experience where users talk naturally and the AI extracts life events from their stories.

## Why This Approach

**Problem with forms:**
- "Add Moment" button + modal = friction
- Users have to structure their memories into fields
- Feels like data entry, not storytelling
- Overlapping UI elements created visual chaos

**Chat-first benefits:**
- Natural conversation lowers barrier
- AI does the work of extracting dates, categorizing events
- Feels like telling your story to a friend
- Matches the "memoir" aesthetic — you're narrating, not filing

## Key Decisions

1. **Remove "Add Moment" button entirely** — No forms, no modals
2. **Chat bar at TOP** — Primary interaction, always visible
3. **Conversation starters** — Prompts like "Tell me about a turning point in your life"
4. **Dates at bottom of timeline** — Cleaner visual hierarchy
5. **Pinch-to-zoom** — Navigate decades easily on mobile
6. **Zero onboarding** — Land on timeline centered on today, start talking immediately

## Open Questions

- How to handle corrections? ("Actually that was 1982, not 1981")
- Should chat history persist or reset per session?
- How to prompt for more detail? ("Tell me more about that move to Louisville")

## Next Steps

→ Implementing chat-first redesign (in progress)
→ Magic link auth (in progress)
→ Then: wire up real Supabase data instead of localStorage
