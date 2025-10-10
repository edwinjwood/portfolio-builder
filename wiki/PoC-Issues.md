# Proof of Concept Issues

Last updated: 2025-10-03

This page lists the GitHub Issues that make up the Proof of Concept (PoC) milestone. Each issue corresponds to a Required feature from `wiki/Requirements.md`. Use the provided GitHub CLI (`gh`) commands to create them quickly. Ensure you have created the **Proof Of Concept** milestone in your repository before running the commands.

## Prerequisites

1. Install and authenticate the GitHub CLI:

   ```powershell
   winget install GitHub.cli
   gh auth login
   ```

2. Create the milestone (run once):

   ```powershell
   gh milestone create "Proof Of Concept" --due 2025-12-15
   ```

## Issue Commands

Run each command from the repository root. They all apply the `enhancement` label and assign the `Proof Of Concept` milestone.

1. **Authentication & Sessions**

   ```powershell
   gh issue create --title "Authentication & sessions" --body "Implement email/password signup, login, logout, and token-based session storage. Frontend stores token in localStorage (pb:token) and pb:currentUser. Secure auth middleware validates tokens for protected API routes." --label enhancement --milestone "Proof Of Concept"
   ```

2. **Backend API & Data Model**

   ```powershell
   gh issue create --title "Backend API & data model (portfolios + components)" --body "Create PostgreSQL models for portfolios and components; implement CRUD REST API endpoints for portfolios and components. Components stored as JSONB with (type, portfolioId, data)." --label enhancement --milestone "Proof Of Concept"
   ```

3. **Onboarding-First Portfolio Creation**

   ```powershell
   gh issue create --title "Portfolio creation (onboarding-first)" --body "Implement an onboarding-first creation flow that initializes a portfolio on signup. Supports 'No resume' option to auto-generate a resume stub and Virtual Business Card. Write generated components to disk for dev preview." --label enhancement --milestone "Proof Of Concept"
   ```

4. **Per-Component Persistence & DEV Preview**

   ```powershell
   gh issue create --title "Per-component persistence and on-disk DEV preview" --body "Persist each component as its own DB row in components table and write pretty JSON to backend/generated_components/<portfolioId>/<type>.json. Serve the generated_components folder statically in DEV so frontend can fetch developer previews." --label enhancement --milestone "Proof Of Concept"
   ```

5. **VirtualBC Inline Editor (Optimistic Saves)**

   ```powershell
   gh issue create --title "VirtualBC inline editor (optimistic save)" --body "Implement VirtualBC component with optimistic updates on blur/Enter and background reconcile behavior that preserves optimistic values. Remove per-field save indicator by default." --label enhancement --milestone "Proof Of Concept"
   ```

6. **Editor Block CRUD & Reorder**

   ```powershell
   gh issue create --title "Editor: block CRUD and reorder" --body "Implement editor UI for adding/removing/reordering content blocks (text, image, projects, resume). Changes persist to components and reflect in the public portfolio view." --label enhancement --milestone "Proof Of Concept"
   ```

7. **Public Portfolio Page & Publish Flow**

   ```powershell
   gh issue create --title "Public portfolio page and publish flow" --body "Implement public portfolio view (/portfolio/:id) and a publish/unpublish flow. Published content is served at the public URL; drafts remain private until published." --label enhancement --milestone "Proof Of Concept"
   ```

---

After creating the issues, assign them to team members and begin implementation. Update the issue bodies with acceptance criteria or sub-tasks as needed. Progress on these issues will determine the Proof of Concept milestone grade.
