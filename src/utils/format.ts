/**
 * Utilitas format & normalisasi teks/angka/tanggal.
 * Semua fungsi di sini murni (pure) agar mudah divalidasi dan dipakai ulang
 * oleh form, dokumen, maupun nama file PDF.
 */

const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export const ROMAN_MONTHS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

/** Tanggal lokal dalam format ISO yyyy-mm-dd */
export function todayIso(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Tambahkan hari pada tanggal ISO (mengembalikan ISO) */
export function addDaysIso(iso: string, days: number): string {
  const parsed = parseIso(iso);
  if (!parsed) return iso;
  parsed.setDate(parsed.getDate() + days);
  return todayIso(parsed);
}

export function parseIso(iso?: string | null): Date | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
}

const SHORT_MONTHS: Record<string, number> = {
  jan: 1, january: 1, januari: 1,
  feb: 2, february: 2, februari: 2,
  mar: 3, march: 3, maret: 3,
  apr: 4, april: 4,
  may: 5, mei: 5,
  jun: 6, june: 6, juni: 6,
  jul: 7, july: 7, juli: 7,
  aug: 8, august: 8, agustus: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, okt: 10, oktober: 10,
  nov: 11, november: 11,
  dec: 12, des: 12, december: 12, desember: 12,
};

/**
 * Parse tanggal bebas ("2 FEBRUARI 2024", "14-08-2027", "2027-08-14") -> ISO.
 * Mengembalikan '' bila tidak dapat dikenali.
 */
export function toIsoDate(value?: string | null): string {
  const text = normalizeText(value || '');
  if (!text) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return parseIso(text) ? text : '';

  const isoFrom = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoFrom) {
    const [, y, m, d] = isoFrom;
    return todayIso(new Date(Number(y), Number(m) - 1, Number(d)));
  }

  const dmy = text.match(/^(\d{1,2})[\s/-]+([A-Za-z]{3,9})[\s,-]+(\d{4})/);
  if (dmy) {
    const month = SHORT_MONTHS[dmy[2].toLowerCase()];
    if (month) return todayIso(new Date(Number(dmy[3]), month - 1, Number(dmy[1])));
  }

  const mdy = text.match(/^([A-Za-z]{3,9})[\s-]+(\d{1,2})[,]?[\s-]+(\d{4})/);
  if (mdy) {
    const month = SHORT_MONTHS[mdy[1].toLowerCase()];
    if (month) return todayIso(new Date(Number(mdy[3]), month - 1, Number(mdy[2])));
  }

  const dmyShort = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyShort) {
    const [, d, m, y] = dmyShort;
    return todayIso(new Date(Number(y), Number(m) - 1, Number(d)));
  }

  return '';
}


/** "2026-08-21" -> "21 Agustus 2026" */
export function formatTanggalId(iso?: string | null): string {
  const date = parseIso(iso);
  if (!date) return '';
  return `${date.getDate()} ${NAMA_BULAN[date.getMonth()]} ${date.getFullYear()}`;
}

/** "2026-08-21" -> "21 AGUSTUS 2026" (untuk badan surat) */
export function formatTanggalIdUpper(iso?: string | null): string {
  const txt = formatTanggalId(iso);
  return txt ? txt.toUpperCase() : '';
}

/** "2026-08-21" -> "Jumat" */
export function formatHariId(iso?: string | null): string {
  const date = parseIso(iso);
  if (!date) return '';
  return HARI[date.getDay()];
}

/** Tanggal ISO -> angka romawi bulan + tahun, mis. "VIII/2026" */
export function romanMonthOf(iso?: string | null): string {
  const date = parseIso(iso);
  return date ? ROMAN_MONTHS[date.getMonth()] : '';
}

export function yearOf(iso?: string | null): string {
  const date = parseIso(iso);
  return date ? String(date.getFullYear()) : '';
}

/** Normalisasi spasi & kapital untuk nama orang / instansi */
export function normalizeText(value?: string | null): string {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

export function toUpperText(value?: string | null): string {
  return normalizeText(value).toUpperCase();
}

/** Buang tanda baca/aksen lalu jadikan slug kapital dengan underscore */
export function slugPart(value?: string | null, maxLen = 34): string {
  const base = normalizeText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’`".,:;()\/\\]/g, ' ')
    .replace(/[^A-Za-z0-9\s-]/g, ' ')
    .replace(/[\s-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toUpperCase();
  if (!base) return '';
  return base.length > maxLen ? base.slice(0, maxLen).replace(/_+$/, '') : base;
}

/** "385000" | "385.000" | "Rp 385.000" -> "Rp. 385.000" (nol/invalid -> '') */
export function formatRupiah(value?: string | null): string {
  const clean = normalizeText(value).replace(/Rp\.?/gi, '').replace(/\s/g, '');
  if (!clean) return '';
  // Sudah diformat (titik ribuan & opsional desimal)
  const isDecimal = /^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(clean);
  const isPlain = /^\d+(,\d{1,2})?$/.test(clean);
  if (!isDecimal && !isPlain) return '';
  const [intPart, decPart] = clean.split(',');
  const digits = intPart.replace(/\./g, '');
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Rp. ${grouped}${decPart ? `,${decPart}` : ''}`;
}

/** Ambil nilai numerik murni dari teks (mis. "48.250 KM" -> 48250) */
export function extractNumber(value?: string | null): number | null {
  const digits = (value ?? '').replace(/[^\d]/g, '');
  if (!digits) return null;
  return Number(digits);
}

/** Tampilkan '-' bila kosong, agar dokumen tidak bolong tanpa tanda */
export function dash(value?: string | null): string {
  const v = (value ?? '').toString().trim();
  return v ? v : '-';
}

/** Gabungkan bagian alamat yang terisi saja */
export function joinAddress(...parts: Array<string | undefined | null>): string {
  return parts
    .map((p) => (p ?? '').toString().trim().replace(/,+$/, ''))
    .filter(Boolean)
    .join(', ');
}
