const ROMAN_MONTHS = [
  'I', 'II', 'III', 'IV', 'V', 'VI',
  'VII', 'VIII', 'IX', 'X', 'XI', 'XII'
];

export function getRomanMonth(monthIndex: number): string {
  return ROMAN_MONTHS[monthIndex] || 'I';
}

export function extractCompanyInitials(companyName?: string): string {
  if (!companyName || !companyName.trim()) return 'MJI';
  
  const clean = companyName.trim();
  
  // If already short uppercase abbreviation (e.g. MJI, KAMM, BAF, FIF, ACC, WOM)
  if (/^[A-Z0-9]{2,6}$/i.test(clean)) {
    return clean.toUpperCase();
  }

  // Remove common company prefixes
  const withoutPrefix = clean
    .replace(/^(PT\.?|CV\.?|KOPERASI|KOP\.?|UD\.?|PERUM\.?|PERSERO\.?)\s+/gi, '')
    .trim();

  // Known standard mappings
  const upper = withoutPrefix.toUpperCase();
  if (upper.includes('MITRA JASATRIA INDONESIA')) return 'MJI';
  if (upper.includes('ANUGRAH MEGA MANDIRI')) return 'KAMM';
  if (upper.includes('OTO MULTIARTHA')) return 'OTO';
  if (upper.includes('FEDERAL INTERNATIONAL FINANCE') || upper.includes('FIF GROUP')) return 'FIF';
  if (upper.includes('BUSSAN AUTO FINANCE')) return 'BAF';
  if (upper.includes('ADIRA')) return 'ADIRA';
  if (upper.includes('WOM FINANCE')) return 'WOM';
  if (upper.includes('KREDIT PLUS') || upper.includes('KB FINANSIA')) return 'KB-KP';

  // Extract acronym from words (length > 1)
  const words = withoutPrefix.split(/[\s,.-]+/).filter((w) => w.length > 1);
  if (words.length >= 2) {
    const acronym = words.map((w) => w[0].toUpperCase()).join('');
    if (acronym.length >= 2 && acronym.length <= 5) {
      return acronym;
    }
  }

  // Fallback: take first 3-4 letters
  return withoutPrefix.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'MJI';
}

function dailySequenceKey(letterType: string, date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `seq_${year}-${month}-${day}_${letterType.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
}

/**
 * Gets or increments a daily sequence counter for specific letter type.
 * Stored in localStorage by YYYY-MM-DD key so that consecutive generations
 * within the same day get 001, 002, 003...
 */
export function getNextDailySequence(letterType: string, date = new Date()): string {
  try {
    const current = parseInt(localStorage.getItem(dailySequenceKey(letterType, date)) || '0', 10);
    const next = current + 1;
    localStorage.setItem(dailySequenceKey(letterType, date), next.toString());
    
    return String(next).padStart(3, '0');
  } catch {
    const rand = Math.floor(Math.random() * 900) + 100;
    return String(rand);
  }
}

/**
 * Preview nomor urut berikutnya TANPA menambah counter
 * (dipakai untuk pratinjau payload otomatis sebelum diterapkan).
 */
export function peekNextDailySequence(letterType: string, date = new Date()): string {
  try {
    const current = parseInt(localStorage.getItem(dailySequenceKey(letterType, date)) || '0', 10);
    return String(current + 1).padStart(3, '0');
  } catch {
    return '001';
  }
}

export type OfficialLetterType = 'ST' | 'BAST' | 'SPK';

export interface GenerateLetterNumberOptions {
  type: OfficialLetterType | 'SURAT_TUGAS' | 'SURAT_BAST' | 'SURAT_PENYERAHAN';
  companyName?: string;
  date?: Date | string;
  customSequence?: string | number;
}

function resolveDate(date?: Date | string): Date {
  let d = new Date();
  if (date) {
    if (typeof date === 'string') {
      const parsed = new Date(date);
      if (!isNaN(parsed.getTime())) {
        d = parsed;
      }
    } else {
      d = date;
    }
  }
  return d;
}

function resolveTypeInitial(type: GenerateLetterNumberOptions['type']): string {
  if (type === 'BAST' || type === 'SURAT_BAST') return 'BAST';
  if (type === 'SPK' || type === 'SURAT_PENYERAHAN') return 'SPK';
  return 'ST';
}

// Format Resmi: [NO_URUT_HARIAN]/[INISIAL_SURAT]/[INISIAL_PERUSAHAAN]/[TANGGAL]/[BULAN_ROMAWI]/[TAHUN]
// Contoh: 001/ST/MJI/29/VIII/2026 atau 002/BAST/MJI/29/VIII/2026 atau 001/SPK/MJI/29/VIII/2026
function formatOfficialNumber(seq: string, typeInitial: string, companyInitials: string, d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const romanMonth = getRomanMonth(d.getMonth());
  return `${seq}/${typeInitial}/${companyInitials}/${day}/${romanMonth}/${d.getFullYear()}`;
}

/**
 * Pratinjau nomor surat resmi TANPA menambah counter harian
 * (untuk menampilkan preview di panel payload otomatis).
 */
export function previewOfficialLetterNumber(options: GenerateLetterNumberOptions): string {
  const d = resolveDate(options.date);
  const typeInitial = resolveTypeInitial(options.type);
  const companyInitials = extractCompanyInitials(options.companyName);
  const seq = options.customSequence
    ? String(options.customSequence).padStart(3, '0')
    : peekNextDailySequence(typeInitial, d);
  return formatOfficialNumber(seq, typeInitial, companyInitials, d);
}

export function generateOfficialLetterNumber(options: GenerateLetterNumberOptions): string {
  const d = resolveDate(options.date);
  const typeInitial = resolveTypeInitial(options.type);
  const companyInitials = extractCompanyInitials(options.companyName);
  const seq = options.customSequence
    ? String(options.customSequence).padStart(3, '0')
    : getNextDailySequence(typeInitial, d);
  return formatOfficialNumber(seq, typeInitial, companyInitials, d);
}

export function generateLetterNumber(date = new Date(), companyName = 'PT. MITRA JASATRIA INDONESIA'): string {
  return generateOfficialLetterNumber({
    type: 'ST',
    companyName,
    date,
  });
}

export function generateBastNumber(companyName = 'PT. MITRA JASATRIA INDONESIA', date = new Date()): string {
  return generateOfficialLetterNumber({
    type: 'BAST',
    companyName,
    date,
  });
}

export function generateSuratPenyerahanNumber(companyName = 'PT. MITRA JASATRIA INDONESIA', date = new Date()): string {
  return generateOfficialLetterNumber({
    type: 'SPK',
    companyName,
    date,
  });
}
