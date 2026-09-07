import { parseIso, ROMAN_MONTHS, todayIso, normalizeText } from './format';

/**
 * Pembuat nomor surat resmi.
 * Format: [NoUrut]/[Jenis]/[Inisial Perusahaan]/[Tanggal]/[Bulan Romawi]/[Tahun]
 * Contoh  : 001/ST/MJI/21/VIII/2026
 */

const COMPANY_ALIASES: Array<[string, string]> = [
  ['MITRA JASATRIA INDONESIA', 'MJI'],
  ['ANUGRAH MEGA MANDIRI', 'KAMM'],
  ['OTO MULTIARTHA', 'OTO'],
  ['FEDERAL INTERNATIONAL FINANCE', 'FIF'],
  ['FIF GROUP', 'FIF'],
  ['BUSSAN AUTO FINANCE', 'BAF'],
  ['ADIRA DINAMIK', 'ADIRA'],
  ['WOM FINANCE', 'WOM'],
  ['KREDIT PLUS', 'KBKP'],
  ['KB FINANSIA', 'KBKP'],
  ['INDOMARFIN', 'IMF'],
  ['MEGA FINANCE', 'MEGA'],
  ['FIFASTEL', 'FIFASTEL'],
  ['BFI FINANCE', 'BFI'],
  ['CLIPAN SECURITIES FINANCE', 'CSF'],
  ['HOME CREDIT', 'HC'],
];

const IGNORED_WORDS = new Set(['PT', 'CV', 'UD', 'PD', 'PERUM', 'PERSERO', 'Tbk', 'dan', 'the']);

export function extractCompanyInitials(companyName?: string): string {
  const clean = normalizeText(companyName || '');
  if (!clean) return 'MJI';

  // Sudah berupa singkatan pendek (MJI, KAMM, BAF, FIF, WOM, ACC)
  if (/^[A-Z0-9]{2,6}$/.test(clean.replace(/[. ]/g, ''))) {
    return clean.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  }

  // Ambil dari dalam tanda kurung: "Koperasi ... (KAMM)" -> KAMM
  const inBracket = clean.match(/\(([A-Za-z0-9]{2,8})\)/);
  if (inBracket) return inBracket[1].toUpperCase();

  const withoutPrefix = clean.replace(/^(PT\.?|CV\.?|UD\.?|PD\.?|PERUM\.?|KOPERASI|KOP\.?|PERSERO\.?)\s+/gi, '').trim();
  const upper = withoutPrefix.toUpperCase();

  for (const [needle, code] of COMPANY_ALIASES) {
    if (upper.includes(needle)) return code;
  }

  const words = withoutPrefix
    .replace(/\(([^)]*)\)/g, '$1')
    .split(/[\s,.\-/]+/)
    .filter((w) => w.length > 1 && !IGNORED_WORDS.has(w));

  if (words.length >= 2) {
    const acronym = words.map((w) => w[0].toUpperCase()).join('');
    if (acronym.length >= 2 && acronym.length <= 6) return acronym;
  }

  return withoutPrefix.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase() || 'MJI';
}

/**
 * Nomor urut harian per jenis surat, disimpan di localStorage dengan kunci
 * tanggal sehingga 001, 002, 003 ... untuk surat yang dibuat pada hari yang sama.
 */
export function getNextDailySequence(letterType: string, dateKey = todayIso()): string {
  try {
    const storageKey = `seq_${dateKey}_${letterType.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
    const current = Number.parseInt(localStorage.getItem(storageKey) || '0', 10);
    const safe = Number.isFinite(current) && current >= 0 ? current : 0;
    const next = safe + 1;
    localStorage.setItem(storageKey, String(next));
    return String(Math.min(next, 999)).padStart(3, '0');
  } catch {
    return String(Math.floor(Math.random() * 900) + 100).padStart(3, '0');
  }
}

export type OfficialLetterType = 'ST' | 'BAST' | 'SPK';

export interface GenerateLetterNumberOptions {
  type: OfficialLetterType;
  companyName?: string;
  /** Date object, ISO string, atau dibiarkan kosong = hari ini */
  date?: Date | string;
  customSequence?: string | number;
  /** Override inisial penerbit (mis. dari field Inisial Kreditur) */
  companyInitial?: string;
}

function resolveDate(date?: Date | string): Date {
  if (date instanceof Date && !Number.isNaN(date.getTime())) return date;
  if (typeof date === 'string') {
    const parsed = parseIso(date);
    if (parsed) return parsed;
  }
  return new Date();
}

export function generateOfficialLetterNumber(options: GenerateLetterNumberOptions): string {
  const d = resolveDate(options.date);
  const day = String(d.getDate()).padStart(2, '0');
  const romanMonth = ROMAN_MONTHS[d.getMonth()] ?? 'I';
  const year = d.getFullYear();
  const companyInitials = normalizeText(options.companyInitial || '')
    ? options.companyInitial!.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    : extractCompanyInitials(options.companyName);

  const seq = options.customSequence
    ? String(options.customSequence).padStart(3, '0')
    : getNextDailySequence(options.type, todayIso(d));

  return `${seq}/${options.type}/${companyInitials}/${day}/${romanMonth}/${year}`;
}

/**
 * Baca tanggal dari nomor surat resmi (001/ST/MJI/21/VIII/2026 -> 2026-08-21).
 * Dipakai saat migrasi data lama yang belum menyimpan tanggal terpisah.
 */
export function dateFromLetterNumber(letterNumber?: string | null): string {
  const match = normalizeText(letterNumber).match(/\/(?:\d{1,4}|[A-Z0-9]+)\/\d{1,2}\/([IVXLCDM]+)\/(\d{4})(?:\/|$)/i);
  if (!match) return '';
  const [, roman, year] = match;
  const monthIndex = ROMAN_MONTHS.indexOf(roman.toUpperCase());
  if (monthIndex < 0) return '';

  const dayMatch = normalizeText(letterNumber).match(/\/\d{1,2}\/(?:[IVXLCDM]+\/\d{4})$/i);
  const day = dayMatch ? Number(dayMatch[0].replace(/[^\d]/g, '')) : 1;
  const date = new Date(Number(year), monthIndex, Number.isFinite(day) && day >= 1 && day <= 31 ? day : 1);
  return Number.isNaN(date.getTime()) ? '' : todayIso(date);
}

/* Helper praktis */
export const generateSuratTugasNumber = (companyName: string, date?: Date | string, companyInitial?: string) =>
  generateOfficialLetterNumber({ type: 'ST', companyName, date, companyInitial });

export const generateBastNumber = (companyName: string, date?: Date | string, companyInitial?: string) =>
  generateOfficialLetterNumber({ type: 'BAST', companyName, date, companyInitial });

export const generateSuratPenyerahanNumber = (companyName: string, date?: Date | string, companyInitial?: string) =>
  generateOfficialLetterNumber({ type: 'SPK', companyName, date, companyInitial });
