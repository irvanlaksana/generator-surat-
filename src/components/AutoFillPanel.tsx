import React, { useMemo, useRef, useState } from 'react';
import {
  X, Zap, ArrowRight, ArrowLeft, FileDown, Link2, UploadCloud,
  Lock, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { LetterData, BastData, VehicleType } from '../types';
import { FIELD_MAPPINGS } from '../utils/crossMapper';
import { KOP_IMAGE_FIX, KOP_COMPANY_NAME } from '../data/kopSurat';
import {
  AutoFillPayload, CoreInput, buildCorePreview, buildPayloadFromCore,
  encodePayloadToParam, buildExportPayload, downloadPayloadJson,
  readAutoFillPayloadFile, parseAutoFillPayload, toLocalISO,
} from '../utils/payload';

interface AutoFillPanelProps {
  isOpen: boolean;
  onClose: () => void;
  letterData: LetterData;
  bastData: BastData;
  onApply: (payload: AutoFillPayload) => void;
  onSyncToBast: () => void;
  onSyncToLetter: () => void;
}

const inputClass =
  'w-full px-2.5 py-1.5 border border-slate-300 bg-white rounded-lg focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40] outline-none transition-all text-slate-800 placeholder:text-slate-400 text-xs shadow-2xs';
const labelClass = 'block text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-0.5';

const btnPrimary =
  'w-full flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#5A5A40] hover:bg-[#484833] text-white rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95';
const btnWhite =
  'flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-[#D1D1CA] rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95';
const btnDark =
  'w-full flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';

type CoreFormState = Required<Omit<CoreInput, 'jenisKendaraan' | 'autoNomor'>> & {
  jenisKendaraan: VehicleType | '';
  autoNomor: boolean;
};

const initialCore: CoreFormState = {
  kota: 'Purwokerto',
  tanggal: toLocalISO(new Date()),
  debiturNama: '',
  debiturAlamat: '',
  nomorKontrak: '',
  kendaraanMerk: '',
  kendaraanType: '',
  kendaraanNoPol: '',
  jenisKendaraan: '',
  autoNomor: true,
};

export default function AutoFillPanel({
  isOpen,
  onClose,
  letterData,
  bastData,
  onApply,
  onSyncToBast,
  onSyncToLetter,
}: AutoFillPanelProps) {
  const [core, setCore] = useState<CoreFormState>(initialCore);
  const [jsonText, setJsonText] = useState('');
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const preview = useMemo(() => buildCorePreview(core), [core]);

  if (!isOpen) return null;

  const setField = (key: keyof CoreFormState, value: string | boolean) => {
    setCore((c) => ({ ...c, [key]: value }));
  };

  const payloadHasData = (p: AutoFillPayload) =>
    Object.keys(p.letter ?? {}).length + Object.keys(p.bast ?? {}).length > 0;

  /* ---------- 1. Input inti → semua form ---------- */
  const handleApplyCore = () => {
    const payload = buildPayloadFromCore(core);
    if (!payloadHasData(payload)) {
      setStatus({ ok: false, text: 'Isi minimal satu field (nama debitur / kontrak / kendaraan).' });
      return;
    }
    onApply(payload);
    onClose();
  };

  /* ---------- 2. Sinkron antar dokumen ---------- */
  const handleSync = (direction: 'toBast' | 'toLetter') => {
    if (direction === 'toBast') onSyncToBast();
    else onSyncToLetter();
    setStatus({
      ok: true,
      text:
        direction === 'toBast'
          ? 'Data Surat Tugas disalin ke form BAST (hanya field yang terisi).'
          : 'Data BAST disalin ke form Surat Tugas (hanya field yang terisi).',
    });
  };

  /* ---------- 3. Export / Import / Link ---------- */
  const handleExport = () => {
    const slug =
      (letterData.customerName || 'debitur')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'debitur';
    downloadPayloadJson(
      buildExportPayload(letterData, bastData),
      `payload-${slug}-${toLocalISO(new Date())}.json`
    );
    setStatus({ ok: true, text: 'Payload JSON diunduh (kop surat & foto tidak ikut).' });
  };

  const handleCopyLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}#p=${encodePayloadToParam(
      buildExportPayload(letterData, bastData)
    )}`;
    try {
      await navigator.clipboard.writeText(url);
      setStatus({ ok: true, text: 'Link pre-fill disalin! Buka link itu di browser mana pun — form langsung terisi otomatis.' });
    } catch {
      setStatus({ ok: false, text: 'Browser memblokir clipboard. Link dicetak di console (F12).' });
      console.info('[Generator Surat] Link pre-fill:', url);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { payload, warnings } = await readAutoFillPayloadFile(file);
    if (!payloadHasData(payload)) {
      setStatus({ ok: false, text: warnings.join(' ') || 'Payload kosong / tidak valid.' });
    } else if (warnings.length) {
      onApply(payload);
      setStatus({ ok: true, text: `Payload diterapkan. Catatan: ${warnings.join(' ')}` });
      window.setTimeout(onClose, 2200);
    } else {
      onApply(payload);
      onClose();
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleApplyJsonText = () => {
    const { payload, warnings } = parseAutoFillPayload(jsonText);
    if (!payloadHasData(payload)) {
      setStatus({ ok: false, text: warnings.join(' ') || 'Payload kosong / tidak valid.' });
      return;
    }
    if (warnings.length) {
      onApply(payload);
      setStatus({ ok: true, text: `Payload diterapkan. Catatan: ${warnings.join(' ')}` });
      window.setTimeout(onClose, 2200);
    } else {
      onApply(payload);
      onClose();
    }
  };

  const sectionClass = 'bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2.5';
  const headingClass =
    'text-xs font-bold text-slate-800 pb-1.5 border-b border-slate-100 uppercase tracking-wider';

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-3 print:hidden"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-[#F5F5F0] rounded-2xl border border-[#D1D1CA] shadow-2xl custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#5A5A40] text-white px-4 py-3 flex items-center justify-between rounded-t-2xl shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="bg-white/15 p-1.5 rounded-lg">
              <Zap size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold leading-tight">Payload Otomatis</h2>
              <p className="text-[10.5px] text-white/70 leading-tight">
                Isi cepat kedua dokumen · sinkron antar form · pindah data via JSON / link
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/15 transition cursor-pointer"
            title="Tutup"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-3.5 space-y-3.5">
          {/* Banner kop fix */}
          <div className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-xl p-2.5">
            <img
              src={KOP_IMAGE_FIX}
              alt="Kop surat fix"
              className="h-10 w-auto rounded border border-slate-200 bg-white shrink-0"
            />
            <div className="flex items-start gap-1.5 text-[10.5px] text-slate-600 leading-snug">
              <Lock size={12} className="mt-0.5 shrink-0 text-[#5A5A40]" />
              <span>
                <strong className="text-slate-800">{KOP_COMPANY_NAME}</strong> — kop surat{' '}
                <strong>fix &amp; terkunci</strong>. Payload apa pun (JSON, link, sinkronisasi) tidak akan
                pernah mengubah kop.
              </span>
            </div>
          </div>

          {/* 1. Input data inti */}
          <section className={sectionClass}>
            <h3 className={headingClass}>1 · Isi Data Inti (Otomatis)</h3>
            <p className="text-[10.5px] text-slate-500 leading-snug">
              Isi beberapa field utama saja — nomor surat, tanggal, dan data debitur/kendaraan langsung
              ter-generate untuk <strong>Surat Tugas + BAST + Surat Penyerahan</strong> sekaligus.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>Kota</label>
                <input
                  type="text"
                  value={core.kota}
                  onChange={(e) => setField('kota', e.target.value)}
                  className={inputClass}
                  placeholder="Purwokerto"
                />
              </div>
              <div>
                <label className={labelClass}>Tanggal</label>
                <input
                  type="date"
                  value={core.tanggal}
                  onChange={(e) => setField('tanggal', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Nama Debitur</label>
                <input
                  type="text"
                  value={core.debiturNama}
                  onChange={(e) => setField('debiturNama', e.target.value)}
                  className={inputClass}
                  placeholder="Nama lengkap sesuai KTP"
                />
              </div>
              <div>
                <label className={labelClass}>No. Kontrak</label>
                <input
                  type="text"
                  value={core.nomorKontrak}
                  onChange={(e) => setField('nomorKontrak', e.target.value)}
                  className={inputClass}
                  placeholder="00730191"
                />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Alamat Debitur</label>
                <textarea
                  rows={2}
                  value={core.debiturAlamat}
                  onChange={(e) => setField('debiturAlamat', e.target.value)}
                  className={inputClass}
                  placeholder="RT/RW, Desa, Kecamatan, Kabupaten"
                />
              </div>
              <div>
                <label className={labelClass}>Merk Kendaraan</label>
                <input
                  type="text"
                  value={core.kendaraanMerk}
                  onChange={(e) => setField('kendaraanMerk', e.target.value)}
                  className={inputClass}
                  placeholder="YAMAHA"
                />
              </div>
              <div>
                <label className={labelClass}>Tipe Kendaraan</label>
                <input
                  type="text"
                  value={core.kendaraanType}
                  onChange={(e) => setField('kendaraanType', e.target.value)}
                  className={inputClass}
                  placeholder="VIXION 150"
                />
              </div>
              <div>
                <label className={labelClass}>No. Polisi</label>
                <input
                  type="text"
                  value={core.kendaraanNoPol}
                  onChange={(e) => setField('kendaraanNoPol', e.target.value)}
                  className={inputClass}
                  placeholder="R 4088 YV"
                />
              </div>
              <div>
                <label className={labelClass}>Jenis (untuk BAST)</label>
                <select
                  value={core.jenisKendaraan}
                  onChange={(e) => setField('jenisKendaraan', e.target.value)}
                  className={inputClass}
                >
                  <option value="">Jangan ubah</option>
                  <option value="roda4">Roda 4 (mobil)</option>
                  <option value="roda2">Roda 2 (motor)</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-1.5 text-[10.5px] font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={core.autoNomor}
                onChange={(e) => setField('autoNomor', e.target.checked)}
                className="accent-[#5A5A40]"
              />
              Generate nomor surat otomatis (berurutan 001, 002, 003, …)
            </label>

            {/* Pratinjau hasil otomatis */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[10.5px] font-mono space-y-1">
              <div>
                <span className="text-slate-400">No. Surat Tugas:</span>{' '}
                <strong className="text-slate-800">{preview.letterNumber}</strong>
              </div>
              <div>
                <span className="text-slate-400">No. BAST:</span>{' '}
                <strong className="text-slate-800">{preview.nomorBast}</strong>
              </div>
              <div>
                <span className="text-slate-400">No. Surat Penyerahan:</span>{' '}
                <strong className="text-slate-800">{preview.nomorPenyerahan}</strong>
              </div>
              <div>
                <span className="text-slate-400">Tanda tangan / Tanggal:</span>{' '}
                <strong className="text-slate-800">{preview.signPlaceDate}</strong>
              </div>
            </div>

            <button type="button" className={btnPrimary} onClick={handleApplyCore}>
              <Zap size={13} /> Terapkan ke Kedua Dokumen
            </button>
          </section>

          {/* 2. Hubungkan dokumen */}
          <section className={sectionClass}>
            <h3 className={headingClass}>2 · Hubungkan Dokumen (Sinkron)</h3>
            <p className="text-[10.5px] text-slate-500 leading-snug">
              Salin data antar dokumen — hanya field yang <strong>sudah terisi</strong> yang disalin, jadi
              tidak menimpa dengan nilai kosong. Kop surat tidak ikut (fix).
            </p>
            <div className="flex gap-2">
              <button type="button" className={btnWhite} onClick={() => handleSync('toBast')}>
                <ArrowRight size={13} /> Surat Tugas → BAST
              </button>
              <button type="button" className={btnWhite} onClick={() => handleSync('toLetter')}>
                <ArrowLeft size={13} /> BAST → Surat Tugas
              </button>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1">
              <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-200">
                <span className="w-36 shrink-0">Field</span>
                <span className="flex-1 text-right">Surat Tugas</span>
                <span className="w-3 shrink-0" />
                <span className="flex-1">BAST</span>
              </div>
              {FIELD_MAPPINGS.map((m) => (
                <div key={m.label} className="flex items-center gap-1.5 text-[10px]">
                  <span className="w-36 shrink-0 font-semibold text-slate-600 truncate">{m.label}</span>
                  <span className="flex-1 truncate text-right text-slate-700" title={String(letterData[m.letter] ?? '')}>
                    {String(letterData[m.letter] ?? '') || <span className="text-slate-300">—</span>}
                  </span>
                  <ArrowRight size={9} className="w-3 shrink-0 text-slate-300" />
                  <span className="flex-1 truncate text-slate-700" title={String(bastData[m.bast] ?? '')}>
                    {String(bastData[m.bast] ?? '') || <span className="text-slate-300">—</span>}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* 3. Payload JSON / Link */}
          <section className={sectionClass}>
            <h3 className={headingClass}>3 · Pindahkan Data (JSON / Link)</h3>
            <div className="flex gap-2">
              <button type="button" className={btnWhite} onClick={handleExport}>
                <FileDown size={13} /> Unduh Payload JSON
              </button>
              <button type="button" className={btnWhite} onClick={handleCopyLink}>
                <Link2 size={13} /> Salin Link Pre-fill
              </button>
            </div>
            <p className="text-[10px] text-slate-500 leading-snug">
              Link pre-fill berisi data kedua dokumen (kop &amp; foto tidak ikut). Dibuka di browser mana
              pun → semua form langsung terisi otomatis.
            </p>
            <div className="space-y-1.5 pt-1 border-t border-slate-100">
              <label className={labelClass}>Impor Payload (File JSON atau Tempel)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleImportFile}
                className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[11px] file:font-bold file:bg-[#5A5A40] file:text-white hover:file:bg-[#484833] transition cursor-pointer"
              />
              <textarea
                rows={3}
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder={'{"letter": {"customerName": "..."}, "bast": {"debiturNama": "..."}}'}
                className={inputClass + ' font-mono'}
              />
              <button
                type="button"
                className={btnDark}
                onClick={handleApplyJsonText}
                disabled={!jsonText.trim()}
              >
                <UploadCloud size={13} /> Terapkan Payload dari Teks
              </button>
            </div>
          </section>

          {/* Status */}
          {status && (
            <div
              className={`flex items-start gap-1.5 text-[11px] font-semibold rounded-lg p-2 border ${
                status.ok
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {status.ok ? (
                <CheckCircle2 size={13} className="mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle size={13} className="mt-0.5 shrink-0" />
              )}
              <span>{status.text}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
