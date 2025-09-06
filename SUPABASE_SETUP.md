# Supabase 연동 완료

이 프로젝트는 이미 Supabase와 연동되어 있습니다.

## 현재 연동 상태

✅ **Supabase 프로젝트**: `boorsqnfkwglzvnhtwcx.supabase.co`
✅ **데이터베이스 테이블**: 자동 생성됨
✅ **관리자 설정 저장/로드**: Supabase 연동 완료
✅ **신청서 저장**: Supabase 연동 완료
✅ **알림 시스템**: 로그 저장 완료

## 주요 기능

### 1. 관리자 설정 관리
- 관리자가 설정한 제목, 메일 주소, 전화번호를 Supabase에 저장
- 여러 기기에서 설정 동기화
- localStorage와 Supabase 양방향 동기화

### 2. 신청서 접수 시스템
- 고객이 제출한 신청서를 Supabase에 저장
- 자동 신청번호 생성 (`APP-YYYYMMDD-XXXX`)
- 관리자 알림 로그 생성 (이메일, SMS)

### 3. 데이터베이스 구조

#### admin_settings 테이블
```sql
CREATE TABLE admin_settings (
    id SERIAL PRIMARY KEY,
    apartment_id TEXT UNIQUE NOT NULL,
    title TEXT,
    phones TEXT[],
    emails TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### applications 테이블
```sql
CREATE TABLE applications (
    id SERIAL PRIMARY KEY,
    application_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    work_type TEXT,
    work_type_display TEXT,
    start_date DATE,
    description TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### notification_logs 테이블
```sql
CREATE TABLE notification_logs (
    id SERIAL PRIMARY KEY,
    application_id INTEGER REFERENCES applications(id),
    notification_type TEXT NOT NULL,
    recipient TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 사용 방법

### 관리자 모드
1. 제목 클릭으로 편집 가능
2. "메일 입력" 버튼으로 관리자 메일 등록
3. "폰번호 입력" 버튼으로 관리자 연락처 등록
4. "QR 코드 생성"으로 고객용 링크 생성
5. 모든 설정은 Supabase에 자동 저장

### 고객 모드
1. QR 코드 스캔 또는 `?customer=true` URL로 접속
2. 신청서 작성 및 제출
3. 신청번호 발급 및 관리자에게 알림 전송
4. Supabase에 영구 저장

## 실시간 알림

현재는 알림 로그만 Supabase에 저장됩니다. 실제 이메일/SMS 발송을 위해서는 다음과 같은 추가 설정이 필요합니다:

### 이메일 발송 (향후 구현)
- Supabase Edge Functions 활용
- SendGrid, AWS SES 등 이메일 서비스 연동
- notification_logs 테이블의 pending 상태 처리

### SMS 발송 (향후 구현)
- Twilio, AWS SNS 등 SMS 서비스 연동
- 한국 SMS 서비스 (네이버 클라우드, KT 등) 연동

## 모니터링

### Supabase 대시보드에서 확인 가능
- 접수된 신청서 목록
- 관리자 설정 현황
- 알림 발송 로그
- 데이터베이스 사용량

## 보안 설정

✅ **Row Level Security (RLS)**: 활성화됨
✅ **API 키 보안**: anon key만 사용
✅ **CORS 설정**: 필요한 도메인만 허용

## 백업 및 복구

Supabase는 자동으로 백업을 수행하며, 필요시 특정 시점으로 복구할 수 있습니다.

## 문제해결

### 연결 오류 시
1. 브라우저 개발자 도구에서 콘솔 확인
2. Supabase 프로젝트 상태 확인
3. API 키와 URL 재확인

### 데이터 저장 실패 시
- localStorage 백업으로 자동 전환
- 네트워크 연결 상태 확인
- Supabase 서비스 상태 확인