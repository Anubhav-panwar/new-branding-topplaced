# TopPlaced AI – Project Rules & Design Governance

## Impeccable Design Integration
- This project integrates **Impeccable** (`.agent/skills/impeccable/`) for frontend craft, UI reviews, and anti-pattern detection.
- Durable product truth is recorded in `PRODUCT.md`. Always consult `PRODUCT.md` before shaping new features or user flows.
- Visual design tokens and component standards are recorded in `DESIGN.md`. All UI modifications must strictly adhere to the tokens and guidelines defined in `DESIGN.md`.

## Visual Identity & Design Principles (Premium Light SaaS)
- **Aesthetic:** Reference-Inspired Premium Light SaaS mode (`#FFFFFF`, `#F8FAFF`, `#F5F7FF`, cards `#FFFFFF` with borders `#E5E7EB`, `#EEF0F5`).
- **Signature Accents:** Royal Indigo & Vibrant Blue (`#4F46E5`, `#6366F1`) paired with secondary Purple (`#8B5CF6`) and soft pastel accents (`#EEF2FF`, `#F3E8FF`).
- **Typography:** `Plus Jakarta Sans` or `Inter` for interfaces/forms and high-contrast headings (`#111827`), with `JetBrains Mono` for code, proctoring metrics, timers, and score readouts.
- **Craft Floor:** Read `.agent/skills/impeccable/reference/craft-floor.md` before making UI changes. Prevent cramped padding, low-contrast text, broken responsiveness, and ensure minimum 44×44px touch targets with explicit focus indicators.

## Core System Invariants
- **Backend & Data Integrity:** Preserve all existing authentication, interview scoring, proctoring engines, WebSockets, WebRTC feeds, and progressive 10-second recording upload flows.
- **Data Retention Policy:** Maintain strict adherence to the automated 10-day media retention schedule.
- **Functional Stability:** Do not alter business logic, state machines, API contracts, or audio/STT engines during visual transformations.
