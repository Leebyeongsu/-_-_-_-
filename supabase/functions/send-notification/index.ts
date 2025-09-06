import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS preflight 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { application_id } = await req.json()

    if (!application_id) {
      throw new Error('application_id가 필요합니다.')
    }

    // Supabase 클라이언트 생성 (서버용 키 사용)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('신청서 정보 조회 중:', application_id)

    // 1. 신청서 정보 가져오기
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('*')
      .eq('id', application_id)
      .single()

    if (appError || !application) {
      throw new Error(`신청서 조회 실패: ${appError?.message}`)
    }

    console.log('신청서 정보:', application)

    // 2. 관리자 이메일 주소 가져오기
    const { data: adminSettings, error: adminError } = await supabase
      .from('admin_settings')
      .select('emails')
      .eq('apartment_id', 'gupo-apartment')
      .single()

    if (adminError || !adminSettings?.emails || adminSettings.emails.length === 0) {
      console.warn('관리자 이메일 설정 없음:', adminError?.message)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '관리자 이메일 설정이 없습니다.' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    console.log('관리자 이메일:', adminSettings.emails)

    // 3. SendGrid API 키 확인
    const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY')
    if (!sendgridApiKey) {
      throw new Error('SENDGRID_API_KEY 환경변수가 설정되지 않았습니다.')
    }

    // 4. 이메일 템플릿 생성
    const submittedDate = new Date(application.submitted_at)
    const formattedDate = submittedDate.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'long'
    })

    const emailContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Malgun Gothic', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
        .info-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .info-table td { padding: 10px; border-bottom: 1px solid #eee; }
        .info-table .label { background: #f5f5f5; font-weight: bold; width: 120px; }
        .footer { background: #333; color: white; padding: 15px; border-radius: 0 0 8px 8px; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>📡 구포현대아파트 통신환경개선 신청서</h2>
            <p>새로운 신청서가 접수되었습니다.</p>
        </div>
        
        <div class="content">
            <table class="info-table">
                <tr>
                    <td class="label">신청번호</td>
                    <td><strong>${application.application_number}</strong></td>
                </tr>
                <tr>
                    <td class="label">신청자</td>
                    <td>${application.name}</td>
                </tr>
                <tr>
                    <td class="label">연락처</td>
                    <td>${application.phone}</td>
                </tr>
                <tr>
                    <td class="label">동/호수</td>
                    <td>${application.address}</td>
                </tr>
                <tr>
                    <td class="label">현재 통신사</td>
                    <td>${application.work_type_display}</td>
                </tr>
                <tr>
                    <td class="label">희망 공사일</td>
                    <td>${application.start_date || '미지정'}</td>
                </tr>
                <tr>
                    <td class="label">상세 요청사항</td>
                    <td>${application.description || '특별한 요청사항 없음'}</td>
                </tr>
                <tr>
                    <td class="label">접수일시</td>
                    <td>${formattedDate}</td>
                </tr>
            </table>
            
            <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin-top: 20px;">
                <p><strong>💡 처리 안내</strong></p>
                <p>관리자님께서 신청 내용을 검토하시고 고객에게 연락드려 주시기 바랍니다.</p>
            </div>
        </div>
        
        <div class="footer">
            <p>이 메일은 구포현대아파트 통신환경개선 시스템에서 자동으로 발송된 메일입니다.</p>
            <p>문의사항이 있으시면 시스템 관리자에게 연락주세요.</p>
        </div>
    </div>
</body>
</html>
    `

    // 5. 각 관리자 이메일로 발송
    let successCount = 0
    const emailResults = []

    for (const adminEmail of adminSettings.emails) {
      try {
        console.log(`${adminEmail}로 이메일 발송 시도...`)

        const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sendgridApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            personalizations: [{
              to: [{ email: adminEmail }],
              subject: `[구포현대아파트] 새 통신환경개선 신청서 - ${application.application_number}`
            }],
            from: { 
              email: 'noreply@gupo-apartment.com',
              name: '구포현대아파트 시스템'
            },
            content: [{
              type: 'text/html',
              value: emailContent
            }]
          })
        })

        const responseText = await emailResponse.text()
        console.log(`SendGrid 응답 (${adminEmail}):`, emailResponse.status, responseText)

        if (emailResponse.ok) {
          console.log(`${adminEmail}로 이메일 발송 성공`)
          successCount++
          emailResults.push({ email: adminEmail, status: 'sent', error: null })

          // 알림 로그 업데이트 (성공)
          await supabase
            .from('notification_logs')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('application_id', application_id)
            .eq('recipient', adminEmail)
            .eq('notification_type', 'email')

        } else {
          throw new Error(`SendGrid 오류: ${emailResponse.status} ${responseText}`)
        }

      } catch (error) {
        console.error(`${adminEmail}로 이메일 발송 실패:`, error.message)
        emailResults.push({ email: adminEmail, status: 'failed', error: error.message })

        // 알림 로그 업데이트 (실패)
        await supabase
          .from('notification_logs')
          .update({ status: 'failed' })
          .eq('application_id', application_id)
          .eq('recipient', adminEmail)
          .eq('notification_type', 'email')
      }

      // 다음 이메일 발송 전 잠시 대기 (스팸 방지)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log(`총 ${successCount}/${adminSettings.emails.length}개 이메일 발송 완료`)

    return new Response(
      JSON.stringify({ 
        success: successCount > 0,
        total: adminSettings.emails.length,
        sent: successCount,
        failed: adminSettings.emails.length - successCount,
        details: emailResults
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Edge Function 오류:', error.message)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})