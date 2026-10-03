# Nguồn tài nguyên (v6.5)

## Âm thanh — `assets/audio/`
Toàn bộ hiệu ứng và nhạc nền được dựng lại bằng script (tổng hợp + xử lý offline), có trộn các mẫu âm sau:
- **Sonic Pi sample pack** (github.com/sonic-pi-net/sonic-pi, thư mục `etc/samples`) — mẫu gốc từ freesound.org, **CC0 1.0**. Dùng: misc_cineboom, drum_heavy_kick, drum_tom_*_hard, drum_snare_hard, drum_cymbal_open, drum_splash_hard, perc_impact1, perc_swoosh, perc_swash, ambi_drone, ambi_haunted_hum, ambi_dark_woosh, ambi_choir, bd_boom.
- **Kenney — Starter Kit FPS** (github.com/KenneyNL/Starter-Kit-FPS) — âm thanh **CC0 1.0**. Dùng: blaster (lớp phụ cho súng plasma).
Phần còn lại (tiếng súng, nổ, quái gầm, nhạc dàn dây/kèn/trống) là âm tổng hợp do dự án tự tạo.

## Mô hình 3D — `assets/models/`
- `hunter.glb` — từ `Soldier.glb` trong three.js examples (mô hình & hoạt ảnh gốc của **Mixamo / Adobe**), đã tô lại màu, giảm texture, lược kênh hoạt ảnh.
- `hunter_swat.glb` (v8.4) — nhân vật **Swat Guy** + hoạt ảnh Rifle Idle / Walk / Run / Firing Rifle / Hit Reaction / Dying từ **Mixamo (Adobe)**, chuyển sang glTF, giảm texture.
- `zombie_real.glb` (v8.4.1) — nhân vật xác sống + hoạt ảnh Zombie Idle / Walk / Running / Attack / Dying từ **Mixamo (Adobe)**, chuyển sang glTF, giảm texture.
- `zombie.glb` — từ `Xbot.glb` trong three.js examples (gốc **Mixamo / Adobe**), đã giảm lưới ~78%, chỉ giữ idle / walk / run.
Điều khoản Mixamo cho phép dùng nhân vật & hoạt ảnh trong dự án (kể cả thương mại), không được phân phối lại dạng tài nguyên rời để người khác tải về dùng.

## Thư viện
- three.js r170 (MIT) — `js/vendor/three.module.min.js`, `js/vendor/three-addons.min.js` (GLTFLoader + SkeletonUtils, đóng gói bằng esbuild).
