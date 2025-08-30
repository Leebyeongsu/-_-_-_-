# 구포현대아파트 통신 환경 개선 신청서 배포 가이드

## 🚀 배포 방법

### 방법 1: GitHub Pages (추천)

1. **GitHub 계정 생성**
   - https://github.com 가입

2. **새 Repository 생성**
   - Repository name: `gupo-apt-application`
   - Public 선택
   - "Create repository" 클릭

3. **파일 업로드**
   - "uploading an existing file" 클릭
   - 다음 파일들을 드래그앤드롭:
     - `index.html`
     - `style.css`
     - `script.js`
     - `qr.html`

4. **GitHub Pages 활성화**
   - Settings 탭 클릭
   - 왼쪽 메뉴에서 "Pages" 클릭
   - Source: "Deploy from a branch" 선택
   - Branch: "main" 선택
   - "Save" 클릭

5. **배포 완료**
   - 몇 분 후 접속 가능
   - URL: `https://사용자명.github.io/gupo-apt-application`

### 방법 2: Netlify (가장 쉬움)

1. **Netlify 접속**
   - https://netlify.com

2. **파일 배포**
   - "Deploy to Netlify" 영역에 폴더 전체를 드래그앤드롭
   - 즉시 배포 완료

3. **URL 확인**
   - 랜덤 URL 생성: `https://amazing-name-123456.netlify.app`
   - Site settings에서 도메인 변경 가능

### 방법 3: Vercel

1. **Vercel 접속**
   - https://vercel.com
   - GitHub 계정으로 로그인

2. **프로젝트 배포**
   - "New Project" → GitHub Repository 선택
   - 자동 빌드 및 배포

## 🔧 카카오톡 설정 (배포 후)

1. **카카오 개발자센터**
   - https://developers.kakao.com

2. **애플리케이션 생성**
   - 새 애플리케이션 추가

3. **플랫폼 설정**
   - Web 플랫폼 추가
   - 사이트 도메인 등록: `https://사용자명.github.io`

4. **JavaScript 키 복사**
   - script.js 파일에서 `YOUR_KAKAO_APP_KEY` 를 실제 키로 변경

## 📱 QR 코드 생성 및 테스트

1. **배포된 사이트 접속**
   - 배포 URL로 접속

2. **QR 코드 생성**
   - "📱 QR 코드 생성" 버튼 클릭
   - PNG/JPG 다운로드

3. **휴대폰 테스트**
   - QR 스캔 앱으로 코드 스캔
   - 신청서 페이지로 이동 확인

4. **인쇄 및 게시**
   - A4 용지에 인쇄
   - 아파트 게시판에 부착

## 🎯 완성된 워크플로우

```
관리사무소
  ↓
웹사이트 배포 (GitHub Pages/Netlify)
  ↓  
QR 코드 생성 및 다운로드
  ↓
A4 용지에 인쇄
  ↓
아파트 게시판 부착
  ↓
주민들이 휴대폰으로 스캔
  ↓
온라인 신청서 작성
  ↓
결과를 카카오톡으로 공유
```

## 💡 추가 팁

- **도메인 구매**: 더 전문적인 URL (예: gupo-apt.com)
- **HTTPS 필수**: 카카오톡 공유를 위해 필요
- **모든 무료 서비스**: HTTPS 자동 제공
- **업데이트**: 파일 수정 후 다시 업로드하면 자동 업데이트

## 📞 문의사항

배포 과정에서 문제가 있으면 언제든 문의하세요!