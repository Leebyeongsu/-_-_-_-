// Supabase API 연동 함수들
import { supabase } from './supabase-config.js';

// 관리자 설정 저장
export async function saveAdminSettings(apartmentId, settings) {
    try {
        console.log('관리자 설정 저장 시도:', { apartmentId, settings });
        
        const { data, error } = await supabase
            .from('admin_settings')
            .upsert({
                id: apartmentId,
                title: settings.title || '',
                subtitle: settings.subtitle || '',
                phones: settings.phones || [],
                emails: settings.emails || [],
                updated_at: new Date().toISOString()
            });

        if (error) {
            console.error('Supabase 오류:', error);
            throw error;
        }

        console.log('관리자 설정 저장 성공:', data);
        return { success: true, data };
    } catch (error) {
        console.error('관리자 설정 저장 실패:', error);
        return { success: false, error: error.message };
    }
}

// 관리자 설정 조회
export async function getAdminSettings(apartmentId) {
    try {
        console.log('관리자 설정 조회 시도:', apartmentId);
        
        // 먼저 테이블 존재 여부 확인
        const { data: tableCheck, error: tableError } = await supabase
            .from('admin_settings')
            .select('count')
            .limit(1);
            
        if (tableError) {
            console.error('테이블 접근 오류:', tableError);
            return { success: false, error: '테이블에 접근할 수 없습니다: ' + tableError.message };
        }
        
        // 실제 데이터 조회
        const { data, error } = await supabase
            .from('admin_settings')
            .select('*')
            .eq('id', apartmentId);

        if (error) {
            console.error('데이터 조회 오류:', error);
            throw error;
        }

        console.log('관리자 설정 조회 성공:', data);
        return { success: true, data: data && data.length > 0 ? data[0] : null };
    } catch (error) {
        console.error('관리자 설정 조회 실패:', error);
        return { success: false, error: error.message };
    }
}

// 신청서 저장
export async function saveApplication(applicationData) {
    try {
        console.log('신청서 저장 시도:', applicationData);
        
        const { data, error } = await supabase
            .from('applications')
            .insert([applicationData]);

        if (error) {
            console.error('Supabase 오류:', error);
            throw error;
        }

        console.log('신청서 저장 성공:', data);
        return { success: true, data };
    } catch (error) {
        console.error('신청서 저장 실패:', error);
        return { success: false, error: error.message };
    }
}

// 신청서 목록 조회
export async function getApplications() {
    try {
        const { data, error } = await supabase
            .from('applications')
            .select('*')
            .order('submitted_at', { ascending: false });

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        console.error('신청서 조회 실패:', error);
        return { success: false, error: error.message };
    }
}

// 알림 로그 저장
export async function saveNotificationLog(logData) {
    try {
        const { data, error } = await supabase
            .from('notification_logs')
            .insert([logData]);

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        console.error('알림 로그 저장 실패:', error);
        return { success: false, error: error.message };
    }
}

// 실시간 신청서 구독
export async function subscribeToApplications(callback) {
    try {
        const subscription = supabase
            .channel('applications')
            .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'applications' },
                (payload) => {
                    callback(payload.new);
                }
            )
            .subscribe();

        return subscription;
    } catch (error) {
        console.error('실시간 구독 실패:', error);
        return null;
    }
}
