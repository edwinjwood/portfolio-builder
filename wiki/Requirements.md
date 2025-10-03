# Portfolio Builder Requirements

Last updated: 2025-10-03

## 0. Overview

This document is the authoritative requirements specification for the Portfolio Builder project. Each feature is categorized as **Required (R)**, **Desired (D)**, or **Aspirational (A)** and assigned a unique number for easy referencing in issues and milestones. Required features form the foundation of the product, desired features elevate it to a compelling experience, and aspirational features push towards a professional-grade release.

Design references used throughout this document are available in the repository under `wiki/design/screenshots/` and `wiki/design/screenshots/auth/`, and have also been uploaded to the project Figma file (link to be inserted by the team).

### Key Design Images

1. **Home (anonymous)** – `![Home anon](./design/screenshots/home-desktop-anon.png)`
2. **Login (anonymous)** – `![Login anon](./design/screenshots/login-desktop-anon.png)`
3. **Signup (anonymous)** – `![Signup anon](./design/screenshots/signup-desktop-anon.png)`
4. **Home (authenticated)** – `![Home auth](./design/screenshots/auth/home-desktop-auth.png)`
5. **Dashboard** – `![Dashboard](./design/screenshots/auth/dashboard-desktop-auth.png)`
6. **Editor** – `![Editor](./design/screenshots/auth/editor-desktop-auth.png)`
7. **Profile** – `![Profile](./design/screenshots/auth/profile-desktop-auth.png)`
8. **Onboarding start** – `![Onboarding](./design/screenshots/auth/onboarding-desktop-auth.png)`
9. **Onboarding finish** – `![Onboarding finish](./design/screenshots/auth/onboarding_finish-desktop-auth.png)`
10. **Onboarding “no resume”** – `![Onboarding no resume](./design/screenshots/auth/onboarding_no-resume-desktop-auth.png)`
11. **Portfolio sample (public)** – `![Portfolio sample](./design/screenshots/auth/portfolio_1-desktop-auth.png)`

---

## 1. Feature Areas and Priorities

### 1. Accounts & Access

- **Required**
  - **R1.1 User authentication & sessions** — Email/password signup, login, logout, and persistent sessions. Tokens stored in `localStorage` (`pb:token`, `pb:currentUser`) and validated on protected API calls. _Acceptance:_ Working login/signup forms (Design refs 2–3), issued JWT (or equivalent), logout clears session. _Dependencies:_ Users table, password hashing, JWT library.
  - **R1.2 Access control & authorization** — Server validates portfolio ownership for any mutating request; unauthorized edits return 403. _Acceptance:_ Attempts to modify another user’s portfolio are rejected with clear error. _Dependencies:_ Auth middleware, portfolio ownership relationship.
- **Desired**
  - **D1.1 Profile & account settings** — Owners manage name, contact info, social links (Design ref 7). Changes immediately reflect in public/homecard views. _Dependencies:_ Users API fields.
- **Aspirational**
  - **A1.1 Team workspaces & roles** — Shared workspace with granular permissions and billing integration. _Acceptance:_ Multi-user workspace with role-based access and billing plan enforcement.
  - **A1.2 Internationalization (i18n)** — Multi-language UI with localized formatting. _Acceptance:_ Strings externalized, language toggle, at least one translated locale.

### 2. Application Shell & Infrastructure

- **Required**
  - **R2.1 App shell & routing** — Client-side routing for Home, Login, Signup, Dashboard, Editor, Profile, Onboarding, Portfolio, plus 404. _Acceptance:_ Deep links render correct screens (Design refs 1, 4–11). _Dependencies:_ React Router (or equivalent).
  - **R2.2 Backend API & data model** — REST API for users, portfolios, components (JSONB payloads). _Acceptance:_ CRUD endpoints align with frontend schema, validation errors surfaced. _Dependencies:_ Express + PostgreSQL.
- **Desired**
  - **D2.1 Responsive and mobile-friendly layouts** — Desktop-first, but key flows usable at 390×844 viewport. _Acceptance:_ Exporter mobile screenshots show no blocking issues. _Dependencies:_ Tailwind responsive rules.
  - **D2.2 Toast & error handling system** — Global feedback for saves, errors, connectivity. _Acceptance:_ Consistent toast pattern with field-level errors where applicable.
- **Aspirational**
  - **A2.1 CI/CD automation** — GitHub Actions (or similar) pipeline for build/test/deploy. _Acceptance:_ PR checks, staging deploys, one-click production deploy.

### 3. Portfolio Creation & Onboarding

- **Required**
  - **R3.1 Onboarding-first portfolio creation** — Guided onboarding seeds a portfolio; “No resume” path auto-generates stub resume + VirtualBC (Design refs 8–10). _Acceptance:_ New accounts finish onboarding with a usable portfolio; generated JSON written to disk for DEV preview.
- **Desired**
  - **D3.1 Template library** — Users choose templates or start blank; templates pre-populate components. _Acceptance:_ Selecting a template populates default blocks.
- **Aspirational**
  - **A3.1 Marketplace of components/templates** — Share/buy templates and custom blocks. _Acceptance:_ Template gallery with install/apply flow and moderation tooling.

### 4. Editing & Component Management

- **Required**
  - **R4.1 Component persistence & DEV preview** — Components stored individually in DB and mirrored to `backend/generated_components/<portfolioId>/<type>.json`; DEV serves static files. _Acceptance:_ API + file outputs stay in sync; frontend loads on-disk JSON in DEV.
  - **R4.2 Editor block CRUD** — Add/edit/delete/reorder blocks within the Editor (Design ref 6). _Acceptance:_ Changes persist, reorder interactions succeed, public view reflects updates.
- **Desired**
  - **D4.1 Virtual Business Card inline improvements** — Optimistic edit flow with background reconcile and no save indicator (Design ref 6).
  - **D4.2 Autosave drafts** — Automatic periodic draft saves with clear status indicator; no conflict with publish flow.
  - **D4.3 Collaboration invites (basic)** — Invite collaborators via email with edit access; include basic audit logging.
  - **D4.4 Search/filter portfolios** — Dashboard search/filter by status or tags for quick access.
- **Aspirational**
  - **A4.1 Offline editing mode** — PWA capabilities for offline edits with later sync.
  - **A4.2 AI-assisted copy suggestions** — Generate suggested blurbs/bullets with user confirmation.

### 5. Resume Management

- **Required**
  - **R5.1 Resume upload, parsing & optimization** — Users upload a resume (PDF/DOCX); system parses structured data, suggests improvements for missing sections, and merges into components. _Acceptance:_ Successful imports for common formats, optimization tips surfaced, manual edits possible.
  - **R5.2 Resume export (PDF/Markdown)** — Generate downloadable resume output from maintained components. _Acceptance:_ Export produces PDF and Markdown variants with latest data.
- **Desired**
  - **D5.1 Resume version history** — Track and restore previous resume edits/exports.
- **Aspirational**
  - **A5.1 External integrations (LinkedIn, GitHub, Notion)** — Import projects/experience from third-party services via OAuth.

### 6. Publishing & Audience Reach

- **Required**
  - **R6.1 Public portfolio rendering** — Public URL `/portfolio/:id` displays last published snapshot (Design ref 11); share/copy link available.
  - **R6.2 Publish / unpublish flow** — Toggle published state; drafts remain private until re-published. _Acceptance:_ Publish captures snapshot, dashboard/editor show status.
- **Desired**
  - **D6.1 Dashboard overview** — Authenticated dashboard summarises portfolios, statuses, quick actions (Design ref 5).
  - **D6.2 Snapshot screenshot exporter** — Playwright script generating desktop/mobile screenshots for QA (Design refs 1–11).
- **Aspirational**
  - **A6.1 Advanced analytics dashboard** — View counts, engagement metrics, funnel insights with privacy controls.
  - **A6.2 Custom domains & hosting** — Map custom domain with automated verification and SSL.

### 7. Quality & Support Systems

- **Required**
  - **R7.1 Onboarding documentation & quickstart scripts** — Maintain README, quickstart guides, and `deploy.ps1` so new contributors can run the stack.
- **Desired**
  - **D7.1 Enhanced support tooling** — In-app help, feedback collection, contextual tips.
- **Aspirational**
  - **A7.1 Comprehensive analytics + monitoring** — Centralized logging, alerting, and SLO dashboards (complements A6.1).

---

## 2. Dependencies & Cross-Cutting Concerns

- **Security:** All API endpoints validate auth tokens, rate limiting for public endpoints, secure password storage (bcrypt/argon2).  
- **Testing:** Unit tests (backend + frontend), integration tests for API, Playwright E2E for critical flows (onboarding, editing, publish).  
- **Performance:** Lazy-load heavy components, use caching for public portfolios.  
- **Accessibility:** WCAG AA color contrast, keyboard navigation, aria labels.  
- **Documentation:** Update `README.md`, quickstart scripts, `deploy.ps1`.  

---

## 3. Proof-of-Concept (PoC) Scope

The PoC milestone demonstrates the core user journey:

1. User signs up and authenticates.  
2. Onboarding flow creates a portfolio with default components.  
3. Owner edits Virtual Business Card and blocks; changes persist.  
4. Portfolio can be published and viewed publicly.  
5. Snapshot exporter documents the key screens.  

Features targeted for PoC implementation (from sections above):

- R1.1 User authentication & sessions
- R2.1 App shell & routing
- R2.2 Backend API & data model
- R3.1 Onboarding-first portfolio creation
- R4.1 Component persistence & DEV preview
- R4.2 Editor block CRUD
- R5.1 Resume upload, parsing & optimization
- R6.1 Public portfolio rendering
- R6.2 Publish / unpublish flow
- D6.2 Snapshot screenshot exporter (nice-to-have if time permits)

Associated GitHub issue commands are stored in `wiki/PoC-Issues.md`.

---

## 6. Maintenance

- Update this document whenever requirements change or new features are added.  
- Mark implemented features with a checkmark ✅ in future revisions (optional).  
- Keep screenshot references current by re-running the exporter when UI changes.  

> _After the milestone deadline, do not modify this document until grades are issued, per course policy._
