# Portfolio Builder Requirements

_Last updated: 2025-10-03_

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

## 1. Required Features (🌱)

1.1 **User Authentication & Sessions**  
**Description:** Email/password signup, login, logout, and persistent sessions. Tokens stored in `localStorage` (`pb:token`, `pb:currentUser`), validated on every protected API call.  
**Acceptance Criteria:** Working login/signup forms (Design refs 2, 3), server-issued JWT (or equivalent), token-based auth middleware, logout clears session.  
**Dependencies:** Users table, password hashing, JWT library.  

1.2 **App Shell & Routing**  
**Description:** Client-side routing for Home, Login, Signup, Dashboard, Editor, Profile, Onboarding, Portfolio views plus a fallback 404.  
**Acceptance Criteria:** Deep links render correct screen, navigation is present (Design refs 1, 4–11), 404 page served for unknown routes.  
**Dependencies:** React Router (or equivalent).  

1.3 **Backend API & Data Model**  
**Description:** REST API for users, portfolios, and components. Components stored as JSONB with (id, portfolioId, type, data).  
**Acceptance Criteria:** CRUD endpoints for portfolios/components, consistent response schema used by frontend, validation errors handled.  
**Dependencies:** Express + PostgreSQL setup.  

1.4 **Onboarding-First Portfolio Creation**  
**Description:** Guided onboarding flow seeds a new portfolio. Selecting “No resume” auto-generates a stub resume and Virtual Business Card (Design refs 8–10).  
**Acceptance Criteria:** Flow creates portfolio + default components, writes generated JSON to disk (DEV preview), resume stub created when requested.  
**Dependencies:** Components API, file writer helper.  

1.5 **Editor Block CRUD**  
**Description:** Owners manage blocks (text, projects, resume sections) via the Editor (Design ref 6). Supports add, edit, delete, reorder.  
**Acceptance Criteria:** Editor updates persisted, reflected in preview/public views, reorder interactions work.  
**Dependencies:** Component endpoints, drag-and-drop/reorder UX.  

1.6 **Public Portfolio Rendering**  
**Description:** Public URL `/portfolio/:id` renders published snapshot (Design ref 11).  
**Acceptance Criteria:** Public view accessible without auth, shareable link, respects publish/unpublish state.  
**Dependencies:** Published snapshot model or flag.  

1.7 **Publish / Unpublish Flow**  
**Description:** Owners toggle published state. Draft edits remain private until republished.  
**Acceptance Criteria:** Publish action captures current components, public page serves last published snapshot, status visible in dashboard/editor.  
**Dependencies:** Versioning or snapshot storage.  

1.8 **Access Control**  
**Description:** Server verifies ownership for modifications; unauthorized edits return 403.  
**Acceptance Criteria:** Attempting to modify another user’s portfolio is rejected with appropriate error.  
**Dependencies:** Auth middleware, portfolio ownership relationship.  

1.9 **DEV Static Preview Endpoint**  
**Description:** Backend writes component JSON to `backend/generated_components/<portfolio>/<type>.json` and serves them statically in development.  
**Acceptance Criteria:** `GET /generated_components/...` returns latest JSON, DEV frontend loads on-disk data automatically.  
**Dependencies:** File system helper, Express static middleware.  

1.10 **Proof-of-Concept Snapshot Exporter**  
**Description:** Script automates login and captures screenshots for key routes (Design refs 1–11).  
**Acceptance Criteria:** Running `node scripts/export-screenshots-auth.cjs` produces desktop/mobile PNGs in wiki folder; works with credentials from `.env.local`.  
**Dependencies:** Playwright, running frontend/backend.  

---

## 2. Desired Features (🌿)

2.1 **Virtual Business Card Inline Editor Improvements**  
**Description:** Optimistic updates, background reconcile, no save indicator (Design ref 6).  
**Acceptance Criteria:** Typing + blur updates card immediately, server sync only adjusts if data differs.  

2.2 **Dashboard Overview**  
**Description:** Authenticated home shows portfolio list, quick actions, status (Design ref 5).  
**Acceptance Criteria:** Cards for each portfolio with edit/view/publish shortcuts.  

2.3 **Profile & Account Settings**  
**Description:** Owners edit name, contact info, social links (Design ref 7).  
**Acceptance Criteria:** Changes persist and reflect in public/homecard views.  

2.4 **Template Library**  
**Description:** Users choose portfolio templates or start from scratch.  
**Acceptance Criteria:** Template selections pre-populate components/blocks.  

2.5 **Responsive & Mobile-Friendly Layouts**  
**Description:** While desktop-first, key flows must work on mobile (exporter already captures mobile variants).  
**Acceptance Criteria:** No critical UI breakage on 390×844 viewport; editor usable for basic edits.  

2.6 **Toast & Error Handling**  
**Description:** Friendly messaging for saves, errors, connectivity.  
**Acceptance Criteria:** Global toast system, field-level errors where appropriate.  

2.7 **Autosave Drafts**  
**Description:** Autosave while editing to prevent data loss.  
**Acceptance Criteria:** Draft indicator, saves every X seconds or on mutation, no collisions with publish flow.  

2.8 **Resume Export (PDF/Markdown)**  
**Description:** Generate shareable resume export from components.  
**Acceptance Criteria:** Download link produces PDF or Markdown summarizing resume data.  

2.9 **Collaboration Invites (Basic)**  
**Description:** Invite collaborator by email with editor access (read/write).  
**Acceptance Criteria:** Collaborators can edit after accepting invite; audit log records changes.  

2.10 **Search / Filter Portfolios**  
**Description:** Owners filter portfolios by status/type.  
**Acceptance Criteria:** Dashboard search box filters list client-side (initially).  

---

## 3. Aspirational Features (🌼)

3.1 **Resume Import & Parsing**  
**Description:** Upload PDF/Doc, parse into structured fields to auto-fill content.  
**Acceptance Criteria:** Successful parsing for common resume formats, manual corrections possible.  

3.2 **Advanced Analytics Dashboard**  
**Description:** Track portfolio views, click-throughs, editor usage.  
**Acceptance Criteria:** Analytics widgets in dashboard showing trend lines; privacy controls.  

3.3 **Custom Domains & Hosting**  
**Description:** Allow mapping a custom domain to a portfolio.  
**Acceptance Criteria:** Users verify domain ownership, CDN/hosting configured automatically.  

3.4 **Marketplace of Components/Templates**  
**Description:** Share/buy templates and custom blocks.  
**Acceptance Criteria:** Template gallery with install/apply flow, moderation tools.  

3.5 **Integrations (LinkedIn, GitHub, Notion)**  
**Description:** Pull data from external sources to populate projects/resume.  
**Acceptance Criteria:** OAuth integration and importer UI for at least one service.  

3.6 **Team Workspaces**  
**Description:** Shared workspace with permissions, billing integration.  
**Acceptance Criteria:** Multi-user workspace, billing plan enforcement.  

3.7 **Internationalization (i18n)**  
**Description:** Multi-language UI with localized formatting.  
**Acceptance Criteria:** Strings externalized, language toggle, at least one translated locale.  

3.8 **AI-Assisted Copy Suggestions**  
**Description:** Suggest portfolio summaries or bullet points using AI.  
**Acceptance Criteria:** Inline suggestion feature with user confirmation before save.  

3.9 **CI/CD Pipeline Automation**  
**Description:** Automated builds/tests/deploys via GitHub Actions or Azure.  
**Acceptance Criteria:** PR checks, staging deployments, one-click production deploy.  

3.10 **Offline Editing Mode**  
**Description:** Allow editing while offline and sync changes later.  
**Acceptance Criteria:** PWA support with local caching and conflict resolution.  

---

## 4. Dependencies & Cross-Cutting Concerns

- **Security:** All API endpoints validate auth tokens, rate limiting for public endpoints, secure password storage (bcrypt/argon2).  
- **Testing:** Unit tests (backend + frontend), integration tests for API, Playwright E2E for critical flows (onboarding, editing, publish).  
- **Performance:** Lazy-load heavy components, use caching for public portfolios.  
- **Accessibility:** WCAG AA color contrast, keyboard navigation, aria labels.  
- **Documentation:** Update `README.md`, quickstart scripts, `deploy.ps1`.  

---

## 5. Proof-of-Concept (PoC) Scope

The PoC milestone demonstrates the core user journey:

1. User signs up and authenticates.  
2. Onboarding flow creates a portfolio with default components.  
3. Owner edits Virtual Business Card and blocks; changes persist.  
4. Portfolio can be published and viewed publicly.  
5. Snapshot exporter documents the key screens.  

Features targeted for PoC implementation:
- 1.1 User Authentication & Sessions
- 1.2 App Shell & Routing
- 1.3 Backend API & Data Model
- 1.4 Onboarding-First Portfolio Creation
- 1.5 Editor Block CRUD
- 1.6 Public Portfolio Rendering
- 1.7 Publish / Unpublish Flow
- 1.9 DEV Static Preview Endpoint
- 1.10 Snapshot Exporter (nice-to-have if time permits)

Associated GitHub issue commands are stored in `wiki/PoC-Issues.md`.

---

## 6. Maintenance

- Update this document whenever requirements change or new features are added.  
- Mark implemented features with a checkmark ✅ in future revisions (optional).  
- Keep screenshot references current by re-running the exporter when UI changes.  

> _After the milestone deadline, do not modify this document until grades are issued, per course policy._
