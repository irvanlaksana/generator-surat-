import React, { useState, useEffect } from 'react';
import { fetchFirebaseData, FirebaseApprovalDoc } from '../services/firebaseService';
import { LetterData, BastData } from '../types';
import { Database, RefreshCw, Check, ArrowRight, UserCheck, FileCheck, Search, ShieldCheck } from 'lucide-react';

interface FirebaseSyncBarProps {
  onApplyToLetter?: (data: Partial<LetterData>) => void;
  onApplyToBast?: (data: Partial<BastData>) => void;
  currentDocType: 'surat_tugas' | 'bast';
}

export default function FirebaseSyncBar({
  onApplyToLetter,
  onApplyToBast,
  currentDocType,
}: FirebaseSyncBarProps) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<FirebaseApprovalDoc[]>([]);
  const [employees, setEmployees] = useState<FirebaseApprovalDoc[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    setStatusMsg('Menghubungkan ke Firestore...');
    try {
      const res = await fetchFirebaseData();
      const combined = [...res.approvals, ...res.contracts];
      
      // Deduplicate by ID
      const uniqueItems: FirebaseApprovalDoc[] = [];
      const seen = new Set<string>();
      for (const item of combined) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          uniqueItems.push(item);
        }
      }

      setItems(uniqueItems);
      setEmployees(res.employees);
      setStatusMsg(`Tersinkron: ${uniqueItems.length} data approval/kontrak, ${res.employees.length} data petugas.`);
    } catch (err: any) {
      console.error('Error fetching Firestore data:', err);
      setStatusMsg('Gagal memuat data dari database: ' + (err?.message || 'Error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelect = (item: FirebaseApprovalDoc) => {
    setSelectedId(item.id);

    // Extract debtor info
    const debiturNama =
      item.customerName ||
      item.namaNasabah ||
      item.namaDebitur ||
      item.namaKonsumen ||
      item.debiturNama ||
      item.name ||
      '';

    const debiturNik = item.customerNik || item.nik || item.ktp || item.noKtp || '';
    const debiturAlamat = item.customerAddress || item.alamat || item.alamatDebitur || item.alamatNasabah || '';
    const debiturHp = item.customerPhone || item.telepon || item.noHp || item.hp || '';
    const nomorKontrak = item.contractNumber || item.nomorKontrak || item.contractNo || item.noKontrak || item.id || '';
    const krediturLeasing = item.creditorName || item.krediturLeasing || item.leasing || item.finco || 'PT. MITRA JASA TAMA';

    // Petugas info
    const petugasNama =
      item.assigneeName ||
      item.petugasNama ||
      item.collectorName ||
      item.namaPetugas ||
      item.karyawanNama ||
      '';
    const petugasNik = item.assigneeId || item.petugasNik || item.idPetugas || item.nikKaryawan || '';

    // Supervisor / Pemberi tugas
    const pemberiTugas =
      item.assignerName || item.namaPemberiTugas || item.supervisorName || item.direkturName || '';
    const jabatanPemberi =
      item.assignerPosition || item.jabatanPemberiTugas || 'Branch Manager / Supervisor';

    // Vehicle info
    const kendaraanMerk = item.vehicleBrand || item.kendaraanMerk || item.merk || '';
    const kendaraanType = item.vehicleType || item.kendaraanType || item.tipe || item.model || '';
    const kendaraanTahun = String(item.vehicleYear || item.kendaraanTahun || item.tahun || '');
    const kendaraanWarna = item.vehicleColor || item.kendaraanWarna || item.warna || '';
    const kendaraanNoPol = item.vehiclePoliceNo || item.kendaraanNoPol || item.nopol || item.platNomor || '';
    const kendaraanNoRangka = item.vehicleChassisNo || item.kendaraanNoRangka || item.noRangka || item.vin || '';
    const kendaraanNoMesin = item.vehicleEngineNo || item.kendaraanNoMesin || item.noMesin || '';
    const kendaraanOdometer = item.vehicleOdometer || item.kendaraanOdometer || item.odometer || '';
    const kendaraanBahanBakar = item.kendaraanBahanBakar || item.fuel || '1/2 Tangki';
    const kendaraanStnk = item.vehicleStnk || item.kendaraanStnk || 'Ada';
    const kendaraanBpkb = item.vehicleBpkbNo || item.kendaraanBpkb || 'Dalam Jaminan';

    // Overdue / Tagihan
    const totalTunggakan =
      item.totalOverdue ||
      item.customerTotalOverdue ||
      item.totalTunggakan ||
      item.tunggakan ||
      'Rp 0';
    const jatuhTempo = item.dueDate || item.customerDueDate || item.jatuhTempo || '';
    const angsuran =
      item.installmentAmount || item.customerInstallment || item.angsuran || 'Rp 0';
    const denda = item.penaltyAmount || item.customerPenalty || item.denda || 'Rp 0';

    const jenisKendaraan =
      item.jenisKendaraan ||
      (item.vehicleBrand?.toLowerCase().includes('honda beat') ||
      item.vehicleBrand?.toLowerCase().includes('yamaha') ||
      item.vehicleType?.toLowerCase().includes('vario') ||
      item.vehicleType?.toLowerCase().includes('nmax') ||
      item.vehicleType?.toLowerCase().includes('scoopy')
        ? 'roda2'
        : 'roda4');

    // 1. If currently in Surat Tugas
    if (onApplyToLetter) {
      const letterUpdate: Partial<LetterData> = {};
      if (debiturNama) letterUpdate.customerName = debiturNama;
      if (debiturAlamat) letterUpdate.customerAddress = debiturAlamat;
      if (nomorKontrak) letterUpdate.customerContract = nomorKontrak;
      if (kendaraanMerk) {
        letterUpdate.vehicleBrand = kendaraanType
          ? `${kendaraanMerk} / ${kendaraanType}`
          : kendaraanMerk;
      }
      if (kendaraanNoPol) letterUpdate.vehiclePlate = kendaraanNoPol;
      if (petugasNama) letterUpdate.assigneeName = petugasNama;
      if (petugasNik) letterUpdate.assigneeNIK = petugasNik;
      if (pemberiTugas) letterUpdate.assignerName = pemberiTugas;
      if (jabatanPemberi) letterUpdate.assignerPosition = jabatanPemberi;
      if (krediturLeasing) letterUpdate.clientName = krediturLeasing;
      if (jatuhTempo) letterUpdate.customerDueDate = jatuhTempo;
      if (angsuran) letterUpdate.customerInstallment = angsuran;
      if (denda) letterUpdate.customerPenalty = denda;

      onApplyToLetter(letterUpdate);
    }

    // 2. If in BAST
    if (onApplyToBast) {
      const bastUpdate: Partial<BastData> = {};
      if (nomorKontrak) bastUpdate.nomorKontrak = nomorKontrak;
      if (debiturNama) bastUpdate.debiturNama = debiturNama;
      if (debiturNik) bastUpdate.debiturNik = debiturNik;
      if (debiturAlamat) bastUpdate.debiturAlamat = debiturAlamat;
      if (debiturHp) bastUpdate.debiturHp = debiturHp;
      if (petugasNama) bastUpdate.petugasNama = petugasNama;
      if (petugasNik) bastUpdate.petugasNik = petugasNik;
      if (krediturLeasing) bastUpdate.krediturLeasing = krediturLeasing;
      if (kendaraanMerk) bastUpdate.kendaraanMerk = kendaraanMerk;
      if (kendaraanType) bastUpdate.kendaraanType = kendaraanType;
      if (kendaraanTahun) bastUpdate.kendaraanTahun = kendaraanTahun;
      if (kendaraanWarna) bastUpdate.kendaraanWarna = kendaraanWarna;
      if (kendaraanNoPol) bastUpdate.kendaraanNoPol = kendaraanNoPol;
      if (kendaraanNoRangka) bastUpdate.kendaraanNoRangka = kendaraanNoRangka;
      if (kendaraanNoMesin) bastUpdate.kendaraanNoMesin = kendaraanNoMesin;
      if (kendaraanOdometer) bastUpdate.kendaraanOdometer = kendaraanOdometer;
      if (kendaraanBahanBakar) bastUpdate.kendaraanBahanBakar = kendaraanBahanBakar;
      if (kendaraanStnk) bastUpdate.kendaraanStnk = kendaraanStnk;
      if (kendaraanBpkb) bastUpdate.kendaraanBpkb = kendaraanBpkb;
      bastUpdate.jenis = jenisKendaraan;

      onApplyToBast(bastUpdate);
    }

    setIsOpen(false);
  };

  const filteredItems = items.filter((item) => {
    const q = searchTerm.toLowerCase();
    const name = (
      item.customerName ||
      item.namaNasabah ||
      item.namaDebitur ||
      item.debiturNama ||
      item.name ||
      ''
    ).toLowerCase();
    const contract = (
      item.contractNumber ||
      item.nomorKontrak ||
      item.contractNo ||
      item.id ||
      ''
    ).toLowerCase();
    const nopol = (item.vehiclePoliceNo || item.kendaraanNoPol || item.nopol || '').toLowerCase();
    const officer = (item.assigneeName || item.petugasNama || item.collectorName || '').toLowerCase();
    return name.includes(q) || contract.includes(q) || nopol.includes(q) || officer.includes(q);
  });

  return (
    <div className="bg-[#5A5A40]/10 border-b border-[#5A5A40]/20 px-4 py-2 print:hidden">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#5A5A40] text-white rounded-md shadow-xs">
            <Database size={15} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                Database Firestore Terhubung
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </span>
              <span className="text-[10px] text-slate-500 bg-white/80 border border-slate-200 px-1.5 py-0.5 rounded font-mono">
                {items.length} Data Tersedia
              </span>
            </div>
            <p className="text-[10.5px] text-slate-600 truncate max-w-[400px]">
              {statusMsg || 'Pilih data nasabah/approval untuk mengisi formulir otomatis'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium transition cursor-pointer disabled:opacity-60 shadow-xs"
            title="Refresh Data dari Firestore"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-[#5A5A40]' : ''} />
            <span className="hidden sm:inline">Refresh Data</span>
          </button>

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#5A5A40] text-white hover:bg-[#484833] rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <FileCheck size={14} />
            Pilih Data Otomatis
          </button>
        </div>
      </div>

      {/* Modal Dialog for selecting item from Firestore */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#5A5A40] text-white rounded-xl">
                  <Database size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Pilih Data Nasabah / Approval dari Firestore
                  </h3>
                  <p className="text-xs text-slate-500">
                    Data debitur, kendaraan, dan karyawan akan langsung terisi ke template{' '}
                    <span className="font-semibold text-[#5A5A40]">
                      {currentDocType === 'surat_tugas' ? 'Surat Tugas' : 'BAST'}
                    </span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="absolute left-3.5 top-2.5 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama nasabah, nomor kontrak (APP-CTR-...), plat nomor, atau petugas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5A5A40] focus:bg-white transition"
                  autoFocus
                />
              </div>
            </div>

            {/* Items List */}
            <div className="p-4 overflow-y-auto flex-1 space-y-2.5 custom-scrollbar bg-slate-50/50">
              {filteredItems.length === 0 ? (
                <div className="text-center py-12 px-4 bg-white rounded-xl border border-slate-200">
                  <Database className="mx-auto text-slate-300 mb-2" size={36} />
                  <p className="text-xs font-semibold text-slate-700">Tidak ada data yang cocok</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {searchTerm
                      ? `Tidak ditemukan hasil untuk "${searchTerm}".`
                      : 'Koleksi approvals/contracts masih kosong atau belum ada dokumen.'}
                  </p>
                </div>
              ) : (
                filteredItems.map((item) => {
                  const customerName =
                    item.customerName ||
                    item.namaNasabah ||
                    item.namaDebitur ||
                    item.namaKonsumen ||
                    item.debiturNama ||
                    item.name ||
                    'Nama Tidak Diketahui';

                  const contractNo =
                    item.contractNumber ||
                    item.nomorKontrak ||
                    item.contractNo ||
                    item.noKontrak ||
                    item.id;

                  const vehicleInfo =
                    [
                      item.vehicleBrand || item.kendaraanMerk || item.merk,
                      item.vehicleType || item.kendaraanType || item.tipe,
                      item.vehiclePoliceNo || item.kendaraanNoPol || item.nopol,
                    ]
                      .filter(Boolean)
                      .join(' - ') || 'Data kendaraan belum terisi';

                  const officerName =
                    item.assigneeName ||
                    item.petugasNama ||
                    item.collectorName ||
                    item.namaPetugas ||
                    item.karyawanNama ||
                    '-';

                  const overdue =
                    item.totalOverdue ||
                    item.customerTotalOverdue ||
                    item.totalTunggakan ||
                    item.tunggakan ||
                    '';

                  const isSelected = selectedId === item.id;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-[#5A5A40] ring-2 ring-[#5A5A40]/20 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 uppercase">
                            {customerName}
                          </span>
                          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {contractNo}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            🚗 {vehicleInfo}
                          </span>
                          <span className="flex items-center gap-1 text-slate-500">
                            👤 Petugas: <strong className="text-slate-700">{officerName}</strong>
                          </span>
                          {overdue && (
                            <span className="text-rose-600 font-semibold">
                              Tunggakan: {overdue}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          className="px-3 py-1.5 bg-[#5A5A40] hover:bg-[#484833] text-white text-xs font-bold rounded-lg transition flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          Terapkan <ArrowRight size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Data disinkronkan secara real-time dari Firestore Database.
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
