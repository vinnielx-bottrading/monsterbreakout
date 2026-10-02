# Monster Breakout

Game bắn súng sinh tồn góc nhìn từ trên xuống. Người chơi điều khiển đặc nhiệm **Hunter** vượt qua 10 cửa ải (Gate) bị virus chiếm đóng. Game viết bằng HTML5 Canvas và JavaScript thuần, không cần bước build, chơi được trên máy tính, điện thoại và tay cầm. Có thể cài lên màn hình chính như một app (PWA).

| Hạng mục | Giá trị |
|---|---|
| Phiên bản | **v6.3** (bản dựng lại từ `monster_breakout_gate01_v3.html`) |
| Gate chơi được | **Màn 1: Gate 01–10** · **Màn 2 "Nguồn Gốc": Gate 11–12** (13–21 sắp ra mắt). Tất cả chơi được ở 2D và 3D |
| Nền tảng | Máy tính (Chrome, Edge, Firefox, Safari), điện thoại (cảm ứng), tay cầm |
| Triển khai | GitHub + Vercel (trang tĩnh) |
| Lưu tiến trình | `localStorage`, khoá `monster_breakout_save_v1`; đăng nhập Google thì đồng bộ lên Supabase (mục 2b) |
| Đồ hoạ | 2D Canvas; 3D bằng Three.js r170 (tự chứa trong repo, không cần CDN) |
| README cập nhật | 2026-10-02 (rev 21) |

---

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

Không bắt buộc: khách vẫn chơi bình thường, tiến trình lưu trên máy. Đăng nhập Google thì tiến trình (gate đã mở, sao, kỷ lục, súng, xu, nâng cấp) được lưu lên Supabase và có tên trên bảng xếp hạng.

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

## 3. Cấu trúc dự án

```
index.html               Khung trang, HUD, menu, các màn hình
manifest.webmanifest     Thông tin PWA (icon, chế độ toàn màn hình ngang)
sw.js                    Service worker: chơi offline sau lần tải đầu
version.json             Số phiên bản; app so với server để tự cập nhật
vercel.json              Cấu hình header cho Vercel
css/style.css            Giao diện, bố cục responsive cho điện thoại
assets/icons/            Icon app (svg, 192, 512)
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
js/story.js              Cốt truyện: cảnh chuyển (canvas), bộ đàm trong trận, manh mối của GS. Ted
js/cloud.js              Đăng nhập Google (Supabase), đồng bộ tiến trình, bảng xếp hạng
js/progress.js           Xu & cửa hàng nâng cấp vĩnh viễn, thẻ nâng cấp trong trận, combo, rung điện thoại
js/hud.js                HUD (DOM), chỉ cập nhật khi giá trị thay đổi
js/game.js               Runtime một Gate: wave, đạn, va chạm, vụ nổ, dẫn đường (flow field), camera, minimap, vẽ
js/main.js               Menu, chọn Gate, tải file Gate theo yêu cầu, vòng lặp, nút 2D/3D
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

Với Rifle, nếu nhặt tối đa D5 + F5, DPS lên khoảng 510 (gấp 2,8 lần). Muốn đạt mức đó phải tích cực phá thùng và làm thử thách. Gate 08–10 thưởng linh kiện hiếm thay vì súng.

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
| 13–21 | 🔒 Sắp ra mắt | Theo dấu manh mối (gợi ý: Hạ Long…) · Gate 21: trận cuối | | | |

### Màn 2 · Nguồn Gốc — cốt truyện (v6.0)

- **Cảnh chuyển sau Gate 10** (khoảng 1 phút, chạm để sang câu, có nút BỎ QUA, xem lại được ở tab MÀN 2): The Origin gục ngã → **GoatEvil** (AI hiện hình đầu dê ba chiều, giọng méo, cười man rợ rồi vỡ vụn) → căn cứ bị phá, **Giáo sư Ted** nằm bất động, tay nắm mẩu giấy → cận cảnh mẩu giấy cháy dở ghi *Hồ Gươm · Tháp Rùa* + toạ độ + ký hiệu đầu dê → Hunter lên đường, hiện chữ **MÀN 2 · NGUỒN GỐC**. Vẽ hoàn toàn bằng code (canvas), âm thanh tổng hợp (tiếng cười, nhiễu sóng, báo động, nhịp tim).
- **Bộ đàm trong trận**: GoatEvil khiêu khích lúc vào trận, ở wave 2, khi Hunter yếu máu, khi boss xuất hiện / đổi giai đoạn; Hunter tự nói khi thắng. Khung nhỏ phía trên, không dừng game. (`comms` trong định nghĩa Gate.)
- **Manh mối của Giáo sư Ted**: mỗi Gate Màn 2 giấu 1 mẩu giấy phát sáng (Gate 11: trong sân Đền Ngọc Sơn; Gate 12: kho số 7 bến sông). Nhặt được → hiện trang ghi chép, lưu vào `Save.data.clues` (đồng bộ lên mạng nếu đăng nhập). Gom đủ 10 mảnh (Gate 11–20) để mở **kết thúc thật** ở Gate 21.
- ⚠️ **Tiết lộ cốt truyện — Sự thật (chưa lộ trong game)**: chính Ted là trùm cuối — vì lòng tham bá quyền, ông dựng vở kịch "bị sát hại", tạo GoatEvil làm bình phong và gieo virus khắp thế giới. Các ghi chép cài sẵn dấu hiệu: chủng V-0 có từ 12 năm trước, hoá đơn ký tên "T.K." mà "tôi đã thấy mỗi ngày suốt mười hai năm".
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

---

### Quy tắc cập nhật README

Sau mỗi thay đổi code:

1. Tăng phiên bản ở bảng đầu, trong `sw.js` và badge trong `index.html`.
2. Cập nhật bảng thông số tương ứng (súng, quái, boss, Gate).
3. Cập nhật mục Vấn đề đã biết và tick Roadmap.
4. Thêm một dòng vào Lịch sử thay đổi.
