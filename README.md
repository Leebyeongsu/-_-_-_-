# 공사 신청서 웹페이지

휴대폰에서 QR 코드로 접근 가능한 공사 신청서 웹페이지입니다.

## 주요 기능

- 📱 모바일 최적화된 반응형 디자인
- 📝 간편한 공사 신청서 작성
- 📊 QR 코드 생성 및 다운로드
- 💬 카카오톡 공유 기능
- ✅ 신청 완료 후 결과 확인

## 파일 구성

- `index.html` - 메인 신청서 페이지
- `style.css` - 스타일시트 (모바일 반응형)
- `script.js` - JavaScript 기능 구현
- `qr.html` - QR 코드 생성 페이지

## 사용 방법

### 1. 신청서 작성 (index.html)
1. 웹 브라우저에서 `index.html` 파일을 열기
2. 필요한 정보를 입력하여 신청서 작성
3. 제출 후 결과 확인

### 2. QR 코드 생성 (qr.html)
1. `qr.html` 페이지에서 신청서 URL 입력
2. QR 코드 생성 버튼 클릭
3. PNG/JPG 형태로 다운로드 가능

### 3. 카카오톡 공유 설정
`script.js` 파일에서 카카오 앱 키 설정 필요:
```javascript
Kakao.init('YOUR_KAKAO_APP_KEY'); // 실제 키로 변경
```

#### 카카오 개발자센터 설정 방법
1. [카카오 개발자센터](https://developers.kakao.com/) 접속
2. 애플리케이션 생성
3. JavaScript 키 발급
4. 플랫폼 설정에서 Web 도메인 등록

## 배포 방법

### 로컬 테스트
1. 파일들을 웹 서버에 업로드
2. HTTPS 환경에서 테스트 권장 (카카오톡 공유를 위해)

### 실제 배포
1. 웹 호스팅 서비스에 파일 업로드
2. 카카오 앱 키 설정
3. 도메인 등록 후 QR 코드 생성

## 기술 스택

- HTML5
- CSS3 (Flexbox, Grid, Animations)
- Vanilla JavaScript
- 카카오 SDK
- QRCode.js 라이브러리

## 모바일 지원

- iOS Safari
- Android Chrome
- 반응형 디자인으로 모든 화면 크기 지원

## 라이센스

이 프로젝트는 자유롭게 사용 가능합니다.