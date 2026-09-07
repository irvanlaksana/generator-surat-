import type {
  BastDataLegacy,
  ChecklistMap,
  DocCategoryConfig,
  DocData,
  DocCategoryId,
  VehicleType,
} from '../types';
import { syncChecklist } from './checklist';
import { toIsoDate } from '../utils/format';
import { dateFromLetterNumber } from '../utils/letterNumber';

export * from './checklist';

/* ------------------------------------------------------------------ */
/* Berkas pendukung                                                    */
/* ------------------------------------------------------------------ */

export const DOC_CATEGORIES: DocCategoryConfig[] = [
  {
    id: 'ktp',
    label: 'KTP Debitur',
    hint: 'Scan/foto KTP jelas, 1-3 berkas',
    icon: 'IdCard',
    maxFiles: 3,
    required: true,
  },
  {
    id: 'stnk',
    label: 'STNK',
    hint: 'STNK asli + lembar perpanjangan',
    icon: 'FileBadge',
    maxFiles: 3,
    required: true,
  },
  {
    id: 'bpkb',
    label: 'BPKB / Faktur',
    hint: 'BPKB, faktur pembelian, atau surat blokir',
    icon: 'BookOpen',
    maxFiles: 3,
    required: false,
  },
  {
    id: 'unit',
    label: 'Foto Unit',
    hint: 'Depan, belakang, samping, KM, interior',
    icon: 'Camera',
    maxFiles: 8,
    required: true,
  },
  {
    id: 'lainnya',
    label: 'Dokumen Lainnya',
    hint: 'SP, surat kuasa, kk, slip angsuran, dll',
    icon: 'Files',
    maxFiles: 8,
    required: false,
  },
];

export const DOC_CATEGORY_MAP: Record<DocCategoryId, DocCategoryConfig> = DOC_CATEGORIES.reduce(
  (acc, cfg) => {
    acc[cfg.id] = cfg;
    return acc;
  },
  {} as Record<DocCategoryId, DocCategoryConfig>,
);

export const MAX_FILE_SIZE_MB = 6;
export const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/* ------------------------------------------------------------------ */
/* Data default (satu model untuk semua dokumen)                       */
/* ------------------------------------------------------------------ */

export const EMPTY_DATA: DocData = {
  namaPerusahaan: '',
  cabang: '',
  alamatPerusahaan: '',
  teleponPerusahaan: '',
  kopImage: null,
  kopImageHeight: 120,
  kopImageFit: 'contain',
  kopImageAlign: 'center',
  kopOffsetY: 0,
  kopMarginBottom: 32,

  namaKreditur: '',
  inisialKreditur: '',

  namaDebitur: '',
  nikDebitur: '',
  alamatDebitur: '',
  kecamatan: '',
  kabupaten: '',
  hpDebitur: '',
  nomorKontrak: '',

  nomorSuratTugas: '',
  nomorBast: '',
  nomorPenyerahan: '',
  tanggalSurat: '',
  masaBerlakuMulai: '',
  masaBerlakuSampai: '',
  tempatTanggalTtd: '',

  nomorAngsuran: '',
  nilaiAngsuran: '',
  jatuhTempo: '',
  totalTunggakan: '',
  denda: '',
  keteranganAngsuran: '',

  namaPemberiTugas: '',
  jabatanPemberiTugas: '',
  namaPetugas: '',
  nikPetugas: '',
  jabatanPetugas: '',
  hpPetugas: '',

  jenis: 'roda2',
  kendaraanMerk: '',
  kendaraanType: '',
  kendaraanTahun: '',
  kendaraanWarna: '',
  kendaraanNoPol: '',
  kendaraanNoRangka: '',
  kendaraanNoMesin: '',
  kendaraanOdometer: '',
  kendaraanBahanBakar: '',
  kendaraanStnk: '',
  kendaraanBpkb: '',
  kendaraanKondisiMesin: '',
  kendaraanKondisiBodi: '',

  dokumen: [],
  checklist: {},

  kota: '',
  tanggalPenyerahan: '',
  saksi1Nama: '',
  saksi1Jabatan: '',
  saksi2Nama: '',
  saksi2Jabatan: '',
  catatanKhusus: '',
};

function withChecklist(base: DocData, jenis: VehicleType): DocData {
  return { ...base, jenis, checklist: syncChecklist(jenis, base.checklist) };
}

const SAMPLE: DocData = {
  ...EMPTY_DATA,
  namaPerusahaan: 'PT. MITRA JASATRIA INDONESIA',
  cabang: 'Cabang Purwokerto',
  alamatPerusahaan: 'Jl. Gerilya No. 45, Purwokerto Selatan, Banyumas, Jawa Tengah',
  teleponPerusahaan: '(0281) 634567 / 0812-3456-7890',
  kopImage: null,
  kopImageHeight: 120,
  kopImageFit: 'contain',
  kopImageAlign: 'center',
  kopOffsetY: 0,
  kopMarginBottom: 28,

  namaKreditur: 'Koperasi Anugrah Mega Mandiri (KAMM)',
  inisialKreditur: 'KAMM',

  namaDebitur: 'KISNO ANGKAH TRI HIDAYAT',
  nikDebitur: '3303041508820003',
  alamatDebitur: 'Kalikabong RT 004 RW 002, Kalimanah, Purbalingga',
  kecamatan: 'Kalimanah',
  kabupaten: 'Purbalingga',
  hpDebitur: '0857-1234-5678',
  nomorKontrak: '00730191',

  nomorSuratTugas: '001/ST/MJI/22/VIII/2026',
  nomorBast: '001/BAST/MJI/22/VIII/2026',
  nomorPenyerahan: '001/SPK/MJI/22/VIII/2026',
  tanggalSurat: '2026-08-22',
  masaBerlakuMulai: '2026-08-22',
  masaBerlakuSampai: '2026-08-31',
  tempatTanggalTtd: 'Purwokerto, 22 Agustus 2026',

  nomorAngsuran: '8 s/d 18',
  nilaiAngsuran: '385.000',
  jatuhTempo: '2024-02-02',
  totalTunggakan: '4.235.000',
  denda: '41.692.000',
  keteranganAngsuran: 'Angsuran ke 8 s/d 18 (11 bulan) sudah melewati jatuh tempo.',

  namaPemberiTugas: 'FILEMO HALAWA',
  jabatanPemberiTugas: 'Direktur',
  namaPetugas: 'RIZKY JUANDA SAPUTRA',
  nikPetugas: '3302242201940001',
  jabatanPetugas: 'Petugas Penagihan',
  hpPetugas: '0812-9876-5432',

  kendaraanMerk: 'YAMAHA',
  kendaraanType: 'VIXION 150 DOHC',
  kendaraanTahun: '2022',
  kendaraanWarna: 'Merah Doff',
  kendaraanNoPol: 'R 4088 YV',
  kendaraanNoRangka: 'MH3RG1210NK049182',
  kendaraanNoMesin: 'G3E4E-0849201',
  kendaraanOdometer: '22.400 KM',
  kendaraanBahanBakar: '3/4 Bar',
  kendaraanStnk: 'Ada (Pajak hidup s/d Nov 2026)',
  kendaraanBpkb: 'Dalam jaminan kreditur',
  kendaraanKondisiMesin: 'Mesin halus, tarikan normal, electric starter berfungsi.',
  kendaraanKondisiBodi: 'Lecet halus pada cover knalpot dan spion kanan.',

  kota: 'Purwokerto',
  tanggalPenyerahan: '2026-08-22',
  saksi1Nama: 'AHMAD FAUZI',
  saksi1Jabatan: 'Supervisor Remedial',
  saksi2Nama: 'SLAMET RIYADI',
  saksi2Jabatan: 'Keluarga Debitur',
  catatanKhusus:
    'Penyerahan unit kendaraan dilakukan secara sukarela dan tanpa paksaan dari pihak manapun.',
};

const CONTOH_RODA4: DocData = {
  ...SAMPLE,
  jenis: 'roda4',
  kendaraanMerk: 'TOYOTA',
  kendaraanType: 'AVANZA 1.3 G M/T',
  kendaraanTahun: '2021',
  kendaraanWarna: 'Hitam Metalik',
  kendaraanNoRangka: 'MHFM1BA3JMK129481',
  kendaraanNoMesin: '1NR-FE-8291048',
  kendaraanOdometer: '48.250 KM',
  kendaraanBahanBakar: '1/2 Tangki',
  kendaraanStnk: 'Ada (Berlaku s/d 14-08-2027)',
  kendaraanKondisiMesin: 'Hidup normal / siap jalan',
  kendaraanKondisiBodi: 'Bodi mulus terawat, lecet pemakaian wajar di bumper depan bawah.',
  checklist: syncChecklist('roda4', {
    stnk_asli: { status: 'baik', catatan: 'STNK asli ada & pajak aktif' },
    kunci_kontak: { status: 'baik', catatan: 'Kunci utama + remote' },
    ac_blower: { status: 'rusak', catatan: 'Kurang dingin pada blower 2' },
  }),
};

export const DEFAULT_DATA: DocData = withChecklist(SAMPLE, 'roda2');
export const CONTOH_DATA: Record<VehicleType, DocData> = {
  roda2: DEFAULT_DATA,
  roda4: CONTOH_RODA4,
};

/** Data kosong siap pakai (untuk tombol "Kosongkan") dengan nama file tetap valid */
export function blankData(keepFrom?: DocData): DocData {
  return withChecklist(
    {
      ...EMPTY_DATA,
      namaPerusahaan: keepFrom?.namaPerusahaan ?? '',
      cabang: keepFrom?.cabang ?? '',
      alamatPerusahaan: keepFrom?.alamatPerusahaan ?? '',
      teleponPerusahaan: keepFrom?.teleponPerusahaan ?? '',
      kopImage: keepFrom?.kopImage ?? null,
      kopImageHeight: keepFrom?.kopImageHeight ?? 120,
      kopImageFit: keepFrom?.kopImageFit ?? 'contain',
      kopImageAlign: keepFrom?.kopImageAlign ?? 'center',
      kopOffsetY: keepFrom?.kopOffsetY ?? 0,
      kopMarginBottom: keepFrom?.kopMarginBottom ?? 28,
      namaKreditur: keepFrom?.namaKreditur ?? '',
      inisialKreditur: keepFrom?.inisialKreditur ?? '',
      namaPetugas: keepFrom?.namaPetugas ?? '',
      nikPetugas: keepFrom?.nikPetugas ?? '',
      jabatanPetugas: keepFrom?.jabatanPetugas ?? '',
      hpPetugas: keepFrom?.hpPetugas ?? '',
      namaPemberiTugas: keepFrom?.namaPemberiTugas ?? '',
      jabatanPemberiTugas: keepFrom?.jabatanPemberiTugas ?? '',
      kota: keepFrom?.kota ?? '',
    },
    keepFrom?.jenis ?? 'roda2',
  );
}

/* ------------------------------------------------------------------ */
/* Migrasi data lama (form terpisah) ke model tunggal                  */
/* ------------------------------------------------------------------ */

/**
 * Data lama menyimpan field bernama berbeda untuk dokumen berbeda
 * (customerName / debiturNama, clientName / krediturLeasing, dst).
 * Fungsi ini menggabungkannya menjadi satu model agar data user tidak hilang.
 */
export function migrateLegacy(legacy: Partial<BastDataLegacy> & Record<string, unknown>): DocData {
  const pick = (...keys: string[]): string => {
    for (const key of keys) {
      const value = legacy[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return '';
  };
  const pickNum = (...keys: string[]): number | undefined => {
    for (const key of keys) {
      const value = legacy[key];
      if (typeof value === 'number' && Number.isFinite(value)) return value;
    }
    return undefined;
  };
  const jenis: VehicleType = legacy.jenis === 'roda2' ? 'roda2' : legacy.jenis === 'roda4' ? 'roda4' : 'roda2';

  const next: DocData = {
    ...EMPTY_DATA,
    namaPerusahaan: pick('kopCompanyName', 'perusahaan'),
    cabang: pick('cabang'),
    alamatPerusahaan: pick('alamat'),
    teleponPerusahaan: pick('telepon'),
    kopImage: typeof legacy.kopImage === 'string' ? legacy.kopImage : null,
    kopImageHeight: pickNum('kopImageHeight') ?? 120,
    kopImageFit: (legacy.kopImageFit as DocData['kopImageFit']) ?? 'contain',
    kopImageAlign: (legacy.kopImageAlign as DocData['kopImageAlign']) ?? 'center',
    kopOffsetY: pickNum('kopImageOffsetY') ?? 0,
    kopMarginBottom: pickNum('kopImageMarginBottom') ?? 28,

    namaKreditur: pick('krediturLeasing', 'clientName'),
    inisialKreditur: pick('inisialKreditur'),

    namaDebitur: pick('debiturNama', 'customerName'),
    nikDebitur: pick('debiturNik'),
    alamatDebitur: pick('debiturAlamat', 'customerAddress'),
    kecamatan: pick('kecamatan'),
    kabupaten: pick('kabupaten'),
    hpDebitur: pick('debiturHp'),
    nomorKontrak: pick('nomorKontrak', 'customerContract'),

    nomorSuratTugas: pick('letterNumber', 'nomorSuratTugas'),
    nomorBast: pick('nomorBast'),
    nomorPenyerahan: pick('nomorPenyerahan'),
    tanggalSurat:
      toIsoDate(pick('tanggalSurat', 'tanggal')) || dateFromLetterNumber(pick('nomorSuratTugas', 'letterNumber')),
    masaBerlakuMulai: toIsoDate(pick('masaBerlakuMulai', 'validFrom')),
    masaBerlakuSampai: toIsoDate(pick('masaBerlakuSampai', 'validTo')),
    tempatTanggalTtd: pick('signPlaceDate', 'tempatTanggalTtd'),

    nomorAngsuran: pick('nomorAngsuran'),
    nilaiAngsuran: pick('nilaiAngsuran', 'customerInstallment'),
    jatuhTempo: toIsoDate(pick('jatuhTempo', 'customerDueDate')),
    totalTunggakan: pick('totalTunggakan'),
    denda: pick('customerPenalty', 'denda'),
    keteranganAngsuran: pick('keteranganAngsuran'),

    namaPemberiTugas: pick('assignerName'),
    jabatanPemberiTugas: pick('assignerPosition'),
    namaPetugas: pick('assigneeName', 'petugasNama'),
    nikPetugas: pick('assigneeNIK', 'petugasNik'),
    jabatanPetugas: pick('assigneePosition', 'petugasJabatan'),
    hpPetugas: pick('petugasHp', 'hpPetugas'),

    jenis,
    kendaraanMerk: pick('kendaraanMerk') || pick('vehicleBrand').split('/')[0]?.trim() || '',
    kendaraanType: pick('kendaraanType') || pick('vehicleBrand').split('/')[1]?.trim() || '',
    kendaraanTahun: pick('kendaraanTahun'),
    kendaraanWarna: pick('kendaraanWarna'),
    kendaraanNoPol: pick('kendaraanNoPol', 'vehiclePlate'),
    kendaraanNoRangka: pick('kendaraanNoRangka'),
    kendaraanNoMesin: pick('kendaraanNoMesin'),
    kendaraanOdometer: pick('kendaraanOdometer'),
    kendaraanBahanBakar: pick('kendaraanBahanBakar'),
    kendaraanStnk: pick('kendaraanStnk'),
    kendaraanBpkb: pick('kendaraanBpkb'),
    kendaraanKondisiMesin: pick('kendaraanKondisiMesin'),
    kendaraanKondisiBodi: pick('kendaraanKondisiBodi'),

    dokumen: [],
    checklist: syncChecklist(jenis, (legacy.checklist as ChecklistMap) ?? {}),

    kota: pick('kota'),
    tanggalPenyerahan: toIsoDate(pick('tanggalPenyerahan', 'tanggal')),
    saksi1Nama: pick('saksi1Nama'),
    saksi1Jabatan: pick('saksi1Jabatan'),
    saksi2Nama: pick('saksi2Nama'),
    saksi2Jabatan: pick('saksi2Jabatan'),
    catatanKhusus: pick('catatanKhusus'),
  };

  // Lampiran lama (attachments: {url}) dipindah sebagai kategori "lainnya"
  const legacyAttachments = Array.isArray(legacy.attachments) ? (legacy.attachments as Array<Record<string, unknown>>) : [];
  const migratedDocs = legacyAttachments
    .filter((att) => typeof att?.url === 'string')
    .map((att, idx) => ({
      id: `legacy-${idx + 1}`,
      kategori: 'lainnya' as DocCategoryId,
      label: `Dokumen lama ${idx + 1}`,
      fileName: `dokumen-lama-${idx + 1}.jpg`,
      url: String(att.url),
      size: 0,
      width: Number(att.width) || 600,
      height: Number(att.height) || 400,
    }));
  next.dokumen = [...(Array.isArray(legacy.dokumen) ? (legacy.dokumen as DocData['dokumen']) : []), ...migratedDocs];

  return next;
}

/** Normalisasi data dari storage: tambahkan field baru & buang field asing */
export function normalizeStored(raw: unknown): DocData {
  if (!raw || typeof raw !== 'object') return DEFAULT_DATA;
  const legacy = raw as Partial<BastDataLegacy> & Record<string, unknown>;
  const isLegacy = !('namaDebitur' in legacy) || !('dokumen' in legacy);
  if (isLegacy) return migrateLegacy(legacy);

  const merged: DocData = { ...EMPTY_DATA, ...DEFAULT_DATA, ...(legacy as Partial<DocData>) };
  merged.jenis = merged.jenis === 'roda4' ? 'roda4' : 'roda2';
  merged.checklist = syncChecklist(merged.jenis, merged.checklist ?? {});
  merged.dokumen = Array.isArray(merged.dokumen)
    ? merged.dokumen.filter((doc) => doc && typeof doc.url === 'string' && !!doc.url)
    : [];

  // Jaga format tanggal tetap ISO (antisipasi data manual / impor lain)
  merged.tanggalSurat = toIsoDate(merged.tanggalSurat);
  merged.masaBerlakuMulai = toIsoDate(merged.masaBerlakuMulai);
  merged.masaBerlakuSampai = toIsoDate(merged.masaBerlakuSampai);
  merged.jatuhTempo = toIsoDate(merged.jatuhTempo);
  merged.tanggalPenyerahan = toIsoDate(merged.tanggalPenyerahan);
  merged.dokumen = merged.dokumen.map((doc) => ({
    ...doc,
    kategori: DOC_CATEGORY_MAP[doc.kategori] ? doc.kategori : 'lainnya',
  }));
  return merged;
}
