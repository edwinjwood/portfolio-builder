# PowerShell script to automate deployment from dev to main and push build to GitHub Pages
# Usage: Run from project root while on dev branch

# 1. Ensure all changes are committed on dev
git status
if ((git status --porcelain).Length -gt 0) {
    Write-Host "You have uncommitted changes on dev. Please commit or stash them before deploying." -ForegroundColor Red
    exit 1
}

# 2. Switch to main branch
git checkout main

# 3. Merge dev into main
git merge dev

# 4. Build the project
npm run build

# 5. Copy build output to root (overwrite old files)
Copy-Item -Path .\dist\* -Destination .\ -Recurse -Force

# 6. Stage changes
git add .

# 7. Commit changes
git commit -m "Deploy latest build"

# 8. Push to GitHub
git push origin main

# 9. Switch back to dev
git checkout dev

Write-Host "Deployment complete. Site is live and you are back on dev branch." -ForegroundColor Green
