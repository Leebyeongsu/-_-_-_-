// Supabase 클라이언트 설정
let supabase = null;

// Supabase 클라이언트 초기화 함수
function initializeSupabase() {
    try {
        // CDN에서 로드된 Supabase 사용
        if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
            const supabaseUrl = 'https://boorsqnfkwglzvnhtwcx.supabase.co';
            const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvb3JzcW5ma3dnbHp2bmh0d2N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NDE3NDEsImV4cCI6MjA3MjExNzc0MX0.eU0BSY8u1b-qcx3OTgvGIW-EQHotI4SwNuWAg0eqed0';
            
            // Supabase 클라이언트 생성
            supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
            
            console.log('Supabase 클라이언트 초기화 성공');
            return supabase;
        } else {
            console.warn('Supabase CDN이 로드되지 않았습니다.');
            return null;
        }
    } catch (error) {
        console.error('Supabase 클라이언트 초기화 실패:', error);
        return null;
    }
}

// 페이지 로드 후 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSupabase);
} else {
    initializeSupabase();
}

// 데이터베이스 테이블 구조
/*
-- 관리자 설정 테이블
CREATE TABLE admin_settings (
    id SERIAL PRIMARY KEY,
    apartment_id TEXT UNIQUE NOT NULL,
    title TEXT,
    subtitle TEXT,
    phones TEXT[],
    emails TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 신청서 테이블
CREATE TABLE applications (
    id SERIAL PRIMARY KEY,
    application_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    work_type TEXT,
    work_type_display TEXT,
    budget TEXT,
    budget_display TEXT,
    start_date DATE,
    description TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 관리자 알림 로그 테이블
CREATE TABLE notification_logs (
    id SERIAL PRIMARY KEY,
    application_id INTEGER REFERENCES applications(id),
    notification_type TEXT NOT NULL, -- 'sms' or 'email'
    recipient TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
*/

// Supabase Edge Functions 기본 URL (프로젝트 ref 기반)
const functionsBaseUrl = `https://boorsqnfkwglzvnhtwcx.functions.supabase.co`;

// 전역 변수로 노출
window.supabaseClient = supabase;
window.initializeSupabase = initializeSupabase;
window.functionsBaseUrl = functionsBaseUrl;
