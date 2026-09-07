/**
 * Model data tunggal (satu urutan formulir) untuk seluruh dokumen:
 * Surat Tugas, Surat Penyerahan, BAST, dan Lampiran berkas.
 * Tidak ada pemisahan form antar jenis dokumen.
 */

export type VehicleType = 'roda2' | 'roda4';

export type ItemCondition = 'baik' | 'rusak' | 'tidak_ada';

export interface ChecklistItemValue {
  status: ItemCondition;
  catatan?: string;
}

export type ChecklistMap = Record<string, ChecklistItemValue>;

/** Kategori berkas yang diunggah (KTP, STNK, BPKB, foto unit, lainnya) */
export type DocCategoryId = 'ktp' | 'stnk' | 'bpkb' | 'unit' | 'lainnya';

export interface UploadedDoc {
  id: string;
  kategori: DocCategoryId;
  label: string;
  fileName: string;
  url: string;
  size: number;
  width: number;
  height: number;
}

export type KopFit = 'contain' | 'fill' | 'cover';
export type KopAlign = 'left' | 'center' | 'right';

/** Halaman yang bisa diekspor / ditampilkan (satu rangkaian dokumen) */
export type PageKey = 'surat_tugas' | 'penyerahan' | 'bast' | 'lampiran';

export interface DocData {
  /* 1. Perusahaan & Kop Surat */
  namaPerusahaan: string;
  cabang: string;
  alamatPerusahaan: string;
  teleponPerusahaan: string;
  kopImage: string | null;
  kopImageHeight: number;
  kopImageFit: KopFit;
  kopImageAlign: KopAlign;
  kopOffsetY: number;
  kopMarginBottom: number;

  /* 2. Kreditur (multifinance / leasing) */
  namaKreditur: string;
  inisialKreditur: string;

  /* 3. Debitur / Nasabah */
  namaDebitur: string;
  nikDebitur: string;
  alamatDebitur: string;
  kecamatan: string;
  kabupaten: string;
  hpDebitur: string;
  nomorKontrak: string;

  /* 4. Nomor surat & tanggal */
  nomorSuratTugas: string;
  nomorBast: string;
  nomorPenyerahan: string;
  tanggalSurat: string; // ISO yyyy-mm-dd
  masaBerlakuMulai: string; // ISO yyyy-mm-dd
  masaBerlakuSampai: string; // ISO yyyy-mm-dd
  tempatTanggalTtd: string;

  /* 5. Angsuran & tunggakan */
  nomorAngsuran: string;
  nilaiAngsuran: string;
  jatuhTempo: string; // ISO yyyy-mm-dd
  totalTunggakan: string;
  denda: string;
  keteranganAngsuran: string;

  /* 6. Petugas lapangan */
  namaPemberiTugas: string;
  jabatanPemberiTugas: string;
  namaPetugas: string;
  nikPetugas: string;
  jabatanPetugas: string;
  hpPetugas: string;

  /* 7. Kendaraan */
  jenis: VehicleType;
  kendaraanMerk: string;
  kendaraanType: string;
  kendaraanTahun: string;
  kendaraanWarna: string;
  kendaraanNoPol: string;
  kendaraanNoRangka: string;
  kendaraanNoMesin: string;
  kendaraanOdometer: string;
  kendaraanBahanBakar: string;
  kendaraanStnk: string;
  kendaraanBpkb: string;
  kendaraanKondisiMesin: string;
  kendaraanKondisiBodi: string;

  /* 8. Berkas pendukung (KTP, STNK, BPKB, unit, lainnya) */
  dokumen: UploadedDoc[];

  /* 9. Checklist kondisi unit */
  checklist: ChecklistMap;

  /* 10. Tempat, tanggal, saksi & catatan */
  kota: string;
  tanggalPenyerahan: string; // ISO yyyy-mm-dd
  saksi1Nama: string;
  saksi1Jabatan: string;
  saksi2Nama: string;
  saksi2Jabatan: string;
  catatanKhusus: string;
}

export type DocDataKey = keyof DocData;

/** Kunci field bertipe string / number, agar setter form tetap type-safe */
export type StringDataKey = { [K in keyof DocData]-?: DocData[K] extends string ? K : never }[keyof DocData];
export type NumberDataKey = { [K in keyof DocData]-?: DocData[K] extends number ? K : never }[keyof DocData];

/** Konfigurasi kategori berkas pendukung pada form unggah */
export interface DocCategoryConfig {
  id: DocCategoryId;
  label: string;
  hint: string;
  icon: string;
  maxFiles: number;
  required: boolean;
}

/** Bentuk data lama (sebelum form digabung) untuk keperluan migrasi */
export type BastDataLegacy = Record<string, unknown>;

/** Hasil validasi satu field */
export type IssueLevel = 'error' | 'warning';

export interface ValidationIssue {
  field: string;
  label: string;
  message: string;
  level: IssueLevel;
}
