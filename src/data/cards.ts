import type { Card } from '../types/card';

// ─── 16 Kartu Kesempatan ──────────────────────────────────────────────────────
export const CHANCE_CARDS: Card[] = [
  {
    id: 'c1',
    text: 'Maju ke MULAI. Kumpulkan Rp 2.000.000.',
    effect: { type: 'move-to', position: 0, collectGo: true },
  },
  {
    id: 'c2',
    text: 'Maju ke Jl. Sudirman Premium. Jika melewati MULAI, kumpulkan Rp 2.000.000.',
    effect: { type: 'move-to', position: 39, collectGo: true },
  },
  {
    id: 'c3',
    text: 'Maju ke Jl. Jend. Sudirman. Jika melewati MULAI, kumpulkan Rp 2.000.000.',
    effect: { type: 'move-to', position: 18, collectGo: true },
  },
  {
    id: 'c4',
    text: 'Maju ke stasiun kereta terdekat. Jika dimiliki orang lain, bayar 2x sewa biasa.',
    effect: { type: 'move-nearest', squareType: 'railroad' },
  },
  {
    id: 'c5',
    text: 'Maju ke stasiun kereta terdekat. Jika dimiliki orang lain, bayar 2x sewa biasa.',
    effect: { type: 'move-nearest', squareType: 'railroad' },
  },
  {
    id: 'c6',
    text: 'Maju ke utilitas terdekat. Jika dimiliki orang lain, bayar 10x nilai dadu.',
    effect: { type: 'move-nearest', squareType: 'utility' },
  },
  {
    id: 'c7',
    text: 'Bank membayar dividen Rp 500.000.',
    effect: { type: 'money', amount: 500_000 },
  },
  {
    id: 'c8',
    text: 'Kartu BEBAS PENJARA. Simpan kartu ini hingga kamu butuhkan.',
    effect: { type: 'free-jail' },
  },
  {
    id: 'c9',
    text: 'Mundur 3 petak.',
    effect: { type: 'move-steps', steps: -3 },
  },
  {
    id: 'c10',
    text: 'Pergi ke penjara! Langsung ke penjara, jangan lewat MULAI, jangan kumpulkan uang.',
    effect: { type: 'jail' },
  },
  {
    id: 'c11',
    text: 'Perbaikan properti umum: bayar Rp 250.000 per rumah dan Rp 1.000.000 per hotel.',
    effect: { type: 'money-per-house-hotel', house: -250_000, hotel: -1_000_000 },
  },
  {
    id: 'c12',
    text: 'Bayar denda tilang Rp 150.000.',
    effect: { type: 'money', amount: -150_000 },
  },
  {
    id: 'c13',
    text: 'Maju ke Jl. Diponegoro. Jika melewati MULAI, kumpulkan Rp 2.000.000.',
    effect: { type: 'move-to', position: 37, collectGo: true },
  },
  {
    id: 'c14',
    text: 'Terpilih sebagai Ketua Panitia. Bayar tiap pemain Rp 100.000.',
    effect: { type: 'money-per-player', amount: -100_000 },
  },
  {
    id: 'c15',
    text: 'Pinjaman jatuh tempo terbayar. Terima Rp 1.500.000.',
    effect: { type: 'money', amount: 1_500_000 },
  },
  {
    id: 'c16',
    text: 'Maju ke Stasiun Gambir. Jika melewati MULAI, kumpulkan Rp 2.000.000.',
    effect: { type: 'move-to', position: 5, collectGo: true },
  },
];

// ─── 16 Kartu Dana Umum ───────────────────────────────────────────────────────
export const COMMUNITY_CHEST_CARDS: Card[] = [
  {
    id: 'cc1',
    text: 'Maju ke MULAI. Kumpulkan Rp 2.000.000.',
    effect: { type: 'move-to', position: 0, collectGo: true },
  },
  {
    id: 'cc2',
    text: 'Rekening bank mengalami kesalahan untuk keuntunganmu. Kumpulkan Rp 2.000.000.',
    effect: { type: 'money', amount: 2_000_000 },
  },
  {
    id: 'cc3',
    text: 'Bayar tagihan dokter Rp 500.000.',
    effect: { type: 'money', amount: -500_000 },
  },
  {
    id: 'cc4',
    text: 'Dari penjualan saham, terima Rp 500.000.',
    effect: { type: 'money', amount: 500_000 },
  },
  {
    id: 'cc5',
    text: 'Kartu BEBAS PENJARA. Simpan kartu ini hingga kamu butuhkan.',
    effect: { type: 'free-jail' },
  },
  {
    id: 'cc6',
    text: 'Pergi ke penjara! Langsung ke penjara, jangan lewat MULAI.',
    effect: { type: 'jail' },
  },
  {
    id: 'cc7',
    text: 'Liburan hari raya. Bayar tiap pemain Rp 100.000.',
    effect: { type: 'money-per-player', amount: -100_000 },
  },
  {
    id: 'cc8',
    text: 'Penghasilan dari luar biasa. Terima Rp 250.000.',
    effect: { type: 'money', amount: 250_000 },
  },
  {
    id: 'cc9',
    text: 'Bayar premi asuransi jiwa Rp 500.000.',
    effect: { type: 'money', amount: -500_000 },
  },
  {
    id: 'cc10',
    text: 'Terima royalti konsultan Rp 250.000.',
    effect: { type: 'money', amount: 250_000 },
  },
  {
    id: 'cc11',
    text: 'Bayar biaya sekolah Rp 1.500.000.',
    effect: { type: 'money', amount: -1_500_000 },
  },
  {
    id: 'cc12',
    text: 'Dapat warisan Rp 1.000.000.',
    effect: { type: 'money', amount: 1_000_000 },
  },
  {
    id: 'cc13',
    text: 'Dana pensiun dicairkan. Terima Rp 1.000.000.',
    effect: { type: 'money', amount: 1_000_000 },
  },
  {
    id: 'cc14',
    text: 'Kamu terpilih sebagai pemimpin daerah! Tiap pemain membayarmu Rp 500.000.',
    effect: { type: 'money-per-player', amount: 500_000 },
  },
  {
    id: 'cc15',
    text: 'Tagihan asuransi kesehatan. Bayar Rp 1.000.000.',
    effect: { type: 'money', amount: -1_000_000 },
  },
  {
    id: 'cc16',
    text: 'Perbaikan jalan: bayar Rp 400.000 per rumah dan Rp 1.150.000 per hotel.',
    effect: { type: 'money-per-house-hotel', house: -400_000, hotel: -1_150_000 },
  },
];

// ─── Shuffle deck ─────────────────────────────────────────────────────────────
export function shuffleDeck(cards: Card[]): Card[] {
  const deck = [...cards];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
