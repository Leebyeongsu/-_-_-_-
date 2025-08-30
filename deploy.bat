@echo off
echo 🚀 GitHub 자동 업로드 시작...

echo 📝 변경사항 추가...
git add .

echo 💬 커밋 메시지 입력 (Enter로 기본값 사용):
set /p commit_msg=
if "%commit_msg%"=="" set commit_msg=자동 업로드: %date% %time%

echo 💾 커밋 생성...
git commit -m "%commit_msg%"

echo 🚀 GitHub에 푸시...
git push origin master

echo ✅ 업로드 완료!
echo 🌐 GitHub Pages URL: https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/
pause
