# Windows PowerShell script for Vite + React GitHub Pages deployment with dev branch
# Usage: Run from project root after merging dev into main

# 1. Ensure on main branch
git checkout main

# 2. Merge dev branch into main
git merge dev

# 3. Build the project
npm run build

# 4. Copy build output to root (overwrite index.html, assets, etc.)
Copy-Item -Path .\dist\* -Destination .\ -Recurse -Force

# 5. Remove the dist folder
git rm -r --cached dist
Remove-Item -Recurse -Force .\dist

# 6. Add and commit changes
git add .
git commit -m "Deploy production build to GitHub Pages"

# 7. Push to GitHub
git push origin main

Write-Host "Deployment complete. Your site is live on GitHub Pages."
