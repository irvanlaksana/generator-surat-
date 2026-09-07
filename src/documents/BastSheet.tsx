import React from 'react';
import type { DocData } from '../types';
import { getChecklistDefinitions } from '../data/checklist';
import { DocHeader, DocRow, LetterNumber, PAGE_A4, PAGE_CLASS, SignBlock } from './docStyle';
import { identitasKendaraan, krediturLabel, tanggalPenyerahanTeks } from '../utils/documentText';
import { normalizeText, toUpperText } from '../utils/format';

/** BAST & Lembar Checklist Kondisi Fisik Unit (A4, memanjang bila isi bertambah) */
export default function BastSheet({ data }: { data: DocData }) {
  const items = getChecklistDefinitions(data.jenis);
  const kendaraan = identitasKendaraan(data);

  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    acc[item.kategori] = [...(acc[item.kategori] ?? []), item];
    return acc;
  }, {});

  const statusCount = items.reduce(
    (acc, item) => {
      const status = data.checklist?.[item.id]?.status ?? 'baik';
      acc[status] += 1;
      return acc;
    },
    { baik: 0, rusak: 0, tidak_ada: 0 } as Record<string, number>,
  );

  return (
    <div id="doc-bast" data-doc-key="bast" className={`${PAGE_CLASS} ${PAGE_A4} p-[15mm] leading-tight print:p-[13mm]`}>
      <DocHeader data={data} layout="split" />

      <div className="mb-2 flex items-end justify-between gap-3">
        <div className="text-center">
          <h1 className="text-[12pt] font-bold uppercase tracking-wide underline">
            Berita Acara Serah Terima &amp; Pemeriksaan Kondisi Fisik Unit
          </h1>
          <p className="mt-0.5 text-[9.5pt] font-semibold uppercase text-gray-700">
            Form BAST - {data.jenis === 'roda2' ? 'Roda 2 / Sepeda Motor' : 'Roda 4 / Mobil'} · {items.length} item pemeriksaan
          </p>
        </div>
        <div className="shrink-0 text-right">
          <LetterNumber value={data.nomorBast} />
        </div>
      </div>

      {/* Data para pihak */}
      <div className="mb-2 grid grid-cols-2 gap-3 rounded border border-slate-300 bg-slate-50 p-2 font-sans">
        <div>
          <p className="mb-1 border-b border-slate-200 pb-0.5 font-bold">DATA PIHAK</p>
          <div className="space-y-0.5">
            <DocRow label="Nama Debitur" value={toUpperText(data.namaDebitur)} labelWidth={100} />
            <DocRow label="No. HP" value={normalizeText(data.hpDebitur)} labelWidth={100} />
            <DocRow label="Petugas Penerima" value={toUpperText(data.namaPetugas)} labelWidth={100} />
            <DocRow label="No. Kontrak" value={normalizeText(data.nomorKontrak)} labelWidth={100} />
            <DocRow label="Kreditur" value={krediturLabel(data)} labelWidth={100} />
          </div>
        </div>
        <div>
          <p className="mb-1 border-b border-slate-200 pb-0.5 font-bold">IDENTITAS KENDARAAN</p>
          <div className="space-y-0.5">
            <DocRow label="Merk / Tipe" value={toUpperText(kendaraan)} labelWidth={105} />
            <DocRow label="No. Polisi" value={toUpperText(data.kendaraanNoPol)} bold labelWidth={105} />
            <DocRow label="Tahun / Warna" value={`${normalizeText(data.kendaraanTahun)} / ${normalizeText(data.kendaraanWarna)}`.replace(/\s*\/\s*$/, '')} labelWidth={105} />
            <DocRow label="KM / BBM" value={`${normalizeText(data.kendaraanOdometer)} (${normalizeText(data.kendaraanBahanBakar) || '-'})`} labelWidth={105} />
            <DocRow label="Rangka / Mesin" value={`${normalizeText(data.kendaraanNoRangka)} / ${normalizeText(data.kendaraanNoMesin)}`} mono labelWidth={105} />
          </div>
        </div>
      </div>

      {/* Tabel checklist */}
      <div className="mb-2">
        <p className="mb-1 font-sans text-[10.5pt] font-bold uppercase">
          Lembar Checklist Fisik &amp; Kelengkapan
          <span className="ml-1 font-sans text-[9pt] font-semibold normal-case text-gray-700">
            (Baik: {statusCount.baik} · Rusak: {statusCount.rusak} · Tidak ada: {statusCount.tidak_ada})
          </span>
        </p>

        <table className="w-full table-fixed border-collapse border border-slate-400 font-sans text-[9.5pt]">
          <thead>
            <tr className="bg-slate-200 text-slate-800">
              <th className="w-[26px] border border-slate-400 px-1 py-1 text-center">No</th>
              <th className="border border-slate-400 px-2 py-1 text-left">Komponen / Kelengkapan</th>
              <th className="w-[38px] border border-slate-400 px-1 py-1 text-center">Baik</th>
              <th className="w-[38px] border border-slate-400 px-1 py-1 text-center">Rusak</th>
              <th className="w-[38px] border border-slate-400 px-1 py-1 text-center">Tiada</th>
              <th className="w-[34%] border border-slate-400 px-2 py-1 text-left">Keterangan / Catatan Kondisi</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(grouped).map(([kategori, list], groupIdx) => (
              <React.Fragment key={kategori}>
                <tr className="bg-slate-100 font-bold text-slate-900">
                  <td colSpan={6} className="border border-slate-400 px-2 py-0.5 text-[9.5pt]">
                    {groupIdx + 1}. {kategori.toUpperCase()}
                  </td>
                </tr>
                {list.map((item, itemIdx) => {
                  const value = data.checklist?.[item.id] ?? { status: 'baik' as const, catatan: '' };
                  const mark = (target: string) => (value.status === target ? '✓' : '');
                  const keterangan =
                    normalizeText(value.catatan) ||
                    (value.status === 'rusak' ? 'Rusak / perlu perbaikan' : value.status === 'tidak_ada' ? 'Tidak diserahkan' : 'Lengkap & normal');
                  return (
                    <tr key={item.id}>
                      <td className="border border-slate-400 px-1 py-0.5 text-center text-[9pt] text-slate-500">{itemIdx + 1}</td>
                      <td className="border border-slate-400 px-2 py-0.5 text-slate-800">{item.nama}</td>
                      <td className="border border-slate-400 px-1 py-0.5 text-center font-bold text-emerald-700">{mark('baik')}</td>
                      <td className="border border-slate-400 px-1 py-0.5 text-center font-bold text-rose-600">{mark('rusak')}</td>
                      <td className="border border-slate-400 px-1 py-0.5 text-center font-bold text-slate-500">{mark('tidak_ada')}</td>
                      <td className="border border-slate-400 px-2 py-0.5 text-[9.5pt] text-slate-700">{keterangan}</td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mb-2 rounded border border-slate-300 bg-slate-50/60 p-2 font-sans text-[9.5pt]">
        <p className="font-bold">Catatan Kondisi Bodi &amp; Kelengkapan Lainnya:</p>
        <p className="italic text-slate-800">
          {normalizeText(data.kendaraanKondisiBodi) || 'Bodi kendaraan dalam kondisi wajar pemakaian.'}
          {normalizeText(data.kendaraanKondisiMesin) ? ` — Mesin: ${normalizeText(data.kendaraanKondisiMesin)}` : ''}
          {normalizeText(data.catatanKhusus) ? ` (${normalizeText(data.catatanKhusus)})` : ''}
        </p>
      </div>

      <p className="mb-2 text-justify">
        Kedua belah pihak telah bersama-sama memeriksa kondisi fisik dan kelengkapan unit di atas secara teliti, dan
        menandatangani berita acara ini dalam keadaan sadar tanpa paksaan dari pihak manapun.
      </p>

      <div className="pt-0.5 text-center font-sans">
        <p className="mb-2 font-serif text-[10.5pt]">
          {toUpperText(data.kota) || '(kota)'}, {tanggalPenyerahanTeks(data) || '(tanggal)'}
        </p>
        <div className="grid grid-cols-3 gap-2">
          <SignBlock title="YANG MENYERAHKAN" subtitle="(Debitur / Kuasa)" name={data.namaDebitur} />
          <SignBlock title="YANG MENERIMA" subtitle="(Petugas Penerima)" name={data.namaPetugas} />
          <SignBlock title="MENGETAHUI / SAKSI" subtitle="(Supervisor)" name={data.saksi1Nama} />
        </div>
      </div>
    </div>
  );
}
