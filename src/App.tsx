import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DocData, PageKey } from './types';
import DataForm, { focusField } from './components/form/DataForm';
import PreviewPanel from './components/PreviewPanel';
import GoogleDriveSaveModal from './components/GoogleDriveSaveModal';
import { completionStats, validateDoc } from './utils/validation';
import { buildPdfFileName } from './utils/filename';
import { PAGE_ORDER, savePagesAsPdf } from './utils/pdf';
import { DEFAULT_DATA, blankData, normalizeStored } from './data/defaults';
import { AlertTriangle, CheckCircle2, FileDown, Loader2, Printer, UploadCloud, X } from 'lucide-react';
import { cx } from './components/ui';

const STORAGE_KEY = 'generator-surat-v2';
const PAGES_KEY = 'generator-surat-v2:pages';

/** Kunci penyimpanan versi lama (form masih dipisah per dokumen) */
const LEGACY_KEYS = ['generator-surat-v1', 'bast-generator-v1'];

function loadStoredData(): DocData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalizeStored(JSON.parse(raw) as unknown);

    // Pulihkan isian dari versi lama ke model tunggal agar data user tidak hilang
    for (const key of LEGACY_KEYS) {
      const legacyRaw = localStorage.getItem(key);
      if (!legacyRaw) continue;
      const migrated = normalizeStored(JSON.parse(legacyRaw) as unknown);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        localStorage.removeItem(key);
      } catch {
        /* penyimpanan penuh: biarkan data lama tetap ada */
      }
      return migrated;
    }
  } catch {
    /* data rusak: mulai dari contoh data */
  }
  return DEFAULT_DATA;
}

function loadStoredPages(): PageKey[] {
  try {
    const raw = localStorage.getItem(PAGES_KEY);
    if (!raw) return [...PAGE_ORDER];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...PAGE_ORDER];
    const keys = parsed.filter((k): k is PageKey => typeof k === 'string' && PAGE_ORDER.includes(k as PageKey));
    return keys.length ? keys : [...PAGE_ORDER];
  } catch {
    return [...PAGE_ORDER];
  }
}

type Toast = { tone: 'success' | 'error' | 'info'; message: string };

export default function App() {
  const [data, setData] = useState<DocData>(() => loadStoredData());
  const [enabledPages, setEnabledPages] = useState<PageKey[]>(() => loadStoredPages());
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');
  const [forceExport, setForceExport] = useState(false);
  const [isDriveOpen, setIsDriveOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportLabel, setExportLabel] = useState('Menyiapkan halaman...');
  const [toast, setToast] = useState<Toast | null>(null);
  const saveTimer = useRef<number | null>(null);
  const quotaWarned = useRef(false);

  /* ------------------------------ persistensi ----------------------------- */
  useEffect(() => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (err) {
        // Kuota storage penuh (biasanya karena gambar lampiran besar):
        // simpan tanpa berkas lampiran agar isian teks tetap aman.
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, dokumen: [] }));
          if (!quotaWarned.current) {
            quotaWarned.current = true;
            setToast({
              tone: 'info',
              message: 'Penyimpanan browser penuh: lampiran gambar tidak ikut disimpan sebagai draft (PDF tetap menyertakannya).',
            });
          }
        } catch (innerErr) {
          console.warn('Gagal menyimpan draft:', innerErr ?? err);
        }
      }
    }, 400);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [data]);

  useEffect(() => {
    try {
      localStorage.setItem(PAGES_KEY, JSON.stringify(enabledPages));
    } catch {
      /* storage penuh / mode privat: abaikan */
    }
  }, [enabledPages]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  /* -------------------------------- derived ------------------------------- */
  const validation = useMemo(() => validateDoc(data), [data]);
  const completion = useMemo(() => completionStats(data), [data]);

  /** Nama file selalu mengikuti format baku: inisial-kreditur / nama-debitur / kecamatan */
  const fileName = useMemo(() => buildPdfFileName(data), [data]);

  const handleChange = useCallback((patch: Partial<DocData>) => {
    setData((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleFillSample = useCallback(() => {
    setData((prev) => ({ ...DEFAULT_DATA, jenis: prev.jenis, kopImage: prev.kopImage ?? DEFAULT_DATA.kopImage }));
    setToast({ tone: 'info', message: 'Contoh data dimuat. Semua dokumen ikut terbarukan.' });
  }, []);

  const handleClear = useCallback(() => {
    if (!window.confirm('Kosongkan seluruh isian form? Kop surat & identitas perusahaan tetap dipertahankan.')) return;
    setData((prev) => blankData(prev));
    setToast({ tone: 'info', message: 'Form dikosongkan. Data perusahaan & kop tetap tersimpan.' });
  }, []);

  const togglePage = useCallback((key: PageKey) => {
    setEnabledPages((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : PAGE_ORDER.filter((k) => prev.includes(k) || k === key)));
  }, []);

  const jumpToFirstError = useCallback(() => {
    const first = validation.errors[0];
    if (!first) return;
    setActiveTab('form');
    window.requestAnimationFrame(() => focusField(first.field));
  }, [validation.errors]);

  const handleSavePdf = useCallback(async () => {
    if (exporting) return;
    if (validation.hasBlockingError && !forceExport) {
      const first = validation.errors[0];
      setToast({
        tone: 'error',
        message: `PDF belum dapat disimpan — ${first.label}: ${first.message}`,
      });
      setActiveTab('form');
      window.requestAnimationFrame(() => focusField(first.field));
      return;
    }
    if (!enabledPages.length) {
      setToast({ tone: 'error', message: 'Belum ada dokumen yang dipilih untuk disimpan.' });
      return;
    }

    // Dokumen dirender dari pratinjau: di layar kecil pastikan panel preview aktif
    setActiveTab('preview');
    setExporting(true);
    setExportLabel('Menyiapkan halaman...');
    try {
      const result = await savePagesAsPdf(enabledPages, fileName, (info) =>
        setExportLabel(`Merender ${info.label} (${info.index}/${info.total})`),
      );
      setToast({
        tone: 'success',
        message: `${result.fileName} tersimpan — ${result.renderedPages.length} halaman.`,
      });
    } catch (err) {
      setToast({
        tone: 'error',
        message: err instanceof Error ? `Gagal membuat PDF: ${err.message}` : 'Gagal membuat PDF, coba ulangi.',
      });
    } finally {
      setExporting(false);
      setExportLabel('Menyiapkan halaman...');
    }
  }, [enabledPages, exporting, fileName, forceExport, validation]);

  /* ------------------------ pintasan keyboard Ctrl/Cmd+S ------------------ */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (!isDriveOpen) void handleSavePdf();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSavePdf, isDriveOpen]);

  const errorCount = validation.errors.length;
  const warningCount = validation.warnings.length;

  return (
    <div className="app-shell flex h-screen max-h-screen flex-col overflow-hidden bg-[#F5F5F0] font-sans text-[#4A4A4A]">
      {/* ------------------------------- Header ------------------------------ */}
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#D1D1CA] bg-[#EBEBE4] px-3 py-2 print:hidden md:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="rounded-lg bg-[#5A5A40] p-1.5 text-white shadow-xs">
            <FileDown size={19} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-[15px] font-bold leading-tight tracking-tight text-[#2C2C24] md:text-base">
              Generator Surat Tugas, Penyerahan &amp; BAST
            </h1>
            <p className="truncate text-[10.5px] leading-tight text-[#8A8A7A]">
              Satu urutan form untuk semua dokumen · nama file otomatis dari inisial kreditur, debitur, dan kecamatan
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            disabled={errorCount === 0}
            onClick={jumpToFirstError}
            className={cx(
              'hidden items-center gap-1.5 rounded-lg border px-2 py-1 text-[10.5px] font-bold transition sm:flex',
              errorCount
                ? 'cursor-pointer border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100'
                : 'border-emerald-300 bg-emerald-50 text-emerald-800',
            )}
            title={errorCount ? 'Klik untuk melompat ke data yang belum benar' : 'Semua data wajib lolos pemeriksaan'}
          >
            {errorCount ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}
            {errorCount ? `${errorCount} perlu diperbaiki` : 'Data valid'}
            <span className="ml-1 rounded bg-white/70 px-1 text-[9.5px] font-bold text-slate-500">
              {completion.filled}/{completion.total}
            </span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="hidden cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition hover:bg-slate-100 lg:flex"
            title="Cetak pratinjau dokumen"
          >
            <Printer size={13} />
            Cetak
          </button>

          <button
            type="button"
            onClick={() => setIsDriveOpen(true)}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#2D6A4F] px-3 py-1.5 text-[11px] font-bold text-white shadow-2xs transition hover:bg-[#1B4332] active:scale-95"
            title="Simpan PDF ke Google Drive"
          >
            <UploadCloud size={14} />
            <span className="hidden sm:inline">Simpan ke GDrive</span>
            <span className="sm:hidden">GDrive</span>
          </button>

          <button
            type="button"
            onClick={() => void handleSavePdf()}
            disabled={exporting}
            className={cx(
              'flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold text-white shadow-2xs transition active:scale-95',
              exporting ? 'cursor-wait bg-slate-400' : errorCount && !forceExport ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#5A5A40] hover:bg-[#484833]',
            )}
            title={errorCount && !forceExport ? 'Ada data wajib yang belum benar — klik untuk melihat daftarnya' : 'Simpan PDF (Ctrl+S)'}
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
            <span className="hidden sm:inline">{exporting ? 'Menyimpan…' : 'Simpan PDF'}</span>
            {errorCount > 0 && !exporting && (
              <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[9px]">{errorCount}</span>
            )}
          </button>
        </div>
      </header>

      {/* ----------------------------- Tab mobile ---------------------------- */}
      <div className="flex shrink-0 border-b border-[#D1D1CA] bg-[#EBEBE4] lg:hidden print:hidden">
        {(
          [
            ['form', 'Isi Data'],
            ['preview', 'Pratinjau & Simpan'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={cx(
              'flex-1 cursor-pointer py-2.5 text-[11.5px] font-bold transition-colors',
              activeTab === key ? 'border-b-2 border-[#5A5A40] bg-white/50 text-[#5A5A40]' : 'text-[#8A8A7A] hover:text-[#4A4A4A]',
            )}
          >
            {label}
            {key === 'preview' && errorCount > 0 && (
              <span className="ml-1 rounded-full bg-rose-600 px-1.5 py-px text-[9px] text-white">{errorCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* ------------------------------- Konten ------------------------------ */}
      <main className="flex min-h-0 flex-1 overflow-hidden print:block">
        <aside
          className={cx(
            'w-full shrink-0 flex-col overflow-hidden border-r border-[#D1D1CA] bg-[#EBEBE4] lg:flex lg:w-[400px] xl:w-[430px] print:hidden',
            activeTab === 'form' ? 'flex' : 'hidden',
          )}
        >
          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-2.5 py-2 md:px-3">
            <DataForm
              data={data}
              issues={validation.byField}
              completion={completion}
              onChange={handleChange}
              onFillSample={handleFillSample}
              onClear={handleClear}
            />
          </div>
        </aside>

        <section
          data-preview-host=""
          className={cx(
            'min-h-0 flex-1 flex-col overflow-hidden bg-[#FDFBF7] lg:flex print:flex',
            activeTab === 'preview' ? 'flex' : 'hidden',
          )}
        >
          <PreviewPanel
            data={data}
            enabledPages={enabledPages}
            onTogglePage={togglePage}
            onSelectPages={(keys) => setEnabledPages(PAGE_ORDER.filter((key) => keys.includes(key)))}
            fileName={fileName}
            errors={validation.errors}
            warningCount={warningCount}
            forceExport={forceExport}
            onForceChange={setForceExport}
            exporting={exporting}
            exportLabel={exportLabel}
            onSavePdf={() => void handleSavePdf()}
            onOpenDriveModal={() => setIsDriveOpen(true)}
            onShowIssues={jumpToFirstError}
          />
        </section>
      </main>

      {/* --------------------------- Modal GDrive ---------------------------- */}
      <GoogleDriveSaveModal
        isOpen={isDriveOpen}
        onClose={() => setIsDriveOpen(false)}
        data={data}
        pages={enabledPages}
        fileName={fileName}
        errors={validation.errors}
        forceExport={forceExport}
      />

      {/* ------------------------------- Toast ------------------------------- */}
      {toast && (
        <div
          className={cx(
            'fixed bottom-4 right-4 z-[60] flex max-w-sm items-start gap-2 rounded-xl border px-3 py-2 text-[11.5px] font-semibold shadow-lg',
            toast.tone === 'success'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
              : toast.tone === 'error'
                ? 'border-rose-300 bg-rose-50 text-rose-800'
                : 'border-slate-300 bg-white text-slate-700',
          )}
          role="status"
        >
          {toast.tone === 'success' ? (
            <CheckCircle2 size={15} className="mt-px shrink-0 text-emerald-600" />
          ) : toast.tone === 'error' ? (
            <AlertTriangle size={15} className="mt-px shrink-0 text-rose-600" />
          ) : (
            <UploadCloud size={15} className="mt-px shrink-0 text-slate-500" />
          )}
          <span className="min-w-0 break-words">{toast.message}</span>
          <button type="button" onClick={() => setToast(null)} className="ml-1 shrink-0 cursor-pointer text-slate-400 hover:text-slate-700" title="Tutup notifikasi">
            <X size={13} />
          </button>
        </div>
      )}

    </div>
  );
}
