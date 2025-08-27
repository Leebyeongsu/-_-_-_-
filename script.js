// 카카오 SDK 초기화 (실제 앱키로 변경 필요)
Kakao.init('YOUR_KAKAO_APP_KEY'); // 실제 카카오 개발자센터에서 발급받은 JavaScript 키로 변경하세요

let formData = {};
let currentQRDataURL = null;

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('applicationForm');
    const workTypeSelect = document.getElementById('workType');
    const otherWorkTypeDiv = document.getElementById('otherWorkType');
    
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
        
        // 실제 서버 제출 시뮬레이션
        setTimeout(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            
            showResult();
        }, 1500);
    });
});

function showResult() {
    const form = document.getElementById('applicationForm');
    const resultSection = document.getElementById('result');
    const resultContent = document.getElementById('resultContent');
    
    // 결과 내용 생성
    const resultHTML = `
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
    
    resultContent.innerHTML = resultHTML;
    
    // 폼 숨기고 결과 표시
    form.style.display = 'none';
    resultSection.style.display = 'block';
    
    // 스크롤을 맨 위로
    window.scrollTo(0, 0);
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
    const currentUrl = window.location.href;
    const qrSection = document.getElementById('qrSection');
    const qrcodeDiv = document.getElementById('qrcode');
    
    console.log('QR 코드 생성 시작:', currentUrl);
    
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
                // QRCode.toDataURL 방식으로 직접 시도
                QRCode.toDataURL(currentUrl, {
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
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(currentUrl)}`;
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

// 페이지 로드시 카카오 SDK 로그인 상태 확인
document.addEventListener('DOMContentLoaded', function() {
    if (typeof Kakao !== 'undefined' && Kakao.isInitialized()) {
        console.log('카카오 SDK 초기화 완료');
    } else {
        console.warn('카카오 SDK 초기화 실패 - 앱키를 확인해주세요');
    }
});