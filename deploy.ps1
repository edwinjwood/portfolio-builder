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


 # Handle uncommitted changes on dev (interactive by default)
 $status = git status --porcelain
 if ($status) {
 	if ($AutoCommit) {
 		Write-Host "AutoCommit flag detected. Staging all changes..." -ForegroundColor Cyan
 		git add .
 	} else {
 		Write-Host "Uncommitted changes found:" -ForegroundColor Yellow
 		$status | ForEach-Object { Write-Host "  $_" }
 		$answer = Read-Host "Commit these changes now? (Y/n)"
 		if ($answer -match '^(n|no)$') {
 			Write-Host "Aborting deploy so you can review changes." -ForegroundColor Red
 			exit 1
 		}
 		git add .
 	}
 	$defaultMsg = "chore: dev updates"
 	$commitMsg = Read-Host "Enter commit message (default: '$defaultMsg')"
 	if (-not $commitMsg) { $commitMsg = $defaultMsg }
 	git commit -m $commitMsg
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

# Purge build artifacts from assets except for logo images before deploy
Get-ChildItem "$PSScriptRoot\assets" | Where-Object { $_.Name -notlike '*.png' -and $_.Name -notlike '*.svg' } | Remove-Item -Force

# Switch to main and integrate dev changes if needed
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
	Write-Host "No deploy-related changes to commit." -ForegroundColor Yellow
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


