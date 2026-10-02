# Monster Breakout

Game bắn súng sinh tồn góc nhìn từ trên xuống. Người chơi điều khiển đặc nhiệm **Hunter** vượt qua 10 cửa ải (Gate) bị virus chiếm đóng. Game viết bằng HTML5 Canvas và JavaScript thuần, không cần bước build, chơi được trên máy tính, điện thoại và tay cầm. Có thể cài lên màn hình chính như một app (PWA).

| Hạng mục | Giá trị |
|---|---|
| Phiên bản | **v4.1** (bản dựng lại từ `monster_breakout_gate01_v3.html`) |
| Gate chơi được | Gate 01 Jungle (2D + **3D thử nghiệm**), Gate 02 Mountain (2D) |
| Nền tảng | Máy tính (Chrome, Edge, Firefox, Safari), điện thoại (cảm ứng), tay cầm |
| Triển khai | GitHub + Vercel (trang tĩnh) |
| Lưu tiến trình | `localStorage`, khoá `monster_breakout_save_v1` |
| Đồ hoạ | 2D Canvas; 3D bằng Three.js r170 (tự chứa trong repo, không cần CDN) |
| README cập nhật | 2026-10-02 (rev 4) |

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
5. **Mỗi lần phát hành bản mới, tăng `VERSION` trong `sw.js`** để máy người chơi nhận bản mới thay vì bản đã lưu cache.

`vercel.json` đã cấu hình sẵn header để `sw.js` không bị cache và file JS/CSS luôn được kiểm tra bản mới.

## 3. Cấu trúc dự án

```
index.html               Khung trang, HUD, menu, các màn hình
manifest.webmanifest     Thông tin PWA (icon, chế độ toàn màn hình ngang)
sw.js                    Service worker: chơi offline sau lần tải đầu
vercel.json              Cấu hình header cho Vercel
css/style.css            Giao diện, bố cục responsive cho điện thoại
assets/icons/            Icon app (svg, 192, 512)
js/core.js               Tiện ích, va chạm (tròn / hộp xoay), lưu game, registry
js/props.js              Vẽ vật cản (cây, đá, khúc gỗ, thùng) và vùng nguy hiểm
js/input.js              Bàn phím + chuột, twin-stick cảm ứng, gamepad
js/audio.js              Âm thanh tổng hợp bằng WebAudio (không cần file mp3)
js/weapons.js            Súng, linh kiện nâng cấp (mod), bắn đạn
js/hero.js               Nhân vật Hunter: di chuyển, thể lực, lộn né, vẽ
js/enemies.js            Quái dùng chung: Zombie, Spider, Licker + AI lái hướng
js/items.js              Vật phẩm rơi và hệ thống thử thách
js/hud.js                HUD (DOM), chỉ cập nhật khi giá trị thay đổi
js/game.js               Runtime một Gate: wave, đạn, va chạm, camera, minimap, vẽ
js/main.js               Menu, chọn Gate, tải file Gate theo yêu cầu, vòng lặp, nút 2D/3D
js/render3d.js           Bộ vẽ 3D (chỉ tải khi chọn 3D): model nhân vật, quái, vật cản, camera, ánh sáng
js/vendor/three.module.min.js  Thư viện Three.js r170 (~690 KB, ~170 KB khi nén gzip), chỉ tải khi chơi 3D
js/gates/index.js        Danh sách 10 Gate (tên, màu, file)
js/gates/gate01-jungle.js    Bản đồ, boss Spider Queen, thử thách Gate 01
js/gates/gate02-mountain.js  Bản đồ, quái Bat/Brute, boss Stone Behemoth, đá lăn Gate 02
```

**Vì sao tách file:** phần engine dùng chung (khoảng 110 KB) được tải một lần. Mỗi Gate là một file riêng 15–25 KB, chỉ được tải khi người chơi chọn Gate đó. Nhờ vậy khi có đủ 10 Gate, lần tải đầu vẫn nhẹ, và mỗi Gate có thể được sửa độc lập.

## 3b. Chế độ 3D (thử nghiệm, v4.1)

Chọn ở màn hình **Chọn cửa ải** (nút **2D / 3D**) hoặc trong **Cài đặt → Góc nhìn**. Mặc định là 3D; Gate chưa có bản 3D tự chạy 2D.

**Cách hoạt động:** logic game (va chạm, AI, đạn, wave, thử thách) dùng chung cho cả 2D và 3D. `render3d.js` chỉ đọc trạng thái game mỗi khung hình và dựng cảnh 3D tương ứng. Nhờ vậy cách chơi, điều khiển, điểm số, lưu tiến trình giống hệt nhau giữa hai chế độ.

| Thành phần | Trong 3D |
|---|---|
| Camera | Phối cảnh, nghiêng 61°, nhìn từ phía nam, đi theo nhân vật và nhìn trước theo hướng ngắm; rung khi trúng đòn |
| Ánh sáng | Đèn bầu trời + mặt trời có bóng đổ mềm, sương mù ở xa, tone mapping ACES |
| Nền | Dùng lại texture vẽ của bản 2D; vết máu/virus được vẽ thêm lên nền |
| Hunter | Model low-poly: giáp, vai, bình lọc phát sáng, mũ có visor cyan, súng đổi theo vũ khí. Chân bước theo hướng chạy, thân xoay theo hướng ngắm, giật súng, nghiêng súng khi nạp, chớp nòng, bóng mờ khi lộn né, ngã khi chết |
| Quái | Zombie, Spider, Licker, Spider Queen có model riêng, có hoạt ảnh bước, chớp trắng khi trúng, trồi lên khi xuất hiện, vòng tím cho quái tinh nhuệ |
| Môi trường | Cây (tán làm mờ khi che nhân vật), đá, khúc gỗ, thùng tiếp tế, ổ virus, trạm tín hiệu có đèn nháy, hồ virus phát sáng có bong bóng |
| Lớp phủ mặt đất | Vạch cảnh báo đỏ, vòng sóng chấn, vùng thử thách vẽ lên một mặt phẳng sát đất |
| Lớp 2D trên cùng | Số sát thương, thanh máu quái, mũi tên chỉ hướng, minimap, tâm ngắm, laser ngắm (cảm ứng) |
| Tự giảm chất lượng | Nếu FPS dưới khoảng 30 trong 3 giây: hạ độ phân giải, rồi tắt bóng đổ |

Mỗi khung hình, phần JS dựng cảnh 3D tốn khoảng 0,1 ms (đo bằng trình duyệt headless); phần còn lại là GPU.

**Thêm 3D cho Gate khác:** thêm `view3d: true` vào định nghĩa Gate, `has3d: true` trong `js/gates/index.js`, rồi viết model cho quái/boss/vật cản mới trong `render3d.js` (`MODELS` và `buildProp`). Quái hoặc vật cản chưa có model sẽ hiện dạng khối đơn giản.

## 4. Điều khiển

| Hành động | Máy tính | Điện thoại | Tay cầm |
|---|---|---|---|
| Di chuyển | W A S D / phím mũi tên | Chạm và kéo ở nửa trái màn hình | Cần trái |
| Ngắm | Chuột | Chạm và kéo ở nửa phải màn hình | Cần phải |
| Bắn | Giữ chuột trái | Kéo gậy phải ra quá 30% là tự bắn | RT (hoặc đẩy cần phải mạnh) |
| Lộn né (bất tử 0,3 giây) | Space / chuột phải | Nút **NÉ** | A / B |
| Chạy nhanh | Giữ Shift | Đẩy gậy trái hết cỡ | LB |
| Nạp đạn | R | Nút **NẠP** | X |
| Đổi súng | Q / 1 2 3 / cuộn chuột | Nút **ĐỔI** | Y |
| Tạm dừng | Esc / P | Nút ❚❚ | Start |

- Phím dùng `e.code`, nên vẫn hoạt động khi đang bật bộ gõ Telex hay VNI.
- Trên điện thoại có **hỗ trợ ngắm**: hướng ngắm tự nắn nhẹ về phía quái gần nhất trong góc khoảng 18°. Có thể tắt trong Cài đặt.
- Gậy điều khiển là loại "trôi": kéo ngón tay ra quá xa thì đế gậy đi theo.
- Game tự tạm dừng khi chuyển tab hoặc khi app bị ẩn.

## 5. Vòng chơi

```
Chọn Gate → Wave 1 → nghỉ 5s → Wave 2 → nghỉ 5s → Wave 3 → cảnh báo Boss → Boss → Kết quả
     (bất kỳ lúc nào: phá thùng tiếp tế, làm thử thách để mạnh lên)
```

- **Thắng:** hạ boss. Gate kế tiếp được mở khoá.
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

Với Rifle, nếu nhặt tối đa D5 + F5, DPS lên khoảng 510 (gấp 2,8 lần). Muốn đạt mức đó phải tích cực phá thùng và làm thử thách, khác với bản v3 tăng tự động 3,5 lần chỉ sau 3 wave.

## 7. Nhân vật Hunter

| Thông số | Giá trị |
|---|---|
| HP | 100 |
| Giáp | Tối đa 60, đỡ sát thương trước HP |
| Tốc độ | 235 (chạy nhanh ×1,5; đang bắn ×0,88; trong hồ virus ×0,8; dính mạng nhện ×0,55) |
| Thể lực | 100; chạy nhanh tốn 30/s, lộn né tốn 18. Cạn thể lực thì phải hồi tới 35 mới chạy lại được |
| Lộn né | 0,19 s, tốc độ 700, bất tử 0,3 s, hồi chiêu 1 s |
| Sau khi trúng đòn | Bất tử 0,55 s, bị đẩy lùi |

**Ngoại hình:** giáp màu xanh lam đậm, sọc cam cảnh báo sinh học, mũ có kính visor phát sáng màu cyan, bình lọc virus màu xanh sau lưng. Chân quay theo hướng chạy, thân quay theo hướng ngắm. Nhân vật có hoạt ảnh bước chân, giật súng, chớp nòng, vỏ đạn văng ra, súng nghiêng khi nạp đạn, bóng mờ khi lộn né và chớp đỏ khi trúng đòn. Dưới chân có vòng cyan để dễ nhận ra giữa đám quái.

## 8. Quái vật

| Quái | HP | Tốc độ | Sát thương | Điểm | Hành vi |
|---|---|---|---|---|---|
| Zombie | 60 | 62 (+ dồn lên theo nhịp) | 10 | 100 | Đi theo đàn, áp sát |
| Spider | 34 | 125, chạy zigzag | 8 | 140 | Ở gần dưới 190 thì khom 0,3 s rồi vồ tới (420) |
| Licker | 85 | 100 (135 khi ở xa) | 12 | 220 | Ở cách 60–270 thì dừng, hiện **vạch đỏ** 0,55 s rồi phóng lưỡi |
| Bat *(G02)* | 26 | 160, bay | 7 | 120 | Lượn vòng quanh người chơi rồi bổ nhào; bay qua cả vật cản và vực |
| Brute *(G02)* | 260 | 50 | 18 | 420 | Hiện vạch đỏ 0,85 s rồi húc (470). Đâm vào vật cản thì bị choáng 1,5 s và nhận **×2** sát thương |

Quái tinh nhuệ xuất hiện từ wave 2 (Gate 02 từ wave 1) với tỉ lệ 5–13%.

### Boss

| Boss | HP | Phase | Kỹ năng |
|---|---|---|---|
| **Spider Queen** (G01) | 4.200 | 1: trên 60% · 2: 25–60% · 3: dưới 25% | Bắn quạt 5/7 viên độc; gọi nhện con (tối đa 8 con cùng lúc); từ P2: lao tới có vạch báo trước, bắn mạng nhện làm chậm; P3: bắn xoáy 3 tia. Đâm vào vật cản thì choáng 1,3 s, nhận +50% sát thương |
| **Stone Behemoth** (G02) | 6.000 | 1: trên 55% · 2: 25–55% · 3: dưới 25% | Đập đất tạo vòng sóng chấn (vòng đỏ báo trước, lộn né để xuyên qua); ném tảng đá vỡ thành 6 mảnh; từ P2: húc, gọi 3 dơi; P3: sóng chấn kép. Đâm vào vật cản thì choáng 1,6 s, nhận +60% sát thương |

Boss xuất hiện theo hướng đấu trường, cách người chơi tối đa khoảng 650 đơn vị.

## 9. Các Gate

| Gate | Trạng thái | Cơ chế riêng | Quái | Boss | Thử thách → Thưởng |
|---|---|---|---|---|---|
| 01 Jungle | ✅ Chơi được | Hồ virus (10–12 HP/s, làm chậm), cây, đá, khúc gỗ | Zombie, Spider, Licker | Spider Queen | Phá 3 ổ virus (ổ sinh nhện) → **Shotgun** · Giữ trạm tín hiệu 12 s → **Lõi Xuyên Phá** · 12 hạ gục liên tiếp không trúng đòn → **Cò Siêu Tốc** |
| 02 Mountain | ✅ Chơi được | Vực sâu (chặn đi bộ, đạn bay qua), 3 làn đá lăn (vạch đỏ báo 1,5 s; 25 sát thương, nghiền quái), vách đá | + Bat, Brute | Stone Behemoth | Phá 4 tinh thể virus → **SMG** · Giữ trạm radio 14 s → **Bộ Chia Tia** · 15 hạ gục không trúng đòn → **Nòng Tăng Lực** |
| 03 Swamp | Chưa làm | Bùn lún làm chậm | Sinh vật đầm lầy | ? | |
| 04 Snow | Chưa làm | Bão tuyết giảm tầm nhìn, băng trơn | Zombie băng | ? | |
| 05 Volcano | Chưa làm | Dung nham, đá nóng | Sinh vật lửa | ? | |
| 06 Ocean | Chưa làm | Đảo, tàu | Quái biển | ? | |
| 07 Industrial | Chưa làm | Hoá chất, máy móc | Máy móc lai sinh vật | ? | |
| 08 City | Chưa làm | Đô thị đổ nát | Zombie đông đàn, Licker | ? | |
| 09 Laboratory | Chưa làm | Phòng thí nghiệm | Clone, biến đổi gen | ? | |
| 10 Apocalypse | Chưa làm | Tổng hợp | Tất cả | The Origin | |

### Cách thêm một Gate mới

1. Copy `js/gates/gate02-mountain.js` thành `gate03-swamp.js`.
2. Sửa `id`, `world`, `start`, `obstacles`, `crates`, `hazards`, `spawnPoints`, `waves`, `boss`, `objectives`, `challenges`, `buildGround`.
3. Quái hoặc boss mới thì đăng ký ngay trong file đó bằng `MB.Enemies.register('ten', { r, hp, speed, dmg, score, init, update, draw })`. Vật cản mới dùng `MB.Props.register('kind', drawFn)`.
4. Cơ chế riêng của Gate viết trong `setup(G)`, `update(G, dt)`, `drawUnder` / `drawOver(G, ctx)`.
5. Điền `file: 'js/gates/gate03-swamp.js'` vào `js/gates/index.js`.
6. Thêm đường dẫn file vào mảng `CORE` trong `sw.js` và tăng `VERSION`.
7. Cập nhật README: bảng Gate, quái, boss và lịch sử thay đổi.

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
| K-01 | Trung bình | Cân bằng mới chỉ được kiểm tra bằng bot tự động ngắm. Bot qua Gate 01 trong khoảng 2 phút nên đã tăng HP boss; cần người thật chơi thử | Cần test |
| K-02 | Trung bình | Chưa thử trên iPhone và Android thật, chỉ mới giả lập bằng Chromium (iPhone 13 ngang/dọc) | Cần test |
| K-03 | Thấp | Chế độ dọc (portrait) vẫn chơi được nhưng chật; game hiện gợi ý xoay ngang | Mở |
| K-04 | Thấp | Nhân vật và quái vẽ bằng code (vector); chưa có sprite hay spritesheet | Roadmap |
| K-05 | Thấp | Nhạc nền mới là drone đơn giản | Roadmap |
| K-06 | Thấp | Chỉ có 3 súng; Grenade, Sniper, Flamethrower và vũ khí cận chiến chưa có | Roadmap |
| K-07 | Trung bình | 3D chưa đo FPS trên GPU thật (môi trường test chỉ có GPU giả lập bằng CPU). Cần thử trên điện thoại tầm trung | Cần test |
| K-08 | Thấp | 3D chỉ có ở Gate 01. Gate 02 cần model cho Bat, Brute, Stone Behemoth, vực, vách đá, tinh thể, đá lăn | Roadmap |
| K-09 | Thấp | 3D không chạy khi mở file trực tiếp (file://); game tự về 2D | Đã xử lý |

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

- [ ] Grenade Launcher, Sniper, Flamethrower, vũ khí cận chiến
- [ ] Sprite/animation vẽ tay cho Hunter (nếu muốn chuyển từ vector sang pixel art)
- [ ] Mini boss giữa wave
- [ ] Nhạc nền theo từng Gate

### M3: Tiến trình

- [ ] Cây nâng cấp vĩnh viễn (dùng điểm hoặc sao)
- [ ] Skill chủ động (ví dụ: lựu đạn, khiên)
- [ ] Bảng xếp hạng online (cần backend, ví dụ Supabase)

### M4: Gate 03 → 10

- [ ] Mỗi Gate có 1 cơ chế địa hình mới, 1–2 quái mới, 1 boss riêng và 3 thử thách

## 13. Checklist kiểm thử trước mỗi bản phát hành

- [ ] Console không có lỗi khi chơi hết Gate 01 và Gate 02
- [ ] Chết ở mỗi wave rồi bấm "Chơi lại"
- [ ] Hoàn thành từng loại thử thách, nhặt súng mới, kiểm tra súng có trong kho ở Gate sau
- [ ] Lộn né xuyên qua sóng chấn của Behemoth
- [ ] Dụ boss đâm vào đá, kiểm tra trạng thái choáng
- [ ] Chuyển tab 10 giây rồi quay lại: game phải đang tạm dừng
- [ ] Điện thoại: hai gậy hoạt động cùng lúc, các nút bấm được, HUD không che gậy
- [ ] Cài PWA, tắt mạng rồi mở lại: vẫn chơi được
- [ ] Chơi Gate 01 ở cả 2D và 3D; chuyển qua lại 2D/3D giữa các lần chơi
- [ ] Tăng `VERSION` trong `sw.js`

## 14. Lịch sử thay đổi

| Ngày | Phiên bản | Thay đổi |
|---|---|---|
| — | v1, v2 | Không có ghi chép |
| — | Gate 01 v3 | 1 file HTML: movement có gia tốc, Rifle Mk I–IV tự nâng theo wave, Zombie/Spider/Licker, Spider Queen, hồ virus |
| 2026-10-01 | README rev 2 | Đánh giá README, thêm bảng lỗi và roadmap |
| 2026-10-02 | **v4.1** · README rev 4 | Chế độ **3D thử nghiệm** cho Gate 01 bằng Three.js (camera phối cảnh, bóng đổ, model low-poly cho Hunter, 3 loại quái, Spider Queen và môi trường); nút chọn 2D/3D; tự giảm chất lượng khi máy chậm; tách vạch cảnh báo của quái ra hàm `tele()` dùng chung cho 2D và 3D; minimap cắt đúng khung |
| 2026-10-01 | **v4.0** · README rev 3 | Viết lại thành dự án nhiều file. Nhân vật Hunter mới; hệ thống thiết bị và thử thách thay cho nâng cấp tự động; 3 súng; 5 linh kiện; Gate 02 Mountain (Bat, Brute, Stone Behemoth, đá lăn, vực); boss nhiều phase; điều khiển cảm ứng, tay cầm, PWA; menu, lưu tiến trình; sửa 15 lỗi của v3 |

---

### Quy tắc cập nhật README

Sau mỗi thay đổi code:

1. Tăng phiên bản ở bảng đầu, trong `sw.js` và badge trong `index.html`.
2. Cập nhật bảng thông số tương ứng (súng, quái, boss, Gate).
3. Cập nhật mục Vấn đề đã biết và tick Roadmap.
4. Thêm một dòng vào Lịch sử thay đổi.
