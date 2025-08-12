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
	[switch] $AutoCommit
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

# Handle uncommitted changes on dev
$status = git status --porcelain
if ($status) {
	if (-not $AutoCommit) {
		Write-Host "Uncommitted changes detected on 'dev'. Use -AutoCommit to auto-stage or commit manually." -ForegroundColor Red
		exit 1
	} else {
		Write-Host "Auto-commit enabled. Staging changes..." -ForegroundColor Cyan
		git add .
		$defaultMsg = "chore: dev updates"
		$commitMsg = Read-Host "Enter commit message (default: '$defaultMsg')"
		if (-not $commitMsg) { $commitMsg = $defaultMsg }
		git commit -m $commitMsg
		Assert-Success "Auto-commit failed."
	}
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

# Switch to main and merge dev
git checkout main
Assert-Success "Failed to checkout main."
if (-not $SkipPull) {
	git pull --rebase origin main
	Assert-Success "Failed to pull latest main."
}

git merge --no-ff dev
Assert-Success "Merge failed. Resolve conflicts then re-run." 

# Copy built artifacts (index.html + assets + vite.svg). Overwrite existing.
Write-Host "Copying build artifacts to main..." -ForegroundColor Cyan
Copy-Item -Path .\dist\index.html -Destination .\ -Force
Copy-Item -Path .\dist\vite.svg -Destination .\ -Force -ErrorAction SilentlyContinue
if (Test-Path .\dist\assets) { Copy-Item -Path .\dist\assets -Destination .\ -Recurse -Force }

# Create / update 404.html for SPA fallback (HashRouter safety)
Copy-Item -Path .\dist\index.html -Destination .\404.html -Force

# Stage only what we need
git add index.html 404.html assets vite.svg

$changes = git diff --cached --name-only
if (-not $changes) {
	Write-Host "No deploy-related changes to commit." -ForegroundColor Yellow
} else {
	$timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm'
	git commit -m "Deploy: $timestamp"
	Assert-Success "Commit failed."
	git push origin main
	Assert-Success "Push failed."
	Write-Host "Deployment pushed to main." -ForegroundColor Green
}

# Return to dev
git checkout dev | Out-Null
Write-Host "Switched back to dev branch." -ForegroundColor Cyan
Write-Host "Site should update shortly at: https://edwinjwood.github.io" -ForegroundColor Green
