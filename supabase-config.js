// Supabase 클라이언트 설정
import { createClient } from 'https://esm.sh/@supabase/supabase-js'

// ✅ Supabase 프로젝트 설정 (실제 값으로 교체 완료!)
const supabaseUrl = 'https://boorsqnfkwglzvnhtwcx.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvb3JzcW5ma3dnbHp2bmh0d2N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NDE3NDEsImV4cCI6MjA3MjExNzc0MX0.eU0BSY8u1b-qcx3OTgvGIW-EQHotI4SwNuWAg0eqed0'

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
