/**
 * MENGHUBUNGKAN DUA DOKUMEN: Surat Tugas (LetterData) ↔ BAST (BastData)
 * ----------------------------------------------------------------------------
 * letterToBast() : salin data Surat Tugas  → form BAST
 * bastToLetter() : salin data BAST         → form Surat Tugas
 *
 * Catatan:
 *  - Hanya field yang terisi yang disalin (tidak menimpa dengan kosong).
 *  - Kop surat TIDAK PERNAH ikut tersinkron — kop fix/terkunci
 *    (bastToLetter sengaja tidak menyentuh kopCompanyName).
 */

import { LetterData, BastData } from '../types';
import { KOP_COMPANY_NAME } from '../data/kopSurat';
import { cleanPartial } from './payload';

export interface FieldMapping {
  label: string;
  letter: keyof LetterData;
  bast: keyof BastData;
}

/** Daftar pasangan field untuk ditampilkan di UI (panel payload). */
export const FIELD_MAPPINGS: FieldMapping[] = [
  { label: 'Perusahaan', letter: 'kopCompanyName', bast: 'perusahaan' },
  { label: 'Nama debitur', letter: 'customerName', bast: 'debiturNama' },
  { label: 'Alamat debitur', letter: 'customerAddress', bast: 'debiturAlamat' },
  { label: 'No. kontrak', letter: 'customerContract', bast: 'nomorKontrak' },
  { label: 'Kreditur / leasing', letter: 'clientName', bast: 'krediturLeasing' },
  { label: 'Kendaraan (merk/tipe)', letter: 'vehicleBrand', bast: 'kendaraanMerk' },
  { label: 'No. polisi', letter: 'vehiclePlate', bast: 'kendaraanNoPol' },
  { label: 'Petugas', letter: 'assigneeName', bast: 'petugasNama' },
  { label: 'Jabatan petugas', letter: 'assigneePosition', bast: 'petugasJabatan' },
  { label: 'Pemberi tugas / Saksi 1', letter: 'assignerName', bast: 'saksi1Nama' },
  { label: 'Jabatan saksi 1', letter: 'assignerPosition', bast: 'saksi1Jabatan' },
];

/** Surat Tugas → BAST (hanya field terisi). */
export function letterToBast(letter: LetterData): Partial<BastData> {
  const [kota] = (letter.signPlaceDate || '').split(',').map((s) => s.trim());
  const [merk, tipe] = (letter.vehicleBrand || '').split('/').map((s) => s.trim());
  return cleanPartial<Partial<BastData>>({
    perusahaan: letter.kopCompanyName || KOP_COMPANY_NAME,
    debiturNama: letter.customerName,
    debiturAlamat: letter.customerAddress,
    nomorKontrak: letter.customerContract,
    krediturLeasing: letter.clientName,
    kendaraanMerk: merk || undefined,
    kendaraanType: tipe || undefined,
    kendaraanNoPol: letter.vehiclePlate,
    petugasNama: letter.assigneeName,
    petugasJabatan: letter.assigneePosition,
    saksi1Nama: letter.assignerName,
    saksi1Jabatan: letter.assignerPosition,
    ...(kota ? { kota } : {}),
  });
}

/** BAST → Surat Tugas (hanya field terisi; kop tidak disentuh). */
export function bastToLetter(bast: BastData): Partial<LetterData> {
  const kendaraan = [bast.kendaraanMerk, bast.kendaraanType]
    .map((s) => (s || '').trim())
    .filter(Boolean)
    .join(' / ');
  const signPlaceDate = bast.kota && bast.tanggal ? `${bast.kota}, ${bast.tanggal}` : undefined;
  return cleanPartial<Partial<LetterData>>({
    customerName: bast.debiturNama,
    customerAddress: bast.debiturAlamat,
    customerContract: bast.nomorKontrak,
    clientName: bast.krediturLeasing,
    vehicleBrand: kendaraan || undefined,
    vehiclePlate: bast.kendaraanNoPol,
    assigneeName: bast.petugasNama,
    assigneePosition: bast.petugasJabatan,
    assignerName: bast.saksi1Nama,
    assignerPosition: bast.saksi1Jabatan,
    ...(signPlaceDate ? { signPlaceDate } : {}),
  });
}
