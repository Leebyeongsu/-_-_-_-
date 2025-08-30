@echo off
setlocal enableextensions enabledelayedexpansion
echo 🚀 GitHub 자동 업로드 시작...

REM 변경사항 스테이징
echo 📝 변경사항 추가...
git add -A

REM 변경사항 여부 확인
git diff --cached --quiet && (
  echo 🔍 커밋할 변경사항이 없습니다. 종료합니다.
  goto :eof
)

REM 현재 브랜치 추출
for /f "usebackq tokens=*" %%b in (`git rev-parse --abbrev-ref HEAD`) do set CURRENT_BRANCH=%%b
if "%CURRENT_BRANCH%"=="" set CURRENT_BRANCH=master
echo 🌿 현재 브랜치: %CURRENT_BRANCH%

REM 커밋 메시지 생성
set COMMIT_MSG=자동 업로드: %date% %time%
echo 💾 커밋 생성...
git commit -m "%COMMIT_MSG%"

REM 리모트 확인
for /f "usebackq tokens=*" %%r in (`git remote`) do set HAS_REMOTE=1
if not defined HAS_REMOTE (
  echo ❌ 원격 저장소가 설정되어 있지 않습니다. 아래 명령으로 추가하세요:
  echo   git remote add origin https://github.com/USERNAME/REPO.git
  goto :eof
)

REM 푸시 수행
echo 🚀 GitHub에 푸시 중...
git push -u origin %CURRENT_BRANCH%

if errorlevel 1 (
  echo ❌ 푸시 실패. 브랜치 이름 또는 권한을 확인하세요.
) else (
  echo ✅ 업로드 완료!
)

endlocal
