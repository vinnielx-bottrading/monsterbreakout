/* Danh sách Gate theo Màn (MB.Gates.acts: thông tin hiển thị từng Màn ở màn chọn cửa). Gate có `file` sẽ được tải khi người chơi chọn (lazy load).
   `requires`: các Gate cần tải trước (để dùng lại quái của Gate đó). */
'use strict';
window.MB.Gates.meta = [
  { id: 1, key: 'jungle', name: 'Jungle', vi: 'Rừng Nhiễm Độc', file: 'js/gates/gate01-jungle.js', has3d: true, color: '#7dd35c', boss: 'Spider Queen' },
  { id: 2, key: 'mountain', name: 'Mountain', vi: 'Vách Núi Đá Lăn', file: 'js/gates/gate02-mountain.js', has3d: true, color: '#d0a374', boss: 'Stone Behemoth' },
  { id: 3, key: 'swamp', name: 'Swamp', vi: 'Đầm Lầy Đột Biến', file: 'js/gates/gate03-swamp.js', has3d: true, color: '#6fae8f', boss: 'Toad King' },
  { id: 4, key: 'snow', name: 'Snow', vi: 'Bão Tuyết', file: 'js/gates/gate04-snow.js', has3d: true, color: '#a8d8ff', boss: 'Cryo Wyrm' },
  { id: 5, key: 'volcano', name: 'Volcano', vi: 'Miệng Núi Lửa', file: 'js/gates/gate05-volcano.js', has3d: true, color: '#ff7a45', boss: 'Magma Titan' },
  { id: 6, key: 'ocean', name: 'Ocean', vi: 'Đảo Hoang', file: 'js/gates/gate06-ocean.js', has3d: true, color: '#4fb3d9', boss: 'Kraken' },
  { id: 7, key: 'industrial', name: 'Industrial', vi: 'Nhà Máy Hoá Chất', file: 'js/gates/gate07-industrial.js', has3d: true, color: '#c9c95a', boss: 'Assembler Mech' },
  { id: 8, key: 'city', name: 'City', vi: 'Đô Thị Đổ Nát', file: 'js/gates/gate08-city.js', has3d: true, color: '#b0a3c9', boss: 'Abomination' },
  { id: 9, key: 'lab', name: 'Laboratory', vi: 'Phòng Thí Nghiệm', file: 'js/gates/gate09-lab.js', has3d: true, color: '#7ef3ff', boss: 'Specimen Omega' },
  { id: 10, act: 1, key: 'apocalypse', name: 'Apocalypse', vi: 'Tận Thế', file: 'js/gates/gate10-apocalypse.js', has3d: true, requires: [1, 2, 3, 4, 5, 6, 7, 8, 9], color: '#ff5b6e', boss: 'The Origin' },
  // ===== MÀN 2 · NGUỒN GỐC (Việt Nam) =====
  { id: 11, act: 2, key: 'hanoi', name: 'Hà Nội', vi: 'Hồ Gươm lúc hoàng hôn', file: 'js/gates/gate11-hanoi.js', has3d: true, requires: [8], color: '#d8382c', boss: 'Sát Thủ Bóng Đêm' },
  { id: 12, act: 2, key: 'hoian', name: 'Hội An', vi: 'Phố cổ đêm đèn lồng', file: 'js/gates/gate12-hoian.js', has3d: true, requires: [8, 11, 13], color: '#f2c63a', boss: 'Mãng Xà Đèn Lồng' },
  { id: 13, act: 2, key: 'halong', name: 'Hạ Long', vi: 'Vịnh di sản lúc hoàng hôn', file: 'js/gates/gate13-halong.js', has3d: true, requires: [8, 11, 12], color: '#3ac0b0', boss: 'Thuỷ Long Vịnh Hạ' },
  { id: 14, act: 2, key: 'sapa', name: 'Sa Pa', vi: 'Ruộng bậc thang trong sương', file: 'js/gates/gate14-sapa.js', has3d: true, requires: [8, 11], color: '#9dcf6a', boss: 'Dê Chúa Hoàng Liên', ally: true },
  { id: 15, act: 2, key: 'hue', name: 'Huế', vi: 'Kinh thành trong đêm mưa', file: 'js/gates/gate15-hue.js', has3d: true, requires: [8, 11, 12], color: '#d8a828', boss: 'Nghê Đá Hoàng Cung' },
  { id: 16, act: 2, key: 'danang', name: 'Đà Nẵng', vi: 'Cầu Rồng & Cầu Vàng', file: 'js/gates/gate16-danang.js', has3d: true, requires: [8, 11, 13], color: '#f2c63a', boss: 'Cự Nhân Đá Bà Nà', ally: true },
  { id: 17, act: 2, key: 'dalat', name: 'Đà Lạt', vi: 'Thành phố ngàn hoa', file: 'js/gates/gate17-dalat.js', has3d: true, requires: [8, 11, 13, 14], color: '#d84a8a', boss: 'Đoá Dã Quỳ Khổng Lồ' },
  { id: 18, act: 2, key: 'saigon', name: 'Sài Gòn', vi: 'Thành phố không ngủ', file: 'js/gates/gate18-saigon.js', has3d: true, requires: [8, 11, 13], color: '#ff3ad8', boss: 'Vật Thể V-0', ally: true },
  { id: 19, act: 2, key: 'mientay', name: 'Miền Tây', vi: 'Chín rồng ra biển', file: 'js/gates/gate19-mientay.js', has3d: true, requires: [6, 8, 11, 13], color: '#7ac83a', boss: 'Thuỷ Quái Cửu Long' },
  { id: 20, act: 2, key: 'thatson', name: 'Thất Sơn', vi: 'Bảy núi · An Giang', file: 'js/gates/gate20-thatson.js', has3d: true, requires: [8, 11, 13, 14], color: '#ff5a7a', boss: 'GoatEvil · Hiện Thân', ally: true },
  { id: 21, act: 2, key: 'alpha', name: 'Căn cứ Alpha', vi: 'Trận cuối · Nơi tất cả bắt đầu', file: 'js/gates/gate21-alpha.js', has3d: true, requires: [8, 9, 11, 13], color: '#5ad8ff', boss: 'GS. Ted · Giáp Alpha', ally: true },
];

// Các Màn (chu kỳ chiến dịch). Màn chưa có Gate nào thì hiện thẻ "sắp ra mắt" (teasers) để người chơi thấy game còn dài.
window.MB.Gates.acts = [
  { n: 1, name: 'BÙNG PHÁT', color: '#9dff8a', total: 10, desc: '10 cửa ải bị virus chiếm đóng — từ rừng nhiễm độc tới đại dịch tận thế.' },
  { n: 2, name: 'NGUỒN GỐC', color: '#ff7a3c', total: 11, tag: 'MỚI', desc: 'Hunter về Việt Nam, lần theo mẩu giấy cuối cùng của Giáo sư Ted. Kẻ đứng sau GoatEvil là ai?' },
  { n: 3, name: 'BÓNG TỐI LAN RỘNG', color: '#b48cff', soon: true, tag: 'SẮP RA MẮT', desc: 'Mười một ghế còn lại của Hội đồng Mười Hai đã lộ diện. Cuộc săn lùng vượt khỏi biên giới…',
    teasers: [{ n: 'GATE 22', name: '???', vi: 'Toạ độ chưa giải mã' }, { n: 'GATE 23', name: '???', vi: 'Tín hiệu bị mã hoá' }, { n: 'GATE 24', name: '???', vi: 'Vùng cấm' }] },
];
