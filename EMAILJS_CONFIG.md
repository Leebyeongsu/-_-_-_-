# EmailJS 설정 가이드

고객이 신청서를 제출할 때 관리자에게 실제 이메일이 발송되도록 EmailJS를 설정하는 방법입니다.

> **💡 참고**: 현재 시스템은 **Supabase Edge Functions**가 1차, **EmailJS**가 2차 백업으로 작동합니다.  
> Edge Functions 설정이 어려우시면 EmailJS만으로도 완전히 작동합니다!

## 1. EmailJS 계정 생성

1. [EmailJS 웹사이트](https://www.emailjs.com/)에서 계정을 생성하세요
2. 무료 플랜: 월 200개 이메일 발송 가능

## 2. 이메일 서비스 연결

### Gmail 연결 (권장)
1. EmailJS 대시보드 → "Email Services" → "Add New Service"
2. **Gmail** 선택
3. 구글 계정으로 로그인 및 권한 승인
4. 서비스 ID 확인: `service_gmail` (기본값)

### Outlook 연결 (대안)
1. "Add New Service" → **Outlook** 선택
2. 마이크로소프트 계정으로 로그인
3. 서비스 ID 확인: `service_outlook`

## 3. 이메일 템플릿 생성

1. "Email Templates" → "Create New Template"
2. 템플릿 ID: `template_application` (중요!)
3. 제목: `[{{apartment_name}}] 새 신청서 접수 - {{application_number}}`

### 템플릿 내용:
```
안녕하세요, {{apartment_name}} 관리자님

새로운 통신환경개선 신청서가 접수되었습니다.

■ 신청 정보
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• 신청번호: {{application_number}}
• 신청자: {{customer_name}}
• 연락처: {{customer_phone}}
• 동/호수: {{unit_info}}
• 현재 통신사: {{current_provider}}
• 희망 공사일: {{preferred_date}}
• 상세 요청사항: {{description}}
• 제출일시: {{submitted_at}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

관리자님께서 신청 내용을 확인하시고 적절한 조치를 취해주시기 바랍니다.

신청서 페이지: {{form_url}}

※ 이 메일은 자동으로 발송된 메일입니다.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{{apartment_name}} 통신환경개선 시스템
```

## 4. 공개키 설정

1. EmailJS 대시보드에서 **"Account"** → **"General"** → **"Public Key"** 확인
2. 현재 `script.js` 19행에서 **임시 공개키**를 **실제 공개키**로 교체:

**현재 코드:**
```javascript
emailjs.init('pGR5T6ZNnhBCECTrI'); // 임시 공개키
```

**수정할 코드:**
```javascript
emailjs.init('YOUR_ACTUAL_PUBLIC_KEY'); // EmailJS에서 발급받은 실제 공개키로 교체
```

**⚠️ 중요**: 반드시 실제 EmailJS 공개키로 변경해야 이메일이 발송됩니다!

## 5. 서비스 ID 확인 및 수정

`script.js` 파일의 **346-350행** 확인 및 수정:

**현재 코드:**
```javascript
const emailConfigs = [
    { service: 'service_gmail', template: 'template_application' },
    { service: 'service_outlook', template: 'template_application' },
    { service: 'default_service', template: 'default_template' }
];
```

**수정할 내용:**
- `service_gmail` → EmailJS에서 생성한 **실제 Gmail 서비스 ID**로 변경
- `service_outlook` → EmailJS에서 생성한 **실제 Outlook 서비스 ID**로 변경  
- `template_application` → 3단계에서 생성한 **실제 템플릿 ID**로 변경

**수정 예시:**
```javascript
const emailConfigs = [
    { service: 'service_abc123', template: 'template_application' }, // 실제 Gmail 서비스 ID
    { service: 'service_xyz789', template: 'template_application' }, // 실제 Outlook 서비스 ID
    { service: 'default_service', template: 'default_template' }     // 삭제 또는 실제 값으로 변경
];
```

## 6. 테스트 방법

### 관리자 설정
1. 관리자 모드에서 "메일 입력" 버튼 클릭
2. 테스트용 이메일 주소 입력 (본인 이메일 권장)
3. "저장" 버튼 클릭

### 신청서 테스트
1. `?customer=true` 모드로 접속
2. 테스트 신청서 작성 및 제출
3. 등록한 이메일로 발송 확인

## 7. 실제 설정 값 예시

### script.js 파일에서 수정해야 할 2곳:

**1️⃣ 공개키 설정 (19행):**
```javascript
// 변경 전
emailjs.init('pGR5T6ZNnhBCECTrI'); // 임시 공개키

// 변경 후 (실제 EmailJS 공개키로 교체)
emailjs.init('user_aBcDeFgHiJkLmNoPqRs'); // 실제 공개키
```

**2️⃣ 서비스 설정 (347-349행):**
```javascript
// 변경 전
const emailConfigs = [
    { service: 'service_gmail', template: 'template_application' },
    { service: 'service_outlook', template: 'template_application' },
    { service: 'default_service', template: 'default_template' }
];

// 변경 후 (실제 서비스 ID로 교체)
const emailConfigs = [
    { service: 'service_abc123', template: 'template_application' }, // 실제 Gmail 서비스 ID
    { service: 'service_xyz789', template: 'template_application' }  // 실제 Outlook 서비스 ID
    // 세 번째 항목은 삭제하거나 실제 서비스로 교체
];
```

**⚠️ 필수 수정사항**: 위 2곳을 반드시 수정해야 EmailJS가 작동합니다!

## 8. 문제 해결

### 이메일이 발송되지 않는 경우
1. **브라우저 개발자 도구** 콘솔 확인
2. **EmailJS 대시보드** → "Logs" 에서 발송 상태 확인
3. **이메일 템플릿** 변수명 정확한지 확인
4. **서비스 ID와 템플릿 ID** 정확한지 확인

### 스팸 폴더 확인
- Gmail, Outlook 등에서 스팸 폴더 확인
- 발송자를 안전한 발송자 목록에 추가

### 발송량 제한
- 무료 계정: 월 200개 제한
- 유료 계정 업그레이드 고려

## 9. 보안 고려사항

- 공개키는 클라이언트에 노출됨 (정상)
- 중요한 정보는 템플릿에 포함하지 말 것
- 발송량 모니터링으로 남용 방지

## 10. 현재 이메일 시스템 작동 방식

### 🔄 **이중 발송 시스템**
1. **1차**: Supabase Edge Functions (서버 사이드, 보안 강화)
2. **2차**: EmailJS (클라이언트 사이드, 백업)

### 📋 **작동 순서**
```
고객 신청서 제출 
    ↓
Supabase에 저장 
    ↓
Edge Function 호출 시도
    ↓
성공 → SendGrid로 이메일 발송
    ↓ (실패시)
EmailJS로 백업 발송
```

### ✅ **구현된 기능**
- ✅ **다중 이메일 수신자 지원** (관리자 여러 명)
- ✅ **여러 이메일 서비스 fallback** (Gmail, Outlook 등)
- ✅ **Supabase와 연동하여 발송 로그 저장**
- ✅ **로컬 백업에서도 이메일 발송**
- ✅ **스팸 방지를 위한 발송 간격 조절**
- ✅ **상세한 오류 로그 및 디버깅 정보**

### 🚀 **EmailJS만 사용하기**
만약 Supabase Edge Functions 설정이 복잡하다면:
1. **EmailJS 설정만 완료**하면 됩니다
2. Edge Functions가 실패하면 **자동으로 EmailJS로 전환**
3. 기능상 차이 없이 완전히 작동합니다!

### 📧 **최종 확인 사항**
✅ EmailJS 계정 생성 완료  
✅ Gmail/Outlook 서비스 연결 완료  
✅ 이메일 템플릿 생성 완료 (`template_application`)  
✅ script.js의 공개키 수정 (19행)  
✅ script.js의 서비스 ID 수정 (347-349행)  
✅ 관리자 모드에서 이메일 주소 등록  

이제 모든 설정이 완료되면 고객이 신청서를 제출할 때마다 **관리자 이메일로 자동 발송**됩니다! 🎉