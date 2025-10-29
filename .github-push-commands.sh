#!/bin/bash
# Replace YOUR_USERNAME with your actual GitHub username
GITHUB_USERNAME="YOUR_USERNAME"

git remote add origin https://github.com/$GITHUB_USERNAME/NetSpense.git
git branch -M main
git push -u origin main

echo "✅ Pushed to GitHub!"
