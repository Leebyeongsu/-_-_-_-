import { serve } from "https://deno.land/std@0.224.0/http/server.ts"

const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY")
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "noreply@example.com"

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 })
    }

    const { to, subject, html, text }: { to?: string; subject?: string; html?: string; text?: string } = await req.json()

    if (!to || !subject || !html) {
      return new Response("Invalid payload", { status: 400 })
    }

    if (!SENDGRID_API_KEY) {
      return new Response("Missing SENDGRID_API_KEY", { status: 500 })
    }

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
          { type: "text/plain", value: (text && text.trim()) ? text : stripTags(html) },
          { type: "text/html", value: html }
        ]
      })
    })

    if (!res.ok) {
      const err = await res.text()
      return new Response(err, { status: 502 })
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } })
  } catch (e) {
    return new Response(e?.message || "Internal Error", { status: 500 })
  }
})


