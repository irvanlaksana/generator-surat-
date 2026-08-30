import React from 'react';
import { BastData } from '../types';
import { getChecklistDefinitions } from '../data/defaults';

interface BastSheetProps {
  data: BastData;
}

export default function BastSheet({ data }: BastSheetProps) {
  const items = getChecklistDefinitions(data.jenis);

  // Group checklist items by kategori
  const grouped: Record<string, typeof items> = {};
  items.forEach((item) => {
    if (!grouped[item.kategori]) {
      grouped[item.kategori] = [];
    }
    grouped[item.kategori].push(item);
  });

  return (
    <div className="w-[210mm] min-h-[297mm] mx-auto bg-white p-[15mm] text-black font-serif text-[10pt] leading-tight box-border print:p-[13mm] print:shadow-none print:m-0 print:w-full print:min-h-0">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-black pb-2 mb-3">
        <div>
          <h2 className="text-[14pt] font-bold uppercase tracking-wide">{data.perusahaan}</h2>
          <p className="text-[10pt] font-sans font-medium text-gray-800">{data.cabang}</p>
          <p className="text-[9pt] font-sans text-gray-600">{data.alamat}</p>
        </div>
        <div className="text-right font-sans text-[10pt]">
          <p className="font-bold text-gray-900 text-[10.5pt]">FORM BAST - {data.jenis === 'roda2' ? 'RODA 2' : 'RODA 4'}</p>
          <p className="text-gray-700 mt-1">
            No. BAST: <span className="font-mono font-extrabold text-[12pt] text-black bg-slate-100 px-2 py-0.5 border border-slate-300 rounded">{data.nomorBast}</span>
          </p>
          <p className="text-gray-600 mt-0.5">No. Kontrak: <span className="font-semibold text-black">{data.nomorKontrak}</span></p>
        </div>
      </div>

      {/* Judul BAST */}
      <div className="text-center mb-2.5">
        <h1 className="text-[12pt] font-bold uppercase underline tracking-wide">
          BERITA ACARA SERAH TERIMA & PEMERIKSAAN KONDISI FISIK UNIT
        </h1>
      </div>

      {/* Info Singkat Debitur & Kendaraan */}
      <div className="grid grid-cols-2 gap-3 mb-2.5 font-sans text-[10pt] bg-slate-50 border border-slate-300 p-2 rounded">
        <div>
          <p className="font-bold text-slate-900 border-b border-slate-200 pb-0.5 mb-1 text-[10pt]">DATA DEBITUR & PETUGAS:</p>
          <div className="grid grid-cols-[100px_8px_1fr] gap-y-0.5">
            <div>Nama Debitur</div><div>:</div><div className="font-semibold uppercase">{data.debiturNama}</div>
            <div>No. HP / Telp</div><div>:</div><div>{data.debiturHp}</div>
            <div>Petugas Penerima</div><div>:</div><div className="font-semibold uppercase">{data.petugasNama}</div>
            <div>Kreditur</div><div>:</div><div>{data.krediturLeasing}</div>
          </div>
        </div>

        <div>
          <p className="font-bold text-slate-900 border-b border-slate-200 pb-0.5 mb-1 text-[10pt]">IDENTITAS KENDARAAN:</p>
          <div className="grid grid-cols-[90px_8px_1fr] gap-y-0.5">
            <div>Merk / Tipe</div><div>:</div><div className="font-semibold uppercase">{data.kendaraanMerk} {data.kendaraanType}</div>
            <div>No. Polisi</div><div>:</div><div className="font-bold font-mono">{data.kendaraanNoPol}</div>
            <div>Tahun / Warna</div><div>:</div><div>{data.kendaraanTahun} / {data.kendaraanWarna}</div>
            <div>KM / Bahan Bakar</div><div>:</div><div>{data.kendaraanOdometer || '-'} ({data.kendaraanBahanBakar || '-'})</div>
            <div>No. Rangka / Mesin</div><div>:</div><div className="font-mono text-[9pt]">{data.kendaraanNoRangka} / {data.kendaraanNoMesin}</div>
          </div>
        </div>
      </div>

      {/* Checklist Table */}
      <div className="mb-2.5">
        <p className="font-bold text-[10.5pt] uppercase mb-1 font-sans">
          LEMBAR CHECKLIST FISIK & KELENGKAPAN ({items.length} ITEM):
        </p>

        <table className="w-full border-collapse border border-slate-400 font-sans text-[9.5pt]">
          <thead>
            <tr className="bg-slate-200 text-slate-800 text-center">
              <th className="border border-slate-400 py-1 px-1.5 w-7">No</th>
              <th className="border border-slate-400 py-1 px-2 text-left">Komponen / Kelengkapan</th>
              <th className="border border-slate-400 py-1 px-1 w-14">Baik (✓)</th>
              <th className="border border-slate-400 py-1 px-1 w-14">Rusak (✗)</th>
              <th className="border border-slate-400 py-1 px-1 w-14">Tdk Ada (-)</th>
              <th className="border border-slate-400 py-1 px-2 text-left">Keterangan / Catatan Kondisi</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(grouped).map(([kategori, list], groupIdx) => (
              <React.Fragment key={kategori}>
                <tr className="bg-slate-100/80 font-bold text-slate-900">
                  <td colSpan={6} className="border border-slate-400 px-2 py-0.5 text-[9.5pt]">
                    {groupIdx + 1}. {kategori.toUpperCase()}
                  </td>
                </tr>
                {list.map((item, itemIdx) => {
                  const val = data.checklist?.[item.id] || { status: 'baik', catatan: '' };
                  const isBaik = val.status === 'baik';
                  const isRusak = val.status === 'rusak';
                  const isTidakAda = val.status === 'tidak_ada';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="border border-slate-400 text-center py-0.5 text-[9pt] text-slate-500">
                        {itemIdx + 1}
                      </td>
                      <td className="border border-slate-400 px-2 py-0.5 text-slate-800">
                        {item.nama}
                      </td>
                      <td className="border border-slate-400 text-center py-0.5 font-bold text-emerald-700">
                        {isBaik ? '✓' : ''}
                      </td>
                      <td className="border border-slate-400 text-center py-0.5 font-bold text-rose-600">
                        {isRusak ? '✗' : ''}
                      </td>
                      <td className="border border-slate-400 text-center py-0.5 font-bold text-slate-500">
                        {isTidakAda ? '—' : ''}
                      </td>
                      <td className="border border-slate-400 px-2 py-0.5 text-slate-700 text-[9.5pt]">
                        {val.catatan || (isBaik ? 'Lengkap & Normal' : isRusak ? 'Rusak/Perlu Perbaikan' : 'Tidak Diserahkan')}
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Catatan Kondisi Fisik & Tambahan */}
      <div className="border border-slate-300 p-2 font-sans text-[9.5pt] mb-2 bg-slate-50/50">
        <p className="font-bold text-slate-900 mb-0.5">CATATAN KONDISI BODI & KELENGKAPAN LAINNYA:</p>
        <p className="text-slate-800 italic">
          {data.kendaraanKondisiBodi || 'Bodi kendaraan dalam kondisi wajar pemakaian.'} {data.catatanKhusus ? `(${data.catatanKhusus})` : ''}
        </p>
      </div>

      {/* Pernyataan & Tanda Tangan */}
      <p className="text-[10pt] text-justify mb-2">
        Kedua belah pihak telah bersama-sama memeriksa kondisi fisik dan kelengkapan unit di atas secara teliti. Berita Acara ini ditandatangani tanpa ada paksaan dari pihak manapun.
      </p>

      <div className="text-center font-sans text-[10pt] pt-0.5">
        <p className="mb-2 font-serif text-[10.5pt]">{data.kota}, {data.tanggal}</p>
        
        <div className="grid grid-cols-3 gap-2">
          <div>
            <p className="font-bold">YANG MENYERAHKAN</p>
            <p className="text-[9pt] text-slate-500">(Debitur / Kuasa)</p>
            <div className="h-10"></div>
            <p className="font-bold underline uppercase text-[10pt]">({data.debiturNama || '........................'})</p>
          </div>

          <div>
            <p className="font-bold">YANG MENERIMA</p>
            <p className="text-[9pt] text-slate-500">(Petugas Penerima)</p>
            <div className="h-10"></div>
            <p className="font-bold underline uppercase text-[10pt]">({data.petugasNama || '........................'})</p>
          </div>

          <div>
            <p className="font-bold">MENGETAHUI / SAKSI</p>
            <p className="text-[9pt] text-slate-500">(Supervisor / Saksi)</p>
            <div className="h-10"></div>
            <p className="font-bold underline uppercase text-[10pt]">({data.saksi1Nama || '........................'})</p>
          </div>
        </div>
      </div>
    </div>
  );
}
