<#
deploy.ps1

Interactive deploy helper for staging workflow.

What it does (interactive):
- Verifies you're in a git repo and shows current branch (will warn on main).
- Lists unstaged changes and offers to stage them.
- Prompts for a commit message and commits staged changes (optional).
- Optionally creates a new migration skeleton using backend/scripts/new_migration.js.
- Runs the migration runner: node backend/scripts/apply_migrations.js (applies unapplied migrations).

This script will NOT push, merge, or modify branches. It's purely a local helper.
#>

Set-StrictMode -Version Latest

function ExitWith($code, $msg) {
    if ($msg) { Write-Error $msg }
    exit $code
}

Write-Host "Starting deploy helper..." -ForegroundColor Cyan

# Ensure we're inside a git repo
$inRepo = (git rev-parse --is-inside-work-tree 2>$null) -eq 'true'
if (-not $inRepo) { ExitWith 2 "Not a git repository. Run this from the repo root." }

# Show current branch
$branch = git rev-parse --abbrev-ref HEAD 2>$null
Write-Host "Current git branch: $branch"
if ($branch -eq 'main') {
    $ok = Read-Host "You are on 'main'. This script is intended for staging/dev workflows; continue? (y/n)"
    if ($ok -ne 'y' -and $ok -ne 'Y') { ExitWith 0 "Aborted by user." }
}

# Show unstaged/uncommitted changes
$status = git status --porcelain
if ($status) {
    Write-Host "Uncommitted changes found:" -ForegroundColor Yellow
    git status --short
    $stage = Read-Host "Stage all changes now? (y/n)"
    if ($stage -eq 'y' -or $stage -eq 'Y') {
        git add -A
        Write-Host "All changes staged."
    } else {
        Write-Host "No changes were staged. If you want to commit, stage files manually and re-run this script." -ForegroundColor Yellow
    }
} else {
    Write-Host "Working tree clean."
}

# If there are staged changes, optionally commit
$staged = git diff --cached --name-only
if ($staged) {
    Write-Host "Staged files:"
    git diff --cached --name-only | ForEach-Object { Write-Host " - $_" }
    $commitMsg = Read-Host "Enter commit message (leave blank to skip commit)"
    if ($commitMsg -and $commitMsg.Trim().Length -gt 0) {
        git commit -m $commitMsg
        if ($LASTEXITCODE -ne 0) { ExitWith 3 "git commit failed." }
        Write-Host "Committed staged changes." -ForegroundColor Green
    } else {
        Write-Host "Skipping commit as no message provided." -ForegroundColor Yellow
    }
} else {
    Write-Host "No staged files to commit." -ForegroundColor Yellow
}

# Optionally create a new migration skeleton
$createMigration = Read-Host "Create a new migration skeleton? (y/n)"
if ($createMigration -eq 'y' -or $createMigration -eq 'Y') {
    $desc = Read-Host "Short description for migration (e.g. add_users_table)"
    if (-not $desc -or $desc.Trim().Length -eq 0) { Write-Host "No description provided, skipping migration creation." -ForegroundColor Yellow }
    else {
        Write-Host "Creating migration..."
        node backend\scripts\new_migration.js $desc
        if ($LASTEXITCODE -ne 0) { ExitWith 4 "Failed to create migration file." }
        Write-Host "Migration skeleton created. Edit the file under backend/migrations and re-run this script when ready." -ForegroundColor Green
    }
}

# Run migration runner
Write-Host "Running migrations against DATABASE_URL from backend/.env..." -ForegroundColor Cyan
Push-Location "backend"
try {
    node .\scripts\apply_migrations.js
    if ($LASTEXITCODE -ne 0) { ExitWith 5 "Migration runner failed. Check output above." }
    Write-Host "Migrations applied successfully." -ForegroundColor Green
} finally {
    Pop-Location
}

Write-Host "Local deploy helper finished. Remember: pushing/merging to main is manual and not performed by this script." -ForegroundColor Cyan
<#
Deploy script for Vite + React (GitHub Pages user site)

Workflow:
 1. Work on 'dev' branch using source index.html (points to /src/main.jsx).
 2. When ready to deploy run:  ./deploy.ps1  (from project root while on dev)
 3. Script builds, merges dev -> main, replaces index.html with built version + assets, creates 404.html, pushes, and returns to dev.

Notes:
 - dist/ is ignored; only copied artifacts (index.html, assets/, vite.svg, 404.html) are committed.
 - Root index.html on main becomes the production (built) version referencing hashed assets.
 - Your dev branch keeps the source index.html so local development stays fast.
 - Uses HashRouter so 404.html is mostly a safeguard.
#>

param(
	[switch] $SkipPull,
	[switch] $AutoCommit  # still supported but now optional; default interactive prompt will handle commits
)

function Assert-Success($Message) {
	if ($LASTEXITCODE -ne 0) { Write-Error $Message; exit 1 }
}

 $currentBranch = git branch --show-current
 Assert-Success "Failed to determine current git branch."

 if ($currentBranch -ne 'dev') {
 	Write-Host "You are on branch '$currentBranch'. Please run this script from the 'dev' branch." -ForegroundColor Yellow
 	exit 1
 }

 # Ensure a dev template exists (developer version of index.html that points to /src/main.jsx) BEFORE we evaluate git status so any change is visible
 if (-not (Test-Path './index.dev.html')) {
 	Write-Host 'Creating index.dev.html template (dev entry point)...' -ForegroundColor DarkGray
 	@'
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width,initial-scale=1" />
		<title>Edwin J. Wood – Business Technology & Platform Transformation Leader</title>
		<meta name="description" content="Business Technology leader driving product-led operating model, platform modernization, and measurable portfolio value realization." />
		<link rel="icon" type="image/svg+xml" href="/vite.svg" />
		<script>
			try { const d = localStorage.getItem('dark'); if(d==='true'){ document.documentElement.classList.add('dark'); } } catch(e){}
		</script>
		<script type="application/ld+json">
		{ "@context": "https://schema.org", "@type": "Person", "name": "Edwin J. Wood", "jobTitle": "Business Technology & Platform Transformation Leader", "url": "https://edwinjwood.github.io", "email": "mailto:edwinjwood@gmail.com" }
		</script>
	</head>
	<body>
		<div id="root"></div>
		<script type="module" src="/src/main.jsx"></script>
	</body>
</html>
'@ | Out-File -FilePath './index.dev.html' -Encoding UTF8 -NoNewline
 }

 # Copy dev template into working index.html if the current index.html appears to be a built artifact (heuristic: contains '/assets/index')
 if (Test-Path './index.dev.html') {
 	$needsDev = (Select-String -Path './index.html' -Pattern '/assets/index' -SimpleMatch -Quiet) 2>$null
 	if ($needsDev) {
 		Write-Host 'Switching working index.html to dev template for build context...' -ForegroundColor DarkGray
 		Copy-Item -Path ./index.dev.html -Destination ./index.html -Force
 	}
 }



# Fully automated: auto-commit any uncommitted changes before deploy
$status = git status --porcelain
if ($status) {
	Write-Host "Auto-committing all uncommitted changes on dev..." -ForegroundColor Cyan
	git add .
	$timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm'
	git commit -m "Auto-commit before deploy: $timestamp"
	Assert-Success "Commit failed."
}

 if (-not $SkipPull) {
 	git pull --rebase origin dev
 	Assert-Success "Failed to pull latest dev changes."
 }


Write-Host "Building production bundle..." -ForegroundColor Cyan
npm run build
Assert-Success "Build failed. Aborting deployment."

if (-not (Test-Path 'dist/index.html')) {
	Write-Error "dist/index.html not found after build. Aborting."
	exit 1
}

# Copy latest build output to project root
Write-Host "Copying dist/index.html to ./index.html..." -ForegroundColor Cyan
Copy-Item -Path 'dist/index.html' -Destination './index.html' -Force
Write-Host "Copying dist/assets/* to ./assets/..." -ForegroundColor Cyan
if (Test-Path './assets') {
	Remove-Item './assets/*' -Recurse -Force
} else {
	New-Item -ItemType Directory -Path './assets' | Out-Null
}
Copy-Item -Path 'dist/assets/*' -Destination './assets/' -Recurse -Force
if (Test-Path 'dist/vite.svg') {
	Write-Host "Copying dist/vite.svg to ./vite.svg..." -ForegroundColor Cyan
	Copy-Item -Path 'dist/vite.svg' -Destination './vite.svg' -Force
}

# Switch to main and integrate dev changes if needed

# Fully automated: commit any uncommitted changes to index.html before switching branches
$mainStatus = git status --porcelain
if ($mainStatus) {
	Write-Host "Auto-committing all uncommitted changes before switching to main..." -ForegroundColor Cyan
	git add .
	$timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm'
	git commit -m "Auto-commit before switching to main: $timestamp"
	Assert-Success "Commit failed."
}
git checkout main
Assert-Success "Failed to checkout main."
if (-not $SkipPull) {
	git fetch origin
	git pull --rebase origin main
	Assert-Success "Failed to pull latest main."
}

# Determine if dev is already fully merged
$mergeBase = git merge-base main dev
$devHead = git rev-parse dev
if ($mergeBase -eq $devHead) {
	Write-Host "main already contains dev (no merge needed)." -ForegroundColor DarkGray
} else {
	# Try fast-forward first
	git merge --ff-only dev 2>$null
	if ($LASTEXITCODE -ne 0) {
		$mergeMsg = "Merge dev -> main (deploy $(Get-Date -Format 'yyyy-MM-dd HH:mm'))"
		git merge --no-ff dev -m $mergeMsg
		if ($LASTEXITCODE -ne 0) {
			Write-Host "Merge reported conflicts. Resolve them, stage changes (git add .), then run: git commit --no-edit and re-run script (it will skip merge)." -ForegroundColor Red
			exit 1
		}
	} else {
		Write-Host "Fast-forwarded main to dev." -ForegroundColor Green
	}
}


# Stage and commit only source files for Railway build
git add index.html assets vite.svg

$changes = git diff --cached --name-only
if (-not $changes) {
	Write-Host "No deploy-related changes to commit, but main may have new merge commits." -ForegroundColor Yellow
	git push origin main
	Assert-Success "Push failed."
	Write-Host "Deployment pushed to main (merge only)." -ForegroundColor Green
} else {
	$timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm'
	git commit -m "Deploy: $timestamp"
	Assert-Success "Commit failed."
	git push origin main
	Assert-Success "Push failed."
	Write-Host "Deployment pushed to main." -ForegroundColor Green
}

# Return to dev and sync it with main (fast-forward) so branches stay aligned
git checkout dev | Out-Null
Write-Host "Switched back to dev branch." -ForegroundColor Cyan

# Fetch latest refs to ensure we can fast-forward accurately
git fetch origin 2>$null

# Attempt fast-forward dev to main if main has new commit(s)
$mainHash = git rev-parse origin/main 2>$null
$localMainHash = git rev-parse main 2>$null
$devHashBefore = git rev-parse dev 2>$null
if ($mainHash -and $mainHash -ne $devHashBefore) {
	git merge --ff-only main 2>$null
	if ($LASTEXITCODE -eq 0) {
		Write-Host "Dev fast-forwarded to main (commit $mainHash)." -ForegroundColor Green
		git push origin dev 2>$null | Out-Null
	} else {
		Write-Host "Could not fast-forward dev to main automatically (divergence). Consider: git rebase main." -ForegroundColor Yellow
	}
} else {
	Write-Host "Dev already up to date with main." -ForegroundColor DarkGray
}

Write-Host "Deployment pushed to main." -ForegroundColor Green

# Restore dev index (overwrites production version pulled from main) for local development convenience
if (Test-Path './index.dev.html') {
	Copy-Item -Path ./index.dev.html -Destination ./index.html -Force
	Write-Host 'Restored development index.html (points to /src/main.jsx).' -ForegroundColor DarkGray
}


