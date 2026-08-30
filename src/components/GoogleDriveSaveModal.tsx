import React, { useState, useEffect } from 'react';
import { 
  FolderPlus, 
  Folder, 
  UploadCloud, 
  ExternalLink, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Building, 
  User, 
  FileText,
  Search,
  Plus
} from 'lucide-react';
import { 
  MULTI_FINANCE_ROOT_FOLDER_ID,
  listSubfolders,
  findOrCreateFolder,
  uploadPdfToDrive,
  DriveFolder,
  getAccessToken
} from '../services/googleDriveService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface GoogleDriveSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDocType: 'surat_tugas' | 'bast';
  suggestedClientName?: string;
  suggestedDebtorName?: string;
  suggestedContractNo?: string;
}

export default function GoogleDriveSaveModal({
  isOpen,
  onClose,
  currentDocType,
  suggestedClientName = '',
  suggestedDebtorName = '',
  suggestedContractNo = '',
}: GoogleDriveSaveModalProps) {
  // Navigation State
  const [step, setStep] = useState<'select_finance' | 'select_debtor' | 'confirm_upload'>('select_finance');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successLink, setSuccessLink] = useState<string | null>(null);

  // Multi Finance Folders
  const [financeFolders, setFinanceFolders] = useState<DriveFolder[]>([]);
  const [selectedFinance, setSelectedFinance] = useState<DriveFolder | null>(null);
  const [customFinanceName, setCustomFinanceName] = useState(suggestedClientName || '');

  // Debtor Folders
  const [debtorFolders, setDebtorFolders] = useState<DriveFolder[]>([]);
  const [selectedDebtor, setSelectedDebtor] = useState<DriveFolder | null>(null);
  const [customDebtorName, setCustomDebtorName] = useState(suggestedDebtorName || '');
  const [isCreatingDebtorFolder, setIsCreatingDebtorFolder] = useState(false);

  // Search filter
  const [searchFinance, setSearchFinance] = useState('');
  const [searchDebtor, setSearchDebtor] = useState('');

  // Filename preview
  const defaultFileName = `${
    currentDocType === 'surat_tugas' ? 'SURAT_TUGAS' : 'BAST'
  }_${(suggestedDebtorName || 'Debitur').trim().replace(/[^a-zA-Z0-9_-]/g, '_')}_${(suggestedContractNo || 'KONTRAK').trim().replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
  const [fileName, setFileName] = useState(defaultFileName);

  useEffect(() => {
    if (isOpen) {
      setSuccessLink(null);
      setErrorMsg('');
      setFileName(defaultFileName);
      setCustomFinanceName(suggestedClientName || '');
      setCustomDebtorName(suggestedDebtorName || '');
      loadMultiFinanceFolders();
    }
  }, [isOpen, suggestedClientName, suggestedDebtorName, suggestedContractNo, currentDocType]);

  // Load root folders inside Multi Finance directory (1y6uAMRHxV3CWu5mdYFnz95-zIMZhU9zk)
  const loadMultiFinanceFolders = async () => {
    setLoading(true);
    setErrorMsg('');
    setStatusMsg('Memuat daftar Multi Finance dari Google Drive...');
    try {
      const folders = await listSubfolders(MULTI_FINANCE_ROOT_FOLDER_ID);
      setFinanceFolders(folders);

      // Auto-match if suggestedClientName exists
      if (suggestedClientName && folders.length > 0) {
        const found = folders.find(
          (f) =>
            f.name.toLowerCase().includes(suggestedClientName.toLowerCase()) ||
            suggestedClientName.toLowerCase().includes(f.name.toLowerCase())
        );
        if (found) {
          setSelectedFinance(found);
        }
      }
      setStep('select_finance');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal memuat folder Google Drive. Pastikan izin akses telah disetujui.');
    } finally {
      setLoading(false);
      setStatusMsg('');
    }
  };

  // Load debtor folders inside chosen Finance folder
  const loadDebtorFolders = async (finance: DriveFolder) => {
    setSelectedFinance(finance);
    setLoading(true);
    setErrorMsg('');
    setStatusMsg(`Memuat daftar folder debitur di ${finance.name}...`);
    try {
      const folders = await listSubfolders(finance.id);
      setDebtorFolders(folders);

      // Check if suggested debtor matches
      if (suggestedDebtorName && folders.length > 0) {
        const found = folders.find(
          (f) =>
            f.name.toLowerCase().includes(suggestedDebtorName.toLowerCase()) ||
            suggestedDebtorName.toLowerCase().includes(f.name.toLowerCase())
        );
        if (found) {
          setSelectedDebtor(found);
        }
      }
      setStep('select_debtor');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal membuka folder multi finance.');
    } finally {
      setLoading(false);
      setStatusMsg('');
    }
  };

  // Handle create new Debtor folder
  const handleCreateDebtorFolder = async () => {
    if (!selectedFinance) return;
    const nameToCreate = customDebtorName.trim() || suggestedDebtorName.trim() || 'Debitur Baru';
    
    setLoading(true);
    setErrorMsg('');
    setStatusMsg(`Membuat folder "${nameToCreate}" di Google Drive...`);
    try {
      const newFolder = await findOrCreateFolder(selectedFinance.id, nameToCreate);
      setSelectedDebtor(newFolder);
      // add to list if not present
      if (!debtorFolders.some((f) => f.id === newFolder.id)) {
        setDebtorFolders([newFolder, ...debtorFolders]);
      }
      setIsCreatingDebtorFolder(false);
      setStep('confirm_upload');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal membuat folder debitur.');
    } finally {
      setLoading(false);
      setStatusMsg('');
    }
  };

  // Handle create new Multi Finance folder if needed
  const handleCreateFinanceFolder = async () => {
    const nameToCreate = customFinanceName.trim() || suggestedClientName.trim() || 'Multi Finance Baru';
    setLoading(true);
    setErrorMsg('');
    setStatusMsg(`Membuat folder finance "${nameToCreate}" di Google Drive...`);
    try {
      const newFolder = await findOrCreateFolder(MULTI_FINANCE_ROOT_FOLDER_ID, nameToCreate);
      setSelectedFinance(newFolder);
      if (!financeFolders.some((f) => f.id === newFolder.id)) {
        setFinanceFolders([newFolder, ...financeFolders]);
      }
      await loadDebtorFolders(newFolder);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal membuat folder Multi Finance.');
      setLoading(false);
    }
  };

  // Generate PDF Blob from current page
  const generatePdfBlob = async (): Promise<Blob> => {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    if (currentDocType === 'surat_tugas') {
      // Element surat tugas
      const el = document.getElementById('letter-preview-doc');
      if (!el) throw new Error('Dokumen Surat Tugas tidak ditemukan di halaman');

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
    } else {
      // Element BAST & Penyerahan
      const pages = ['surat-penyerahan-doc', 'bast-sheet-doc'];
      let added = 0;
      for (const pageId of pages) {
        const el = document.getElementById(pageId);
        if (el) {
          if (added > 0) pdf.addPage('a4', 'portrait');
          const canvas = await html2canvas(el, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
          });
          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
          added++;
        }
      }
      if (added === 0) throw new Error('Dokumen BAST tidak ditemukan di halaman');
    }

    return pdf.output('blob');
  };

  // Execute Upload
  const handleUpload = async () => {
    if (!selectedDebtor) {
      setErrorMsg('Silakan pilih atau buat folder debitur terlebih dahulu.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setStatusMsg('Merender PDF dan mengunggah ke Google Drive...');
    try {
      const blob = await generatePdfBlob();
      const finalName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
      const uploaded = await uploadPdfToDrive(selectedDebtor.id, finalName, blob);

      setSuccessLink(
        uploaded.webViewLink ||
          `https://drive.google.com/drive/folders/${selectedDebtor.id}`
      );
      setStatusMsg('File berhasil disimpan ke Google Drive!');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Terjadi kesalahan saat mengunggah file.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#5A5A40] text-white rounded-xl shadow-xs">
              <UploadCloud size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Simpan Dokumen ke Google Drive
              </h3>
              <p className="text-xs text-slate-500">
                Folder Multi Finance & Folder Debitur
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Breadcrumb Steps */}
        <div className="px-5 py-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setStep('select_finance')}
            className={`font-semibold flex items-center gap-1 ${
              step === 'select_finance'
                ? 'text-[#5A5A40]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building size={13} />
            {selectedFinance ? selectedFinance.name : 'Pilih Multi Finance'}
          </button>
          <ChevronRight size={12} className="text-slate-400" />
          <button
            type="button"
            onClick={() => selectedFinance && setStep('select_debtor')}
            disabled={!selectedFinance}
            className={`font-semibold flex items-center gap-1 ${
              step === 'select_debtor'
                ? 'text-[#5A5A40]'
                : selectedFinance
                ? 'text-slate-500 hover:text-slate-800'
                : 'text-slate-300'
            }`}
          >
            <User size={13} />
            {selectedDebtor ? selectedDebtor.name : 'Pilih Debitur'}
          </button>
          <ChevronRight size={12} className="text-slate-400" />
          <span
            className={`font-semibold flex items-center gap-1 ${
              step === 'confirm_upload' ? 'text-[#5A5A40]' : 'text-slate-300'
            }`}
          >
            <FileText size={13} />
            Simpan PDF
          </span>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
          {/* Error Alert */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle size={16} className="shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Gagal mengakses Google Drive</p>
                <p className="mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Success State */}
          {successLink && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 size={28} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-900">
                  Dokumen Berhasil Disimpan!
                </h4>
                <p className="text-xs text-emerald-700 mt-1">
                  File telah diunggah ke folder debitur <strong>{selectedDebtor?.name}</strong> di bawah <strong>{selectedFinance?.name}</strong>.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <a
                  href={successLink}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <ExternalLink size={14} />
                  Buka di Google Drive
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Selesai
                </button>
              </div>
            </div>
          )}

          {/* STEP 1: SELECT OR CREATE MULTI FINANCE FOLDER */}
          {!successLink && step === 'select_finance' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  1. Pilih Folder Multi Finance / Leasing:
                </label>
                <a
                  href={`https://drive.google.com/drive/folders/${MULTI_FINANCE_ROOT_FOLDER_ID}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-[#5A5A40] hover:underline flex items-center gap-1"
                >
                  Buka Folder Induk <ExternalLink size={11} />
                </a>
              </div>

              {/* Search Finance */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
                <input
                  type="text"
                  placeholder="Cari nama Multi Finance (cth: OTO, BAF, WOM, ACC, dll)..."
                  value={searchFinance}
                  onChange={(e) => setSearchFinance(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]"
                />
              </div>

              {/* List Multi Finance */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-slate-100 bg-white">
                {financeFolders
                  .filter((f) => f.name.toLowerCase().includes(searchFinance.toLowerCase()))
                  .map((folder) => {
                    const isSelected = selectedFinance?.id === folder.id;
                    return (
                      <div
                        key={folder.id}
                        onClick={() => loadDebtorFolders(folder)}
                        className={`p-3 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition ${
                          isSelected ? 'bg-[#5A5A40]/10 font-bold text-[#5A5A40]' : 'text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Folder size={16} className={isSelected ? 'text-[#5A5A40]' : 'text-amber-500'} />
                          <span className="text-xs">{folder.name}</span>
                        </div>
                        <button
                          type="button"
                          className="text-[11px] font-semibold text-[#5A5A40] hover:underline flex items-center gap-0.5"
                        >
                          Pilih <ChevronRight size={13} />
                        </button>
                      </div>
                    );
                  })}

                {financeFolders.length === 0 && !loading && (
                  <div className="p-4 text-center text-xs text-slate-400">
                    Belum ada folder di Google Drive induk.
                  </div>
                )}
              </div>

              {/* Add New Finance Folder */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-[11px] font-bold text-slate-700 block">
                  Tidak menemukan Multi Finance yang dicari?
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nama Multi Finance baru..."
                    value={customFinanceName}
                    onChange={(e) => setCustomFinanceName(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleCreateFinanceFolder}
                    disabled={!customFinanceName.trim() || loading}
                    className="px-3 py-1.5 bg-[#5A5A40] text-white rounded-lg text-xs font-bold hover:bg-[#484833] disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={14} /> Buat Folder
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SELECT OR CREATE DEBTOR FOLDER */}
          {!successLink && step === 'select_debtor' && selectedFinance && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-800">
                    2. Folder Debitur / Nasabah di <span className="text-[#5A5A40]">{selectedFinance.name}</span>:
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Pilih folder yang sudah ada atau buat folder baru untuk debitur ini.
                  </p>
                </div>
                <a
                  href={`https://drive.google.com/drive/folders/${selectedFinance.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-[#5A5A40] hover:underline flex items-center gap-1 shrink-0"
                >
                  Buka Folder <ExternalLink size={11} />
                </a>
              </div>

              {/* Search Debtor */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
                <input
                  type="text"
                  placeholder="Cari nama debitur di folder ini..."
                  value={searchDebtor}
                  onChange={(e) => setSearchDebtor(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]"
                />
              </div>

              {/* List Debtor Folders */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-slate-100 bg-white">
                {debtorFolders
                  .filter((f) => f.name.toLowerCase().includes(searchDebtor.toLowerCase()))
                  .map((folder) => {
                    const isSelected = selectedDebtor?.id === folder.id;
                    return (
                      <div
                        key={folder.id}
                        onClick={() => {
                          setSelectedDebtor(folder);
                          setStep('confirm_upload');
                        }}
                        className={`p-3 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition ${
                          isSelected ? 'bg-[#5A5A40]/10 font-bold text-[#5A5A40]' : 'text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Folder size={16} className={isSelected ? 'text-[#5A5A40]' : 'text-amber-500'} />
                          <span className="text-xs">{folder.name}</span>
                        </div>
                        <button
                          type="button"
                          className="text-[11px] font-semibold text-[#5A5A40] hover:underline flex items-center gap-0.5"
                        >
                          Pilih Folder <ChevronRight size={13} />
                        </button>
                      </div>
                    );
                  })}

                {debtorFolders.length === 0 && !loading && (
                  <div className="p-6 text-center text-xs text-slate-500 space-y-1">
                    <p className="font-semibold text-slate-700">Belum ada folder debitur di {selectedFinance.name}.</p>
                    <p className="text-[11px] text-slate-400">
                      Gunakan tombol <strong>"Tambah Folder Debitur"</strong> di bawah untuk membuat folder baru secara instan.
                    </p>
                  </div>
                )}
              </div>

              {/* CREATE DEBTOR FOLDER BUTTON / BOX */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FolderPlus size={15} className="text-[#5A5A40]" />
                    Tambah Folder Debitur Baru:
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Nama Debitur (cth: AHMAD FAUZI - 123456)..."
                    value={customDebtorName}
                    onChange={(e) => setCustomDebtorName(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={handleCreateDebtorFolder}
                    disabled={!customDebtorName.trim() || loading}
                    className="px-4 py-2 bg-[#5A5A40] text-white rounded-lg text-xs font-bold hover:bg-[#484833] disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus size={14} /> Buat & Pilih Folder
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: CONFIRM & UPLOAD */}
          {!successLink && step === 'confirm_upload' && selectedFinance && selectedDebtor && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">Multi Finance:</span>
                  <span className="font-bold text-slate-800">{selectedFinance.name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">Folder Debitur:</span>
                  <span className="font-bold text-slate-800">{selectedDebtor.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tipe Dokumen:</span>
                  <span className="font-semibold text-[#5A5A40]">
                    {currentDocType === 'surat_tugas' ? 'Surat Tugas Penagihan' : 'BAST & Surat Penyerahan'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama File PDF:
                </label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#5A5A40]"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                💡 File PDF beresolusi tinggi akan dibuat dari formulir aktif dan langsung diunggah ke Google Drive Anda secara otomatis.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            {loading && (
              <>
                <Loader2 size={15} className="animate-spin text-[#5A5A40]" />
                <span>{statusMsg || 'Memproses Google Drive...'}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step === 'select_debtor' && !successLink && (
              <button
                type="button"
                onClick={() => setStep('select_finance')}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                Kembali
              </button>
            )}

            {step === 'confirm_upload' && !successLink && (
              <button
                type="button"
                onClick={() => setStep('select_debtor')}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                Ganti Folder
              </button>
            )}

            {!successLink && step === 'confirm_upload' ? (
              <button
                type="button"
                onClick={handleUpload}
                disabled={loading}
                className="px-5 py-2 bg-[#5A5A40] hover:bg-[#484833] text-white text-xs font-bold rounded-lg transition shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                Unggah & Simpan ke Drive
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                {successLink ? 'Tutup' : 'Batal'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
