import { extractCompanyInitials } from './letterNumber';
import { slugPart, normalizeText } from './format';
import type { DocData } from '../types';

/**
 * Nama file PDF: [INISIAL KREDITUR]-[NAMA DEBITUR]-[KECAMATAN].pdf
 * Berlaku sama untuk tombol "Simpan PDF" maupun unggah ke Google Drive.
 */

export function getInisialKreditur(data: Pick<DocData, 'inisialKreditur' | 'namaKreditur'>): string {
  const manual = normalizeText(data.inisialKreditur || '').toUpperCase();
  if (manual) return slugPart(manual, 12) || manual;
  return slugPart(extractCompanyInitials(data.namaKreditur || ''), 12);
}

export interface PdfNameParts {
  inisial: string;
  debitur: string;
  kecamatan: string;
}

export function buildPdfParts(data: DocData): PdfNameParts {
  return {
    inisial: getInisialKreditur(data) || 'KREDITUR',
    debitur: slugPart(data.namaDebitur || '', 34) || 'DEBITUR',
    kecamatan: slugPart(data.kecamatan || '', 26) || 'KECAMATAN',
  };
}

/** "KAMM-KISNO_ANGKAH_TRI_HIDAYAT-KALIMANAH" (tanpa ekstensi) */
export function buildPdfBaseName(data: DocData): string {
  const { inisial, debitur, kecamatan } = buildPdfParts(data);
  return `${inisial}-${debitur}-${kecamatan}`;
}

/**
 * Nama file final untuk SEMUA aksi simpan PDF (download maupun Google Drive):
 * [inisial kreditur]-[nama debitur]-[kecamatan].pdf
 */
export function buildPdfFileName(data: DocData): string {
  return `${buildPdfBaseName(data)}.pdf`;
}

/**
 * Ambil nama kecamatan dari alamat tertulis (heuristik alamat Indonesia).
 * "Kalikabong RT 004 RW 002, Kalimanah, Purbalingga" -> "Kalimanah"
 */
export function deriveKecamatan(alamat?: string | null): string {
  const text = normalizeText(alamat);
  if (!text) return '';

  const explicit = text.match(/(?:kecamatan|kec\.?)\s+([A-Za-zÀ-ÿ' -]{2,30}?)(?=(?:,|\s+kab(?:upaten)?\b|\s+kota\b|$))/i);
  if (explicit) return titleCase(explicit[1]);

  const parts = text
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  const idxKab = parts.findIndex((p) => /^(kab\.?|kabupaten|kota)\b/i.test(p));
  if (idxKab > 0) return titleCase(stripKab(parts[idxKab - 1]));
  if (parts.length >= 3) return titleCase(stripKab(parts[parts.length - 2]));
  return '';
}

/** Ambil nama kabupaten/kota dari alamat tertulis */
export function deriveKabupaten(alamat?: string | null): string {
  const text = normalizeText(alamat);
  if (!text) return '';

  const explicit = text.match(/(?:kab\.?|kabupaten|kota)\s+([A-Za-zÀ-ÿ' -]{2,30}?)(?=(?:,|\s+prov|\s+jateng|\s+jawa|$))/i);
  if (explicit) return titleCase(explicit[1]);

  const parts = text
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  const idxKab = parts.findIndex((p) => /^(kab\.?|kabupaten|kota)\b/i.test(p));
  if (idxKab >= 0) return titleCase(stripKab(parts[idxKab]));

  // Alamat umum: "Dusun/RT, Kecamatan, Kabupaten" -> bagian terakhir = kabupaten
  const last = parts[parts.length - 1] ?? '';
  if (parts.length >= 3 && !/\b(rt|rw|dusun|desa|kel\.)\b/i.test(last)) return titleCase(stripKab(last));
  return '';
}

function stripKab(value?: string | null): string {
  return normalizeText(value)
    .replace(/^(kab\.?|kabupaten|kota)\s+/i, '')
    .replace(/[,.\s]+$/, '');
}

export function titleCase(value?: string | null): string {
  return normalizeText(value)
    .toLowerCase()
    .replace(/(^|[\s/,-])([a-zà-ÿ])/g, (_match, sep: string, char: string) => sep + char.toUpperCase())
    .trim();
}
