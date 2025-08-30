# GitHub Pages 배포 완전 가이드

## 🚀 Step 1: Repository 생성

1. **GitHub 로그인**
   - https://github.com 접속

2. **새 Repository 생성**
   - 우측 상단 `+` 버튼 → `New repository`
   - Repository name: `gupo-apt-communication`
   - Description: `구포현대아파트 통신 환경 개선 신청서`
   - **Public** 선택 (중요: Private는 유료)
   - `Create repository` 클릭

## 📁 Step 2: 파일 업로드

### 방법 A: 웹에서 업로드 (쉬움)
```
1. "uploading an existing file" 링크 클릭
2. 다음 4개 파일을 드래그앤드롭:
   ✅ index.html
   ✅ style.css
   ✅ script.js
   ✅ qr.html

3. Commit message 입력: "구포현대아파트 신청서 초기 버전"
4. "Commit changes" 버튼 클릭
```

### 방법 B: Git 명령어 (고급)
```bash
# 로컬 폴더에서
git init
git add .
git commit -m "구포현대아파트 신청서 초기 버전"
git branch -M main
git remote add origin https://github.com/사용자명/gupo-apt-communication.git
git push -u origin main
```

## 🌐 Step 3: GitHub Pages 활성화

1. **Settings 탭 클릭**
   - Repository 메인 페이지에서 `Settings` 탭

2. **Pages 설정**
   - 왼쪽 메뉴에서 `Pages` 클릭
   - Source: `Deploy from a branch` 선택
   - Branch: `main` (또는 `master`) 선택
   - Folder: `/ (root)` 선택
   - `Save` 버튼 클릭

3. **배포 대기**
   - "Your site is ready to be published at..." 메시지 확인
   - 몇 분 후 녹색으로 변경: "Your site is published at..."

## 🎯 Step 4: 접속 URL 확인

**배포된 웹사이트 주소:**
```
https://사용자명.github.io/gupo-apt-communication
```

**예시:**
- 사용자명이 `johnsmith`인 경우
- https://johnsmith.github.io/gupo-apt-communication

## 📱 Step 5: 카카오톡 설정 (중요!)

### 카카오 개발자센터 설정
1. **로그인**
   - https://developers.kakao.com

2. **애플리케이션 생성**
   - `내 애플리케이션` → `애플리케이션 추가하기`
   - 앱 이름: `구포현대아파트 신청서`

3. **플랫폼 설정**
   - `플랫폼` 탭 → `Web 플랫폼 등록`
   - 사이트 도메인: `https://사용자명.github.io`

4. **JavaScript 키 복사**
   - `앱 키` 탭에서 `JavaScript 키` 복사

### script.js 파일 수정
```javascript
// 1행 수정:
Kakao.init('복사한_JavaScript_키');
```

### 파일 업데이트
```
1. GitHub에서 script.js 파일 클릭
2. 연필 모양 (Edit) 아이콘 클릭  
3. 1행의 키 부분 수정
4. "Commit changes" 클릭
5. 몇 분 후 자동 업데이트
```

## 🎨 Step 6: QR 코드 재생성

1. **배포된 사이트 접속**
   - https://사용자명.github.io/gupo-apt-communication

2. **QR 코드 생성**
   - `📱 QR 코드 생성` 버튼 클릭
   - 이제 실제 웹 URL이 담긴 QR 코드 생성됨

3. **다운로드 및 테스트**
   - PNG/JPG 다운로드
   - 휴대폰으로 스캔 테스트 ✅

## 📋 Step 7: 완성된 워크플로우

```
✅ GitHub Repository 생성
✅ 파일 업로드 (index.html, style.css, script.js, qr.html)
✅ GitHub Pages 활성화
✅ 웹사이트 배포 (https://사용자명.github.io/...)
✅ 카카오 개발자센터 설정
✅ QR 코드 생성 및 다운로드
✅ A4 용지 인쇄
✅ 아파트 게시판 부착
✅ 주민들 휴대폰 스캔 → 온라인 신청
```

## 🛠️ 문제 해결

### Q: "404 Page not found" 오류
A: index.html 파일이 root 폴더에 있는지 확인

### Q: 카카오톡 공유 안됨
A: 
- HTTPS 필수 (GitHub Pages는 자동 제공)
- 카카오 개발자센터 도메인 등록 확인
- JavaScript 키 정확히 입력했는지 확인

### Q: QR 스캔해도 접속 안됨
A:
- GitHub Pages 활성화 확인
- 배포 완료 여부 확인 (녹색 체크)
- URL 정확히 입력했는지 확인

## 💡 추가 팁

- **무료**: GitHub Pages는 완전 무료
- **HTTPS**: 자동으로 보안 연결 제공
- **업데이트**: 파일 수정하면 자동으로 웹사이트 업데이트
- **백업**: GitHub에 코드가 안전하게 저장됨
- **도메인**: 원하면 사용자 도메인 연결 가능

이제 완벽한 온라인 신청서 시스템이 완성됩니다! 🎉