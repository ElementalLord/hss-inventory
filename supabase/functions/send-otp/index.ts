import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const { email, otp, name } = await req.json();
  
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
    },
    body: JSON.stringify({
      from: "HSS Bhandar <noreply@yourdomain.com>",
      to: email,
      subject: "Your HSS Bhandar Login Code",
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 40px 20px;">
          <h2 style="color: #1A3A2A;">HSS Bhandar</h2>
          <p>Hi ${name || "there"},</p>
          <p>Your one-time login code is:</p>
          <div style="background: #FFF3EB; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
            <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #E8702A;">${otp}</span>
          </div>
          <p style="color: #6B6460; font-size: 13px;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
        </div>
      `,
    }),
  });

  const data = await res.json();
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
});