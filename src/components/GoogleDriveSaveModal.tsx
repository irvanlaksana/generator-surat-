import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronRight,
  CircleAlert,
  ExternalLink,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react';
import type { DocData, PageKey } from '../types';
import type { FieldIssue } from '../utils/validation';
import {
  findOrCreateFolder,
  listSubfolders,
  uploadPdfToDrive,
  SKP_ROOT_FOLDER_ID,
  type DriveFolder,
} from '../services/googleDriveService';
import { buildPdfBlob } from '../utils/pdf';
import { buildPdfBaseName } from '../utils/filename';
import { normalizeText } from '../utils/format';
import { PAGE_ORDER, PAGE_SPECS } from '../utils/pdf';
import { cx } from './ui';

interface GoogleDriveSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: DocData;
  pages: PageKey[];
  fileName: string;
  errors: FieldIssue[];
  forceExport: boolean;
}

const FILENAME_PATTERN = /^[A-Z0-9]+-[A-Z0-9_]+(-[A-Z0-9_]+)?(-[A-Z0-9_]+)?\.pdf$/;

function ensurePdfExtension(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return /\.pdf$/i.test(trimmed) ? trimmed.toUpperCase().replace(/\.PDF$/, '.pdf') : `${trimmed}.pdf`;
}

export default function GoogleDriveSaveModal({
  isOpen,
  onClose,
  data,
  pages,
  fileName,
  errors,
  forceExport,
}: GoogleDriveSaveModalProps) {
  const [step, setStep] = useState<'select_folder' | 'confirm_upload'>('select_folder');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successLink, setSuccessLink] = useState<string | null>(null);
  const [uploadedName, setUploadedName] = useState('');

  const [folderPath, setFolderPath] = useState<DriveFolder[]>([{ id: SKP_ROOT_FOLDER_ID, name: 'SKP' }]);
  const [subFolders, setSubFolders] = useState<DriveFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<DriveFolder | null>(null);
  const [customFolderName, setCustomFolderName] = useState('');
  const [searchFolder, setSearchFolder] = useState('');
  const [editFileName, setEditFileName] = useState(fileName);

  const currentFolder = folderPath[folderPath.length - 1] ?? { id: SKP_ROOT_FOLDER_ID, name: 'SKP' };
  const standardName = useMemo(() => ensurePdfExtension(buildPdfBaseName(data)), [data]);
  const finalName = ensurePdfExtension(normalizeText(editFileName) || standardName);
  const nameLooksNonStandard = Boolean(finalName) && !FILENAME_PATTERN.test(finalName);
  const blocked = errors.length > 0 && !forceExport;

  const wasOpen = useRef(false);
  useEffect(() => {
    if (!isOpen) {
      wasOpen.current = false;
      return;
    }
    if (wasOpen.current) return; // sudah terbuka, jangan muat ulang tiap ketikan
    wasOpen.current = true;
    setSuccessLink(null);
    setErrorMsg('');
    setStep('select_folder');
    setEditFileName(fileName);
    setCustomFolderName(buildPdfBaseName(data));
    setFolderPath([{ id: SKP_ROOT_FOLDER_ID, name: 'SKP' }]);
    void loadFolderContents({ id: SKP_ROOT_FOLDER_ID, name: 'SKP' });
  }, [isOpen, fileName, data]);

  const loadFolderContents = useCallback(async (folder: DriveFolder) => {
    setLoading(true);
    setErrorMsg('');
    setStatusMsg(`Membuka folder "${folder.name}"...`);
    try {
      const folders = await listSubfolders(folder.id);
      setSubFolders(folders);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal memuat folder Google Drive.';
      setErrorMsg(`${message} Pastikan izin akses Google Drive sudah disetujui.`);
      setSubFolders([]);
    } finally {
      setLoading(false);
      setStatusMsg('');
    }
  }, []);

  const handleOpenSubfolder = (folder: DriveFolder) => {
    setFolderPath((prev) => [...prev, folder]);
    setSearchFolder('');
    void loadFolderContents(folder);
  };

  const handleNavigateUp = () => {
    if (folderPath.length <= 1) return;
    const next = folderPath.slice(0, -1);
    setFolderPath(next);
    setSearchFolder('');
    void loadFolderContents(next[next.length - 1]);
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === folderPath.length - 1) return;
    const next = folderPath.slice(0, index + 1);
    setFolderPath(next);
    setSearchFolder('');
    void loadFolderContents(next[next.length - 1]);
  };

  const handleSelectFolder = (folder: DriveFolder) => {
    setSelectedFolder(folder);
    setStep('confirm_upload');
  };

  const handleCreateFolder = async (autoOpen: boolean) => {
    const name = normalizeText(customFolderName) || buildPdfBaseName(data) || 'Folder Baru';
    setLoading(true);
    setErrorMsg('');
    setStatusMsg(`Membuat folder "${name}" di dalam ${currentFolder.name}...`);
    try {
      const created = await findOrCreateFolder(currentFolder.id, name);
      setSubFolders((prev) => (prev.some((f) => f.id === created.id) ? prev : [created, ...prev]));
      setCustomFolderName('');
      if (autoOpen) handleOpenSubfolder(created);
      else handleSelectFolder(created);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal membuat folder baru di Google Drive.');
    } finally {
      setLoading(false);
      setStatusMsg('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFolder) {
      setErrorMsg('Pilih atau buat folder tujuan terlebih dahulu.');
      return;
    }
    if (!finalName) {
      setErrorMsg('Nama file tidak boleh kosong.');
      return;
    }
    if (blocked) {
      setErrorMsg(`${errors.length} data wajib belum benar. Perbaiki pada form atau centang “Paksa simpan”.`);
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setStatusMsg('Merender PDF dan mengunggah ke Google Drive...');
    try {
      const { blob, result } = await buildPdfBlob(pages);
      const uploaded = await uploadPdfToDrive(selectedFolder.id, finalName, blob);
      setUploadedName(finalName);
      setSuccessLink(uploaded.webViewLink ?? `https://drive.google.com/drive/folders/${selectedFolder.id}`);
      if (result.skippedPages.length) {
        setStatusMsg(
          `Terkirim. Beberapa halaman dilewati: ${result.skippedPages.map((k) => PAGE_SPECS[k].shortLabel).join(', ')}.`,
        );
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan saat mengunggah file ke Google Drive.');
    } finally {
      setLoading(false);
    }
  };

  const filteredFolders = useMemo(
    () => subFolders.filter((f) => f.name.toLowerCase().includes(searchFolder.trim().toLowerCase())),
    [subFolders, searchFolder],
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-[2px] sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="rounded-xl bg-[#5A5A40] p-2 text-white shadow-xs">
              <UploadCloud size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-slate-900">Simpan Dokumen ke Google Drive</h3>
              <p className="truncate text-[11px] text-slate-500">
                {pages.length} halaman · file <span className="font-mono">{finalName || '(nama belum valid)'}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200/60 hover:text-slate-700"
            title="Tutup"
          >
            ✕
          </button>
        </div>

        {/* Langkah */}
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-100/70 px-4 py-2 text-[11px]">
          <button
            type="button"
            onClick={() => setStep('select_folder')}
            className={cx('flex cursor-pointer items-center gap-1.5 font-bold transition', step === 'select_folder' ? 'text-[#5A5A40]' : 'text-slate-500 hover:text-slate-800')}
          >
            <FolderOpen size={13} />
            1. Pilih / Buat Folder
          </button>
          <ChevronRight size={12} className="text-slate-400" />
          <span className={cx('flex items-center gap-1.5 font-bold', step === 'confirm_upload' ? 'text-[#5A5A40]' : 'text-slate-400')}>
            <FileText size={13} />
            2. Konfirmasi &amp; Unggah
          </span>
        </div>

        <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto p-4">
          {errorMsg && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-[11px] text-rose-700">
              <AlertCircle size={15} className="mt-0.5 shrink-0 text-rose-600" />
              <div>
                <p className="font-bold">Google Drive menolak proses</p>
                <p className="mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {blocked && !errorMsg && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-[11px] text-rose-700">
              <CircleAlert size={15} className="mt-0.5 shrink-0 text-rose-600" />
              <div>
                <p className="font-bold">Formulir masih memiliki {errors.length} data wajib yang belum benar</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4">
                  {errors.slice(0, 4).map((issue, idx) => (
                    <li key={`drive-err-${idx}`}>
                      <span className="font-bold">{issue.label}:</span> {issue.message}
                    </li>
                  ))}
                  {errors.length > 4 && <li>…dan {errors.length - 4} lainnya.</li>}
                </ul>
              </div>
            </div>
          )}

          {successLink ? (
            <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <ShieldCheck size={26} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-900">Dokumen berhasil disimpan</h4>
                <p className="mt-1 text-xs text-emerald-800">
                  File <span className="font-mono font-bold">{uploadedName}</span> ada di folder{' '}
                  <strong>{selectedFolder?.name}</strong>.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-1">
                <a
                  href={successLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  <ExternalLink size={14} />
                  Buka di Google Drive
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Selesai
                </button>
              </div>
            </div>
          ) : step === 'select_folder' ? (
            <>
              {/* Breadcrumb */}
              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 overflow-x-auto py-0.5 text-[11px] font-medium text-slate-700">
                    {folderPath.length > 1 && (
                      <button
                        type="button"
                        onClick={handleNavigateUp}
                        disabled={loading}
                        className="mr-1 flex cursor-pointer items-center gap-1 rounded px-1 py-0.5 text-[10.5px] font-bold text-slate-600 transition hover:bg-slate-200 disabled:opacity-50"
                        title="Kembali satu level"
                      >
                        <ArrowLeft size={12} />
                        Kembali
                      </button>
                    )}
                    {folderPath.map((item, idx) => {
                      const isLast = idx === folderPath.length - 1;
                      return (
                        <React.Fragment key={`${item.id}-${idx}`}>
                          {idx > 0 && <ChevronRight size={11} className="shrink-0 text-slate-400" />}
                          <button
                            type="button"
                            onClick={() => handleBreadcrumbClick(idx)}
                            disabled={isLast || loading}
                            className={cx(
                              'flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 transition',
                              isLast ? 'border border-slate-200 bg-white font-bold text-[#5A5A40]' : 'cursor-pointer text-slate-600 hover:bg-slate-200/70',
                            )}
                          >
                            <Folder size={11} className={isLast ? 'text-[#5A5A40]' : 'text-amber-500'} />
                            <span>{item.name}</span>
                          </button>
                        </React.Fragment>
                      );
                    })}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => void loadFolderContents(currentFolder)}
                      disabled={loading}
                      className="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10.5px] font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                      title="Muat ulang isi folder"
                    >
                      <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
                      Muat Ulang
                    </button>
                    <a
                      href={`https://drive.google.com/drive/folders/${currentFolder.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 rounded-lg bg-[#5A5A40]/10 px-2 py-1 text-[10.5px] font-semibold text-[#5A5A40] transition hover:bg-[#5A5A40]/20"
                      title="Buka folder di tab Google Drive"
                    >
                      <ExternalLink size={11} />
                      Drive
                    </a>
                  </div>
                </div>

                <div className="flex flex-col justify-between gap-2 rounded-lg border border-dashed border-amber-200 bg-amber-50/60 p-2 sm:flex-row sm:items-center">
                  <p className="text-[11px] text-slate-700">
                    Folder aktif: <strong className="text-slate-900">{currentFolder.name}</strong>
                  </p>
                  <button
                    type="button"
                    onClick={() => handleSelectFolder(currentFolder)}
                    className="flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-[#5A5A40] px-3 py-1.5 text-[11px] font-bold text-white shadow-2xs transition hover:bg-[#484833]"
                  >
                    <Check size={13} />
                    Gunakan folder ini
                  </button>
                </div>
              </div>

              {/* Pencarian */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2 text-slate-400" size={14} />
                <input
                  type="text"
                  value={searchFolder}
                  onChange={(e) => setSearchFolder(e.target.value)}
                  placeholder={`Cari sub-folder di "${currentFolder.name}"...`}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-[11px] text-slate-800 outline-none focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40]"
                />
              </div>

              {/* Daftar sub-folder */}
              <div className="space-y-1">
                <div className="flex items-center justify-between px-1 text-[10.5px] font-semibold text-slate-500">
                  <span>Sub-folder di “{currentFolder.name}”</span>
                  <span>{filteredFolders.length} folder</span>
                </div>
                <div className="max-h-48 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
                  {filteredFolders.map((folder) => (
                    <div key={folder.id} className="group flex items-center justify-between gap-2 p-2 transition hover:bg-slate-50">
                      <button
                        type="button"
                        onClick={() => handleOpenSubfolder(folder)}
                        className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
                        title="Buka folder ini"
                      >
                        <span className="shrink-0 rounded-lg bg-amber-50 p-1.5 text-amber-600 transition group-hover:bg-amber-100">
                          <Folder size={14} />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[11.5px] font-semibold text-slate-800 group-hover:text-[#5A5A40]">{folder.name}</span>
                          <span className="text-[9.5px] text-slate-400">Klik untuk membuka</span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectFolder(folder)}
                        className="flex shrink-0 cursor-pointer items-center gap-1 rounded-md bg-[#5A5A40]/10 px-2 py-1 text-[10.5px] font-bold text-[#5A5A40] transition hover:bg-[#5A5A40] hover:text-white"
                        title="Pilih sebagai tujuan simpan"
                      >
                        <Check size={12} />
                        Pilih
                      </button>
                    </div>
                  ))}
                  {!filteredFolders.length && !loading && (
                    <p className="p-5 text-center text-[11px] text-slate-500">
                      {subFolders.length ? 'Tidak ada folder yang cocok dengan pencarian.' : `Folder “${currentFolder.name}” masih kosong — buat sub-folder baru di bawah.`}
                    </p>
                  )}
                </div>
              </div>

              {/* Buat folder */}
              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800">
                  <FolderPlus size={14} className="text-[#5A5A40]" />
                  Buat folder baru di dalam “{currentFolder.name}”
                </p>
                <div className="flex flex-col gap-1.5 sm:flex-row">
                  <input
                    type="text"
                    value={customFolderName}
                    onChange={(e) => setCustomFolderName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && normalizeText(customFolderName)) void handleCreateFolder(false);
                    }}
                    placeholder="Nama folder (default: inisial kreditur - debitur - kecamatan)"
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] text-slate-800 outline-none focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40]"
                  />
                  <div className="flex items-center gap-1.5">
                    <MiniAction onClick={() => void handleCreateFolder(false)} disabled={!normalizeText(customFolderName) || loading}>
                      <Plus size={13} />
                      Buat &amp; Pilih
                    </MiniAction>
                    <MiniAction tone="ghost" onClick={() => void handleCreateFolder(true)} disabled={!normalizeText(customFolderName) || loading}>
                      <FolderOpen size={13} />
                      Buat &amp; Buka
                    </MiniAction>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px]">
                <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-2">
                  <span className="shrink-0 text-slate-500">Jalur folder</span>
                  <div className="flex flex-wrap justify-end gap-1 text-[10.5px] font-medium text-slate-700">
                    {[...folderPath, ...(selectedFolder && selectedFolder.id !== currentFolder.id ? [selectedFolder] : [])].map((item, idx) => (
                      <React.Fragment key={`${item.id}-${idx}`}>
                        {idx > 0 && <span className="text-slate-400">/</span>}
                        <span className={cx(idx === folderPath.length && selectedFolder?.id !== currentFolder.id ? 'font-bold text-[#5A5A40]' : '')}>{item.name}</span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Folder tujuan</span>
                  <span className="flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-bold text-emerald-800">
                    <Folder size={12} className="text-emerald-600" />
                    {selectedFolder?.name}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">Halaman yang dikirim</span>
                  <span className="font-semibold text-slate-800">
                    {pages.length
                      ? PAGE_ORDER.filter((key) => pages.includes(key)).map((key) => PAGE_SPECS[key].shortLabel).join(' + ')
                      : 'tidak ada'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">Debitur / Kecamatan</span>
                  <span className="font-semibold text-slate-800">
                    {normalizeText(data.namaDebitur) || '(belum diisi)'} · {normalizeText(data.kecamatan) || '(belum diisi)'}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="flex items-center justify-between text-[11px] font-bold text-slate-800" htmlFor="drive-file-name">
                  <span>Nama file PDF</span>
                  <span className="flex items-center gap-1.5">
                    {editFileName !== standardName && (
                      <button
                        type="button"
                        onClick={() => setEditFileName(standardName)}
                        className="flex cursor-pointer items-center gap-0.5 text-[10px] font-bold text-[#5A5A40] hover:underline"
                        title="Kembalikan ke format standar: inisial kreditur - nama debitur - kecamatan"
                      >
                        <RotateCcw size={10} />
                        Format standar
                      </button>
                    )}
                    <span className="font-normal text-slate-400">format: inisial-kreditur-nama-debitur-kecamatan</span>
                  </span>
                </label>
                <input
                  id="drive-file-name"
                  type="text"
                  value={editFileName}
                  onChange={(e) => setEditFileName(e.target.value)}
                  className={cx(
                    'w-full rounded-xl border bg-white px-3 py-2 font-mono text-[11px] text-slate-800 outline-none focus:ring-1',
                    nameLooksNonStandard ? 'border-amber-400 focus:border-amber-500 focus:ring-amber-400' : 'border-slate-300 focus:border-[#5A5A40] focus:ring-[#5A5A40]',
                  )}
                />
                {nameLooksNonStandard ? (
                  <p className="text-[10px] font-semibold text-amber-700">
                    Nama file menyimpang dari format standar. Disarankan:{' '}
                    <span className="font-mono">{standardName}</span>
                  </p>
                ) : (
                  <p className="text-[10px] font-semibold text-emerald-700">✓ Nama file sesuai format standar.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-2.5">
          <p className="flex min-w-0 items-center gap-1.5 text-[11px] text-slate-500">
            {loading && (
              <>
                <Loader2 size={13} className="shrink-0 animate-spin text-[#5A5A40]" />
                <span className="truncate font-medium">{statusMsg || 'Memproses...'}</span>
              </>
            )}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            {step === 'confirm_upload' && !successLink && (
              <button
                type="button"
                onClick={() => setStep('select_folder')}
                className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Ganti Folder
              </button>
            )}
            {!successLink && step === 'confirm_upload' && (
              <button
                type="button"
                onClick={() => void handleUpload()}
                disabled={loading || !selectedFolder || !finalName || blocked}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#5A5A40] px-4 py-2 text-[11px] font-bold text-white shadow-sm transition hover:bg-[#484833] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />}
                Unggah &amp; Simpan ke Drive
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              {successLink ? 'Tutup' : 'Batal'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniAction({
  children,
  onClick,
  disabled,
  tone = 'olive',
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'olive' | 'ghost';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cx(
        'flex shrink-0 cursor-pointer items-center justify-center gap-1 rounded-lg px-2.5 py-1.5 text-[10.5px] font-bold transition disabled:cursor-not-allowed disabled:opacity-50',
        tone === 'olive' ? 'bg-[#5A5A40] text-white hover:bg-[#484833]' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100',
      )}
    >
      {children}
    </button>
  );
}
