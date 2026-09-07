import React, { useCallback, useContext, useMemo, useState } from 'react';
import type { ChecklistMap, DocData, NumberDataKey, StringDataKey, VehicleType } from '../../types';
import type { FieldIssue } from '../../utils/validation';
import { cx, Field, InlineLink, MiniBtn, Notice, SectionCard, Segmented, Select, Slider, TextArea, TextInput } from '../ui';
import { DocumentUploader, ChecklistEditor } from './parts';
import { syncChecklist } from '../../data/checklist';
import { extractNumber, formatRupiah, formatTanggalId, normalizeText, todayIso } from '../../utils/format';
import { buildPdfFileName, deriveKabupaten, deriveKecamatan, getInisialKreditur } from '../../utils/filename';
import { generateOfficialLetterNumber, type OfficialLetterType } from '../../utils/letterNumber';
import { readImageFile, UploadError } from '../../utils/image';
import { Bike, Car, Image as ImageIcon, MapPin, RotateCcw, Sparkles, Trash2, UploadCloud, Wand2 } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* SATU urutan form untuk seluruh dokumen (Surat Tugas, Penyerahan, BAST,      */
/* Lampiran) — tidak ada pemisahan form per jenis dokumen.                      */
/* -------------------------------------------------------------------------- */

export interface FormSection {
  id: string;
  label: string;
  title: string;
  fields: string[];
}

export const FORM_SECTIONS: FormSection[] = [
  {
    id: 's-debitur',
    label: 'Debitur & Kreditur',
    title: 'Identitas Debitur & Kreditur',
    fields: ['namaDebitur', 'nikDebitur', 'alamatDebitur', 'kecamatan', 'kabupaten', 'hpDebitur', 'nomorKontrak', 'namaKreditur', 'inisialKreditur'],
  },
  {
    id: 's-nomor',
    label: 'Nomor Surat',
    title: 'Nomor Surat, Tanggal & Masa Berlaku',
    fields: ['nomorSuratTugas', 'nomorBast', 'nomorPenyerahan', 'tanggalSurat', 'masaBerlakuMulai', 'masaBerlakuSampai', 'tempatTanggalTtd'],
  },
  {
    id: 's-angsuran',
    label: 'Angsuran',
    title: 'Angsuran, Jatuh Tempo, Tunggakan & Denda',
    fields: ['nomorAngsuran', 'nilaiAngsuran', 'jatuhTempo', 'totalTunggakan', 'denda', 'keteranganAngsuran'],
  },
  {
    id: 's-kop',
    label: 'Kop Surat',
    title: 'Kop Surat, Pengaturan & Perusahaan',
    fields: ['kopImage', 'namaPerusahaan', 'cabang', 'alamatPerusahaan', 'teleponPerusahaan'],
  },
  {
    id: 's-berkas',
    label: 'Berkas (KTP/STNK)',
    title: 'Berkas Pendukung: KTP, STNK, BPKB, Foto Unit',
    fields: ['dokumen'],
  },
  {
    id: 's-kendaraan',
    label: 'Unit Kendaraan',
    title: 'Identitas & Kondisi Kendaraan',
    fields: ['kendaraanMerk', 'kendaraanType', 'kendaraanNoPol', 'kendaraanTahun', 'kendaraanWarna', 'kendaraanNoRangka', 'kendaraanNoMesin', 'kendaraanOdometer'],
  },
  {
    id: 's-petugas',
    label: 'Petugas',
    title: 'Pemberi & Penerima Tugas',
    fields: ['namaPemberiTugas', 'jabatanPemberiTugas', 'namaPetugas', 'nikPetugas', 'jabatanPetugas', 'hpPetugas'],
  },
  {
    id: 's-checklist',
    label: 'Checklist Unit',
    title: 'Checklist Kondisi Fisik Unit',
    fields: ['checklist'],
  },
  {
    id: 's-ttd',
    label: 'TTD & Saksi',
    title: 'Tempat, Tanggal, Saksi & Catatan',
    fields: ['kota', 'tanggalPenyerahan', 'saksi1Nama', 'saksi1Jabatan', 'saksi2Nama', 'saksi2Jabatan', 'catatanKhusus'],
  },
];

const FIELD_SECTION: Record<string, string> = FORM_SECTIONS.reduce<Record<string, string>>((acc, section) => {
  for (const field of section.fields) acc[field] = section.id;
  return acc;
}, {});

export function sectionOfField(field: string): string | undefined {
  return FIELD_SECTION[field];
}

export function focusField(field: string) {
  const target =
    document.querySelector<HTMLElement>(`[data-field="${field}"]`) ?? document.getElementById(`f-${field}`);
  if (!target) return;
  const section = sectionOfField(field);
  if (section) document.getElementById(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  if (typeof (target as HTMLInputElement).focus === 'function') {
    (target as HTMLInputElement).focus({ preventScroll: true });
  }
}

/* ------------------------------- konteks form ---------------------------- */

interface FieldState {
  state: 'error' | 'warning' | null;
  message?: string;
  required: boolean;
}

interface FormContextValue {
  data: DocData;
  onChange: (patch: Partial<DocData>) => void;
  setText: (key: StringDataKey, value: string) => void;
  setNumber: (key: NumberDataKey, value: number) => void;
  setChecklist: (next: ChecklistMap) => void;
  stateOf: (field: string) => FieldState;
}

const FormContext = React.createContext<FormContextValue | null>(null);

function useForm(): FormContextValue {
  const ctx = useContext(FormContext);
  if (!ctx) throw new Error('Form field dipakai di luar DataForm');
  return ctx;
}

/* --------------------------- field dengan label -------------------------- */

interface BaseFieldProps {
  name: StringDataKey;
  label: string;
  span?: 1 | 2;
  hint?: string;
  action?: React.ReactNode;
}

function TextField({
  name,
  label,
  span = 1,
  hint,
  action,
  placeholder,
  transform,
  maxLength,
  type = 'text',
  inputMode,
}: BaseFieldProps & {
  placeholder?: string;
  transform?: 'upper' | 'digits' | 'alpha' | 'rupiah';
  maxLength?: number;
  type?: 'text' | 'date';
  inputMode?: 'numeric' | 'text' | 'decimal';
}) {
  const { data, setText, stateOf } = useForm();
  const s = stateOf(name);
  return (
    <Field
      label={label}
      htmlFor={`f-${name}`}
      state={s.state}
      message={s.message}
      required={s.required}
      hint={hint}
      action={action}
      className={span === 2 ? 'col-span-2' : undefined}
    >
      <TextInput
        field={name}
        type={type}
        value={data[name] ?? ''}
        onChange={(v) => setText(name, v)}
        transform={transform}
        state={s.state}
        maxLength={maxLength}
        placeholder={placeholder}
        inputMode={inputMode}
      />
    </Field>
  );
}

function TextAreaField({ name, label, span = 2, rows = 2, placeholder, hint }: BaseFieldProps & { rows?: number; placeholder?: string }) {
  const { data, setText, stateOf } = useForm();
  const s = stateOf(name);
  return (
    <Field
      label={label}
      htmlFor={`f-${name}`}
      state={s.state}
      message={s.message}
      required={s.required}
      hint={hint}
      className={span === 2 ? 'col-span-2' : undefined}
    >
      <TextArea field={name} value={data[name] ?? ''} onChange={(v) => setText(name, v)} rows={rows} state={s.state} placeholder={placeholder} />
    </Field>
  );
}

function GenerateLink({ type }: { type: OfficialLetterType }) {
  const { data, onChange } = useForm();
  const handleClick = () => {
    const value = generateOfficialLetterNumber({
      type,
      companyName: data.namaPerusahaan,
      date: data.tanggalSurat || todayIso(),
    });
    if (type === 'ST') onChange({ nomorSuratTugas: value });
    if (type === 'BAST') onChange({ nomorBast: value });
    if (type === 'SPK') onChange({ nomorPenyerahan: value });
  };
  return (
    <InlineLink onClick={handleClick} title={`Buat nomor ${type} otomatis dari tanggal surat & inisial perusahaan`}>
      <Sparkles size={10} />
      Generate
    </InlineLink>
  );
}

/* --------------------------------- form ---------------------------------- */

interface DataFormProps {
  data: DocData;
  issues: Record<string, FieldIssue[]>;
  completion: { filled: number; total: number; percent: number };
  onChange: (patch: Partial<DocData>) => void;
  onFillSample: () => void;
  onClear: () => void;
}

export default function DataForm({ data, issues, completion, onChange, onFillSample, onClear }: DataFormProps) {
  const [kopBusy, setKopBusy] = useState(false);
  const [kopError, setKopError] = useState<string | null>(null);
  const [kopPreview, setKopPreview] = useState(false);
  const [deriveMsg, setDeriveMsg] = useState<string | null>(null);

  const stateOf = useCallback(
    (field: string): FieldState => {
      const list = issues[field] ?? [];
      const error = list.find((i) => i.level === 'error') ?? null;
      const warning = list.find((i) => i.level === 'warning') ?? null;
      const chosen = error ?? warning;
      return {
        state: error ? 'error' : warning ? 'warning' : null,
        message: chosen?.message,
        required: Boolean(error),
      };
    },
    [issues],
  );

  const ctxValue = useMemo<FormContextValue>(
    () => ({
      data,
      onChange,
      setText: (key, value) => onChange({ [key]: value } as Partial<DocData>),
      setNumber: (key, value) => onChange({ [key]: value } as Partial<DocData>),
      setChecklist: (checklist) => onChange({ checklist }),
      stateOf,
    }),
    [data, onChange, stateOf],
  );

  const generateAll = useCallback(() => {
    const date = data.tanggalSurat || todayIso();
    const patch: Partial<DocData> = {};
    if (!data.nomorSuratTugas.trim()) patch.nomorSuratTugas = generateOfficialLetterNumber({ type: 'ST', companyName: data.namaPerusahaan, date });
    if (!data.nomorBast.trim()) patch.nomorBast = generateOfficialLetterNumber({ type: 'BAST', companyName: data.namaPerusahaan, date });
    if (!data.nomorPenyerahan.trim()) patch.nomorPenyerahan = generateOfficialLetterNumber({ type: 'SPK', companyName: data.namaPerusahaan, date });
    if (Object.keys(patch).length) onChange(patch);
  }, [data.namaPerusahaan, data.nomorBast, data.nomorPenyerahan, data.nomorSuratTugas, data.tanggalSurat, onChange]);

  const syncSignPlace = useCallback(() => {
    const kota = normalizeText(data.kota || 'Purwokerto');
    const tanggal = data.tanggalSurat || data.tanggalPenyerahan || todayIso();
    onChange({ tempatTanggalTtd: `${kota}, ${formatTanggalId(tanggal)}` });
  }, [data.kota, data.tanggalPenyerahan, data.tanggalSurat, onChange]);

  const fillFromAlamat = useCallback(() => {
    const kec = deriveKecamatan(data.alamatDebitur);
    const kab = deriveKabupaten(data.alamatDebitur);
    if (!kec && !kab) {
      setDeriveMsg('Alamat belum memuat nama kecamatan — tulis manual di kolom ini.');
      return;
    }
    setDeriveMsg(null);
    onChange({ kecamatan: kec || data.kecamatan, kabupaten: kab || data.kabupaten });
  }, [data.alamatDebitur, data.kabupaten, data.kecamatan, onChange]);

  const syncInisial = useCallback(() => {
    onChange({ inisialKreditur: getInisialKreditur({ inisialKreditur: '', namaKreditur: data.namaKreditur }) });
  }, [data.namaKreditur, onChange]);

  const setJenis = useCallback(
    (jenis: VehicleType) => onChange({ jenis, checklist: syncChecklist(jenis, data.checklist) }),
    [data.checklist, onChange],
  );

  const handleKopFile = useCallback(
    async (file?: File | null) => {
      if (!file) return;
      setKopBusy(true);
      setKopError(null);
      try {
        const image = await readImageFile(file, 1800, 0.9);
        onChange({ kopImage: image.url, kopImageHeight: Math.min(Math.max(Math.round(image.height * 0.55), 60), 300) });
      } catch (err) {
        setKopError(err instanceof UploadError ? err.message : 'Gambar kop tidak dapat dibaca, coba file JPG/PNG lain.');
      } finally {
        setKopBusy(false);
      }
    },
    [onChange],
  );

  const angsuran = useMemo(() => {
    const nums = (data.nomorAngsuran.match(/\d+/g) ?? []).map(Number);
    const count = nums.length >= 2 ? Math.max(nums[1] - nums[0] + 1, 0) : nums.length === 1 ? 1 : 0;
    const unit = extractNumber(data.nilaiAngsuran) ?? 0;
    return { count, unit, total: count * unit };
  }, [data.nomorAngsuran, data.nilaiAngsuran]);

  const fileNamePreview = useMemo(() => buildPdfFileName(data), [data]);
  const totalSize = useMemo(() => data.dokumen.reduce((sum, doc) => sum + (doc.size || 0), 0), [data.dokumen]);

  return (
    <FormContext.Provider value={ctxValue}>
      <div className="space-y-1.5 pb-8">
        {/* Header: progres + navigasi. Navigasi hanya melompat, isi form tetap satu urutan. */}
        <div className="sticky top-0 z-20 -mx-2.5 space-y-1 border-b border-slate-200 bg-[#EBEBE4]/95 px-2.5 pb-1.5 pt-1 backdrop-blur md:-mx-3 md:px-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-[11px] font-extrabold uppercase tracking-wide text-slate-700">
                Satu Urutan Pengisian Data
              </span>
              <span className="shrink-0 rounded bg-white px-1 py-px text-[9px] font-bold text-slate-500 shadow-2xs">
                {completion.filled}/{completion.total} terisi
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <MiniBtn tone="soft" title="Isi contoh data lengkap untuk mengetes seluruh dokumen" onClick={onFillSample}>
                <Wand2 size={10} />
                Contoh
              </MiniBtn>
              <MiniBtn tone="ghost" title="Kosongkan isian (kop & identitas perusahaan dipertahankan)" onClick={onClear}>
                <RotateCcw size={10} />
                Kosongkan
              </MiniBtn>
            </div>
          </div>

          <div className="h-1 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className={cx('h-full rounded-full transition-all', completion.percent >= 90 ? 'bg-emerald-500' : completion.percent >= 55 ? 'bg-[#5A5A40]' : 'bg-amber-500')}
              style={{ width: `${completion.percent}%` }}
            />
          </div>

          <nav className="flex gap-1 overflow-x-auto pb-0.5 custom-scrollbar" aria-label="Navigasi bagian form">
            {FORM_SECTIONS.map((section, idx) => {
              const sectionIssues = section.fields.flatMap((field) => issues[field] ?? []);
              const errors = sectionIssues.filter((i) => i.level === 'error').length;
              const warnings = sectionIssues.filter((i) => i.level === 'warning').length;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  title={section.title}
                  className={cx(
                    'flex shrink-0 cursor-pointer items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9.5px] font-bold transition',
                    errors
                      ? 'border-rose-300 bg-rose-50 text-rose-700'
                      : warnings
                        ? 'border-amber-300 bg-amber-50 text-amber-700'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300',
                  )}
                >
                  <span className="tabular-nums opacity-60">{idx + 1}.</span>
                  {section.label}
                  {errors > 0 && (
                    <span className="flex h-3 min-w-[12px] items-center justify-center rounded-full bg-rose-600 px-0.5 text-[8px] text-white">{errors}</span>
                  )}
                  {errors === 0 && warnings > 0 && (
                    <span className="flex h-3 min-w-[12px] items-center justify-center rounded-full bg-amber-500 px-0.5 text-[8px] text-white">{warnings}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* ============ 1. DEBITUR & KREDITUR ============ */}
        <SectionCard id={FORM_SECTIONS[0].id} index={1} title={FORM_SECTIONS[0].title} icon={<MapPin size={12} />} tone="accent">
          <div className="grid grid-cols-2 gap-1.5">
            <TextField name="namaDebitur" label="Nama Debitur / Nasabah" transform="upper" placeholder="KISNO ANGKAH TRI HIDAYAT" span={2} hint="Dipakai pada semua dokumen & menjadi nama file PDF" />
            <TextField name="nikDebitur" label="NIK Debitur" transform="digits" maxLength={16} placeholder="3303041508820003" hint="16 digit sesuai KTP" />
            <TextField name="nomorKontrak" label="No. Kontrak / Perjanjian" placeholder="00730191" />
            <TextAreaField name="alamatDebitur" label="Alamat Lengkap Debitur" rows={2} placeholder="Kalikabong RT 004 RW 002, Kalimanah, Purbalingga" />
            <TextField
              name="kecamatan"
              label="Kecamatan"
              transform="upper"
              placeholder="KALIMANAH"
              hint={deriveMsg ?? 'Akhiran nama file PDF'}
              action={
                <InlineLink onClick={fillFromAlamat} title="Ambil kecamatan & kabupaten dari kolom alamat">
                  <Wand2 size={10} />
                  Dari alamat
                </InlineLink>
              }
            />
            <TextField name="kabupaten" label="Kabupaten / Kota" transform="upper" placeholder="PURBALINGGA" />
            <TextField name="hpDebitur" label="No. HP Debitur" placeholder="0857-1234-5678" />
            <TextField name="namaKreditur" label="Kreditur / Leasing / Multifinance" transform="upper" placeholder="Koperasi Anugrah Mega Mandiri (KAMM)" />
            <TextField
              name="inisialKreditur"
              label="Inisial Kreditur"
              transform="alpha"
              maxLength={12}
              placeholder="KAMM"
              hint="Awalan nama file PDF"
              action={
                <InlineLink onClick={syncInisial} title="Buat inisial otomatis dari nama kreditur">
                  <Sparkles size={10} />
                  Otomatis
                </InlineLink>
              }
            />
          </div>
          <Notice tone="info" className="mt-1.5">
            <span className="font-bold">Nama file PDF:</span>{' '}
            <span className="break-all font-mono text-[9.5px]">{fileNamePreview}</span>
            <span className="mt-0.5 block text-[9px] opacity-80">
              Format baku: inisial kreditur - nama debitur - kecamatan. Berlaku untuk tombol Simpan PDF maupun unggah ke Google Drive.
            </span>
          </Notice>
        </SectionCard>

        {/* ============ 2. NOMOR SURAT & TANGGAL ============ */}
        <SectionCard
          id={FORM_SECTIONS[1].id}
          index={2}
          title={FORM_SECTIONS[1].title}
          icon={<Sparkles size={12} />}
          action={
            <MiniBtn tone="olive" onClick={generateAll} title="Isi nomor surat yang masih kosong untuk seluruh dokumen sekaligus">
              <Sparkles size={10} />
              Generate Semua
            </MiniBtn>
          }
        >
          <div className="grid grid-cols-2 gap-1.5">
            <TextField name="nomorSuratTugas" label="No. Surat Tugas" span={2} placeholder="001/ST/MJI/22/VIII/2026" action={<GenerateLink type="ST" />} />
            <TextField name="nomorBast" label="No. BAST" placeholder="001/BAST/MJI/22/VIII/2026" action={<GenerateLink type="BAST" />} />
            <TextField name="nomorPenyerahan" label="No. Surat Penyerahan" placeholder="001/SPK/MJI/22/VIII/2026" action={<GenerateLink type="SPK" />} />
            <TextField name="tanggalSurat" label="Tanggal Surat" type="date" hint="Dasar generate nomor surat" />
            <TextField name="tanggalPenyerahan" label="Tanggal Penyerahan Unit" type="date" />
            <TextField name="masaBerlakuMulai" label="Berlaku Mulai" type="date" />
            <TextField name="masaBerlakuSampai" label="Berlaku Sampai" type="date" />
            <TextField
              name="tempatTanggalTtd"
              label="Tempat & Tanggal Tanda Tangan"
              span={2}
              placeholder="Purwokerto, 22 Agustus 2026"
              action={
                <InlineLink onClick={syncSignPlace} title="Samakan dengan kota dan tanggal surat">
                  <Wand2 size={10} />
                  Samakan
                </InlineLink>
              }
            />
          </div>
          <p className="mt-1 text-[9px] text-slate-400">
            Format nomor: <code className="rounded bg-slate-100 px-1">001/[ST|BAST|SPK]/[inisial]/[tgl]/[bulan romawi]/[tahun]</code>
          </p>
        </SectionCard>

        {/* ============ 3. ANGSURAN ============ */}
        <SectionCard id={FORM_SECTIONS[2].id} index={3} title={FORM_SECTIONS[2].title} icon={<UploadCloud size={12} />}>
          <div className="grid grid-cols-2 gap-1.5">
            <TextField name="nomorAngsuran" label="Nomor Angsuran" placeholder="8 s/d 18" hint="Tunggal: 8 · rentang: 8 s/d 18" />
            <TextField name="nilaiAngsuran" label="Nilai Angsuran / Bulan" transform="rupiah" placeholder="385.000" hint="Titik = ribuan" />
            <TextField name="jatuhTempo" label="Tanggal Jatuh Tempo" type="date" />
            <TextField name="totalTunggakan" label="Total Tunggakan Pokok" transform="rupiah" placeholder="3.850.000" />
            <TextField name="denda" label="Denda / Biaya Lain" transform="rupiah" placeholder="41.692.000" />
            <div className="flex items-end">
              <MiniBtn
                tone="soft"
                className="w-full justify-center py-1.5"
                disabled={!angsuran.total}
                title="Isi total tunggakan dari hitungan jumlah angsuran × nilai angsuran"
                onClick={() => onChange({ totalTunggakan: String(angsuran.total).replace(/\B(?=(\d{3})+(?!\d))/g, '.') })}
              >
                {angsuran.count
                  ? `${angsuran.count} × ${formatRupiah(String(angsuran.unit))} = ${formatRupiah(String(angsuran.total))}`
                  : 'Isi nomor & nilai angsuran dulu'}
              </MiniBtn>
            </div>
            <TextAreaField
              name="keteranganAngsuran"
              label="Keterangan Tunggakan"
              rows={2}
              placeholder="Angsuran ke 8 s/d 18 (10 bulan) sudah melewati jatuh tempo."
            />
          </div>
        </SectionCard>

        {/* ============ 4. KOP SURAT & PERUSAHAAN ============ */}
        <SectionCard
          id={FORM_SECTIONS[3].id}
          index={4}
          title={FORM_SECTIONS[3].title}
          icon={<ImageIcon size={12} />}
          action={
            data.kopImage ? (
              <MiniBtn tone="danger" title="Hapus gambar kop surat" onClick={() => onChange({ kopImage: null })}>
                <Trash2 size={10} />
                Hapus
              </MiniBtn>
            ) : undefined
          }
        >
          <div className="grid grid-cols-2 gap-1.5">
            <TextField name="namaPerusahaan" label="Nama Perusahaan Penerbit" span={2} transform="upper" placeholder="PT. MITRA JASATRIA INDONESIA" />
            <TextField name="cabang" label="Cabang" placeholder="Cabang Purwokerto" />
            <TextField name="teleponPerusahaan" label="Telepon" placeholder="(0281) 634567" />
            <TextAreaField name="alamatPerusahaan" label="Alamat Perusahaan" rows={1} span={2} placeholder="Jl. Gerilya No. 45, Purwokerto Selatan, Banyumas" />
          </div>

          <div className="mt-1.5 rounded-lg border border-slate-200 bg-slate-50/70 p-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-600">Upload Kop Surat &amp; Setting</span>
              <MiniBtn tone="olive" disabled={kopBusy} title="Pilih gambar kop surat (JPG/PNG/WEBP)" onClick={() => document.getElementById('input-kop')?.click()}>
                {kopBusy ? <Loader size={10} /> : <UploadCloud size={10} />}
                {data.kopImage ? 'Ganti' : 'Pilih Gambar'}
              </MiniBtn>
            </div>

            <input
              id="input-kop"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              data-field="kopImage"
              onChange={(e) => void handleKopFile(e.target.files?.[0])}
            />

            {kopError && <p className="mt-1 text-[9.5px] font-semibold text-rose-600">{kopError}</p>}

            {data.kopImage ? (
              <>
                <div
                  className="mt-1.5 overflow-hidden rounded border border-slate-200 bg-white p-1"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    void handleKopFile(e.dataTransfer.files?.[0]);
                  }}
                >
                  <img
                    src={data.kopImage}
                    alt="Pratinjau kop surat"
                    className={cx('mx-auto w-full transition', kopPreview ? 'opacity-40' : '')}
                    style={{ maxHeight: 88, objectFit: 'contain' }}
                  />
                </div>

                <div className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-1.5">
                  <Slider label="Tinggi Kop" field="kopImageHeight" value={data.kopImageHeight} min={40} max={320} onChange={(v) => ctxValue.setNumber('kopImageHeight', v)} />
                  <Slider label="Jarak ke Isi" field="kopMarginBottom" value={data.kopMarginBottom} min={-30} max={140} onChange={(v) => ctxValue.setNumber('kopMarginBottom', v)} />
                  <Slider label="Geser Vertikal" field="kopOffsetY" value={data.kopOffsetY} min={-60} max={80} onChange={(v) => ctxValue.setNumber('kopOffsetY', v)} />
                  <Field label="Skala Gambar" htmlFor="f-kopImageFit">
                    <Select
                      field="kopImageFit"
                      value={data.kopImageFit}
                      onChange={(v) => onChange({ kopImageFit: v as DocData['kopImageFit'] })}
                      options={[
                        { value: 'contain', label: 'Contain (utuh)' },
                        { value: 'cover', label: 'Cover (penuh)' },
                        { value: 'fill', label: 'Fill (regang)' },
                      ]}
                    />
                  </Field>
                  <Field label="Posisi Kop" htmlFor="f-kopImageAlign">
                    <Select
                      field="kopImageAlign"
                      value={data.kopImageAlign}
                      onChange={(v) => onChange({ kopImageAlign: v as DocData['kopImageAlign'] })}
                      options={[
                        { value: 'center', label: 'Tengah' },
                        { value: 'left', label: 'Kiri' },
                        { value: 'right', label: 'Kanan' },
                      ]}
                    />
                  </Field>
                  <label className="flex cursor-pointer items-center gap-1 text-[9.5px] font-bold text-slate-500">
                    <input type="checkbox" checked={kopPreview} onChange={(e) => setKopPreview(e.target.checked)} className="h-3 w-3 accent-[#5A5A40]" />
                    Pratinjau transparan
                  </label>
                </div>
              </>
            ) : (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  void handleKopFile(e.dataTransfer.files?.[0]);
                }}
                onClick={() => document.getElementById('input-kop')?.click()}
                className="mt-1.5 cursor-pointer rounded border border-dashed border-slate-300 bg-white px-2 py-3 text-center transition hover:border-[#5A5A40]"
              >
                <p className="text-[10px] font-bold text-slate-600">Letakkan / pilih file kop surat</p>
                <p className="mt-0.5 text-[9px] text-slate-400">JPG, PNG, atau WEBP maks. 6 MB. Bila kosong, kop teks perusahaan yang dipakai.</p>
              </div>
            )}
          </div>
        </SectionCard>

        {/* ============ 5. BERKAS PENDUKUNG ============ */}
        <SectionCard
          id={FORM_SECTIONS[4].id}
          index={5}
          title={FORM_SECTIONS[4].title}
          icon={<UploadCloud size={12} />}
          action={totalSize > 0 ? <span className="text-[9px] font-bold text-slate-400">± {(totalSize / 1024 / 1024).toFixed(1)} MB</span> : undefined}
        >
          <DocumentUploader dokumen={data.dokumen} onChange={(dokumen) => onChange({ dokumen })} issues={issues['dokumen'] ?? []} />
        </SectionCard>

        {/* ============ 6. DATA KENDARAAN ============ */}
        <SectionCard
          id={FORM_SECTIONS[5].id}
          index={6}
          title={FORM_SECTIONS[5].title}
          icon={data.jenis === 'roda4' ? <Car size={12} /> : <Bike size={12} />}
          action={
            <div className="w-[128px]">
              <Segmented<VehicleType>
                field="jenis"
                size="sm"
                value={data.jenis}
                onChange={setJenis}
                options={[
                  { value: 'roda2', label: 'Roda 2', icon: <Bike size={11} /> },
                  { value: 'roda4', label: 'Roda 4', icon: <Car size={11} /> },
                ]}
              />
            </div>
          }
        >
          <div className="grid grid-cols-2 gap-1.5">
            <TextField name="kendaraanMerk" label="Merk Kendaraan" transform="upper" placeholder="YAMAHA" />
            <TextField name="kendaraanType" label="Tipe / Model" transform="upper" placeholder="VIXION 150 DOHC" />
            <TextField name="kendaraanNoPol" label="Nomor Polisi" transform="upper" placeholder="R 4088 YV" hint="Format: R 4088 YV" />
            <TextField name="kendaraanTahun" label="Tahun" transform="digits" maxLength={4} placeholder="2022" />
            <TextField name="kendaraanWarna" label="Warna" placeholder="Merah Doff" />
            <TextField name="kendaraanOdometer" label="Odometer (KM)" placeholder="22.400 KM" />
            <TextField name="kendaraanNoRangka" label="Nomor Rangka" transform="upper" placeholder="MH3RG1210NK049182" />
            <TextField name="kendaraanNoMesin" label="Nomor Mesin" transform="upper" placeholder="G3E4E-0849201" />
            <TextField name="kendaraanStnk" label="Kelengkapan STNK" placeholder="Ada (Pajak s/d Nov 2026)" />
            <TextField name="kendaraanBpkb" label="Status BPKB" placeholder="Dalam jaminan kreditur" />
            <TextField name="kendaraanBahanBakar" label="Posisi Bahan Bakar" placeholder="3/4 Bar" />
            <TextField name="kendaraanKondisiMesin" label="Kondisi Mesin" placeholder="Halus, starter normal" />
            <TextAreaField name="kendaraanKondisiBodi" label="Catatan Kondisi Bodi / Eksterior" rows={2} placeholder="Lecet halus pada cover knalpot dan spion kanan." />
          </div>
        </SectionCard>

        {/* ============ 7. PEMBERI & PENERIMA TUGAS ============ */}
        <SectionCard id={FORM_SECTIONS[6].id} index={7} title={FORM_SECTIONS[6].title} icon={<MapPin size={12} />}>
          <div className="grid grid-cols-2 gap-1.5">
            <TextField name="namaPemberiTugas" label="Nama Pemberi Tugas" transform="upper" placeholder="FILEMO HALAWA" />
            <TextField name="jabatanPemberiTugas" label="Jabatan Pemberi Tugas" placeholder="Direktur" />
            <TextField name="namaPetugas" label="Nama Petugas (Penerima Tugas)" transform="upper" placeholder="RIZKY JUANDA SAPUTRA" />
            <TextField name="nikPetugas" label="NIK Petugas" transform="digits" maxLength={16} placeholder="3302242201940001" />
            <TextField name="jabatanPetugas" label="Jabatan Petugas" placeholder="Petugas Penagihan" />
            <TextField name="hpPetugas" label="No. HP Petugas" placeholder="0812-9876-5432" />
          </div>
        </SectionCard>

        {/* ============ 8. CHECKLIST ============ */}
        <SectionCard id={FORM_SECTIONS[7].id} index={8} title={FORM_SECTIONS[7].title} icon={<Wand2 size={12} />}>
          <ChecklistEditor jenis={data.jenis} checklist={data.checklist} onChange={ctxValue.setChecklist} />
        </SectionCard>

        {/* ============ 9. TTD, SAKSI & CATATAN ============ */}
        <SectionCard id={FORM_SECTIONS[8].id} index={9} title={FORM_SECTIONS[8].title} icon={<MapPin size={12} />}>
          <div className="grid grid-cols-2 gap-1.5">
            <TextField name="kota" label="Kota / Tempat" transform="upper" placeholder="PURWOKERTO" />
            <TextField name="tanggalPenyerahan" label="Tanggal Pelaksanaan" type="date" />
            <TextField name="saksi1Nama" label="Nama Saksi 1" transform="upper" placeholder="AHMAD FAUZI" />
            <TextField name="saksi1Jabatan" label="Jabatan Saksi 1" placeholder="Supervisor Remedial" />
            <TextField name="saksi2Nama" label="Nama Saksi 2" transform="upper" placeholder="SLAMET RIYADI" />
            <TextField name="saksi2Jabatan" label="Jabatan Saksi 2" placeholder="Keluarga Debitur" />
            <TextAreaField name="catatanKhusus" label="Catatan Khusus / Pernyataan Tambahan" rows={3} placeholder="Penyerahan unit dilakukan secara sukarela dan tanpa paksaan." />
          </div>
        </SectionCard>

        <ValidationSummary issues={issues} />
      </div>
    </FormContext.Provider>
  );
}

/* --------------------------------- util ---------------------------------- */

function Loader({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="animate-spin" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="48 24" strokeLinecap="round" />
    </svg>
  );
}

function ValidationSummary({ issues }: { issues: Record<string, FieldIssue[]> }) {
  const all = useMemo(() => Object.values(issues).flat(), [issues]);
  const errors = all.filter((i) => i.level === 'error');
  const warnings = all.filter((i) => i.level === 'warning');

  if (!all.length) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-[10px] font-semibold text-emerald-800">
        ✓ Semua isian lolos pemeriksaan. Dokumen siap disimpan ke PDF maupun Google Drive.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {errors.map((issue, idx) => (
        <IssueRow key={`err-${issue.field}-${idx}`} tone="error" issue={issue} />
      ))}
      {warnings.map((issue, idx) => (
        <IssueRow key={`warn-${issue.field}-${idx}`} tone="warning" issue={issue} />
      ))}
    </div>
  );
}

function IssueRow({ issue, tone }: { issue: FieldIssue; tone: 'error' | 'warning' }) {
  return (
    <button
      type="button"
      onClick={() => focusField(issue.field)}
      title="Klik untuk melompat ke kolom ini"
      className={cx(
        'flex w-full cursor-pointer items-start gap-1.5 rounded-md border px-1.5 py-1 text-left text-[9.5px] font-semibold transition',
        tone === 'error'
          ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
          : 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100',
      )}
    >
      <span className={cx('mt-px inline-block h-1.5 w-1.5 shrink-0 rounded-full', tone === 'error' ? 'bg-rose-500' : 'bg-amber-500')} />
      <span className="shrink-0 font-extrabold uppercase">{issue.label}:</span>
      <span className="min-w-0 leading-tight opacity-90">{issue.message}</span>
    </button>
  );
}
