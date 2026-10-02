/* Danh sách 10 Gate. Gate có `file` sẽ được tải khi người chơi chọn (lazy load).
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
  { id: 12, act: 2, key: 'hoian', name: 'Hội An', vi: 'Phố cổ đêm đèn lồng', file: 'js/gates/gate12-hoian.js', has3d: true, requires: [8, 11], color: '#f2c63a', boss: 'Mãng Xà Đèn Lồng' },
  ...[13, 14, 15, 16, 17, 18, 19, 20, 21].map((id) => ({ id, act: 2, key: 'g' + id, name: '???', vi: id === 21 ? 'Trận cuối' : 'Đang lần theo manh mối…', color: '#6a6a7a', boss: '???' })),
];
