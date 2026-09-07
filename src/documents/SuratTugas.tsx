import type { DocData } from '../types';
import { DocHeader, DocRow, LetterNumber, PAGE_CLASS, PAGE_F4 } from './docStyle';
import {
  alamatDebiturLengkap,
  krediturLabel,
  identitasKendaraan,
  periodeBerlaku,
  rincianAngsuran,
  totalTunggakanText,
} from '../utils/documentText';
import { normalizeText, toUpperText } from '../utils/format';

/** Surat Tugas Penagihan — halaman 1 (F4) */
export default function SuratTugas({ data }: { data: DocData }) {
  const kendaraan = identitasKendaraan(data);
  const angsuran = rincianAngsuran(data);
  const tunggakan = totalTunggakanText(data);

  return (
    <div id="doc-surat-tugas" data-doc-key="surat_tugas" className={`${PAGE_CLASS} ${PAGE_F4} px-[20mm] pb-[30mm] pt-[12mm]`}>
      <DocHeader data={data} />

      <div className="mb-4 text-center">
        <h2 className="text-[14pt] font-bold uppercase tracking-wide underline">Surat Tugas</h2>
        <p className="mt-0.5 text-[10pt] font-semibold uppercase tracking-wide">
          Penagihan &amp; Eksekusi Jaminan Fidusia
        </p>
        <div>
          <LetterNumber label="Nomor:" value={data.nomorSuratTugas} />
        </div>
      </div>

      <div className="letter-content space-y-1.5 text-justify text-[10pt]">
        <p>
          Yang bertanda tangan di bawah ini, mewakili Manajemen <strong>{normalizeText(data.namaPerusahaan).toUpperCase() || '(nama perusahaan)'}</strong>:
        </p>

        <div className="my-2 space-y-0.5 pl-8">
          <DocRow label="Nama" value={toUpperText(data.namaPemberiTugas)} bold labelWidth={110} />
          <DocRow label="Jabatan" value={toUpperText(data.jabatanPemberiTugas)} bold labelWidth={110} />
          <DocRow label="Perusahaan" value={normalizeText(data.cabang)} labelWidth={110} />
        </div>

        <p>Dengan ini memberikan tugas penuh, wewenang, dan tanggung jawab penagihan di lapangan kepada:</p>

        <table className="my-2 w-full table-fixed border-collapse pl-8 font-sans text-[10pt]">
          <thead>
            <tr className="bg-slate-100">
              <th className="w-[38%] border border-slate-400 px-2 py-1 text-left font-bold">Nama Petugas</th>
              <th className="w-[32%] border border-slate-400 px-2 py-1 text-left font-bold">NIK</th>
              <th className="w-[30%] border border-slate-400 px-2 py-1 text-left font-bold">Jabatan</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-slate-400 px-2 py-1 font-bold uppercase">{normalizeText(data.namaPetugas) || '(belum diisi)'}</td>
              <td className="border border-slate-400 px-2 py-1 font-mono">{normalizeText(data.nikPetugas) || '-'}</td>
              <td className="border border-slate-400 px-2 py-1">{normalizeText(data.jabatanPetugas) || 'Petugas Penagihan'}</td>
            </tr>
          </tbody>
        </table>
        <p className="-mt-1 text-[9.5pt] italic">Dan rekan.</p>

        <p>
          Untuk melakukan konfirmasi, penagihan, dan negosiasi penyelesaian kewajiban pembayaran atas nama
          Debitur/Nasabah dari <strong>{krediturLabel(data)}</strong> yang penagihannya dikuasakan kepada{' '}
          <strong>{normalizeText(data.namaPerusahaan).toUpperCase() || '(nama perusahaan)'}</strong>.
        </p>

        <p className="mt-1.5 font-bold">Berikut data nasabah :</p>

        <div className="mb-2 space-y-0.5 pl-8">
          <DocRow label="No. Kontrak" value={normalizeText(data.nomorKontrak)} />
          <DocRow label="Nama Nasabah / Debitur" value={toUpperText(data.namaDebitur)} uppercase />
          <DocRow label="NIK" value={normalizeText(data.nikDebitur)} />
          <DocRow label="Alamat" value={toUpperText(alamatDebiturLengkap(data))} />
          <DocRow label="No. HP / Telepon" value={normalizeText(data.hpDebitur)} />
          <DocRow label="Tanggal Jatuh Tempo" value={normalizeText(data.jatuhTempo)} />
          <DocRow label="Angsuran / Nomor Angsuran" value={normalizeText(angsuran)} />
          <DocRow label="Tunggakan & Denda" value={normalizeText(tunggakan)} />
        </div>

        <p>Adapun spesifikasi kendaraan sebagai berikut :</p>

        <div className="mb-2.5 space-y-0.5 pl-8">
          <DocRow label="Merk / Tipe" value={toUpperText(kendaraan)} />
          <DocRow label="Nomor Polisi" value={toUpperText(data.kendaraanNoPol)} bold />
          <DocRow label="Tahun / Warna" value={`${normalizeText(data.kendaraanTahun)} / ${normalizeText(data.kendaraanWarna)}`.replace(/\s*\/\s*$/, '')} />
          <DocRow label="Nomor Rangka / Mesin" value={`${normalizeText(data.kendaraanNoRangka)} / ${normalizeText(data.kendaraanNoMesin)}`.replace(/\s*\/\s*$/, '')} />
        </div>

        <p>Pelaksanaan Surat Tugas ini wajib tunduk dan patuh pada ketentuan sebagai berikut:</p>

        <div className="space-y-0.5">
          <div className="mb-1 mt-3 text-center text-[10.5pt] font-bold">MASA BERLAKU SURAT TUGAS</div>
          <p>
            Surat Tugas ini berlaku efektif terhitung sejak {periodeBerlaku(data)}. Apabila masa berlaku telah berakhir,
            Surat Tugas ini dinyatakan tidak berlaku lagi dan wajib diperpanjang melalui persetujuan Manajemen{' '}
            {normalizeText(data.namaPerusahaan).toUpperCase() || 'Perusahaan'}.
          </p>

          <div className="mb-1 mt-3 text-center text-[10.5pt] font-bold">WEWENANG DAN TANGGUNG JAWAB PETUGAS</div>
          <p>Dalam menjalankan tugas penagihan di lapangan, Tim Penagihan berwenang:</p>
          <ul className="list-disc space-y-1 pl-8">
            <li className="pl-1.5">
              Mendatangi alamat domisili, kantor, atau lokasi tempat usaha Debitur sesuai data resmi yang tercantum
              dalam lembar kerja penagihan.
            </li>
            <li className="pl-1.5">
              Melakukan konfirmasi, negosiasi, dan menyampaikan Surat Peringatan (SP) atau tagihan resmi yang
              diterbitkan oleh Perusahaan/Kreditur/Mitra Perusahaan.
            </li>
            <li className="pl-1.5">
              Untuk keperluan di atas, PENERIMA TUGAS berhak menerima jaminan piutang/jaminan fidusia, menandatangani
              dokumen-dokumen, meminta tanda tangan, serta melakukan tindakan yang dianggap perlu dalam melaksanakan
              tugas tersebut / meminta bantuan pihak berwajib jika diperlukan.
            </li>
          </ul>

          <div className="mb-1 mt-3 text-center text-[10.5pt] font-bold">LARANGAN DAN KEPATUHAN</div>
          <ul className="list-disc space-y-1 pl-8">
            <li className="pl-1.5">
              Dilarang menerima pembayaran tunai (cash) secara langsung dari Debitur dalam bentuk apa pun, kecuali
              menggunakan Virtual Account resmi atau tanda terima sah dari sistem perusahaan.
            </li>
            <li className="pl-1.5">
              Dilarang menggunakan ancaman, kekerasan fisik, intimidasi, penekanan secara psikologis, atau tindakan
              melawan hukum yang melanggar Kode Etik Penagihan Otoritas Jasa Keuangan (OJK) serta Peraturan
              Perundang-undangan Republik Indonesia.
            </li>
            <li className="pl-1.5">Petugas wajib bersikap sopan, profesional, dan berpakaian rapi selama di lapangan.</li>
            <li className="pl-1.5">
              Petugas wajib melaporkan hasil penagihan (Field Report) secara real-time melalui sistem aplikasi
              penagihan resmi pada hari yang sama.
            </li>
          </ul>

          <div className="mb-1 mt-3 text-center text-[10.5pt] font-bold">SANKSI DAN TANGGUNG JAWAB HUKUM</div>
          <ul className="list-disc space-y-1 pl-8">
            <li className="pl-1.5">
              Setiap pelanggaran kode etik, penyalahgunaan wewenang, atau penggelapan dana penagihan dikenakan sanksi
              tegas berupa Pemutusan Hubungan Kerja (PHK) secara tidak hormat.
            </li>
            <li className="pl-1.5">
              Tindakan pelanggaran hukum di luar prosedur resmi menjadi tanggung jawab pribadi petugas yang
              bersangkutan secara pidana maupun perdata.
            </li>
          </ul>

          <p className="mt-2.5">
            Demikian Surat Tugas ini diterbitkan untuk dipergunakan sebagaimana mestinya dan dilaksanakan dengan penuh
            rasa tanggung jawab demi menjaga integritas, profesionalisme, dan nama baik{' '}
            {normalizeText(data.namaPerusahaan).toUpperCase() || 'Perusahaan'} serta Kreditur.
          </p>
        </div>

        {/* Tanda tangan */}
        <div className="mt-6 flex justify-between break-inside-avoid pt-2 text-[10pt]">
          <div className="w-[46%]">
            <p className="mb-16">
              Pemberi Tugas,
              <br />
              {normalizeText(data.namaPerusahaan).toUpperCase() || 'Perusahaan'}
            </p>
            <p className="font-bold underline">{toUpperText(data.namaPemberiTugas) || '..............................'}</p>
            <p>{normalizeText(data.jabatanPemberiTugas)}</p>
          </div>
          <div className="w-[46%]">
            <p className="mb-16">
              {normalizeText(data.tempatTanggalTtd) || `${normalizeText(data.kota)}, ${normalizeText(data.tanggalSurat)}`}
              <br />
              Penerima Tugas,
              <br />
              PETUGAS PENAGIHAN
            </p>
            <p className="font-bold underline">{toUpperText(data.namaPetugas) || '..............................'}</p>
            <p>{normalizeText(data.jabatanPetugas)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
