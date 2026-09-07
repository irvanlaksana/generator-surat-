import type { DocData, ValidationIssue } from '../types';
import { extractNumber, formatRupiah, normalizeText, parseIso } from './format';
import { getInisialKreditur } from './filename';
import { DOC_CATEGORIES } from '../data/defaults';

/**
 * Validasi terpusat untuk seluruh field pada satu urutan form.
 * - error   : memblokir ekspor PDF / unggah Drive
 * - warning : boleh lanjut, tetapi tetap ditampilkan supaya data mudah dicek
 */

const RE_NIK = /^\d{16}$/;
const RE_PHONE = /^(\+?62|0)8[1-9][\d\s-]{6,15}$/;
const RE_PLAT = /^[A-Z]{1,2}\s?\d{1,4}\s?[A-Z]{0,3}$/i;
const RE_INSTALLMENT = /^\d{1,4}(\s*(?:s\/?d\.?|sampai|s\.d\.)\s*\d{1,4})?$/i;
const RE_LETTER_NO = /^\d{1,4}\/(ST|BAST|SPK)\/[A-Z0-9]{2,8}\/\d{1,2}\/[IVX]{1,4}\/\d{4}$/i;

export type FieldIssue = ValidationIssue & { field: keyof DocData | string };

export interface ValidationResult {
  issues: FieldIssue[];
  errors: FieldIssue[];
  warnings: FieldIssue[];
  byField: Record<string, FieldIssue[]>;
  hasBlockingError: boolean;
}

type Rule = (data: DocData) => FieldIssue | FieldIssue[] | null;

const rule = (
  field: keyof DocData,
  label: string,
  level: 'error' | 'warning',
  check: (data: DocData) => string | null,
): Rule => (data) => {
  const message = check(data);
  return message ? { field, label, message, level } : null;
};

const text = (value: string) => normalizeText(value || '');
const isFilled = (value: string) => value.trim().length > 0;

const RULES: Rule[] = [
  /* ---- Data inti debitur & kreditur (dipakai juga untuk nama file) ---- */
  rule('namaDebitur', 'Nama Debitur', 'error', (d) => {
    const v = text(d.namaDebitur);
    if (!v) return 'Wajib diisi — nama debitur dipakai pada isi surat sekaligus nama file PDF.';
    if (v.length < 3) return 'Nama terlalu pendek (minimal 3 karakter).';
    if (/\d/.test(v)) return 'Nama debitur sebaiknya tidak mengandung angka.';
    return null;
  }),
  rule('namaDebitur', 'Nama Debitur', 'warning', (d) =>
    /^[A-Za-zÀ-ÿ' .-]+$/.test(text(d.namaDebitur)) || !d.namaDebitur
      ? null
      : 'Hanya huruf, spasi, tanda hubung, dan titik yang disarankan.',
  ),
  rule('kecamatan', 'Kecamatan', 'error', (d) => {
    const v = text(d.kecamatan);
    if (!v) return 'Wajib diisi — kecamatan dipakai sebagai bagian akhir nama file PDF.';
    if (v.length < 2) return 'Nama kecamatan terlalu pendek.';
    return null;
  }),
  rule('namaKreditur', 'Kreditur / Leasing', 'error', (d) => {
    if (!text(d.namaKreditur) && !text(d.inisialKreditur)) {
      return 'Isi nama kreditur (atau inisialnya) — inisial kreditur menjadi bagian awal nama file PDF.';
    }
    if (!getInisialKreditur(d)) return 'Inisial kreditur tidak dapat dibentuk, isi manual minimal 2 huruf.';
    return null;
  }),
  rule('inisialKreditur', 'Inisial Kreditur', 'warning', (d) => {
    const v = text(d.inisialKreditur);
    if (!v) return null;
    if (v.length < 2) return 'Inisial terlalu pendek, minimal 2 karakter.';
    if (v.length > 12) return 'Inisial sebaiknya maksimal 12 karakter agar nama file ringkas.';
    return null;
  }),
  rule('nikDebitur', 'NIK Debitur', 'error', (d) => {
    const v = text(d.nikDebitur);
    if (!v) return null;
    return RE_NIK.test(v) ? null : 'NIK harus 16 digit angka tanpa spasi/tanda baca.';
  }),
  rule('nikDebitur', 'NIK Debitur', 'warning', (d) =>
    text(d.nikDebitur) ? null : 'NIK belum diisi, data pada BAST akan tampil kosong.',
  ),
  rule('nomorKontrak', 'No. Kontrak', 'warning', (d) => {
    const v = text(d.nomorKontrak);
    if (!v) return 'No. kontrak belum diisi padahal tercetak di Surat Tugas & BAST.';
    if (v.length < 5) return 'No. kontrak biasanya minimal 5 karakter, periksa kembali.';
    return null;
  }),
  rule('alamatDebitur', 'Alamat Debitur', 'warning', (d) => {
    const v = text(d.alamatDebitur);
    if (!v) return 'Alamat belum diisi — petugas lapangan membutuhkan alamat lengkap.';
    if (v.length < 12) return 'Alamat terasa singkat, tambahkan RT/RW, desa, dan kecamatan.';
    return null;
  }),
  rule('hpDebitur', 'No. HP Debitur', 'warning', (d) =>
    !isFilled(d.hpDebitur) || RE_PHONE.test(d.hpDebitur.replace(/\s/g, ''))
      ? null
      : 'Format nomor HP tidak umum (contoh benar: 0812-3456-7890).',
  ),

  /* ---- Nomor surat ---- */
  rule('nomorSuratTugas', 'No. Surat Tugas', 'warning', (d) => {
    const v = text(d.nomorSuratTugas);
    if (!v) return 'Nomor surat tugas kosong — gunakan tombol Generate.';
    return RE_LETTER_NO.test(v) ? null : 'Format nomor tidak baku: 001/ST/MJI/21/VIII/2026.';
  }),
  rule('nomorBast', 'No. BAST', 'warning', (d) => {
    const v = text(d.nomorBast);
    if (!v) return 'Nomor BAST kosong — gunakan tombol Generate.';
    return RE_LETTER_NO.test(v) ? null : 'Format nomor tidak baku: 001/BAST/MJI/21/VIII/2026.';
  }),
  rule('nomorPenyerahan', 'No. Surat Penyerahan', 'warning', (d) => {
    const v = text(d.nomorPenyerahan);
    if (!v) return 'Nomor surat penyerahan kosong — gunakan tombol Generate.';
    return RE_LETTER_NO.test(v) ? null : 'Format nomor tidak baku: 001/SPK/MJI/21/VIII/2026.';
  }),
  (d) => {
    const pairs: Array<[string, string]> = [
      ['nomorSuratTugas', 'No. Surat Tugas'],
      ['nomorBast', 'No. BAST'],
      ['nomorPenyerahan', 'No. Surat Penyerahan'],
    ];
    const dupes = new Map<string, string[]>();
    for (const [field, label] of pairs) {
      const value = text(String(d[field as keyof DocData] ?? ''));
      if (!value) continue;
      dupes.set(value, [...(dupes.get(value) ?? []), label]);
    }
    const conflicts = [...dupes.values()].filter((list) => list.length > 1);
    if (!conflicts.length) return null;
    return {
      field: 'nomorBast',
      label: 'Nomor Surat',
      message: `Nomor surat tidak boleh sama antar dokumen (${conflicts[0].join(' = ')}).`,
      level: 'error',
    };
  },

  /* ---- Tanggal ---- */
  rule('tanggalSurat', 'Tanggal Surat', 'error', (d) => {
    if (!d.tanggalSurat) return 'Tanggal surat wajib diisi (dipakai pada nomor surat & tanggal tanda tangan).';
    return parseIso(d.tanggalSurat) ? null : 'Tanggal surat tidak valid.';
  }),
  rule('masaBerlakuMulai', 'Berlaku Mulai', 'warning', (d) => {
    if (!d.masaBerlakuMulai) return 'Masa berlaku mulai belum diisi.';
    return parseIso(d.masaBerlakuMulai) ? null : 'Tanggal tidak valid.';
  }),
  rule('masaBerlakuSampai', 'Berlaku Sampai', 'error', (d) => {
    if (!d.masaBerlakuSampai) return 'Batas akhir masa berlaku wajib diisi.';
    const end = parseIso(d.masaBerlakuSampai);
    if (!end) return 'Tanggal tidak valid.';
    const start = parseIso(d.masaBerlakuMulai);
    if (start && end < start) return 'Tanggal berakhir lebih awal dari tanggal mulai.';
    return null;
  }),
  rule('jatuhTempo', 'Tanggal Jatuh Tempo', 'warning', (d) => {
    if (!d.jatuhTempo) return null;
    return parseIso(d.jatuhTempo) ? null : 'Tanggal jatuh tempo tidak valid.';
  }),
  rule('tanggalPenyerahan', 'Tanggal Penyerahan / BAST', 'warning', (d) => {
    if (!d.tanggalPenyerahan) return 'Tanggal penyerahan belum diisi (tercetak pada Surat Penyerahan & BAST).';
    return parseIso(d.tanggalPenyerahan) ? null : 'Tanggal tidak valid.';
  }),

  /* ---- Angsuran ---- */
  rule('nomorAngsuran', 'Nomor Angsuran', 'error', (d) => {
    const v = text(d.nomorAngsuran);
    if (!v) return null;
    return RE_INSTALLMENT.test(v) ? null : 'Format nomor angsuran: 8 (tunggal) atau 8 s/d 18 (rentang).';
  }),
  rule('nomorAngsuran', 'Nomor Angsuran', 'warning', (d) => {
    const v = text(d.nomorAngsuran);
    if (!v) return 'Nomor angsuran belum diisi.';
    const nums = v.match(/\d+/g)?.map(Number) ?? [];
    if (nums.length === 2 && nums[1] < nums[0]) return 'Angsuran akhir lebih kecil dari angsuran awal.';
    if (nums.length === 1 && nums[0] < 1) return 'Nomor angsuran mulai dari 1.';
    return null;
  }),
  rule('nilaiAngsuran', 'Nilai Angsuran', 'error', (d) => {
    const v = text(d.nilaiAngsuran);
    if (!v) return null;
    return formatRupiah(v) ? null : 'Nilai angsuran harus angka, contoh: 385.000 atau Rp 385.000';
  }),
  rule('denda', 'Denda', 'error', (d) => {
    const v = text(d.denda);
    if (!v) return null;
    return formatRupiah(v) ? null : 'Denda harus angka rupiah, contoh: 41.692.000';
  }),
  rule('totalTunggakan', 'Total Tunggakan', 'error', (d) => {
    const v = text(d.totalTunggakan);
    if (!v) return null;
    return formatRupiah(v) ? null : 'Total tunggakan harus angka rupiah, contoh: 3.850.000';
  }),
  (d) => {
    const angsuran = extractNumber(text(d.nilaiAngsuran));
    const jumlah = (text(d.nomorAngsuran).match(/\d+/g) ?? []).length === 2
      ? (() => {
          const [a, b] = text(d.nomorAngsuran).match(/\d+/g)!.map(Number);
          return Math.max(b - a + 1, 0);
        })()
      : 1;
    const tunggakan = extractNumber(text(d.totalTunggakan));
    if (!angsuran || !tunggakan || jumlah < 1) return null;
    const perkiraan = angsuran * jumlah;
    if (perkiraan === 0) return null;
    const selisih = Math.abs(perkiraan - tunggakan) / perkiraan;
    if (selisih > 0.05) {
      return {
        field: 'totalTunggakan',
        label: 'Total Tunggakan',
        message: `Nilai tunggakan berbeda ${Math.round(selisih * 100)}% dari hitungan ${jumlah} × Rp ${angsuran.toLocaleString('id-ID')} (cek kembali).`,
        level: 'warning',
      };
    }
    return null;
  },

  /* ---- Pihak ---- */
  rule('namaPerusahaan', 'Nama Perusahaan', 'error', (d) =>
    text(d.namaPerusahaan) ? null : 'Nama penerbit surat wajib diisi (kepala surat & blok tanda tangan).',
  ),
  rule('namaPetugas', 'Nama Petugas', 'error', (d) =>
    text(d.namaPetugas) ? null : 'Nama petugas penerima tugas wajib diisi pada Surat Tugas & BAST.',
  ),
  rule('namaPemberiTugas', 'Nama Pemberi Tugas', 'warning', (d) =>
    text(d.namaPemberiTugas) ? null : 'Pemberi tugas belum diisi, ruang tanda tangan kiri akan kosong.',
  ),
  rule('nikPetugas', 'NIK Petugas', 'error', (d) => {
    const v = text(d.nikPetugas);
    if (!v) return null;
    return RE_NIK.test(v) ? null : 'NIK petugas harus 16 digit angka.';
  }),
  rule('hpPetugas', 'No. HP Petugas', 'warning', (d) =>
    !isFilled(d.hpPetugas) || RE_PHONE.test(d.hpPetugas.replace(/\s/g, ''))
      ? null
      : 'Format nomor HP petugas tidak umum (contoh: 0812-9876-5432).',
  ),

  /* ---- Kendaraan ---- */
  rule('kendaraanMerk', 'Merk Kendaraan', 'warning', (d) =>
    text(d.kendaraanMerk) ? null : 'Merk/tipe kendaraan belum diisi (tercetak di Surat Tugas).',
  ),
  rule('kendaraanNoPol', 'Nomor Polisi', 'error', (d) => {
    const v = text(d.kendaraanNoPol);
    if (!v) return 'Nomor polisi wajib diisi sebagai identitas unit.';
    return RE_PLAT.test(v.replace(/\s+/g, ' ')) ? null : 'Format nomor polisi tidak baku (contoh: R 4088 YV).';
  }),
  rule('kendaraanTahun', 'Tahun Kendaraan', 'warning', (d) => {
    const v = text(d.kendaraanTahun);
    if (!v) return null;
    const year = Number(v);
    if (!/^\d{4}$/.test(v)) return 'Tahun sebaiknya 4 digit, contoh: 2022.';
    const thisYear = new Date().getFullYear();
    if (year < 1970 || year > thisYear + 1) return `Tahun di luar rentang wajar (1970-${thisYear + 1}).`;
    return null;
  }),
  rule('kendaraanNoRangka', 'Nomor Rangka', 'warning', (d) => {
    const v = text(d.kendaraanNoRangka);
    if (!v) return 'Nomor rangka belum diisi (penting untuk eksekusi fidusia).';
    if (v.length < 8) return 'Nomor rangka terlalu pendek, cek kembali transkrip STNK.';
    if (/\s/.test(v)) return 'Nomor rangka sebaiknya tanpa spasi.';
    return null;
  }),
  rule('kendaraanNoMesin', 'Nomor Mesin', 'warning', (d) => {
    const v = text(d.kendaraanNoMesin);
    if (!v) return 'Nomor mesin belum diisi.';
    if (v.length < 5) return 'Nomor mesin terlalu pendek, cek kembali transkrip STNK.';
    return null;
  }),
  rule('kendaraanOdometer', 'Odometer', 'warning', (d) => {
    const v = text(d.kendaraanOdometer);
    if (!v) return null;
    const km = extractNumber(v);
    if (km === null) return 'Odometer harus angka, contoh: 48.250 KM.';
    if (km > 999999) return 'Nilai odometer tidak wajar (> 999.999 KM).';
    return null;
  }),

  /* ---- Berkas & kop ---- */
  rule('kopImage', 'Upload Kop Surat', 'warning', (d) =>
    d.kopImage ? null : 'Kop surat belum diunggah; dokumen akan memakai kop teks dari nama perusahaan.',
  ),
  rule('cabang', 'Cabang / Alamat Perusahaan', 'warning', (d) =>
    text(d.cabang) || text(d.alamatPerusahaan)
      ? null
      : 'Cabang atau alamat penerbit belum diisi, kop teks akan minim informasi.',
  ),
  (d) => {
    const missing = DOC_CATEGORIES.filter(
      (cfg) => cfg.required && !d.dokumen.some((doc) => doc.kategori === cfg.id),
    ).map((cfg) => cfg.label);
    if (!missing.length) return null;
    return {
      field: 'dokumen',
      label: 'Berkas Pendukung',
      message: `Berkas wajib belum diunggah: ${missing.join(', ')}.`,
      level: 'warning',
    };
  },
  (d) => {
    if (d.dokumen.length <= 40) return null;
    return {
      field: 'dokumen',
      label: 'Berkas Pendukung',
      message: 'Jumlah berkas melebihi 40 file — lampiran PDF akan sangat besar, kurangi berkas.',
      level: 'error',
    };
  },
];

export function validateDoc(data: DocData): ValidationResult {
  const issues: FieldIssue[] = [];
  for (const fn of RULES) {
    const result = fn(data);
    if (!result) continue;
    if (Array.isArray(result)) issues.push(...result.filter(Boolean));
    else issues.push(result);
  }

  const errors = issues.filter((i) => i.level === 'error');
  const warnings = issues.filter((i) => i.level === 'warning');
  const byField: Record<string, FieldIssue[]> = {};
  for (const issue of issues) {
    byField[issue.field] = [...(byField[issue.field] ?? []), issue];
  }

  return {
    issues,
    errors,
    warnings,
    byField,
    hasBlockingError: errors.length > 0,
  };
}

/** Field wajib yang masih kosong, dipakai untuk ringkasan kelengkapan form */
export function completionStats(data: DocData): { filled: number; total: number; percent: number } {
  const requiredFields: Array<keyof DocData> = [
    'namaDebitur',
    'kecamatan',
    'namaKreditur',
    'alamatDebitur',
    'nomorKontrak',
    'tanggalSurat',
    'masaBerlakuMulai',
    'masaBerlakuSampai',
    'nomorAngsuran',
    'nilaiAngsuran',
    'namaPerusahaan',
    'namaPetugas',
    'kendaraanMerk',
    'kendaraanNoPol',
    'kota',
    'tanggalPenyerahan',
  ];
  const filled = requiredFields.filter((key) => {
    const value = data[key];
    if (Array.isArray(value)) return value.length > 0;
    return typeof value === 'string' && value.trim().length > 0;
  }).length;
  const total = requiredFields.length;
  return { filled, total, percent: Math.round((filled / total) * 100) };
}
