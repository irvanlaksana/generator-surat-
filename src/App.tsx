import React, { useState } from 'react';
import LetterForm from './components/LetterForm';
import LetterPreview from './components/LetterPreview';
import BastGenerator from './components/BastGenerator';
import GoogleDriveSaveModal from './components/GoogleDriveSaveModal';
import PrintPreviewModal from './components/PrintPreviewModal';
import { LetterData, BastData, PaperSize, DEFAULT_PAPER_SIZE, PAPER_SIZES } from './types';
import { FileText, ClipboardCheck, UploadCloud, Printer, Eye } from 'lucide-react';
import { generateLetterNumber } from './utils/letterNumber';
import { CONTOH_RODA4, syncChecklist } from './data/defaults';

type DocumentType = 'surat_tugas' | 'bast';

const initialData: LetterData = {
  kopImage: null,
  kopImageHeight: 120,
  kopImageFit: 'contain',
  kopImageAlign: 'center',
  kopImageOffsetY: 0,
  kopImageOffsetX: 0,
  kopImageMarginBottom: 32,
  kopCompanyName: 'PT. MITRA JASATRIA INDONESIA',
  letterNumber: generateLetterNumber(),
  assignerName: 'FILEMO HALAWA',
  assignerPosition: 'DIREKTUR',
  assigneeName: 'RIZKY JUANDA SAPUTRA',
  assigneePosition: 'Petugas Penagihan',
  clientName: 'Koperasi Anugrah Mega Mandiri (KAMM)',
  customerContract: '00730191',
  customerName: 'KISNO ANGKAH TRI HIDAYAT',
  customerAddress: 'KALIKABONG RT 004 RW 002, KALIMANAH',
  customerDueDate: '2024-02-02',
  customerInstallment: 'Rp 385.000',
  customerTotalInstallment: 'Rp 4.235.000',
  customerUnpaidInstallmentCount: '10 Bulan',
  customerPenalty: 'Rp 41.692.000',
  attachments: [],
  vehicleBrand: 'YAMAHA / VIXION',
  vehiclePlate: 'R4088YV',
  validFrom: '2026-08-21',
  validTo: '2026-08-31',
  signPlaceDate: 'Purwokerto, 22 Agustus 2026'
};

const STORAGE_KEY_BAST = 'bast-generator-v1';

function loadInitialBast(): BastData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BAST);
    if (raw) {
      const parsed = JSON.parse(raw) as BastData;
      return {
        ...CONTOH_RODA4,
        ...parsed,
        checklist: syncChecklist(parsed.jenis ?? 'roda4', parsed.checklist ?? {}),
      };
    }
  } catch {
    /* ignore */
  }
  return CONTOH_RODA4;
}

export default function App() {
  const [docType, setDocType] = useState<DocumentType>('surat_tugas');
  const [data, setData] = useState<LetterData>(initialData);
  const [bastData, setBastData] = useState<BastData>(() => loadInitialBast());
  const [paperSize, setPaperSize] = useState<PaperSize>(DEFAULT_PAPER_SIZE);
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);

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
    <div className="h-screen max-h-screen flex flex-col bg-[#F5F5F0] font-sans text-[#4A4A4A] overflow-hidden">
      <header className="bg-[#EBEBE4] border-b border-[#D1D1CA] px-3 md:px-5 py-2 flex flex-wrap items-center justify-between gap-2.5 print:hidden shadow-xs z-10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="bg-[#5A5A40] p-1.5 rounded-lg text-white shadow-xs">
            {docType === 'surat_tugas' ? <FileText size={19} /> : <ClipboardCheck size={19} />}
          </div>
          <div>
            <h1 className="text-base md:text-lg font-bold tracking-tight text-[#2C2C24] leading-tight">
              {docType === 'surat_tugas' ? 'Surat Tugas Penagihan' : 'BAST Kendaraan Bermotor'}
            </h1>
            <p className="text-[11px] text-[#8A8A7A] leading-tight">
              {docType === 'surat_tugas'
                ? 'Sistem Pembuat Surat Tugas Eksekusi Penagihan'
                : 'Berita Acara Serah Terima & Surat Penyerahan Unit'}
            </p>
          </div>
        </div>

        {/* Right tools */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Document Template Selector */}
          <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-[#D1D1CA] shadow-2xs">
            <button
              type="button"
              id="tab-surat-tugas"
              onClick={() => setDocType('surat_tugas')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                docType === 'surat_tugas'
                  ? 'bg-[#5A5A40] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText size={13} />
              Surat Tugas
            </button>
            <button
              type="button"
              id="tab-bast"
              onClick={() => setDocType('bast')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                docType === 'bast'
                  ? 'bg-[#5A5A40] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ClipboardCheck size={13} />
              Template BAST
            </button>
          </div>

          {/* Paper Size Selector in Header */}
          <div className="hidden sm:flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-[#D1D1CA] shadow-2xs">
            <span className="text-xs font-bold text-slate-700">Kertas:</span>
            <select
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value as PaperSize)}
              className="text-xs font-bold text-[#5A5A40] bg-transparent focus:outline-none cursor-pointer"
            >
              {(Object.keys(PAPER_SIZES) as PaperSize[]).map((key) => (
                <option key={key} value={key}>
                  {PAPER_SIZES[key].name} ({PAPER_SIZES[key].widthMm}×{PAPER_SIZES[key].heightMm}mm)
                </option>
              ))}
            </select>
          </div>

          {/* Tombol Pratinjau Cetak */}
          <button
            type="button"
            id="btn-header-print-preview"
            onClick={() => setIsPrintPreviewOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-[#D1D1CA] rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95"
            title="Buka Pratinjau Cetak & Ukuran Kertas"
          >
            <Printer size={14} className="text-[#5A5A40]" />
            <span className="hidden sm:inline">Pratinjau Cetak</span>
            <span className="sm:hidden">Cetak</span>
          </button>

          {/* Tombol Simpan ke GDrive */}
          <button
            type="button"
            id="btn-simpan-ke-gdrive"
            onClick={() => setIsDriveModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2D6A4F] hover:bg-[#1B4332] text-white rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95"
            title="Simpan Dokumen ke Google Drive Multi Finance"
          >
            <UploadCloud size={14} />
            <span className="hidden sm:inline">Simpan ke GDrive</span>
            <span className="sm:hidden">GDrive</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      {docType === 'bast' ? (
        <BastGenerator 
          data={bastData} 
          onChange={setBastData}
          paperSize={paperSize}
          onPaperSizeChange={setPaperSize}
          onOpenPrintPreview={() => setIsPrintPreviewOpen(true)}
          onOpenDriveModal={() => setIsDriveModalOpen(true)}
        />
      ) : (
        <>
          {/* Mobile Tabs for Surat Tugas */}
          <div className="lg:hidden flex bg-[#EBEBE4] border-b border-[#D1D1CA] print:hidden shrink-0">
            <button
              onClick={() => setActiveTab('form')}
              className={`flex-1 py-2.5 text-xs font-bold transition-colors ${
                activeTab === 'form'
                  ? 'text-[#5A5A40] border-b-2 border-[#5A5A40] bg-white/50'
                  : 'text-[#8A8A7A] hover:text-[#4A4A4A]'
              }`}
            >
              Isi Data
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex-1 py-2.5 text-xs font-bold transition-colors ${
                activeTab === 'preview'
                  ? 'text-[#5A5A40] border-b-2 border-[#5A5A40] bg-white/50'
                  : 'text-[#8A8A7A] hover:text-[#4A4A4A]'
              }`}
            >
              Pratinjau Surat
            </button>
          </div>

          <main className="flex-1 flex overflow-hidden min-h-0">
            {/* Form Panel */}
            <div
              className={`w-full lg:w-[350px] xl:w-[380px] shrink-0 border-r border-[#D1D1CA] bg-[#EBEBE4] flex-col overflow-hidden ${
                activeTab === 'form' ? 'flex' : 'hidden lg:flex'
              } print:hidden`}
            >
              <div className="flex-1 overflow-y-auto p-2.5 md:p-3 custom-scrollbar">
                <LetterForm data={data} onChange={setData} />
              </div>
            </div>

            {/* Preview Panel */}
            <div
              className={`flex-1 flex-col overflow-hidden bg-[#FDFBF7] min-h-0 ${
                activeTab === 'preview' ? 'flex' : 'hidden lg:flex'
              } print:block print:bg-white`}
            >
              <LetterPreview 
                data={data}
                paperSize={paperSize}
                onPaperSizeChange={setPaperSize}
                onOpenPrintPreview={() => setIsPrintPreviewOpen(true)}
                onOpenDriveModal={() => setIsDriveModalOpen(true)}
              />
            </div>
          </main>
        </>
      )}

      {/* Full-Featured Print Preview Modal */}
      <PrintPreviewModal
        isOpen={isPrintPreviewOpen}
        onClose={() => setIsPrintPreviewOpen(false)}
        docType={docType}
        letterData={data}
        bastData={bastData}
        paperSize={paperSize}
        onPaperSizeChange={setPaperSize}
        onOpenDriveModal={() => setIsDriveModalOpen(true)}
      />

      {/* Google Drive Save Modal */}
      <GoogleDriveSaveModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        currentDocType={docType}
        paperSize={paperSize}
        suggestedClientName={activeClientName}
        suggestedDebtorName={activeDebtorName}
        suggestedContractNo={activeContractNo}
      />
    </div>
  );
}

