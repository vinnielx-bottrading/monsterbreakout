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
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const amount = Number(body.transferAmount) || 0, ref = String(body.referenceCode || body.id || '');

  // ủng hộ (tiếp tế): nội dung có mã MBTT + 6 ký tự đầu user id → huy hiệu "Người tiếp tế"
  const flat = text.replace(/\s+/g, '');
  const d = flat.match(/MBTT[0-9A-F]{6}/) || (flat.includes('MBUNGHO') ? ['MBTTZZZZZZ'] : null);   // MBUNGHO = khách chưa đăng nhập → ủng hộ ẩn danh
  if (d) {
    const { error } = await sb.rpc('mb_support_by_code', { p_code: d[0], p_amount: amount, p_ref: 'SP-' + ref, p_note: String(body.content || '').slice(0, 200) });
    if (error) { console.error(error); return Response.json({ success: false }, { status: 500 }); }
    return Response.json({ success: true, support: true });
  }
  // mua gói: mã đơn MBxxxxxx (mã đơn chỉ gồm 0-9A-F nên không trùng MBTT)
  const m = text.match(/MB[0-9A-F]{6}/);
  if (!m) return Response.json({ success: true });                                     // chuyển khoản không liên quan

  const { data, error } = await sb.rpc('mb_apply_order', { p_code: m[0], p_amount: amount, p_ref: ref });
  if (error) { console.error(error); return Response.json({ success: false }, { status: 500 }); }
  return Response.json({ success: true, applied: data });
});
