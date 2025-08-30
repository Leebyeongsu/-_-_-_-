// 카카오 SDK 초기화 (실제 앱키로 변경 필요)
Kakao.init('YOUR_KAKAO_APP_KEY'); // 실제 카카오 개발자센터에서 발급받은 JavaScript 키로 변경하세요

let formData = {};
let currentQRDataURL = null;

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('applicationForm');
    const workTypeSelect = document.getElementById('workType');
    const otherWorkTypeDiv = document.getElementById('otherWorkType');
    
    // URL 파라미터 확인하여 고객용/관리자용 모드 결정
    const urlParams = new URLSearchParams(window.location.search);
    const isCustomerMode = urlParams.has('customer') || urlParams.has('apply');
    
    // 고객용 모드인 경우 QR 생성 버튼과 카카오톡 공유 버튼, 문자 버튼 숨기고 제출 버튼 텍스트 변경
    if (isCustomerMode) {
        // URL 파라미터로 전달된 관리자 데이터(제목/부제목/연락처)를 localStorage에 주입하여
        // 다른 기기(고객 폰)에서도 관리자 설정이 반영되도록 동기화
        (function syncAdminDataFromURL() {
            try {
                const phonesParam = urlParams.get('phones');
                const emailsParam = urlParams.get('emails');
                const titleParam = urlParams.get('title');
                const subtitleParam = urlParams.get('subtitle');
                
                if (phonesParam) {
                    const phones = decodeURIComponent(phonesParam).split(',').map(p => p.trim()).filter(Boolean);
                    if (phones.length > 0) {
                        localStorage.setItem('savedPhoneNumbers', JSON.stringify(phones));
                        // 호환 키 저장
                        localStorage.setItem('adminPhone', phones[0]);
                        localStorage.setItem('adminPhoneNumber', phones[0]);
                    }
                }
                if (emailsParam) {
                    const emails = decodeURIComponent(emailsParam).split(',').map(e => e.trim()).filter(Boolean);
                    if (emails.length > 0) {
                        localStorage.setItem('savedEmailAddresses', JSON.stringify(emails));
                        // 호환 키 저장
                        localStorage.setItem('adminEmail', emails[0]);
                    }
                }
                if (titleParam) {
                    localStorage.setItem('mainTitle', decodeURIComponent(titleParam));
                }
                if (subtitleParam) {
                    localStorage.setItem('mainSubtitle', decodeURIComponent(subtitleParam));
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
        
        // 저장된 제목/부제목이 있으면 우선 사용, 없으면 기본 문구 표시
        const headerTitle = document.querySelector('header h1');
        const headerSubtext = document.querySelector('header p');
        const savedTitle = localStorage.getItem('mainTitle');
        const savedSubtitle = localStorage.getItem('mainSubtitle');
        if (headerTitle) headerTitle.textContent = savedTitle || '📡 통신 환경 개선 신청서';
        if (headerSubtext) headerSubtext.textContent = savedSubtitle || '아래 정보를 입력하여 신청서를 작성해주세요';
        
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
    
    // 기타 공사 선택시 추가 입력란 표시
    workTypeSelect.addEventListener('change', function() {
        if (this.value === 'other') {
            otherWorkTypeDiv.style.display = 'block';
            document.getElementById('otherWork').required = true;
        } else {
            otherWorkTypeDiv.style.display = 'none';
            document.getElementById('otherWork').required = false;
        }
    });
    
    // 폼 제출 처리
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // 고객 모드인 경우 신청서 제출 로직 실행
        if (isCustomerMode) {
            processCustomerFormSubmission(e);
            return;
        }
        
        // 관리자 모드인 경우 메일 공유 모달 표시 (관리자가 빈 설문지 공유할 때)
        showEmailModal();
    });
    
    // 고객용 신청서 제출 처리
    function processCustomerFormSubmission(event) {
        const formDataObj = new FormData(event.target);
        const applicationData = {};
        
        for (let [key, value] of formDataObj.entries()) {
            applicationData[key] = value;
        }
        
        // 공사 종류가 기타인 경우 다른 작업 내용 포함
        if (applicationData.workType === 'other' && applicationData.otherWork) {
            applicationData.workTypeDisplay = `기타 (${applicationData.otherWork})`;
        } else {
            const workTypeOptions = {
                'interior': 'KT',
                'exterior': 'SKT',
                'plumbing': 'LGU+',
                'electrical': '기타(지역방송)',
                'tile': '타일 공사',
                'painting': '도색 공사',
                'other': '기타'
            };
            applicationData.workTypeDisplay = workTypeOptions[applicationData.workType] || applicationData.workType;
        }
        
        // 예산 표시명 설정
        const budgetOptions = {
            'under-100': '100만원 미만',
            '100-300': '100만원 - 300만원',
            '300-500': '300만원 - 500만원',
            '500-1000': '500만원 - 1000만원',
            'over-1000': '1000만원 이상'
        };
        applicationData.budgetDisplay = budgetOptions[applicationData.budget] || '미정';
        
        // 신청 번호 생성 (현재 시간 기반)
        applicationData.applicationNumber = 'APP' + Date.now().toString().slice(-8);
        applicationData.submittedAt = new Date().toLocaleString('ko-KR');
        
        // 로컬 스토리지에 신청 데이터 저장
        const existingData = JSON.parse(localStorage.getItem('applicationData') || '{}');
        existingData[applicationData.applicationNumber] = applicationData;
        localStorage.setItem('applicationData', JSON.stringify(existingData));
        
        // 관리자에게 SMS 전송
        sendSMSToAdmin(applicationData);
        
        // 성공 메시지 표시
        alert('✅ 신청서가 성공적으로 제출되었습니다!\n\n관리자에게 SMS가 전송되었습니다.');
        
        // 폼 초기화
        event.target.reset();
        
        // 결과 페이지로 이동
        showResult();
    }
    
    // 관리자에게 SMS 전송
    function sendSMSToAdmin(applicationData) {
        console.log('=== SMS 전송 디버깅 ===');
        console.log('localStorage 전체 내용:', localStorage);
        
        // 다양한 키로 전화번호 찾기 시도
        let savedPhones = [];
        
        // 1차 시도: savedPhoneNumbers
        const savedPhones1 = JSON.parse(localStorage.getItem('savedPhoneNumbers') || '[]');
        if (savedPhones1.length > 0) {
            savedPhones = savedPhones1;
            console.log('savedPhoneNumbers에서 전화번호 찾음:', savedPhones);
        }
        
        // 2차 시도: adminPhone (단일 전화번호)
        if (savedPhones.length === 0) {
            const adminPhone = localStorage.getItem('adminPhone');
            if (adminPhone) {
                savedPhones = [adminPhone];
                console.log('adminPhone에서 전화번호 찾음:', savedPhones);
            }
        }
        
        // 3차 시도: adminContactInfo
        if (savedPhones.length === 0) {
            const adminContactInfo = JSON.parse(localStorage.getItem('adminContactInfo') || '{}');
            if (adminContactInfo.phone) {
                savedPhones = [adminPhone];
                console.log('adminContactInfo에서 전화번호 찾음:', savedPhones);
            }
        }
        
        console.log('최종 사용할 전화번호:', savedPhones);
        console.log('전화번호 개수:', savedPhones.length);
        
        if (savedPhones.length === 0) {
            console.warn('관리자 전화번호가 설정되지 않았습니다.');
            console.log('사용 가능한 localStorage 키들:', Object.keys(localStorage));
            
            // 사용자에게 전화번호 입력 요청
            const userPhone = prompt('관리자 전화번호를 입력해주세요 (예: 010-1234-5678):');
            if (userPhone && userPhone.trim()) {
                savedPhones = [userPhone.trim()];
                // 입력받은 전화번호를 localStorage에 저장
                localStorage.setItem('adminPhone', userPhone.trim());
                console.log('사용자 입력 전화번호 저장됨:', savedPhones);
            } else {
                alert('⚠️ 관리자 전화번호가 설정되지 않았습니다.\n관리자에게 문의해주세요.');
                return;
            }
        }
        
        // 첫 번째 전화번호로 SMS 전송
        const adminPhone = savedPhones[0];
        console.log('사용할 관리자 전화번호:', adminPhone);
        
        // SMS 내용 구성
        const smsContent = `🔔 공사 신청서 접수\n\n📝 신청자: ${applicationData.name}\n📱 연락처: ${applicationData.phone}\n🏠 주소: ${applicationData.address}\n🏗️ 공사종류: ${applicationData.workTypeDisplay}\n💰 예산: ${applicationData.budgetDisplay}\n📋 요청사항: ${applicationData.request}\n⏰ 접수시간: ${applicationData.submittedAt}\n🔢 신청번호: ${applicationData.applicationNumber}`;
        
        // SMS 앱 호출 (모바일에서 작동)
        const smsUrl = `sms:${adminPhone}?body=${encodeURIComponent(smsContent)}`;
        
        try {
            // 모바일 환경에서 SMS 앱 호출
            if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                window.location.href = smsUrl;
            } else {
                // 데스크톱에서는 전화번호와 내용을 복사
                const fullMessage = `전화번호: ${adminPhone}\n\n${smsContent}`;
                navigator.clipboard.writeText(fullMessage).then(() => {
                    alert(`📱 관리자 전화번호와 SMS 내용이 클립보드에 복사되었습니다.\n\n전화번호: ${adminPhone}\n\nSMS 내용:\n${smsContent}`);
                });
            }
        } catch (error) {
            console.error('SMS 전송 중 오류:', error);
            // 폴백: 전화번호와 내용을 표시
            alert(`📱 관리자 전화번호: ${adminPhone}\n\nSMS 내용:\n${smsContent}\n\n위 내용을 복사하여 SMS를 전송해주세요.`);
        }
    }
    
    function processFormSubmission() {
        
        const submitBtn = form.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        
        // 로딩 상태
        submitBtn.innerHTML = '<span class="loading"></span>처리중...';
        submitBtn.disabled = true;
        
        // 폼 데이터 수집
        const formDataObj = new FormData(form);
        formData = {};
        
        for (let [key, value] of formDataObj.entries()) {
            formData[key] = value;
        }
        
        // 공사 종류가 기타인 경우 다른 작업 내용 포함
        if (formData.workType === 'other' && formData.otherWork) {
            formData.workTypeDisplay = `기타 (${formData.otherWork})`;
        } else {
            const workTypeOptions = {
                'interior': 'KT',
                'exterior': 'SKT',
                'plumbing': 'LGU+',
                'electrical': '기타(지역방송)',
                'tile': '타일 공사',
                'painting': '도색 공사',
                'other': '기타'
            };
            formData.workTypeDisplay = workTypeOptions[formData.workType] || formData.workType;
        }
        
        // 예산 표시명 설정
        const budgetOptions = {
            'under-100': '100만원 미만',
            '100-300': '100만원 - 300만원',
            '300-500': '300만원 - 500만원',
            '500-1000': '500만원 - 1000만원',
            'over-1000': '1000만원 이상'
        };
        formData.budgetDisplay = budgetOptions[formData.budget] || '미정';
        
        // 신청 번호 생성 (현재 시간 기반)
        formData.applicationNumber = 'APP' + Date.now().toString().slice(-8);
        formData.submittedAt = new Date().toLocaleString('ko-KR');
        
        // 로컬 스토리지에 신청 데이터 저장 (임시 - 실제로는 서버 저장)
        const existingData = JSON.parse(localStorage.getItem('applicationData') || '{}');
        existingData[formData.applicationNumber] = formData;
        localStorage.setItem('applicationData', JSON.stringify(existingData));
        
        // 관리자에게 자동 알림 발송 (문자 + 메일)
        sendAutoNotificationToAdmin(formData);
        
        // 실제 서버 제출 시뮬레이션
        setTimeout(() => {
            const submitBtn = form.querySelector('.submit-btn');
            const originalText = submitBtn.textContent;
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            
            showResult();
        }, 1500);
    }
});

function showResult() {
    const form = document.getElementById('applicationForm');
    const resultSection = document.getElementById('result');
    const resultContent = document.getElementById('resultContent');
    
    // URL 파라미터 확인하여 고객용/관리자용 모드 결정
    const urlParams = new URLSearchParams(window.location.search);
    const isCustomerMode = urlParams.has('customer') || urlParams.has('apply');
    
    // 고객용과 관리자용 결과 내용 구분
    let resultHTML;
    
    if (isCustomerMode) {
        // 고객용: 고객이 확인해야 할 주요 정보들 표시
        resultHTML = `
            <div class="result-item">
                <span class="result-label">신청번호:</span>
                <span class="result-value">${formData.applicationNumber}</span>
            </div>
            <div class="result-item">
                <span class="result-label">공사요청:</span>
                <span class="result-value">${formData.name}</span>
            </div>
            <div class="result-item">
                <span class="result-label">연락처:</span>
                <span class="result-value">${formData.phone}</span>
            </div>
            <div class="result-item">
                <span class="result-label">현재 통신사:</span>
                <span class="result-value">${formData.workTypeDisplay}</span>
            </div>
            ${formData.startDate ? `
            <div class="result-item">
                <span class="result-label">희망 시작일:</span>
                <span class="result-value">${new Date(formData.startDate).toLocaleDateString('ko-KR')}</span>
            </div>
            ` : ''}
            ${formData.description ? `
            <div class="result-item">
                <span class="result-label">요청사항:</span>
                <span class="result-value">${formData.description}</span>
            </div>
            ` : ''}
            <div class="result-item">
                <span class="result-label">신청일시:</span>
                <span class="result-value">${formData.submittedAt}</span>
            </div>
            <div class="result-item" style="margin-top: 20px; padding: 15px; background: #f0f8ff; border-radius: 8px;">
                <span class="result-value" style="color: #2c5aa0; font-weight: 600;">
                    📞 빠른 시일 내에 담당자가 연락드리겠습니다.<br>
                    ✅ 위 신청 내용을 확인해 주세요.<br>
                    🔍 나중에 <a href="확인.html?number=${formData.applicationNumber}" target="_blank" style="color: #2c5aa0; text-decoration: underline;">여기를 클릭</a>하시면 신청서를 다시 확인할 수 있습니다.
                </span>
            </div>
        `;
    } else {
        // 관리자용: 모든 정보 표시 (기존과 동일)
        resultHTML = `
            <div class="result-item">
                <span class="result-label">신청번호:</span>
                <span class="result-value">${formData.applicationNumber}</span>
            </div>
            <div class="result-item">
                <span class="result-label">신청자명:</span>
                <span class="result-value">${formData.name}</span>
            </div>
            <div class="result-item">
                <span class="result-label">연락처:</span>
                <span class="result-value">${formData.phone}</span>
            </div>
            ${formData.email ? `
            <div class="result-item">
                <span class="result-label">이메일:</span>
                <span class="result-value">${formData.email}</span>
            </div>
            ` : ''}
            <div class="result-item">
                <span class="result-label">공사주소:</span>
                <span class="result-value">${formData.address}</span>
            </div>
            <div class="result-item">
                <span class="result-label">공사종류:</span>
                <span class="result-value">${formData.workTypeDisplay}</span>
            </div>
            ${formData.budget ? `
            <div class="result-item">
                <span class="result-label">예상예산:</span>
                <span class="result-value">${formData.budgetDisplay}</span>
            </div>
            ` : ''}
            ${formData.startDate ? `
            <div class="result-item">
                <span class="result-label">희망시작일:</span>
                <span class="result-value">${new Date(formData.startDate).toLocaleDateString('ko-KR')}</span>
            </div>
            ` : ''}
            ${formData.description ? `
            <div class="result-item">
                <span class="result-label">요청사항:</span>
                <span class="result-value">${formData.description}</span>
            </div>
            ` : ''}
            <div class="result-item">
                <span class="result-label">신청일시:</span>
                <span class="result-value">${formData.submittedAt}</span>
            </div>
        `;
    }
    
    resultContent.innerHTML = resultHTML;
    
    // 결과 화면 버튼들을 고객용/관리자용으로 구분
    const resultActions = document.querySelector('.result-actions');
    if (resultActions) {
        if (isCustomerMode) {
            // 고객용: 종료 버튼만 표시
            resultActions.innerHTML = `
                <button type="button" class="close-btn" onclick="closeApplication()">✅ 신청 완료</button>
            `;
        } else {
            // 관리자용: 기존 버튼들 유지
            resultActions.innerHTML = `
                <button type="button" class="share-btn" onclick="shareResultToKakao()">결과 카카오톡 공유</button>
                <button type="button" class="new-btn" onclick="resetForm()">새 신청서 작성</button>
            `;
        }
    }
    
    // 폼 숨기고 결과 표시
    form.style.display = 'none';
    resultSection.style.display = 'block';
    
    // 스크롤을 맨 위로
    window.scrollTo(0, 0);
}

// 고객용 신청 완료 함수
function closeApplication() {
    // 감사 메시지 표시
    if (confirm('신청이 완료되었습니다.\n\n📞 담당자가 빠른 시일 내에 연락드리겠습니다.\n\n창을 닫으시겠습니까?')) {
        // 브라우저 창 닫기 시도
        window.close();
        
        // 창이 닫히지 않는 경우를 위한 대안
        setTimeout(() => {
            // 페이지를 새로고침하여 처음 상태로 돌아가기
            window.location.href = window.location.pathname + '?customer=true';
        }, 1000);
    }
}

function resetForm() {
    const form = document.getElementById('applicationForm');
    const resultSection = document.getElementById('result');
    
    // 폼 초기화
    form.reset();
    document.getElementById('otherWorkType').style.display = 'none';
    document.getElementById('otherWork').required = false;
    
    // 폼 표시, 결과 숨기기
    form.style.display = 'block';
    resultSection.style.display = 'none';
    
    // 스크롤을 맨 위로
    window.scrollTo(0, 0);
}

// 카카오톡 공유 (빈 폼 상태)
function shareToKakao() {
    const currentUrl = window.location.href;
    
    Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
            title: '🏗️ 공사 신청서',
            description: '간편하게 공사를 신청하세요! QR코드를 스캔하거나 링크를 클릭하여 신청서를 작성할 수 있습니다.',
            imageUrl: 'https://via.placeholder.com/400x300/4CAF50/FFFFFF?text=%F0%9F%8F%97%EF%B8%8F+%EA%B3%B5%EC%82%AC+%EC%8B%A0%EC%B2%AD%EC%84%9C', // 실제 이미지로 변경 가능
            link: {
                mobileWebUrl: currentUrl,
                webUrl: currentUrl
            }
        },
        buttons: [
            {
                title: '신청서 작성하기',
                link: {
                    mobileWebUrl: currentUrl,
                    webUrl: currentUrl
                }
            }
        ],
        fail: function(error) {
            console.log(error);
            alert('카카오톡 공유 중 오류가 발생했습니다. 링크를 복사하여 공유해보세요.');
            copyToClipboard(currentUrl);
        }
    });
}

// 결과 카카오톡 공유
function shareResultToKakao() {
    const currentUrl = window.location.href;
    
    const shareText = `🏗️ 공사 신청이 완료되었습니다!
    
📋 신청번호: ${formData.applicationNumber}
👤 신청자: ${formData.name}
📞 연락처: ${formData.phone}
🏠 공사종류: ${formData.workTypeDisplay}
📅 신청일시: ${formData.submittedAt}

빠른 시간 내에 연락드리겠습니다.`;
    
    Kakao.Share.sendDefault({
        objectType: 'text',
        text: shareText,
        link: {
            mobileWebUrl: currentUrl,
            webUrl: currentUrl
        },
        fail: function(error) {
            console.log(error);
            // 카카오톡 공유 실패시 클립보드에 복사
            copyToClipboard(shareText + '\n\n' + currentUrl);
            alert('결과가 클립보드에 복사되었습니다. 원하는 곳에 붙여넣기하여 공유하세요.');
        }
    });
}

// 클립보드 복사 함수
function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            console.log('클립보드에 복사됨');
        }).catch(() => {
            fallbackCopyToClipboard(text);
        });
    } else {
        fallbackCopyToClipboard(text);
    }
}

function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        console.log('클립보드에 복사됨 (fallback)');
    } catch (err) {
        console.error('복사 실패:', err);
    }
    
    document.body.removeChild(textArea);
}

// QR 코드 생성 함수
function generatePageQR() {
    // 고객용 URL 생성 (파라미터 추가)
    const baseUrl = window.location.origin + window.location.pathname;
    const customerUrl = baseUrl + '?customer=true';
    const qrSection = document.getElementById('qrSection');
    const qrcodeDiv = document.getElementById('qrcode');
    
    console.log('QR 코드 생성 시작 (고객용 URL):', customerUrl);
    
    // QR 섹션 표시
    qrSection.style.display = 'block';
    qrcodeDiv.innerHTML = '<p>QR 코드 생성 중...</p>';
    
    // QRCode 라이브러리 로딩 대기
    function tryGenerateQR(retryCount = 0) {
        if (typeof QRCode !== 'undefined') {
            console.log('QRCode 라이브러리 로딩 확인됨');
            
            // 기존 내용 제거
            qrcodeDiv.innerHTML = '';
            
            try {
                // QRCode.toDataURL 방식으로 직접 시도 (고객용 URL 사용)
                QRCode.toDataURL(customerUrl, {
                    width: 256,
                    height: 256,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    },
                    errorCorrectionLevel: 'M'
                }, function (error, url) {
                    if (error) {
                        console.error('QR 코드 생성 오류:', error);
                        qrcodeDiv.innerHTML = '<p style="color: red;">QR 코드 생성 실패</p>';
                        return;
                    }
                    
                    // 이미지 요소로 QR 코드 표시
                    const img = document.createElement('img');
                    img.src = url;
                    img.alt = 'QR Code';
                    img.style.maxWidth = '100%';
                    img.style.height = 'auto';
                    
                    qrcodeDiv.innerHTML = '';
                    qrcodeDiv.appendChild(img);
                    currentQRDataURL = url;
                    
                    console.log('QR 코드 생성 성공');
                    qrSection.scrollIntoView({ behavior: 'smooth' });
                    
                    // QR 코드 생성 성공 시 삭제 버튼 표시
                    const qrDeleteBtn = document.getElementById('qrDeleteBtn');
                    if (qrDeleteBtn) {
                        qrDeleteBtn.style.display = 'inline-block';
                    }
                });
                
            } catch (e) {
                console.error('QR 코드 생성 중 예외 발생:', e);
                qrcodeDiv.innerHTML = '<p style="color: red;">QR 코드 생성 실패: ' + e.message + '</p>';
            }
            
        } else if (retryCount < 10) {
            console.log(`QRCode 라이브러리 로딩 대기 중... (${retryCount + 1}/10)`);
            setTimeout(() => tryGenerateQR(retryCount + 1), 300);
        } else {
            console.error('QRCode 라이브러리 로딩 타임아웃');
            
            // Google Charts API를 사용한 대체 방법
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(customerUrl)}`;
            const img = document.createElement('img');
            img.src = qrUrl;
            img.alt = 'QR Code';
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            img.crossOrigin = 'anonymous';
            
            img.onload = function() {
                // 이미지를 캔버스로 변환하여 다운로드 가능하게 만들기
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = 256;
                canvas.height = 256;
                ctx.drawImage(img, 0, 0, 256, 256);
                currentQRDataURL = canvas.toDataURL();
            };
            
            qrcodeDiv.innerHTML = '';
            qrcodeDiv.appendChild(img);
            
            console.log('QR 코드 생성 성공 (대체 API 사용)');
            qrSection.scrollIntoView({ behavior: 'smooth' });
            
            // QR 코드 생성 성공 시 삭제 버튼 표시 (대체 API 사용 시에도)
            const qrDeleteBtn = document.getElementById('qrDeleteBtn');
            if (qrDeleteBtn) {
                qrDeleteBtn.style.display = 'inline-block';
            }
        }
    }
    
    // QR 코드 생성 시도
    tryGenerateQR();
}

// QR 섹션 숨기기
function hideQRSection() {
    const qrSection = document.getElementById('qrSection');
    qrSection.style.display = 'none';
    currentQRDataURL = null;
}

// QR 코드 다운로드
function downloadQR(format) {
    if (!currentQRDataURL) {
        alert('먼저 QR 코드를 생성해주세요.');
        return;
    }
    
    let dataURL;
    
    if (format === 'jpg') {
        // Canvas 또는 Image 요소 찾기
        const canvas = document.querySelector('#qrcode canvas');
        const img = document.querySelector('#qrcode img');
        
        if (canvas) {
            // JPG 형식으로 변환 (흰 배경 추가)
            const tempCanvas = document.createElement('canvas');
            const ctx = tempCanvas.getContext('2d');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            
            // 흰 배경 그리기
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            
            // QR 코드 그리기
            ctx.drawImage(canvas, 0, 0);
            
            dataURL = tempCanvas.toDataURL('image/jpeg', 0.9);
        } else if (img) {
            // 이미지를 캔버스로 변환하여 JPG 생성
            const tempCanvas = document.createElement('canvas');
            const ctx = tempCanvas.getContext('2d');
            tempCanvas.width = 256;
            tempCanvas.height = 256;
            
            // 흰 배경 그리기
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, 256, 256);
            
            // QR 코드 그리기
            ctx.drawImage(img, 0, 0, 256, 256);
            
            dataURL = tempCanvas.toDataURL('image/jpeg', 0.9);
        } else {
            dataURL = currentQRDataURL;
        }
    } else {
        dataURL = currentQRDataURL;
    }
    
    // 다운로드 실행
    const link = document.createElement('a');
    link.download = `구포현대아파트-통신환경개선신청서-QR.${format}`;
    link.href = dataURL;
    link.click();
    
    console.log(`QR 코드 다운로드 완료: ${format.toUpperCase()}`);
}

// 메일 공유 모달 표시
function showEmailModal() {
    const emailModal = document.getElementById('emailModal');
    const recipientEmail = document.getElementById('recipientEmail');
    const emailSubject = document.getElementById('emailSubject');
    const emailMessage = document.getElementById('emailMessage');
    
    // 기본값 설정
    emailSubject.value = '구포현대아파트 통신 환경 개선 신청서';
    
    // 폼 데이터를 기반으로 메시지 미리 작성
    const preMessage = `안녕하세요,\n\n구포현대아파트 통신 환경 개선 신청서를 공유드립니다.\n\n▣ 공사요청: ${document.getElementById('name').value}\n▣ 연락처: ${document.getElementById('phone').value}\n▣ 현재 통신사: ${document.querySelector('#workType option:checked')?.textContent || ''}\n${document.getElementById('startDate').value ? `▣ 희망 시작일: ${document.getElementById('startDate').value}\n` : ''}${document.getElementById('description').value ? `▣ 상세 요청사항: ${document.getElementById('description').value}\n` : ''}\n신속한 처리 부탁드립니다.\n\n감사합니다.`;
    
    emailMessage.value = preMessage;
    
    emailModal.style.display = 'flex';
    recipientEmail.focus();
}

// 메일 공유 모달 닫기
function closeEmailModal() {
    document.getElementById('emailModal').style.display = 'none';
}

// 메일 보내기 (실제 구현은 백엔드 필요)
function sendEmail() {
    const recipientEmail = document.getElementById('recipientEmail').value;
    const senderName = document.getElementById('senderName').value;
    const emailSubject = document.getElementById('emailSubject').value;
    const emailMessage = document.getElementById('emailMessage').value;
    
    if (!recipientEmail) {
        alert('받는 사람 메일주소를 입력해주세요.');
        return;
    }
    
    if (!emailSubject.trim()) {
        alert('제목을 입력해주세요.');
        return;
    }
    
    // 메일 내용 생성
    const mailtoUrl = `mailto:${recipientEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailMessage)}`;
    
    // 기본 메일 클라이언트로 열기
    window.location.href = mailtoUrl;
    
    // 성공 메시지 표시
    alert('메일 클라이언트가 열렸습니다. 메일을 확인하고 전송해주세요.');
    
    closeEmailModal();
}

// 문자 공유 모달 표시
function showSMSModal() {
    const smsModal = document.getElementById('smsModal');
    const recipientPhone = document.getElementById('recipientPhone');
    const smsMessage = document.getElementById('smsMessage');
    
    // 폼 데이터를 기반으로 메시지 미리 작성
    const preMessage = `[구포현대아파트 통신환경개선]

📋 신청정보
• 공사요청: ${document.getElementById('name').value}
• 연락처: ${document.getElementById('phone').value}
• 현재 통신사: ${document.querySelector('#workType option:checked')?.textContent || ''}${document.getElementById('startDate').value ? `
• 희망 시작일: ${document.getElementById('startDate').value}` : ''}${document.getElementById('description').value ? `
• 요청사항: ${document.getElementById('description').value}` : ''}

담당자가 빠른 시일 내에 연락드리겠습니다.`;
    
    smsMessage.value = preMessage;
    
    smsModal.style.display = 'flex';
    recipientPhone.focus();
}

// 문자 공유 모달 닫기
function closeSMSModal() {
    document.getElementById('smsModal').style.display = 'none';
}

// 문자 보내기 (실제 구현은 백엔드 필요)
function sendSMS() {
    const recipientPhone = document.getElementById('recipientPhone').value;
    const smsMessage = document.getElementById('smsMessage').value;
    
    if (!recipientPhone) {
        alert('받는 사람 휴대폰번호를 입력해주세요.');
        return;
    }
    
    if (!smsMessage.trim()) {
        alert('메시지를 입력해주세요.');
        return;
    }
    
    // 전화번호 형식 검증
    const phoneRegex = /^01[0-9]-?\d{3,4}-?\d{4}$/;
    if (!phoneRegex.test(recipientPhone.replace(/-/g, ''))) {
        alert('올바른 휴대폰번호 형식을 입력해주세요. (예: 010-1234-5678)');
        return;
    }
    
    // SMS URL 스키마 사용 (안드로이드/iOS)
    const smsUrl = `sms:${recipientPhone}?body=${encodeURIComponent(smsMessage)}`;
    
    // SMS 앱으로 전송
    window.location.href = smsUrl;
    
    // 성공 메시지 표시
    alert('문자 메시지 앱이 열렸습니다. 메시지를 확인하고 전송해주세요.');
    
    closeSMSModal();
}

// 관리자에게 자동 문자 + 메일 알림 발송
function sendAutoNotificationToAdmin(applicationData) {
    // localStorage에서 관리자 연락처 정보 가져오기
    const adminPhone = localStorage.getItem('adminPhoneNumber');
    const adminEmail = localStorage.getItem('adminEmail');
    
    if (!adminPhone && !adminEmail) {
        console.log('관리자 연락처가 설정되지 않았습니다.');
        // 관리자 연락처 설정 요청
        setAdminContactInfo();
        return;
    }
    
    // 알림 내용 생성
    const notificationMessage = `[구포현대아파트 통신환경개선] 🔔 새 신청 접수

📋 신청정보
• 신청번호: ${applicationData.applicationNumber}
• 공사요청: ${applicationData.name}
• 연락처: ${applicationData.phone}
• 현재 통신사: ${applicationData.workTypeDisplay}${applicationData.startDate ? `
• 희망 시작일: ${new Date(applicationData.startDate).toLocaleDateString('ko-KR')}` : ''}${applicationData.description ? `
• 요청사항: ${applicationData.description}` : ''}
• 신청일시: ${applicationData.submittedAt}

관리자 페이지: ${window.location.origin + window.location.pathname.replace('index.html', '관리자.html')}`;
    
    // 1. 문자 알림 발송 (설정된 경우)
    if (adminPhone) {
        const smsUrl = `sms:${adminPhone}?body=${encodeURIComponent(notificationMessage)}`;
        try {
            window.open(smsUrl, '_blank');
            console.log('관리자에게 자동 문자 알림이 발송되었습니다.');
        } catch (error) {
            console.error('자동 문자 발송 실패:', error);
        }
    }
    
    // 2. 메일 알림 발송 (설정된 경우)
    if (adminEmail) {
        const emailSubject = `[구포현대아파트] 새 신청 접수 - ${applicationData.applicationNumber}`;
        const emailBody = notificationMessage.replace(/• /g, '- '); // 메일용 포맷 조정
        
        const mailtoUrl = `mailto:${adminEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
        
        try {
            setTimeout(() => {
                window.open(mailtoUrl, '_blank');
                console.log('관리자에게 자동 메일 알림이 발송되었습니다.');
            }, 1000); // 문자 발송 후 1초 뒤에 메일 발송
        } catch (error) {
            console.error('자동 메일 발송 실패:', error);
        }
    }
}

// 관리자 연락처 설정 (휴대폰 + 이메일)
function setAdminContactInfo() {
    // 휴대폰번호 설정
    const adminPhone = prompt(`관리자 휴대폰번호를 입력해주세요.
(신청서 접수 시 자동으로 문자 알림을 받을 번호입니다)

예: 010-1234-5678
※ 건너뛰려면 취소를 누르세요`);
    
    if (adminPhone) {
        const phoneRegex = /^01[0-9]-?\d{3,4}-?\d{4}$/;
        if (phoneRegex.test(adminPhone.replace(/-/g, ''))) {
            localStorage.setItem('adminPhoneNumber', adminPhone);
        } else {
            alert('올바른 휴대폰번호 형식을 입력해주세요. (예: 010-1234-5678)');
            return setAdminContactInfo();
        }
    }
    
    // 이메일 설정
    const adminEmail = prompt(`관리자 이메일 주소를 입력해주세요.
(신청서 접수 시 자동으로 메일 알림을 받을 주소입니다)

예: admin@example.com
※ 건너뛰려면 취소를 누르세요`);
    
    if (adminEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(adminEmail)) {
            localStorage.setItem('adminEmail', adminEmail);
        } else {
            alert('올바른 이메일 형식을 입력해주세요. (예: admin@example.com)');
            return setAdminContactInfo();
        }
    }
    
    // 설정 완료 메시지
    const setPhone = localStorage.getItem('adminPhoneNumber');
    const setEmail = localStorage.getItem('adminEmail');
    
    if (setPhone || setEmail) {
        let message = '✅ 관리자 연락처가 설정되었습니다:\n\n';
        if (setPhone) message += `📱 문자: ${setPhone}\n`;
        if (setEmail) message += `📧 메일: ${setEmail}\n`;
        message += '\n새로운 신청이 접수되면 자동으로 알림을 받습니다.';
        alert(message);
    } else {
        console.log('관리자 연락처 설정이 취소되었습니다.');
    }
}

// 기존 함수명 유지 (호환성을 위해)
function setAdminPhoneNumber() {
    return setAdminContactInfo();
}

// 관리자 번호 변경 함수 (관리자 페이지에서 호출 가능)
function changeAdminPhoneNumber() {
    const currentPhone = localStorage.getItem('adminPhoneNumber');
    const newPhone = prompt(`현재 관리자 번호: ${currentPhone || '설정되지 않음'}

새로운 관리자 휴대폰번호를 입력해주세요:`, currentPhone);
    
    if (newPhone) {
        const phoneRegex = /^01[0-9]-?\d{3,4}-?\d{4}$/;
        if (phoneRegex.test(newPhone.replace(/-/g, ''))) {
            localStorage.setItem('adminPhoneNumber', newPhone);
            alert(`관리자 번호가 변경되었습니다: ${newPhone}`);
            return newPhone;
        } else {
            alert('올바른 휴대폰번호 형식을 입력해주세요.');
            return changeAdminPhoneNumber();
        }
    }
}

// 페이지 로드시 카카오 SDK 로그인 상태 확인
document.addEventListener('DOMContentLoaded', function() {
    if (typeof Kakao !== 'undefined' && Kakao.isInitialized()) {
        console.log('카카오 SDK 초기화 완료');
    } else {
        console.warn('카카오 SDK 초기화 실패 - 앱키를 확인해주세요');
    }
    
    // 저장된 제목/부제목 불러오기
    loadSavedTitles();
    
    // 저장된 메일/폰번호 표시
    displaySavedInputs();
    
    // URL 파라미터 확인하여 고객 모드일 때만 관리자 번호 확인
    const urlParams = new URLSearchParams(window.location.search);
    const isCustomerMode = urlParams.has('customer') || urlParams.has('apply');
    
    // 최초 로드시 관리자 연락처가 없으면 설정 요청 (고객 모드가 아닐 때만)
    if (!isCustomerMode && !localStorage.getItem('adminPhoneNumber') && !localStorage.getItem('adminEmail')) {
        setTimeout(() => {
            if (confirm('관리자 연락처를 설정하시겠습니까?\n신청서 접수 시 자동으로 문자/메일 알림을 받을 수 있습니다.')) {
                setAdminContactInfo();
            }
        }, 1000);
    }
});

// ===== 새로운 기능들 =====

// 메일 입력 모달 표시
function showEmailInputModal() {
    const modal = document.getElementById('emailInputModal');
    const emailInputs = document.getElementById('emailInputs');
    
    // 기존 저장된 메일 주소들 불러오기
    const savedEmails = JSON.parse(localStorage.getItem('savedEmailAddresses') || '[]');
    
    // 기존 입력란들 제거
    emailInputs.innerHTML = '';
    
    // 저장된 메일 주소들로 입력란 생성
    if (savedEmails.length > 0) {
        savedEmails.forEach((email, index) => {
            addEmailInput(email);
        });
    } else {
        // 빈 입력란 하나 생성
        addEmailInput();
    }
    
    modal.style.display = 'block';
    updateEmailAddButton();
}

// 메일 입력 모달 닫기
function closeEmailInputModal() {
    document.getElementById('emailInputModal').style.display = 'none';
}

// 메일 입력란 추가
function addEmailInput(value = '') {
    const emailInputs = document.getElementById('emailInputs');
    const emailCount = emailInputs.children.length;
    
    if (emailCount >= 3) {
        alert('메일 주소는 최대 3개까지 입력할 수 있습니다.');
        return;
    }
    
    const emailRow = document.createElement('div');
    emailRow.className = 'email-input-row';
    
    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.className = 'email-input';
    emailInput.placeholder = `example${emailCount + 1}@email.com`;
    emailInput.value = value;
    
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = '삭제';
    removeBtn.onclick = function() { removeEmailInput(this); };
    
    // 첫 번째 입력란은 삭제 버튼 숨기기
    if (emailCount === 0) {
        removeBtn.style.display = 'none';
    }
    
    emailRow.appendChild(emailInput);
    emailRow.appendChild(removeBtn);
    emailInputs.appendChild(emailRow);
    
    updateEmailAddButton();
}

// 메일 입력란 제거
function removeEmailInput(button) {
    const emailRow = button.parentElement;
    const emailInputs = document.getElementById('emailInputs');
    
    emailRow.remove();
    
    // 남은 입력란들의 삭제 버튼 상태 업데이트
    const remainingRows = emailInputs.children;
    if (remainingRows.length === 1) {
        remainingRows[0].querySelector('.remove-btn').style.display = 'none';
    }
    
    updateEmailAddButton();
}

// 메일 추가 버튼 상태 업데이트
function updateEmailAddButton() {
    const addBtn = document.getElementById('addEmailBtn');
    const emailCount = document.getElementById('emailInputs').children.length;
    
    if (emailCount >= 3) {
        addBtn.disabled = true;
        addBtn.textContent = '최대 3개까지 입력 가능';
    } else {
        addBtn.disabled = false;
        addBtn.textContent = '+ 메일 주소 추가';
    }
}

// 메일 주소들 저장
function saveEmailAddresses() {
    const emailInputs = document.querySelectorAll('.email-input');
    const emails = [];
    
    emailInputs.forEach(input => {
        const email = input.value.trim();
        if (email && isValidEmail(email)) {
            emails.push(email);
        }
    });
    
    if (emails.length === 0) {
        alert('유효한 메일 주소를 하나 이상 입력해주세요.');
        return;
    }
    
    // localStorage에 저장
    localStorage.setItem('savedEmailAddresses', JSON.stringify(emails));
    
    alert(`✅ ${emails.length}개의 메일 주소가 저장되었습니다:\n\n${emails.join('\n')}`);
    closeEmailInputModal();
    displaySavedInputs(); // 저장 후 표시
}

// 폰번호 입력 모달 표시
function showPhoneInputModal() {
    const modal = document.getElementById('phoneInputModal');
    const phoneInputs = document.getElementById('phoneInputs');
    
    // 기존 저장된 폰번호들 불러오기
    const savedPhones = JSON.parse(localStorage.getItem('savedPhoneNumbers') || '[]');
    
    // 기존 입력란들 제거
    phoneInputs.innerHTML = '';
    
    // 저장된 폰번호들로 입력란 생성
    if (savedPhones.length > 0) {
        savedPhones.forEach((phone, index) => {
            addPhoneInput(phone);
        });
    } else {
        // 빈 입력란 하나 생성
        addPhoneInput();
    }
    
    modal.style.display = 'block';
    updatePhoneAddButton();
}

// 폰번호 입력 모달 닫기
function closePhoneInputModal() {
    document.getElementById('phoneInputModal').style.display = 'none';
}

// 폰번호 입력란 추가
function addPhoneInput(value = '') {
    const phoneInputs = document.getElementById('phoneInputs');
    const phoneCount = phoneInputs.children.length;
    
    if (phoneCount >= 3) {
        alert('폰번호는 최대 3개까지 입력할 수 있습니다.');
        return;
    }
    
    const phoneRow = document.createElement('div');
    phoneRow.className = 'phone-input-row';
    
    const phoneInput = document.createElement('input');
    phoneInput.type = 'tel';
    phoneInput.className = 'phone-input';
    phoneInput.placeholder = `010-1234-567${phoneCount + 1}`;
    phoneInput.value = value;
    
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = '삭제';
    removeBtn.onclick = function() { removePhoneInput(this); };
    
    // 첫 번째 입력란은 삭제 버튼 숨기기
    if (phoneCount === 0) {
        removeBtn.style.display = 'none';
    }
    
    phoneRow.appendChild(phoneInput);
    phoneRow.appendChild(removeBtn);
    phoneInputs.appendChild(phoneRow);
    
    updatePhoneAddButton();
}

// 폰번호 입력란 제거
function removePhoneInput(button) {
    const phoneRow = button.parentElement;
    const phoneInputs = document.getElementById('phoneInputs');
    
    phoneRow.remove();
    
    // 남은 입력란들의 삭제 버튼 상태 업데이트
    const remainingRows = phoneInputs.children;
    if (remainingRows.length === 1) {
        remainingRows[0].querySelector('.remove-btn').style.display = 'none';
    }
    
    updatePhoneAddButton();
}

// 폰번호 추가 버튼 상태 업데이트
function updatePhoneAddButton() {
    const addBtn = document.getElementById('addPhoneBtn');
    const phoneCount = document.getElementById('phoneInputs').children.length;
    
    if (phoneCount >= 3) {
        addBtn.disabled = true;
        addBtn.textContent = '최대 3개까지 입력 가능';
    } else {
        addBtn.disabled = false;
        addBtn.textContent = '+ 폰번호 추가';
    }
}

// 폰번호들 저장
function savePhoneNumbers() {
    const phoneInputs = document.querySelectorAll('.phone-input');
    const phones = [];
    
    phoneInputs.forEach(input => {
        const phone = input.value.trim();
        if (phone && isValidPhone(phone)) {
            phones.push(phone);
        }
    });
    
    if (phones.length === 0) {
        alert('유효한 폰번호를 하나 이상 입력해주세요.');
        return;
    }
    
    // localStorage에 저장
    localStorage.setItem('savedPhoneNumbers', JSON.stringify(phones));
    
    alert(`✅ ${phones.length}개의 폰번호가 저장되었습니다:\n\n${phones.join('\n')}`);
    closePhoneInputModal();
    displaySavedInputs(); // 저장 후 표시
}

// 이메일 유효성 검사
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// 폰번호 유효성 검사
function isValidPhone(phone) {
    const phoneRegex = /^01[0-9]-?\d{3,4}-?\d{4}$/;
    return phoneRegex.test(phone.replace(/-/g, ''));
}

// QR 코드 삭제
function deleteQR() {
    if (confirm('생성된 QR 코드를 삭제하시겠습니까?')) {
        const qrSection = document.getElementById('qrSection');
        const qrCodeContainer = document.getElementById('qrcode');
        const qrGenerateBtn = document.getElementById('qrGenerateBtn');
        const qrDeleteBtn = document.getElementById('qrDeleteBtn');
        
        // QR 코드 섹션 숨기기
        qrSection.style.display = 'none';
        
        // QR 코드 내용 삭제
        qrCodeContainer.innerHTML = '';
        
        // 버튼 상태 변경
        qrGenerateBtn.style.display = 'inline-block';
        qrDeleteBtn.style.display = 'none';
        
        // localStorage에서 QR 코드 데이터 삭제
        localStorage.removeItem('currentQRDataURL');
        
        alert('QR 코드가 삭제되었습니다.');
    }
}

// ===== 제목 편집 기능 =====

// 제목 편집 모드
function editTitle() {
    const titleElement = document.getElementById('mainTitle');
    const currentTitle = titleElement.textContent;
    
    // 편집 모드로 변경 (입력란만 표시)
    titleElement.innerHTML = `
        <input type="text" id="titleInput" value="${currentTitle}" 
               style="background: transparent; color: white; border: 2px solid rgba(255,255,255,0.5); 
                      border-radius: 5px; padding: 5px 10px; font-size: 1.6rem; font-weight: 600; 
                      width: 100%; text-align: center; outline: none;">
    `;
    
    // 입력란에 포커스
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
    
    alert('제목이 저장되었습니다!');
}

// 제목 편집 취소
function cancelTitleEdit() {
    const titleElement = document.getElementById('mainTitle');
    const savedTitle = localStorage.getItem('mainTitle') || '📡 구포현대아파트 통신 환경 개선 신청서';
    
    // 편집 모드 해제하고 원래 상태로 복원
    titleElement.innerHTML = savedTitle;
    titleElement.onclick = editTitle;
}

// 부제목 편집 모드
function editSubtitle() {
    const subtitleElement = document.getElementById('mainSubtitle');
    const currentSubtitle = subtitleElement.textContent;
    
    // 편집 모드로 변경 (입력란만 표시)
    subtitleElement.innerHTML = `
        <input type="text" id="subtitleInput" value="${currentSubtitle}" 
               style="background: transparent; color: white; border: 2px solid rgba(255,255,255,0.5); 
                      border-radius: 5px; padding: 5px 10px; font-size: 1.1rem; 
                      width: 100%; text-align: center; outline: none;">
    `;
    
    // 입력란에 포커스
    const subtitleInput = document.getElementById('subtitleInput');
    subtitleInput.focus();
    subtitleInput.select();
    
    // Enter 키로 저장, Esc 키로 취소
    subtitleInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            saveSubtitle();
        } else if (e.key === 'Escape') {
            cancelSubtitleEdit();
        }
    });
    
    // 입력란에서 포커스가 벗어나면 자동 저장
    subtitleInput.addEventListener('blur', function() {
        saveSubtitle();
    });
}

// 부제목 저장
function saveSubtitle() {
    const subtitleInput = document.getElementById('subtitleInput');
    const newSubtitle = subtitleInput.value.trim();
    
    if (!newSubtitle) {
        alert('부제목을 입력해주세요.');
        return;
    }
    
    // localStorage에 저장
    localStorage.setItem('mainSubtitle', newSubtitle);
    
    // 부제목 업데이트 및 편집 모드 해제
    const subtitleElement = document.getElementById('mainSubtitle');
    subtitleElement.innerHTML = newSubtitle;
    subtitleElement.onclick = editSubtitle;
    
    alert('부제목이 저장되었습니다!');
}

// 부제목 편집 취소
function cancelSubtitleEdit() {
    const subtitleElement = document.getElementById('mainSubtitle');
    const savedSubtitle = localStorage.getItem('mainSubtitle') || '통신 환경 개선을 위한 신청서를 작성해주세요';
    
    // 편집 모드 해제하고 원래 상태로 복원
    subtitleElement.innerHTML = savedSubtitle;
    subtitleElement.onclick = editSubtitle;
}

// 페이지 로드시 저장된 제목/부제목 불러오기
function loadSavedTitles() {
    const savedTitle = localStorage.getItem('mainTitle');
    const savedSubtitle = localStorage.getItem('mainSubtitle');
    
    if (savedTitle) {
        const titleElement = document.getElementById('mainTitle');
        titleElement.textContent = savedTitle;
    }
    
    if (savedSubtitle) {
        const subtitleElement = document.getElementById('mainSubtitle');
        subtitleElement.textContent = savedSubtitle;
    }
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