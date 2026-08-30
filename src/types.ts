export interface AttachmentData {
  url: string;
  width: number;
  height: number;
}

export interface LetterData {
  kopImage: string | null;
  kopImageHeight: number;
  kopImageFit: 'contain' | 'fill' | 'cover';
  kopImageAlign: 'left' | 'center' | 'right';
  kopImageOffsetY: number;
  kopImageMarginBottom: number;
  kopCompanyName: string;
  letterNumber: string;
  assignerName: string;
  assignerPosition: string;
  assigneeName: string;
  assigneeNIK: string;
  assigneePosition: string;
  clientName: string;
  customerContract: string;
  customerName: string;
  customerAddress: string;
  customerDueDate: string;
  customerInstallment: string;
  customerPenalty: string;
  customerUnpaidInstallmentCount: string;
  attachments: AttachmentData[];
  vehicleBrand: string;
  vehiclePlate: string;
  validFrom: string;
  validTo: string;
  signPlaceDate: string;
}

export type VehicleType = 'roda2' | 'roda4';

export type ItemCondition = 'baik' | 'rusak' | 'tidak_ada';

export interface ChecklistItemValue {
  status: ItemCondition;
  catatan?: string;
}

export type ChecklistMap = Record<string, ChecklistItemValue>;

export interface BastData {
  jenis: VehicleType;
  nomorBast: string;
  nomorPenyerahan: string;
  perusahaan: string;
  cabang: string;
  alamat: string;
  telepon: string;
  
  // Data Petugas / Pihak Pertama (Penerima)
  petugasNama: string;
  petugasNik: string;
  petugasJabatan: string;
  petugasHp: string;

  // Data Debitur / Pihak Kedua (Pemberi / Yang Menyerahkan)
  debiturNama: string;
  debiturNik: string;
  debiturAlamat: string;
  debiturHp: string;
  nomorKontrak: string;
  krediturLeasing: string;

  // Data Kendaraan
  kendaraanMerk: string;
  kendaraanType: string;
  kendaraanTahun: string;
  kendaraanWarna: string;
  kendaraanNoPol: string;
  kendaraanNoRangka: string;
  kendaraanNoMesin: string;
  kendaraanBpkb: string;
  kendaraanStnk: string;
  kendaraanOdometer: string;
  kendaraanBahanBakar: string;
  kendaraanKondisiMesin: string;
  kendaraanKondisiBodi: string;

  // Checklist komponen
  checklist: ChecklistMap;

  // Lokasi & Tanggal
  kota: string;
  tanggal: string;

  // Saksi-Saksi
  saksi1Nama: string;
  saksi1Jabatan: string;
  saksi2Nama: string;
  saksi2Jabatan: string;

  // Catatan Tambahan
  catatanKhusus: string;
}

