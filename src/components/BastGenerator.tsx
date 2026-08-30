import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { BastData, ChecklistMap, VehicleType } from '../types';
import { BLANK_DATA, CONTOH_RODA2, CONTOH_RODA4, syncChecklist } from '../data/defaults';
import FormPanel from './FormPanel';
import SuratPenyerahan from './SuratPenyerahan';
import BastSheet from './BastSheet';
import { Btn } from './ui';
import { FileDown, Loader2, RotateCcw, Sparkles, UploadCloud } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const STORAGE_KEY = 'bast-generator-v1';
const A4_PX = (210 * 96) / 25.4;

type PageMode = 'both' | 'bast' | 'penyerahan';

function loadInitial(): BastData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as BastData;
      return {
        ...BLANK_DATA,
        ...parsed,
        checklist: syncChecklist(parsed.jenis ?? 'roda4', parsed.checklist ?? {}),
      };
    }
  } catch {
    /* ignore */
  }
  return CONTOH_RODA4;
}

interface BastGeneratorProps {
  data?: BastData;
  onChange?: (data: BastData) => void;
  externalData?: BastData;
  onDataChange?: (data: BastData) => void;
  onOpenDriveModal?: () => void;
}

export default function BastGenerator({
  data: propData,
  onChange: propOnChange,
  externalData,
  onDataChange,
  onOpenDriveModal,
}: BastGeneratorProps = {}) {
  // Support both (data, onChange) and (externalData, onDataChange)
  const isControlled = Boolean(propData || externalData);
  const activeOnChange = propOnChange || onDataChange;

  const [internalData, setInternalData] = useState<BastData>(() => loadInitial());
  const data = (propData || externalData) ?? internalData;

  const [pageMode, setPageMode] = useState<PageMode>('both');
  const [zoom, setZoom] = useState(0.85);
  const [autoFit, setAutoFit] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTabMobile, setActiveTabMobile] = useState<'form' | 'preview'>('form');
  const previewRef = useRef<HTMLDivElement>(null);

  // Debounced auto-save to localStorage
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        /* ignore */
      }
    }, 400);
    return () => clearTimeout(id);
  }, [data]);

  const updateData = useCallback(
    (updater: (prev: BastData) => BastData) => {
      if (isControlled && activeOnChange) {
        activeOnChange(updater(data));
      } else {
        setInternalData(updater);
      }
    },
    [isControlled, activeOnChange, data]
  );

  const fit = useCallback(() => {
    const el = previewRef.current;
    if (!el) return;
    const w = el.clientWidth - 48;
    setZoom(Math.min(1.2, Math.max(0.35, w / A4_PX)));
  }, []);

  useLayoutEffect(() => {
    if (!autoFit) return;
    fit();
    const ro = new ResizeObserver(() => fit());
    if (previewRef.current) ro.observe(previewRef.current);
    return () => ro.disconnect();
  }, [autoFit, fit]);

  const set = useCallback(
    <K extends keyof BastData>(key: K, value: BastData[K]) =>
      updateData((d) => ({ ...d, [key]: value })),
    [updateData],
  );

  const setJenis = useCallback(
    (j: VehicleType) =>
      updateData((d) => ({ ...d, jenis: j, checklist: syncChecklist(j, d.checklist) })),
    [updateData],
  );

  const setChecklist = useCallback(
    (c: ChecklistMap) => updateData((d) => ({ ...d, checklist: c })),
    [updateData],
  );

  const contoh = () =>
    updateData((d) => (d.jenis === 'roda2' ? CONTOH_RODA2 : CONTOH_RODA4));
  
  const reset = () =>
    updateData((d) => ({
      ...BLANK_DATA,
      jenis: d.jenis,
      perusahaan: d.perusahaan,
      cabang: d.cabang,
      alamat: d.alamat,
      checklist: syncChecklist(d.jenis, {}),
    }));

  const zoomBy = (d: number) => {
    setAutoFit(false);
    setZoom((z) => Math.min(1.6, Math.max(0.25, +(z + d).toFixed(2))));
  };

  const handleSavePdf = async () => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pagesToRender: { id: string; name: string }[] = [];
      if (pageMode === 'both' || pageMode === 'penyerahan') {
        pagesToRender.push({ id: 'surat-penyerahan-doc', name: 'Surat Penyerahan' });
      }
      if (pageMode === 'both' || pageMode === 'bast') {
        pagesToRender.push({ id: 'bast-sheet-doc', name: 'BAST' });
      }

      for (let i = 0; i < pagesToRender.length; i++) {
        const pageInfo = pagesToRender[i];
        const el = document.getElementById(pageInfo.id);
        if (!el) continue;

        if (i > 0) {
          pdf.addPage('a4', 'portrait');
        }

        const canvas = await html2canvas(el, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      }

      const safeName = (data.debiturNama || 'Debitur').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `BAST_Penyerahan_${safeName}_${data.jenis.toUpperCase()}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error('PDF error, fallback to print:', err);
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex bg-[#EBEBE4] border-b border-[#D1D1CA] print:hidden shrink-0">
        <button
          onClick={() => setActiveTabMobile('form')}
          className={`flex-1 py-2.5 text-xs font-bold transition-colors ${
            activeTabMobile === 'form'
              ? 'text-[#5A5A40] border-b-2 border-[#5A5A40] bg-white/50'
              : 'text-[#8A8A7A] hover:text-[#4A4A4A]'
          }`}
        >
          Formulir BAST
        </button>
        <button
          onClick={() => setActiveTabMobile('preview')}
          className={`flex-1 py-2.5 text-xs font-bold transition-colors ${
            activeTabMobile === 'preview'
              ? 'text-[#5A5A40] border-b-2 border-[#5A5A40] bg-white/50'
              : 'text-[#8A8A7A] hover:text-[#4A4A4A]'
          }`}
        >
          Pratinjau Dokumen
        </button>
      </div>

      {/* ============ SIDEBAR / FORM ============ */}
      <aside
        className={`w-full lg:w-[350px] xl:w-[380px] shrink-0 border-r border-slate-300 bg-slate-50 flex flex-col overflow-hidden ${
          activeTabMobile === 'form' ? 'flex' : 'hidden lg:flex'
        } print:hidden`}
      >
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-3 py-2 backdrop-blur shadow-xs shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-xs font-bold tracking-tight text-slate-900 leading-tight">
                Data BAST Kendaraan
              </h2>
              <p className="text-[10px] text-slate-500 leading-tight">
                Berita Acara & Surat Penyerahan
              </p>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={contoh}
                className="flex items-center gap-1 px-2 py-1 text-[10.5px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md border border-slate-200 transition cursor-pointer"
              >
                <Sparkles size={11} />
                Contoh
              </button>
              <button
                type="button"
                onClick={reset}
                className="flex items-center gap-1 px-2 py-1 text-[10.5px] font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-md border border-slate-200 transition cursor-pointer"
              >
                <RotateCcw size={11} />
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="p-2.5 md:p-3 flex-1 overflow-y-auto custom-scrollbar">
          <FormPanel
            data={data}
            set={set}
            setJenis={setJenis}
            setChecklist={setChecklist}
          />
        </div>
      </aside>

      {/* ============ PREVIEW & EXPORT ============ */}
      <main
        className={`flex-1 flex-col bg-slate-200/80 overflow-hidden ${
          activeTabMobile === 'preview' ? 'flex' : 'hidden lg:flex'
        } print:block print:bg-white`}
      >
        {/* Top bar controls */}
        <div className="no-print flex flex-wrap items-center justify-between gap-2 border-b border-slate-300 bg-slate-100 px-4 py-2.5 shadow-xs">
          <div className="flex items-center gap-1.5 rounded-lg bg-white p-1 shadow-xs border border-slate-200">
            {(
              [
                ['both', 'Semua Halaman'],
                ['penyerahan', 'Surat Penyerahan'],
                ['bast', 'Lembar BAST'],
              ] as [PageMode, string][]
            ).map(([v, l]) => (
              <button
                key={v}
                onClick={() => setPageMode(v)}
                className={`rounded-md px-2.5 py-1 text-[11.5px] font-semibold transition cursor-pointer ${
                  pageMode === v
                    ? 'bg-[#5A5A40] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => zoomBy(-0.1)}
                className="w-6 h-6 flex items-center justify-center text-xs font-bold text-slate-700 hover:bg-slate-100 rounded cursor-pointer"
              >
                −
              </button>
              <span className="w-10 text-center text-[11px] font-bold text-slate-600">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => zoomBy(0.1)}
                className="w-6 h-6 flex items-center justify-center text-xs font-bold text-slate-700 hover:bg-slate-100 rounded cursor-pointer"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => setAutoFit((a) => !a)}
                className={`text-[10.5px] px-2 py-0.5 rounded font-semibold transition cursor-pointer ${
                  autoFit ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Auto
              </button>
            </div>

            {/* Simpan ke GDrive Button */}
            {onOpenDriveModal && (
              <button
                type="button"
                id="btn-bast-simpan-gdrive"
                onClick={onOpenDriveModal}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#2D6A4F] text-white rounded-lg hover:bg-[#1B4332] active:scale-[0.98] transition-all font-semibold text-xs shadow-sm cursor-pointer"
              >
                <UploadCloud size={14} />
                <span className="hidden sm:inline">Simpan ke GDrive</span>
              </button>
            )}

            {/* Simpan PDF Button */}
            <button
              id="btn-simpan-bast-pdf"
              onClick={handleSavePdf}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#5A5A40] text-white rounded-lg hover:bg-[#484833] active:scale-[0.98] transition-all font-semibold text-xs shadow-sm cursor-pointer disabled:opacity-70"
            >
              {isExporting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Menyimpan PDF...
                </>
              ) : (
                <>
                  <FileDown size={14} />
                  Simpan PDF
                </>
              )}
            </button>
          </div>
        </div>

        {/* Scrollable Preview Area */}
        <div
          ref={previewRef}
          className="flex-1 overflow-auto p-4 md:p-8 flex justify-center custom-scrollbar"
        >
          <div
            className="flex flex-col items-center gap-8 transition-transform duration-150 origin-top"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
          >
            {(pageMode === 'both' || pageMode === 'penyerahan') && (
              <div
                id="surat-penyerahan-doc"
                className="shadow-[0_15px_40px_rgba(0,0,0,0.12)] border border-slate-300 print:shadow-none print:border-none"
              >
                <SuratPenyerahan data={data} />
              </div>
            )}
            {(pageMode === 'both' || pageMode === 'bast') && (
              <div
                id="bast-sheet-doc"
                className="shadow-[0_15px_40px_rgba(0,0,0,0.12)] border border-slate-300 print:shadow-none print:border-none print:break-before-page"
              >
                <BastSheet data={data} />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
