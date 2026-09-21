import React, { useState, useEffect } from 'react';
import LetterForm from './components/LetterForm';
import LetterPreview from './components/LetterPreview';
import BastGenerator from './components/BastGenerator';
import GoogleDriveSaveModal from './components/GoogleDriveSaveModal';
import PrintPreviewModal from './components/PrintPreviewModal';
import { LetterData, BastData, PaperSize, DEFAULT_PAPER_SIZE, PAPER_SIZES } from './types';
import { FileText, ClipboardCheck, UploadCloud, Printer, Eye } from 'lucide-react';
import { generateLetterNumber } from './utils/letterNumber';
import { getTodaySignPlaceDate } from './utils/dateFormatter';
import { CONTOH_RODA4, syncChecklist } from './data/defaults';
import { getSavedKopTemplate, saveKopTemplate, STORAGE_KEY_LETTER } from './utils/kopStorage';

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
  assigneeName: '',
  assigneePosition: 'Petugas Penagihan',
  clientName: 'Koperasi Anugrah Mega Mandiri (KAMM)',
  customerContract: '',
  customerName: '',
  customerAddress: '',
  customerAddressDetail: '',
  customerKabupaten: '',
  customerKecamatan: '',
  customerKelurahan: '',
  customerDueDate: '',
  customerInstallment: '',
  customerTotalInstallment: '',
  customerUnpaidInstallmentCount: '',
  customerPenalty: '',
  attachments: [],
  vehicleBrand: 'HONDA',
  vehicleBrandMake: 'HONDA',
  vehicleBrandModel: '',
  vehiclePlate: 'R-1234-XX',
  validFrom: '2026-08-21',
  validTo: '2026-08-31',
  signPlaceDate: getTodaySignPlaceDate('Purwokerto')
};

const STORAGE_KEY_BAST = 'bast-generator-v1';

function loadInitialLetter(): LetterData {
  let base: LetterData = { ...initialData };
  try {
    // 1. First overlay saved Kop Template (so user's preferred Kop image & position settings are guaranteed)
    const savedKop = getSavedKopTemplate();
    if (savedKop) {
      base = {
        ...base,
        kopImage: savedKop.kopImage !== undefined ? savedKop.kopImage : base.kopImage,
        kopImageHeight: savedKop.kopImageHeight !== undefined ? savedKop.kopImageHeight : base.kopImageHeight,
        kopImageFit: savedKop.kopImageFit !== undefined ? savedKop.kopImageFit : base.kopImageFit,
        kopImageAlign: savedKop.kopImageAlign !== undefined ? savedKop.kopImageAlign : base.kopImageAlign,
        kopImageOffsetY: savedKop.kopImageOffsetY !== undefined ? savedKop.kopImageOffsetY : base.kopImageOffsetY,
        kopImageOffsetX: savedKop.kopImageOffsetX !== undefined ? savedKop.kopImageOffsetX : base.kopImageOffsetX,
        kopImageMarginBottom: savedKop.kopImageMarginBottom !== undefined ? savedKop.kopImageMarginBottom : base.kopImageMarginBottom,
        kopCompanyName: savedKop.kopCompanyName !== undefined ? savedKop.kopCompanyName : base.kopCompanyName,
      };
    }

    // 2. Then overlay last active letter session if available
    const raw = localStorage.getItem(STORAGE_KEY_LETTER);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<LetterData>;
      base = {
        ...base,
        ...parsed,
      };
      // Keep saved kop if parsed has null/empty kopImage but template had one
      if (!base.kopImage && savedKop?.kopImage) {
        base.kopImage = savedKop.kopImage;
        base.kopImageHeight = savedKop.kopImageHeight ?? base.kopImageHeight;
        base.kopImageFit = savedKop.kopImageFit ?? base.kopImageFit;
        base.kopImageAlign = savedKop.kopImageAlign ?? base.kopImageAlign;
        base.kopImageOffsetY = savedKop.kopImageOffsetY ?? base.kopImageOffsetY;
        base.kopImageOffsetX = savedKop.kopImageOffsetX ?? base.kopImageOffsetX;
        base.kopImageMarginBottom = savedKop.kopImageMarginBottom ?? base.kopImageMarginBottom;
      }
    }
  } catch (err) {
    console.error('Failed to load letter from localStorage:', err);
  }
  return base;
}

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
  const [data, setData] = useState<LetterData>(() => loadInitialLetter());
  const [bastData, setBastData] = useState<BastData>(() => loadInitialBast());
  const [paperSize, setPaperSize] = useState<PaperSize>(DEFAULT_PAPER_SIZE);
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);

  // Debounced auto-save for LetterData and Kop Template
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY_LETTER, JSON.stringify(data));
        // Auto-save kop settings as template whenever kopImage or positioning is configured
        if (data.kopImage) {
          saveKopTemplate(data);
        }
      } catch (err) {
        console.error('Failed to save letter to localStorage:', err);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [data]);

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
      <header id="app-main-header" className="bg-[#EBEBE4] border-b border-[#D1D1CA] px-3 md:px-5 py-2 flex flex-wrap items-center justify-between gap-2.5 print:hidden shadow-xs z-10 shrink-0">
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
      <div id="app-main-layout" className="flex-1 flex flex-col overflow-hidden min-h-0">
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
      </div>

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

