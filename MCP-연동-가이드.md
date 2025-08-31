# 🔗 Supabase MCP 연동 가이드

## 📋 개요
이 가이드는 현재 공사 신청서 프로그램을 Supabase MCP(Model Context Protocol)에 연동하는 방법을 설명합니다.

## 🎯 MCP란?
MCP(Model Context Protocol)는 AI 모델이 외부 도구와 서비스에 안전하게 접근할 수 있도록 하는 표준 프로토콜입니다.

## 🚀 연동 단계

### 1단계: MCP 서버 설치
```bash
# MCP Supabase 서버 설치
npm install -g @modelcontextprotocol/server-supabase

# 또는 npx로 실행
npx @modelcontextprotocol/server-supabase
```

### 2단계: 환경 변수 설정
```bash
# .env 파일 생성
SUPABASE_URL=https://boorsqnfkwglzvnhtwcx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE
```

### 3단계: MCP 서버 실행
```bash
# MCP 서버 시작
mcp-server-supabase

# 또는 직접 실행
npx @modelcontextprotocol/server-supabase
```

## 🔧 설정 파일

### mcp-config.json
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-supabase"],
      "env": {
        "SUPABASE_URL": "https://boorsqnfkwglzvnhtwcx.supabase.co",
        "SUPABASE_ANON_KEY": "your_anon_key",
        "SUPABASE_SERVICE_ROLE_KEY": "your_service_role_key"
      }
    }
  }
}
```

## 📁 생성된 파일들

### 1. mcp-client.js
- MCP 클라이언트 클래스
- 데이터베이스 CRUD 작업
- 연결 상태 관리

### 2. mcp-test.html
- MCP 연동 테스트 페이지
- 모든 기능을 시각적으로 테스트
- 실시간 결과 확인

### 3. mcp-config.json
- MCP 서버 설정
- 환경 변수 정의

## 🧪 테스트 방법

### 1. 테스트 페이지 열기
```bash
# 브라우저에서 mcp-test.html 열기
open mcp-test.html
```

### 2. 연결 상태 확인
- "연결 상태 확인" 버튼 클릭
- Supabase 연결 상태 확인

### 3. 기능 테스트
- 데이터베이스 스키마 조회
- 테이블 데이터 조회/삽입/수정
- SQL 쿼리 실행

## 🔐 보안 고려사항

### 1. API 키 관리
- `SUPABASE_SERVICE_ROLE_KEY`는 절대 공개하지 마세요
- 환경 변수나 .env 파일에 안전하게 저장
- Git에 커밋하지 않도록 .gitignore 설정

### 2. 권한 설정
- Supabase RLS(Row Level Security) 활성화
- 필요한 테이블에만 접근 권한 부여
- 사용자 역할별 권한 제한

## 🚨 문제 해결

### 연결 실패 시
1. Supabase URL과 API 키 확인
2. 네트워크 연결 상태 확인
3. Supabase 프로젝트 상태 확인
4. 브라우저 콘솔 오류 메시지 확인

### 권한 오류 시
1. RLS 정책 확인
2. 사용자 역할 권한 확인
3. API 키 권한 확인

## 📚 추가 리소스

### 공식 문서
- [MCP 공식 문서](https://modelcontextprotocol.io/)
- [Supabase MCP 서버](https://github.com/modelcontextprotocol/server-supabase)
- [Supabase JavaScript 클라이언트](https://supabase.com/docs/reference/javascript)

### 유용한 도구
- [Supabase Studio](https://app.supabase.com/) - 데이터베이스 관리
- [Postman](https://www.postman.com/) - API 테스트
- [Insomnia](https://insomnia.rest/) - API 테스트

## 🎉 연동 완료 후

### 1. AI 모델과의 연동
- MCP 서버를 통해 AI가 데이터베이스에 접근
- 자연어로 데이터베이스 쿼리 실행
- 자동화된 데이터 분석 및 보고서 생성

### 2. 확장 가능성
- 다른 MCP 서버와의 연동
- 복잡한 워크플로우 자동화
- 실시간 데이터 모니터링

## 📞 지원

문제가 발생하거나 추가 도움이 필요한 경우:
1. Supabase 커뮤니티 포럼 확인
2. MCP GitHub 이슈 확인
3. 프로젝트 담당자에게 문의

---

**⚠️ 주의사항**: 이 가이드는 개발 환경을 위한 것입니다. 프로덕션 환경에서는 추가적인 보안 설정이 필요합니다.
