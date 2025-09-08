import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
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

    // 1. 신청서 정보 가져오기
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('*')
      .eq('id', application_id)
      .single()

    if (appError || !application) {
      throw new Error(`신청서 조회 실패: ${appError?.message}`)
    }

    // 2. 관리자 이메일 주소 가져오기
    const { data: adminSettings, error: adminError } = await supabase
      .from('admin_settings')
      .select('emails')
      .eq('apartment_id', 'gupo-apartment')
      .single()

    if (adminError || !adminSettings?.emails || adminSettings.emails.length === 0) {
      throw new Error('관리자 이메일 설정을 찾을 수 없습니다.')
    }

    // 3. SendGrid API 키 확인
    const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY')
    if (!sendgridApiKey) {
      throw new Error('SENDGRID_API_KEY 환경변수가 설정되지 않았습니다.')
    }

    // 4. 이메일 발송
    let successCount = 0
    const emailResults = []

    for (const adminEmail of adminSettings.emails) {
      try {
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
              type: 'text/plain',
              value: `
[구포현대아파트] 새로운 통신환경개선 신청서

■ 신청번호: ${application.application_number}
■ 신청자: ${application.name}
■ 연락처: ${application.phone}
■ 동/호수: ${application.address}
■ 현재 통신사: ${application.work_type_display}
■ 희망일: ${application.start_date || '미지정'}
■ 상세내용: ${application.description || '없음'}
■ 접수일시: ${new Date(application.submitted_at).toLocaleString('ko-KR')}

관리자님께서 확인하시고 적절한 조치를 취해주시기 바랍니다.
              `
            }]
          })
        })

        if (emailResponse.ok) {
          console.log(`${adminEmail}로 이메일 발송 성공`)
          successCount++
          emailResults.push({ email: adminEmail, status: 'sent', error: null })
        } else {
          const responseText = await emailResponse.text()
          throw new Error(`SendGrid API 오류: ${responseText}`)
        }

      } catch (error) {
        console.error(`${adminEmail}로 이메일 발송 실패:`, error)
        emailResults.push({ email: adminEmail, status: 'failed', error: error.message })
      }
    }

    return new Response(
      JSON.stringify({
        success: successCount > 0,
        sent: successCount,
        total: adminSettings.emails.length,
        results: emailResults
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
