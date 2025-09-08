// 알림 서비스 (SMS, 이메일)
import { saveNotificationLog } from './supabase-api.js';
import { supabase } from './supabase-config.js';

// 통신사 표시 변환 함수 (메일 본문 구성용)
function getWorkTypeDisplay(workType) {
    const workTypeMap = {
        'interior': 'KT',
        'exterior': 'SKT',
        'plumbing': 'LGU+',
        'electrical': '기타(지역방송)'
    };
    return workTypeMap[workType] || workType || '미입력';
}

// 날짜 포맷 함수 (메일 본문 구성용)
function formatDate(dateString) {
    if (!dateString) return '미입력';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (_) {
        return dateString;
    }
}



// 텍스트 전용 이메일 내용 구성 (굵게/크게는 불가하므로 강조 문자로 표기)
function buildEmailText(applicationData, adminSettings) {
    const headerTitle = adminSettings.title || '구포현대아파트 통신 환경 개선 신청서';
    const headerSubtitle = adminSettings.subtitle || '새로운 신청서가 접수되었습니다';
    const name = applicationData.name || '미입력';
    const phone = formatPhoneNumber(applicationData.phone);
    const workType = getWorkTypeDisplay(applicationData.workType);
    const startDate = formatDate(applicationData.startDate);
    const description = applicationData.description || '내용 없음';
    const submitted = new Date(applicationData.submittedAt || Date.now()).toLocaleString('ko-KR');

    return [
        `====== ${headerTitle} ======`,
        `${headerSubtitle}`,
        '',
        `공사 요청 : ${name}`,
        `연락처 : ${phone}`,
        `사용중인 통신사 : ${workType}`,
        `==== 공사 희망일 : ${startDate} ====`,
        `상세 요청 사항 : ${description}`,
        `신청 일시 : ${submitted}`,
        '',
        '담당자가 빠른 시일 내에 연락드리겠습니다'
    ].join('\n');
}
// 휴대폰 번호 포맷팅 (하이픈 추가)
function formatPhoneNumber(raw) {
    if (!raw) return '미입력';
    const digits = String(raw).replace(/\D/g, '');
    if (digits.length === 11) {
        return `${digits.slice(0,3)}-${digits.slice(3,7)}-${digits.slice(7)}`;
    }
    if (digits.length === 10) {
        return `${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6)}`;
    }
    return raw;
}

// SMS 발송 (Twilio API 연동 예시)
export async function sendSMS(phoneNumber, message) {
    try {
        // TODO: 실제 Twilio API 연동
        // const response = await fetch('/api/send-sms', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ phoneNumber, message })
        // });
        
        console.log('SMS 발송 (시뮬레이션):', { phoneNumber, message });
        
        // 알림 로그 저장
        await saveNotificationLog({
            type: 'sms',
            recipient: phoneNumber,
            message: message,
            success: true
        });
        
        return { success: true };
    } catch (error) {
        console.error('SMS 발송 실패:', error);
        
        // 실패 로그 저장
        await saveNotificationLog({
            type: 'sms',
            recipient: phoneNumber,
            message: message,
            success: false
        });
        
        return { success: false, error: error.message };
    }
}

// 이메일 발송 로그 관리
export async function logEmailAttempt(applicationId, provider, status, error = null) {
    try {
        await supabase.from('notification_logs').insert([{
            application_id: applicationId,
            provider: provider, // 'emailjs' 또는 'sendgrid'
            status: status,
            error: error,
            timestamp: new Date().toISOString()
        }]);
    } catch (err) {
        console.error('로그 저장 실패:', err);
    }
}

// SendGrid를 통한 백업 발송 함수
export async function sendViaSendGrid(applicationData) {
    try {
        console.log('📨 SendGrid를 통한 백업 발송 시도...');
        
        const { data, error } = await supabase.functions.invoke('send-notification-sendgrid', {
            body: { application_id: applicationData.id }
        });

        if (error) {
            await logEmailAttempt(applicationData.id, 'sendgrid', 'failed', error.message);
            throw error;
        }

        await logEmailAttempt(applicationData.id, 'sendgrid', 'sent');
        return data;
    } catch (error) {
        console.error('SendGrid 발송 실패:', error);
        return { success: false, error: error.message };
    }
}

// 신청서 접수 알림 발송
export async function sendApplicationNotification(applicationData, adminSettings) {
    const results = {
        sms: [],
        email: []
    };
    
    try {
        // SMS 알림 발송
        if (adminSettings.phones && adminSettings.phones.length > 0) {
            const smsMessage = `🔔 새 신청서 접수\n\n신청자: ${applicationData.name}\n연락처: ${applicationData.phone}\n통신사: ${applicationData.workType || '미입력'}\n요청사항: ${applicationData.description || '미입력'}`;
            
            for (const phone of adminSettings.phones) {
                if (phone && phone.trim()) {
                    const result = await sendSMS(phone.trim(), smsMessage);
                    results.sms.push({ phone, success: result.success });
                }
            }
        }
        
        // 이메일 알림 발송
        if (adminSettings.emails && adminSettings.emails.length > 0) {
            const emailSubject = `🔔 새 신청서 접수 - ${applicationData.name || '무명'} (${getWorkTypeDisplay(applicationData.workType)})`;
            const emailContent = buildEmailText(applicationData, adminSettings);
            
            for (const email of adminSettings.emails) {
                if (email && email.trim()) {
                    const result = await sendEmail(email.trim(), emailSubject, emailContent);
                    results.email.push({ email, success: result.success });
                }
            }

            // 모든 이메일 발송이 실패하면 폴백 (mailto) 시도
            const anySuccess = results.email.some(r => r.success);
            if (!anySuccess && adminSettings.emails[0]) {
                try {
                    // 폴백 본문도 텍스트 전용 사용
                    sendFallbackNotification('email', adminSettings.emails[0], emailContent);
                } catch (e) {
                    console.warn('폴백 이메일 시도 실패:', e);
                }
            }
        }
        
        return results;
    } catch (error) {
        console.error('알림 발송 중 오류:', error);
        return { error: error.message };
    }
}

// 폴백 알림 (브라우저 기본 앱 사용)
export function sendFallbackNotification(type, recipient, message) {
    try {
        if (type === 'sms') {
            // SMS 폴백
            if (navigator.userAgent.includes('Mobile')) {
                window.location.href = `sms:${recipient}?body=${encodeURIComponent(message)}`;
            } else {
                // 데스크톱에서는 클립보드에 복사
                navigator.clipboard.writeText(message);
                alert(`SMS 메시지가 클립보드에 복사되었습니다.\n\n받는 사람: ${recipient}\n메시지: ${message}`);
            }
        } else if (type === 'email') {
            // 이메일 폴백 - 고객 폰에서 메일 앱 팝업 방지
            // mailto 링크 사용하지 않음
            console.log('이메일 폴백 알림 (팝업 방지):', { recipient, message });
            return { success: false, type: 'fallback', reason: '팝업 방지' };
        }
        
        return { success: true, type: 'fallback' };
    } catch (error) {
        console.error('폴백 알림 실패:', error);
        return { success: false, error: error.message };
    }
}
