import React, { useState } from 'react';
import LetterForm from './components/LetterForm';
import LetterPreview from './components/LetterPreview';
import BastGenerator from './components/BastGenerator';
import FirebaseSyncBar from './components/FirebaseSyncBar';
import GoogleDriveSaveModal from './components/GoogleDriveSaveModal';
import { LetterData, BastData } from './types';
import { FileText, ClipboardCheck, UploadCloud } from 'lucide-react';
import { generateLetterNumber } from './utils/letterNumber';
import { CONTOH_RODA4, syncChecklist } from './data/defaults';

type DocumentType = 'surat_tugas' | 'bast';

const initialData: LetterData = {
  kopImage: null,
  kopImageHeight: 120,
  kopImageFit: 'contain',
  kopImageAlign: 'center',
  kopImageOffsetY: 0,
  kopImageMarginBottom: 32,
  kopCompanyName: 'PT. MITRA JASATRIA INDONESIA',
  letterNumber: generateLetterNumber(),
  assignerName: 'FILEMO HALAWA',
  assignerPosition: 'DIREKTUR',
  assigneeName: 'RIZKY JUANDA SAPUTRA',
  assigneeNIK: '3302242201940001',
  assigneePosition: 'Petugas Penagihan',
  clientName: 'Koperasi Anugrah Mega Mandiri (KAMM)',
  customerContract: '00730191',
  customerName: 'KISNO ANGKAH TRI HIDAYAT',
  customerAddress: 'KALIKABONG RT 004 RW 002, KALIMANAH',
  customerDueDate: '2 FEBRUARI 2024',
  customerInstallment: 'Rp. 385.000 (Angsuran ke 8 s/d 18)',
  customerUnpaidInstallmentCount: '10 Bulan',
  customerPenalty: 'Rp. 41.692.000',
  attachments: [],
  vehicleBrand: 'YAMAHA / VIXION',
  vehiclePlate: 'R4088YV',
  validFrom: '21 Agustus 2026',
  validTo: '31 Agustus 2026',
  signPlaceDate: 'Purwokerto, 22 Agustus 2026'
};

export default function App() {
  const [docType, setDocType] = useState<DocumentType>('surat_tugas');
  const [data, setData] = useState<LetterData>(initialData);
  const [bastData, setBastData] = useState<BastData>(CONTOH_RODA4);
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);

  const handleApplyToLetter = (partial: Partial<LetterData>) => {
    setData((prev) => ({
      ...prev,
      ...partial,
    }));
  };

  const handleApplyToBast = (partial: Partial<BastData>) => {
    setBastData((prev) => {
      const nextJenis = partial.jenis || prev.jenis;
      return {
        ...prev,
        ...partial,
        jenis: nextJenis,
        checklist: partial.checklist || syncChecklist(nextJenis, prev.checklist),
      };
    });
  };

  const activeClientName = docType === 'surat_tugas' ? data.clientName : bastData.krediturLeasing;
  const activeDebtorName = docType === 'surat_tugas' ? data.customerName : bastData.debiturNama;
  const activeContractNo = docType === 'surat_tugas' ? data.customerContract : bastData.nomorKontrak;

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F0] font-sans text-[#4A4A4A]">
      <header className="bg-[#EBEBE4] border-b border-[#D1D1CA] px-4 md:px-6 py-3 flex flex-wrap items-center justify-between gap-3 print:hidden shadow-xs z-10">
        <div className="flex items-center gap-3">
          <div className="bg-[#5A5A40] p-2 rounded-lg text-white shadow-xs">
            {docType === 'surat_tugas' ? <FileText size={22} /> : <ClipboardCheck size={22} />}
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-[#2C2C24]">
              {docType === 'surat_tugas' ? 'Surat Tugas Penagihan' : 'BAST Kendaraan Bermotor'}
            </h1>
            <p className="text-xs text-[#8A8A7A]">
              {docType === 'surat_tugas'
                ? 'Sistem Pembuat Surat Tugas Eksekusi Penagihan'
                : 'Berita Acara Serah Terima & Surat Penyerahan Unit'}
            </p>
          </div>
        </div>

        {/* Right tools */}
        <div className="flex items-center gap-2">
          {/* Document Template Selector */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-[#D1D1CA] shadow-xs">
            <button
              type="button"
              id="tab-surat-tugas"
              onClick={() => setDocType('surat_tugas')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                docType === 'surat_tugas'
                  ? 'bg-[#5A5A40] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText size={14} />
              Surat Tugas
            </button>
            <button
              type="button"
              id="tab-bast"
              onClick={() => setDocType('bast')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                docType === 'bast'
                  ? 'bg-[#5A5A40] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ClipboardCheck size={14} />
              Template BAST
            </button>
          </div>

          {/* Tombol Simpan ke GDrive */}
          <button
            type="button"
            id="btn-simpan-ke-gdrive"
            onClick={() => setIsDriveModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
            title="Simpan Dokumen ke Google Drive Multi Finance"
          >
            <UploadCloud size={15} />
            <span className="hidden sm:inline">Simpan ke GDrive</span>
            <span className="sm:hidden">GDrive</span>
          </button>
        </div>
      </header>

      {/* Firebase Firestore Realtime Sync Bar */}
      <FirebaseSyncBar
        onApplyToLetter={handleApplyToLetter}
        onApplyToBast={handleApplyToBast}
        currentDocType={docType}
      />

      {/* Main Content Area */}
      {docType === 'bast' ? (
        <BastGenerator 
          externalData={bastData} 
          onDataChange={setBastData}
          onOpenDriveModal={() => setIsDriveModalOpen(true)}
        />
      ) : (
        <>
          {/* Mobile Tabs for Surat Tugas */}
          <div className="lg:hidden flex bg-[#EBEBE4] border-b border-[#D1D1CA] print:hidden">
            <button
              onClick={() => setActiveTab('form')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'form'
                  ? 'text-[#5A5A40] border-b-2 border-[#5A5A40] bg-white/50'
                  : 'text-[#8A8A7A] hover:text-[#4A4A4A]'
              }`}
            >
              Isi Data
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'preview'
                  ? 'text-[#5A5A40] border-b-2 border-[#5A5A40] bg-white/50'
                  : 'text-[#8A8A7A] hover:text-[#4A4A4A]'
              }`}
            >
              Pratinjau Surat
            </button>
          </div>

          <main className="flex-1 flex overflow-hidden">
            {/* Form Panel */}
            <div
              className={`w-full lg:w-[450px] xl:w-[500px] border-r border-[#D1D1CA] bg-[#EBEBE4] flex-col overflow-hidden ${
                activeTab === 'form' ? 'flex' : 'hidden lg:flex'
              } print:hidden`}
            >
              <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
                <LetterForm data={data} onChange={setData} />
              </div>
            </div>

            {/* Preview Panel */}
            <div
              className={`flex-1 flex-col overflow-hidden bg-[#FDFBF7] ${
                activeTab === 'preview' ? 'flex' : 'hidden lg:flex'
              } print:block print:bg-white`}
            >
              <LetterPreview 
                data={data}
                onOpenDriveModal={() => setIsDriveModalOpen(true)}
              />
            </div>
          </main>
        </>
      )}

      {/* Google Drive Save Modal */}
      <GoogleDriveSaveModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        currentDocType={docType}
        suggestedClientName={activeClientName}
        suggestedDebtorName={activeDebtorName}
        suggestedContractNo={activeContractNo}
      />
    </div>
  );
}
