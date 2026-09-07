import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { DocData, PageKey } from '../types';
import type { FieldIssue } from '../utils/validation';
import SuratTugas from '../documents/SuratTugas';
import SuratPenyerahan from '../documents/SuratPenyerahan';
import BastSheet from '../documents/BastSheet';
import Lampiran from '../documents/Lampiran';
import { PAGE_ORDER, PAGE_SPECS } from '../utils/pdf';
import { cx, MiniBtn, Notice } from './ui';
import { AlertTriangle, Check, Copy, FileDown, Loader2, UploadCloud, ZoomIn, ZoomOut } from 'lucide-react';

const A4_WIDTH_PX = (210 * 96) / 25.4; // ≈ 794px, lebar dasar dokumen

export function renderDocument(key: PageKey, data: DocData): React.ReactNode {
  switch (key) {
    case 'surat_tugas':
      return <SuratTugas key={key} data={data} />;
    case 'penyerahan':
      return <SuratPenyerahan key={key} data={data} />;
    case 'bast':
      return <BastSheet key={key} data={data} />;
    case 'lampiran':
      return <Lampiran key={key} data={data} />;
    default:
      return null;
  }
}

interface PreviewPanelProps {
  data: DocData;
  enabledPages: PageKey[];
  onTogglePage: (key: PageKey) => void;
  onSelectPages: (keys: PageKey[]) => void;
  fileName: string;
  errors: FieldIssue[];
  warningCount: number;
  forceExport: boolean;
  onForceChange: (value: boolean) => void;
  exporting: boolean;
  exportLabel: string;
  onSavePdf: () => void;
  onOpenDriveModal: () => void;
  onShowIssues: () => void;
}

export default function PreviewPanel({
  data,
  enabledPages,
  onTogglePage,
  onSelectPages,
  fileName,
  errors,
  warningCount,
  forceExport,
  onForceChange,
  exporting,
  exportLabel,
  onSavePdf,
  onOpenDriveModal,
  onShowIssues,
}: PreviewPanelProps) {
  const [zoom, setZoom] = useState(0.8);
  const [autoFit, setAutoFit] = useState(true);
  const [copied, setCopied] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const areaRef = useRef<HTMLDivElement>(null);
  const scalerRef = useRef<HTMLDivElement>(null);

  // Tinggi konten dipakai agar scrollbar area pratinjau tetap pas saat di-zoom
  useLayoutEffect(() => {
    const el = scalerRef.current;
    if (!el) return;
    const measure = () => setContentHeight(el.offsetHeight || el.scrollHeight || 0);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [enabledPages.length, data]);

  const fit = useCallback(() => {
    const el = areaRef.current;
    if (!el) return;
    const available = el.clientWidth - 40;
    setZoom(Math.min(1, Math.max(0.3, +(available / A4_WIDTH_PX).toFixed(2))));
  }, []);

  useLayoutEffect(() => {
    if (!autoFit) return;
    fit();
    const observer = new ResizeObserver(() => fit());
    if (areaRef.current) observer.observe(areaRef.current);
    return () => observer.disconnect();
  }, [autoFit, fit]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timer);
  }, [copied]);

  const zoomBy = (delta: number) => {
    setAutoFit(false);
    setZoom((z) => Math.min(1.5, Math.max(0.25, +(z + delta).toFixed(2))));
  };

  const blocked = errors.length > 0 && !forceExport;
  const selectedCount = PAGE_ORDER.filter((key) => enabledPages.includes(key)).length;
  const allOn = selectedCount === PAGE_ORDER.length;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#FDFBF7]">
      {/* ---------------- Toolbar ---------------- */}
      <div className="shrink-0 space-y-1.5 border-b border-[#D1D1CA] bg-[#EBEBE4] px-2.5 py-1.5 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          {/* Pilihan halaman dokumen (satu rangkaian, boleh dipilih sebagian) */}
          <div className="flex flex-wrap items-center gap-1">
            {PAGE_ORDER.map((key) => {
              const spec = PAGE_SPECS[key];
              const active = enabledPages.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onTogglePage(key)}
                  aria-pressed={active}
                  title={`${active ? 'Keluarkan dari PDF' : 'Masukkan ke PDF'}: ${spec.label}`}
                  className={cx(
                    'flex cursor-pointer items-center gap-1 rounded-md border px-1.5 py-1 text-[10px] font-bold transition',
                    active
                      ? 'border-[#5A5A40] bg-[#5A5A40] text-white shadow-2xs'
                      : 'border-slate-300 bg-white text-slate-500 hover:border-slate-400 hover:text-slate-700',
                  )}
                >
                  <span
                    className={cx(
                      'flex h-3 w-3 items-center justify-center rounded-[3px] border',
                      active ? 'border-white bg-white/20' : 'border-slate-400 bg-white',
                    )}
                  >
                    {active && <Check size={9} strokeWidth={3.5} />}
                  </span>
                  {spec.shortLabel}
                </button>
              );
            })}
            <MiniBtn
              tone="ghost"
              onClick={() => onSelectPages(allOn ? ['surat_tugas'] : [...PAGE_ORDER])}
              title={allOn ? 'Hanya Surat Tugas' : 'Masukkan seluruh dokumen ke PDF'}
            >
              {allOn ? 'Hanya Surat Tugas' : 'Semua Dokumen'}
            </MiniBtn>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Nama file PDF otomatis */}
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(fileName).then(
                  () => setCopied(true),
                  () => setCopied(false),
                );
              }}
              title="Klik untuk menyalin nama file PDF"
              className="flex max-w-[240px] items-center gap-1 rounded-md border border-slate-300 bg-white px-1.5 py-1 text-[9.5px] font-bold text-slate-600 transition hover:border-[#5A5A40]"
            >
              <FileDown size={11} className="shrink-0 text-[#5A5A40]" />
              <span className="truncate font-mono">{fileName}</span>
              <Copy size={9} className="shrink-0 text-slate-400" />
            </button>

            {/* Zoom */}
            <div className="hidden items-center gap-0.5 rounded-md border border-slate-300 bg-white px-0.5 py-0.5 sm:flex">
              <button
                type="button"
                onClick={() => zoomBy(-0.1)}
                className="flex h-5 w-5 cursor-pointer items-center justify-center rounded text-slate-600 transition hover:bg-slate-100"
                title="Perkecil"
              >
                <ZoomOut size={12} />
              </button>
              <span className="w-9 text-center text-[10px] font-bold tabular-nums text-slate-600">{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                onClick={() => zoomBy(0.1)}
                className="flex h-5 w-5 cursor-pointer items-center justify-center rounded text-slate-600 transition hover:bg-slate-100"
                title="Perbesar"
              >
                <ZoomIn size={12} />
              </button>
              <button
                type="button"
                onClick={() => setAutoFit((v) => !v)}
                className={cx(
                  'cursor-pointer rounded px-1 py-0.5 text-[9px] font-bold transition',
                  autoFit ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100',
                )}
                title="Sesuaikan lebar otomatis"
              >
                AUTO
              </button>
            </div>

            <MiniBtn tone="ghost" onClick={onOpenDriveModal} title="Simpan PDF ke folder Google Drive kreditur">
              <UploadCloud size={12} />
              <span className="hidden md:inline">GDrive</span>
            </MiniBtn>

            <button
              type="button"
              id="btn-simpan-pdf"
              onClick={onSavePdf}
              disabled={exporting || blocked}
              title={blocked ? 'Perbaiki error pada form terlebih dahulu' : `Simpan ${selectedCount} dokumen sebagai satu file PDF`}
              className={cx(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11.5px] font-bold text-white shadow-sm transition active:scale-[0.98]',
                exporting || blocked ? 'cursor-not-allowed bg-slate-400' : 'cursor-pointer bg-[#5A5A40] hover:bg-[#484833]',
              )}
            >
              {exporting ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />}
              {exporting ? exportLabel : 'Simpan PDF'}
              {errors.length > 0 && (
                <span className="ml-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[9px]">
                  {errors.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Status validasi singkat */}
        {errors.length > 0 ? (
          <Notice tone="error" className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 font-semibold">
              <AlertTriangle size={12} />
              {errors.length} data wajib belum benar — PDF diblokir.
              {warningCount > 0 && <span className="font-normal">({warningCount} peringatan)</span>}
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={onShowIssues}
                className="cursor-pointer rounded border border-rose-300 bg-white px-1.5 py-0.5 text-[9.5px] font-bold text-rose-700 transition hover:bg-rose-100"
                title="Lompat ke kolom pertama yang perlu diperbaiki"
              >
                Lihat isian
              </button>
              <label className="flex cursor-pointer items-center gap-1 font-bold">
                <input type="checkbox" checked={forceExport} onChange={(e) => onForceChange(e.target.checked)} className="h-3 w-3 accent-rose-600" />
                Paksa simpan
              </label>
            </span>
          </Notice>
        ) : (
          <p className="text-[9.5px] font-semibold text-emerald-700">
            ✓ Data valid. {selectedCount} dokumen akan digabung menjadi satu file{' '}
            <span className="font-mono">{fileName}</span>
            {warningCount > 0 && <span className="ml-1 font-normal text-amber-600">({warningCount} peringatan, boleh diabaikan)</span>}
          </p>
        )}
      </div>

      {/* ---------------- Pratinjau ---------------- */}
      <div ref={areaRef} className="preview-area custom-scrollbar relative flex-1 overflow-auto bg-[#EBEBE4] p-4 print:bg-white print:p-0">
        {exporting && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 bg-[#FDFBF7]/80 backdrop-blur-sm">
            <Loader2 size={26} className="animate-spin text-[#5A5A40]" />
            <p className="text-xs font-bold text-slate-600">{exportLabel}</p>
            <p className="text-[10px] text-slate-500">Halaman dikembalikan ke 100% selama proses render</p>
          </div>
        )}

        {!enabledPages.length && (
          <div className="mx-auto mt-16 max-w-md rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
            <p className="text-sm font-bold text-slate-700">Belum ada dokumen yang dipilih</p>
            <p className="mt-1 text-xs text-slate-500">
              Centang minimal satu dokumen pada baris di atas untuk menampilkan pratinjau dan menyimpannya sebagai PDF.
            </p>
          </div>
        )}

        <div
          className="mx-auto"
          style={{ width: A4_WIDTH_PX * zoom, height: contentHeight ? contentHeight * zoom : 'auto' }}
        >
          <div
            ref={scalerRef}
            className="preview-scaler flex origin-top-left flex-col items-center gap-6 print:gap-0 print:transform-none"
            style={{ width: A4_WIDTH_PX, transform: `scale(${zoom})` }}
          >
            {PAGE_ORDER.filter((key) => enabledPages.includes(key)).map((key) => renderDocument(key, data))}
          </div>
        </div>
      </div>
    </div>
  );
}
