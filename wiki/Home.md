# Portfolio Builder Wiki

Welcome to the Portfolio Builder project wiki — the canonical place for project context, decisions, and team documentation.

Use this wiki to find up‑to‑date information about the project, onboarding, architecture, and milestone deliverables. Keep pages short, link to source files or PRs where relevant, and use the Decision Log for any permanent architecture or process changes.

Quick links
- Project Description — short product summary and technology list (`wiki/Project Description.md`)
- Team Organization — roles, workflow, CI/CD, and communication choices (`wiki/Team Organization.md`)
- Architecture — system diagrams and data flows (create this page for diagrams)
- Runbook — deployment steps, secrets handling, and incident recovery (create and populate before production deploys)
- Milestones/ — create wiki milestone pages following the repository's existing naming convention. For tracking in GitHub create a corresponding GitHub Milestone with a name and due date and set the milestone's description to the milestone URL on our capstone site. Each wiki milestone page should include acceptance criteria and a due date.
- Decision Log — record architectural and product decisions with rationale and dates

How to use the wiki
- Draft milestone or design work as a wiki page and link to the corresponding GitHub Issue or PR.
- For technical decisions, include links to commits, migration files, and test artifacts.
- Keep the home page and Project Description short and user‑facing; put implementation details in subpages (Architecture, Runbook, Milestones).

Maintenance
- Each milestone page should include an owner who is responsible for progress updates.
- Before major releases, ensure Runbook and Architecture pages reflect the latest production configuration.

Publishing options:

- Commit these wiki files to the `dev` branch.
- Push the files to the GitHub Wiki repository (requires repo write access).
- Add a link from the top-level `README.md` to this wiki home page.
