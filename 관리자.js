// 카카오 SDK 초기화
Kakao.init('YOUR_KAKAO_APP_KEY'); // 실제 카카오 개발자센터에서 발급받은 JavaScript 키로 변경하세요

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    loadDashboard();
    loadApplications();
    setupEventListeners();
    updateAdminPhoneDisplay();
});

// 섹션 표시 함수
function showSection(sectionName) {
    // 모든 섹션 숨기기
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // 모든 네비게이션 버튼 비활성화
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 선택한 섹션 표시
    document.getElementById(sectionName).classList.add('active');
    event.target.classList.add('active');
    
    // 신청 내역 섹션일 경우 다시 로드
    if (sectionName === 'applications') {
        loadApplications();
    }
}

// 대시보드 로드
function loadDashboard() {
    const applications = JSON.parse(localStorage.getItem('applicationData') || '{}');
    const appArray = Object.values(applications);
    
    // 총 신청 건수
    document.getElementById('totalApps').textContent = appArray.length;
    
    // 오늘 신청 건수
    const today = new Date().toDateString();
    const todayApps = appArray.filter(app => {
        const appDate = new Date(app.submittedAt).toDateString();
        return appDate === today;
    });
    document.getElementById('todayApps').textContent = todayApps.length;
    
    // 처리 대기 (모든 신청이 대기 상태로 가정)
    document.getElementById('pendingApps').textContent = appArray.length;
}

// 신청 내역 로드
function loadApplications() {
    const applications = JSON.parse(localStorage.getItem('applicationData') || '{}');
    const applicationsList = document.getElementById('applicationsList');
    
    if (Object.keys(applications).length === 0) {
        applicationsList.innerHTML = `
            <div class="empty-state">
                <h3>📭 신청 내역이 없습니다</h3>
                <p>고객이 신청서를 제출하면 여기에 표시됩니다.</p>
            </div>
        `;
        return;
    }
    
    // 신청 내역을 최신순으로 정렬
    const sortedApps = Object.values(applications).sort((a, b) => 
        new Date(b.submittedAt) - new Date(a.submittedAt)
    );
    
    applicationsList.innerHTML = sortedApps.map(app => `
        <div class="application-card" data-app-number="${app.applicationNumber}">
            <div class="card-header">
                <span class="application-number">${app.applicationNumber}</span>
                <span class="application-date">${app.submittedAt}</span>
            </div>
            <div class="card-content">
                <div class="info-row">
                    <span class="info-label">공사요청:</span>
                    <span class="info-value">${app.name}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">연락처:</span>
                    <span class="info-value">${app.phone}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">통신사:</span>
                    <span class="info-value">${app.workTypeDisplay}</span>
                </div>
                ${app.startDate ? `
                <div class="info-row">
                    <span class="info-label">희망시작일:</span>
                    <span class="info-value">${new Date(app.startDate).toLocaleDateString('ko-KR')}</span>
                </div>
                ` : ''}
                ${app.description ? `
                <div class="info-row">
                    <span class="info-label">요청사항:</span>
                    <span class="info-value">${app.description}</span>
                </div>
                ` : ''}
            </div>
            <div class="card-actions">
                <button class="action-btn email-btn" onclick="shareApplication('${app.applicationNumber}', 'email')">
                    📧 메일로 공유
                </button>
                <button class="action-btn sms-btn" onclick="shareApplication('${app.applicationNumber}', 'sms')">
                    📱 문자로 공유
                </button>
                <button class="action-btn kakao-btn" onclick="shareApplication('${app.applicationNumber}', 'kakao')">
                    💬 카카오톡
                </button>
            </div>
        </div>
    `).join('');
}

// 빈 설문지 공유
function shareEmptyForm(type) {
    const baseUrl = window.location.origin + window.location.pathname.replace('관리자.html', 'index.html');
    const customerUrl = baseUrl + '?customer=true';
    
    if (type === 'email') {
        showEmailModal(customerUrl, '빈 설문지');
    } else if (type === 'sms') {
        showSMSModal(customerUrl, '빈 설문지');
    } else if (type === 'kakao') {
        shareToKakao(customerUrl, '빈 설문지');
    }
}

// 신청서 공유
function shareApplication(appNumber, type) {
    const applications = JSON.parse(localStorage.getItem('applicationData') || '{}');
    const app = applications[appNumber];
    
    if (!app) {
        alert('신청서를 찾을 수 없습니다.');
        return;
    }
    
    if (type === 'email') {
        showEmailModal('', '신청서', app);
    } else if (type === 'sms') {
        showSMSModal('', '신청서', app);
    } else if (type === 'kakao') {
        shareApplicationToKakao(app);
    }
}

// 이메일 모달 표시
function showEmailModal(url, contentType, appData = null) {
    const emailModal = document.getElementById('emailModal');
    const emailSubject = document.getElementById('emailSubject');
    const emailMessage = document.getElementById('emailMessage');
    
    if (contentType === '빈 설문지') {
        emailSubject.value = '구포현대아파트 통신 환경 개선 신청서 작성 요청';
        emailMessage.value = `안녕하세요,

구포현대아파트 통신 환경 개선을 위한 신청서 작성을 요청드립니다.

아래 링크를 클릭하여 신청서를 작성해주세요:
${url}

모바일에서도 편리하게 작성하실 수 있습니다.

감사합니다.`;
    } else {
        emailSubject.value = `[신청완료] 구포현대아파트 통신 환경 개선 - ${appData.applicationNumber}`;
        emailMessage.value = `신청서가 접수되었습니다.

📋 신청 정보:
• 신청번호: ${appData.applicationNumber}
• 공사요청: ${appData.name}
• 연락처: ${appData.phone}
• 현재 통신사: ${appData.workTypeDisplay}
${appData.startDate ? `• 공사 희망일: ${new Date(appData.startDate).toLocaleDateString('ko-KR')}\n` : ''}${appData.description ? `• 요청사항: ${appData.description}\n` : ''}• 신청일시: ${appData.submittedAt}

담당자가 빠른 시일 내에 연락드리겠습니다.

감사합니다.`;
    }
    
    emailModal.style.display = 'flex';
    document.getElementById('recipientEmail').focus();
}

// 문자 모달 표시
function showSMSModal(url, contentType, appData = null) {
    const smsModal = document.getElementById('smsModal');
    const smsMessage = document.getElementById('smsMessage');
    
    if (contentType === '빈 설문지') {
        smsMessage.value = `[구포현대아파트 통신환경개선]

신청서 작성을 요청드립니다.

아래 링크에서 작성해주세요:
${url}

감사합니다.`;
    } else {
        smsMessage.value = `[구포현대아파트 통신환경개선]

신청이 완료되었습니다.

📋 신청정보
• 신청번호: ${appData.applicationNumber}
• 공사요청: ${appData.name}
• 연락처: ${appData.phone}
• 통신사: ${appData.workTypeDisplay}
${appData.startDate ? `• 공사 희망일: ${new Date(appData.startDate).toLocaleDateString('ko-KR')}\n` : ''}${appData.description ? `• 요청사항: ${appData.description}\n` : ''}
담당자가 빠른 시일 내에 연락드리겠습니다.`;
    }
    
    smsModal.style.display = 'flex';
    document.getElementById('recipientPhone').focus();
}

// 카카오톡 공유 (빈 설문지)
function shareToKakao(url, contentType) {
    Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
            title: '🏢 구포현대아파트 통신 환경 개선 신청서',
            description: '통신 환경 개선을 위한 신청서를 작성해주세요. 모바일에서도 편리하게 이용 가능합니다.',
            imageUrl: 'https://via.placeholder.com/400x300/4CAF50/FFFFFF?text=%F0%9F%93%A1+%ED%86%B5%EC%8B%A0+%EA%B0%9C%EC%84%A0',
            link: {
                mobileWebUrl: url,
                webUrl: url
            }
        },
        buttons: [
            {
                title: '신청서 작성하기',
                link: {
                    mobileWebUrl: url,
                    webUrl: url
                }
            }
        ],
        fail: function(error) {
            console.log(error);
            alert('카카오톡 공유 중 오류가 발생했습니다.');
        }
    });
}

// 카카오톡 공유 (신청서 결과)
function shareApplicationToKakao(appData) {
    const shareText = `🏢 구포현대아파트 통신 환경 개선 신청 완료

📋 신청번호: ${appData.applicationNumber}
👤 신청자: ${appData.name}
📞 연락처: ${appData.phone}
🌐 통신사: ${appData.workTypeDisplay}
📅 신청일시: ${appData.submittedAt}

담당자가 빠른 시일 내에 연락드리겠습니다.`;
    
    Kakao.Share.sendDefault({
        objectType: 'text',
        text: shareText,
        link: {
            mobileWebUrl: window.location.href,
            webUrl: window.location.href
        },
        fail: function(error) {
            console.log(error);
            alert('카카오톡 공유 중 오류가 발생했습니다.');
        }
    });
}

// 알림 전송
function sendNotification(type) {
    if (type === 'email') {
        const recipientEmail = document.getElementById('recipientEmail').value;
        const emailSubject = document.getElementById('emailSubject').value;
        const emailMessage = document.getElementById('emailMessage').value;
        
        if (!recipientEmail || !emailSubject.trim()) {
            alert('필수 항목을 입력해주세요.');
            return;
        }
        
        const mailtoUrl = `mailto:${recipientEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailMessage)}`;
        window.location.href = mailtoUrl;
        
        alert('메일 클라이언트가 열렸습니다. 메일을 확인하고 전송해주세요.');
        closeModal('emailModal');
        
    } else if (type === 'sms') {
        const recipientPhone = document.getElementById('recipientPhone').value;
        const smsMessage = document.getElementById('smsMessage').value;
        
        if (!recipientPhone || !smsMessage.trim()) {
            alert('필수 항목을 입력해주세요.');
            return;
        }
        
        const phoneRegex = /^01[0-9]-?\d{3,4}-?\d{4}$/;
        if (!phoneRegex.test(recipientPhone.replace(/-/g, ''))) {
            alert('올바른 휴대폰번호 형식을 입력해주세요.');
            return;
        }
        
        const smsUrl = `sms:${recipientPhone}?body=${encodeURIComponent(smsMessage)}`;
        window.location.href = smsUrl;
        
        alert('문자 메시지 앱이 열렸습니다. 메시지를 확인하고 전송해주세요.');
        closeModal('smsModal');
    }
}

// QR 코드 생성
function generateQRCode() {
    const baseUrl = window.location.origin + window.location.pathname.replace('관리자.html', 'index.html');
    // 고객용 URL에 관리자 설정값(제목/부제목/전화/메일)을 포함하여 다른 기기에서도 동기화되도록 처리
    const urlObj = new URL(baseUrl);
    urlObj.searchParams.set('customer', 'true');
    try {
        const phones = JSON.parse(localStorage.getItem('savedPhoneNumbers') || '[]');
        const emails = JSON.parse(localStorage.getItem('savedEmailAddresses') || '[]');
        const title = localStorage.getItem('mainTitle') || '';
        const subtitle = localStorage.getItem('mainSubtitle') || '';
        if (phones && phones.length > 0) {
            urlObj.searchParams.set('phones', phones.join(','));
        }
        if (emails && emails.length > 0) {
            urlObj.searchParams.set('emails', emails.join(','));
        }
        if (title) {
            urlObj.searchParams.set('title', title);
        }
        if (subtitle) {
            urlObj.searchParams.set('subtitle', subtitle);
        }
    } catch (e) {
        console.warn('QR URL 파라미터 구성 실패:', e);
    }
    const customerUrl = urlObj.toString();
    
    // 새 창에서 QR 코드 생성 페이지 열기
    const qrWindow = window.open('', '_blank', 'width=400,height=500');
    qrWindow.document.write(`
        <!DOCTYPE html>
        <html lang="ko">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>QR 코드 생성</title>
            <style>
                body { font-family: 'Malgun Gothic', sans-serif; text-align: center; padding: 20px; }
                .qr-container { margin: 20px 0; }
                button { margin: 10px; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
                .download-btn { background: #4CAF50; color: white; }
                .close-btn { background: #f44336; color: white; }
            </style>
        </head>
        <body>
            <h2>📱 QR 코드</h2>
            <p>고객이 스캔할 수 있는 QR 코드입니다</p>
            <div class="qr-container" id="qrcode"></div>
            <div>
                <button class="download-btn" onclick="downloadQR('png')">PNG 다운로드</button>
                <button class="download-btn" onclick="downloadQR('jpg')">JPG 다운로드</button>
                <button class="close-btn" onclick="window.close()">닫기</button>
            </div>
            <script src="https://unpkg.com/qrcode/build/qrcode.min.js"></script>
            <script>
                let currentQRDataURL = null;
                
                // QR 코드 생성
                QRCode.toDataURL('${customerUrl}', {
                    width: 256,
                    height: 256,
                    margin: 2
                }, function (error, url) {
                    if (error) {
                        document.getElementById('qrcode').innerHTML = '<p>QR 코드 생성 실패</p>';
                        return;
                    }
                    
                    const img = document.createElement('img');
                    img.src = url;
                    img.style.maxWidth = '100%';
                    document.getElementById('qrcode').appendChild(img);
                    currentQRDataURL = url;
                });
                
                function downloadQR(format) {
                    if (!currentQRDataURL) {
                        alert('QR 코드를 먼저 생성해주세요.');
                        return;
                    }
                    
                    const link = document.createElement('a');
                    link.download = 'gupo-apartment-qr.' + format;
                    link.href = currentQRDataURL;
                    link.click();
                }
            </script>
        </body>
        </html>
    `);
}

// 모달 닫기
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 모달 외부 클릭 시 닫기
    window.addEventListener('click', function(event) {
        const emailModal = document.getElementById('emailModal');
        const smsModal = document.getElementById('smsModal');
        
        if (event.target === emailModal) {
            closeModal('emailModal');
        }
        if (event.target === smsModal) {
            closeModal('smsModal');
        }
    });
    
    // 5초마다 대시보드 자동 새로고침
    setInterval(loadDashboard, 5000);
}

// 관리자 번호 표시 업데이트
function updateAdminPhoneDisplay() {
    const adminPhone = localStorage.getItem('adminPhoneNumber');
    const currentAdminPhoneElement = document.getElementById('currentAdminPhone');
    if (currentAdminPhoneElement) {
        currentAdminPhoneElement.textContent = adminPhone || '설정되지 않음';
        currentAdminPhoneElement.style.color = adminPhone ? '#4CAF50' : '#f44336';
    }
}

// 관리자 번호 변경 (관리자 페이지용)
function changeAdminPhoneNumber() {
    const currentPhone = localStorage.getItem('adminPhoneNumber');
    const newPhone = prompt(`현재 관리자 번호: ${currentPhone || '설정되지 않음'}

새로운 관리자 휴대폰번호를 입력해주세요:
(고객이 신청서를 제출하면 자동으로 문자 알림을 받습니다)`, currentPhone);
    
    if (newPhone) {
        const phoneRegex = /^01[0-9]-?\d{3,4}-?\d{4}$/;
        if (phoneRegex.test(newPhone.replace(/-/g, ''))) {
            localStorage.setItem('adminPhoneNumber', newPhone);
            updateAdminPhoneDisplay();
            alert(`✅ 관리자 번호가 설정되었습니다: ${newPhone}

앞으로 새로운 신청이 접수되면 자동으로 문자 알림을 받습니다.`);
            return newPhone;
        } else {
            alert('올바른 휴대폰번호 형식을 입력해주세요. (예: 010-1234-5678)');
            return changeAdminPhoneNumber();
        }
    }
}

// 알림 테스트
function testNotification() {
    const adminPhone = localStorage.getItem('adminPhoneNumber');
    
    if (!adminPhone) {
        alert('먼저 관리자 휴대폰번호를 설정해주세요.');
        return;
    }
    
    const testMessage = `[구포현대아파트 통신환경개선] 📨 알림 테스트

이것은 자동 알림 기능의 테스트 메시지입니다.
새로운 신청이 접수되면 이와 같은 형식으로 알림을 받게 됩니다.

관리자 페이지: ${window.location.href}

테스트 완료! 🎉`;
    
    const smsUrl = `sms:${adminPhone}?body=${encodeURIComponent(testMessage)}`;
    
    try {
        window.open(smsUrl, '_blank');
        alert('✅ 테스트 문자가 준비되었습니다!\n문자 앱에서 전송 버튼을 누르세요.');
    } catch (error) {
        console.error('테스트 알림 발송 실패:', error);
        alert('❌ 테스트 알림 발송에 실패했습니다.');
    }
}

// 데이터 내보내기
function exportData() {
    const applications = JSON.parse(localStorage.getItem('applicationData') || '{}');
    
    if (Object.keys(applications).length === 0) {
        alert('내보낼 데이터가 없습니다.');
        return;
    }
    
    // CSV 형식으로 데이터 변환
    const csvHeader = '신청번호,공사요청,연락처,통신사,희망시작일,요청사항,신청일시\n';
    const csvContent = Object.values(applications).map(app => {
        return `"${app.applicationNumber}","${app.name}","${app.phone}","${app.workTypeDisplay}","${app.startDate || ''}","${app.description || ''}","${app.submittedAt}"`;
    }).join('\n');
    
    const csvData = csvHeader + csvContent;
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `구포현대아파트_신청내역_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert('✅ 신청 데이터가 CSV 파일로 다운로드되었습니다.');
    } else {
        alert('❌ 파일 다운로드를 지원하지 않는 브라우저입니다.');
    }
}

// 모든 데이터 삭제
function clearAllData() {
    const applications = JSON.parse(localStorage.getItem('applicationData') || '{}');
    const appCount = Object.keys(applications).length;
    
    if (appCount === 0) {
        alert('삭제할 데이터가 없습니다.');
        return;
    }
    
    if (confirm(`⚠️ 정말로 모든 신청 데이터(${appCount}건)를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다!`)) {
        if (confirm('❌ 마지막 확인: 정말 삭제하시겠습니까?')) {
            localStorage.removeItem('applicationData');
            loadDashboard();
            loadApplications();
            alert(`✅ 총 ${appCount}건의 신청 데이터가 삭제되었습니다.`);
        }
    }
}