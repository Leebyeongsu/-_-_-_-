# EmailJS 설정 가이드

고객이 신청서를 제출할 때 관리자에게 실제 이메일이 발송되도록 EmailJS를 설정하는 방법입니다.

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

1. "Account" → "General" → "Public Key" 확인
2. `script.js` 파일 수정:

```javascript
// 15-19행 부근 수정
emailjs.init('YOUR_ACTUAL_PUBLIC_KEY'); // 실제 공개키로 교체
```

## 5. 서비스 ID 확인 및 수정

`script.js` 파일의 338-342행 확인:

```javascript
const emailConfigs = [
    { service: 'service_gmail', template: 'template_application' },  // 실제 Gmail 서비스 ID
    { service: 'service_outlook', template: 'template_application' }, // 실제 Outlook 서비스 ID  
    { service: 'default_service', template: 'default_template' }      // 기본 서비스 (있는 경우)
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

```javascript
// 실제 설정 예시 (script.js 19행)
emailjs.init('user_aBcDeFgHiJkLmNoPqRs'); // 실제 공개키

// 실제 서비스 설정 예시 (script.js 339행)
const emailConfigs = [
    { service: 'service_abc123', template: 'template_application' }, // Gmail 서비스
    { service: 'service_xyz789', template: 'template_application' }  // 백업 서비스
];
```

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

## 10. 현재 구현된 기능

✅ **다중 이메일 수신자 지원**
✅ **여러 이메일 서비스 fallback**
✅ **Supabase와 연동하여 발송 로그 저장**
✅ **로컬 백업에서도 이메일 발송**
✅ **스팸 방지를 위한 발송 간격 조절**
✅ **상세한 오류 로그 및 디버깅 정보**

이제 모든 설정이 완료되면 고객이 신청서를 제출할 때마다 관리자 이메일로 자동 발송됩니다!