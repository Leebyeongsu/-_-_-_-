# 🚀 GitHub 업로드 및 배포 가이드

## 📋 준비사항
- GitHub 계정 (없으면 https://github.com 에서 회원가입)
- Git 프로그램 설치 (https://git-scm.com/downloads)

---

## 1️⃣ GitHub 저장소 생성

### 1. GitHub 웹사이트 접속
- https://github.com 접속 후 로그인

### 2. 새 저장소 만들기
- 오른쪽 상단 **"+"** 버튼 클릭 → **"New repository"** 선택

### 3. 저장소 설정
```
Repository name: gupo-apartment-form
Description: 구포현대아파트 통신 환경 개선 신청서
☑️ Public (공개) - GitHub Pages 무료 사용을 위해 필수
☑️ Add a README file
```

### 4. **"Create repository"** 클릭

---

## 2️⃣ 로컬 컴퓨터에서 Git 설정

### 1. 명령 프롬프트(CMD) 열기
- Windows 키 + R → `cmd` 입력 → 엔터

### 2. Git 사용자 정보 설정 (최초 1회만)
```bash
git config --global user.name "당신의이름"
git config --global user.email "당신의이메일@example.com"
```

### 3. 현재 폴더로 이동
```bash
cd "C:\Users\user\claude_code\공사 신청서"
```

---

## 3️⃣ 파일 업로드 (방법 1: 웹 인터페이스 - 초보자 추천)

### 1. GitHub 저장소 페이지에서
- **"uploading an existing file"** 클릭

### 2. 파일 드래그 앤 드롭
다음 파일들을 모두 선택해서 드래그:
```
✅ index.html
✅ style.css  
✅ script.js
✅ 관리자.html
✅ 관리자.js
✅ 확인.html
✅ 테스트-고객용.html
✅ README.md
```

### 3. 커밋 메시지 작성
```
Add: 구포현대아파트 통신 환경 개선 신청서 시스템

🎯 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

### 4. **"Commit changes"** 클릭

---

## 4️⃣ GitHub Pages 활성화

### 1. 저장소 설정으로 이동
- 저장소 페이지에서 **"Settings"** 탭 클릭

### 2. Pages 설정
- 왼쪽 메뉴에서 **"Pages"** 클릭
- Source: **"Deploy from a branch"** 선택
- Branch: **"main"** 선택, 폴더는 **"/ (root)"** 선택
- **"Save"** 클릭

### 3. 배포 완료 확인
- 몇 분 후 다음 주소로 접속 가능:
```
https://당신의깃허브아이디.github.io/gupo-apartment-form/
```

---

## 5️⃣ 파일 업로드 (방법 2: Git 명령어 - 고급 사용자)

### 1. Git 저장소 초기화
```bash
git init
git remote add origin https://github.com/당신의아이디/gupo-apartment-form.git
```

### 2. 파일 추가 및 커밋
```bash
git add .
git commit -m "Add: 구포현대아파트 통신 환경 개선 신청서 시스템

🎯 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 3. GitHub에 업로드
```bash
git branch -M main
git push -u origin main
```

---

## 6️⃣ 배포 후 테스트

### 1. 접속 URL들
```
🔗 관리자용: https://당신의아이디.github.io/gupo-apartment-form/
🔗 고객용: https://당신의아이디.github.io/gupo-apartment-form/?customer=true
🔗 관리자 패널: https://당신의아이디.github.io/gupo-apartment-form/관리자.html
🔗 신청 확인: https://당신의아이디.github.io/gupo-apartment-form/확인.html
```

### 2. 기능 테스트 순서
1. **관리자 연락처 설정** (문자/메일)
2. **QR 코드 생성** → 스마트폰으로 스캔 테스트
3. **고객용 신청서 작성** → 자동 알림 확인
4. **관리자 페이지**에서 신청 내역 확인

---

## 7️⃣ 수정 및 업데이트 방법

### 웹 인터페이스로 수정
1. GitHub 저장소에서 파일 클릭
2. 연필 아이콘(Edit) 클릭
3. 수정 후 **"Commit changes"** 클릭

### Git 명령어로 수정
```bash
# 수정 후
git add .
git commit -m "Update: 수정 내용 설명"
git push
```

---

## 8️⃣ 카카오톡 공유 설정 (선택사항)

### 1. 카카오 개발자센터 접속
- https://developers.kakao.com 회원가입/로그인

### 2. 애플리케이션 생성
- **"내 애플리케이션"** → **"애플리케이션 추가하기"**
- 앱 이름: "구포현대아파트 신청서"

### 3. JavaScript 키 복사
- **"앱 키"** → **"JavaScript 키"** 복사

### 4. 플랫폼 설정
- **"플랫폼"** → **"Web 플랫폼 등록"**
- 사이트 도메인: `https://당신의아이디.github.io`

### 5. 코드에 적용
`script.js`와 `관리자.js` 파일에서:
```javascript
// 1번째 줄 수정
Kakao.init('복사한_JavaScript_키');
```

---

## 🎯 완료! 

이제 다음과 같은 완전한 시스템이 구축되었습니다:

✅ **온라인 신청서 시스템**  
✅ **QR 코드로 모바일 접근**  
✅ **자동 문자/메일 알림**  
✅ **관리자 패널**  
✅ **GitHub Pages 무료 호스팅**

### 📱 모바일 테스트
- 스마트폰으로 QR 코드 스캔
- 신청서 작성 후 제출
- 관리자 휴대폰으로 즉시 알림 확인

### 🔧 문제 해결
- 파일이 안 보이면: 5-10분 후 다시 시도 (GitHub Pages 배포 시간)
- 카카오톡 공유 안되면: 카카오 개발자센터 설정 확인
- 알림 안오면: 관리자 연락처 설정 확인

---

**🎉 축하합니다! 구포현대아파트 통신 환경 개선 신청서 시스템이 성공적으로 배포되었습니다!**