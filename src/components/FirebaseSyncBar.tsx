import React, { useState, useEffect } from 'react';
import { fetchFirebaseData, EmployeeDoc, DebtorDoc, FirebaseApprovalDoc } from '../services/firebaseService';
import { LetterData, BastData } from '../types';
import { 
  Database, 
  RefreshCw, 
  Check, 
  ArrowRight, 
  UserCheck, 
  FileCheck, 
  Search, 
  Building2, 
  Users, 
  FileText,
  Filter,
  Car,
  Bike
} from 'lucide-react';

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
  const [employees, setEmployees] = useState<EmployeeDoc[]>([]);
  const [debtors, setDebtors] = useState<DebtorDoc[]>([]);
  const [multifinances, setMultifinances] = useState<string[]>([]);
  
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'employees' | 'debtors' | 'all'>('debtors');
  const [selectedMultifinance, setSelectedMultifinance] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setStatusMsg('Menghubungkan ke Firestore...');
    try {
      const res = await fetchFirebaseData();
      setEmployees(res.employees);
      setDebtors(res.debtors);
      setMultifinances(res.multifinances);
      setStatusMsg(`Tersinkron: ${res.employees.length} data karyawan/petugas & ${res.debtors.length} data debitur dari ${res.multifinances.length} multifinance.`);
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

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Apply Employee data to Letter & BAST
  const applyEmployee = (emp: EmployeeDoc) => {
    if (onApplyToLetter) {
      onApplyToLetter({
        assigneeName: emp.nama,
        assigneeNIK: emp.nik,
        assigneePosition: emp.jabatan,
      });
    }

    if (onApplyToBast) {
      onApplyToBast({
        petugasNama: emp.nama,
        petugasNik: emp.nik,
        petugasJabatan: emp.jabatan,
        petugasHp: emp.hp || '',
      });
    }

    showNotification(`Data Petugas "${emp.nama}" berhasil diterapkan.`);
    setIsOpen(false);
  };

  // Apply Debtor & Multifinance data to Letter & BAST
  const applyDebtor = (deb: DebtorDoc) => {
    if (onApplyToLetter) {
      onApplyToLetter({
        clientName: deb.multifinance,
        customerContract: deb.nomorKontrak,
        customerName: deb.namaNasabah,
        customerAddress: deb.alamat,
        customerDueDate: deb.jatuhTempo,
        customerPenalty: deb.denda,
        customerInstallment: deb.angsuran,
        customerUnpaidInstallmentCount: deb.unpaidCount || '10 Bulan',
        vehicleBrand: deb.kendaraanType ? `${deb.kendaraanMerk} / ${deb.kendaraanType}` : deb.kendaraanMerk,
        vehiclePlate: deb.kendaraanNoPol,
      });
    }

    if (onApplyToBast) {
      onApplyToBast({
        krediturLeasing: deb.multifinance,
        nomorKontrak: deb.nomorKontrak,
        debiturNama: deb.namaNasabah,
        debiturNik: deb.nik || '',
        debiturAlamat: deb.alamat,
        debiturHp: deb.hp || '',
        kendaraanMerk: deb.kendaraanMerk,
        kendaraanType: deb.kendaraanType,
        kendaraanNoPol: deb.kendaraanNoPol,
        kendaraanNoRangka: deb.kendaraanNoRangka || '',
        kendaraanNoMesin: deb.kendaraanNoMesin || '',
        kendaraanTahun: deb.kendaraanTahun || '',
        kendaraanWarna: deb.kendaraanWarna || '',
        kendaraanOdometer: deb.kendaraanOdometer || '',
        kendaraanStnk: deb.kendaraanStnk || 'Ada',
        kendaraanBpkb: deb.kendaraanBpkb || `Dalam Jaminan ${deb.multifinance}`,
        kendaraanBahanBakar: deb.kendaraanBahanBakar || '1/2 Tangki',
        jenis: deb.jenisKendaraan || 'roda4',
      });
    }

    showNotification(`Data Debitur "${deb.namaNasabah}" (${deb.multifinance}) berhasil diterapkan.`);
    setIsOpen(false);
  };

  // Apply Both Debtor + Employee at once
  const applyAll = (deb: DebtorDoc) => {
    applyDebtor(deb);
    if (deb.petugasNama) {
      if (onApplyToLetter) {
        onApplyToLetter({
          assigneeName: deb.petugasNama,
          assigneeNIK: deb.petugasNik || '',
          assigneePosition: deb.petugasJabatan || 'Petugas Penagihan',
        });
      }
      if (onApplyToBast) {
        onApplyToBast({
          petugasNama: deb.petugasNama,
          petugasNik: deb.petugasNik || '',
          petugasJabatan: deb.petugasJabatan || 'Petugas Penagihan',
        });
      }
    }
  };

  // Filter debtors
  const filteredDebtors = debtors.filter((deb) => {
    const q = searchTerm.toLowerCase();
    const matchesQuery =
      deb.namaNasabah.toLowerCase().includes(q) ||
      deb.nomorKontrak.toLowerCase().includes(q) ||
      deb.kendaraanNoPol.toLowerCase().includes(q) ||
      deb.kendaraanMerk.toLowerCase().includes(q) ||
      deb.alamat.toLowerCase().includes(q);

    const matchesMultifinance =
      selectedMultifinance === 'all' || deb.multifinance === selectedMultifinance;

    return matchesQuery && matchesMultifinance;
  });

  // Filter employees
  const filteredEmployees = employees.filter((emp) => {
    const q = searchTerm.toLowerCase();
    return (
      emp.nama.toLowerCase().includes(q) ||
      emp.nik.toLowerCase().includes(q) ||
      emp.jabatan.toLowerCase().includes(q) ||
      (emp.cabang && emp.cabang.toLowerCase().includes(q))
    );
  });

  return (
    <div className="bg-[#5A5A40]/10 border-b border-[#5A5A40]/20 px-4 py-2 print:hidden relative">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <Check size={16} />
          {successToast}
        </div>
      )}

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
              <span className="text-[10px] text-slate-600 bg-white/80 border border-slate-200 px-1.5 py-0.5 rounded font-medium">
                {employees.length} Karyawan | {debtors.length} Debitur ({multifinances.length} Multifinance)
              </span>
            </div>
            <p className="text-[10.5px] text-slate-600 truncate max-w-[450px]">
              {statusMsg || 'Tarik data karyawan atau data nasabah dari semua multifinance'}
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
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Tombol Pilih Karyawan */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('employees');
              setIsOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Users size={14} className="text-[#5A5A40]" />
            <span>Tarik Karyawan ({employees.length})</span>
          </button>

          {/* Tombol Pilih Debitur Semua Multifinance */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('debtors');
              setIsOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#5A5A40] text-white hover:bg-[#484833] rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Building2 size={14} />
            <span>Tarik Debitur ({debtors.length})</span>
          </button>
        </div>
      </div>

      {/* Modal Dialog for selecting Data from Firestore */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#5A5A40] text-white rounded-xl">
                  <Database size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Pusat Sinkronisasi Data Firestore
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tarik data karyawan ke penerima tugas atau data nasabah dari semua multifinance
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            {/* Sub Header / Tabs Selector */}
            <div className="px-5 py-2.5 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('debtors')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activeTab === 'debtors'
                      ? 'bg-[#5A5A40] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Building2 size={13} />
                  Debitur Multifinance ({debtors.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('employees')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activeTab === 'employees'
                      ? 'bg-[#5A5A40] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Users size={13} />
                  Data Karyawan / Petugas ({employees.length})
                </button>
              </div>

              {/* Multifinance Dropdown Filter (only when on debtors tab) */}
              {activeTab === 'debtors' && (
                <div className="flex items-center gap-1.5">
                  <Filter size={13} className="text-slate-400" />
                  <select
                    value={selectedMultifinance}
                    onChange={(e) => setSelectedMultifinance(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]"
                  >
                    <option value="all">Semua Multifinance ({debtors.length})</option>
                    {multifinances.map((mf) => (
                      <option key={mf} value={mf}>
                        {mf}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Search Bar */}
            <div className="p-3.5 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="absolute left-3.5 top-2.5 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder={
                    activeTab === 'employees'
                      ? 'Cari nama karyawan, NIK, jabatan, atau cabang...'
                      : 'Cari nama nasabah, nomor kontrak, plat nomor, merk kendaraan, atau alamat...'
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5A5A40] focus:bg-white transition"
                  autoFocus
                />
              </div>
            </div>

            {/* Content List Area */}
            <div className="p-4 overflow-y-auto flex-1 space-y-2.5 custom-scrollbar bg-slate-50/50">
              {/* 1. DEBTORS TAB */}
              {activeTab === 'debtors' && (
                <>
                  {filteredDebtors.length === 0 ? (
                    <div className="text-center py-12 px-4 bg-white rounded-xl border border-slate-200">
                      <Building2 className="mx-auto text-slate-300 mb-2" size={36} />
                      <p className="text-xs font-semibold text-slate-700">Tidak ada data debitur yang cocok</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Coba ubah kata kunci pencarian atau pilih opsi "Semua Multifinance".
                      </p>
                    </div>
                  ) : (
                    filteredDebtors.map((deb) => (
                      <div
                        key={deb.id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-[#5A5A40]/60 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1.5 flex-1">
                          {/* Header Debitur Item */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-extrabold text-slate-900 uppercase">
                              {deb.namaNasabah}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {deb.multifinance}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              No. Kontrak: {deb.nomorKontrak}
                            </span>
                          </div>

                          {/* Info baris 1: Kendaraan & Plat */}
                          <div className="text-[11px] text-slate-700 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="flex items-center gap-1 font-semibold text-slate-800">
                              {deb.jenisKendaraan === 'roda2' ? <Bike size={14} className="text-slate-600" /> : <Car size={14} className="text-slate-600" />}
                              {deb.kendaraanMerk} {deb.kendaraanType} ({deb.kendaraanNoPol})
                            </span>
                            <span className="text-slate-500">
                              📍 {deb.alamat}
                            </span>
                          </div>

                          {/* Info baris 2: Tunggakan & Angsuran */}
                          <div className="text-[10.5px] text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                            <span className="text-rose-600 font-semibold">
                              Denda: {deb.denda}
                            </span>
                            <span>
                              Angsuran: <strong>{deb.angsuran}</strong>
                            </span>
                            <span>
                              Jatuh Tempo: <strong>{deb.jatuhTempo}</strong>
                            </span>
                            {deb.petugasNama && (
                              <span className="text-[#5A5A40] font-medium">
                                Petugas Terkait: {deb.petugasNama}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => applyDebtor(deb)}
                            className="px-3.5 py-2 bg-[#5A5A40] hover:bg-[#484833] text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                          >
                            Tarik Data Nasabah <ArrowRight size={13} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}

              {/* 2. EMPLOYEES TAB */}
              {activeTab === 'employees' && (
                <>
                  {filteredEmployees.length === 0 ? (
                    <div className="text-center py-12 px-4 bg-white rounded-xl border border-slate-200">
                      <Users className="mx-auto text-slate-300 mb-2" size={36} />
                      <p className="text-xs font-semibold text-slate-700">Tidak ada data karyawan yang cocok</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Coba ketik nama atau NIK petugas lainnya.
                      </p>
                    </div>
                  ) : (
                    filteredEmployees.map((emp) => (
                      <div
                        key={emp.id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-[#5A5A40]/60 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-extrabold text-slate-900 uppercase">
                              {emp.nama}
                            </span>
                            <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                              {emp.jabatan}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                            <span className="font-mono text-slate-700 font-medium">
                              NIK: <strong>{emp.nik}</strong>
                            </span>
                            {emp.hp && <span>📞 {emp.hp}</span>}
                            {emp.cabang && <span>🏢 {emp.cabang}</span>}
                            <span className="text-slate-500">{emp.perusahaan}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => applyEmployee(emp)}
                            className="px-3.5 py-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                          >
                            <UserCheck size={14} />
                            Terapkan Sebagai Penerima Tugas
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Pilih salah satu untuk langsung mengisi formulir Surat Tugas & BAST.
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
