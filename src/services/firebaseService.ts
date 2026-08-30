import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../firebase';

export interface FirebaseApprovalDoc {
  id: string;
  // Common fields in approval / contracts documents
  contractNumber?: string;
  nomorKontrak?: string;
  contractNo?: string;
  noKontrak?: string;
  
  customerName?: string;
  namaNasabah?: string;
  namaDebitur?: string;
  namaKonsumen?: string;
  debiturNama?: string;

  customerNik?: string;
  nik?: string;
  ktp?: string;
  noKtp?: string;

  customerAddress?: string;
  alamat?: string;
  alamatDebitur?: string;
  alamatNasabah?: string;

  customerPhone?: string;
  telepon?: string;
  noHp?: string;
  hp?: string;

  assigneeName?: string;
  petugasNama?: string;
  collectorName?: string;
  namaPetugas?: string;
  karyawanNama?: string;

  assigneeId?: string;
  petugasNik?: string;
  idPetugas?: string;
  nikKaryawan?: string;

  assignerName?: string;
  namaPemberiTugas?: string;
  supervisorName?: string;
  direkturName?: string;

  assignerPosition?: string;
  jabatanPemberiTugas?: string;

  companyName?: string;
  perusahaan?: string;
  namaPerusahaan?: string;
  cabang?: string;

  creditorName?: string;
  krediturLeasing?: string;
  leasing?: string;
  finco?: string;

  vehicleBrand?: string;
  kendaraanMerk?: string;
  merk?: string;

  vehicleType?: string;
  kendaraanType?: string;
  tipe?: string;
  model?: string;

  vehicleYear?: string;
  kendaraanTahun?: string;
  tahun?: string;

  vehicleColor?: string;
  kendaraanWarna?: string;
  warna?: string;

  vehiclePoliceNo?: string;
  kendaraanNoPol?: string;
  nopol?: string;
  platNomor?: string;

  vehicleChassisNo?: string;
  kendaraanNoRangka?: string;
  noRangka?: string;
  vin?: string;

  vehicleEngineNo?: string;
  kendaraanNoMesin?: string;
  noMesin?: string;

  vehicleBpkbNo?: string;
  kendaraanBpkb?: string;

  vehicleStnk?: string;
  kendaraanStnk?: string;

  vehicleOdometer?: string;
  kendaraanOdometer?: string;
  odometer?: string;

  totalOverdue?: string;
  customerTotalOverdue?: string;
  totalTunggakan?: string;
  tunggakan?: string;

  dueDate?: string;
  customerDueDate?: string;
  jatuhTempo?: string;

  installmentAmount?: string;
  customerInstallment?: string;
  angsuran?: string;

  penaltyAmount?: string;
  customerPenalty?: string;
  denda?: string;

  validFrom?: string;
  validTo?: string;
  masaBerlaku?: string;

  status?: string;
  type?: string;
  jenisKendaraan?: 'roda2' | 'roda4';
  createdAt?: any;
  updatedAt?: any;
  [key: string]: any;
}

// Fetch documents from specified collections or fallbacks
export async function fetchFirebaseData(): Promise<{
  approvals: FirebaseApprovalDoc[];
  contracts: FirebaseApprovalDoc[];
  employees: FirebaseApprovalDoc[];
}> {
  const result = {
    approvals: [] as FirebaseApprovalDoc[],
    contracts: [] as FirebaseApprovalDoc[],
    employees: [] as FirebaseApprovalDoc[],
  };

  const tryFetchCollection = async (collName: string): Promise<FirebaseApprovalDoc[]> => {
    try {
      const collRef = collection(db, collName);
      const q = query(collRef, limit(50));
      const snap = await getDocs(q);
      const docs: FirebaseApprovalDoc[] = [];
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

  // Check possible collections
  const [approvalsList, contractsList, debtorsList, employeesList, usersList] = await Promise.all([
    tryFetchCollection('approvals'),
    tryFetchCollection('contracts'),
    tryFetchCollection('debtors'),
    tryFetchCollection('employees'),
    tryFetchCollection('users'),
  ]);

  result.approvals = approvalsList;
  result.contracts = contractsList.length > 0 ? contractsList : debtorsList;
  result.employees = employeesList.length > 0 ? employeesList : usersList;

  return result;
}
