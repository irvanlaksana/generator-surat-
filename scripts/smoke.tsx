import { renderToString } from 'react-dom/server';
import React from 'react';
import App from '../src/App';
import SuratTugas from '../src/documents/SuratTugas';
import SuratPenyerahan from '../src/documents/SuratPenyerahan';
import BastSheet from '../src/documents/BastSheet';
import Lampiran from '../src/documents/Lampiran';
import DataForm from '../src/components/form/DataForm';
import { DEFAULT_DATA, CONTOH_DATA, EMPTY_DATA, normalizeStored, blankData } from '../src/data/defaults';
import { validateDoc, completionStats } from '../src/utils/validation';
import { buildPdfFileName, buildPdfBaseName, deriveKecamatan, deriveKabupaten } from '../src/utils/filename';
import { formatRupiah, formatTanggalId, toIsoDate, slugPart } from '../src/utils/format';
import { generateOfficialLetterNumber } from '../src/utils/letterNumber';

const store = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, String(v)),
  removeItem: (k: string) => void store.delete(k),
};
(globalThis as any).window = {
  localStorage: (globalThis as any).localStorage,
  addEventListener() {},
  removeEventListener() {},
  requestAnimationFrame: (cb: () => void) => setTimeout(cb, 0),
  confirm: () => true,
  print() {},
};
(globalThis as any).document = { documentElement: { classList: { add() {}, remove() {} } } };

const results: string[] = [];
const check = (name: string, fn: () => void) => {
  try {
    fn();
    results.push(`PASS  ${name}`);
  } catch (err) {
    results.push(`FAIL  ${name}: ${(err as Error).message}`);
  }
};

check('render App', () => {
  const html = renderToString(React.createElement(App));
  if (!html.includes('Generator Surat Tugas')) throw new Error('header tidak ditemukan');
  if (!html.includes('Satu Urutan Pengisian Data')) throw new Error('header form tidak ditemukan');
  if (!html.includes('Nama Debitur')) throw new Error('field nama debitur tidak ditemukan');
  if (!html.includes('Upload Kop Surat')) throw new Error('upload kop tidak ditemukan');
  if (!html.includes('KTP Debitur')) throw new Error('upload KTP tidak ditemukan');
  if (!html.includes('STNK')) throw new Error('upload STNK tidak ditemukan');
});

check('render semua dokumen (sample roda2)', () => {
  for (const Cmp of [SuratTugas, SuratPenyerahan, BastSheet, Lampiran]) {
    const html = renderToString(React.createElement(Cmp, { data: DEFAULT_DATA }));
    if (!html.length) throw new Error(`${Cmp.name} kosong`);
  }
});

check('render semua dokumen (roda4 contoh)', () => {
  renderToString(React.createElement(DataForm, {
    data: CONTOH_DATA.roda4,
    issues: {},
    completion: completionStats(CONTOH_DATA.roda4),
    onChange: () => {},
    onFillSample: () => {},
    onClear: () => {},
  }));
});

check('render dokumen data kosong', () => {
  for (const Cmp of [SuratTugas, SuratPenyerahan, BastSheet, Lampiran]) {
    renderToString(React.createElement(Cmp, { data: EMPTY_DATA }));
  }
});

check('nama file PDF standar', () => {
  const name = buildPdfFileName(DEFAULT_DATA);
  if (name !== 'KAMM-KISNO_ANGKAH_TRI_HIDAYAT-KALIMANAH.pdf') throw new Error(`unexpected: ${name}`);
});

check('nama file untuk data minimal', () => {
  const name = buildPdfBaseName({ ...EMPTY_DATA, namaKreditur: 'PT BFI Finance Indonesia', namaDebitur: 'budi santoso', kecamatan: 'bojongsari' });
  if (name !== 'BFI-BUDI_SANTOSO-BOJONGSARI') throw new Error(`unexpected: ${name}`);
});

check('derive kecamatan/kabupaten', () => {
  const kec = deriveKecamatan('Kalikabong RT 004 RW 002, Kalimanah, Purbalingga');
  const kec2 = deriveKecamatan('Jl. Mawar 5, Kecamatan Bojongsari, Kota Depok');
  const kab = deriveKabupaten('Kalikabong RT 004 RW 002, Kalimanah, Purbalingga');
  if (kec.toLowerCase() !== 'kalimanah') throw new Error(`kec: ${kec}`);
  if (kec2.toLowerCase() !== 'bojongsari') throw new Error(`kec2: ${kec2}`);
  if (kab.toLowerCase() !== 'purbalingga') throw new Error(`kab: ${kab}`);
});

check('validasi: data sample lolos tanpa error', () => {
  const v = validateDoc(DEFAULT_DATA);
  if (v.errors.length) throw new Error(`errors: ${v.errors.map((e) => `${e.label}=${e.message}`).join(' | ')}`);
});

check('validasi: data kosong menghasilkan error wajib', () => {
  const v = validateDoc({ ...EMPTY_DATA, checklist: {} });
  const fields = v.errors.map((e) => e.field);
  for (const f of ['namaDebitur', 'kecamatan', 'tanggalSurat', 'namaPerusahaan', 'namaPetugas', 'kendaraanNoPol', 'masaBerlakuSampai']) {
    if (!fields.includes(f)) throw new Error(`field ${f} tidak ditandai error`);
  }
});

check('validasi: NIK salah & nomor surat ganda', () => {
  const v = validateDoc({ ...DEFAULT_DATA, nikDebitur: '123', nomorBast: DEFAULT_DATA.nomorSuratTugas, nomorSuratTugas: '001/ST/MJI/22/VIII/2026' });
  if (!v.errors.some((e) => e.field === 'nikDebitur')) throw new Error('NIK tidak tertangkap');
  if (!v.errors.some((e) => e.field === 'nomorBast')) throw new Error('duplikat nomor tidak tertangkap');
});

check('validasi: tanggal berakhir sebelum mulai', () => {
  const v = validateDoc({ ...DEFAULT_DATA, masaBerlakuMulai: '2026-09-01', masaBerlakuSampai: '2026-08-01' });
  if (!v.errors.some((e) => e.field === 'masaBerlakuSampai')) throw new Error('rentang tanggal tidak tertangkap');
});

check('format rupiah & tanggal', () => {
  if (formatRupiah('385000') !== 'Rp. 385.000') throw new Error(formatRupiah('385000'));
  if (formatRupiah('abc') !== '') throw new Error('rupiah tidak tervalidasi');
  if (formatTanggalId('2024-02-02') !== '2 Februari 2024') throw new Error(formatTanggalId('2024-02-02'));
  if (toIsoDate('2 FEBRUARI 2024') !== '2024-02-02') throw new Error(toIsoDate('2 FEBRUARI 2024') ?? 'null');
  if (slugPart("O'Brien, John (Jr.)", 20) !== "O_BRIEN_JOHN_JR") throw new Error(slugPart("O'Brien, John (Jr.)", 20));
});

check('nomor surat otomatis', () => {
  const n = generateOfficialLetterNumber({ type: 'ST', companyName: 'PT. MITRA JASATRIA INDONESIA', date: '2026-08-22', customSequence: 7 });
  if (n !== '007/ST/MJI/22/VIII/2026') throw new Error(n);
});

check('migrasi data lama (form terpisah)', () => {
  const legacy = {
    kopCompanyName: 'PT. MITRA JASATRIA INDONESIA',
    letterNumber: '005/ST/MJI/21/VIII/2026',
    customerName: 'BUDI SANTOSO',
    customerAddress: 'Jl. Melati, Kec. Bojongsari, Kota Depok',
    customerContract: '99887766',
    krediturLeasing: 'PT BFI Finance Indonesia Tbk',
    debiturNama: 'BUDI SANTOSO',
    debiturNik: '3214010101900001',
    attachments: [{ url: 'data:image/jpeg;base64,AAA', width: 600, height: 400 }],
    tanggal: '21 Agustus 2026',
    validFrom: '21 Agustus 2026',
    validTo: '31 Agustus 2026',
  };
  const migrated = normalizeStored(legacy);
  if (migrated.namaDebitur !== 'BUDI SANTOSO') throw new Error('nama debitur: ' + migrated.namaDebitur);
  if (migrated.tanggalSurat !== '2026-08-21') throw new Error('tanggal surat: ' + migrated.tanggalSurat);
  if (migrated.masaBerlakuSampai !== '2026-08-31') throw new Error('masa berlaku: ' + migrated.masaBerlakuSampai);
  if (migrated.dokumen.length !== 1) throw new Error('lampiran lama tidak dimigrasi');
  const name = buildPdfFileName(migrated);
  if (!/^BFI-BUDI_SANTOSO-/.test(name)) throw new Error('nama file: ' + name);
});

check('blankData mempertahankan identitas perusahaan', () => {
  const b = blankData(DEFAULT_DATA);
  if (b.namaDebitur) throw new Error('nama debitur seharusnya kosong');
  if (b.namaPerusahaan !== DEFAULT_DATA.namaPerusahaan) throw new Error('nama perusahaan hilang');
  if (Object.keys(b.checklist).length === 0) throw new Error('checklist kosong');
});

check('completion stats', () => {
  const full = completionStats(DEFAULT_DATA);
  if (full.percent !== 100) throw new Error(`persen: ${full.percent}`);
  const empty = completionStats(EMPTY_DATA);
  if (empty.percent !== 0) throw new Error('empty percent');
});


check('form satu urutan: semua section tampil sekaligus', () => {
  const html = renderToString(React.createElement(App));
  const order = ['s-debitur', 's-nomor', 's-angsuran', 's-kop', 's-berkas', 's-kendaraan', 's-petugas', 's-checklist', 's-ttd'];
  let last = -1;
  for (const id of order) {
    const at = html.indexOf(`id="${id}"`);
    if (at < 0) throw new Error(`section ${id} tidak ditemukan`);
    if (at < last) throw new Error(`urutan section ${id} tidak berurutan`);
    last = at;
  }
  for (const label of ['Template BAST', 'tab-surat-tugas', 'Isi Data</button>', 'Pilih Kategori']) {
    if (html.includes(label) && label !== 'Isi Data</button>') throw new Error(`masih ada pemisah form: ${label}`);
  }
});

check('pratinjau menyatukan semua dokumen berurutan', () => {
  const html = renderToString(React.createElement(App));
  const pos = (marker: string) => html.indexOf(`data-doc-key="${marker}"`);
  const keys = ['surat_tugas', 'penyerahan', 'bast', 'lampiran'];
  let last = -1;
  for (const key of keys) {
    const at = pos(key);
    if (at < 0) throw new Error(`dokumen ${key} tidak dirender`);
    if (at < last) throw new Error(`urutan dokumen ${key} salah`);
    last = at;
  }
});

check('isi surat tugas memakai data terpadu', () => {
  const html = renderToString(React.createElement(SuratTugas, { data: DEFAULT_DATA }));
  const plain = html.replace(/<[^>]*>/g, ' ');
  for (const needle of ['KISNO ANGKAH TRI HIDAYAT', '00730191', 'KALIMANAH', 'PURBALINGGA', 'R 4088 YV', '001/ST/MJI/22/VIII/2026', 'KAMM']) {
    if (!plain.toUpperCase().includes(needle)) throw new Error(`isi surat tidak memuat: ${needle}`);
  }
});

check('lampiran berhalaman otomatis (4 berkas per halaman)', () => {
  const many = {
    ...DEFAULT_DATA,
    dokumen: Array.from({ length: 9 }, (_, i) => ({
      id: `d${i}`,
      kategori: (['ktp', 'stnk', 'bpkb', 'unit', 'lainnya'] as const)[i % 5],
      label: `Berkas ${i + 1}`,
      fileName: `berkas-${i + 1}.jpg`,
      url: 'data:image/jpeg;base64,AAA',
      size: 1000,
      width: 800,
      height: 600,
    })),
  };
  const html = renderToString(React.createElement(Lampiran, { data: many }));
  const pages = (html.match(/data-doc-key="lampiran"/g) ?? []).length;
  if (pages !== 3) throw new Error(`jumlah halaman lampiran: ${pages} (harap 3)`);
  const v = validateDoc(many);
  if (v.errors.length) throw new Error('lampiran lengkap tapi ada error: ' + v.errors[0].message);
});

check('validasi berkas wajib memicu peringatan', () => {
  const v = validateDoc({ ...DEFAULT_DATA, dokumen: [] });
  if (!v.warnings.some((w) => w.field === 'dokumen')) throw new Error('peringatan berkas wajib tidak muncul');
});

console.log(results.join('\n'));
const failed = results.filter((r) => r.startsWith('FAIL'));
console.log(`\n${results.length - failed.length}/${results.length} cek lulus`);
process.exit(failed.length ? 1 : 0);
