import React from 'react';
import { BastData } from '../types';

interface SuratPenyerahanProps {
  data: BastData;
}

export default function SuratPenyerahan({ data }: SuratPenyerahanProps) {
  return (
    <div className="w-[210mm] min-h-[297mm] mx-auto bg-white p-[16mm] text-black font-serif text-[10pt] leading-normal box-border print:p-[14mm] print:shadow-none print:m-0 print:w-full print:min-h-0 print:text-[10pt]">
      {/* Header / Kop */}
      <div className="text-center border-b-2 border-black pb-2.5 mb-4">
        <h2 className="text-[14pt] font-bold tracking-wide uppercase">{data.perusahaan}</h2>
        <p className="text-[10pt] font-sans font-medium text-gray-800">{data.cabang}</p>
        <p className="text-[9pt] font-sans text-gray-600 leading-tight mt-0.5">{data.alamat} | Telp: {data.telepon}</p>
      </div>

      {/* Judul Surat */}
      <div className="text-center mb-5">
        <h1 className="text-[13pt] font-bold uppercase underline tracking-wider">
          SURAT PENYERAHAN KENDARAAN SECARA SUKARELA
        </h1>
        <p className="text-[13pt] font-bold font-mono tracking-wide mt-1.5 bg-slate-100/80 inline-block px-3.5 py-1 border border-slate-300 rounded">
          Nomor: {data.nomorPenyerahan || '-'}
        </p>
      </div>

      {/* Pembuka */}
      <p className="mb-2.5 text-justify text-[10pt]">
        Pada hari ini, tanggal <strong>{data.tanggal}</strong>, bertempat di <strong>{data.kota}</strong>, kami yang bertanda tangan di bawah ini:
      </p>

      {/* Pihak I */}
      <div className="mb-2.5 text-[10pt]">
        <p className="font-bold underline mb-1">I. PIHAK PERTAMA (YANG MENYERAHKAN):</p>
        <div className="grid grid-cols-[160px_10px_1fr] gap-y-0.5 pl-4 font-sans text-[10pt]">
          <div>Nama Lengkap</div><div>:</div><div className="font-semibold uppercase">{data.debiturNama}</div>
          <div>No. KTP / NIK</div><div>:</div><div>{data.debiturNik}</div>
          <div>Alamat Lengkap</div><div>:</div><div>{data.debiturAlamat}</div>
          <div>No. Telepon / HP</div><div>:</div><div>{data.debiturHp}</div>
          <div>No. Perjanjian / Kontrak</div><div>:</div><div className="font-semibold">{data.nomorKontrak}</div>
          <div>Kreditur / Finance</div><div>:</div><div>{data.krediturLeasing}</div>
        </div>
        <p className="text-[9.5pt] italic text-gray-700 pl-4 mt-0.5">
          Selanjutnya disebut sebagai <strong>PIHAK PERTAMA</strong>.
        </p>
      </div>

      {/* Pihak II */}
      <div className="mb-3 text-[10pt]">
        <p className="font-bold underline mb-1">II. PIHAK KEDUA (YANG MENERIMA):</p>
        <div className="grid grid-cols-[160px_10px_1fr] gap-y-0.5 pl-4 font-sans text-[10pt]">
          <div>Nama Lengkap</div><div>:</div><div className="font-semibold uppercase">{data.petugasNama}</div>
          <div>No. KTP / ID Petugas</div><div>:</div><div>{data.petugasNik}</div>
          <div>Jabatan</div><div>:</div><div>{data.petugasJabatan}</div>
          <div>Mewakili Perusahaan</div><div>:</div><div>{data.perusahaan}</div>
          <div>No. Telepon / HP</div><div>:</div><div>{data.petugasHp}</div>
        </div>
        <p className="text-[9.5pt] italic text-gray-700 pl-4 mt-0.5">
          Selanjutnya disebut sebagai <strong>PIHAK KEDUA</strong>.
        </p>
      </div>

      {/* Objek Kendaraan */}
      <div className="mb-3 text-[10pt]">
        <p className="text-justify mb-1.5">
          Dengan ini PIHAK PERTAMA menyatakan secara sadar, sukarela, dan tanpa ada paksaan dari pihak manapun menyerahkan 1 (satu) unit kendaraan bermotor ({data.jenis === 'roda2' ? 'Roda 2 / Sepeda Motor' : 'Roda 4 / Mobil'}) dengan rincian identitas sebagai berikut:
        </p>
        <div className="border border-black p-2.5 bg-gray-50/50 font-sans text-[10pt] grid grid-cols-2 gap-x-4 gap-y-0.5">
          <div className="grid grid-cols-[110px_8px_1fr]">
            <div>Merk / Tipe</div><div>:</div><div className="font-semibold uppercase">{data.kendaraanMerk} {data.kendaraanType}</div>
          </div>
          <div className="grid grid-cols-[110px_8px_1fr]">
            <div>Nomor Polisi</div><div>:</div><div className="font-bold font-mono">{data.kendaraanNoPol}</div>
          </div>
          <div className="grid grid-cols-[110px_8px_1fr]">
            <div>Tahun / Warna</div><div>:</div><div>{data.kendaraanTahun} / {data.kendaraanWarna}</div>
          </div>
          <div className="grid grid-cols-[110px_8px_1fr]">
            <div>Odometer (KM)</div><div>:</div><div>{data.kendaraanOdometer || '-'}</div>
          </div>
          <div className="grid grid-cols-[110px_8px_1fr]">
            <div>Nomor Rangka</div><div>:</div><div className="font-mono text-[9.5pt]">{data.kendaraanNoRangka}</div>
          </div>
          <div className="grid grid-cols-[110px_8px_1fr]">
            <div>Nomor Mesin</div><div>:</div><div className="font-mono text-[9.5pt]">{data.kendaraanNoMesin}</div>
          </div>
          <div className="grid grid-cols-[110px_8px_1fr]">
            <div>Kelengkapan STNK</div><div>:</div><div>{data.kendaraanStnk}</div>
          </div>
          <div className="grid grid-cols-[110px_8px_1fr]">
            <div>Kondisi Mesin</div><div>:</div><div>{data.kendaraanKondisiMesin}</div>
          </div>
        </div>
      </div>

      {/* Pernyataan & Ketentuan */}
      <div className="text-justify space-y-1 text-[10pt] leading-snug mb-4">
        <p>
          <strong>Ketentuan Penyerahan Unit:</strong>
        </p>
        <ol className="list-decimal pl-5 space-y-0.5 text-gray-900">
          <li>
            Penyerahan unit kendaraan ini dilakukan sehubungan dengan keterlambatan kewajiban pembayaran angsuran pembiayaan fasilitas kredit/fidusia pada kreditur <strong>{data.krediturLeasing}</strong>.
          </li>
          <li>
            PIHAK PERTAMA memberikan kuasa penuh kepada PIHAK KEDUA / Kreditur untuk mengamankan dan membawa unit kendaraan tersebut ke kantor atau tempat penyimpanan resmi yang ditunjuk.
          </li>
          <li>
            PIHAK PERTAMA memahami dan bersedia menyelesaikan kewajiban tunggakan sesuai jangka waktu dan prosedur yang berlaku pada pihak kreditur.
          </li>
          {data.catatanKhusus && (
            <li className="font-medium italic">
              Catatan khusus: {data.catatanKhusus}
            </li>
          )}
        </ol>
        <p className="pt-0.5">
          Demikian Surat Penyerahan Kendaraan ini dibuat dengan sebenarnya dalam keadaan sadar dan sehat walafiat untuk dipergunakan sebagaimana mestinya.
        </p>
      </div>

      {/* Tanda Tangan */}
      <div className="pt-1 text-center text-[10pt]">
        <p className="mb-3">{data.kota}, {data.tanggal}</p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="font-bold">PIHAK PERTAMA</p>
            <p className="text-[9pt] text-gray-600">(Yang Menyerahkan Unit)</p>
            <div className="h-14 flex items-end justify-center">
              <span className="text-[8.5pt] text-gray-400 italic">Materai Tempel</span>
            </div>
            <p className="font-bold underline uppercase tracking-wide">({data.debiturNama || '............................'})</p>
            <p className="text-[9.5pt]">Konsumen / Debitur</p>
          </div>
          <div>
            <p className="font-bold">PIHAK KEDUA</p>
            <p className="text-[9pt] text-gray-600">(Yang Menerima Unit)</p>
            <div className="h-14"></div>
            <p className="font-bold underline uppercase tracking-wide">({data.petugasNama || '............................'})</p>
            <p className="text-[9.5pt]">{data.petugasJabatan}</p>
          </div>
        </div>

        {/* Saksi-Saksi */}
        {(data.saksi1Nama || data.saksi2Nama) && (
          <div className="border-t border-gray-300 pt-2 text-[10pt]">
            <p className="font-bold text-[10pt] mb-1.5">SAKSI - SAKSI:</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[9.5pt] font-medium">{data.saksi1Jabatan || 'Saksi I'}</p>
                <div className="h-10"></div>
                <p className="font-semibold underline uppercase text-[10pt]">({data.saksi1Nama || '............................'})</p>
              </div>
              <div>
                <p className="text-[9.5pt] font-medium">{data.saksi2Jabatan || 'Saksi II'}</p>
                <div className="h-10"></div>
                <p className="font-semibold underline uppercase text-[10pt]">({data.saksi2Nama || '............................'})</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
