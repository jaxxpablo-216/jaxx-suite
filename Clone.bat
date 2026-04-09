@echo off
cd /d "C:\Users\jpablo\Documents\GitHub\Project 001 ReCORE-and-BRIDGE - VSC - Clone"

echo ========================================
echo 🔄 Starting Git Auto Sync...
echo ========================================

echo 📥 Pulling latest changes...
git pull origin main

echo ➕ Adding all changes...
git add .

echo 📝 Committing changes...
set /p msg="Enter commit message: "
git commit -m "%msg%"

echo 🚀 Pushing to GitHub...
git push origin main

echo ========================================
echo ✅ Sync Complete!
echo ========================================

pause
