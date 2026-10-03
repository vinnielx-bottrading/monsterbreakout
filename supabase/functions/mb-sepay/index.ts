// Monster Breakout — webhook SePay: nhận biến động số dư → tìm mã đơn "MBxxxxxx" trong nội dung chuyển khoản → mở khoá gói.
// Triển khai: supabase functions deploy mb-sepay --no-verify-jwt
// Biến môi trường (Supabase → Edge Functions → Secrets): SEPAY_API_KEY = khoá API bạn đặt khi tạo webhook trong SePay
// Trong SePay: tạo webhook trỏ tới https://<project>.supabase.co/functions/v1/mb-sepay, kiểu chứng thực "API Key".
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('ok');
  const key = Deno.env.get('SEPAY_API_KEY') || '';
  const auth = req.headers.get('authorization') || '';
  if (!key || auth.replace(/^Apikey\s+/i, '').trim() !== key) return new Response(JSON.stringify({ success: false }), { status: 401 });

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ success: false }), { status: 400 }); }
  if (body.transferType !== 'in') return Response.json({ success: true });           // chỉ xử lý tiền vào
  const text = `${body.code || ''} ${body.content || ''} ${body.description || ''}`.toUpperCase();
  const m = text.match(/MB[A-Z0-9]{6}/);
  if (!m) return Response.json({ success: true });                                     // chuyển khoản thường / donate

  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data, error } = await sb.rpc('mb_apply_order', { p_code: m[0], p_amount: Number(body.transferAmount) || 0, p_ref: String(body.referenceCode || body.id || '') });
  if (error) { console.error(error); return Response.json({ success: false }, { status: 500 }); }
  return Response.json({ success: true, applied: data });
});
