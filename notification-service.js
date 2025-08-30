// 알림 서비스 (SMS, 이메일)
import { saveNotificationLog } from './supabase-api.js';

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

// 이메일 발송 (Supabase Edge Function 연동 예시)
export async function sendEmail(emailAddress, subject, message) {
    try {
        // TODO: 실제 Supabase Edge Function 연동
        // const response = await fetch('/api/send-email', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ emailAddress, subject, message })
        // });
        
        console.log('이메일 발송 (시뮬레이션):', { emailAddress, subject, message });
        
        // 알림 로그 저장
        await saveNotificationLog({
            type: 'email',
            recipient: emailAddress,
            message: `${subject}: ${message}`,
            success: true
        });
        
        return { success: true };
    } catch (error) {
        console.error('이메일 발송 실패:', error);
        
        // 실패 로그 저장
        await saveNotificationLog({
            type: 'email',
            recipient: emailAddress,
            message: `${subject}: ${message}`,
            success: false
        });
        
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
            const smsMessage = `🔔 새 신청서 접수\n\n신청자: ${applicationData.name}\n연락처: ${applicationData.phone}\n주소: ${applicationData.address || '미입력'}\n내용: ${applicationData.content || '미입력'}`;
            
            for (const phone of adminSettings.phones) {
                if (phone && phone.trim()) {
                    const result = await sendSMS(phone.trim(), smsMessage);
                    results.sms.push({ phone, success: result.success });
                }
            }
        }
        
        // 이메일 알림 발송
        if (adminSettings.emails && adminSettings.emails.length > 0) {
            const emailSubject = '🔔 새 신청서 접수 알림';
            const emailMessage = `
새로운 신청서가 접수되었습니다.

신청자 정보:
- 이름: ${applicationData.name}
- 연락처: ${applicationData.phone}
- 이메일: ${applicationData.email || '미입력'}
- 주소: ${applicationData.address || '미입력'}

신청 내용:
${applicationData.content || '내용 없음'}

접수 시간: ${new Date(applicationData.submittedAt).toLocaleString('ko-KR')}
            `;
            
            for (const email of adminSettings.emails) {
                if (email && email.trim()) {
                    const result = await sendEmail(email.trim(), emailSubject, emailMessage);
                    results.email.push({ email, success: result.success });
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
            // 이메일 폴백
            const subject = '🔔 새 신청서 접수 알림';
            const mailtoLink = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
            window.location.href = mailtoLink;
        }
        
        return { success: true, type: 'fallback' };
    } catch (error) {
        console.error('폴백 알림 실패:', error);
        return { success: false, error: error.message };
    }
}
