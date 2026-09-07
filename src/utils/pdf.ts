import type jsPDFType from 'jspdf';
import type { PageKey } from '../types';

/**
 * Render dokumen HTML menjadi PDF multi-halaman.
 *
 * - Setiap dokumen punya ukuran halaman sendiri: F4 (210×330mm) untuk Surat Tugas
 *   & Lampiran, A4 (210×297mm) untuk Surat Penyerahan & BAST.
 * - Bila isi melebihi tinggi minimum, halaman otomatis memanjang (dibatasi
 *   maxHeightMm) supaya tidak ada teks yang terpotong atau tertarik.
 * - jspdf & html2canvas dimuat dinamis agar bundle awal tetap ringan.
 */

export interface PageSpec {
  key: PageKey;
  /** Elemen dokumen ditandai [data-doc-key="<key>"]; 1 elemen = 1 halaman PDF */
  label: string;
  shortLabel: string;
  widthMm: number;
  minHeightMm: number;
  maxHeightMm: number;
}

export const PAGE_SPECS: Record<PageKey, PageSpec> = {
  surat_tugas: {
    key: 'surat_tugas',
    label: 'Surat Tugas Penagihan',
    shortLabel: 'Surat Tugas',
    widthMm: 210,
    minHeightMm: 330, // F4
    maxHeightMm: 400,
  },
  lampiran: {
    key: 'lampiran',
    label: 'Lampiran Berkas (KTP, STNK, Unit, dll)',
    shortLabel: 'Lampiran',
    widthMm: 210,
    minHeightMm: 330,
    maxHeightMm: 500,
  },
  penyerahan: {
    key: 'penyerahan',
    label: 'Surat Penyerahan Kendaraan',
    shortLabel: 'Penyerahan',
    widthMm: 210,
    minHeightMm: 297, // A4
    maxHeightMm: 400,
  },
  bast: {
    key: 'bast',
    label: 'BAST & Checklist Kondisi Unit',
    shortLabel: 'BAST',
    widthMm: 210,
    minHeightMm: 297,
    maxHeightMm: 470,
  },
};

/** Urutan baku dokumen dalam satu rangkaian */
export const PAGE_ORDER: PageKey[] = ['surat_tugas', 'penyerahan', 'bast', 'lampiran'];

const MAX_SAFE_PX = 8000;

export interface PdfRenderResult {
  doc: jsPDFType;
  renderedPages: PageKey[];
  skippedPages: PageKey[];
}

export interface PdfExportResult extends PdfRenderResult {
  fileName: string;
}

type Progress = (info: { index: number; total: number; label: string }) => void;

/**
 * Selama render PDF, pratinjau dikembalikan ke skala 100% dan area scroll
 * dikembalikan ke atas agar hasil html2canvas presisi (transform zoom pada
 * ancestor dapat menggeser area capture).
 */
export async function withCaptureStage<T>(run: () => Promise<T>): Promise<T> {
  const root = typeof document !== 'undefined' ? document.documentElement : null;
  const area = document.querySelector<HTMLElement>('.preview-area');
  const scrollBack = { top: area?.scrollTop ?? 0, left: area?.scrollLeft ?? 0 };

  root?.classList.add('is-capturing');
  if (area) {
    area.scrollTop = 0;
    area.scrollLeft = 0;
  }
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve(null))));
  try {
    return await run();
  } finally {
    root?.classList.remove('is-capturing');
    if (area) {
      area.scrollTop = scrollBack.top;
      area.scrollLeft = scrollBack.left;
    }
  }
}

function findPages(key: PageKey): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(`[data-doc-key="${key}"]`));
}

interface RenderTask {
  spec: PageSpec;
  element: HTMLElement;
  indexInDoc: number;
  countInDoc: number;
}

export async function renderPagesToPdf(pages: PageKey[], onProgress?: Progress): Promise<PdfRenderResult> {
  const ordered = PAGE_ORDER.filter((key) => pages.includes(key));
  if (!ordered.length) throw new Error('Pilih minimal satu halaman dokumen untuk disimpan sebagai PDF.');

  const tasks: RenderTask[] = [];
  for (const key of ordered) {
    const spec = PAGE_SPECS[key];
    const elements = findPages(key);
    elements.forEach((element, indexInDoc) => tasks.push({ spec, element, indexInDoc, countInDoc: elements.length }));
  }

  if (!tasks.length) throw new Error('Dokumen belum ditampilkan di layar, muat pratinjau terlebih dahulu.');

  return withCaptureStage(() => renderTasks(tasks, onProgress));
}

async function renderTasks(tasks: RenderTask[], onProgress?: Progress): Promise<PdfRenderResult> {
  const [{ default: html2canvas }, { default: JsPDFCtor }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  const renderedPages: PageKey[] = [];
  const skippedPages: PageKey[] = [];
  let pdf: jsPDFType | null = null;

  for (let i = 0; i < tasks.length; i++) {
    const { spec, element, indexInDoc, countInDoc } = tasks[i];
    const label = countInDoc > 1 ? `${spec.shortLabel} (${indexInDoc + 1}/${countInDoc})` : spec.shortLabel;
    onProgress?.({ index: i + 1, total: tasks.length, label });

    let canvas: HTMLCanvasElement;
    try {
      if (element.clientWidth === 0 || element.clientHeight === 0) {
        throw new Error('dokumen tidak memiliki ukuran untuk dirender');
      }
      const scale = Math.min(2, Math.max(1.25, MAX_SAFE_PX / Math.max(element.scrollHeight, element.clientWidth, 1)));
      canvas = await html2canvas(element, {
        scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });
    } catch (err) {
      // Kalau hanya ada satu halaman dan gagal -> batalkan; kalau tidak, lewati halaman itu
      if (tasks.length === 1) {
        throw new Error(`Gagal merender ${spec.shortLabel}: ${err instanceof Error ? err.message : String(err)}`);
      }
      console.warn(`Halaman "${label}" dilewati:`, err);
      if (!skippedPages.includes(spec.key)) skippedPages.push(spec.key);
      continue;
    }

    const ratio = canvas.height / canvas.width;
    const naturalHeightMm = spec.widthMm * ratio;
    const pageHeightMm = Math.min(Math.max(naturalHeightMm, spec.minHeightMm), spec.maxHeightMm);
    const imageHeightMm = Math.min(naturalHeightMm, pageHeightMm);

    if (!pdf) {
      pdf = new JsPDFCtor({ orientation: 'portrait', unit: 'mm', format: [spec.widthMm, pageHeightMm], compress: true });
    } else {
      pdf.addPage([spec.widthMm, pageHeightMm], 'portrait');
    }

    const imgData = canvas.toDataURL('image/jpeg', 0.94);
    pdf.addImage(imgData, 'JPEG', 0, 0, spec.widthMm, imageHeightMm, `page-${renderedPages.length + 1}`, 'FAST');
    renderedPages.push(spec.key);
  }

  if (!pdf) throw new Error('Tidak ada dokumen yang berhasil dirender menjadi PDF.');
  return { doc: pdf, renderedPages, skippedPages };
}

/** Simpan PDF ke perangkat pengguna (download browser) */
export async function savePagesAsPdf(pages: PageKey[], fileName: string, onProgress?: Progress): Promise<PdfExportResult> {
  const { doc, renderedPages, skippedPages } = await renderPagesToPdf(pages, onProgress);
  doc.save(fileName);
  return { doc, renderedPages, skippedPages, fileName };
}

/** Buat Blob PDF (dipakai unggah Google Drive) */
export async function buildPdfBlob(pages: PageKey[]): Promise<{ blob: Blob; result: PdfRenderResult }> {
  const result = await renderPagesToPdf(pages);
  return { blob: result.doc.output('blob'), result };
}
