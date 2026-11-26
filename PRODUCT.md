# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary Audience:** College students, freshers, job seekers, and software engineering candidates preparing for technical, behavioral, and placement interviews at top tech companies, Fortune 500 firms, and high-growth startups.
- **Secondary Audience:** Mid-to-senior professionals practicing system design, leadership scenarios, and executive interviews.
- **Administrative Users:** Super Admins and institutional reviewers auditing candidate logs, proctoring alerts, scoring accuracy, and interview recordings.

## Product Purpose

TopPlaced AI accelerates career placement by providing high-fidelity, realistic AI-evaluated mock interview simulations. It bridges the preparation-to-performance gap by combining real-time voice conversations, interactive code execution, intelligent proctoring, and rubric-calibrated competency scoring.

## Positioning

Unlike passive flashcards or generic chatbot interviewers, TopPlaced AI delivers a comprehensive, real-world interview environment:
1. Real-time speech-to-text dialogue and voice-driven interviews.
2. In-browser code editing with real execution environments for technical rounds.
3. Multi-modal proctoring (webcam face tracking, gaze analytics, tab-switch alerts, mobile phone detection).
4. Option A Composited Video Recording (screen share + PiP candidate webcam + mixed audio) with 10-second progressive chunk resilience.
5. Objective evaluation rubrics calibrated against industry hiring standards with detailed multi-dimensional feedback.

## Operating Context

- **Environment:** Desktop and mobile modern web browsers (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari) with active webcam, microphone, and optional screen sharing permissions.
- **Candidate Journey:** Role/level selection -> Pre-interview device and proctoring check -> Live mock interview simulation -> Multi-dimensional feedback report with score breakdown and recording streaming.
- **Admin Workflow:** Super admin console for reviewing interview logs, proctoring events, and downloading/streaming media subject to retention policies.

## Capabilities and Constraints

- **Capabilities:**
  - AI Voice and text interview sessions.
  - Live code editor with multi-language execution.
  - Real-time client-side and server-side proctoring engine.
  - Progressive resilient video recording with offline IndexedDB queue and automatic upload recovery.
  - Candidate history, competency scoring, and performance analytics dashboards.
- **Constraints:**
  - Strict 10-day retention policy: Media recordings are securely purged after 10 days.
  - Screen capture (`getDisplayMedia`) is desktop-only due to mobile browser limitations; mobile gracefully falls back to full-frame webcam capture.
  - Candidate data and interview evaluations must maintain zero-loss guarantees across network hiccups.

## Brand Commitments

- **Name:** TopPlaced AI
- **Visual Identity:** Modern, high-trust engineering dark mode with dark obsidian surfaces (`#070B0E`, `#0D141C`, `#111A22`, `#1E293B`).
- **Signature Accent:** Vibrant neon emerald/teal (`#00FF88`, `#00FFB2`) representing growth, success, and precision.
- **Typography:** Clean modern sans-serif (`Inter` / system sans-serif) paired with monospace accents for code, metrics, and timestamps.
- **Tone:** Professional, encouraging, objective, and authoritative.

## Evidence on Hand

- Production web application in `E:\TOPPLACED-AI` with complete App Router pages:
  - Marketing / Landing page (`app/page.tsx`)
  - Learner Dashboard (`app/learner/dashboard/page.tsx`)
  - Voice Session (`app/learner/interview/voice-session/page.tsx`)
  - Coding/Text Session (`app/learner/interview/session/page.tsx`)
  - Results & Analytics (`app/learner/interview/results/page.tsx`)
  - Historical Sessions (`app/learner/history/page.tsx`)
  - Super Admin Management (`app/admin/interviews/page.tsx`)

## Product Principles

1. **High Realism Over Superficial Gamification:** Interviews reflect genuine tech hiring loops, realistic pacing, and objective evaluations.
2. **Resilience & Fault Tolerance:** Interviews, candidate answers, and recordings must never be lost due to network disconnection or browser refresh.
3. **Actionable Growth Insights:** Candidates receive concrete strengths, gaps, and STAR feedback rather than vague ratings.
4. **Trust & Privacy Transparency:** Proctoring rules and the strict 10-day data retention policy are clearly communicated and rigorously enforced.

## Accessibility & Inclusion

- High contrast text and interactive elements complying with WCAG AA on dark backgrounds.
- Multi-modal interaction (voice STT + visual text transcript) ensuring accessibility for diverse learning and communication styles.
- Responsive design supporting various desktop display resolutions and mobile viewports.

