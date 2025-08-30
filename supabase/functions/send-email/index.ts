import { serve } from "https://deno.land/std@0.224.0/http/server.ts"

const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY")!
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "noreply@example.com"

serve(async (req) => {
  try {
    if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 })

    const { to, subject, text }: { to?: string; subject?: string; text?: string } = await req.json()
    if (!to || !subject || !text) return new Response("Invalid payload", { status: 400 })

    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: FROM_EMAIL },
        subject,
        content: [
          { type: "text/plain", value: text }
        ]
      })
    })

    if (!res.ok) return new Response(await res.text(), { status: 502 })
    return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } })
  } catch (e) {
    return new Response(e?.message || "Internal Error", { status: 500 })
  }
})


