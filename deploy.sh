#!/bin/bash
# 部署到 GitHub Pages
# 用法: bash deploy.sh "commit message"

set -e

MSG="${1:-更新部署}"

echo "==> 构建生产版本..."
npm run build

echo "==> 准备 gh-pages 部署..."
cd dist

# 创建临时 git 仓库
git init
git checkout -b gh-pages
git add -A
git commit -m "$MSG"

echo "==> 推送到 GitHub Pages..."
git push -f git@github.com:ljjack/jizhang.git gh-pages:gh-pages

cd ..
rm -rf dist/.git

echo "==> 部署完成！"
echo "访问: https://ljjack.github.io/jizhang/"
