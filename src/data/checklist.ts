import type { ChecklistMap, VehicleType } from '../types';

export interface ChecklistDefinition {
  id: string;
  kategori: string;
  nama: string;
}

export const CHECKLIST_RODA2: ChecklistDefinition[] = [
  // Dokumen & Kunci
  { id: 'stnk_asli', kategori: 'Dokumen & Kunci', nama: 'STNK Asli' },
  { id: 'kunci_kontak', kategori: 'Dokumen & Kunci', nama: 'Kunci Kontak (Asli)' },
  { id: 'kunci_cadangan', kategori: 'Dokumen & Kunci', nama: 'Kunci Cadangan / Duplikat' },
  { id: 'buku_servis', kategori: 'Dokumen & Kunci', nama: 'Buku Servis & Manual' },
  { id: 'toolset', kategori: 'Dokumen & Kunci', nama: 'Toolset / Kunci Busi Standar' },

  // Perlengkapan & Aksesoris
  { id: 'spion_kanan', kategori: 'Perlengkapan & Aksesoris', nama: 'Kaca Spion Kanan' },
  { id: 'spion_kiri', kategori: 'Perlengkapan & Aksesoris', nama: 'Kaca Spion Kiri' },
  { id: 'helm', kategori: 'Perlengkapan & Aksesoris', nama: 'Helm Bawaan' },
  { id: 'jaket', kategori: 'Perlengkapan & Aksesoris', nama: 'Jaket / Perlengkapan Lain' },

  // Kelistrikan & Lampu
  { id: 'lampu_utama', kategori: 'Kelistrikan & Indikator', nama: 'Lampu Utama (Jauh / Dekat)' },
  { id: 'lampu_belakang', kategori: 'Kelistrikan & Indikator', nama: 'Lampu Belakang & Rem' },
  { id: 'lampu_sein_depan', kategori: 'Kelistrikan & Indikator', nama: 'Lampu Sein Depan (Kiri & Kanan)' },
  { id: 'lampu_sein_belakang', kategori: 'Kelistrikan & Indikator', nama: 'Lampu Sein Belakang (Kiri & Kanan)' },
  { id: 'klakson', kategori: 'Kelistrikan & Indikator', nama: 'Klakson' },
  { id: 'speedometer', kategori: 'Kelistrikan & Indikator', nama: 'Speedometer & Odometer' },
  { id: 'aki_starter', kategori: 'Kelistrikan & Indikator', nama: 'Aki & Electric Starter' },

  // Roda & Kaki-Kaki
  { id: 'ban_depan', kategori: 'Roda & Kaki-Kaki', nama: 'Ban Depan (Kembangan)' },
  { id: 'ban_belakang', kategori: 'Roda & Kaki-Kaki', nama: 'Ban Belakang (Kembangan)' },
  { id: 'velg_depan', kategori: 'Roda & Kaki-Kaki', nama: 'Velg Depan (Original/Variasi)' },
  { id: 'velg_belakang', kategori: 'Roda & Kaki-Kaki', nama: 'Velg Belakang (Original/Variasi)' },
  { id: 'rem_depan', kategori: 'Roda & Kaki-Kaki', nama: 'Sistem Rem Depan (Cakram/Tromol)' },
  { id: 'rem_belakang', kategori: 'Roda & Kaki-Kaki', nama: 'Sistem Rem Belakang (Cakram/Tromol)' },
  { id: 'suspensi_depan', kategori: 'Roda & Kaki-Kaki', nama: 'Shockbreaker Depan' },
  { id: 'suspensi_belakang', kategori: 'Roda & Kaki-Kaki', nama: 'Shockbreaker Belakang' },

  // Bodi & Mesin
  { id: 'bodi_sayap', kategori: 'Bodi & Eksterior', nama: 'Bodi / Cover Sayap Kiri & Kanan' },
  { id: 'bodi_belakang', kategori: 'Bodi & Eksterior', nama: 'Bodi Belakang & Spakbor' },
  { id: 'spakbor_depan', kategori: 'Bodi & Eksterior', nama: 'Spakbor Depan' },
  { id: 'jok_kulit', kategori: 'Bodi & Eksterior', nama: 'Jok / Kulit Jok' },
  { id: 'knalpot_standar', kategori: 'Bodi & Eksterior', nama: 'Knalpot & Pelindung Panas' },
  { id: 'kondisi_mesin', kategori: 'Mesin & Transmisi', nama: 'Mesin (Suara Halus / Normal)' },
];

export const CHECKLIST_RODA4: ChecklistDefinition[] = [
  // Dokumen & Kunci
  { id: 'stnk_asli', kategori: 'Dokumen & Kunci', nama: 'STNK Asli' },
  { id: 'kunci_kontak', kategori: 'Dokumen & Kunci', nama: 'Kunci Kontak Utama & Remote' },
  { id: 'kunci_cadangan', kategori: 'Dokumen & Kunci', nama: 'Kunci Cadangan / Spare Key' },
  { id: 'buku_servis', kategori: 'Dokumen & Kunci', nama: 'Buku Servis & Manual Book' },

  // Perlengkapan Darurat
  { id: 'ban_serep', kategori: 'Perlengkapan Darurat', nama: 'Ban Serep / Cadangan' },
  { id: 'dongkrak_handle', kategori: 'Perlengkapan Darurat', nama: 'Dongkrak & Handle Pemutar' },
  { id: 'kunci_roda', kategori: 'Perlengkapan Darurat', nama: 'Kunci Roda' },
  { id: 'segitiga_pengaman', kategori: 'Perlengkapan Darurat', nama: 'Segitiga Pengaman & Toolset' },
  { id: 'p3k', kategori: 'Perlengkapan Darurat', nama: 'Kotak P3K' },

  // Eksterior & Lampu
  { id: 'lampu_utama', kategori: 'Eksterior & Lampu', nama: 'Headlamp Utama (Kiri & Kanan)' },
  { id: 'foglamp', kategori: 'Eksterior & Lampu', nama: 'Lampu Kabut / Foglamp' },
  { id: 'lampu_belakang', kategori: 'Eksterior & Lampu', nama: 'Stoplamp Belakang (Kiri & Kanan)' },
  { id: 'lampu_sein', kategori: 'Eksterior & Lampu', nama: 'Lampu Sein (Depan, Belakang, Spion)' },
  { id: 'spion_elektrik', kategori: 'Eksterior & Lampu', nama: 'Kaca Spion Elektrik (Kiri & Kanan)' },
  { id: 'wiper_depan', kategori: 'Eksterior & Lampu', nama: 'Wiper Depan & Belakang + Washer' },
  { id: 'kaca_film', kategori: 'Eksterior & Lampu', nama: 'Kaca Film & Kondisi Kaca' },
  { id: 'bumper_depan', kategori: 'Eksterior & Lampu', nama: 'Bumper Depan & Grille' },
  { id: 'bumper_belakang', kategori: 'Eksterior & Lampu', nama: 'Bumper Belakang' },

  // Interior & Kenyamanan
  { id: 'ac_blower', kategori: 'Interior & Audio', nama: 'AC / Air Conditioner & Blower' },
  { id: 'audio_headunit', kategori: 'Interior & Audio', nama: 'Head Unit / Audio & Speaker' },
  { id: 'power_window', kategori: 'Interior & Audio', nama: 'Power Window 4 Pintu & Central Lock' },
  { id: 'jok_interior', kategori: 'Interior & Audio', nama: 'Kondisi Jok (Depan, Tengah, Belakang)' },
  { id: 'karpet_dasar', kategori: 'Interior & Audio', nama: 'Karpet Dasar / Karpet Karet' },
  { id: 'plafon_interior', kategori: 'Interior & Audio', nama: 'Plafon & Dashboard Interior' },
  { id: 'sabuk_pengaman', kategori: 'Interior & Audio', nama: 'Sabuk Pengaman / Seatbelt' },

  // Kaki-Kaki & Roda
  { id: 'ban_depan_kanan', kategori: 'Roda & Ban', nama: 'Ban & Velg Depan Kanan' },
  { id: 'ban_depan_kiri', kategori: 'Roda & Ban', nama: 'Ban & Velg Depan Kiri' },
  { id: 'ban_belakang_kanan', kategori: 'Roda & Ban', nama: 'Ban & Velg Belakang Kanan' },
  { id: 'ban_belakang_kiri', kategori: 'Roda & Ban', nama: 'Ban & Velg Belakang Kiri' },

  // Mesin
  { id: 'kondisi_mesin', kategori: 'Mesin & Transmisi', nama: 'Kondisi Mesin & Transmisi' },
  { id: 'rem_handbrake', kategori: 'Mesin & Transmisi', nama: 'Rem Kaki & Handbrake' },
  { id: 'aki_mobil', kategori: 'Mesin & Transmisi', nama: 'Aki Mobil (Starter Normal)' },
];

export function getChecklistDefinitions(jenis: VehicleType): ChecklistDefinition[] {
  return jenis === 'roda4' ? CHECKLIST_RODA4 : CHECKLIST_RODA2;
}

/** Pastikan setiap definisi checklist punya nilai, tanpa menghapus catatan lama */
export function syncChecklist(jenis: VehicleType, current: ChecklistMap = {}): ChecklistMap {
  const result: ChecklistMap = {};
  for (const item of getChecklistDefinitions(jenis)) {
    const value = current[item.id];
    result[item.id] = value
      ? { status: value.status ?? 'baik', catatan: value.catatan ?? 'Lengkap & Baik' }
      : { status: 'baik', catatan: 'Lengkap & Baik' };
  }
  return result;
}

export const DEFAULT_CATATAN: Record<string, string> = {
  baik: 'Lengkap & Baik',
  rusak: 'Rusak / Lecet',
  tidak_ada: 'Tidak Ada / Tidak Diserahkan',
};
