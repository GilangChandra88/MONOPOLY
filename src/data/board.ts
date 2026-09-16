import { BoardSquare, PropertyColor } from '../types/board';

const IMAGES: Record<string, string> = {
  bengkulu: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Front_gate_of_Fort_Marlborough%2C_Bengkulu_2015-04-19_02.jpg/500px-Front_gate_of_Fort_Marlborough%2C_Bengkulu_2015-04-19_02.jpg',
  jambi: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Candi_Muaro_Jambi_di_siang_hari.jpg/500px-Candi_Muaro_Jambi_di_siang_hari.jpg',
  soetta: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Soekarno-Hatta_Airport_aerial_view.jpg/500px-Soekarno-Hatta_Airport_aerial_view.jpg',
  ampera: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Ampera_Bridge_at_Night%2C_Palembang.jpg/500px-Ampera_Bridge_at_Night%2C_Palembang.jpg',
  riau: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Istana_Kerajaan_Siak_%282%29.jpg/500px-Istana_Kerajaan_Siak_%282%29.jpg',
  toba: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Lake_Toba_and_the_surrounding_hills.jpg/500px-Lake_Toba_and_the_surrounding_hills.jpg',
  banten: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Ujung_Kulon_National_Park%2C_2014.jpg/500px-Ujung_Kulon_National_Park%2C_2014.jpg',
  pln: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/PLN_head_office_-_panoramio.jpg/500px-PLN_head_office_-_panoramio.jpg',
  jabar: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Gedung_Sate_Oktober_2024_-_Rahmatdenas.jpg/500px-Gedung_Sate_Oktober_2024_-_Rahmatdenas.jpg',
  jakarta: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a2/Jakarta_Indonesia_National-Monument-02.jpg/500px-Jakarta_Indonesia_National-Monument-02.jpg',
  ngurahrai: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Ngurah_Rai_Internasional_Airport_Welcome_Sign.jpg/500px-Ngurah_Rai_Internasional_Airport_Welcome_Sign.jpg',
  borobudur: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Pradaksina.jpg/500px-Pradaksina.jpg',
  malioboro: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Prambanan_Temple_Yogyakarta_Indonesia.jpg/500px-Prambanan_Temple_Yogyakarta_Indonesia.jpg',
  bromo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Bromo-Semeru-Batok-Widodaren.jpg/500px-Bromo-Semeru-Batok-Widodaren.jpg',
  bali: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Pura_Ulun_Danu_Bratan%2C_2022.jpg/500px-Pura_Ulun_Danu_Bratan%2C_2022.jpg',
  rinjani: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/KAGAGAHAN_RIJANI.jpg/500px-KAGAGAHAN_RIJANI.jpg',
  komodo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Komodo_dragon_at_Komodo_National_Park.jpg/500px-Komodo_dragon_at_Komodo_National_Park.jpg',
  pelabuhan: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Ro-ro_ship_at_Port_of_Bakauheni.JPG/500px-Ro-ro_ship_at_Port_of_Bakauheni.JPG',
  khatulistiwa: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Pontianak_Equator_Monument.jpg/500px-Pontianak_Equator_Monument.jpg',
  tanjungputing: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Tanjung-Puting90153.jpg/500px-Tanjung-Puting90153.jpg',
  pdam: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Jatiluhur_03.jpg/500px-Jatiluhur_03.jpg',
  ikn: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Nusantara%2C_June_2024.png/500px-Nusantara%2C_June_2024.png',
  losari: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Makassar%2C_March_2019_%28cropped%29.jpg/500px-Makassar%2C_March_2019_%28cropped%29.jpg',
  bunaken: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Bunaken.jpg/500px-Bunaken.jpg',
  maluku: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Fort_Belgica_%2848250814991%29.jpg/500px-Fort_Belgica_%2848250814991%29.jpg',
  tanjungperak: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/ANTARA_FOTO-Eric_Ireng_TERMINAL_PETIKEMAS_SURABAYA.jpg/500px-ANTARA_FOTO-Eric_Ireng_TERMINAL_PETIKEMAS_SURABAYA.jpg',
  rajaampat: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Raja_Ampat_Islands_-_journal.pbio.1001457.g001.png/500px-Raja_Ampat_Islands_-_journal.pbio.1001457.g001.png',
  puncakjaya: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Carstenzs_Piramida_Mountain.jpg/500px-Carstenzs_Piramida_Mountain.jpg'
};

const getImg = (seed: string) => IMAGES[seed] || '';

export const BOARD_SQUARES: BoardSquare[] = [
  { id: 0, type: 'go', name: 'MULAI' },
  { id: 1, type: 'property', name: 'Provinsi Bengkulu', color: 'coklat', price: 600_000, rent: [20_000, 100_000, 300_000, 900_000, 1_600_000, 2_500_000], houseCost: 500_000, hotelCost: 500_000, mortgage: 300_000, colorGroupSize: 2, image: getImg('bengkulu') },
  { id: 2, type: 'community-chest', name: 'Dana Umum' },
  { id: 3, type: 'property', name: 'Provinsi Jambi', color: 'coklat', price: 600_000, rent: [40_000, 200_000, 600_000, 1_800_000, 3_200_000, 4_500_000], houseCost: 500_000, hotelCost: 500_000, mortgage: 300_000, colorGroupSize: 2, image: getImg('jambi') },
  { id: 4, type: 'income-tax', name: 'Pajak Penghasilan' },
  { id: 5, type: 'railroad', name: 'Bandara Soetta', price: 2_000_000, mortgage: 1_000_000, image: getImg('soetta') },
  { id: 6, type: 'property', name: 'Provinsi Sumsel', color: 'biru-muda', price: 1_000_000, rent: [60_000, 300_000, 900_000, 2_700_000, 4_000_000, 5_500_000], houseCost: 500_000, hotelCost: 500_000, mortgage: 500_000, colorGroupSize: 3, image: getImg('ampera') },
  { id: 7, type: 'chance', name: 'Kesempatan' },
  { id: 8, type: 'property', name: 'Provinsi Riau', color: 'biru-muda', price: 1_000_000, rent: [60_000, 300_000, 900_000, 2_700_000, 4_000_000, 5_500_000], houseCost: 500_000, hotelCost: 500_000, mortgage: 500_000, colorGroupSize: 3, image: getImg('riau') },
  { id: 9, type: 'property', name: 'Provinsi Sumut', color: 'biru-muda', price: 1_200_000, rent: [80_000, 400_000, 1_000_000, 3_000_000, 4_500_000, 6_000_000], houseCost: 500_000, hotelCost: 500_000, mortgage: 600_000, colorGroupSize: 3, image: getImg('toba') },
  
  { id: 10, type: 'jail', name: 'Penjara' },
  { id: 11, type: 'property', name: 'Provinsi Banten', color: 'merah-muda', price: 1_400_000, rent: [100_000, 500_000, 1_500_000, 4_500_000, 6_250_000, 7_500_000], houseCost: 1_000_000, hotelCost: 1_000_000, mortgage: 700_000, colorGroupSize: 3, image: getImg('banten') },
  { id: 12, type: 'utility', name: 'PLN', price: 1_500_000, mortgage: 750_000, image: getImg('pln') },
  { id: 13, type: 'property', name: 'Provinsi Jabar', color: 'merah-muda', price: 1_400_000, rent: [100_000, 500_000, 1_500_000, 4_500_000, 6_250_000, 7_500_000], houseCost: 1_000_000, hotelCost: 1_000_000, mortgage: 700_000, colorGroupSize: 3, image: getImg('jabar') },
  { id: 14, type: 'property', name: 'Provinsi DKI', color: 'merah-muda', price: 1_600_000, rent: [120_000, 600_000, 1_800_000, 5_000_000, 7_000_000, 9_000_000], houseCost: 1_000_000, hotelCost: 1_000_000, mortgage: 800_000, colorGroupSize: 3, image: getImg('jakarta') },
  { id: 15, type: 'railroad', name: 'Bandara Ngurah Rai', price: 2_000_000, mortgage: 1_000_000, image: getImg('ngurahrai') },
  { id: 16, type: 'property', name: 'Provinsi Jateng', color: 'oranye', price: 1_800_000, rent: [140_000, 700_000, 2_000_000, 5_500_000, 7_500_000, 9_500_000], houseCost: 1_000_000, hotelCost: 1_000_000, mortgage: 900_000, colorGroupSize: 3, image: getImg('borobudur') },
  { id: 17, type: 'community-chest', name: 'Dana Umum' },
  { id: 18, type: 'property', name: 'Provinsi DIY', color: 'oranye', price: 1_800_000, rent: [140_000, 700_000, 2_000_000, 5_500_000, 7_500_000, 9_500_000], houseCost: 1_000_000, hotelCost: 1_000_000, mortgage: 900_000, colorGroupSize: 3, image: getImg('malioboro') },
  { id: 19, type: 'property', name: 'Provinsi Jatim', color: 'oranye', price: 2_000_000, rent: [160_000, 800_000, 2_200_000, 6_000_000, 8_000_000, 10_000_000], houseCost: 1_000_000, hotelCost: 1_000_000, mortgage: 1_000_000, colorGroupSize: 3, image: getImg('bromo') },
  
  { id: 20, type: 'free-parking', name: 'Parkir Gratis' },
  { id: 21, type: 'property', name: 'Provinsi Bali', color: 'merah', price: 2_200_000, rent: [180_000, 900_000, 2_500_000, 7_000_000, 8_750_000, 10_500_000], houseCost: 1_500_000, hotelCost: 1_500_000, mortgage: 1_100_000, colorGroupSize: 3, image: getImg('bali') },
  { id: 22, type: 'chance', name: 'Kesempatan' },
  { id: 23, type: 'property', name: 'Provinsi NTB', color: 'merah', price: 2_200_000, rent: [180_000, 900_000, 2_500_000, 7_000_000, 8_750_000, 10_500_000], houseCost: 1_500_000, hotelCost: 1_500_000, mortgage: 1_100_000, colorGroupSize: 3, image: getImg('rinjani') },
  { id: 24, type: 'property', name: 'Provinsi NTT', color: 'merah', price: 2_400_000, rent: [200_000, 1_000_000, 3_000_000, 7_500_000, 9_250_000, 11_000_000], houseCost: 1_500_000, hotelCost: 1_500_000, mortgage: 1_200_000, colorGroupSize: 3, image: getImg('komodo') },
  { id: 25, type: 'railroad', name: 'Pel. Bakauheni', price: 2_000_000, mortgage: 1_000_000, image: getImg('pelabuhan') },
  { id: 26, type: 'property', name: 'Provinsi Kalbar', color: 'kuning', price: 2_600_000, rent: [220_000, 1_100_000, 3_300_000, 8_000_000, 9_750_000, 11_500_000], houseCost: 1_500_000, hotelCost: 1_500_000, mortgage: 1_300_000, colorGroupSize: 3, image: getImg('khatulistiwa') },
  { id: 27, type: 'property', name: 'Provinsi Kalteng', color: 'kuning', price: 2_600_000, rent: [220_000, 1_100_000, 3_300_000, 8_000_000, 9_750_000, 11_500_000], houseCost: 1_500_000, hotelCost: 1_500_000, mortgage: 1_300_000, colorGroupSize: 3, image: getImg('tanjungputing') },
  { id: 28, type: 'utility', name: 'PDAM', price: 1_500_000, mortgage: 750_000, image: getImg('pdam') },
  { id: 29, type: 'property', name: 'Provinsi Kaltim', color: 'kuning', price: 2_800_000, rent: [240_000, 1_200_000, 3_600_000, 8_500_000, 10_250_000, 12_000_000], houseCost: 1_500_000, hotelCost: 1_500_000, mortgage: 1_400_000, colorGroupSize: 3, image: getImg('ikn') },
  
  { id: 30, type: 'go-to-jail', name: 'Pergi ke Penjara' },
  { id: 31, type: 'property', name: 'Prov. Sulsel', color: 'hijau', price: 3_000_000, rent: [260_000, 1_300_000, 3_900_000, 9_000_000, 11_000_000, 12_750_000], houseCost: 2_000_000, hotelCost: 2_000_000, mortgage: 1_500_000, colorGroupSize: 3, image: getImg('losari') },
  { id: 32, type: 'property', name: 'Prov. Sulut', color: 'hijau', price: 3_000_000, rent: [260_000, 1_300_000, 3_900_000, 9_000_000, 11_000_000, 12_750_000], houseCost: 2_000_000, hotelCost: 2_000_000, mortgage: 1_500_000, colorGroupSize: 3, image: getImg('bunaken') },
  { id: 33, type: 'community-chest', name: 'Dana Umum' },
  { id: 34, type: 'property', name: 'Prov. Maluku', color: 'hijau', price: 3_200_000, rent: [280_000, 1_500_000, 4_500_000, 10_000_000, 12_000_000, 14_000_000], houseCost: 2_000_000, hotelCost: 2_000_000, mortgage: 1_600_000, colorGroupSize: 3, image: getImg('maluku') },
  { id: 35, type: 'railroad', name: 'Pel. Tjg Perak', price: 2_000_000, mortgage: 1_000_000, image: getImg('tanjungperak') },
  { id: 36, type: 'chance', name: 'Kesempatan' },
  { id: 37, type: 'property', name: 'Prov. Papua Barat', color: 'biru-tua', price: 3_500_000, rent: [350_000, 1_750_000, 5_000_000, 11_000_000, 13_000_000, 15_000_000], houseCost: 2_000_000, hotelCost: 2_000_000, mortgage: 1_750_000, colorGroupSize: 2, image: getImg('rajaampat') },
  { id: 38, type: 'luxury-tax', name: 'Pajak Mewah' },
  { id: 39, type: 'property', name: 'Provinsi Papua', color: 'biru-tua', price: 4_000_000, rent: [500_000, 2_000_000, 6_000_000, 14_000_000, 17_000_000, 20_000_000], houseCost: 2_000_000, hotelCost: 2_000_000, mortgage: 2_000_000, colorGroupSize: 2, image: getImg('puncakjaya') },
];

export const COLOR_MAP: Record<PropertyColor, { bg: string; text: string; border: string }> = {
  coklat: { bg: 'bg-[#8B4513]', text: 'text-white', border: 'border-[#8B4513]' },
  'biru-muda': { bg: 'bg-[#87CEEB]', text: 'text-black', border: 'border-[#87CEEB]' },
  'merah-muda': { bg: 'bg-[#FF69B4]', text: 'text-white', border: 'border-[#FF69B4]' },
  oranye: { bg: 'bg-[#FF8C00]', text: 'text-black', border: 'border-[#FF8C00]' },
  merah: { bg: 'bg-[#FF0000]', text: 'text-white', border: 'border-[#FF0000]' },
  kuning: { bg: 'bg-[#FFD700]', text: 'text-black', border: 'border-[#FFD700]' },
  hijau: { bg: 'bg-[#008000]', text: 'text-white', border: 'border-[#008000]' },
  'biru-tua': { bg: 'bg-[#00008B]', text: 'text-white', border: 'border-[#00008B]' },
};

export function getSquare(id: number): BoardSquare {
  return BOARD_SQUARES[id];
}

// Konstanta Game
export const GO_MONEY = 2_000_000;
export const INCOME_TAX_AMOUNT = 2_000_000;
export const LUXURY_TAX_AMOUNT = 1_000_000;
export const RAILROAD_RENT = [0, 250_000, 500_000, 1_000_000, 2_000_000]; // 0 untuk mempermudah index 1-4
