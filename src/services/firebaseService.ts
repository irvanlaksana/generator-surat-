import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../firebase';

export interface EmployeeDoc {
  id: string;
  nama: string;
  nik: string;
  jabatan: string;
  hp?: string;
  cabang?: string;
  perusahaan?: string;
  [key: string]: any;
}

export interface DebtorDoc {
  id: string;
  multifinance: string; // e.g. "Koperasi Anugrah Mega Mandiri (KAMM)", "WOM Finance", "OTO Multiartha", "BAF", "FIF", "Adira", etc.
  nomorKontrak: string;
  namaNasabah: string;
  nik?: string;
  alamat: string;
  hp?: string;
  jatuhTempo: string;
  angsuran: string;
  denda: string;
  unpaidCount?: string;
  
  // Kendaraan
  kendaraanMerk: string;
  kendaraanType: string;
  kendaraanNoPol: string;
  kendaraanNoRangka?: string;
  kendaraanNoMesin?: string;
  kendaraanTahun?: string;
  kendaraanWarna?: string;
  kendaraanOdometer?: string;
  kendaraanStnk?: string;
  kendaraanBpkb?: string;
  kendaraanBahanBakar?: string;
  jenisKendaraan?: 'roda2' | 'roda4';

  // Petugas terkait (jika ada)
  petugasNama?: string;
  petugasNik?: string;
  petugasJabatan?: string;

  [key: string]: any;
}

export interface FirebaseApprovalDoc extends DebtorDoc {
  customerName?: string;
  customerContract?: string;
  customerAddress?: string;
  customerDueDate?: string;
  customerInstallment?: string;
  customerPenalty?: string;
  vehicleBrand?: string;
  vehiclePlate?: string;
  assigneeName?: string;
  assigneeNIK?: string;
  assigneePosition?: string;
  clientName?: string;
}

// Data Karyawan Default (sebagai acuan & fallback jika Firestore masih kosong)
export const DEFAULT_EMPLOYEES: EmployeeDoc[] = [
  {
    id: 'emp-01',
    nama: 'RIZKY JUANDA SAPUTRA',
    nik: '3302242201940001',
    jabatan: 'Petugas Penagihan / Koordinator',
    hp: '081234567890',
    cabang: 'Purwokerto / Banyumas',
    perusahaan: 'PT. MITRA JASATRIA INDONESIA'
  },
  {
    id: 'emp-02',
    nama: 'FILEMO HALAWA',
    nik: '3302241905890002',
    jabatan: 'Direktur Operasional',
    hp: '081398765432',
    cabang: 'Kantor Pusat',
    perusahaan: 'PT. MITRA JASATRIA INDONESIA'
  },
  {
    id: 'emp-03',
    nama: 'AGUS PRASETYO',
    nik: '3302241508920003',
    jabatan: 'Staff Eksekusi Lapangan',
    hp: '085712349876',
    cabang: 'Purwokerto',
    perusahaan: 'PT. MITRA JASATRIA INDONESIA'
  },
  {
    id: 'emp-04',
    nama: 'BAMBANG HERMANTO',
    nik: '3302240811900004',
    jabatan: 'Petugas Remedial & Litigasi',
    hp: '082134567812',
    cabang: 'Cilacap - Banyumas',
    perusahaan: 'PT. MITRA JASATRIA INDONESIA'
  },
  {
    id: 'emp-05',
    nama: 'DEDDY KURNIAWAN',
    nik: '3302240103950005',
    jabatan: 'Field Collector Officer',
    hp: '087812345678',
    cabang: 'Purbalingga',
    perusahaan: 'PT. MITRA JASATRIA INDONESIA'
  }
];

// Data Debitur Semua Multifinance Default (sebagai acuan & fallback jika Firestore masih kosong)
export const DEFAULT_DEBTORS: DebtorDoc[] = [
  {
    id: 'deb-kamm-01',
    multifinance: 'Koperasi Anugrah Mega Mandiri (KAMM)',
    nomorKontrak: '00730191',
    namaNasabah: 'KISNO ANGKAH TRI HIDAYAT',
    nik: '3302141506880001',
    alamat: 'KALIKABONG RT 004 RW 002, KALIMANAH, PURBALINGGA',
    hp: '081298765432',
    jatuhTempo: '2 FEBRUARI 2024',
    angsuran: 'Rp. 385.000 (Angsuran ke 8 s/d 18)',
    denda: 'Rp. 41.692.000',
    unpaidCount: '10 Bulan',
    kendaraanMerk: 'YAMAHA',
    kendaraanType: 'VIXION 150',
    kendaraanNoPol: 'R 4088 YV',
    kendaraanNoRangka: 'MH33C1003EK129481',
    kendaraanNoMesin: '3C1-129481',
    kendaraanTahun: '2020',
    kendaraanWarna: 'Hitam Metalik',
    kendaraanOdometer: '24.500 KM',
    kendaraanStnk: 'Ada (Asli)',
    kendaraanBpkb: 'Dalam Jaminan KAMM',
    kendaraanBahanBakar: '1/2 Tangki',
    jenisKendaraan: 'roda2',
    petugasNama: 'RIZKY JUANDA SAPUTRA',
    petugasNik: '3302242201940001',
    petugasJabatan: 'Petugas Penagihan'
  },
  {
    id: 'deb-wom-01',
    multifinance: 'WOM Finance (PT. Wahana Ottomitra Multiartha)',
    nomorKontrak: 'WOM-2024-88912',
    namaNasabah: 'SUGIONO PRANOTO',
    nik: '3302100405820003',
    alamat: 'JL. GERILYA NO. 45 RT 02/05, PURWOKERTO SELATAN',
    hp: '081327112233',
    jatuhTempo: '15 MARET 2024',
    angsuran: 'Rp. 850.000 (Angsuran ke 12 s/d 24)',
    denda: 'Rp. 12.450.000',
    unpaidCount: '6 Bulan',
    kendaraanMerk: 'HONDA',
    kendaraanType: 'VARIO 160 CBS',
    kendaraanNoPol: 'R 5521 ZA',
    kendaraanNoRangka: 'MH1KF1118PK908123',
    kendaraanNoMesin: 'KF11E1908123',
    kendaraanTahun: '2022',
    kendaraanWarna: 'Merah Doff',
    kendaraanOdometer: '18.200 KM',
    kendaraanStnk: 'Ada',
    kendaraanBpkb: 'Dalam Jaminan WOM',
    kendaraanBahanBakar: 'Full',
    jenisKendaraan: 'roda2',
    petugasNama: 'AGUS PRASETYO',
    petugasNik: '3302241508920003',
    petugasJabatan: 'Staff Eksekusi Lapangan'
  },
  {
    id: 'deb-oto-01',
    multifinance: 'OTO Multiartha (PT. Oto Multiartha)',
    nomorKontrak: 'OTO-MOB-098231',
    namaNasabah: 'HENDRA WIJAYA KUSUMA',
    nik: '3302111208790002',
    alamat: 'PERUM GRIYA SATRIA BANTARSOKA BLOK C NO. 12, PURWOKERTO BARAT',
    hp: '082245678901',
    jatuhTempo: '10 JANUARI 2024',
    angsuran: 'Rp. 4.250.000 (Angsuran ke 15 s/d 36)',
    denda: 'Rp. 38.500.000',
    unpaidCount: '8 Bulan',
    kendaraanMerk: 'TOYOTA',
    kendaraanType: 'AVANZA 1.3 G M/T',
    kendaraanNoPol: 'R 1928 AB',
    kendaraanNoRangka: 'MHKM1BA3JMK019284',
    kendaraanNoMesin: '1NR-VE019284',
    kendaraanTahun: '2021',
    kendaraanWarna: 'Silver Metallic',
    kendaraanOdometer: '45.100 KM',
    kendaraanStnk: 'Ada (Pajak Hidup)',
    kendaraanBpkb: 'Dalam Jaminan OTO',
    kendaraanBahanBakar: '3/4 Tangki',
    jenisKendaraan: 'roda4',
    petugasNama: 'RIZKY JUANDA SAPUTRA',
    petugasNik: '3302242201940001',
    petugasJabatan: 'Petugas Penagihan'
  },
  {
    id: 'deb-baf-01',
    multifinance: 'BAF (PT. Bussan Auto Finance)',
    nomorKontrak: 'BAF-YMH-55102',
    namaNasabah: 'TRI WAHYUNI',
    nik: '3302084501930005',
    alamat: 'DESA SOKARAJA TENGAH RT 03 RW 01, SOKARAJA, BANYUMAS',
    hp: '085867123456',
    jatuhTempo: '25 FEBRUARI 2024',
    angsuran: 'Rp. 1.150.000 (Angsuran ke 6 s/d 18)',
    denda: 'Rp. 8.900.000',
    unpaidCount: '5 Bulan',
    kendaraanMerk: 'YAMAHA',
    kendaraanType: 'NMAX 155 ABS',
    kendaraanNoPol: 'R 3389 CR',
    kendaraanNoRangka: 'MH3SG5620NJ048192',
    kendaraanNoMesin: 'G3J4E048192',
    kendaraanTahun: '2022',
    kendaraanWarna: 'Maxi Signature Black',
    kendaraanOdometer: '14.800 KM',
    kendaraanStnk: 'Ada',
    kendaraanBpkb: 'Dalam Jaminan BAF',
    kendaraanBahanBakar: '1/2 Tangki',
    jenisKendaraan: 'roda2',
    petugasNama: 'DEDDY KURNIAWAN',
    petugasNik: '3302240103950005',
    petugasJabatan: 'Field Collector Officer'
  },
  {
    id: 'deb-kb-01',
    multifinance: 'KB Finansia / Kredit Plus',
    nomorKontrak: 'KP-2024-77192',
    namaNasabah: 'EKO PRASETYA UTOMO',
    nik: '3302061407850004',
    alamat: 'JL. RAYA SUMBANG NO. 88, BANYUMAS',
    hp: '081223344556',
    jatuhTempo: '5 APRIL 2024',
    angsuran: 'Rp. 720.000 (Angsuran ke 10 s/d 24)',
    denda: 'Rp. 6.400.000',
    unpaidCount: '4 Bulan',
    kendaraanMerk: 'HONDA',
    kendaraanType: 'BEAT STREET CBS',
    kendaraanNoPol: 'R 6721 YB',
    kendaraanNoRangka: 'MH1JM8113NK782194',
    kendaraanNoMesin: 'JM81E1782194',
    kendaraanTahun: '2023',
    kendaraanWarna: 'Street Black',
    kendaraanOdometer: '9.200 KM',
    kendaraanStnk: 'Ada',
    kendaraanBpkb: 'Dalam Jaminan Kredit Plus',
    kendaraanBahanBakar: 'Full',
    jenisKendaraan: 'roda2',
    petugasNama: 'BAMBANG HERMANTO',
    petugasNik: '3302240811900004',
    petugasJabatan: 'Petugas Remedial & Litigasi'
  },
  {
    id: 'deb-acc-01',
    multifinance: 'ACC (PT. Astra Sedaya Finance)',
    nomorKontrak: 'ACC-ASTRA-449102',
    namaNasabah: 'MUHAMMAD ARIS SETIAWAN',
    nik: '3302120909870001',
    alamat: 'JL. DR. SOEPARNO NO. 14, KARANGWANGKAL, PURWOKERTO UTARA',
    hp: '081399887766',
    jatuhTempo: '18 FEBRUARI 2024',
    angsuran: 'Rp. 3.800.000 (Angsuran ke 20 s/d 48)',
    denda: 'Rp. 29.700.000',
    unpaidCount: '7 Bulan',
    kendaraanMerk: 'DAIHATSU',
    kendaraanType: 'TERIOS R DELUXE A/T',
    kendaraanNoPol: 'R 8890 JK',
    kendaraanNoRangka: 'MHKF8100JMK092813',
    kendaraanNoMesin: '2NR-VE092813',
    kendaraanTahun: '2021',
    kendaraanWarna: 'Putih Solid',
    kendaraanOdometer: '38.000 KM',
    kendaraanStnk: 'Ada',
    kendaraanBpkb: 'Dalam Jaminan ACC',
    kendaraanBahanBakar: '1/2 Tangki',
    jenisKendaraan: 'roda4',
    petugasNama: 'FILEMO HALAWA',
    petugasNik: '3302241905890002',
    petugasJabatan: 'Direktur Operasional'
  }
];

// Fetch all collections with smart parsing
export async function fetchFirebaseData(): Promise<{
  approvals: FirebaseApprovalDoc[];
  contracts: FirebaseApprovalDoc[];
  employees: EmployeeDoc[];
  debtors: DebtorDoc[];
  multifinances: string[];
}> {
  const tryFetchCollection = async (collName: string): Promise<any[]> => {
    try {
      const collRef = collection(db, collName);
      const q = query(collRef, limit(100));
      const snap = await getDocs(q);
      const docs: any[] = [];
      snap.forEach((docSnap) => {
        docs.push({
          id: docSnap.id,
          ...docSnap.data(),
        });
      });
      return docs;
    } catch (err) {
      console.warn(`Firestore read warning on '${collName}':`, err);
      return [];
    }
  };

  // 1. Fetch Employee collections
  const [
    karyawanList,
    dataKaryawanList,
    employeesList,
    petugasList,
    usersList,
    staffList,
    collectorsList
  ] = await Promise.all([
    tryFetchCollection('karyawan'),
    tryFetchCollection('data_karyawan'),
    tryFetchCollection('employees'),
    tryFetchCollection('petugas'),
    tryFetchCollection('users'),
    tryFetchCollection('staff'),
    tryFetchCollection('collectors')
  ]);

  const rawEmployees = [
    ...karyawanList,
    ...dataKaryawanList,
    ...employeesList,
    ...petugasList,
    ...usersList,
    ...staffList,
    ...collectorsList
  ];

  // Parse employees into uniform structure
  const parsedEmployeesMap = new Map<string, EmployeeDoc>();

  rawEmployees.forEach((emp) => {
    const nama =
      emp.nama ||
      emp.namaKaryawan ||
      emp.name ||
      emp.fullName ||
      emp.employeeName ||
      emp.namaPetugas ||
      emp.petugasNama ||
      emp.assigneeName ||
      '';

    if (!nama) return;

    const nik =
      emp.nik ||
      emp.nikKaryawan ||
      emp.nikPetugas ||
      emp.idKaryawan ||
      emp.employeeId ||
      emp.ktp ||
      emp.noKtp ||
      emp.assigneeNIK ||
      '-';

    const jabatan =
      emp.jabatan ||
      emp.position ||
      emp.role ||
      emp.jabatanKaryawan ||
      emp.jabatanPetugas ||
      emp.assigneePosition ||
      'Petugas Penagihan';

    const hp = emp.hp || emp.noHp || emp.telepon || emp.phone || emp.kontak || '';
    const cabang = emp.cabang || emp.branch || emp.unit || 'Kantor Cabang';
    const perusahaan = emp.perusahaan || emp.company || 'PT. MITRA JASATRIA INDONESIA';

    const id = emp.id || `emp-${nama.toLowerCase().replace(/\s+/g, '-')}`;
    parsedEmployeesMap.set(nama.toLowerCase(), {
      id,
      nama,
      nik,
      jabatan,
      hp,
      cabang,
      perusahaan
    });
  });

  // If no employees in Firestore or combined is small, add default employees
  DEFAULT_EMPLOYEES.forEach((emp) => {
    if (!parsedEmployeesMap.has(emp.nama.toLowerCase())) {
      parsedEmployeesMap.set(emp.nama.toLowerCase(), emp);
    }
  });

  const parsedEmployees = Array.from(parsedEmployeesMap.values());

  // 2. Fetch Debtor & Multifinance Collections
  const [
    debtorsList,
    debiturList,
    dataDebiturList,
    nasabahList,
    dataNasabahList,
    contractsList,
    kontrakList,
    approvalsList,
    casesList,
    tagihanList,
    multifinanceDocs
  ] = await Promise.all([
    tryFetchCollection('debtors'),
    tryFetchCollection('debitur'),
    tryFetchCollection('data_debitur'),
    tryFetchCollection('nasabah'),
    tryFetchCollection('data_nasabah'),
    tryFetchCollection('contracts'),
    tryFetchCollection('kontrak'),
    tryFetchCollection('approvals'),
    tryFetchCollection('cases'),
    tryFetchCollection('tagihan'),
    tryFetchCollection('multifinance')
  ]);

  const rawDebtors = [
    ...debtorsList,
    ...debiturList,
    ...dataDebiturList,
    ...nasabahList,
    ...dataNasabahList,
    ...contractsList,
    ...kontrakList,
    ...approvalsList,
    ...casesList,
    ...tagihanList,
    ...multifinanceDocs
  ];

  const parsedDebtorsMap = new Map<string, DebtorDoc>();

  rawDebtors.forEach((item) => {
    const namaNasabah =
      item.namaNasabah ||
      item.customerName ||
      item.namaDebitur ||
      item.namaKonsumen ||
      item.debiturNama ||
      item.nama ||
      item.name ||
      '';

    const nomorKontrak =
      item.nomorKontrak ||
      item.customerContract ||
      item.contractNumber ||
      item.noKontrak ||
      item.contractNo ||
      item.noPerjanjian ||
      item.id ||
      '';

    if (!namaNasabah && !nomorKontrak) return;

    const multifinance =
      item.multifinance ||
      item.krediturLeasing ||
      item.creditorName ||
      item.clientName ||
      item.namaLeasing ||
      item.leasing ||
      item.finco ||
      item.kreditur ||
      item.perusahaan ||
      'Koperasi Anugrah Mega Mandiri (KAMM)';

    const alamat =
      item.alamat ||
      item.customerAddress ||
      item.alamatDebitur ||
      item.alamatNasabah ||
      item.address ||
      '';

    const nik = item.nik || item.customerNik || item.ktp || item.noKtp || item.debiturNik || '';
    const hp = item.hp || item.customerPhone || item.noHp || item.telepon || item.phone || item.debiturHp || '';
    const jatuhTempo = item.jatuhTempo || item.customerDueDate || item.dueDate || item.tglJatuhTempo || '-';
    const angsuran = item.angsuran || item.customerInstallment || item.installmentAmount || item.cicilan || '-';
    const denda = item.denda || item.customerPenalty || item.penaltyAmount || item.totalTunggakan || item.tunggakan || '-';
    const unpaidCount = item.unpaidCount || item.customerUnpaidInstallmentCount || item.jumlahBulan || '';

    const kendaraanMerk = item.kendaraanMerk || item.vehicleBrand || item.merk || '';
    const kendaraanType = item.kendaraanType || item.vehicleType || item.tipe || item.model || '';
    const kendaraanNoPol = item.kendaraanNoPol || item.vehiclePlate || item.vehiclePoliceNo || item.nopol || item.platNomor || '';
    const kendaraanNoRangka = item.kendaraanNoRangka || item.vehicleChassisNo || item.noRangka || item.vin || '';
    const kendaraanNoMesin = item.kendaraanNoMesin || item.vehicleEngineNo || item.noMesin || '';
    const kendaraanTahun = String(item.kendaraanTahun || item.vehicleYear || item.tahun || '');
    const kendaraanWarna = item.kendaraanWarna || item.vehicleColor || item.warna || '';
    const kendaraanOdometer = item.kendaraanOdometer || item.vehicleOdometer || item.odometer || '';
    const kendaraanStnk = item.kendaraanStnk || item.vehicleStnk || 'Ada';
    const kendaraanBpkb = item.kendaraanBpkb || item.vehicleBpkbNo || `Dalam Jaminan ${multifinance}`;
    const kendaraanBahanBakar = item.kendaraanBahanBakar || item.fuel || '1/2 Tangki';

    const isRoda2 =
      item.jenisKendaraan === 'roda2' ||
      kendaraanMerk.toLowerCase().includes('yamaha') ||
      kendaraanMerk.toLowerCase().includes('honda') ||
      kendaraanMerk.toLowerCase().includes('suzuki') ||
      kendaraanMerk.toLowerCase().includes('kawasaki') ||
      kendaraanType.toLowerCase().includes('vixion') ||
      kendaraanType.toLowerCase().includes('beat') ||
      kendaraanType.toLowerCase().includes('vario') ||
      kendaraanType.toLowerCase().includes('nmax') ||
      kendaraanType.toLowerCase().includes('scoopy');

    const jenisKendaraan: 'roda2' | 'roda4' = item.jenisKendaraan || (isRoda2 ? 'roda2' : 'roda4');

    const petugasNama = item.petugasNama || item.assigneeName || item.karyawanNama || item.namaPetugas || '';
    const petugasNik = item.petugasNik || item.assigneeNIK || item.nikPetugas || item.idPetugas || '';
    const petugasJabatan = item.petugasJabatan || item.assigneePosition || 'Petugas Penagihan';

    const key = (nomorKontrak || namaNasabah).toLowerCase();
    parsedDebtorsMap.set(key, {
      id: item.id || `deb-${key}`,
      multifinance,
      nomorKontrak,
      namaNasabah,
      nik,
      alamat,
      hp,
      jatuhTempo,
      angsuran,
      denda,
      unpaidCount,
      kendaraanMerk,
      kendaraanType,
      kendaraanNoPol,
      kendaraanNoRangka,
      kendaraanNoMesin,
      kendaraanTahun,
      kendaraanWarna,
      kendaraanOdometer,
      kendaraanStnk,
      kendaraanBpkb,
      kendaraanBahanBakar,
      jenisKendaraan,
      petugasNama,
      petugasNik,
      petugasJabatan
    });
  });

  // Ensure default debtors are included so users can test immediately
  DEFAULT_DEBTORS.forEach((deb) => {
    const key = (deb.nomorKontrak || deb.namaNasabah).toLowerCase();
    if (!parsedDebtorsMap.has(key)) {
      parsedDebtorsMap.set(key, deb);
    }
  });

  const parsedDebtors = Array.from(parsedDebtorsMap.values());

  // Extract unique Multifinance names
  const multifinanceSet = new Set<string>();
  parsedDebtors.forEach((d) => {
    if (d.multifinance) multifinanceSet.add(d.multifinance);
  });
  const multifinances = Array.from(multifinanceSet);

  // Approval compatibility list
  const approvalCompatibleDocs: FirebaseApprovalDoc[] = parsedDebtors.map((d) => ({
    ...d,
    customerName: d.namaNasabah,
    customerContract: d.nomorKontrak,
    customerAddress: d.alamat,
    customerDueDate: d.jatuhTempo,
    customerInstallment: d.angsuran,
    customerPenalty: d.denda,
    vehicleBrand: d.kendaraanType ? `${d.kendaraanMerk} / ${d.kendaraanType}` : d.kendaraanMerk,
    vehiclePlate: d.kendaraanNoPol,
    assigneeName: d.petugasNama || 'RIZKY JUANDA SAPUTRA',
    assigneeNIK: d.petugasNik || '3302242201940001',
    assigneePosition: d.petugasJabatan || 'Petugas Penagihan',
    clientName: d.multifinance
  }));

  return {
    approvals: approvalCompatibleDocs,
    contracts: approvalCompatibleDocs,
    employees: parsedEmployees,
    debtors: parsedDebtors,
    multifinances
  };
}
