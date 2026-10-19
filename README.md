# Monster Breakout

Game bắn súng sinh tồn góc nhìn từ trên xuống. Người chơi điều khiển đặc nhiệm **Hunter** vượt qua 10 cửa ải (Gate) bị virus chiếm đóng. Game viết bằng HTML5 Canvas và JavaScript thuần, không cần bước build, chơi được trên máy tính, điện thoại và tay cầm. Có thể cài lên màn hình chính như một app (PWA).

| Hạng mục | Giá trị |
|---|---|
| Phiên bản | **v8.5.0** (bản dựng lại từ `monster_breakout_gate01_v3.html`) |
| Gate chơi được | **Màn 1: Gate 01–10** · **Màn 2 "Nguồn Gốc": Gate 11–12** (13–21 sắp ra mắt). Tất cả chơi được ở 2D và 3D |
| Nền tảng | Máy tính (Chrome, Edge, Firefox, Safari), điện thoại (cảm ứng), tay cầm |
| Triển khai | GitHub + Vercel (trang tĩnh) |
| Lưu tiến trình | `localStorage`, khoá `monster_breakout_save_v1`; đăng nhập Google thì đồng bộ lên Supabase (mục 2b) |
| Đồ hoạ | 2D Canvas; 3D bằng Three.js r170 (tự chứa trong repo, không cần CDN) |
| Chế độ hiện tại | **CHƠI TỰ DO** — mở cả 21 cửa, không cần đăng nhập, không dùng Supabase (mục 0) |
| README cập nhật | 2026-10-19 (rev 40) |

---

## 0. Chế độ CHƠI TỰ DO (v8.5.0 — đang bật)

Tạm thời chưa có máy chủ Supabase, nên game chạy hoàn toàn trên máy người chơi:

- **Mọi cửa (Gate 01–21) mở sẵn**, không cần qua cửa trước, không cần đăng nhập, không thu phí, không có "cửa ác mộng". Chu kỳ+ vẫn mở sau khi qua Gate 21; Sinh tồn chơi ngay, không giới hạn giờ (gục là hết, không hồi sinh tại chỗ).
- Ẩn nút **Đăng nhập Google** và **Bảng xếp hạng**; không tải thư viện Supabase, không gọi máy chủ. Tiến trình lưu `localStorage` như cũ.
- **Thông tin ủng hộ cố định** (không đọc từ trang quản trị): Vietcombank · `0111000182684` · NGUYEN HOANG VINH · PGD Nam Cần Thơ. Ảnh QR: `assets/donate/vcb-qr.png` (cắt từ mã VietQR gốc, đã kiểm tra quét đúng). Đổi thông tin ở hằng `DONATE` đầu `js/access.js`.
- **Nơi hiện lời mời ủng hộ:**
  - Máy tính (màn hình ≥ 1100×620): thẻ QR nằm cố định trong khoảng tối giữa menu và hình Hunter.
  - Điện thoại / màn hình nhỏ: hộp QR hiện **1 lần** sau khi vào game (~1,4 giây, mỗi phiên trình duyệt 1 lần — `sessionStorage` `mb_don_entry`). Xoay ngang thì QR bên trái, thông tin bên phải.
  - Mọi thiết bị: **sau mỗi cửa thắng** (Chiến dịch / Chu kỳ+) hộp QR hiện lại trên màn kết quả, nút "CHIẾN TIẾP →" để đóng. Không bao giờ hiện trong lúc đang đánh. Trạm tiếp tế cũ (sau Gate 10) được thay bằng hộp này.
  - Nút ☕ TIẾP TẾ CHO GAME ở menu / Tạm dừng / kết quả vẫn mở màn ủng hộ đầy đủ (chọn nhanh số tiền → QR VietQR có sẵn số tiền).
- **Bật lại máy chủ:** đổi `const FREE = true` → `false` trong `js/access.js`. Mọi luồng đăng nhập, thu phí, admin `cancuhunterx.html` (mục 2b, 2c) trở lại như v8.4.3.

## 1. Chạy thử trên máy

> **Chế độ 3D cần chạy qua web hoặc server** (Vercel, `npx serve`). Nếu mở thẳng file `index.html` (file://), trình duyệt chặn tải Three.js và game tự chuyển về 2D.

Game tải các file Gate bằng thẻ `<script>`, nên **mở trực tiếp `index.html` (file://) vẫn chơi được**. Nếu muốn thử đầy đủ cả PWA và service worker thì chạy một server tĩnh:

```bash
npx serve .            # hoặc: python3 -m http.server 8080
```

Mở `http://localhost:3000` (hoặc cổng 8080). Thêm `?unlock=all` vào URL để mở khoá mọi Gate khi test.

## 2. Triển khai lên GitHub + Vercel

1. Tạo repo trên GitHub rồi đẩy toàn bộ thư mục lên (giữ nguyên cấu trúc bên dưới).
2. Vào vercel.com, chọn **Add New → Project → Import** repo vừa tạo.
3. Ở mục Framework Preset chọn **Other**. Không cần Build Command; Output Directory để trống (thư mục gốc).
4. Bấm **Deploy**. Mỗi lần `git push`, Vercel sẽ tự triển khai lại.
5. **Mỗi lần phát hành bản mới, tăng số phiên bản ở 2 chỗ:** `version.json` (VD `"5.1.2"`) và `VERSION` trong `sw.js`.
6. **Tự cập nhật app đã cài ra màn hình chính (từ v5.1.2):** app cài kiểu PWA thường chỉ "ngủ" rồi mở lại trang cũ, không tự tải lại. Game hỏi `version.json` trên server mỗi khi app được mở lại, khi vào menu và mỗi 5 phút. Thấy số khác bản đang chạy thì: đang ở menu → tự tải lại ngay; đang đánh dở → báo "Có bản mới" và tự cập nhật khi về menu hoặc vào Gate kế (tiến trình đã lưu nên không mất gì).
   - Máy đang cài **bản cũ hơn v5.1.2** chưa có cơ chế này: cần tắt hẳn app **một lần** (iPhone: vuốt lên đóng app trong trình đa nhiệm; Android: đóng khỏi danh sách app gần đây) rồi mở lại. Từ đó trở đi sẽ tự cập nhật.

`vercel.json` đã cấu hình sẵn header để `sw.js` và `version.json` không bị cache và file JS/CSS luôn được kiểm tra bản mới.

## 2b. Đăng nhập Google, lưu tiến trình & bảng xếp hạng (Supabase)

Khách chơi được Gate 1–7 (tiến trình lưu trên máy); **từ Gate 8 bắt buộc đăng nhập** (xem mục 2c). Đăng nhập Google thì tiến trình (gate đã mở, sao, kỷ lục, súng, xu, nâng cấp) được lưu lên Supabase và có tên trên bảng xếp hạng.

- Dự án Supabase: `https://oapfplwvvspkvklldtpf.supabase.co`, khoá công khai (publishable) đặt trong `js/cloud.js`. Khoá này được phép để ở trình duyệt; quyền truy cập do RLS trong cơ sở dữ liệu quyết định.
- Thư viện `js/vendor/supabase.min.js` (supabase-js 2.117, ~55 KB nén) **chỉ tải khi cần**: người đã đăng nhập, bấm Đăng nhập, hoặc mở Bảng xếp hạng.

**Cài đặt một lần (làm theo thứ tự):**

1. **Tạo bảng:** Supabase Dashboard → *SQL Editor* → *New query* → dán toàn bộ `supabase/schema.sql` → *Run*. (Chạy lại nhiều lần vẫn an toàn.)
2. **Tạo OAuth Client trên Google:** [console.cloud.google.com](https://console.cloud.google.com) → *APIs & Services* → *OAuth consent screen* (chọn External, điền tên app, email) → *Credentials* → *Create credentials* → *OAuth client ID* → loại **Web application**:
   - *Authorized JavaScript origins:* `https://<tên-miền-vercel>`
   - *Authorized redirect URIs:* `https://oapfplwvvspkvklldtpf.supabase.co/auth/v1/callback`
   - Lưu lại **Client ID** và **Client secret**.
3. **Bật Google trong Supabase:** *Authentication* → *Sign In / Providers* → *Google* → bật, dán Client ID + Client secret → *Save*.
4. **Khai báo địa chỉ game:** *Authentication* → *URL Configuration*:
   - *Site URL:* `https://<tên-miền-vercel>`
   - *Redirect URLs:* thêm `https://<tên-miền-vercel>/**` (và `http://localhost:8765/**` nếu muốn thử trên máy).
5. Mở game → nút **ĐĂNG NHẬP LƯU TIẾN TRÌNH** → chọn tài khoản Google.

**Dữ liệu:**

| Bảng | Nội dung | Quyền (RLS) |
|---|---|---|
| `mb_saves` | 1 dòng / tài khoản: bản lưu JSON (< 40 KB, không gồm cài đặt) | Chỉ chủ tài khoản đọc/ghi bản của mình |
| `mb_scores` | Thành tích tốt nhất mỗi người theo (gate, chế độ): điểm, wave, thời gian, tên + ảnh Google | Ai cũng xem được; **chỉ ghi qua hàm** `mb_submit_score` (kiểm tra đăng nhập, giới hạn giá trị, chỉ giữ thành tích tốt hơn) |

**Đồng bộ:** khi đăng nhập: tải bản trên mạng → gộp với bản trên máy (gate/sao/kỷ lục/súng/nâng cấp lấy phần tốt hơn; xu lấy theo bản mới hơn; cài đặt giữ của từng máy) → đẩy bản đã gộp lên. Sau mỗi trận và mỗi lần mua nâng cấp: đẩy lên (gom trong 1,5 giây). Máy đang giữ tiến trình của tài khoản khác thì dùng bản của tài khoản vừa đăng nhập, không gộp chéo. Đăng xuất không xoá tiến trình trên máy.

**Bảng xếp hạng:** *Chọn cửa ải → BẢNG XẾP HẠNG*. Chiến dịch: điểm cao nhất khi **thắng** Gate (kèm thời gian). Sinh tồn: wave cao nhất, rồi đến điểm. Top 50, dòng của mình được tô sáng.

## 2c. Đăng nhập bắt buộc, thu phí (bật/tắt), donate, trang quản trị (v7.1)

**Hiện tại (thu phí TẮT):** khách chơi Gate 1–7; từ Gate 8 phải đăng nhập Google (miễn phí) rồi chơi hết, không giới hạn. Nút **☕ ỦNG HỘ GAME** ở menu, menu Tạm dừng (trong trận), màn kết quả và mục Tài khoản → hiện mã VietQR ngân hàng của chủ game (chọn nhanh 20k / 50k / 100k / 200k hoặc tuỳ ý, nút sao chép số tài khoản / nội dung).

**Trang quản trị `cancuhunterx.html`** (v7.2: giao diện sáng, menu chức năng bên trái, nội dung bên phải; trên điện thoại menu thu vào nút ☰). Đăng nhập Google bằng tài khoản có trong `mb_admins`; người chơi là admin thấy nút ⚙ QUẢN TRỊ trong Tài khoản. Nhóm **THEO DÕI**:
- **Tổng quan:** số người đăng ký (+ mới 7 ngày), hoạt động 7 ngày, số trận, tỉ lệ thắng, tổng giờ chơi, trạng thái thu phí; biểu đồ số trận / người đăng ký mới 14 ngày; người chơi giỏi nhất; cửa ải khó nhất.
- **Người chơi:** danh sách mọi tài khoản đã đăng ký (tên, email, ngày đăng ký, chơi gần nhất, cửa cao nhất, số cửa đã qua, số trận, thời gian chơi, năng lực) — tìm kiếm, lọc theo hạng, sắp xếp từng cột, tải CSV. Bấm 1 người → hồ sơ: chỉ số tổng, **đánh giá năng lực** (điểm từng tiêu chí), biểu đồ thời gian 20 trận gần nhất, **tiến độ từng cửa** (lượt, thắng, thời gian qua nhanh nhất / trung bình, nhanh hay chậm hơn trung vị mọi người, chính xác, sao), 40 trận gần nhất.
- **Thống kê cửa ải:** tỉ lệ thắng theo cửa, phễu tiến độ (số người đã qua mỗi cửa), bảng chi tiết (người đã qua, lượt chơi, tỉ lệ thắng, thời gian qua nhanh nhất / trung vị, chính xác TB, trúng đòn/phút) — dùng để cân bằng độ khó.
- **Đánh giá năng lực (0–100):** 25% tỉ lệ thắng + 25% tốc độ (thời gian qua cửa so với trung vị mọi người) + 20% độ chính xác + 15% né đòn (số lần trúng đòn mỗi phút) + 15% tiến độ. Hạng: Tân binh < 35 ≤ Chiến binh < 55 ≤ Tinh nhuệ < 75 ≤ Bậc thầy < 90 ≤ Huyền thoại. Cần ≥ 3 trận chiến dịch.
- **Dữ liệu:** từ v7.2 mỗi trận của người đã đăng nhập ghi vào bảng `mb_plays` (hàm `mb_log_play`, tối đa 1 trận / 5 giây). Danh sách tài khoản lấy qua `mb_admin_players()` (chỉ admin). Trận chơi trước v7.2 không có nhật ký — chỉ có tiến độ trong bản lưu. Thử giao diện trên máy với dữ liệu giả: `cancuhunterx.html?demo=1` (localhost).

Nhóm **NỘI DUNG** (v7.3):
- **Mở cửa ải (kiểm soát theo từng Màn):** mỗi Màn có công tắc *kiểm soát*. **Không bật** (mặc định) → người chơi chơi liên tục như bình thường, hết cửa này qua cửa khác, kể cả cửa mới phát hành sau này. **Bật** → chỉ các cửa được chọn mới mở; cửa còn lại hiện **🔒 Sắp mở · đang hoàn thiện** (không bấm được; nút Gate tiếp theo / Bất tận cũng bị chặn); cửa mới phát hành sau này của Màn đó mặc định đóng. Lưu ở key `gates` trong `mb_config`: `{ acts: { "2": [11, 12, 13] } }` — Màn không có trong `acts` = mở tự do. Màn mới thêm vào `MB.Gates.acts` / `meta` tự hiện ở đây.
- **Admin chơi được mọi cửa:** tài khoản trong `mb_admins` bỏ qua cửa đóng, tiến độ (chưa qua cửa trước) và thu phí — để chơi thử. Thẻ cửa đang đóng hiện nhãn **ĐÓNG · ADMIN**. Quyền admin được nhớ trên máy (`mb_adm_<uid>`) để chơi thử cả khi mất mạng.

Nhóm **KINH DOANH**:
1. **Thu phí:** công tắc bật/tắt + "bắt buộc đăng nhập từ Gate" (mặc định 8) + "thu phí từ Gate" (mặc định 11). Lưu là áp dụng cho người chơi ở lần mở game kế tiếp.
2. **Nhận donate:** mã ngân hàng (VCB, MB, TCB…), số tài khoản, tên chủ tài khoản, lời nhắn; hoặc dán link ảnh QR riêng (ví dụ QR MoMo). Có nút xem thử QR.
3. **Bảng giá gói** (sửa tên, giá, giá màn tiếp theo, số ngày, mô tả).
4. **Đơn hàng:** xem đơn, bấm DUYỆT khi đã nhận tiền mà đơn chưa tự mở.
5. **Cấp quyền thủ công** theo email.


**Tiếp tế (donate) — v7.4.** Game chủ yếu sống nhờ ủng hộ, lời mời được lồng vào cốt truyện và chỉ hiện đúng lúc:
- **Trạm tiếp tế** (màn bộ đàm, nút "☕ Tiếp tế cho Hunter" và "Chiến tiếp →" ngang bằng, không chặn chơi): hiện **1 lần** sau khi thắng Gate 10 + cảnh chuyển Màn 2; và khi **thua ở cửa ác mộng** (lần đầu luôn hiện, sau đó 30%, tối đa 1 lần mỗi phiên). Kèm thành tích cá nhân (quái đã hạ, thời gian chiến đấu, cửa đã qua, ★) và thanh chi phí server. Người đã tiếp tế không bao giờ thấy màn này. Không có gì hiện trong lúc đang đánh.
- **Cửa ác mộng khi chưa tiếp tế** (mặc định Gate 11, admin đổi được): banner "VÙNG ÁC MỘNG" + bộ đàm "đạn dược gần cạn"; quái đông ×1,7, maxAlive ×1,7, ra nhanh ×1,8, máu ×1,8, đánh đau ×1,4, tốc độ ×1,12, ~30% quái tinh nhuệ, boss luôn cấp tinh nhuệ (máu ×1,35), thùng y tế 80 giây/lần. Người tiếp tế chơi bình thường. Admin chưa tiếp tế cũng gặp (để thử).
- **Mã tiếp tế riêng** mỗi tài khoản: `MBTT` + 6 ký tự đầu user id (hiện trong QR, mục Tài khoản, hồ sơ người chơi ở admin). Khách chưa đăng nhập: `MB UNG HO` (ẩn danh). SePay → `mb-sepay` nhận ra mã → `mb_support_by_code`; hoặc admin ghi nhận tay (mục **Người tiếp tế**).
- **Ghi nhận người tiếp tế:** huy hiệu **☕** cạnh tên trên bảng xếp hạng (`mb_scores.supporter`), "☕ NGƯỜI TIẾP TẾ" trong Hồ sơ Hunter và Tài khoản; lời cảm ơn 1 lần khi nhận huy hiệu, sau đó thỉnh thoảng 1 dòng cảm ơn ở màn kết quả (≤ 1 lần/ngày, 15% khi thắng). Nút tiếp tế ẩn khỏi menu Tạm dừng và màn kết quả với người đã tiếp tế.
- **Admin → Người tiếp tế:** tổng tháng / tổng đã nhận / số người tiếp tế; ghi nhận tay theo email (để trống = ẩn danh); **thanh chi phí server** (tên, mục tiêu tháng, số cộng thêm); bật/tắt + danh sách **cửa ác mộng**; danh sách người tiếp tế; lịch sử tiếp tế.
- **Dữ liệu:** `mb_supporters` (tổng, số lần), `mb_donations` (lịch sử, ref chống trùng), `mb_month_support()` (công khai — tổng tháng), config `starve`, `server`. Cần chạy lại `supabase/schema.sql` (mục 7) và triển khai lại `mb-sepay` nếu đã dùng.

**Xác nhận tiếp tế thủ công (v7.5)** — quy trình khi nhận tiền:
1. Tin nhắn ngân hàng có mã `MBTTxxxxxx` → admin **Người chơi**, dán cả nội dung chuyển khoản vào ô tìm (hoặc ô "Tìm người chơi theo mã chuyển khoản" ở trang **Người tiếp tế**) — tự tách mã, không phân biệt hoa thường / khoảng trắng.
2. Mở hồ sơ → khung **☕ Xác nhận người này đã tiếp tế**: nhập số tiền + "Tiền được dùng cho" (hiện cho người chơi) → **✓ Xác nhận đã tiếp tế**.
3. Lần mở game kế tiếp, người chơi thấy **ngôi sao cảm ơn sáng rực** (tia sáng xoay, lấp lánh) kèm số tiền, mục đích sử dụng, tổng đã tiếp sức — hiện ở màn menu/chọn cửa/kết quả, không chen vào trận; mỗi lần tiếp tế mới hiện 1 lần. Ngôi sao nhỏ sáng ★ luôn hiện cạnh tên tài khoản ở menu. Người chơi đọc được các lần tiếp tế của chính mình (RLS `mb_donations`).

**Khi BẬT thu phí** (từ Gate 11):

| Gói | Giá | Thời hạn | Mở | Sinh tồn + BXH | Màn tiếp theo | Chu kỳ+ |
|---|---|---|---|---|---|---|
| `act15` Gói 15 ngày | 29.000đ | 15 ngày | 1 màn (chiến dịch) | ✗ | 29.000đ | ✗ |
| `act30` Gói 30 ngày | 49.000đ | 30 ngày | 1 màn | ✓ | 25.000đ | ✗ |
| `year` Gói 1 năm | 525.000đ | 365 ngày | Mọi màn | ✓ | — | ✓ |
| `gate` Ủng hộ mở 1 cửa | 5.000đ | 15 ngày | 1 cửa (chiến dịch) | ✗ | — | ✗ |

Mua màn tiếp theo tính thời hạn mới từ lúc mua. Giá do **máy chủ** tính (`mb_create_order`), người chơi không sửa được.

**Luồng thanh toán (QR ngân hàng tự mở khoá):** chọn gói → `mb_create_order` tạo mã đơn `MBxxxxxx` → game hiện VietQR có sẵn số tiền + mã đơn → người chơi chuyển khoản → **SePay** đọc biến động số dư, gọi Edge Function `mb-sepay` → tìm mã đơn trong nội dung, đủ tiền thì `mb_apply_order` cấp quyền → game tự kiểm tra mỗi 5 giây và mở khoá (hoặc bấm *ĐÃ CHUYỂN KHOẢN? KIỂM TRA*).

**Cài đặt (làm 1 lần, theo thứ tự):**
1. SQL Editor → chạy lại toàn bộ `supabase/schema.sql`.
2. Tự đặt mình làm admin: `insert into public.mb_admins (user_id) select id from auth.users where email = 'email-cua-ban@gmail.com';` (đăng nhập game bằng email đó ít nhất 1 lần trước).
3. Mở `https://<tên-miền>/cancuhunterx.html` → nhập thông tin ngân hàng nhận donate → LƯU.
4. (Khi muốn thu phí tự động) Đăng ký SePay, liên kết tài khoản ngân hàng → triển khai `supabase functions deploy mb-sepay --no-verify-jwt` → *Edge Functions → Secrets*: `SEPAY_API_KEY` = khoá tự đặt → trong SePay tạo webhook tới `https://oapfplwvvspkvklldtpf.supabase.co/functions/v1/mb-sepay`, chứng thực "API Key" với cùng khoá → bật công tắc thu phí trong admin.

**Dữ liệu:** `mb_config` (paywall / donate / plans — ai cũng đọc, chỉ admin sửa) · `mb_admins` · `mb_orders` (chủ đơn + admin xem, chỉ tạo qua `mb_create_order`) · `mb_entitlements` (thêm `gates`, `perks`; chỉ admin / máy chủ ghi) · trigger `mb_guard_score` chỉ chặn điểm Gate 11+ khi đang bật thu phí và gói không có quyền bảng xếp hạng.

**Giới hạn:** kiểm tra quyền nằm ở trình duyệt, file Gate là file tĩnh — người rành kỹ thuật vẫn sửa code vào được (không lên bảng xếp hạng). Chặn hẳn: chuyển file Gate trả phí vào Storage riêng tư + signed URL. `?unlock=all` chỉ chạy trên localhost. ⚠ Thu phí game trực tuyến tại Việt Nam cần tư cách pháp lý phù hợp (Nghị định 147/2024) — chỉ bật khi đã đủ điều kiện.

## 3. Cấu trúc dự án

```
index.html               Khung trang, HUD, menu, các màn hình
manifest.webmanifest     Thông tin PWA (icon, chế độ toàn màn hình ngang)
sw.js                    Service worker: chơi offline sau lần tải đầu
version.json             Số phiên bản; app so với server để tự cập nhật
vercel.json              Cấu hình header cho Vercel
css/style.css            Giao diện, bố cục responsive cho điện thoại
assets/icons/            Icon app v6.6.1 "vết cào + mắt quái": icon.svg, icon-192/512 (any), icon-maskable-192/512 (Android, nội dung trong vùng an toàn 80%), apple-touch-icon 180 (iPhone), favicon-32
assets/audio/sfx/        v6.5: 67 file hiệu ứng mp3 (44 loại, nhiều biến thể) — xem assets/CREDITS.md
assets/audio/music/      v6.5: nhạc nền lặp liền mạch: menu.mp3 (48 s), battle.mp3 (48 s), boss.mp3 (41 s)
assets/models/           v6.5: hunter.glb (440 KB, nay dùng cho Dian), zombie.glb (310 KB) — mô hình có khung xương + hoạt ảnh
                         v8.4: hunter_swat.glb (2,4 MB) — Hunter Mixamo "Swat Guy", 6 hoạt ảnh idle/walk/run/shoot/hit/die
                         v8.4.1: zombie_real.glb (1 MB) — xác sống Mixamo, 5 hoạt ảnh idle/walk/run/attack/die (zombie.glb cũ chỉ còn làm dự phòng)
assets/CREDITS.md        Nguồn & giấy phép âm thanh / mô hình
js/vendor/three-addons.min.js  GLTFLoader + SkeletonUtils (three r170)
assets/hunter/           Ảnh nhân vật Hunter: body.webp (key art menu), portrait.webp (chân dung thoại), dossier.webp (hồ sơ)
js/core.js               Tiện ích, va chạm (tròn / hộp xoay), lưu game, registry
js/props.js              Vẽ vật cản, vùng nguy hiểm dùng chung (virus, bùn, axit, khí độc, dung nham, lửa, băng, nước, dầu) và bộ công cụ vẽ nền MB.GK
js/input.js              Bàn phím + chuột, twin-stick cảm ứng, gamepad
js/audio.js              Âm thanh tổng hợp bằng WebAudio (không cần file mp3)
js/weapons.js            Súng, linh kiện nâng cấp (mod), bắn đạn
js/hero.js               Nhân vật Hunter: di chuyển, thể lực, lộn né, vẽ
js/enemies.js            Quái dùng chung: Zombie, Spider, Licker + AI lái hướng + khuôn hành vi (bắn xa, tự nổ, đào đất, dịch chuyển, khiên)
js/items.js              Vật phẩm rơi và hệ thống thử thách
js/skills.js             Kỹ năng giải vây: lựu đạn, xung kích
js/arsenal.js            v6.4: cơ chế boss (điểm yếu, gục choáng, khắc hệ), siêu chiêu + thanh nộ, tiếp tế đạn hạng nặng, hiệu ứng 5 súng mới
js/story.js              Cốt truyện: cảnh chuyển (canvas), bộ đàm trong trận, manh mối của GS. Ted
js/cloud.js              Đăng nhập Google (Supabase), đồng bộ tiến trình, bảng xếp hạng
js/progress.js           Xu & cửa hàng nâng cấp vĩnh viễn, thẻ nâng cấp trong trận, combo, rung điện thoại
js/hud.js                HUD (DOM), chỉ cập nhật khi giá trị thay đổi
js/game.js               Runtime một Gate: wave, đạn, va chạm, vụ nổ, dẫn đường (flow field), camera, minimap, vẽ
js/main.js               Menu, chọn Gate, tải file Gate theo yêu cầu, vòng lặp, nút 2D/3D
js/creepers.js           Nhện bò + dơi ma bay trên Menu / Chọn cửa ải (canvas trang trí, không chặn thao tác)
js/render3d.js           Bộ vẽ 3D (chỉ tải khi chọn 3D): camera, ánh sáng, Hunter, quái dùng chung, bộ khuôn model (KIT) cho các Gate
js/vendor/three.module.min.js  Thư viện Three.js r170 (~690 KB, ~170 KB khi nén gzip), chỉ tải khi chơi 3D
js/gates/index.js        Danh sách 10 Gate (tên, màu, file)
js/gates/gate01-jungle.js      Rừng: Spider Queen
js/gates/gate02-mountain.js    Núi: Bat, Brute, Stone Behemoth, đá lăn
js/gates/gate03-swamp.js       Đầm lầy: Bloater, Lurker, Toad King, khí độc
js/gates/gate04-snow.js        Tuyết: Frost Zombie, Ice Wraith, Cryo Wyrm, bão tuyết
js/gates/gate05-volcano.js     Núi lửa: Magma Imp, Ember Spitter, Cinder Golem, Magma Titan, thiên thạch
js/gates/gate06-ocean.js       Đảo: Crab, Drowned, Kraken + xúc tu, thuỷ triều
js/gates/gate07-industrial.js  Nhà máy: Drone, Sludge, Assembler Mech, băng chuyền, laser, thùng nổ
js/gates/gate08-city.js        Thành phố: Runner, Riot, Abomination, ô tô nổ, bầy đàn
js/gates/gate09-lab.js         Phòng thí nghiệm: Clone, Phase Stalker, Sentry, Specimen Omega, laser quay, bệ dịch chuyển
js/gates/gate10-apocalypse.js  Tận thế: tất cả quái, The Origin (4 phase), virus lan, sét đỏ
js/gates/gate11-hanoi.js      Màn 2 · Hà Nội – Hồ Gươm: Tháp Rùa, cầu Thê Húc, phố cổ; bộ công cụ MB.VN dùng chung
js/gates/gate12-hoian.js      Màn 2 · Hội An – phố đèn lồng ban đêm: Chùa Cầu, sông Hoài, Mãng Xà Đèn Lồng
```

**Vì sao tách file:** phần engine dùng chung (khoảng 130 KB) được tải một lần. Mỗi Gate là một file riêng 15–30 KB, chỉ tải khi người chơi chọn Gate đó (Gate 10 tải thêm các Gate trước để dùng lại quái). Bộ vẽ 3D và Three.js chỉ tải khi chơi 3D.

## 3b. Chế độ 3D

**v6.5 — mô hình 3D thật (có khung xương & hoạt ảnh).** Khi bật 3D, `render3d.js` tải thêm `three-addons.min.js` + `hunter.glb` + `zombie.glb` (~800 KB, chỉ tải 1 lần). Trong lúc tải dùng mô hình dựng sẵn; tải xong tự đổi (`onSkinnedReady`).
- **Hunter:** lính đặc nhiệm Mixamo, tô lại tông đen than / ô liu, hoạt ảnh idle / walk / run hoà trộn theo tốc độ; cả người quay theo hướng ngắm, chạy lùi thì phát hoạt ảnh ngược. Tay được "bẻ" sang tư thế ôm súng mỗi khung hình (`aimBone`, `POSE_RIFLE`), súng là mô hình dựng sẵn đặt trước ngực; giữ phù hiệu cánh-kiếm phát sáng và vòng cyan dưới chân.
- **Xác sống thường (`zombie`):** hình nhân Xbot giảm lưới, màu da thối ngẫu nhiên, khớp đỏ sẫm, mắt phát sáng, tay giơ ra trước kiểu xác sống, đầu lắc lư, đi theo tốc độ thật. Tối đa 12 con (điện thoại) / 40 con (máy tính) dùng mô hình thật cùng lúc, còn lại dùng mô hình dựng sẵn; chọn *Chất lượng: Thấp* thì tắt hẳn để nhẹ máy. Các biến thể xác sống riêng của từng Gate, nhện, licker, boss vẫn là mô hình dựng sẵn.
- **v6.5.1 — giữ đúng tạo hình đã thiết kế:** đầu đội mũ giáp của mô hình gốc (và đầu hình nhân Xbot) được thu nhỏ về 0 rồi thay bằng bộ phận dựng sẵn bám theo xương (`follow`): Hunter có đầu tóc nâu rối + râu + mũ trùm cổ, áo giáp nâu ô liu có túi đạn, ba lô + bình lọc xanh, phù hiệu cánh-kiếm (`heroHeadKit`, `heroChestKit`); xác sống có đầu u nần + hàm + mắt phát sáng, áo rách màu ngẫu nhiên + vết thương, túi độc phát sáng, quần (`zombieHeadKit`, `zombieChestKit`, `zombiePantsKit`), da xanh xám giống bản vẽ. Hunter phóng to (tỉ lệ 38) cho cỡ bằng bản dựng sẵn.
- Cài đặt → **Nhân vật 3D**: *Mô hình có khung xương* (mặc định) hoặc *Mô hình dựng sẵn* (như trước v6.5, nhẹ máy); đổi giữa trận được (`R3.onSkinnedReady`).
- Muốn Hunter giống ảnh concept hơn: tạo GLB từ ảnh (Meshy/Tripo…), gắn khung xương Mixamo, xuất GLB có idle/walk/run rồi thay `assets/models/hunter.glb` (giữ tên xương `mixamorig*`).


Chọn ở màn hình **Chọn cửa ải** (nút **2D / 3D**) hoặc trong **Cài đặt → Góc nhìn**. Mặc định là 3D. Cả 10 Gate đều có bản 3D.

**Cách hoạt động:** logic game (va chạm, AI, đạn, wave, thử thách) dùng chung cho cả 2D và 3D. `render3d.js` chỉ đọc trạng thái game mỗi khung hình và dựng cảnh 3D tương ứng. Nhờ vậy cách chơi, điều khiển, điểm số, lưu tiến trình giống hệt nhau giữa hai chế độ.

| Thành phần | Trong 3D |
|---|---|
| Camera | Phối cảnh, nghiêng 61°, nhìn từ phía nam, đi theo nhân vật và nhìn trước theo hướng ngắm; rung khi trúng đòn |
| Ánh sáng | Đèn bầu trời + mặt trời có bóng đổ mềm, sương mù ở xa, tone mapping ACES |
| Nền | Dùng lại texture vẽ của bản 2D; vết máu/virus được vẽ thêm lên nền |
| Hunter | Model nhiều khớp (đùi, gối, ống chân, giày; tay ôm súng), giáp bo tròn, bình lọc phát sáng, mũ có visor, súng có nòng tròn và đổi theo vũ khí. Chân bước theo hướng chạy, thân xoay theo hướng ngắm, giật súng, nghiêng súng khi nạp, chớp nòng, bóng mờ khi lộn né, ngã khi chết |
| Quái | Dựng hình hữu cơ thay cho khối hộp: Zombie (người gù, đầu méo, hàm há, mắt phát sáng, vết thương lộ sườn, tay có ngón, chân có gối); Spider (bụng sần, 8 chân 2 khớp, mắt bóng, răng nanh); Licker (thân cơ đỏ có vòng sườn, não lộ, hàm răng, 4 chi có móng vuốt, lưỡi dài khi tấn công); Spider Queen (bụng có hoa văn phát sáng, túi trứng, gai lưng). Bề mặt được làm méo nhẹ bằng nhiễu cho giống da thịt. Có hoạt ảnh bước theo nhịp chân, chớp trắng khi trúng, trồi lên khi xuất hiện, vòng tím cho quái tinh nhuệ |
| Môi trường | Cây (tán làm mờ khi che nhân vật), đá, khúc gỗ, thùng tiếp tế, ổ virus, trạm tín hiệu có đèn nháy, hồ virus phát sáng có bong bóng |
| Lớp phủ mặt đất | Vạch cảnh báo đỏ, vòng sóng chấn, vùng thử thách vẽ lên một mặt phẳng sát đất |
| Lớp 2D trên cùng | Số sát thương, thanh máu quái, mũi tên chỉ hướng, minimap, tâm ngắm, laser ngắm (cảm ứng) |
| Tự giảm chất lượng | Nếu FPS dưới khoảng 30 trong 3 giây: hạ độ phân giải, rồi tắt bóng đổ |

Mỗi khung hình, phần JS dựng cảnh 3D tốn khoảng 0,1 ms (đo bằng trình duyệt headless); phần còn lại là GPU.

**Model 3D của từng Gate nằm ngay trong file Gate**: `models3d` (quái/boss), `props3d` (vật cản), `actors3d` (vật thể động như đá lăn, thiên thạch, tia laser), `hazards3d` (màu vùng nguy hiểm). Các hàm nhận bộ công cụ `K` (KIT) gồm khối hình (`box`, `sph`, `cyl`, `cap`), chi có khớp (`joint`, `limbBetween`), làm sần bề mặt (`bumpy`) và các khuôn model sẵn: `buildZombie` (người: có tham số màu, dáng gù, tỉ lệ, phụ kiện), `buildSpiderLike`, `buildLicker`, `buildBlob`, `buildFlyer` (dơi/drone/bóng ma), `buildGolem`. Quái hoặc vật cản chưa có model sẽ hiện dạng khối đơn giản.

Toà nhà, tán cây che nhân vật sẽ tự mờ đi. Kênh nước, dung nham, băng… là các mặt phẳng có màu/độ trong suốt riêng.

## 4. Điều khiển

| Hành động | Máy tính | Điện thoại | Tay cầm |
|---|---|---|---|
| Di chuyển | W A S D / phím mũi tên | Chạm và kéo ở nửa trái màn hình | Cần trái |
| Ngắm | Chuột (đổi chế độ: phím **T** hoặc nút **NGẮM** dưới nút ❚❚) | Nửa phải màn hình: **chạm/giữ tại chỗ** = quay ngay về điểm chạm; **kéo** = gậy ngắm | Cần phải |
| Bắn | Giữ chuột trái (chế độ **Tự động**: tự bắn, giữ chuột trái để bắn theo chuột) | **Chạm liên tục / giữ** bên phải để bắn vào điểm chạm (mọi chế độ ngắm). Chế độ **Tự động** còn tự khoá và tự bắn. Gậy ngắm: kéo quá 30% là bắn | RT (hoặc đẩy cần phải mạnh) |
| Lộn né (bất tử 0,3 giây) | Space / chuột phải | Nút **NÉ** | A / B |
| Chạy nhanh | Giữ Shift | Đẩy gậy trái hết cỡ | LB |
| Nạp đạn | R | Nút **NẠP** | X |
| Đổi súng | Q / phím 1–8 / cuộn chuột | Chạm vào **ô súng** (góc dưới, có ký hiệu ⇄) | Y |
| Lựu đạn | G / chuột giữa | Nút **LỰU** (ném vào quái đang khoá) | RB |
| Xung kích | F hoặc E | Nút **XUNG** | B |
| Siêu chiêu (v6.4) | X | Nút **SIÊU** (hiện sau khi chọn siêu chiêu) | Back / R3 |
| Tạm dừng | Esc / P | Nút ❚❚ | Start |
| Bật / tắt âm thanh | M hoặc nút loa | Nút loa (góc trên phải; trong trận nằm cạnh nút ❚❚) | — |

- Phím dùng `e.code`, nên vẫn hoạt động khi đang bật bộ gõ Telex hay VNI.
- **Xoay người có giới hạn tốc độ** (Cài đặt → *Tốc độ xoay người khi ngắm*: Chậm 5 / Vừa 8 / Nhanh 14 rad/giây; chuột nhanh gấp 2,2 lần). Chuột đặt sát nhân vật (dưới 34 đơn vị) thì giữ hướng cũ, tránh xoay vòng loạn.
- **Ngắm trên điện thoại / tay cầm** (Cài đặt → *Ngắm*):
  - **Tự động** (mặc định): khoá quái gần nhất trong tầm 540 có đường bắn, ưu tiên boss và mục tiêu đang khoá; tự bắn khi đã quay đúng hướng (lệch dưới 0,3 rad). Gạt gậy phải để chọn hướng ưu tiên. Không có quái thì tự bắn thùng tiếp tế / mục tiêu thử thách gần. Mục tiêu khoá có vòng đỏ xoay.
  - **Hỗ trợ**: nắn hướng ngắm về quái trong góc ~24°, có khoá dính.
  - **Thủ công**: không hỗ trợ.
- **Ngắm trên máy tính (v6.2.1)** — lưu riêng ở `settings.aimModeKb`, đổi bằng nút **NGẮM** (dưới nút ❚❚), phím **T** hoặc Cài đặt → *Ngắm trên máy tính*:
  - **Chuột** (mặc định): súng theo con trỏ, giữ chuột trái để bắn.
  - **Hỗ trợ**: theo chuột nhưng nắn nhẹ về quái gần hướng con trỏ.
  - **Tự động**: tự khoá quái gần nhất (ưu tiên hướng con trỏ) và tự bắn; giữ chuột trái thì tạm bỏ khoá, bắn theo chuột.
- Nút **NGẮM** hiện ở cả máy tính lẫn cảm ứng; nhãn và chế độ đổi theo thiết bị đang dùng.
- **Quay đầu nhanh (v6.2.2):** tốc độ xoay tăng theo độ lệch — lệch >0,45 rad ×1,6, lệch >0,9 rad ×2,6 (quay 180° chỉ ~0,15 giây). Không ngắm gì thì Hunter quay mặt theo hướng chạy (chế độ Hỗ trợ còn nắn về quái gần hướng đó).
- **Ưu tiên quái áp sát (v6.2.2):** ngắm Tự động trừ điểm mạnh cho quái trong bán kính 230 (kể cả sau lưng, bỏ qua lọc hướng gậy ngắm khi dưới 150); độ "dính" mục tiêu cũ giảm từ 140 xuống 70 để không mải bắn quái xa khi bị cạp từ phía sau.
- Gậy điều khiển là loại "trôi": kéo ngón tay ra quá xa thì đế gậy đi theo.
- Game tự tạm dừng khi chuyển tab hoặc khi app bị ẩn.
- **Bố cục cảm ứng (v5.1):** cụm 4 nút gọn ở góc phải dưới (NÉ to ở góc, NẠP / LỰU / XUNG nhỏ xếp vòng cung quanh ngón cái); ô súng thu thành 1 dòng nằm cạnh cụm nút, chạm để đổi súng; khung HP, thử thách, minimap nhỏ và trong hơn để nhìn rõ chiến trường.
- **2D hay 3D đều chơi được trên điện thoại.** Chọn ở màn hình chọn Gate, hoặc đổi ngay giữa trận trong menu Tạm dừng (nút *ĐỔI SANG 2D / 3D*). Máy yếu nên chơi 2D.

## 4b. Âm thanh

**v6.5 — âm thanh dạng file.** `js/audio.js` tải 67 file hiệu ứng (`assets/audio/sfx/<tên>[_n].mp3`, 64 kbps mono, tổng ~710 KB) ngay sau lần chạm đầu tiên, 6 file song song; mỗi lần phát chọn biến thể khác lần trước và lệch cao độ ±6% (súng, trúng đạn, nổ, gầm) để đỡ lặp, giới hạn số tiếng cùng lúc mỗi loại (`MAXV`), âm lượng cân bằng trong `VOL`. Chưa tải xong / lỗi mạng → dùng âm tổng hợp cũ (`SFX`, `FALLBACK`).
Nhạc nền (`assets/audio/music/*.mp3`, 80 kbps stereo, tổng ~1,4 MB): **menu** (hồi hộp, tim đập, dây trầm, 70 BPM), **battle** (taiko + dây staccato giọng Rê thứ, 120 BPM), **boss** (140 BPM, kèn đồng, đàn bass méo, choir). File có 0,1 s đệm 2 đầu; phát bằng `loopStart`/`loopEnd` (`LOOPS`) nên lặp liền mạch dù bộ mã hoá MP3 chèn khoảng lặng. Trong trận: battle và boss chạy song song, `intensity(k)` chuyển dần sang nhạc boss khi k ≥ 0,95. Nhạc chỉ tải khi cần (menu ngay sau chạm, trận khi vào Gate) và được service worker cache lại.
Hiệu ứng mới: `shot_beam/cryo/bolt/missile/disc`, `super_orbital/laser`, `drone`, `stagger`, `weakhit`, `growl` (quái gầm gừ ngẫu nhiên 3–7 giây/lần khi có quái trong 520 đơn vị).
Nguồn: mẫu âm CC0 (Sonic Pi/freesound, Kenney) + tổng hợp offline — chi tiết ở `assets/CREDITS.md`.


- Toàn bộ âm thanh tổng hợp bằng WebAudio (không có file mp3).
- **Nhạc chủ đề ở menu (v5.5):** phát ngay từ màn hình đầu (sau lần chạm/nhấp đầu tiên — trình duyệt không cho tự phát trước đó). Không khí hồi hộp, nguy hiểm: tiếng tim đập "thình… thịch", nền trầm rung rợn người, đoạn lặp giọng Rê thứ dồn dập dần, hợp âm nghịch tai mỗi 8 ô nhịp, tiếng rít kim loại thỉnh thoảng. Phát ở các màn menu, chọn Gate, cửa hàng, bảng xếp hạng, tài khoản, kết quả; vào trận thì chuyển sang nhạc trận (mạnh dần khi đánh boss).
- **Nút loa** bật/tắt toàn bộ âm thanh, lưu lại cho lần sau. Trên iPhone, nút loa **thắng nút gạt im lặng** của máy (xem K-17). Cài đặt vẫn có tuỳ chọn riêng cho hiệu ứng và nhạc nền.

## 5. Vòng chơi

```
Chọn Gate → Wave 1 → nghỉ 5s → Wave 2 → nghỉ 5s → Wave 3 → cảnh báo Boss → Boss → Kết quả
     (bất kỳ lúc nào: phá thùng tiếp tế, làm thử thách để mạnh lên)
```

- **Thắng:** hạ boss. Gate kế tiếp được mở khoá.
- **Cơ hội đấu lại Boss (v5.2):** gục ngã trong trận boss (hoặc lúc cảnh báo boss) **lần đầu** → hiện màn *HUNTER ĐÃ GỤC NGÃ* với 2 lựa chọn:
  - **ĐẤU LẠI BOSS (1 LẦN):** hồi sinh tại chỗ, đầy máu, giáp, đạn, lựu đạn và xung kích; giữ nguyên súng, linh kiện, điểm và thử thách đã xong. Quái, đạn địch và vùng nguy hiểm tạm thời bị dọn sạch; bất tử 3 giây để thoát khỏi dung nham/axit; boss xuất hiện lại **đầy máu** sau 3 giây.
  - **CHẤP NHẬN THUA:** sang màn kết quả như bình thường.
  - Mỗi lượt chơi Gate chỉ có 1 cơ hội; gục lần hai là thua. Gục ở các wave thường thì thua ngay (không có cơ hội).
- **Thua:** HP về 0. Có thể chơi lại ngay.
- **Sao (★):** mỗi thử thách hoàn thành cho 1 sao. Sao được cộng dồn qua các lần chơi, tối đa 3 sao mỗi Gate.
- **Điểm:** điểm hạ quái, +500 mỗi wave, +1.000 mỗi thử thách, +25 mỗi vật phẩm, +5.000 khi hạ boss, thưởng thắng 2.000 + HP còn lại × 10.

## 6. Tăng sức mạnh súng

Súng **không tự nâng cấp theo wave** như bản v3. Người chơi phải tự kiếm sức mạnh theo hai cách:

1. **Nhặt thiết bị**
   - **Thùng tiếp tế** (thùng gỗ có dấu ★ vàng, 45 HP): bắn vỡ để rơi ra linh kiện (50%), bộ máu (30%) hoặc giáp (20%).
   - **Quái tinh nhuệ** (viền tím, máu ×2,4, điểm ×3): luôn rơi 1 linh kiện.
   - Quái thường có 5,5% rơi bộ máu và 3% rơi giáp.
2. **Vượt thử thách:** mỗi Gate có 3 thử thách. Phần thưởng là súng mới hoặc linh kiện hiếm.

### Linh kiện (mod)

Linh kiện áp dụng cho mọi súng đang có và được reset khi bắt đầu Gate mới.

| Ký hiệu | Tên | Hiệu ứng mỗi cấp | Tối đa |
|---|---|---|---|
| D | Nòng Tăng Lực | +15% sát thương | 5 |
| F | Cò Siêu Tốc | +12% tốc độ bắn | 5 |
| M | Băng Đạn Mở Rộng | +25% băng đạn, nạp nhanh hơn 12% | 3 |
| P | Lõi Xuyên Phá | Đạn xuyên thêm 1 mục tiêu (mỗi lần xuyên giảm 20% sát thương) | 2 |
| S | Bộ Chia Tia | +2 tia phụ (60% sát thương); với Shotgun là +2 viên | 2 |

Nhặt linh kiện đã đạt cấp tối đa thì được +300 điểm.

### Vũ khí

Súng nhận từ thử thách được lưu vào **kho vũ khí** và mang theo sang các Gate sau.

| Súng | Có được từ | Sát thương | Tốc độ bắn | Băng | Nạp đạn | DPS gốc |
|---|---|---|---|---|---|---|
| Rifle AR-7 | Có sẵn | 20 | 110 ms | 30 | 1,1 s | ~182 |
| Shotgun SG-12 | Thử thách Gate 01 | 11 × 7 viên | 640 ms | 6 | 1,4 s | ~120 (gần: rất cao) |
| SMG Viper | Thử thách Gate 02 | 10 | 62 ms | 44 | 1,15 s | ~161 (bắn toé) |
| Rail Lancer | Thử thách Gate 03 | 110, xuyên 3 mục tiêu | 850 ms | 5 | 1,6 s | ~129 (rất mạnh khi quái xếp hàng) |
| Pyro F-9 (súng lửa) | Thử thách Gate 04 | 6 × 2 tia, xuyên 2, **gây bỏng** 9/s trong 2,2 s | 45 ms | 90 | 1,8 s | ~270 + bỏng, tầm ngắn |
| Boomer GL (phóng lựu) | Thử thách Gate 05 | nổ bán kính 95, 70 sát thương | 620 ms | 6 | 1,7 s | ~113 diện rộng |
| Arc Plasma | Thử thách Gate 06 | 34, xuyên 1, **sét lan** sang 2 quái gần (50%) | 170 ms | 26 | 1,3 s | ~200 + sét lan |
| Tempest MG (súng máy) | Thử thách Gate 07 | 9 | 42 ms | 140 | 2,6 s | ~214, băng rất lớn |

**5 súng mới (v6.4)** — nhận miễn phí khi **hạ boss** Gate tương ứng (ở Chiến dịch), hoặc mua bằng xu ở *NÂNG CẤP NHÂN VẬT → KHO SÚNG* khi đã mở tới Gate trước đó 2 cửa (`MB.Boss.GUNS`, `MB.Shop.buyGun`):

| Súng | Hệ | Hạ boss Gate | Giá xu | Sát thương | Tốc độ bắn | Băng | Đặc điểm |
|---|---|---|---|---|---|---|---|
| Cryo Frost | Băng | 3 | 600 | 9, xuyên 1 | 55 ms | 80 | Làm chậm 50% (boss 25%); tích đủ lạnh thì **đóng băng** quái 1,6 s |
| Bolt X Crossbow | Nổ | 5 | 800 | 70 + nổ 110 (bán kính 85) | 700 ms | 5 | Tên **cắm vào mục tiêu rồi nổ** sau 0,5 s |
| Hornet ML | Nổ | 7 | 1.000 | 3 tên lửa × nổ 50 (bán kính 55) | 750 ms | 4 | **Tự dẫn**, ưu tiên mục tiêu đang khoá và boss |
| Lumen Beam | Điện | 9 | 1.200 | 11 / 60 ms (~183 DPS) | liên tục | 120 | Tia laser **trúng ngay**, tầm 560, xuyên mọi quái |
| Ripper Disc | — | 11 | 1.400 | 34, xuyên không giới hạn (không giảm sát thương) | 380 ms | 8 | Đĩa cưa **nảy khỏi tường** tối đa 3 lần |

Sát thương nổ (Boomer, Bolt, Hornet) giờ cũng được nhân theo linh kiện Nòng Tăng Lực và thẻ sát thương. Phím 1–9 và 0 chọn súng 1–10; súng thứ 11 trở đi dùng Q / cuộn chuột. Kho súng nhiều hơn 8 khẩu thì HUD hiện dạng gọn.

Với Rifle, nếu nhặt tối đa D5 + F5, DPS lên khoảng 510 (gấp 2,8 lần). Muốn đạt mức đó phải tích cực phá thùng và làm thử thách. Gate 08–10 thưởng linh kiện hiếm thay vì súng.

## 6c. Trận boss: điểm yếu, gục choáng, khắc hệ, siêu chiêu (v6.4 → v6.6)

**v6.6 — cân lại nhịp boss & tự cân bằng theo tay chơi** (`MB.Boss` trong `js/arsenal.js`, ghi đè các số v6.4 bên dưới):
- **Quả tim virus thay cho vòng đỏ + chữ "ĐIỂM YẾU":** một khối thịt đỏ cam có gân mọc ra trên thân boss, phập phồng theo nhịp tim (âm `heartbeat`), trúng thì máu cam toé ra + tiếng "phụt" (`weakhit`), không hiện chữ. Lần đầu gặp, Hunter nói qua bộ đàm: "Có thứ gì đang đập phập phồng trên thân nó… Nhắm vào đó!" (chỉ 1 lần, `sv.heartTold`). 3D có mô hình riêng (`R3.updateHeart`).
- **Nhịp trận (v8.1 siết lại):** bỏ giảm 15% máu boss Gate 5+, boss Màn 2 thêm 10% máu; cấp thường máu ×1,15; quả tim lộ **3,5 s / 10 s** (cấp khó 3 s/12 s, tinh nhuệ 2,5 s/14 s), nhỏ hơn, lấp ló trên thân (không còn nhô ra), vùng trúng hẹp lại, ×1,6 sát thương; mọi cấp đều xoay người che tim; thanh choáng 20% máu; boss Gate 8+ luôn đổi lối đánh ở 66%/33%; tổng hệ số nhân tối đa **×2** (trước ×2,5); hết choáng → **BOSS NỔI ĐIÊN 5 giây** (AI chạy nhanh ×1,5, di chuyển ×1,3, hào quang đỏ); sau đó **20 giây** mới tích thanh choáng lại (thanh xám).
- **Tự cân bằng âm thầm:** mỗi trận boss ở Chiến dịch chấm điểm theo thời gian hạ boss (mục tiêu ~62 giây) và máu còn lại, trừ nếu phải đấu lại; thua boss = −0,8. Lưu trung bình trượt `sv.bossRating` (−1…1). Cấp: **0 thường** (≤0,45) · **1 khó** (>0,45) · **2 tinh nhuệ** (>0,75). Thử nhanh: `?bosstier=0|1|2`.

| | Thường | Khó | Tinh nhuệ |
|---|---|---|---|
| Máu boss | ×1 | ×1,2 | ×1,4 |
| Quả tim lộ / nghỉ | 6 s / 5 s | 4,2 s / 7 s | 3,5 s / 8 s |
| Sát thương vào tim | ×2 | ×1,7 | ×1,6 |
| Thanh choáng (máu boss) · tăng mỗi lần · thời gian choáng | 13% · ×1,2 · 4 s | 18% · ×1,3 · 3 s | 22% · ×1,35 · 2,5 s |
| Thùng đạn hạng nặng | 22 s | 32 s | 40 s |
| Sức siêu chiêu lên boss | 100% | 75% | 60% |
| Boss xoay người che tim | — | 0,6 rad/s | 0,95 rad/s |
| Đổi lối đánh ở 66% / 33% máu | — | gọi 4–5 quái + vòng 14 đạn; từ 33% bắn vòng đạn 6,5 s/lần | gọi 5–6 quái + vòng 18 đạn; từ 66% bắn vòng 5 s/lần |
| Xu khi thắng | ×1 | ×1,25 | ×1,5 |


Mục tiêu: trận boss còn khoảng 45–75 giây thay vì 2–3 phút "bắn tạch tạch".

- **Điểm yếu:** cứ khoảng 5 giây boss lộ một vòng đỏ ở mép thân (lệch 30–70° khỏi hướng Hunter, kéo dài 6 giây). Đạn trúng phía đó gây **×2**. Hiện chữ "ĐIỂM YẾU ×2".
- **Gục choáng:** thanh vàng mảnh dưới thanh máu boss. Đủ sát thương (13% máu boss, lần sau +20%) → boss **choáng 4 giây**, không di chuyển/tấn công, nhận **+50%** sát thương.
- **Khắc hệ (×1,5):** Lửa (Pyro) · Băng (Cryo) · Điện (Arc Plasma, Lumen Beam) · Nổ (Boomer, Bolt X, Hornet). Thanh boss ghi "KHẮC CHẾ: SÚNG …".

| Boss | Khắc | Boss | Khắc |
|---|---|---|---|
| Spider Queen (1) | Lửa | Assembler Mech (7) | Điện |
| Stone Behemoth (2) | Nổ | Abomination (8) | Lửa |
| Toad King (3) | Lửa | Specimen Omega (9) | Băng |
| Cryo Wyrm (4) | Lửa | The Origin (10) | Điện |
| Magma Titan (5) | Băng | Sát Thủ Bóng Đêm (11) | Nổ |
| Kraken (6) | Điện | Mãng Xà Đèn Lồng (12) | Băng |

- **Tiếp tế đạn hạng nặng:** trong trận boss, giây 12 rồi cứ 22 giây thả 1 thùng (dù, sọc vàng "AP") gần Hunter: +40 nộ, nạp đầy mọi súng, **đạn xuyên giáp 10 giây** (+40% sát thương lên boss).
- Các hệ số nhân với nhau nhưng tối đa ×4.
- **Thanh NỘ & siêu chiêu:** nộ tăng khi gây sát thương (1,8% sát thương, tối đa 6/lần) và hạ quái (+1,5; tinh nhuệ +6), tích suốt trận. Khi boss xuất hiện, game dừng để **chọn 1 trong 3 siêu chiêu** (mỗi lần gặp boss chọn lại, kể cả đấu lại boss và Sinh tồn). Nộ đầy → nút **SIÊU** (cảm ứng) / phím **X** / nút Back hoặc R3 (tay cầm):
  - **Pháo kích vệ tinh:** 5 cột pháo trong ~2,5 giây (3 phát nhắm boss), mỗi phát ~3% máu boss + 280 sát thương diện rộng.
  - **Laser quét:** 3 giây, theo hướng ngắm, ~12% máu boss, 600 sát thương/giây lên quái thường.
  - **Drone tự bắn:** 10 giây, 8 phát/giây, ~12% máu boss.
- Đấu lại boss: thanh nộ được nạp đầy.

## 6a. Nâng cấp nhân vật, thẻ nâng cấp, combo (v5.3)

**Xu & cửa hàng (vĩnh viễn).** Sau mỗi trận (thắng hay thua) nhận xu = điểm ÷ 80 + 40/thử thách + 120 nếu thắng (+15/wave ở Sinh tồn). Mua ở màn *Chọn cửa ải → NÂNG CẤP NHÂN VẬT* (hoặc nút NÂNG CẤP ở màn kết quả). Giá cấp kế = giá gốc × (1 + 0,8 × cấp hiện tại).

| Nâng cấp | Mỗi cấp | Tối đa | Giá gốc |
|---|---|---|---|
| Thể lực | +12 máu tối đa | 5 | 120 |
| Giáp khởi đầu | +12 giáp khi vào trận | 5 | 120 |
| Đạn xuyên giáp | +6% sát thương mọi súng | 5 | 180 |
| Tay nhanh | −8% thời gian nạp đạn | 5 | 100 |
| Túi lựu đạn | +1 lựu đạn mang theo | 2 | 260 |
| Phản xạ | −10% hồi chiêu lộn né | 3 | 140 |
| Nam châm | +40% tầm hút vật phẩm | 3 | 80 |

**Thẻ nâng cấp trong trận.** Hết mỗi wave (và sau mỗi boss ở Sinh tồn) game tạm dừng, cho chọn 1 trong 3 thẻ. Hiệu lực đến hết trận. Máu dưới 50% thì dễ ra thẻ Băng gạc.

| Thẻ | Hiệu ứng | Tối đa |
|---|---|---|
| Đạn nặng | +15% sát thương | 5 |
| Cò nhạy | +12% tốc độ bắn | 5 |
| Băng đạn lớn | +30% băng đạn | 3 |
| Đạn xuyên | Xuyên thêm 1 quái | 2 |
| Chí mạng | 12% cơ hội ×2,5 sát thương | 3 |
| Hút máu | Hạ 1 quái hồi 2 máu | 3 |
| Xác nổ | Quái chết nổ lan (chặn chuỗi nổ quá 2 tầng) | 2 |
| Chân nhanh | +10% tốc chạy | 3 |
| Vệt lửa | Lộn né để lại 3 đốm lửa đốt quái | 1 |
| Kíp nổ nhanh | Lựu đạn hồi nhanh hơn 35%, +1 quả ngay | 2 |
| Áo giáp | Giáp tối đa +20, nạp đầy | 3 |
| Băng gạc | Hồi 45% máu | không giới hạn |

**Combo.** Hạ quái liên tiếp trong 2,6 giây để nối combo; từ ×3 hiện trên màn hình. Điểm mỗi quái × (1 + 5% × (combo − 1)), tối đa ×2. Trúng đòn là mất combo. Mốc ×10, ×20… có khựng hình và rung.

**Cảm giác bắn.** Khựng hình ngắn khi hạ quái tinh nhuệ (0,05 giây), boss chuyển phase (0,12 giây, kèm chữ *BOSS NỔI ĐIÊN*) và hạ boss (0,22 giây). Rung điện thoại khi trúng đòn, nổ gần, boss đổi phase, hạ boss, gục ngã (tắt được trong Cài đặt → *Rung điện thoại*).

**Chế độ Sinh tồn Bất tận (v6.2).** Thay cho sinh tồn từng Gate: bấm **SINH TỒN → BẮT ĐẦU** để chiến đấu một chuỗi liên tục xuyên qua **mọi Gate đã qua ở Chiến dịch** (theo thứ tự, hết thì quay vòng). Mỗi khu vực = 4 wave + 1 boss; hạ boss → hồi 25% máu, chọn thẻ nâng cấp, tự chuyển sang bản đồ kế tiếp. Máu, giáp, súng, đạn, linh kiện, thẻ nâng cấp, điểm, combo được **mang theo suốt chuỗi**; wave tiếp tục đếm (quái mạnh dần +9%/wave, trộn quái của bản đồ hiện tại, boss sau mỗi lần gặp lại trâu hơn +35%). Không có đấu lại boss. Kỷ lục lưu ở `Save.data.endless = {wave, score, stage}`; bảng xếp hạng Sinh tồn dùng mã gate **30** (một bảng chung).

**Đấu trường Sinh tồn — line độc lập (v8.2).** Màn chọn cửa có 2 thẻ thế giới lớn **CHIẾN DỊCH** (xanh) / **SINH TỒN** (đỏ) (+ **CHU KỲ+** khi đã mở); chọn Sinh tồn thì cả màn chuyển tông đỏ thẫm, tiêu đề "ĐẤU TRƯỜNG", phần giới thiệu hùng hồn, luật chơi, trạng thái hôm nay, chuỗi chiến trường, thanh chi phí server + nút ☕ tiếp tế (nhắc khéo ở chân trang).
- **Bắt buộc đăng nhập** ngay từ đầu (lưu khu vực, trạng thái, giờ chiến). Tiến trình dùng chung tài khoản với Chiến dịch.
- **Vào thẳng được**: chuỗi chiến trường gồm **10 bản đồ Màn 1 mở sẵn**; bản đồ Màn 2 nhập chuỗi khi đã qua cửa đó ở Chiến dịch (vẫn tôn trọng cửa đóng trong admin + thu phí).
- **Giới hạn mỗi ngày** (tính trên máy chủ theo tài khoản, chỉ đếm lúc đang đánh — tạm dừng không tính, reset 0h giờ VN): chưa tiếp tế **45 phút**, gục là hết; **người tiếp tế 120 phút + hồi sinh tại chỗ 2 lần/ngày** (sống lại đúng chỗ gục, đầy máu/giáp/đạn, giữ wave–boss–điểm, đẩy lùi quái quanh mình). Admin chỉnh trong trang quản trị (Người tiếp tế → "Giới hạn Đấu trường Sinh tồn"); admin không bị giới hạn. Đồng hồ ⏱ trong HUD, cảnh báo còn 10/5/1 phút; hết giờ → "ĐẤU TRƯỜNG TẮT ĐÈN", giữ khu vực cho hôm sau. SQL: bảng `mb_surv_day`, hàm `mb_surv_status()`, `mb_surv_tick(p_sec)` (tối đa 90 s/lần), `mb_surv_revive()`, cấu hình `mb_config.survival`. Mất mạng → ước lượng tạm trên máy, gửi bù khi có mạng.
- **Điểm lưu**: đầu mỗi khu vực ghi `Save.data.survRun = {chain, i, carry, stage, ts}` (đồng bộ mạng, lấy bản mới hơn khi ghép) → thoát giữa chừng / hết giờ / đổi máy thì vào lại đúng khu vực đó ("▶ TIẾP TỤC KHU VỰC N" hoặc "TRẬN MỚI"). Gục (không hồi sinh) thì xoá điểm lưu.
- Người chưa tiếp tế gục sau wave 5: màn kết quả nhắc nhẹ quyền lợi người tiếp tế (1 lần mỗi phiên). **Bảng xếp hạng không còn hiện ☕** — thông tin tiếp tế không công khai.

**Độ khó tự điều chỉnh — Ác mộng âm thầm (v6.2).** Mỗi lần thắng một Gate ở Chiến dịch, game chấm điểm kỹ năng 0–1: độ chính xác (35%, tối đa ở 55%), né đòn = số đòn trúng mỗi phút (30%, 0 đòn = tối đa, ≥6 đòn/phút = 0), máu còn lại (20%), số lần thua trước khi qua (15%), trừ 0,15 nếu phải dùng đấu lại boss. Lưu ở `gates[id].skill`.
- Qua đủ Gate 1–7 với **điểm trung bình ≥ 0,6** → từ **Gate 8 trở đi** (gồm cả Màn 2) game **âm thầm** bật Ác mộng: quái thường máu ×1,35, sát thương ×1,2, tốc độ ×1,07; boss máu ×1,3, sát thương ×1,15; thêm 8% quái tinh nhuệ; quái ra nhanh hơn 15%. Bù lại: điểm quái ×1,25 và xu cuối trận ×1,3. Không có thông báo nào.
- Điểm trung bình < 0,6 → độ khó bình thường tới hết Gate 10 rồi sang Màn 2 như cũ.
- **Lưới an toàn:** thua 2 lần liền ở một Gate thì Gate đó trở về độ khó thường cho tới khi thắng.
- Thử nghiệm: thêm `?nightmare=1` (ép bật) hoặc `?nightmare=0` (ép tắt) vào cuối link.

## 6b. Giải vây và tiếp tế

| Công cụ | Cách dùng | Hiệu ứng | Giới hạn |
|---|---|---|---|
| **Lựu đạn** | G / nút LỰU / RB | Ném tới điểm ngắm (tối đa 460). Nổ bán kính 140: sát thương 140 ở tâm, giảm còn 70 ở rìa; hất văng quái (trừ boss); phá được thùng và ổ virus (120) | Mang tối đa 3, bắt đầu với 2, tự hồi 1 quả mỗi 15 s. Nhặt thêm từ thùng tiếp tế (tỉ lệ 2/12), quái tinh nhuệ (35%) |
| **Xung kích** | F hoặc E / nút XUNG / B | Sóng quanh người bán kính 230: sát thương 50, đẩy lùi mạnh, **làm choáng 1,3 s** (quái chuyển xanh), xoá đạn địch trong vùng, bất tử 0,35 s | Hồi chiêu 18 s |
| **Thùng y tế thả dù** | Tự động | Khi HP dưới 35%: thả dù 2 bộ máu + 1 giáp hoặc lựu đạn, cách 150–230, có mũi tên xanh lá chỉ đường | Tối đa 1 lần mỗi 40 s |
| **Rơi máu khi yếu** | Tự động | HP dưới 40%: tỉ lệ quái rơi bộ máu tăng từ 5,5% lên 14% | |

## 7. Nhân vật Hunter

| Thông số | Giá trị |
|---|---|
| HP | 100 |
| Giáp | Tối đa 60, đỡ sát thương trước HP |
| Tốc độ | 235 (chạy nhanh ×1,5; đang bắn ×0,88; trong hồ virus ×0,8; dính mạng nhện ×0,55) |
| Thể lực | 100; chạy nhanh tốn 30/s, lộn né tốn 18. Cạn thể lực thì phải hồi tới 35 mới chạy lại được |
| Lộn né | 0,19 s, tốc độ 700, bất tử 0,3 s, hồi chiêu 1 s |
| Sau khi trúng đòn | Bất tử 0,55 s, bị đẩy lùi |

**Ngoại hình (v6.3 — "Operator", theo ảnh concept của chủ dự án):** áo chiến đấu đen than xắn tay tới khuỷu, áo giáp tấm nâu ô liu với hàng túi đạn + quai vai, thắt lưng và túi hông, ba lô chiến thuật (có bình lọc sinh học nhỏ phát sáng xanh bên hông), mũ trùm cổ, tóc nâu sẫm rối, bảo vệ gối, bốt da, găng đen, bao súng ngắn ở đùi phải. **Điểm nhận diện:** phù hiệu cánh-kiếm phát sáng cyan trên vai trái + vòng cyan dưới chân (bảng màu mới tối, nên cần 2 điểm sáng này để không chìm trên map tối). Súng trường AR-7 có ống ngắm chấm đỏ, tay nắm trước, giảm thanh (`tip` 48). Chân quay theo hướng chạy, thân quay theo hướng ngắm. Hoạt ảnh: bước chân, giật súng, chớp nòng, vỏ đạn, nghiêng súng khi nạp, bóng mờ khi lộn né, chớp đỏ khi trúng đòn. 2D vẽ trong `hero.js`, 3D dựng trong `render3d.js → buildHero()`.

**Hình ảnh nhân vật (v6.3):** ảnh concept dùng làm key art ở menu (bên phải trên máy tính, mờ phía sau trên điện thoại), khẩu hiệu đội **SURVIVE · CONTAIN · ELIMINATE** + phù hiệu cánh-kiếm (SVG vẽ lại) dưới tên game, màn **HỒ SƠ HUNTER** (ảnh hồ sơ đầy đủ, trang bị, thống kê tác chiến lấy từ tiến trình), chân dung Hunter trong khung thoại cảnh truyện và bộ đàm trong trận; bóng Hunter trong cảnh truyện đổi sang tóc rối + mũ trùm cổ + ba lô.

## 8. Quái vật

| Quái | HP | Tốc độ | Sát thương | Điểm | Hành vi |
|---|---|---|---|---|---|
| Zombie | 60 | 62 (+ dồn lên theo nhịp) | 10 | 100 | Đi theo đàn, áp sát |
| Spider | 34 | 125, chạy zigzag | 8 | 140 | Ở gần dưới 190 thì khom 0,3 s rồi vồ tới (420) |
| Licker | 85 | 100 (135 khi ở xa) | 12 | 220 | Ở cách 60–270 thì dừng, hiện **vạch đỏ** 0,55 s rồi phóng lưỡi |
| Bat *(G02)* | 26 | 160, bay | 7 | 120 | Lượn vòng quanh người chơi rồi bổ nhào; bay qua cả vật cản và vực |
| Brute *(G02)* | 260 | 50 | 18 | 420 | Hiện vạch đỏ 0,85 s rồi húc (470). Đâm vào vật cản thì bị choáng 1,5 s và nhận **×2** sát thương |
| Bloater *(G03)* | 70 | 52 | 22 (nổ) | 180 | Lao tới, phồng lên 0,75 s (vòng đỏ) rồi tự nổ bán kính 110, để lại vũng axit; bị bắn chết cũng nổ nhỏ |
| Lurker *(G03)* | 95 | 92 (×1,6 khi lặn) | 14 | 240 | Lặn dưới bùn (chỉ thấy gợn sóng, không bắn trúng), trồi lên cắn ở vòng đỏ, nổi 2,4 s rồi lặn lại |
| Frost Zombie *(G04)* | 85 | 56 | 12 | 150 | Chạm vào làm người chơi **đóng băng chậm** 1,4 s |
| Ice Wraith *(G04)* | 55 | 115, bay | 8 | 200 | Giữ khoảng cách 160–340, vạch đỏ rồi bắn 3 mũi băng (làm chậm) |
| Magma Imp *(G05)* | 55 | 150 | 10 | 160 | Rất nhanh, để lại vệt lửa phía sau; chạm vào gây bỏng |
| Ember Spitter *(G05)* | 80 | 60 | 14 (nổ) | 200 | Ném cầu lửa vòng cung vào vòng đỏ dưới chân người chơi, để lại lửa |
| Cinder Golem *(G05)* | 300 | 45 | 16 | 420 | Lại gần 170 thì vòng đỏ 0,8 s rồi đập đất tạo sóng chấn |
| Crab Mutant *(G06)* | 120 | 72, bò ngang | 14 | 260 | Càng chặn **85%** sát thương bắn trực diện; bắn sườn/sau nhận thêm 25% |
| Drowned *(G06)* | 80 | 70 | 13 | 190 | Lặn dưới nước (gợn sóng xanh) rồi trồi lên tóm |
| Drone *(G07)* | 50 | 130, bay | 12 | 190 | Vạch đỏ rồi bắn tia laser rất nhanh |
| Sludge / Sludgeling *(G07)* | 110 / 30 | 55 / 120 | 14 / 7 | 220 / 60 | Sludge chết tách thành 2 Sludgeling và để vũng dầu trơn |
| Runner *(G08)* | 35 | 175 | 8 | 80 | Rất nhanh, đi theo bầy; sự kiện "Bầy đàn" thả 10 con một lúc |
| Riot *(G08)* | 160 | 62 | 16 | 280 | Khiên chống bạo động chặn **90%** đạn trực diện |
| Clone Soldier *(G09)* | 90 | 95 | 8 × 3 | 240 | Chạy vòng, vạch đỏ rồi bắn loạt 3 viên |
| Phase Stalker *(G09)* | 75 | 110 | 16 | 280 | Gần như tàng hình, mờ đi rồi hiện ra sau lưng người chơi và lao chém |
| Sentry *(G09)* | 260 | đứng yên | 9 × 2 | 300 | Tháp súng canh gác các phòng, quay theo người chơi khi thấy |

Quái tinh nhuệ (viền tím) xuất hiện với tỉ lệ 5–22% tuỳ Gate/wave. Từ Gate 03, máu quái nhân hệ số của Gate (×1,1 → ×1,85) và sát thương (×1,05 → ×1,35).

**Dẫn đường:** khi không có đường thẳng tới người chơi (bị tường, nhà, kênh nước chặn), quái đi theo bản đồ dẫn đường (flow field, ô 50 đơn vị, tính lại mỗi 0,35 s) để vòng qua cửa, cầu, hẻm. Quái bay và quái đang lặn đi thẳng.

### Boss

| Boss | HP | Phase | Kỹ năng |
|---|---|---|---|
| **Spider Queen** (G01) | 4.200 | 1: trên 60% · 2: 25–60% · 3: dưới 25% | Bắn quạt 5/7 viên độc; gọi nhện con (tối đa 8 con cùng lúc); từ P2: lao tới có vạch báo trước, bắn mạng nhện làm chậm; P3: bắn xoáy 3 tia. Đâm vào vật cản thì choáng 1,3 s, nhận +50% sát thương |
| **Stone Behemoth** (G02) | 6.000 | 1: trên 55% · 2: 25–55% · 3: dưới 25% | Đập đất tạo vòng sóng chấn (vòng đỏ báo trước, lộn né để xuyên qua); ném tảng đá vỡ thành 6 mảnh; từ P2: húc, gọi 3 dơi; P3: sóng chấn kép. Đâm vào vật cản thì choáng 1,6 s, nhận +60% sát thương |
| **Toad King** (G03) | 6.500 | 60% / 25% | Nhảy đè xuống vòng đỏ (trên không chỉ nhận 20% sát thương), tiếp đất tạo sóng chấn + bùn; lúc vừa tiếp đất nhận ×1,4. Phóng lưỡi **kéo** người chơi lại gần, khạc 3 cục axit. P2 gọi Bloater, P3 khí độc phun quanh nó |
| **Cryo Wyrm** (G04) | 7.600 | 60% / 25% | Rắn băng 10 đốt, chỉ **đầu** nhận sát thương, thân chạm vào gây sát thương. Lặn dưới tuyết (miễn nhiễm), trồi lên ở vòng đỏ dưới chân người chơi rồi choáng 1,2 s (×1,5). Phun hơi băng hình nón, P2 bắn vòng cầu băng, P3 trồi lên 2 lần liên tiếp + gọi Ice Wraith |
| **Magma Titan** (G05) | 9.000 | 60% / 25% | Vỏ đá giảm 50% sát thương. Phun lửa quét ngang, gọi thiên thạch, đập đất sóng chấn; sau mỗi đòn lớn **lõi mở** (×1,6). P2 gọi Magma Imp, P3 để lại lửa khi đi |
| **Kraken** (G06) | 8.000 | 60% / 25% | Nằm giữa đầm, chỉ trồi đầu khi **4 xúc tu** bị phá hết (5,5 s, nhận ×1,6). Xúc tu đập theo dải đỏ. Phun nước vòng cung, phun **mực che màn hình**. P2 gọi Drowned, P3 xoáy nước kéo người chơi vào |
| **Assembler Mech** (G07) | 9.500 | 60% / 25% | Giáp giảm 40%. Mưa tên lửa vào các vòng đỏ, **tia laser quét vòng** (vạch đỏ báo trước, lộn né để qua); sau khi quét bị **quá nhiệt** 2,8 s (×2). P2 thả 3 Drone, P3 tên lửa kép |
| **Abomination** (G08) | 11.000 | 60% / 25% | Húc theo vạch đỏ, đâm vào **toà nhà** thì choáng 1,5 s (×1,6). Ném xác xe vào vòng đỏ, nôn axit hình nón. P2 đẻ 4 Runner, P3 húc 2 lần liên tiếp |
| **Specimen Omega** (G09) | 11.500 | 60% / 25% | Dịch chuyển rồi bắn vòng đạn, **lưới laser** cả vùng (dải đỏ báo 1 s, đứng vào khe trống). P2 tạo 3 bản sao nhấp nháy (chết thì nổ), P3 hút người chơi rồi nổ xung kích |
| **The Origin** (G10) | 16.000 | 75% / 50% / 25% | Bắn xoắn ốc liên tục. P1: lá chắn miễn nhiễm, phải phá **4 nút năng lượng**. P2: gọi xúc tu quanh người chơi. P3: dịch chuyển + lưới laser. P4: sóng chấn, mưa sét đỏ, gọi quái tinh nhuệ |

Boss xuất hiện theo hướng đấu trường, cách người chơi tối đa khoảng 650 đơn vị.

## 9. Các Gate

| Gate | Trạng thái | Cơ chế riêng | Quái | Boss | Thử thách → Thưởng |
|---|---|---|---|---|---|
| 01 Jungle | ✅ | Hồ virus (10–12 HP/s, làm chậm), cây, đá, khúc gỗ | Zombie, Spider, Licker | Spider Queen | Phá 3 ổ virus (ổ sinh nhện) → **Shotgun** · Giữ trạm tín hiệu 12 s → **Lõi Xuyên Phá** · 12 hạ gục liên tiếp không trúng đòn → **Cò Siêu Tốc** |
| 02 Mountain | ✅ | Vực sâu (chặn đi bộ, đạn bay qua), 3 làn đá lăn (vạch đỏ báo 1,5 s; 25 sát thương, nghiền quái), vách đá | + Bat, Brute | Stone Behemoth | Phá 4 tinh thể virus → **SMG** · Giữ trạm radio 14 s → **Bộ Chia Tia** · 15 hạ gục không trúng đòn → **Nòng Tăng Lực** |
| 03 Swamp | ✅ | Bùn lún (đi chậm ×0,55), hồ axit, khí độc phun lên quanh người chơi (vòng đỏ 1,1 s), cầu ván | + Bloater, Lurker | Toad King | Phá 4 túi bào tử → **Rail Lancer** · Trạm lọc nước 14 s → Băng Đạn · 15 hạ gục → Lõi Xuyên Phá |
| 04 Snow | ✅ | Băng trơn trượt, hồ băng lớn, **bão tuyết** mỗi 20–26 s (10 s, tầm nhìn thu hẹp, đi chậm) | + Frost Zombie, Ice Wraith | Cryo Wyrm | Phá 4 cột băng → **Pyro F-9** · Lò sưởi 14 s → Nòng Tăng Lực · 15 hạ gục → Cò Siêu Tốc |
| 05 Volcano | ✅ | 2 sông dung nham (22 HP/s + bỏng, đốt cả quái) có cầu đá, thiên thạch rơi, đợt **phun trào** mỗi 35–45 s | + Magma Imp, Ember Spitter, Cinder Golem | Magma Titan | Phá 4 miệng phun → **Boomer GL** · Trạm làm mát 14 s → Bộ Chia Tia · 16 hạ gục → Nòng Tăng Lực |
| 06 Ocean | ✅ | Kênh nước sâu (chỉ qua bằng 4 cầu ván, đạn bay qua được), nước nông làm chậm, **thuỷ triều** dâng 10 s | + Crab, Drowned | Kraken | Phá 4 phao sonar → **Arc Plasma** · Hải đăng 14 s → Lõi Xuyên Phá · 16 hạ gục → Băng Đạn |
| 07 Industrial | ✅ | 3 băng chuyền đẩy người/quái, 14 **thùng hoá chất nổ** (bắn để diệt đám đông), 3 hàng rào laser bật/tắt 3 s, vũng dầu trơn | + Drone, Sludge | Assembler Mech | Phá 4 máy phát → **Tempest MG** · Bảng điều khiển 15 s → Bộ Chia Tia · 18 hạ gục → Cò Siêu Tốc |
| 08 City | ✅ | Phố giữa các khối nhà, **ô tô nổ được**, đám cháy, sự kiện **bầy đàn** Runner mỗi 32–40 s | + Runner, Riot | Abomination | Phá 4 ổ zombie → Bộ Chia Tia · Trạm cứu hộ 16 s → Lõi Xuyên Phá · 20 hạ gục → Cò Siêu Tốc |
| 09 Laboratory | ✅ | 3 tia laser **quay vòng**, 2 cặp **bệ dịch chuyển**, 4 tháp súng, rò rỉ khí độc | + Clone, Phase Stalker, Sentry | Specimen Omega | Phá 4 máy chủ → Nòng Tăng Lực · Phòng điều khiển 16 s → Bộ Chia Tia · 22 hạ gục → Băng Đạn |
| 10 Apocalypse | ✅ | Virus **lan rộng** theo thời gian, sét đỏ đánh xuống, **4 wave** quái của mọi Gate | Tất cả | The Origin | Phá 4 khe nứt → Bộ Chia Tia · Thiết bị phong ấn 18 s → Lõi Xuyên Phá · 25 hạ gục → Nòng Tăng Lực |
| **11 Hà Nội** · Hồ Gươm lúc hoàng hôn | ✅ v6.0 | **Hồ Gươm** nước xanh lục (đạn bay qua, người không lội được), **Tháp Rùa** giữa hồ, **cầu Thê Húc** đỏ là lối duy nhất vào **Đền Ngọc Sơn**, **Tháp Bút**, **Tháp Hoà Phong**, liễu rủ + lộc vừng ven hồ, phố cổ nhà ống (mái ngói / sân thượng bồn nước inox, biển hiệu PHỞ BÒ, BÚN CHẢ…, dây điện chằng chịt), **hàng xe máy bắn nổ được** | + Drone GoatEvil (bay, bắn 3 tia), Xe Ôm Zombie (lấy đà rồi lao thẳng) | **Sát Thủ Bóng Đêm** (tàng hình khi rình, chém lướt, phi tiêu, phân thân, bom khói) | Phá 4 ăng-ten GoatEvil → Nòng Tăng Lực · Giữ Đền Ngọc Sơn 15 s → Bộ Chia Tia · 18 hạ gục → Cò Siêu Tốc |
| **12 Hội An** · Phố cổ đêm đèn lồng | ✅ v6.0 | **Ban đêm**: chỉ thấy rõ quanh đèn lồng / Hunter; **Chùa Cầu** (cầu có mái bắc qua rạch), nhà cổ tường vàng mái ngói âm dương phủ rêu, **dây đèn lồng** giăng phố, **cổng Hội quán Phúc Kiến**, sông Hoài với **thuyền gỗ & hoa đăng** trôi, hoa giấy | + Ma Đèn Lồng (bay, tự nổ lửa tím), Thuỷ Xà (lặn rồi trồi lên đớp) | **Mãng Xà Đèn Lồng** (thân là chuỗi đèn lồng gây bỏng, phun cầu lửa, chui xuống lòng phố rồi phóng lên, xả vòng lửa) | Phá 4 đèn ma → Lõi Xuyên Phá · Giữ Chùa Cầu 15 s → Băng Đạn · 20 hạ gục → Bộ Chia Tia |
| **13 Hạ Long** · Vịnh di sản lúc hoàng hôn | ✅ v6.8 | Biển **chặn đi bộ, đạn bay qua**; đi trên **cầu ván, bè làng chài nổi, đảo, bãi cát**; **đảo đá vôi** (che khuất, mờ khi Hunter đứng sau), **Hòn Trống Mái** trên đảo có đài ngắm, làng chài Cửa Vạn (nhà bè nhiều màu), **thuyền buồm nâu & thuyền thúng** trôi, vách đá có **hang Sửng Sốt** | + Sứa Điện (bay, bắn 3 cầu điện), Cua Đột Biến (mai cứng phía trước, lấy đà rồi lao) | **Thuỷ Long Vịnh Hạ** (bơi dọc bờ, phun nước quét, đập đuôi tạo sóng xung kích, lặn rồi trồi lên, dâng **tường sóng có khe hở**, gọi sứa từ giai đoạn 2; khi lặn thì miễn sát thương) | Phá 4 thùng lạnh GoatEvil → Nòng Tăng Lực · Giữ đài Trống Mái 15 s → Cò Siêu Tốc · 20 hạ gục → Bộ Chia Tia |
| **14 Sa Pa · Fansipan** · Ruộng bậc thang trong sương | ✅ v6.9 | **Bờ ruộng bậc thang** chặn đi bộ (đạn bay qua) — tìm lối lên xuống; bản H'Mông (nhà gỗ mái pơ mu, giàn ngô, sạp thổ cẩm), **ga cáp treo** + cabin chạy giữa mây, rừng pơ mu – đỗ quyên, suối Thác Bạc (đi chậm), **cầu treo qua vực mây**, chóp Fansipan 3.143 m. **Sương mù** tràn xuống theo đợt (12 s, chỉ thấy quanh Hunter và Dian). **Đồng đội Dian** xuất hiện ở wave 1 | + Dê Núi Đột Biến (lấy đà húc, đâm vào vật cản thì choáng), Bóng Sương (gần như vô hình, vồ từ trong sương) | **Dê Chúa Hoàng Liên** (húc lao 1–3 lần liên tiếp — **dụ nó đâm vào đá tảng thì gục choáng**, nhảy dậm, phun băng làm chậm, hú gọi sương + Bóng Sương, giai đoạn 3 lở đá theo làn) | Phá 4 đèn sương đầu dê → Lõi Xuyên Phá · Giữ ga cáp treo 16 s → Băng Đạn · 22 hạ gục → Cò Siêu Tốc |
| **15 Huế** · Kinh thành trong đêm mưa | ✅ v6.9 | **Đêm mưa**: chỉ sáng quanh đèn lồng cung đình; **sấm** theo đợt — chớp sáng cả kinh thành rồi sét đánh 2 điểm gần Hunter (vòng báo trước). Sông Hương + thuyền rồng, **cầu Trường Tiền** (vòm thép), tháp Phước Duyên (Thiên Mụ), **Kỳ Đài**, hào thành phủ sen, tường thành, **Ngọ Môn** lầu Ngũ Phụng, hồ Thái Dịch + cầu Trung Đạo, sân Đại Triều Nghi, **điện Thái Hòa**, Hiển Lâm Các + **Cửu Đỉnh**, Duyệt Thị Đường. Dian hỗ trợ qua bộ đàm | + Thị Vệ Xác Sống (giáo quét hình quạt), Kẻ Gọi Sét (gọi sét xuống chỗ Hunter) | **Nghê Đá Hoàng Cung** (vồ, phun đá vụn hình quạt, gầm sóng chấn; giai đoạn 2 gọi **3 ngọc giáp** xoay quanh — còn ngọc thì chỉ nhận 15% sát thương, vỡ hết ngọc thì choáng 3 s; giai đoạn 3 sét đánh liên tục) | Phá 4 ấn bùa đầu dê → Bộ Chia Tia · Giữ Kỳ Đài 16 s → Nòng Tăng Lực · 24 hạ gục → Lõi Xuyên Phá |
| **16 Đà Nẵng** · Cầu Rồng & Cầu Vàng | ✅ v7.6 | Biển **Mỹ Khê** + bãi cát, **sông Hàn** chặn đi bộ (đạn bay qua) với **Cầu Rồng** và cầu sông Hàn; định kỳ **đầu rồng phun lửa** (vạch cam báo trước 1,6 s) phủ kín mặt cầu; phía Tây là đèo Bà Nà và **Cầu Vàng** uốn cong giữa biển mây (rơi khỏi cầu = không đi được). **Dian đánh cùng** từ đầu | + Bọ Cát (đào dưới cát rồi trồi lên), Robot Tuần Cầu (khiên phía trước, bắn) | **Cự Nhân Đá Bà Nà** (đầu đá giữa biển mây, hai **bàn tay đá** đập/quét/kẹp dọc Cầu Vàng, mắt bắn tia) | Phá 4 trạm phát sóng → Nòng Tăng Lực · Giữ đầu Cầu Rồng 16 s → Bộ Chia Tia · 24 hạ gục → Cò Siêu Tốc |
| **17 Đà Lạt** · Thành phố ngàn hoa | ✅ v7.6 | **Hồ Xuân Hương** (nước chặn đi bộ), **Ga Đà Lạt** 3 mái nhọn + đường ray — **đoàn tàu chạy theo đợt** (ray chớp đỏ 2,2 s, tàu cán cả Hunter lẫn quái), rừng thông, luống hoa, **đồi nhà kính** đánh số (boss ở nhà kính số 9). Dian hỗ trợ qua bộ đàm | + Dây Leo Gai (luồn dưới đất rồi quất), Bướm Phấn Độc (bay, vỡ ra đám phấn làm chậm) | **Đoá Dã Quỳ Khổng Lồ** (đứng yên: dây leo quất theo vòng xanh, bắn hạt hình quạt, vòng phấn độc ở giai đoạn 2, gọi bướm, giai đoạn 3 hạt xoay vòng) | Phá 4 bầu ươm → Lõi Xuyên Phá · Giữ sân ga 16 s → Băng Đạn · 25 hạ gục → Bộ Chia Tia |
| **18 Sài Gòn** · Thành phố không ngủ | ✅ v7.7 | **Ban đêm rực neon**: phố đi bộ **Nguyễn Huệ** trước **Trụ sở UBND Thành phố** (tường vàng, tháp đồng hồ), **chợ Bến Thành** với tháp đồng hồ cổng Nam, **Bưu điện Thành phố**, tháp **Bitexco** có sân đỗ trực thăng, sông Sài Gòn + bến Bạch Đằng (tàu du lịch chạy), **Landmark 81** bên kia sông, biển neon KARAOKE/CƠM TẤM…. **Giờ cao điểm**: dòng xe máy tràn qua đường Lê Lợi theo đợt (mặt đường chớp cam 2 s) — tông trúng rất đau, cuốn bay quái. **Dian đánh cùng** | + Ma Neon (chớp ra sau lưng rồi vồ), Trực Thăng Mini (bay, bắn loạt 3 viên) | **Vật Thể V-0** — bệnh nhân số 0 (nhảy vồ, cánh tay đột biến quét quạt đỏ, phun virus; giai đoạn 2 để lại vết virus + gọi Ma Neon; giai đoạn 3 tiếp đất nổ vòng đạn). **Dụ nó nhảy xuống làn xe máy → bị tông choáng** | Phá 4 đầu phát virus → Nòng Tăng Lực · Giữ cổng chợ Bến Thành 16 s → Cò Siêu Tốc · 26 hạ gục → Lõi Xuyên Phá |
| **19 Miền Tây** · Chín rồng ra biển | ✅ v7.7 | **Sông Hậu** phù sa chặn ngang bản đồ — chỉ qua được trên **ghe chợ nổi Cái Răng** (ghe neo kín, **cây bẹo** treo nông sản); **rạch** chỉ qua bằng **cầu khỉ** tre; vườn dừa, vườn cây trái, **nhà sàn mái lá**, ruộng lúa, lục bình trôi. **Nước lớn** dâng theo đợt làm ngập bãi ven sông (đi chậm). **Hunter đi một mình**, cô Hạnh liên lạc qua bộ đàm | + Cá Sấu Bùn (lặn dưới bùn rồi đớp), Khỉ Ném Dừa (ném trái dừa nổ vào vòng cam) | **Thuỷ Quái Cửu Long** — cá tra đột biến dưới đầm (lặn = miễn sát thương; trồi lên quất râu / phun bùn; giai đoạn 2 **phóng lên bờ đè bẹp rồi MẮC CẠN** — nhận thêm 35% sát thương; giai đoạn 3 nước lớn tràn bờ đầm) | Phá 4 phao tín hiệu → Bộ Chia Tia · Giữ lối ghe chợ nổi 16 s → Nòng Tăng Lực · 27 hạ gục → Băng Đạn |
| **20 Thất Sơn** · Bảy núi · An Giang | ✅ v8.0 | **Rừng tràm Trà Sư** ngập nước (kênh sâu chỉ qua bằng **cầu ván**, **bèo phủ** làm chậm), **đồng thốt nốt** Tịnh Biên, chân **núi Cấm** đá tảng + **tuyến cáp treo** (cabin chạy trên cao). **Nhiễu tín hiệu**: GoatEvil dội **mưa điểm ảnh** quanh Hunter theo đợt. **Dian quay lại đánh cùng** | + Hồn Rừng Tràm (bay xuyên rừng, bắn cầu độc chậm), Lính Đầu Dê (lấy đà húc rồi dậm sóng) | **GoatEvil · Hiện Thân** — đầu dê ảo ảnh khổng lồ (dịch chuyển, bắn tia nhiễu, quét tia kép; giai đoạn 2 dựng **3 trụ tín hiệu** — còn trụ thì boss chỉ nhận 10% sát thương; giai đoạn 3 **phân thân giả** + mưa điểm ảnh dày) | Phá 4 bộ khuếch đại → Lõi Xuyên Phá · Giữ ga cáp treo 16 s → Bộ Chia Tia · 28 hạ gục → Cò Siêu Tốc |
| **21 Căn cứ Alpha** · Nơi tất cả bắt đầu (trận cuối chu kỳ) | ✅ v8.0 | Trở lại căn cứ ở đầu Màn 2: phòng máy chủ, phòng bồn mẫu, văn phòng, phòng thí nghiệm của Ted, **sảnh lõi phản ứng**. **Cửa laser an ninh**: lưới laser ở 7 cửa thông phòng bật/tắt theo nhịp (chớp đỏ báo trước) — chạm lúc bật thì bỏng + bị đẩy lùi, quái cũng vậy. **Dian đánh cùng** | + Lính Alpha (khiên trước, bắn loạt 4), Bản Sao V-0 (lao nhanh, nổ ra vũng virus) | **GS. Ted · Giáp Alpha** (gatling quét, mưa tên lửa, lao vai; giai đoạn 2 bay bằng động cơ phản lực — giáp chịu 60% sát thương — gọi bản sao V-0 và **bắn hạ Dian** (vẫn cứu được); giai đoạn 3 lõi quá tải: 4 tia laser xoay + vòng đạn sau mỗi cú lao) | Phá 4 máy chủ Hội đồng → Nòng Tăng Lực · Giữ phòng thí nghiệm của Ted 16 s → Lõi Xuyên Phá · 30 hạ gục → Bộ Chia Tia |

### Màn 2 · Nguồn Gốc — cốt truyện (v6.0)

- **Cảnh chuyển sau Gate 10** (khoảng 1 phút, chạm để sang câu, có nút BỎ QUA, xem lại được ở tab MÀN 2): The Origin gục ngã → **GoatEvil** (AI hiện hình đầu dê ba chiều, giọng méo, cười man rợ rồi vỡ vụn) → căn cứ bị phá, **Giáo sư Ted** nằm bất động, tay nắm mẩu giấy → cận cảnh mẩu giấy cháy dở ghi *Hồ Gươm · Tháp Rùa* + toạ độ + ký hiệu đầu dê → Hunter lên đường, hiện chữ **MÀN 2 · NGUỒN GỐC**. Vẽ hoàn toàn bằng code (canvas), âm thanh tổng hợp (tiếng cười, nhiễu sóng, báo động, nhịp tim).
- **Bộ đàm trong trận**: GoatEvil khiêu khích lúc vào trận, ở wave 2, khi Hunter yếu máu, khi boss xuất hiện / đổi giai đoạn; Hunter tự nói khi thắng. Khung nhỏ phía trên, không dừng game. (`comms` trong định nghĩa Gate.)
- **Manh mối của Giáo sư Ted**: mỗi Gate Màn 2 giấu 1 mẩu giấy phát sáng (Gate 11: trong sân Đền Ngọc Sơn; Gate 12: kho số 7 bến sông; Gate 13: cửa hang Sửng Sốt — phòng lạnh của Ted, nhắc tới *học trò giỏi nhất bỏ đi 12 năm trước sau khi thấy tình nguyện viên V-0*, chỉ đường lên Sa Pa; Gate 14: cạnh ga cáp treo — *có người đang theo dấu, tôi đã dạy cậu ấy cách đó*, chỉ đường về Huế; Gate 15: dưới Cửu Đỉnh — *Hạnh là người duy nhất ngoài tôi biết công thức gốc*, chỉ đường Đà Nẵng; Gate 16: trên Cầu Vàng — *lô V-0 cuối cùng rời cảng Tiên Sa đi Đà Lạt*, lần đầu nhắc tới *Hội đồng*; Gate 17: cạnh nhà kính số 9 — *Hội đồng đã duyệt thử nghiệm diện rộng tại Sài Gòn*; Gate 18: dưới chân tháp Bitexco — *Dũng từng ký tên làm chứng cho tình nguyện viên V-0*; Gate 19: nhà sàn cạnh đầm — *GoatEvil là chương trình chỉ huy của Hội đồng Mười Hai, có hình hài ở Thất Sơn*; Gate 20: ga cáp treo chân núi Cấm — *Ted không chết ở Căn cứ Alpha, cái xác là bản V-0 mang mặt ông; Hunter là thí nghiệm thành công nhất*). Nhặt được → hiện trang ghi chép, lưu vào `Save.data.clues` (đồng bộ lên mạng nếu đăng nhập). Gom đủ 10 mảnh (Gate 11–20) để mở **kết thúc thật** ở Gate 21.
- **Kết thúc Màn 2 (v8.0)** — thắng Gate 21 lần đầu → cảnh kết thúc (`Story.play(['ending', 'endTrue'?, 'endOut'])`, cảnh mới `alpha`, `council`): Ted lộ thân phận **Ghế số Bảy của Hội đồng Mười Hai**, Dian từ chối về phe thầy; Hội đồng hiện hình qua tín hiệu đầu dê (11 bóng người + ghế VII trống), tuyên bố *thí nghiệm Hunter thành công*, cắt tín hiệu — Ted chết thật. Đủ 10 manh mối → **kết thúc thật**: mẩu giấy thứ 11 dẫn tới *Ghế số Một*. Cuối cảnh: "HẾT MÀN 2 · NGUỒN GỐC" + teaser Màn 3. Xem lại bằng nút **▶ XEM LẠI KẾT THÚC MÀN 2** ở màn chọn cửa.
- **Chu kỳ+ (v8.0)** — mở sau khi xong Gate 21: nút **CHU KỲ+** cạnh CHIẾN DỊCH/SINH TỒN. Chơi lại **mọi cửa đã qua, theo thứ tự tuỳ ý**: quái máu ×1,5, sát thương ×1,3, nhanh hơn 8%, thêm 12% tinh nhuệ; wave đông hơn 30% (tối đa cùng lúc +20%, nhịp ra quái nhanh hơn 15%); boss máu ×1,4 và lên 1 cấp. **Xu thưởng ×1,5**. Kỷ lục lưu riêng ở `Save.data.gates[id].ngp` (không gửi lên BXH chiến dịch, không đổi tiến trình chiến dịch). Khi thu phí BẬT: cần gói có quyền `ngplus` (gói 1 năm).
- ⚠️ **Tiết lộ cốt truyện — Sự thật (chưa lộ trong game)**: chính Ted là trùm cuối — vì lòng tham bá quyền, ông dựng vở kịch "bị sát hại", tạo GoatEvil làm bình phong và gieo virus khắp thế giới. Các ghi chép cài sẵn dấu hiệu: chủng V-0 có từ 12 năm trước, hoá đơn ký tên "T.K." mà "tôi đã thấy mỗi ngày suốt mười hai năm".
- **Đồng đội DIAN (v6.9)** — Dũng, mật danh Dian, đặc công, học trò cũ của GS Ted. 12 năm trước anh bỏ phòng thí nghiệm sau khi thấy "tình nguyện viên V-0" (đã gài ở manh mối số 3), từ đó âm thầm lần theo dấu Ted. Xuất hiện ở Gate 14 (bắn tỉa giải vây trong sương), Gate 15 hỗ trợ qua bộ đàm (đi tìm cô Hạnh — trợ lý cũ của Ted). Đánh cùng ở Gate 16 và 18 (Gate 17 liên lạc bộ đàm); Gate 18 GoatEvil tiết lộ anh giấu việc Ted còn sống từ Sa Pa → hai người chia tay, Gate 19 Hunter đi một mình với cô Hạnh qua bộ đàm, cuối Gate 19 Dian xin quay lại; đánh cùng ở Gate 20, 21; Gate 21 Ted mời anh về phe, anh từ chối.
- **Hệ thống đồng đội** (`js/ally.js`, `MB.Ally`): Gate bật bằng `ally: { enter: 'start' }` hoặc `{ enter: { wave, delay, x?, y?, overwatch } }` (xuất hiện giữa trận, đứng bắn yểm trợ vài giây rồi nhập nhóm). Dian bám sau-bên Hunter, tự tìm đường, tụt xa thì đổi chỗ tới gần; súng bắn tỉa (150 sát thương quái, 95 boss, 1,1 s/phát, tia ngắm laser xanh trước khi bắn) ưu tiên quái đang áp sát Hunter → tinh nhuệ → **quả tim boss**; ném bộc phá vào đám đông (không trúng Hunter); máu 340 (nhận 55% sát thương); gục thì Hunter đứng gần 2,4 s để kéo dậy (hoặc tự băng bó sau 35 s); đấu lại boss thì hồi đầy. Không tích nộ, không tính vào độ chính xác. Có thoại ngẫu nhiên, thẻ tên + thanh máu trên đầu, chấm xanh trên bản đồ nhỏ, mũi tên chỉ hướng khi gục. Trong sương (Gate 14) ống ngắm nhiệt đánh dấu đỏ quái quanh anh (`e.markT`). Bộ đàm có người nói mới `DIAN`, sự kiện `on: 'ally'`. Thẻ cửa ải hiện nhãn **+ DIAN**. 3D: dựng từ mô hình lính có khung xương + mũ tai bèo, khăn rằn, súng bắn tỉa.
- **Hunter là người Việt**: tên thật **Nguyễn Hào Tình**, sinh ở làng chài Hạ Long (hiện trong HỒ SƠ HUNTER và bộ đàm Màn 2).
- Màn hình Chọn cửa ải có tab **MÀN 1 / MÀN 2**; Màn 2 mở khi thắng Gate 10.

### Đồ hoạ có chiều sâu (Màn 2)

- **2D**: nhà nhìn xiên 3/4 — mặt tiền (cửa hàng, ban công, cửa chớp, biển hiệu) vẽ ở lớp dưới, **mái nhà / tán cây / đỉnh tháp vẽ đè lên nhân vật đi phía sau** và tự mờ đi khi Hunter bị che; bóng đổ xiên Đông-Nam theo chiều cao. Bộ công cụ dùng chung `MB.VN` (trong `gate11-hanoi.js`): `row()` (dãy nhà Hà Nội / Hội An), `tileRoof`, `yinYangRoof`, `lantern`, `moto`, `darkness()` (bóng tối có lỗ sáng cho cả 2D và 3D), `drawOver()`.
- **3D**: ánh sáng theo Gate (`light3d`: hoàng hôn cam ở Hà Nội, đêm xanh tím ở Hội An), mặt hồ phản chiếu có lỗ cho đảo, cầu Thê Húc dựng từng đốt, mái ngói có vân, đèn lồng phát sáng; Hội An có **5 đèn điểm tự bám theo các đèn lồng gần Hunter** để tường nhà được hắt sáng ấm mà không tốn hiệu năng.

### Cấu trúc một file Gate

Mỗi file Gate tự chứa mọi thứ của cửa ải đó:

1. **Vẽ 2D vật cản riêng**: `MB.Props.register('kind', drawFn)`; vật thể động: `MB.Props.registerActor`.
2. **Quái / boss**: `MB.Enemies.register('ten', {...})`, hoặc ghép khuôn hành vi có sẵn: `Ens.make(base, Ens.AI.shooter({...}))` (bắn xa), `exploder` (tự nổ), `burrower` (đào đất), `blinker` (dịch chuyển), `armorFn: Ens.AI.shieldFront(...)` (khiên).
3. **Định nghĩa Gate** `MB.registerGate({...})`: `world`, `scale` (hệ số máu/sát thương), `start`, `obstacles`, `crates`, `hazards`, `spawnPoints`, `waves`, `boss` (`fixed: true` để boss không dời chỗ), `objectives`, `challenges`, `buildGround` (vẽ nền bằng `MB.GK`).
4. **Cơ chế riêng**: `setup(G)`, `update(G, dt)`, `drawUnder(G, ctx)` (2D), `drawScreen(G, ctx)` (lớp phủ màn hình cho cả 2D và 3D: bão tuyết, mực, tro bụi), `onObstacleDestroyed(G, o)` (thùng nổ, ô tô nổ).
5. **3D**: `view3d: true` + `models3d`, `props3d`, `actors3d`, `hazards3d` (xem mục 3b).
6. `requires: [...]` trong `js/gates/index.js` nếu Gate dùng quái của Gate khác.
7. Thêm đường dẫn file vào `CORE` trong `sw.js`, tăng `VERSION`, cập nhật README.

Công cụ dùng chung trong runtime: `G.explosion(x, y, r, dmg, {player, knock, ...})`, `G.telegraphCircle(...)`, `G.shockwave(...)`, `G.enemyShot({..., onHit, onEnd})`, `G.addHazard({kind, dps, slowMul, slip, burn, enemyDps, life})`.

Các loại thử thách có sẵn: `destroy` (phá mục tiêu, có thể kèm `spawner` sinh quái), `hold` (đứng trong vùng), `streak` (chuỗi hạ gục không trúng đòn).

## 10. Lỗi của v3 đã sửa trong v4

| ID | Lỗi trong v3 | Cách sửa trong v4 |
|---|---|---|
| BUG-01 | Đứng trong hồ virus làm người chơi **gần như bất tử**: mỗi tick sát thương nhỏ lại kích hoạt 420 ms bất tử với cả đòn của quái | Sát thương theo thời gian (`dot`) không kích hoạt bất tử |
| BUG-02 | Mobile chỉ có joystick di chuyển, không bắn được | Twin-stick cảm ứng, nút NÉ/NẠP/ĐỔI, hỗ trợ ngắm |
| BUG-03 | Quái kẹt sau cây/đá | AI lái hướng né vật cản, có phía ưu tiên, tự phát hiện kẹt rồi đi vòng |
| BUG-04 | Lộn né là dịch chuyển tức thời 110 px, có thể xuyên khúc gỗ hoặc thùng | Lộn né là cú lướt 0,19 s, va chạm được xét mỗi khung hình |
| BUG-05 | Va chạm với hộp/khúc gỗ chỉ "đẩy 6 px khỏi tâm" nên bị rung, lọt vào trong | Va chạm hình tròn với hộp xoay (điểm gần nhất), thêm raycast cho đạn |
| BUG-06 | Số quái mỗi wave không giới hạn (vẫn spawn tiếp khi số hạ gục chưa đủ) | Mỗi wave có tổng số quái cố định và giới hạn số quái cùng lúc |
| BUG-07 | Spider Queen gọi nhện không giới hạn | Tối đa 8 quái phụ cùng lúc |
| BUG-08 | Quái chồng lên nhau, bị đẩy lùi 22 px tức thời khi chạm người chơi | Tách quái khỏi nhau; đẩy lùi dùng vận tốc |
| BUG-09 | `ctx.roundRect` làm crash trên Safari cũ | Tự viết hàm `rr()` |
| BUG-10 | Không có tạm dừng; thời gian nạp đạn/lộn né dùng `performance.now()` nên chạy tiếp khi ẩn tab | Có Pause; mọi bộ đếm dùng thời gian game; tự dừng khi ẩn tab |
| BUG-11 | Quái spawn ngay cạnh hoặc trong tầm nhìn người chơi, hoặc trong vật cản | Spawn cách người chơi ít nhất 480, ưu tiên ngoài màn hình, không spawn trong vật cản, có hiệu ứng trồi lên 0,6 s |
| BUG-12 | Phím E chỉ hoạt động khi đang giữ; vật phẩm tự nhặt khi HP < 45 | Tự nhặt khi chạm (kèm lực hút); chỉ nhặt máu/giáp khi đang cần |
| BUG-13 | Tiêu đề là "v2", badge là "v3", README lại ghi v3 | Thống nhất là v4 |
| BUG-14 | HUD cập nhật DOM ở mọi khung hình | Chỉ cập nhật khi giá trị thay đổi |
| BUG-15 | Phím WASD lỗi khi bật Telex (chữ W) | Dùng `e.code` |

## 11. Vấn đề đã biết / cần kiểm tra

| ID | Mức độ | Mô tả | Trạng thái |
|---|---|---|---|
| K-01 | Cao | Cân bằng Gate 03–10 mới kiểm tra bằng bot (ngắm tự động nhưng **không biết né** vạch đỏ). Bot qua được các wave đầu nhưng thường chết ở boss hoặc wave 2–3 của Gate 05/07/10. Cần người thật chơi thử để chỉnh `scale`, máu boss và mật độ quái | Cần test |
| K-02 | Trung bình | Chưa thử trên iPhone và Android thật, chỉ mới giả lập bằng Chromium (iPhone 13 ngang/dọc) | Cần test |
| K-03 | Thấp | Chế độ dọc (portrait) vẫn chơi được nhưng chật; game hiện gợi ý xoay ngang | Mở |
| K-04 | Thấp | Nhân vật và quái vẽ bằng code (vector); chưa có sprite hay spritesheet | Roadmap |
| K-05 | Thấp | Nhạc nền mới là drone đơn giản | Roadmap |
| K-06 | Thấp | Đã có 8 súng; vũ khí cận chiến chưa có | Roadmap |
| K-07 | Trung bình | 3D chưa đo FPS trên GPU thật (môi trường test chỉ có GPU giả lập bằng CPU). Cần thử trên điện thoại tầm trung | Cần test |
| K-08 | Thấp | Một số model 3D dùng chung khuôn (VD: Brute/Cinder Golem/Magma Titan cùng khuôn golem khác màu) | Có thể làm riêng sau |
| K-12 | Trung bình | Gate 10 tải cả 10 file Gate (~230 KB) trước khi chơi | Chấp nhận được |
| K-13 | Thấp | Gate 05 có ~80 vòng dung nham; máy yếu nên chọn đồ hoạ Thấp | Theo dõi |
| K-14 | Cao | **Đen màn hình khi sang Gate mới** ở chế độ 3D (game vẫn chạy nền). **Nguyên nhân thật (v5.1.1):** đồng hồ `G.time` về 0 ở Gate mới nhưng camera 3D vẫn nhớ thời điểm cuối của Gate trước → bước thời gian âm → vị trí camera thành `NaN` → không vẽ được gì. Chỉ xảy ra khi Gate trước chơi lâu (>~1 phút), nên test tua nhanh không bắt được. Đã sửa: reset mốc thời gian mỗi khi dựng màn, kẹp bước thời gian ≥ 0, tự đặt lại camera nếu gặp NaN. (v5.1 cũng thêm dọn bộ nhớ GPU và tự chuyển 2D khi mất WebGL) | Đã sửa |
| K-15 | Trung bình | **iPhone, app đã thêm ra màn hình chính:** trang đăng nhập Google có thể mở ra Safari và quay về Safari thay vì về app, nên app chưa nhận đăng nhập. Cần thử trên máy thật; nếu gặp, tạm thời đăng nhập trong Safari hoặc chơi trên Safari. Hướng sửa: chuyển sang nút Google Identity Services (đăng nhập ngay trong trang) | Cần test |
| K-17 | Thấp | **iPhone & nút gạt im lặng**: âm thanh web mặc định bị iOS tắt theo nút im lặng. Từ v5.5.1 **nút loa của game quyết định**: loa BẬT → chuyển phiên âm thanh sang "playback" (`navigator.audioSession` trên iOS 17+, đoạn `<audio>` im lặng lặp lại cho iOS cũ) nên vẫn có tiếng dù máy đang im lặng; loa TẮT → trả phiên về mặc định, dừng đoạn im lặng, không chiếm nhạc của app khác. Âm lượng theo phím âm lượng của máy. Khi loa bật, nhạc app khác (Spotify…) sẽ tạm dừng | Theo thiết kế |
| K-20 | Cao | **Đấu lại boss ở 3D: Hunter nằm vặn vẹo, súng bắn sai hướng** — model 3D giữ nguyên tư thế ngã sau khi hồi sinh. v6.1: dựng lại tư thế khi hết chết, reset `deadT`/lộn né khi đấu lại | Đã sửa |
| K-21 | Cao | **Đạn trắng/vàng nhạt gần như không thấy trên tuyết, cát** — v6.1: vệt đạn có viền sẫm + tâm trắng ở mọi map; map sáng (`bright: true`: Gate 04, 06) đổi màu đạn sang tông đậm bão hoà (vàng nhạt → cam đỏ); 3D bỏ quầng phát sáng cộng màu trên map sáng, thêm vỏ sẫm quanh đạn | Đã sửa |
| K-22 | Trung bình | **HUD điện thoại chồng lấn** (nút NGẮM đè thanh máu boss, thanh boss đè khung HP, gợi ý "xoay ngang" che ô súng). v6.1: HUD cảm ứng xếp theo hàng (HP · ngắm/loa/tạm dừng/bản đồ → thanh boss → bộ đàm); màn dọc có bố cục riêng; gợi ý xoay ngang tự ẩn sau 4 giây | Đã sửa |
| K-23 | Trung bình | **Cảnh vật trông "giả" vì hình tròn/vuông** — v6.1: mảng màu nền thành vệt loang méo mép mờ (mọi Gate, 2D + 3D), vùng nguy hiểm 3D thành vệt loang có lốm đốm thay cho đĩa tròn, tán cây 2D gồm nhiều chùm lá viền gợn có sáng tối, khúc gỗ 3D có vân vỏ cây + cành. Còn lại: nhà Gate 08 và vài vật cản 3D vẫn là khối đơn giản | Đang cải thiện |
| K-18 | Trung bình | Màn 2 mới thử bằng bot tua nhanh và chụp ảnh; độ khó Gate 11–12 (scale máu ×2,0–2,1) cần người chơi thật kiểm tra. Ban đêm Hội An có thể quá tối trên màn hình độ sáng thấp | Cần test |
| K-19 | Thấp | Bảng xếp hạng Gate 11+ cần chạy lại `supabase/schema.sql` (mở rộng giới hạn gate 1–30) | Cần làm 1 lần |
| K-16 | Thấp | Điểm gửi từ trình duyệt nên người rành kỹ thuật vẫn có thể gửi điểm giả trong giới hạn hàm `mb_submit_score` cho phép. Đủ cho game giải trí; muốn chặt hơn cần kiểm tra phía server (Edge Function) | Chấp nhận |
| K-09 | Thấp | 3D không chạy khi mở file trực tiếp (file://); game tự về 2D | Đã xử lý |
| K-10 | Thấp | Model 3D vẫn dựng bằng code (hình khối toán học), chưa phải model chuyên nghiệp có xương và hoạt ảnh. Muốn chân thật hơn nữa cần nạp file glTF (.glb) từ thư viện như Quaternius (CC0) hoặc Mixamo | Roadmap |
| K-11 | Thấp | Chế độ màn ngang kiểu Contra chưa làm (xem mục 12, M5) | Roadmap |

## 12. Roadmap

### M1: Hoàn thiện Gate 01–02 ✅ (v4)

- [x] Màn hình Start / Chọn Gate / Pause / Result, chơi lại, Gate tiếp theo
- [x] Điều khiển mobile + tay cầm, PWA cài được, chơi offline
- [x] Game feel: rung màn hình, chớp trắng khi trúng, số sát thương, vỏ đạn, vết máu
- [x] Âm thanh tổng hợp + nhạc nền nền tảng
- [x] Nâng cấp súng qua thiết bị và thử thách
- [x] Boss nhiều phase, quái tinh nhuệ, minimap, mũi tên chỉ mục tiêu
- [x] Lưu tiến trình, kỷ lục, sao, kho vũ khí

### M2: Nội dung chiến đấu

- [x] Grenade Launcher, Sniper, Flamethrower, Plasma, Minigun (v5.0)
- [ ] Vũ khí cận chiến
- [ ] Sprite/animation vẽ tay cho Hunter (nếu muốn chuyển từ vector sang pixel art)
- [ ] Mini boss giữa wave
- [ ] Nhạc nền theo từng Gate

### M3: Tiến trình

- [x] Nâng cấp vĩnh viễn bằng xu + cửa hàng (v5.3)
- [x] Thẻ nâng cấp sau mỗi wave (v5.3)
- [x] Chế độ Sinh tồn vô hạn, kỷ lục theo Gate (v5.3)
- [x] Combo, khựng hình, rung (v5.3)
- [x] Skill chủ động: lựu đạn, xung kích (v4.2)
- [ ] Nhân vật mới: Medic, Engineer, Ghost
- [ ] Thử thách hằng ngày, độ khó Ác mộng
- [x] Bảng xếp hạng online + đăng nhập Google + đồng bộ tiến trình (Supabase, v5.4)

### M4: Gate 03 → 10 ✅ (v5.0)

- [x] Mỗi Gate có cơ chế địa hình riêng, 2–3 quái mới, 1 boss nhiều phase và 3 thử thách
- [x] Bản 3D cho cả 10 Gate
- [ ] Chỉnh cân bằng sau khi có người chơi thật

### M5: Chế độ màn ngang kiểu Contra (đề xuất)

- [ ] Chế độ chơi riêng: cuộn ngang, trọng lực, nhảy, bục đứng, thang, ngắm 8 hướng
- [ ] Dùng lại: Hunter, súng, linh kiện, lựu đạn, HUD, âm thanh, lưu tiến trình
- [ ] Làm mới: vật lý nhảy, thiết kế màn chơi ngang, AI quái theo mặt phẳng, điều khiển cảm ứng (nút Nhảy)

## 13. Checklist kiểm thử trước mỗi bản phát hành

- [ ] Console không có lỗi khi chơi hết cả 10 Gate (2D và 3D). Có thể chạy nhanh bằng `?unlock=all`
- [ ] Chết ở mỗi wave rồi bấm "Chơi lại"
- [ ] Hoàn thành từng loại thử thách, nhặt súng mới, kiểm tra súng có trong kho ở Gate sau
- [ ] Lộn né xuyên qua sóng chấn của Behemoth
- [ ] Dụ boss đâm vào đá, kiểm tra trạng thái choáng
- [ ] Chuyển tab 10 giây rồi quay lại: game phải đang tạm dừng
- [ ] Điện thoại: hai gậy hoạt động cùng lúc, các nút bấm được, HUD không che gậy
- [ ] Cài PWA, tắt mạng rồi mở lại: vẫn chơi được
- [ ] Chơi Gate 01 ở cả 2D và 3D; chuyển qua lại 2D/3D giữa các lần chơi
- [ ] Để quái vây kín rồi dùng xung kích + lựu đạn; để máu dưới 35% kiểm tra thùng y tế thả dù
- [ ] Thử 3 chế độ ngắm trên điện thoại
- [ ] Tăng `VERSION` trong `sw.js`

## 14. Lịch sử thay đổi

| Ngày | Phiên bản | Thay đổi |
|---|---|---|
| — | v1, v2 | Không có ghi chép |
| — | Gate 01 v3 | 1 file HTML: movement có gia tốc, Rifle Mk I–IV tự nâng theo wave, Zombie/Spider/Licker, Spider Queen, hồ virus |
| 2026-10-01 | README rev 2 | Đánh giá README, thêm bảng lỗi và roadmap |
| 2026-10-03 | **v8.3** · README rev 42 | **Menu chính mới phong cách game chiến đấu**: chữ quân sự Chakra Petch / Saira Condensed (tự lưu trữ trong `assets/fonts`, giấy phép OFL), tiêu đề MONSTER BREAKOUT cam lửa, khói + tàn lửa + vạch quét, **thẻ chiến binh** (chân dung, cấp bậc theo số cửa đã qua, cửa ải / manh mối / wave sinh tồn / xu), nút dạng mũi tên với dòng phụ, nút VÀO TRẬN gợi ý cửa tiếp theo, thanh trạng thái máy chủ ở chân; nút toàn game bo góc vát |
| 2026-10-04 | **v8.3.1** · README rev 43 | **Hunter gương mặt Việt**: thay `assets/hunter/body.webp` (ảnh menu, đã xoá chữ trên ảnh gốc), `portrait.webp` (chân dung thẻ chiến binh + hội thoại) và `dossier.webp` (Hồ sơ Hunter) theo bộ hồ sơ mới. **Nhện + dơi ma** (`js/creepers.js`): lớp canvas riêng trên Menu và Chọn cửa ải, thỉnh thoảng nhện bò qua / thả tơ từ trên xuống (né khi chuột/ngón tay lại gần), dơi ma phát sáng bay ngang hoặc lao về phía màn hình; không chặn thao tác, tự tắt khi vào trận hoặc khi máy bật "giảm chuyển động". Ẩn thanh trượt ở cột menu trên laptop (vẫn cuộn được). |
| 2026-10-04 | **v8.4** · README rev 44 | **Hunter 3D mới**: mô hình Mixamo *Swat Guy* (anh tải từ Mixamo vào `D:\hunter`) gộp 6 hoạt ảnh cầm súng thật — `idle` (Rifle Idle), `walk`, `run` (In Place), `shoot` (Firing Rifle, khi đứng bắn), `hit` (khi trúng đòn), `die` (ngã khi chết) — thành `assets/models/hunter_swat.glb` (Blender → glTF, texture 4K → 1024 WebP, bỏ map bóng/specular sai chuẩn, lượng tử hoá lưới; 115 MB → 2,4 MB). `render3d.js`: `buildHeroSwat` / `animHeroSwat` giữ đầu & trang phục gốc của mô hình, súng của game đặt ở tay phải và luôn chĩa theo hướng ngắm, chớp lửa đầu nòng theo súng; lỗi tải thì tự quay về mẫu cũ. Dian vẫn dùng `hunter.glb` cũ. |
| 2026-10-04 | **v8.4.1** · README rev 45 | **Xác sống 3D mới**: mô hình xác sống Mixamo (anh tải vào `D:\hunter\zombie`) + 5 hoạt ảnh `idle`, `walk`, `run` (khi lao nhanh), `attack` (khi vồ trúng), `die` → `assets/models/zombie_real.glb` (texture 512 WebP, 20 MB → 1 MB). `buildZombieReal` / `animZombieReal`: tỉ lệ tự tính theo chiều cao mô hình, mỗi con lệch màu + kích thước + nhịp bước, khoá hông tại chỗ để không trôi. **Xác ngã khi chết**: quái thật chết không biến mất ngay mà phát hoạt ảnh ngã (~1,6 s) rồi chìm dần xuống đất (`R3.corpses`, tối đa 14 xác cùng lúc). Lỗi tải thì quay về mẫu cũ. |
| 2026-10-04 | **v8.4.2** · README rev 46 | Hunter 3D to hơn ~25% (tỉ lệ 38 → 47, súng 0,62 → 0,76) để nổi bật giữa bầy xác sống khi nhìn từ trên xuống. File đổi: `js/render3d.js`, `index.html`, `sw.js`, `version.json`, `README.md`. |
| 2026-10-04 | **v8.4.3** · README rev 47 | **Không còn thấy Hunter cũ lúc mở cửa**: màn tải chờ mô hình 3D (Hunter, xác sống) tải xong rồi mới vào trận (`R3.waitSkinned`, tối đa 10 s, hiện "Đang tải nhân vật 3D…"); khi đang ở màn Chọn cửa ải với chế độ 3D, game tải trước three.js + mô hình ở nền. **Hunter to thêm** (tỉ lệ 47 → 56, súng 0,9, vòng sáng dưới chân ×1,25). File đổi: `js/render3d.js`, `js/main.js`, `index.html`, `sw.js`, `version.json`, `README.md`. |
| 2026-10-03 | **v8.2** · README rev 41 | **Hai thế giới**: thẻ lớn CHIẾN DỊCH / SINH TỒN (/ CHU KỲ+), Sinh tồn thành **Đấu trường** độc lập tông đỏ; bắt buộc đăng nhập; vào thẳng với 10 bản đồ Màn 1; **giới hạn giờ/ngày tính trên máy chủ** (45 phút chưa tiếp tế, 120 phút + **hồi sinh tại chỗ 2 lần** cho người tiếp tế, chỉnh được trong admin); **điểm lưu đầu khu vực** đồng bộ tài khoản; bỏ ☕ khỏi bảng xếp hạng; ghép bản lưu giữ cả manh mối, cảnh truyện, Chu kỳ+. **Cần chạy lại `supabase/schema.sql`** (mục 8) |
| 2026-10-03 | **v8.1** · README rev 40 | **Khối giới thiệu Chu kỳ+** lấp khoảng trống sau Gate 21 (5 đặc quyền, thanh tiến độ Màn 2, mở khoá → nút VÀO CHU KỲ+, đếm số cửa đã chinh phục); thẻ cửa có **dấu ⟳ vàng** khi qua Chu kỳ+; bỏ chữ "thử nghiệm" ở 3D; **boss khó hơn**: quả tim lộ ít, nhỏ, không còn nhô ra ngoài, boss trâu hơn, khó choáng hơn (chi tiết mục Boss) |
| 2026-10-03 | **v8.0.3** | Đổi địa chỉ trang quản trị: `admin.html` → **`cancuhunterx.html`** (mở bằng `/cancuhunterx`), `js/admin.js` → `js/cchx.js`, `css/admin.css` → `css/cchx.css`. `/admin` giờ là trang không tồn tại. Cần xoá 3 file cũ trên GitHub và thêm `https://<tên-miền>/cancuhunterx` vào Supabase → Authentication → URL Configuration → Redirect URLs |
| 2026-10-03 | **v8.0.2** | Trang admin: tài khoản không phải quản trị **không thấy menu/giao diện quản trị** — chỉ hiện "Không tìm thấy trang" rồi tự về game; bỏ câu lệnh SQL cấp quyền khỏi trang (vẫn có ở mục cài đặt README). Dữ liệu vẫn được bảo vệ phía máy chủ (RLS + `mb_is_admin()` trong mọi hàm quản trị) |
| 2026-10-03 | **v8.0.1** | Đăng nhập Google luôn hiện **bảng chọn tài khoản** (`prompt: select_account`) — đăng xuất rồi đăng nhập lại không còn tự vào tài khoản cũ (game + trang admin) |
| 2026-10-03 | **v8.0** · README rev 39 | **Hoàn tất Màn 2**: **Gate 20 Thất Sơn** (rừng tràm Trà Sư, đồng thốt nốt, cáp treo núi Cấm, mưa điểm ảnh, boss GoatEvil · Hiện Thân) và **Gate 21 Căn cứ Alpha** (cửa laser an ninh, boss GS. Ted · Giáp Alpha), 2D + 3D; 4 quái mới; manh mối 10/10; **cảnh kết thúc Màn 2** (Hội đồng Mười Hai, kết thúc thật khi đủ 10 manh mối) + nút xem lại; chế độ **Chu kỳ+** (quái mạnh hơn, xu ×1,5, kỷ lục riêng); teaser Màn 3 mới. Khắc hệ: GoatEvil — điện, Ted — điện |
| 2026-10-03 | **v7.7** · README rev 38 | **Gate 18 Sài Gòn** (đêm neon, giờ cao điểm xe máy trên Lê Lợi, boss Vật Thể V-0, Dian đánh cùng — lộ chuyện Dian giấu việc Ted còn sống) và **Gate 19 Miền Tây** (sông Hậu, chợ nổi Cái Răng, cầu khỉ, nước lớn, boss Thuỷ Quái Cửu Long, đánh một mình — cô Hạnh qua bộ đàm), 2D + 3D; 4 quái mới; manh mối 8–9/10. Khắc hệ: V-0 — lửa, Thuỷ Quái — điện. Bộ đàm hiện chữ cái đầu tên người nói |
| 2026-10-03 | **v7.6** · README rev 37 | **Gate 16 Đà Nẵng** (Cầu Rồng phun lửa, Cầu Vàng, boss Cự Nhân Đá Bà Nà, Dian đánh cùng) và **Gate 17 Đà Lạt** (Hồ Xuân Hương, đoàn tàu ở Ga Đà Lạt, đồi nhà kính, boss Đoá Dã Quỳ Khổng Lồ), 2D + 3D; 4 quái mới; manh mối 6–7/10. Khắc hệ: Cự Nhân Đá — nổ, Dã Quỳ — lửa |
| 2026-10-03 | **v7.5.1** | Admin: tách "Bắt buộc đăng nhập" (luôn hoạt động) khỏi công tắc thu phí; mục đổi tên "Đăng nhập & thu phí" |
| 2026-10-03 | **v7.5** · README rev 36 | Admin **tìm người chơi theo mã MBTT** (dán cả nội dung chuyển khoản), nút **Xác nhận đã tiếp tế** ngay trong hồ sơ (số tiền + mục đích sử dụng); game hiện **ngôi sao cảm ơn sáng rực** kèm mục đích dùng tiền, ★ sáng cạnh tên |
| 2026-10-03 | **v7.4** · README rev 35 | **Tiếp tế:** màn "Trạm tiếp tế" lồng cốt truyện (1 lần sau Gate 10, khi thua cửa ác mộng), **cửa ác mộng** Gate 11 khi chưa tiếp tế, mã tiếp tế riêng `MBTT…`, huy hiệu ☕ Người tiếp tế (bảng xếp hạng, hồ sơ), thanh chi phí server, trang admin Người tiếp tế |
| 2026-10-03 | **v7.3.1** · README rev 34 | Mở cửa ải đổi sang **kiểm soát theo từng Màn**: Màn không bật kiểm soát = chơi liên tục như bình thường; Màn bật = chỉ mở các cửa được chọn |
| 2026-10-03 | **v7.3** · README rev 33 | Admin **chọn cửa mở cho người chơi** theo từng Màn (cửa đóng hiện "Sắp mở"); tài khoản admin chơi được mọi cửa để thử |
| 2026-10-03 | **v7.2** · README rev 32 | Trang quản trị thiết kế lại (giao diện sáng, menu trái); **theo dõi người chơi** (danh sách, hồ sơ, tiến độ & thời gian qua từng cửa), **thống kê cửa ải**, **đánh giá năng lực cá nhân**, xuất CSV; nhật ký trận `mb_plays` |
| 2026-10-03 | **v7.1** · README rev 31 | Thu phí **bật/tắt từ trang quản trị** (mặc định TẮT: đăng nhập là chơi hết); nút **☕ Ủng hộ** (menu, tạm dừng, kết quả, tài khoản) hiện VietQR ngân hàng; **cancuhunterx.html** (công tắc thu phí, thông tin ngân hàng, bảng giá, đơn hàng, cấp quyền); 4 gói mới (15 ngày 29k, 30 ngày 49k + màn sau 25k, 1 năm 525k + Chu kỳ+, ủng hộ 5k mở 1 cửa 15 ngày); đơn hàng + webhook SePay `supabase/functions/mb-sepay` |
| 2026-10-03 | **v7.0** · README rev 30 | **Mở khoá theo tài khoản:** khách chơi Gate 1–7, Gate 8+ bắt buộc đăng nhập; Gate 11+ (Màn 2) cần gói. `js/access.js` (3 gói: 49k Màn 2, 99k Hunter Pass, 29k/30 ngày), màn chặn đăng nhập / mua gói, gói đang dùng trong Tài khoản, bảng `mb_entitlements` + trigger chặn điểm; khung thanh toán chờ chọn cổng; `?unlock=all` chỉ chạy trên localhost |
| 2026-10-03 | **v6.9** · README rev 29 | **Gate 14 Sa Pa · Fansipan** và **Gate 15 Huế** (2D + 3D), mỗi Gate 2 quái mới + 1 boss mới; **hệ thống đồng đội** (`js/ally.js`) với **Dian**; sương mù có ống ngắm nhiệt; sấm sét Huế; thẻ cửa ải nhãn + DIAN; khắc hệ cho boss mới (Thuỷ Long: điện, Dê Chúa: lửa, Nghê Đá: nổ); manh mối 4–5/10 |
| 2026-10-03 | **v6.8** · README rev 28 | **Gate 13 Hạ Long** (2D + 3D): bản đồ biển–cầu ván–làng chài nổi–đảo đá vôi–bãi cát–hang Sửng Sốt; quái Sứa Điện, Cua Đột Biến; boss Thuỷ Long Vịnh Hạ; manh mối 3/10. Hồ sơ Hunter thêm tên thật Nguyễn Hào Tình |
| 2026-10-03 | **v6.7** · README rev 27 | Màn chọn cửa hiện cả 3 Màn trên một trang (đầu mục từng Màn, tiến độ, Màn 2 gắn nhãn MỚI, Màn 3 "Bóng tối lan rộng" với thẻ Gate 22–24 sắp ra mắt); nút MÀN 1/2/3 cuộn tới đúng màn; menu ghi "2 màn, 21 cửa ải · Màn 3 sắp ra mắt". Danh sách Màn ở `MB.Gates.acts` (gates/index.js) |
| 2026-10-03 | **v6.6.1** · README rev 26 | Icon mới (phương án C: tấm thép bị cào rách, mắt quái đỏ lộ ra sau vệt virus xanh); bộ icon riêng cho Android (maskable, không bị cắt mất khi máy bo tròn/vuông/giọt nước), iPhone (apple-touch-icon 180), favicon; manifest tách purpose any/maskable |
| 2026-10-03 | **v6.6** · README rev 25 | Boss: "quả tim virus" thay vòng đỏ + chữ điểm yếu; Gate 5+ bớt 15% máu, hệ số tối đa ×2,5, nổi điên 5 giây sau choáng + khoá choáng 20 giây; tự cân bằng âm thầm 3 cấp theo thời gian hạ boss & máu còn lại; cấp khó: boss che tim, đổi lối đánh ở 66%/33% (gọi quái, vòng đạn), thưởng thêm xu |
| 2026-10-03 | **v6.5.1** · README rev 24 | Mô hình 3D thật giữ đúng tạo hình đã vẽ: Hunter thay đầu mũ giáp bằng đầu tóc nâu + mũ trùm, thêm áo giáp ô liu, ba lô, phù hiệu; xác sống thêm đầu u nần mắt phát sáng, áo rách, túi độc, da xanh xám; thêm Cài đặt "Nhân vật 3D" (mô hình mới / dựng sẵn) |
| 2026-10-03 | **v6.5** · README rev 23 | Âm thanh mới dạng file (67 hiệu ứng, 3 bản nhạc lặp: menu / trận / boss) dựng từ mẫu CC0 + tổng hợp offline; mô hình 3D thật có khung xương cho Hunter và xác sống thường (Mixamo qua three.js examples); tiếng quái gầm gừ; âm riêng cho 5 súng mới, siêu chiêu, gục choáng, điểm yếu |
| 2026-10-02 | **v6.4** · README rev 22 | Trận boss mới: điểm yếu ×2, gục choáng (+50%), khắc hệ ×1,5, tiếp tế đạn hạng nặng; thanh nộ + 3 siêu chiêu chọn khi boss xuất hiện; 5 súng mới (Cryo, Bolt X, Hornet, Lumen Beam, Ripper) nhận khi hạ boss Gate 3/5/7/9/11 hoặc mua bằng xu; sát thương nổ nhân theo linh kiện |
| 2026-10-02 | **v6.3** · README rev 21 | Hunter đổi ngoại hình theo ảnh concept "Operator" (2D + 3D): áo đen than, giáp nâu ô liu, ba lô, tóc nâu, súng giảm thanh + ống ngắm; phù hiệu cánh-kiếm phát sáng làm điểm nhận diện. Key art ở menu, khẩu hiệu + phù hiệu, màn Hồ sơ Hunter, chân dung trong thoại/bộ đàm |
| 2026-10-02 | **v6.2.2** · README rev 20 | Hunter quay đầu nhanh khi đổi hướng / quái sau lưng (~0,15 giây thay vì ~0,5 giây); ngắm Tự động ưu tiên quái đang áp sát thay vì giữ khoá quái ở xa |
| 2026-10-02 | **v6.2.1** · README rev 19 | Máy tính có nút **NGẮM** (Chuột / Hỗ trợ / Tự động) + phím T + mục cài đặt riêng; chế độ Tự động trên máy tính tự khoá và tự bắn |
| 2026-10-02 | **v6.2** · README rev 18 | **Sinh tồn Bất tận**: 1 chuỗi chiến đấu liên tục qua mọi Gate đã qua (mang theo máu, súng, thẻ nâng cấp; hồi 25% máu giữa khu vực; quay vòng), kỷ lục + bảng xếp hạng chung; **độ khó tự điều chỉnh**: chấm điểm kỹ năng mỗi Gate, giỏi ở Gate 1–7 → âm thầm bật Ác mộng từ Gate 8 (thua 2 lần liền thì tự hạ về thường) |
| 2026-10-02 | **v6.1** · README rev 17 | Rà soát UX/UI: sửa tư thế Hunter sau khi đấu lại boss (3D); đạn dễ thấy trên mọi nền (viền sẫm, màu đậm trên map sáng); HUD cảm ứng không chồng lấn (ngang + dọc), gợi ý xoay ngang tự ẩn; cảnh vật tự nhiên hơn (vệt loang thay hình tròn, tán cây nhiều chùm, gỗ có vân) — xem K-20…K-23 |
| 2026-10-02 | **v6.0** · README rev 16 | **Màn 2 "Nguồn Gốc"**: cảnh chuyển sau Gate 10 (GoatEvil, Giáo sư Ted, mẩu giấy), bộ đàm trong trận, hệ thống manh mối 10 mảnh; **Gate 11 Hà Nội – Hồ Gươm** và **Gate 12 Hội An – phố đèn lồng** với thắng cảnh nhận diện được, đồ hoạ 2D chiều sâu (mái/tán đè, mặt tiền 3/4, bóng đổ) và 3D (ánh sáng theo Gate, đèn điểm bám theo); 4 quái mới, 2 boss mới; tab Màn 1/Màn 2; ánh sáng 3D tuỳ Gate (`light3d`); bóng tối có lỗ sáng; file mới `js/story.js`, `js/gates/gate11-hanoi.js`, `js/gates/gate12-hoian.js`; schema Supabase cho gate 1–30 |
| 2026-10-02 | **v5.5.1** · README rev 15 | iPhone: nút loa trong game quyết định có tiếng hay không, kể cả khi máy gạt im lặng |
| 2026-10-02 | **v5.5** · README rev 14 | **Nút loa** bật/tắt âm thanh (phím M) ở menu và trong trận; **nhạc chủ đề hồi hộp** phát từ màn hình đầu; tôn trọng nút im lặng của iPhone (bỏ cách ép phát của v5.4.1); tạm dừng âm thanh khi ẩn app |
| 2026-10-02 | **v5.4.1** · README rev 13 | Sửa **iPhone không có âm thanh** (nút im lặng, mở khoá âm thanh theo thao tác chạm, khôi phục sau khi chuyển app) — xem K-17 |
| 2026-10-02 | **v5.4** · README rev 12 | **Đăng nhập Google (không bắt buộc)** qua Supabase Auth; **đồng bộ tiến trình** giữa các máy (gộp thông minh, không gộp chéo tài khoản); **bảng xếp hạng online** theo Gate × Chiến dịch/Sinh tồn (top 50, ảnh + tên Google); lời mời đăng nhập ở menu và màn kết quả; `supabase/schema.sql` (bảng + RLS + hàm `mb_submit_score`, đã thử trên Postgres 16); thư viện supabase-js tự chứa trong repo, chỉ tải khi cần |
| 2026-10-02 | **v5.3** · README rev 11 | **Bắn chạm** trên điện thoại (chạm/giữ bên phải = bắn vào điểm chạm, kéo = gậy ngắm) và **nút NGẮM** trên màn hình đổi Tự động / Hỗ trợ / Tay; **xu + cửa hàng nâng cấp vĩnh viễn** (7 mục); **thẻ nâng cấp** chọn 1/3 sau mỗi wave (12 thẻ); **combo** nhân điểm; **khựng hình** và **rung**; báo boss đổi phase; chế độ **Sinh tồn** vô hạn với kỷ lục theo Gate; file mới `js/progress.js` |
| 2026-10-02 | **v5.2** · README rev 10 | **Cơ hội đấu lại Boss 1 lần mỗi Gate**: gục ở trận boss lần đầu → chọn đấu lại tại chỗ (hồi đầy máu/giáp/đạn/kỹ năng, giữ súng, linh kiện và điểm, dọn quái/đạn/vùng nguy hiểm tạm, bất tử 3 giây, boss hồi sinh đầy máu sau 3 giây) hoặc chấp nhận thua. Màn hình mới `#retry`, hàm `G.retryBoss()`, `App.offerBossRetry()` |
| 2026-10-02 | **v5.1.2** · README rev 9 | **Tự cập nhật cho app đã cài ra màn hình chính**: thêm `version.json`; game kiểm tra khi app mở lại / vào menu / mỗi 5 phút, tự tải lại (đang chơi thì chờ về menu); service worker bỏ qua cache HTTP và không cache `version.json` |
| 2026-10-02 | **v5.1.1** · README rev 8 | **Sửa gốc lỗi đen màn hình khi sang Gate mới (3D)**: camera 3D tính bước thời gian âm (đồng hồ Gate mới về 0) → toạ độ NaN. Reset mốc thời gian khi dựng màn, kẹp dt ≥ 0, chặn NaN. Thêm test: chơi Gate dài rồi sang Gate kế |
| 2026-10-02 | **v5.1** · README rev 7 | Sửa **đen màn hình trên điện thoại khi sang Gate mới** (3D): dọn sạch geometry/vật liệu/texture/shadow map khi đổi màn; điện thoại dùng pixel ratio ≤ 1,25, shadow map 1024, không khử răng cưa; bắt `webglcontextlost` → tự chuyển 2D kèm thông báo, `webglcontextrestored` → dựng lại 3D; lỗi vẽ 3D → tự về 2D. Nút **đổi 2D ⇄ 3D giữa trận** trong menu Tạm dừng. **Bố cục cảm ứng gọn**: bỏ nút ĐỔI (chạm ô súng để đổi), cụm nút nhỏ hơn ~40%, ô súng 1 dòng, HUD và minimap nhỏ, trong hơn |
| 2026-10-02 | **v5.0** · README rev 6 | **Hoàn thành Gate 03–10** (Swamp, Snow, Volcano, Ocean, Industrial, City, Laboratory, Apocalypse) với 20 loại quái mới và 8 boss mới; **3D cho cả 10 Gate** (Gate 02 có model mới); 5 súng mới (Rail Lancer, Pyro F-9, Boomer GL, Arc Plasma, Tempest MG), phím 1–8; khuôn hành vi quái dùng lại được; hệ thống vụ nổ dùng chung; vùng nguy hiểm mới (bùn, axit, khí độc, dung nham, lửa, băng, nước, dầu); trạng thái bỏng và đóng băng; vật thể động (actors); lớp phủ màn hình (bão tuyết, mực, tro); **dẫn đường flow field** để quái vòng qua tường/kênh; minimap vẽ đúng hình hộp và màu vùng nguy hiểm |
| 2026-10-02 | **v4.2** · README rev 5 | Ngắm mượt (giới hạn tốc độ xoay, cài đặt Chậm/Vừa/Nhanh, vùng chết quanh nhân vật); chế độ ngắm Tự động/Hỗ trợ/Thủ công cho điện thoại; **lựu đạn** và **xung kích** giải vây; quái bị choáng; **thùng y tế thả dù** khi máu thấp; rơi máu nhiều hơn khi yếu; lựu đạn rơi từ thùng và quái tinh nhuệ; dựng lại model 3D hữu cơ (chi nhiều khớp, đầu, hàm, móng, bề mặt sần) cho Hunter, Zombie, Spider, Licker, Spider Queen; nút LỰU/XUNG trên điện thoại; tay cầm: RB lựu đạn, B xung kích |
| 2026-10-02 | **v4.1** · README rev 4 | Chế độ **3D thử nghiệm** cho Gate 01 bằng Three.js (camera phối cảnh, bóng đổ, model low-poly cho Hunter, 3 loại quái, Spider Queen và môi trường); nút chọn 2D/3D; tự giảm chất lượng khi máy chậm; tách vạch cảnh báo của quái ra hàm `tele()` dùng chung cho 2D và 3D; minimap cắt đúng khung |
| 2026-10-01 | **v4.0** · README rev 3 | Viết lại thành dự án nhiều file. Nhân vật Hunter mới; hệ thống thiết bị và thử thách thay cho nâng cấp tự động; 3 súng; 5 linh kiện; Gate 02 Mountain (Bat, Brute, Stone Behemoth, đá lăn, vực); boss nhiều phase; điều khiển cảm ứng, tay cầm, PWA; menu, lưu tiến trình; sửa 15 lỗi của v3 |
| 2026-10-19 | **v8.5.0** · README rev 40 | **Chơi tự do (tạm thời, chưa có Supabase)**: cờ `FREE` trong `js/access.js` mở mọi cửa 01–21, bỏ đăng nhập / thu phí / cửa ác mộng / giới hạn giờ Sinh tồn, ẩn Đăng nhập + Bảng xếp hạng, không gọi máy chủ. **Ủng hộ cố định** Vietcombank 0111000182684 (QR `assets/donate/vcb-qr.png`): thẻ QR trong khoảng tối giữa menu và Hunter trên máy tính; hộp QR 1 lần khi vào game trên điện thoại; nhắc lại sau mỗi cửa thắng (mọi thiết bị). Thêm QR vào cache offline (`sw.js`). |

---

### Quy tắc cập nhật README

Sau mỗi thay đổi code:

1. Tăng phiên bản ở bảng đầu, trong `sw.js` và badge trong `index.html`.
2. Cập nhật bảng thông số tương ứng (súng, quái, boss, Gate).
3. Cập nhật mục Vấn đề đã biết và tick Roadmap.
4. Thêm một dòng vào Lịch sử thay đổi.
