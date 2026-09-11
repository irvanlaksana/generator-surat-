/**
 * SISTEM PAYLOAD OTOMATIS
 * ----------------------------------------------------------------------------
 * Satu pipa untuk mengisi form Surat Tugas (LetterData) dan BAST (BastData):
 *
 *   Sumber (input inti / JSON file / teks JSON / link URL #p=...)
 *        │
 *        ▼
 *   parseAutoFillPayload()  → sanitasi whitelist + normalisasi
 *        │
 *        ▼
 *   onApply(payload) di App.tsx (handleApplyToLetter / handleApplyToBast)
 *        │
 *        ▼
 *   Semua form terisi otomatis (kop surat TIDAK PERNAH ikut — fix/terkunci)
 */

import { LetterData, BastData, VehicleType, ItemCondition, ChecklistMap } from '../types';
import { KOP_COMPANY_NAME } from '../data/kopSurat';
import { generateOfficialLetterNumber, previewOfficialLetterNumber } from './letterNumber';
import { formatDateID } from './dateFormatter';

export const PAYLOAD_VERSION = 1;

export interface AutoFillPayload {
  meta?: { app?: string; version?: number; exportedAt?: string };
  letter?: Partial<LetterData>;
  bast?: Partial<BastData>;
}

/* ------------------------------------------------------------------ */
/* Whitelist key — field yang BOLEH diisi otomatis                     */
/* (field kop* sengaja TIDAK ada: kop surat fix & terkunci)            */
/* ------------------------------------------------------------------ */

const LETTER_STRING_KEYS = [
  'letterNumber',
  'assignerName', 'assignerPosition',
  'assigneeName', 'assigneePosition',
  'clientName',
  'customerContract', 'customerName', 'customerAddress', 'customerDueDate',
  'customerInstallment', 'customerTotalInstallment', 'customerPenalty',
  'customerUnpaidInstallmentCount',
  'vehicleBrand', 'vehiclePlate',
  'validFrom', 'validTo', 'signPlaceDate',
] as const;

const BAST_STRING_KEYS = [
  'nomorBast', 'nomorPenyerahan',
  'perusahaan', 'cabang', 'alamat', 'telepon',
  'petugasNama', 'petugasNik', 'petugasJabatan', 'petugasHp',
  'debiturNama', 'debiturNik', 'debiturAlamat', 'debiturHp',
  'nomorKontrak', 'krediturLeasing',
  'kendaraanMerk', 'kendaraanType', 'kendaraanTahun', 'kendaraanWarna',
  'kendaraanNoPol', 'kendaraanNoRangka', 'kendaraanNoMesin',
  'kendaraanBpkb', 'kendaraanStnk', 'kendaraanOdometer', 'kendaraanBahanBakar',
  'kendaraanKondisiMesin', 'kendaraanKondisiBodi',
  'kota', 'tanggal',
  'saksi1Nama', 'saksi1Jabatan', 'saksi2Nama', 'saksi2Jabatan',
  'catatanKhusus',
] as const;

const VALID_CONDITIONS: readonly ItemCondition[] = ['baik', 'rusak', 'tidak_ada', ''];

/** Buang semua nilai kosong (supaya payload tidak menimpa data lama dengan blank). */
export function cleanPartial<T extends object>(input: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (v === undefined || v === null) continue;
    if (typeof v === 'string' && v.trim() === '') continue;
    out[k] = v;
  }
  return out as T;
}

function pickStrings<T extends object>(source: unknown, keys: readonly string[]): Partial<T> {
  const out: Record<string, unknown> = {};
  if (typeof source !== 'object' || source === null) return out as Partial<T>;
  const src = source as Record<string, unknown>;
  for (const key of keys) {
    const v = src[key];
    if (typeof v === 'string' && v.trim() !== '') out[key] = v;
  }
  return out as Partial<T>;
}

function sanitizeChecklist(value: unknown): ChecklistMap {
  if (typeof value !== 'object' || value === null) return {};
  const out: ChecklistMap = {};
  for (const [id, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof raw !== 'object' || raw === null) continue;
    const item = raw as Record<string, unknown>;
    const entry: { status: ItemCondition; statusPihak2?: ItemCondition; catatan?: string } = {
      status: VALID_CONDITIONS.includes(item.status as ItemCondition) ? (item.status as ItemCondition) : 'baik',
    };
    if (VALID_CONDITIONS.includes(item.statusPihak2 as ItemCondition)) {
      entry.statusPihak2 = item.statusPihak2 as ItemCondition;
    }
    if (typeof item.catatan === 'string' && item.catatan.trim()) entry.catatan = item.catatan;
    out[id] = entry;
  }
  return out;
}

/** Sanitasi bagian Surat Tugas — hanya field whitelist yang lolos (kop tidak pernah). */
export function sanitizeLetterPayload(source: unknown): Partial<LetterData> {
  return pickStrings<LetterData>(source, LETTER_STRING_KEYS);
}

/** Sanitasi bagian BAST — string whitelist + jenis + checklist. */
export function sanitizeBastPayload(source: unknown): Partial<BastData> {
  if (typeof source !== 'object' || source === null) return {};
  const src = source as Record<string, unknown>;
  const out: Partial<BastData> = pickStrings<BastData>(src, BAST_STRING_KEYS);
  if (src.jenis === 'roda2' || src.jenis === 'roda4') out.jenis = src.jenis;
  if (src.checklist && typeof src.checklist === 'object') {
    const checklist = sanitizeChecklist(src.checklist);
    if (Object.keys(checklist).length) out.checklist = checklist;
  }
  return out;
}

/**
 * Parser aman: terima object JS, string JSON, format {letter, bast}
 * maupun flat (langsung field surat tugas). Tidak pernah throw.
 */
export function parseAutoFillPayload(raw: unknown): { payload: AutoFillPayload; warnings: string[] } {
  const warnings: string[] = [];

  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      return { payload: {}, warnings: ['Teks bukan JSON yang valid.'] };
    }
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { payload: {}, warnings: ['Format payload tidak dikenali.'] };
  }

  const obj = raw as Record<string, unknown>;
  const wrapped = 'letter' in obj || 'bast' in obj;
  const letterSource: unknown = wrapped ? obj.letter : obj;
  const bastSource: unknown = wrapped ? obj.bast : undefined;

  const letter = sanitizeLetterPayload(letterSource);
  const bast = bastSource ? sanitizeBastPayload(bastSource) : {};

  if (letterSource && typeof letterSource === 'object' && !Array.isArray(letterSource)) {
    const skipped = Object.keys(letterSource as object).length - Object.keys(letter).length;
    if (skipped > 0) {
      warnings.push(`${skipped} field Surat Tugas diabaikan (tidak dikenal atau terkunci, mis. kop surat & foto).`);
    }
  }
  if (bastSource && typeof bastSource === 'object' && !Array.isArray(bastSource)) {
    const skipped = Object.keys(bastSource as object).length - Object.keys(bast).length;
    if (skipped > 0) warnings.push(`${skipped} field BAST diabaikan (tidak dikenal).`);
  }
  if (!Object.keys(letter).length && !Object.keys(bast).length) {
    warnings.push('Payload tidak berisi data yang bisa diterapkan.');
  }

  const meta = typeof obj.meta === 'object' && obj.meta !== null
    ? (obj.meta as AutoFillPayload['meta'])
    : undefined;

  return { payload: { ...(meta ? { meta } : {}), letter, bast }, warnings };
}

/* ------------------------------------------------------------------ */
/* Input inti → payload lengkap (field lain di-generate otomatis)      */
/* ------------------------------------------------------------------ */

export interface CoreInput {
  kota?: string;
  /** YYYY-MM-DD (default: hari ini) */
  tanggal?: string;
  debiturNama?: string;
  debiturAlamat?: string;
  nomorKontrak?: string;
  kendaraanMerk?: string;
  kendaraanType?: string;
  kendaraanNoPol?: string;
  jenisKendaraan?: VehicleType | '';
  /** default true — generate nomor ST/BAST/SPK berurutan */
  autoNomor?: boolean;
}

export interface CorePreview {
  tanggalID: string;
  signPlaceDate: string;
  letterNumber: string;
  nomorBast: string;
  nomorPenyerahan: string;
}

export function toLocalISO(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
}

function joinVehicle(merk?: string, type?: string): string {
  return [merk, type].map((s) => (s || '').trim()).filter(Boolean).join(' / ');
}

/** Pratinjau hasil otomatis (nomor dilihat tanpa menambah counter). */
export function buildCorePreview(core: CoreInput): CorePreview {
  const date = core.tanggal ? parseISODate(core.tanggal) : new Date();
  const tanggalID = formatDateID(toLocalISO(date));
  const kota = (core.kota || '').trim() || 'Purwokerto';
  return {
    tanggalID,
    signPlaceDate: `${kota}, ${tanggalID}`,
    letterNumber: previewOfficialLetterNumber({ type: 'ST', companyName: KOP_COMPANY_NAME, date }),
    nomorBast: previewOfficialLetterNumber({ type: 'BAST', companyName: KOP_COMPANY_NAME, date }),
    nomorPenyerahan: previewOfficialLetterNumber({ type: 'SPK', companyName: KOP_COMPANY_NAME, date }),
  };
}

/** Input minimal → payload untuk KEDUA dokumen sekaligus. */
export function buildPayloadFromCore(core: CoreInput): AutoFillPayload {
  const autoNomor = core.autoNomor !== false;
  const date = core.tanggal ? parseISODate(core.tanggal) : new Date();
  const preview = buildCorePreview(core);
  const vehicleBrand = joinVehicle(core.kendaraanMerk, core.kendaraanType);

  const letter = cleanPartial<Partial<LetterData>>({
    customerName: core.debiturNama,
    customerAddress: core.debiturAlamat,
    customerContract: core.nomorKontrak,
    vehicleBrand: vehicleBrand || undefined,
    vehiclePlate: core.kendaraanNoPol,
    signPlaceDate: preview.signPlaceDate,
    ...(autoNomor
      ? { letterNumber: generateOfficialLetterNumber({ type: 'ST', companyName: KOP_COMPANY_NAME, date }) }
      : {}),
  });

  const bast = cleanPartial<Partial<BastData>>({
    perusahaan: KOP_COMPANY_NAME,
    debiturNama: core.debiturNama,
    debiturAlamat: core.debiturAlamat,
    nomorKontrak: core.nomorKontrak,
    kendaraanMerk: core.kendaraanMerk,
    kendaraanType: core.kendaraanType,
    kendaraanNoPol: core.kendaraanNoPol,
    kota: core.kota,
    tanggal: preview.tanggalID,
    ...(core.jenisKendaraan ? { jenis: core.jenisKendaraan as VehicleType } : {}),
    ...(autoNomor
      ? {
          nomorBast: generateOfficialLetterNumber({ type: 'BAST', companyName: KOP_COMPANY_NAME, date }),
          nomorPenyerahan: generateOfficialLetterNumber({ type: 'SPK', companyName: KOP_COMPANY_NAME, date }),
        }
      : {}),
  });

  return { letter, bast };
}

/* ------------------------------------------------------------------ */
/* Pre-fill via URL  (#p=... atau ?p=...)                              */
/* ------------------------------------------------------------------ */

export function encodePayloadToParam(payload: AutoFillPayload): string {
  const json = JSON.stringify(payload);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function decodePayloadFromParam(param: string): AutoFillPayload | null {
  try {
    let b64 = param.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4 !== 0) b64 += '=';
    const json = decodeURIComponent(escape(atob(b64)));
    const { payload } = parseAutoFillPayload(json);
    const hasData =
      Object.keys(payload.letter ?? {}).length + Object.keys(payload.bast ?? {}).length > 0;
    return hasData ? payload : null;
  } catch {
    return null;
  }
}

/** Baca payload dari URL saat aplikasi dibuka; bersihkan URL setelah diterapkan. */
export function readAutoFillPayloadFromLocation(): AutoFillPayload | null {
  try {
    const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
    const fromHash = new URLSearchParams(hash).get('p');
    const fromQuery = new URLSearchParams(window.location.search).get('p');
    const raw = fromHash || fromQuery;
    if (!raw) return null;

    const payload = decodePayloadFromParam(raw);
    if (payload) {
      const url = new URL(window.location.href);
      url.searchParams.delete('p');
      if (fromHash) url.hash = '';
      window.history.replaceState(null, '', url.pathname + (url.search || '') + (url.hash || ''));
    }
    return payload;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Export / Import file JSON                                           */
/* ------------------------------------------------------------------ */

/** Snapshot data form saat ini → payload JSON (kop & foto tidak ikut). */
export function buildExportPayload(letter: LetterData, bast: BastData): AutoFillPayload {
  return {
    meta: { app: 'generator-surat', version: PAYLOAD_VERSION, exportedAt: new Date().toISOString() },
    letter: sanitizeLetterPayload(letter),
    bast: sanitizeBastPayload(bast),
  };
}

export function downloadPayloadJson(payload: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function readAutoFillPayloadFile(
  file: File
): Promise<{ payload: AutoFillPayload; warnings: string[] }> {
  const text = await file.text();
  try {
    return parseAutoFillPayload(JSON.parse(text));
  } catch {
    return { payload: {}, warnings: ['File bukan JSON yang valid.'] };
  }
}
