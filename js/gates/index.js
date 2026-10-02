/* Danh sách 10 Gate. Gate có `file` sẽ được tải khi người chơi chọn (lazy load). */
'use strict';
window.MB.Gates.meta = [
  { id: 1, key: 'jungle', name: 'Jungle', vi: 'Rừng Nhiễm Độc', file: 'js/gates/gate01-jungle.js', color: '#7dd35c', boss: 'Spider Queen' },
  { id: 2, key: 'mountain', name: 'Mountain', vi: 'Vách Núi Đá Lăn', file: 'js/gates/gate02-mountain.js', color: '#d0a374', boss: 'Stone Behemoth' },
  { id: 3, key: 'swamp', name: 'Swamp', vi: 'Đầm Lầy Đột Biến', file: null, color: '#6fae8f', boss: '???' },
  { id: 4, key: 'snow', name: 'Snow', vi: 'Bão Tuyết', file: null, color: '#a8d8ff', boss: '???' },
  { id: 5, key: 'volcano', name: 'Volcano', vi: 'Miệng Núi Lửa', file: null, color: '#ff7a45', boss: '???' },
  { id: 6, key: 'ocean', name: 'Ocean', vi: 'Đảo Hoang', file: null, color: '#4fb3d9', boss: '???' },
  { id: 7, key: 'industrial', name: 'Industrial', vi: 'Nhà Máy Hoá Chất', file: null, color: '#c9c95a', boss: '???' },
  { id: 8, key: 'city', name: 'City', vi: 'Đô Thị Đổ Nát', file: null, color: '#b0a3c9', boss: '???' },
  { id: 9, key: 'lab', name: 'Laboratory', vi: 'Phòng Thí Nghiệm', file: null, color: '#7ef3ff', boss: '???' },
  { id: 10, key: 'apocalypse', name: 'Apocalypse', vi: 'Tận Thế', file: null, color: '#ff5b6e', boss: 'The Origin' },
];
