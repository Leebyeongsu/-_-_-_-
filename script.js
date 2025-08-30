// Supabase 연동 추가
import { supabase } from './supabase-config.js';
import { saveAdminSettings, getAdminSettings, saveApplication, subscribeToApplications } from './supabase-api.js';
import { sendApplicationNotification, sendFallbackNotification } from './notification-service.js';

// 아파트 ID 설정 (고유 식별자)
const APARTMENT_ID = 'gupo-apartment';

// 카카오 SDK 초기화 (실제 앱키로 변경 필요)
Kakao.init('YOUR_KAKAO_APP_KEY'); // 실제 카카오 개발자센터에서 발급받은 JavaScript 키로 변경하세요

let formData = {};
let currentQRDataURL = null;
let adminSettings = null; // 관리자 설정 캐시

// 관리자 설정 저장 (Supabase 연동)
async function saveAdminSettingsToCloud() {
    try {
        const settings = {
            title: localStorage.getItem('mainTitle') || '',
            subtitle: localStorage.getItem('mainSubtitle') || '',
            phones: JSON.parse(localStorage.getItem('savedPhoneNumbers') || '[]'),
            emails: JSON.parse(localStorage.getItem('savedEmailAddresses') || '[]')
        };

        const result = await saveAdminSettings(APARTMENT_ID, settings);
        
        if (result.success) {
            console.log('관리자 설정이 클라우드에 저장되었습니다.');
            adminSettings = result.data;
        } else {
            console.error('관리자 설정 저장 실패:', result.error);
        }
    } catch (error) {
        console.error('관리자 설정 저장 중 오류:', error);
    }
}

// 관리자 설정 로드 (Supabase 연동)
async function loadAdminSettingsFromCloud() {
    try {
        const result = await getAdminSettings(APARTMENT_ID);
        
        if (result.success && result.data) {
            adminSettings = result.data;
            
            // 로컬 저장소에 동기화
            if (adminSettings.title) localStorage.setItem('mainTitle', adminSettings.title);
            if (adminSettings.subtitle) localStorage.setItem('mainSubtitle', adminSettings.subtitle);
            if (adminSettings.phones) localStorage.setItem('savedPhoneNumbers', JSON.stringify(adminSettings.phones));
            if (adminSettings.emails) localStorage.setItem('savedEmailAddresses', JSON.stringify(adminSettings.emails));
            
            console.log('클라우드에서 관리자 설정을 로드했습니다.');
            
            // 화면 업데이트
            loadSavedTitles();
            displaySavedInputs();
        }
    } catch (error) {
        console.error('관리자 설정 로드 중 오류:', error);
    }
}

// 고객용 신청서 제출 처리 (Supabase 연동)
async function processCustomerFormSubmission(event) {
    event.preventDefault();
    const formDataObj = new FormData(event.target);
    const applicationData = {};
    
    // 폼 데이터 수집
    for (let [key, value] of formDataObj.entries()) {
        applicationData[key] = value;
    }
    
    // 추가 정보 설정
    applicationData.submittedAt = new Date().toISOString();
    
    try {
        // 1. Supabase에 신청서 저장
        const saveResult = await saveApplication(applicationData);
        
        if (!saveResult.success) {
            throw new Error('신청서 저장 실패: ' + saveResult.error);
        }
        
        // 2. 관리자 설정 로드 (클라우드에서)
        await loadAdminSettingsFromCloud();
        
        // 3. 관리자에게 알림 발송
        if (adminSettings) {
            const notificationResults = await sendApplicationNotification(applicationData, adminSettings);
            console.log('알림 발송 결과:', notificationResults);
        } else {
            // 폴백: 브라우저 기본 앱 사용
            const fallbackMessage = `🔔 새 신청서 접수\n\n신청자: ${applicationData.name}\n연락처: ${applicationData.phone}`;
            sendFallbackNotification('sms', '010-0000-0000', fallbackMessage);
        }
        
        // 성공 메시지 표시
        alert('✅ 신청서가 성공적으로 제출되었습니다!\n\n관리자에게 알림이 발송되었습니다.');
        
        // 폼 초기화
        event.target.reset();
        
        // 결과 페이지로 이동
        showResult();
        
    } catch (error) {
        console.error('신청서 처리 실패:', error);
        alert('❌ 신청서 제출 중 오류가 발생했습니다.\n\n' + error.message);
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

// 부제목 편집 모드로 전환
function editSubtitle() {
    const subtitleElement = document.getElementById('mainSubtitle');
    const currentSubtitle = subtitleElement.textContent;
    
    subtitleElement.innerHTML = `
        <input type="text" id="subtitleInput" value="${currentSubtitle}" style="width: 100%; padding: 8px; border: 2px solid #4CAF50; border-radius: 4px; font-size: 16px;">
    `;
    
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
    
    // Supabase에 저장
    saveAdminSettingsToCloud();
    
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
    
    // 현재 관리자 설정 가져오기
    const title = localStorage.getItem('mainTitle') || '구포현대아파트 통신 환경 개선 신청서';
    const subtitle = localStorage.getItem('mainSubtitle') || '통신 환경 개선을 위한 신청서를 작성해주세요';
    const phones = JSON.parse(localStorage.getItem('savedPhoneNumbers') || '[]');
    const emails = JSON.parse(localStorage.getItem('savedEmailAddresses') || '[]');
    
    console.log('관리자 설정:', { title, subtitle, phones, emails });
    
    // 고객용 URL 생성 (관리자 설정 포함)
    const currentUrl = window.location.origin + window.location.pathname;
    const customerUrl = `${currentUrl}?customer=true&title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(subtitle)}&phones=${encodeURIComponent(phones.join(','))}&emails=${encodeURIComponent(emails.join(','))}`;
    
    console.log('생성할 URL:', customerUrl);
    
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

// 기타 필요한 함수들
function showResult() {
    // 결과 페이지 표시 로직
    console.log('결과 페이지 표시');
}

// DOM 로드 완료 후 실행
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
window.editSubtitle = editSubtitle;
window.saveTitle = saveTitle;
window.cancelTitleEdit = cancelTitleEdit;
window.saveSubtitle = saveSubtitle;
window.cancelSubtitleEdit = cancelSubtitleEdit;
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
