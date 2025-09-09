// Supabase 설정은 supabase-config.js에서 전역 변수로 제공됨

// 아파트 ID 설정 (고유 식별자)
const APARTMENT_ID = 'gupo-apartment';

// 카카오 SDK 초기화 (실제 앱키로 변경 필요)
try {
    if (typeof Kakao !== 'undefined' && Kakao && !Kakao.isInitialized()) {
        Kakao.init('YOUR_KAKAO_APP_KEY'); // 실제 카카오 개발자센터에서 발급받은 JavaScript 키로 변경하세요
    }
} catch (e) {
    console.warn('Kakao 초기화 건너뜀:', e && e.message ? e.message : e);
}

// EmailJS 초기화 상태
let emailJSInitialized = false;
let initializationAttempts = 0;
const MAX_INIT_ATTEMPTS = 3;

// EmailJS 초기화 함수 (모바일 환경 강화)
async function initializeEmailJS() {
    return new Promise((resolve, reject) => {
        // 이미 초기화되었다면 바로 성공 반환
        if (emailJSInitialized && typeof emailjs !== 'undefined') {
            resolve(true);
            return;
        }

        // 최대 시도 횟수 체크
        if (initializationAttempts >= MAX_INIT_ATTEMPTS) {
            reject(new Error('EmailJS 초기화 최대 시도 횟수 초과'));
            return;
        }

        initializationAttempts++;

        const initializeWithRetry = () => {
            try {
                // EmailJS 스크립트 로드 확인
                if (typeof emailjs === 'undefined') {
                    const waitTime = /Mobile|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? 3000 : 1500;
                    console.log(`📱 EmailJS 스크립트 로딩 대기... (시도: ${initializationAttempts}/${MAX_INIT_ATTEMPTS}, 대기: ${waitTime}ms)`);
                    
                    setTimeout(() => {
                        if (initializationAttempts < MAX_INIT_ATTEMPTS) {
                            initializeWithRetry();
                        } else {
                            reject(new Error('EmailJS 스크립트 로드 시간 초과'));
                        }
                    }, waitTime);
                    return;
                }

                // EmailJS 초기화 시도
                console.log('🔧 EmailJS 초기화 시작...');
                emailjs.init('8-CeAZsTwQwNl4yE2');
                
                // 초기화 검증
                if (typeof emailjs.send === 'function') {
                    console.log('✅ EmailJS 초기화 및 검증 완료');
                    emailJSInitialized = true;
                    resolve(true);
                } else {
                    throw new Error('EmailJS send 함수를 찾을 수 없습니다');
                }
            } catch (e) {
                console.error(`❌ EmailJS 초기화 실패 (시도 ${initializationAttempts}):`, e);
                if (initializationAttempts < MAX_INIT_ATTEMPTS) {
                    const retryWaitTime = 2000;
                    setTimeout(initializeWithRetry, retryWaitTime);
                } else {
                    reject(e);
                }
            }
        };

        // 네트워크 상태 확인
        if (!navigator.onLine) {
            reject(new Error('네트워크 연결이 필요합니다.'));
            return;
        }

        // 초기화 시작
        initializeWithRetry();
    });
}

// 페이지 로드시 초기화 시도
window.addEventListener('load', () => {
    initializeEmailJS().catch(error => {
        console.warn('EmailJS 초기화 실패:', error.message);
    });
});

// 온라인 상태가 되면 재시도
window.addEventListener('online', () => {
    if (!emailJSInitialized) {
        initializeEmailJS().catch(error => {
            console.warn('EmailJS 재초기화 실패:', error.message);
        });
    }
});

let formData = {};
let currentQRDataURL = null;
let adminSettings = null; // 관리자 설정 캐시

// 관리자 설정 저장 (Supabase)
async function saveAdminSettingsToCloud() {
    try {
        if (!supabase) {
            console.warn('Supabase가 초기화되지 않았습니다.');
            return;
        }

        const settings = {
            apartment_id: APARTMENT_ID,
            title: localStorage.getItem('mainTitle') || '',
            phones: JSON.parse(localStorage.getItem('savedPhoneNumbers') || '[]'),
            emails: JSON.parse(localStorage.getItem('savedEmailAddresses') || '[]'),
            updated_at: new Date().toISOString()
        };
        
        // upsert를 사용하여 존재하면 업데이트, 없으면 삽입
        const { data, error } = await supabase
            .from('admin_settings')
            .upsert(settings, { 
                onConflict: 'apartment_id',
                returning: 'minimal'
            });
        
        if (error) {
            console.error('Supabase 저장 오류:', error);
            return;
        }
        
        console.log('관리자 설정이 Supabase에 저장되었습니다.', settings);
        adminSettings = settings;
    } catch (error) {
        console.error('관리자 설정 저장 중 오류:', error);
    }
}

// 관리자 설정 로드 (Supabase)
async function loadAdminSettingsFromCloud() {
    try {
        if (!supabase) {
            console.warn('Supabase가 초기화되지 않았습니다. 로컬 설정을 사용합니다.');
            loadAdminSettingsLocal();
            return;
        }

        const { data, error } = await supabase
            .from('admin_settings')
            .select('*')
            .eq('apartment_id', APARTMENT_ID)
            .single();
        
        if (error && error.code !== 'PGRST116') { // 데이터가 없는 경우가 아닌 실제 오류
            console.error('Supabase 로드 오류:', error);
            loadAdminSettingsLocal(); // 실패시 로컬 로드
            return;
        }
        
        if (data) {
            // Supabase에서 가져온 데이터를 localStorage에 동기화
            if (data.title) localStorage.setItem('mainTitle', data.title);
            if (data.phones) localStorage.setItem('savedPhoneNumbers', JSON.stringify(data.phones));
            if (data.emails) localStorage.setItem('savedEmailAddresses', JSON.stringify(data.emails));
            
            adminSettings = data;
            console.log('Supabase에서 관리자 설정을 로드했습니다.');
        } else {
            console.log('Supabase에 저장된 관리자 설정이 없습니다. 로컬 설정을 사용합니다.');
            loadAdminSettingsLocal();
        }
        
        // 화면 업데이트
        loadSavedTitles();
        displaySavedInputs();
    } catch (error) {
        console.error('관리자 설정 로드 중 오류:', error);
        loadAdminSettingsLocal(); // 실패시 로컬 로드
    }
}

// 로컬 관리자 설정 로드 (백업용)
function loadAdminSettingsLocal() {
    try {
        const settings = {
            apartment_id: APARTMENT_ID,
            title: localStorage.getItem('mainTitle') || '',
            phones: JSON.parse(localStorage.getItem('savedPhoneNumbers') || '[]'),
            emails: JSON.parse(localStorage.getItem('savedEmailAddresses') || '[]')
        };
        
        adminSettings = settings;
        console.log('로컬에서 관리자 설정을 로드했습니다.');
        
        // 화면 업데이트
        loadSavedTitles();
        displaySavedInputs();
    } catch (error) {
        console.error('로컬 관리자 설정 로드 중 오류:', error);
    }
}

// 로컬 저장 백업 (Supabase 실패 시)
async function saveApplicationLocally(applicationData) {
    try {
        // 신청번호 생성
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const applicationNumber = `LOCAL-${dateStr}-${randomNum}`;

        // 통신사 이름 변환
        const providerNames = {
            'interior': 'KT',
            'exterior': 'SKT', 
            'plumbing': 'LGU+',
            'electrical': '기타(지역방송)'
        };

        const localApplication = {
            id: applicationNumber, // 로컬 ID로 사용
            name: applicationData.name, // 동/호수 정보
            phone: applicationData.phone,
            workType: applicationData.workType, // Supabase 컬럼명과 일치
            work_type_display: providerNames[applicationData.workType] || applicationData.workType,
            startDate: applicationData.startDate || null,
            description: applicationData.description || null,
            submitted_at: applicationData.submittedAt,
            status: 'local_backup' // 로컬 백업 표시
        };

        // localStorage에 저장
        const existingApplications = JSON.parse(localStorage.getItem('localApplications') || '[]');
        existingApplications.push(localApplication);
        localStorage.setItem('localApplications', JSON.stringify(existingApplications));

        console.log('신청서를 로컬에 백업했습니다:', localApplication);

        // 로컬 알림 처리 + 실제 이메일 발송 시도
        await handleLocalNotification(localApplication);
        
        // 로컬 백업이어도 실제 이메일 발송 시도 (Edge Function은 application.id가 필요해서 EmailJS 사용)
        const emailResult = await sendEmailToAdmins(localApplication);
        if (emailResult) {
            console.log('로컬 백업에서 이메일 발송 성공');
            localApplication.email_sent = true;
        }

        return localApplication;
    } catch (error) {
        console.error('로컬 저장 중 오류:', error);
        return false;
    }
}

// 로컬 알림 처리 (이메일 주소를 콘솔에 출력)
async function handleLocalNotification(applicationData) {
    try {
        const savedEmails = JSON.parse(localStorage.getItem('savedEmailAddresses') || '[]');
        const savedPhones = JSON.parse(localStorage.getItem('savedPhoneNumbers') || '[]');

        const submittedDate = new Date(applicationData.submitted_at);
        const formattedDate = submittedDate.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const notificationMessage = `
[구포현대아파트] 새로운 통신환경개선 신청서 (로컬 백업)

■ 신청번호: ${applicationData.id}
■ 신청자: ${applicationData.name}
■ 연락처: ${applicationData.phone}
■ 동/호수: ${applicationData.name}
■ 현재 통신사: ${applicationData.work_type_display}
■ 희망일: ${applicationData.startDate || '미지정'}
■ 상세내용: ${applicationData.description || '없음'}
■ 접수일시: ${formattedDate}

⚠️ 네트워크 오류로 로컬에 저장되었습니다.

📞 긴급 연락처: ${savedPhones.length > 0 ? savedPhones[0] : '관리자 연락처 미설정'}
📧 관리자 이메일: ${savedEmails.length > 0 ? savedEmails[0] : '관리자 이메일 미설정'}

💡 해결방법:
1. 네트워크 연결을 확인해주세요
2. WiFi 또는 데이터 연결 상태를 점검해주세요
3. 위 연락처로 직접 연락주시면 신속히 처리해드립니다
        `;

        console.log('=== 관리자 알림 ===');
        console.log(notificationMessage);

        if (savedEmails.length > 0) {
            console.log('알림받을 이메일 주소:', savedEmails.join(', '));
        }
        if (savedPhones.length > 0) {
            console.log('알림받을 전화번호:', savedPhones.join(', '));
        }

        return true;
    } catch (error) {
        console.error('로컬 알림 처리 중 오류:', error);
        return false;
    }
}

// 신청서를 Supabase에 저장하고 관리자에게 알림 발송
async function saveApplicationToSupabase(applicationData) {
    try {
        console.log('Supabase 연결 상태 확인:', supabase);
        
        if (!supabase) {
            console.warn('Supabase가 초기화되지 않았습니다. 로컬 저장으로 대체합니다.');
            return await saveApplicationLocally(applicationData);
        }

        // 신청번호 생성 (현재 날짜 + 랜덤 4자리)
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const applicationNumber = `APP-${dateStr}-${randomNum}`;

        // 통신사 이름 변환
        const providerNames = {
            'interior': 'KT',
            'exterior': 'SKT', 
            'plumbing': 'LGU+',
            'electrical': '기타(지역방송)'
        };

        const applicationRecord = {
            name: applicationData.name, // 동/호수 정보
            phone: applicationData.phone,
            workType: applicationData.workType, // Supabase 컬럼명 맞춤
            startDate: applicationData.startDate // 필수 입력이므로 항상 존재
        };

        // 선택적 컬럼들 (데이터가 있을 때만 추가)
        if (applicationData.description) {
            applicationRecord.description = applicationData.description;
        }
        
        // submitted_at 컬럼이 없으므로 제거
        // 대신 created_at이나 timestamp 컬럼이 있다면 사용

        console.log('Supabase에 신청서 저장 시도:', applicationRecord);

        // applications 테이블에 신청서 저장
        const { data: insertedApplication, error: insertError } = await supabase
            .from('applications')
            .insert([applicationRecord])
            .select()
            .single();

        if (insertError) {
            console.error('Supabase 신청서 저장 오류:', insertError);
            console.log('로컬 저장으로 대체합니다.');
            return await saveApplicationLocally(applicationData);
        }

        console.log('신청서가 Supabase에 저장되었습니다:', insertedApplication);

        // Supabase Edge Function으로 관리자에게 이메일 발송
        const emailResult = await sendNotificationsViaEdgeFunction(insertedApplication);
        insertedApplication.email_sent = emailResult;

        return insertedApplication;

    } catch (error) {
        console.error('신청서 저장 중 오류:', error);
        console.log('로컬 저장으로 대체합니다.');
        return await saveApplicationLocally(applicationData);
    }
}

// 관리자에게 실제 이메일 발송 (강화된 오류 처리)
async function sendEmailToAdmins(applicationData) {
    try {
        console.log('📧 이메일 발송 시도 - 상세 정보:', {
            timestamp: new Date().toISOString(),
            applicationId: applicationData.id || 'ID 없음',
            deviceType: /Mobile|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
            emailJSState: {
                available: typeof emailjs !== 'undefined',
                initialized: emailJSInitialized,
                sendFunction: typeof emailjs?.send === 'function'
            }
        });
        
        // 저장된 관리자 이메일 주소 가져오기
        const savedEmails = JSON.parse(localStorage.getItem('savedEmailAddresses') || '[]');
        
        if (savedEmails.length === 0) {
            console.warn('⚠️ 저장된 관리자 이메일 주소가 없습니다.');
            return false;
        }

        // EmailJS 완전성 검사
        if (typeof emailjs === 'undefined') {
            console.error('❌ EmailJS 라이브러리가 로드되지 않았습니다.');
            throw new Error('EmailJS 라이브러리 로드 실패');
        }

        if (typeof emailjs.send !== 'function') {
            console.error('❌ EmailJS send 함수를 사용할 수 없습니다.');
            throw new Error('EmailJS send 함수 사용 불가');
        }

        if (!emailJSInitialized) {
            console.warn('⚠️ EmailJS가 초기화되지 않았습니다. 재초기화 시도...');
            try {
                await initializeEmailJS();
            } catch (initError) {
                console.error('❌ EmailJS 재초기화 실패:', initError);
                throw new Error('EmailJS 초기화 실패: ' + initError.message);
            }
        }

        // 제출일시 포맷팅
        const submittedDate = new Date(applicationData.submitted_at);
        const formattedDate = submittedDate.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            weekday: 'long'
        });

        let emailsSent = 0;

        // 각 관리자 이메일로 EmailJS 발송
        console.log('📧 EmailJS로 관리자에게 이메일 발송을 시도합니다.');
        
        // 브라우저 알림 권한 요청
        if ('Notification' in window) {
            if (Notification.permission === 'default') {
                await Notification.requestPermission();
            }
            
            if (Notification.permission === 'granted') {
                new Notification('🏢 새로운 신청서 접수', {
                    body: `신청자: ${applicationData.name}\n연락처: ${applicationData.phone}\n동/호수: ${applicationData.name}`,
                    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIwIDRIM0MxLjg5IDQgMS4wMSA0Ljg5IDEuMDEgNkwxIDE4QzEgMTkuMTEgMS44OSAyMCAzIDIwSDIwQzIxLjExIDIwIDIyIDE5LjExIDIyIDE4VjZDMjIgNC44OSAyMS4xMSA0IDIwIDRaTTIwIDhMMTEuNSAxMy41TDMgOFY2TDExLjUgMTEuNUwyMCA2VjhaIiBmaWxsPSIjNENBRjUwIi8+Cjwvc3ZnPgo='
                });
            }
        }

        // 실제 EmailJS로 이메일 발송
        for (const adminEmail of savedEmails) {
            try {
                console.log(`📧 ${adminEmail}로 EmailJS 이메일 발송 시도...`);

                // EmailJS 템플릿 파라미터
                const templateParams = {
                    to_email: adminEmail,
                    apartment_name: '구포현대아파트',
                    application_number: applicationData.id || 'ID 생성 중',
                    name: applicationData.name,
                    phone: applicationData.phone,
                    work_type_display: applicationData.work_type_display,
                    start_date: applicationData.startDate || '미지정',
                    description: applicationData.description || '특별한 요청사항 없음',
                    submittedAt: formattedDate
                };

                // EmailJS로 이메일 발송 (강화된 오류 처리)
                console.log('📤 EmailJS 발송 파라미터:', templateParams);
                
                const response = await Promise.race([
                    emailjs.send('service_v90gm26', 'template_pxi385c', templateParams),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('EmailJS 발송 시간 초과 (30초)')), 30000)
                    )
                ]);

                console.log(`✅ ${adminEmail}로 이메일 발송 성공:`, response);
                emailsSent++;
                
                // 발송 성공 검증
                if (response.status !== 200) {
                    console.warn(`⚠️ ${adminEmail} 발송 응답 상태가 비정상: ${response.status}`);
                }

            } catch (error) {
                console.error(`❌ ${adminEmail}로 이메일 발송 실패:`, error);
            }

            // 다음 이메일 발송 전 잠시 대기 (스팸 방지)
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log(`총 ${emailsSent}개의 이메일이 성공적으로 발송되었습니다.`);
        return emailsSent > 0;

    } catch (error) {
        console.error('💥 이메일 발송 중 전체 오류:', error);
        
        // 모바일 환경에서 친절한 오류 안내
        if (/Mobile|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            console.log(`
📱 모바일 환경에서 메일 발송 실패 안내:

🔧 해결 방법:
1. WiFi 또는 데이터 연결 상태 확인
2. 브라우저 새로고침 후 재시도  
3. 다른 브라우저(Chrome, Safari)에서 시도
4. 관리자에게 직접 연락

⚠️ 신청서는 로컬에 안전하게 저장되었습니다.
            `);
        }
        
        return false;
    }
}

// EmailJS를 통한 이메일 발송 (주 시스템)
async function sendNotificationsViaEdgeFunction(applicationData) {
    try {
        console.log('📱 메일 발송 시작 - 디버그 정보:', {
            deviceInfo: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                isMobile: /Mobile|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
            },
            networkState: {
                isOnline: navigator.onLine,
                connection: navigator.connection ? {
                    type: navigator.connection.type,
                    effectiveType: navigator.connection.effectiveType,
                    downlink: navigator.connection.downlink
                } : 'Connection API not supported'
            },
            emailJSState: {
                initialized: emailJSInitialized,
                attempts: initializationAttempts
            }
        });

        // 네트워크 상태 확인
        if (!navigator.onLine) {
            console.error('🔴 네트워크 오프라인 상태');
            throw new Error('네트워크 연결이 필요합니다.');
        }

        // EmailJS 초기화 상태 확인 및 재시도
        if (!emailJSInitialized || typeof emailjs === 'undefined') {
            console.log('📨 EmailJS 초기화 시도 중...');
            try {
                // 모바일에서 더 오래 대기
                const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
                if (isMobile) {
                    console.log('📱 모바일 환경에서 EmailJS 재초기화 시도...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
                
                await initializeEmailJS();
                console.log('✅ EmailJS 초기화 성공');
            } catch (initError) {
                console.error('❌ EmailJS 초기화 실패:', initError);
                console.warn('🚫 SendGrid로 대체합니다.');
                return await sendViaSendGrid(applicationData);
            }
        }

        if (!emailjs) {
            console.warn('🚫 EmailJS 사용 불가, SendGrid로 대체합니다.');
            return await sendViaSendGrid(applicationData);
        }

        console.log('📨 이메일 발송 시작');
        console.log('📋 신청서 데이터:', applicationData);
        console.log('🔑 신청서 ID:', applicationData.id);
        
        // 모바일 환경 로깅
        console.log('📱 사용자 환경:', {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            vendor: navigator.vendor,
            isMobile: /Mobile|Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent)
        });

        // 관리자 설정 확인
        console.log('👑 현재 관리자 설정 확인...');
        const { data: adminCheck, error: adminError } = await supabase
            .from('admin_settings')
            .select('emails')
            .eq('apartment_id', APARTMENT_ID)
            .single();

        if (adminError || !adminCheck?.emails || adminCheck.emails.length === 0) {
            console.error('❌ 관리자 이메일 설정 문제:', adminError?.message);
            throw new Error('관리자 이메일 설정을 찾을 수 없습니다.');
        }

        console.log('✅ 관리자 이메일 확인됨:', adminCheck.emails);

        // EmailJS로 메일 발송
        const results = await Promise.all(adminCheck.emails.map(async (email) => {
            try {
                const result = await emailjs.send(
                    'service_v90gm26',  // EmailJS 서비스 ID
                    'template_pxi385c',  // EmailJS 템플릿 ID
                    {
                        to_email: email,
                        application_number: applicationData.id || 'APP-GENERATING',
                        name: applicationData.name,
                        phone: applicationData.phone,
                        work_type: applicationData.work_type_display,
                        start_date: applicationData.startDate || '미지정',
                        description: applicationData.description || '없음',
                        submitted_at: new Date(applicationData.submitted_at).toLocaleString('ko-KR')
                    }
                );
                await logEmailAttempt(applicationData.id, 'emailjs', 'sent');
                return { email, success: true, result };
            } catch (error) {
                await logEmailAttempt(applicationData.id, 'emailjs', 'failed', error.message);
                return { email, success: false, error };
            }
        }));

        // 발송 결과 처리
        const successfulSends = results.filter(r => r.success).length;
        const totalAttempts = results.length;

        // 모든 이메일 발송이 실패한 경우 SendGrid로 폴백
        if (successfulSends === 0) {
            console.warn('⚠️ EmailJS 발송 실패. SendGrid로 대체 시도...');
            return await sendViaSendGrid(applicationData);
        }

        return {
            success: true,
            sent: successfulSends,
            total: totalAttempts
        };

    } catch (error) {
        console.error('💥 EmailJS 발송 중 오류:', error);
        console.log('� SendGrid로 대체 시도...');
        return await sendViaSendGrid(applicationData);
    }
}

// 관리자에게 알림 발송 (기존 EmailJS 방식 - 백업용)
async function sendNotificationsToAdmins(applicationData) {
    try {
        // 저장된 관리자 연락처 가져오기
        const savedEmails = JSON.parse(localStorage.getItem('savedEmailAddresses') || '[]');
        const savedPhones = JSON.parse(localStorage.getItem('savedPhoneNumbers') || '[]');
        
        // 실제 이메일 발송
        const emailResult = await sendEmailToAdmins(applicationData);
        
        // Supabase 알림 로그 저장 (있는 경우)
        if (supabase && applicationData.id) {
            const submittedDate = new Date(applicationData.submitted_at);
            const formattedDate = submittedDate.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const emailMessage = `
[구포현대아파트] 새로운 통신환경개선 신청서

■ 신청번호: ${applicationData.id}
■ 신청자: ${applicationData.name}
■ 연락처: ${applicationData.phone}
■ 동/호수: ${applicationData.name}
■ 현재 통신사: ${applicationData.work_type_display}
■ 희망일: ${applicationData.startDate || '미지정'}
■ 상세내용: ${applicationData.description || '없음'}
■ 접수일시: ${formattedDate}

관리자님께서 확인하시고 적절한 조치를 취해주시기 바랍니다.
            `;

            const notifications = [];

            // 이메일 알림 로그 생성
            savedEmails.forEach(email => {
                notifications.push({
                    application_id: applicationData.id,
                    notification_type: 'email',
                    recipient: email,
                    message: emailMessage,
                    status: emailResult ? 'sent' : 'failed'
                });
            });

            if (notifications.length > 0) {
                const { error: notificationError } = await supabase
                    .from('notification_logs')
                    .insert(notifications);

                if (notificationError) {
                    console.error('알림 로그 저장 오류:', notificationError);
                } else {
                    console.log(`${notifications.length}개의 알림 로그가 저장되었습니다.`);
                }
            }
        }

        return emailResult;

    } catch (error) {
        console.error('알림 발송 중 오류:', error);
        return false;
    }
}

// 고객용 신청서 제출 처리 (Supabase 저장 및 알림 발송)
async function processCustomerFormSubmission(event) {
    event.preventDefault();
    console.log('📝 신청서 제출 시작 - 환경 정보:', {
        시간: new Date().toISOString(),
        브라우저: {
            userAgent: navigator.userAgent,
            language: navigator.language,
            onLine: navigator.onLine,
            platform: navigator.platform
        },
        화면: {
            width: window.innerWidth,
            height: window.innerHeight,
            pixelRatio: window.devicePixelRatio
        },
        이메일상태: {
            EmailJS초기화: emailJSInitialized,
            시도횟수: initializationAttempts
        }
    });

    const formDataObj = new FormData(event.target);
    const applicationData = {};
    
    // 폼 데이터 수집
    for (let [key, value] of formDataObj.entries()) {
        applicationData[key] = value;
    }
    
    // 유효성 검증
    if (!applicationData.name || !applicationData.phone || !applicationData.startDate) {
        alert('필수 항목을 모두 입력해주세요.\n(공사요청, 연락처, 공사 희망일)');
        return;
    }
    
    // 공사 희망일 날짜 검증
    const selectedDate = new Date(applicationData.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 시간 정보 제거
    
    if (selectedDate < today) {
        alert('공사 희망일은 오늘 날짜 이후로 선택해주세요.');
        return;
    }
    
    if (!applicationData.privacy) {
        alert('개인정보 수집 및 이용에 동의해주세요.');
        return;
    }
    
    // 추가 정보 설정
    applicationData.submittedAt = new Date().toISOString();
    
    console.log('신청서 제출:', applicationData);
    
    // 제출 버튼 비활성화 (중복 제출 방지)
    const submitBtn = event.target.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '제출 중...';
    }
    
    try {
        // Supabase에 신청서 저장 및 관리자 알림
        const savedApplication = await saveApplicationToSupabase(applicationData);
        
        if (savedApplication) {
            // 이메일 발송 여부에 따른 메시지 생성
            let successMessage = `✅ 신청서가 성공적으로 제출되었습니다!\n신청번호: ${savedApplication.id}`;
            
            if (savedApplication.email_sent || savedApplication.id) {
                successMessage += '\n✉️ 관리자에게 이메일로 자동 전달되었습니다.';
            } else {
                successMessage += '\n📋 신청서가 저장되었으며, 관리자가 확인할 예정입니다.';
            }
            
            alert(successMessage);
            
            // 폼 초기화
            event.target.reset();
            
            // 결과 페이지로 이동
            showResult(savedApplication);
        } else {
            throw new Error('신청서 저장에 실패했습니다.');
        }
        
    } catch (error) {
        console.error('신청서 제출 중 오류:', error);
        alert('❌ 신청서 제출 중 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.');
    } finally {
        // 제출 버튼 활성화
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = '신청서 제출';
        }
    }
}

// 제목 편집 모드로 전환
function editTitle() {
    const titleElement = document.getElementById('mainTitle');
    const currentTitle = titleElement.textContent;
    
    titleElement.innerHTML = `
        <input type="text" id="titleInput" value="${currentTitle}" style="width: 100%; padding: 8px; border: 2px solid #4CAF50; border-radius: 4px; font-size: 18px; font-weight: bold;">
    `;
    
    const titleInput = document.getElementById('titleInput');
    titleInput.focus();
    titleInput.select();
    
    // Enter 키로 저장, Esc 키로 취소
    titleInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            saveTitle();
        } else if (e.key === 'Escape') {
            cancelTitleEdit();
        }
    });
    
    // 입력란에서 포커스가 벗어나면 자동 저장
    titleInput.addEventListener('blur', function() {
        saveTitle();
    });
}

// 제목 저장
function saveTitle() {
    const titleInput = document.getElementById('titleInput');
    const newTitle = titleInput.value.trim();
    
    if (!newTitle) {
        alert('제목을 입력해주세요.');
        return;
    }
    
    // localStorage에 저장
    localStorage.setItem('mainTitle', newTitle);
    
    // 제목 업데이트 및 편집 모드 해제
    const titleElement = document.getElementById('mainTitle');
    titleElement.innerHTML = newTitle;
    titleElement.onclick = editTitle;
    
    // Supabase에 저장
    saveAdminSettingsToCloud();
    
    alert('제목이 저장되었습니다!');
}

// 제목 편집 취소
function cancelTitleEdit() {
    const titleElement = document.getElementById('mainTitle');
    const savedTitle = localStorage.getItem('mainTitle') || '구포현대아파트 통신 환경 개선 신청서';
    
    // 편집 모드 해제하고 원래 상태로 복원
    titleElement.innerHTML = savedTitle;
    titleElement.onclick = editTitle;
}

// 부제목은 고정 텍스트로 변경됨 - 편집 기능 제거

// 메일 입력 모달 표시
function showEmailInputModal() {
    const modal = document.getElementById('emailInputModal');
    modal.style.display = 'block';
    
    // 기존 입력란 초기화
    const emailInputs = document.getElementById('emailInputs');
    emailInputs.innerHTML = `
        <div class="email-input-row">
            <input type="email" class="email-input" placeholder="example1@email.com">
            <button type="button" class="remove-btn" onclick="removeEmailInput(this)" style="display: none;">삭제</button>
        </div>
    `;
    
    // 저장된 메일 주소 불러오기
    const savedEmails = JSON.parse(localStorage.getItem('savedEmailAddresses') || '[]');
    savedEmails.forEach((email, index) => {
        if (index > 0) {
            addEmailInput();
        }
        const inputs = emailInputs.querySelectorAll('.email-input');
        if (inputs[index]) {
            inputs[index].value = email;
        }
    });
}

// 메일 입력란 추가
function addEmailInput() {
    const emailInputs = document.getElementById('emailInputs');
    const emailRows = emailInputs.querySelectorAll('.email-input-row');
    
    if (emailRows.length >= 3) {
        alert('메일 주소는 최대 3개까지 입력할 수 있습니다.');
        return;
    }
    
    const newRow = document.createElement('div');
    newRow.className = 'email-input-row';
    newRow.innerHTML = `
        <input type="email" class="email-input" placeholder="example${emailRows.length + 1}@email.com">
        <button type="button" class="remove-btn" onclick="removeEmailInput(this)">삭제</button>
    `;
    
    emailInputs.appendChild(newRow);
    
    // 삭제 버튼 표시/숨김 조정
    if (emailRows.length === 0) {
        emailInputs.querySelector('.remove-btn').style.display = 'none';
    }
}

// 메일 입력란 삭제
function removeEmailInput(button) {
    const emailInputs = document.getElementById('emailInputs');
    const emailRows = emailInputs.querySelectorAll('.email-input-row');
    
    if (emailRows.length > 1) {
        button.parentElement.remove();
        
        // 삭제 버튼 표시/숨김 조정
        if (emailRows.length === 2) {
            emailInputs.querySelector('.remove-btn').style.display = 'none';
        }
    }
}

// 메일 주소 저장
function saveEmailAddresses() {
    const emailInputs = document.querySelectorAll('.email-input');
    const emails = [];
    
    emailInputs.forEach(input => {
        const email = input.value.trim();
        if (email && email.includes('@')) {
            emails.push(email);
        }
    });
    
    if (emails.length === 0) {
        alert('유효한 메일 주소를 입력해주세요.');
        return;
    }
    
    // localStorage에 저장
    localStorage.setItem('savedEmailAddresses', JSON.stringify(emails));
    
    // 화면 업데이트
    displaySavedInputs();
    
    // Supabase에 저장
    saveAdminSettingsToCloud();
    
    // 모달 닫기
    closeEmailInputModal();
    
    alert('메일 주소가 저장되었습니다!');
}

// 메일 입력 모달 닫기
function closeEmailInputModal() {
    const modal = document.getElementById('emailInputModal');
    modal.style.display = 'none';
}

// 폰번호 입력 모달 표시
function showPhoneInputModal() {
    const modal = document.getElementById('phoneInputModal');
    modal.style.display = 'block';
    
    // 기존 입력란 초기화
    const phoneInputs = document.getElementById('phoneInputs');
    phoneInputs.innerHTML = `
        <div class="phone-input-row">
            <input type="tel" class="phone-input" placeholder="010-1234-5678">
            <button type="button" class="remove-btn" onclick="removePhoneInput(this)" style="display: none;">삭제</button>
        </div>
    `;
    
    // 저장된 폰번호 불러오기
    const savedPhones = JSON.parse(localStorage.getItem('savedPhoneNumbers') || '[]');
    savedPhones.forEach((phone, index) => {
        if (index > 0) {
            addPhoneInput();
        }
        const inputs = phoneInputs.querySelectorAll('.phone-input');
        if (inputs[index]) {
            inputs[index].value = phone;
        }
    });
}

// 폰번호 입력란 추가
function addPhoneInput() {
    const phoneInputs = document.getElementById('phoneInputs');
    const phoneRows = phoneInputs.querySelectorAll('.phone-input-row');
    
    if (phoneRows.length >= 3) {
        alert('폰번호는 최대 3개까지 입력할 수 있습니다.');
        return;
    }
    
    const newRow = document.createElement('div');
    newRow.className = 'phone-input-row';
    newRow.innerHTML = `
        <input type="tel" class="phone-input" placeholder="010-1234-5678">
        <button type="button" class="remove-btn" onclick="removePhoneInput(this)">삭제</button>
    `;
    
    phoneInputs.appendChild(newRow);
    
    // 삭제 버튼 표시/숨김 조정
    if (phoneRows.length === 0) {
        phoneInputs.querySelector('.remove-btn').style.display = 'none';
    }
}

// 폰번호 입력란 삭제
function removePhoneInput(button) {
    const phoneInputs = document.getElementById('phoneInputs');
    const phoneRows = phoneInputs.querySelectorAll('.phone-input-row');
    
    if (phoneRows.length > 1) {
        button.parentElement.remove();
        
        // 삭제 버튼 표시/숨김 조정
        if (phoneRows.length === 2) {
            phoneInputs.querySelector('.remove-btn').style.display = 'none';
        }
    }
}

// 폰번호 저장
function savePhoneNumbers() {
    const phoneInputs = document.querySelectorAll('.phone-input');
    const phones = [];
    
    phoneInputs.forEach(input => {
        const phone = input.value.trim();
        if (phone && phone.length >= 10) {
            phones.push(phone);
        }
    });
    
    if (phones.length === 0) {
        alert('유효한 폰번호를 입력해주세요.');
        return;
    }
    
    // localStorage에 저장
    localStorage.setItem('savedPhoneNumbers', JSON.stringify(phones));
    
    // 화면 업데이트
    displaySavedInputs();
    
    // Supabase에 저장
    saveAdminSettingsToCloud();
    
    // 모달 닫기
    closePhoneInputModal();
    
    alert('폰번호가 저장되었습니다!');
}

// 폰번호 입력 모달 닫기
function closePhoneInputModal() {
    const modal = document.getElementById('phoneInputModal');
    modal.style.display = 'none';
}

// QR 코드 생성
function generatePageQR() {
    console.log('QR 코드 생성 시작');
    
    const qrSection = document.getElementById('qrSection');
    const qrCodeDiv = document.getElementById('qrcode');
    const qrDeleteBtn = document.getElementById('qrDeleteBtn');
    
    console.log('DOM 요소 확인:', {
        qrSection: qrSection,
        qrCodeDiv: qrCodeDiv,
        qrDeleteBtn: qrDeleteBtn
    });
    
    // QRCode 라이브러리 확인
    if (typeof QRCode === 'undefined') {
        console.error('QRCode 라이브러리가 로드되지 않았습니다.');
        alert('QR 코드 라이브러리를 불러올 수 없습니다.\n\n페이지를 새로고침하고 다시 시도해주세요.');
        return;
    }
    
    // 고객용 URL 생성 (간단하게)
    const currentUrl = window.location.origin + window.location.pathname;
    const customerUrl = `${currentUrl}?customer=true`;
    
    console.log('QR 코드용 단순화된 URL:', customerUrl);
    console.log('URL 길이:', customerUrl.length, '자');
    
    // URL이 너무 긴 경우 더 단축
    if (customerUrl.length > 800) {
        console.warn('URL이 너무 깁니다. 더 단축합니다.');
        // 짧은 URL 사용
        const shortUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?customer=true`;
        console.log('더 단축된 URL:', shortUrl, '길이:', shortUrl.length);
        return generateQRWithShortUrl(shortUrl, qrCodeDiv, qrSection, qrDeleteBtn);
    }
    
    try {
        console.log('QR 코드 생성 시작');
        qrCodeDiv.innerHTML = '';
        
        new QRCode(qrCodeDiv, {
            text: customerUrl,
            width: 250,
            height: 250,
            colorDark: "#000000",
            colorLight: "#FFFFFF",
            correctLevel: QRCode.CorrectLevel.H,
            margin: 2
        });
        
        console.log('QR 코드 생성 완료');
        
        // QR 섹션 표시
        qrSection.style.display = 'block';
        
        // QR 삭제 버튼 표시
        if (qrDeleteBtn) {
            qrDeleteBtn.style.display = 'inline-block';
        }
        
        // Supabase에 관리자 설정 저장
        saveAdminSettingsToCloud();
        
        console.log('QR 코드 생성 완료:', customerUrl);
        
        } catch (error) {
        console.error('QR 코드 생성 중 오류:', error);
        alert('QR 코드 생성 중 오류가 발생했습니다: ' + error.message);
    }
}

// 짧은 URL로 QR 생성
function generateQRWithShortUrl(shortUrl, qrCodeDiv, qrSection, qrDeleteBtn) {
    try {
        console.log('짧은 URL로 QR 코드 생성:', shortUrl);
        qrCodeDiv.innerHTML = '';
        
        new QRCode(qrCodeDiv, {
            text: shortUrl,
            width: 250,
            height: 250,
            colorDark: "#000000",
            colorLight: "#FFFFFF",
            correctLevel: QRCode.CorrectLevel.L, // 낮은 오류 수정 레벨로 변경
            margin: 2
        });
        
        console.log('짧은 URL QR 코드 생성 완료');
        
        // QR 섹션 표시
        qrSection.style.display = 'block';
        
        // QR 삭제 버튼 표시
        if (qrDeleteBtn) {
            qrDeleteBtn.style.display = 'inline-block';
        }
        
        // Supabase에 관리자 설정 저장
        saveAdminSettingsToCloud();
        
        console.log('짧은 URL QR 코드 생성 완료:', shortUrl);
        
    } catch (error) {
        console.error('짧은 URL QR 코드 생성 중 오류:', error);
        
        // 최후의 수단: 더 간단한 URL
        const simpleUrl = `${window.location.protocol}//${window.location.hostname}?customer=1`;
        console.log('최종 단순 URL 시도:', simpleUrl);
        
        try {
            qrCodeDiv.innerHTML = '';
            new QRCode(qrCodeDiv, {
                text: simpleUrl,
                width: 200,
                height: 200,
                correctLevel: QRCode.CorrectLevel.L
            });
            
            qrSection.style.display = 'block';
            if (qrDeleteBtn) qrDeleteBtn.style.display = 'inline-block';
            
        } catch (finalError) {
            console.error('최종 QR 생성 실패:', finalError);
            alert('QR 코드 생성에 실패했습니다. URL이 너무 긴 것 같습니다.');
        }
    }
}

// QR 코드 삭제
function deleteQR() {
    const qrSection = document.getElementById('qrSection');
    const qrCodeDiv = document.getElementById('qrcode');
    const qrDeleteBtn = document.getElementById('qrDeleteBtn');
    
    qrCodeDiv.innerHTML = '';
    qrSection.style.display = 'none';
    
    if (qrDeleteBtn) {
        qrDeleteBtn.style.display = 'none';
    }
    
    console.log('QR 코드 삭제 완료');
}

// QR 섹션 숨기기
function hideQRSection() {
    const qrSection = document.getElementById('qrSection');
    qrSection.style.display = 'none';
}

// QR 코드 다운로드
function downloadQR(format) {
    const qrCodeDiv = document.getElementById('qrcode');
    const canvas = qrCodeDiv.querySelector('canvas');
    
    if (!canvas) {
        alert('QR 코드를 먼저 생성해주세요.');
        return;
    }
    
    const link = document.createElement('a');
    link.download = `qrcode.${format}`;
    
    if (format === 'png') {
        link.href = canvas.toDataURL('image/png');
    } else if (format === 'jpg') {
        link.href = canvas.toDataURL('image/jpeg');
    }
    
    link.click();
}

// 페이지 로드시 저장된 제목 불러오기 (부제목은 고정)
function loadSavedTitles() {
    const savedTitle = localStorage.getItem('mainTitle');
    
    if (savedTitle) {
        const titleElement = document.getElementById('mainTitle');
        titleElement.textContent = savedTitle;
    }
    
    // 부제목은 항상 고정 텍스트로 설정
    const subtitleElement = document.getElementById('mainSubtitle');
    subtitleElement.textContent = '신청서를 작성하여 제출해 주세요';
}

// 저장된 메일/폰번호 표시
function displaySavedInputs() {
    const savedEmails = JSON.parse(localStorage.getItem('savedEmailAddresses') || '[]');
    const savedPhones = JSON.parse(localStorage.getItem('savedPhoneNumbers') || '[]');
    
    const emailDisplay = document.getElementById('emailDisplay');
    const phoneDisplay = document.getElementById('phoneDisplay');
    
    // 메일 주소 표시
    if (savedEmails.length > 0) {
        if (savedEmails.length === 1) {
            emailDisplay.textContent = savedEmails[0];
        } else {
            emailDisplay.textContent = `${savedEmails[0]} 외 ${savedEmails.length - 1}개`;
        }
        emailDisplay.classList.add('has-content');
        emailDisplay.title = `저장된 메일 주소:\n${savedEmails.join('\n')}`;
    } else {
        emailDisplay.textContent = '';
        emailDisplay.classList.remove('has-content');
        emailDisplay.title = '';
    }
    
    // 폰번호 표시
    if (savedPhones.length > 0) {
        if (savedPhones.length === 1) {
            phoneDisplay.textContent = savedPhones[0];
        } else {
            phoneDisplay.textContent = `${savedPhones[0]} 외 ${savedPhones.length - 1}개`;
        }
        phoneDisplay.classList.add('has-content');
        phoneDisplay.title = `저장된 폰번호:\n${savedPhones.join('\n')}`;
    } else {
        phoneDisplay.textContent = '';
        phoneDisplay.classList.remove('has-content');
        phoneDisplay.title = '';
    }
}

// 결과 페이지 표시
function showResult(applicationData = null) {
    const resultSection = document.getElementById('result');
    const resultContent = document.getElementById('resultContent');
    
    if (applicationData) {
        const formattedDate = new Date(applicationData.submitted_at).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        resultContent.innerHTML = `
            <div class="result-info">
                <h3>📋 접수 완료</h3>
                <p><strong>신청번호:</strong> ${applicationData.id}</p>
                <p><strong>신청자:</strong> ${applicationData.name}</p>
                <p><strong>연락처:</strong> ${applicationData.phone}</p>
                <p><strong>접수일시:</strong> ${formattedDate}</p>
                <p><strong>처리상태:</strong> 접수 완료 (관리자 검토 중)</p>
                <div class="notice">
                    <p>💡 관리자가 신청 내용을 검토한 후 연락드릴 예정입니다.</p>
                    <p>문의사항이 있으시면 등록하신 연락처로 연락주세요.</p>
                </div>
            </div>
        `;
    } else {
        resultContent.innerHTML = `
            <div class="result-info">
                <h3>📋 신청 완료</h3>
                <p>신청서가 성공적으로 제출되었습니다.</p>
                <p>관리자가 검토 후 연락드리겠습니다.</p>
            </div>
        `;
    }
    
    // 폼 숨기고 결과 표시
    document.getElementById('applicationForm').style.display = 'none';
    resultSection.style.display = 'block';
    
    console.log('결과 페이지 표시:', applicationData);
}

// 모바일 환경 최적화 함수
function optimizeForMobile() {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
        // 입력 필드 포커스 시 자동 스크롤 처리
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                setTimeout(() => {
                    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            });
        });

        // 가상 키보드 표시 시 스크롤 조정
        const container = document.querySelector('.container');
        window.addEventListener('resize', () => {
            if (document.activeElement.tagName === 'INPUT' || 
                document.activeElement.tagName === 'TEXTAREA') {
                window.scrollTo(0, 0);
                document.activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });

        // 터치 이벤트 최적화
        document.addEventListener('touchstart', function() {}, {passive: true});
    }
}

// DOM 로드 완료 후 실행
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('applicationForm');
    const workTypeSelect = document.getElementById('workType');
    const otherWorkTypeDiv = document.getElementById('otherWorkType');
    
    // 모바일 최적화 실행
    optimizeForMobile();
    
    // URL 파라미터 확인하여 고객용/관리자용 모드 결정
    const urlParams = new URLSearchParams(window.location.search);
    const isCustomerMode = urlParams.has('customer') || urlParams.has('apply');
    
    // 고객용 모드인 경우 QR 생성 버튼과 카카오톡 공유 버튼, 문자 버튼 숨기고 제출 버튼 텍스트 변경
    if (isCustomerMode) {
        // URL 파라미터로 전달된 관리자 데이터(제목만)를 localStorage에 주입하여
        // 다른 기기(고객 폰)에서도 관리자 설정이 반영되도록 동기화
        (function syncAdminDataFromURL() {
            try {
                const titleParam = urlParams.get('title');
                
                if (titleParam) {
                    localStorage.setItem('mainTitle', decodeURIComponent(titleParam));
                }
            } catch (e) {
                console.warn('URL 기반 관리자 데이터 동기화 실패:', e);
            }
        })();
        
        const qrBtn = document.getElementById('qrGenerateBtn');
        const shareBtn = document.querySelector('.share-btn');
        const smsBtn = document.querySelector('.sms-btn');
        const submitBtn = document.querySelector('.submit-btn');
        const qrSection = document.getElementById('qrSection');
        const adminInputSection = document.getElementById('adminInputSection');
        const adminActionSection = document.getElementById('adminActionSection');
        const customerSubmitSection = document.getElementById('customerSubmitSection');
        
        // 관리자용 요소들 숨기기
        if (adminInputSection) adminInputSection.style.display = 'none';
        if (adminActionSection) adminActionSection.style.display = 'none';
        if (qrSection) qrSection.style.display = 'none';
        
        // 고객용 제출 버튼 표시
        if (customerSubmitSection) customerSubmitSection.style.display = 'block';
        
        // 저장된 제목이 있으면 우선 사용, 부제목은 고정
        const headerTitle = document.querySelector('header h1');
        const headerSubtext = document.querySelector('header p');
        const savedTitle = localStorage.getItem('mainTitle');
        if (headerTitle) headerTitle.textContent = savedTitle || '📡 통신 환경 개선 신청서';
        if (headerSubtext) headerSubtext.textContent = '신청서를 작성하여 제출해 주세요';
        
        console.log('고객용 모드로 실행됨');
    } else {
        // 관리자용 모드일 때 고객용 제출 버튼 숨기기
        const customerSubmitSection = document.getElementById('customerSubmitSection');
        if (customerSubmitSection) customerSubmitSection.style.display = 'none';
        
        console.log('관리자용 모드로 실행됨');
    }
    
    // 저장된 제목/부제목 불러오기 (모든 모드에서 공통)
    loadSavedTitles();
    
    // 저장된 메일/폰번호 표시 (관리자 모드에서만)
    if (!isCustomerMode) {
        displaySavedInputs();
    }

    // Supabase에서 관리자 설정 로드 시도
    loadAdminSettingsFromCloud();

    // 기타 공사 선택시 추가 입력란 표시
    if (workTypeSelect) {
        workTypeSelect.addEventListener('change', function() {
            if (this.value === 'other') {
                if (otherWorkTypeDiv) otherWorkTypeDiv.style.display = 'block';
                const otherWork = document.getElementById('otherWork');
                if (otherWork) otherWork.required = true;
            } else {
                if (otherWorkTypeDiv) otherWorkTypeDiv.style.display = 'none';
                const otherWork = document.getElementById('otherWork');
                if (otherWork) otherWork.required = false;
            }
        });
    }
    
    // 공사 희망일 날짜 제한 설정 (오늘 이후만 선택 가능)
    const startDateInput = document.getElementById('startDate');
    if (startDateInput) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // 최소 선택 가능 날짜를 내일로 설정
        const minDate = tomorrow.toISOString().split('T')[0];
        startDateInput.setAttribute('min', minDate);
        
        console.log('공사 희망일 최소 선택 날짜 설정:', minDate);
    }
    
    // 폼 제출 처리
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // 고객 모드인 경우 신청서 제출 로직 실행
            if (isCustomerMode) {
                processCustomerFormSubmission(e);
                return;
            }
            
            // 관리자 모드인 경우 메일 공유 모달 표시 (관리자가 빈 설문지 공유할 때)
            // showEmailModal();
        });
    }
});

// 모든 함수를 전역 스코프에 노출 (onclick 속성에서 사용하기 위해)
window.editTitle = editTitle;
window.saveTitle = saveTitle;
window.cancelTitleEdit = cancelTitleEdit;
window.showEmailInputModal = showEmailInputModal;
window.addEmailInput = addEmailInput;
window.removeEmailInput = removeEmailInput;
window.saveEmailAddresses = saveEmailAddresses;
window.closeEmailInputModal = closeEmailInputModal;
window.showPhoneInputModal = showPhoneInputModal;
window.addPhoneInput = addPhoneInput;
window.removePhoneInput = removePhoneInput;
window.savePhoneNumbers = savePhoneNumbers;
window.closePhoneInputModal = closePhoneInputModal;
window.generatePageQR = generatePageQR;
window.deleteQR = deleteQR;
window.hideQRSection = hideQRSection;
window.downloadQR = downloadQR;
window.shareToKakao = function() {
    // 카카오톡 공유 기능
    if (typeof Kakao !== 'undefined' && Kakao.Share) {
        const title = localStorage.getItem('mainTitle') || '구포현대아파트 통신 환경 개선 신청서';
        const subtitle = localStorage.getItem('mainSubtitle') || '통신 환경 개선을 위한 신청서를 작성해주세요';
        
        Kakao.Share.sendDefault({
            objectType: 'feed',
            content: {
                title: title,
                description: subtitle,
                imageUrl: 'https://via.placeholder.com/300x200/4CAF50/FFFFFF?text=신청서',
                link: {
                    mobileWebUrl: window.location.href,
                    webUrl: window.location.href,
                },
            },
            buttons: [
                {
                    title: '신청서 작성하기',
                    link: {
                        mobileWebUrl: window.location.href,
                        webUrl: window.location.href,
                    },
                },
            ],
        });
    } else {
        alert('카카오톡 공유 기능을 사용할 수 없습니다.');
    }
};
