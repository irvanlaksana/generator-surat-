import type { DocData } from '../types';
import { DocHeader, DocRow, LetterNumber, PAGE_A4, PAGE_CLASS, SignBlock } from './docStyle';
import { alamatDebiturLengkap, identitasKendaraan, krediturLabel, tanggalPenyerahanTeks } from '../utils/documentText';
import { normalizeText, toUpperText } from '../utils/format';

/** Surat Penyerahan Kendaraan Secara Sukarela (A4) */
export default function SuratPenyerahan({ data }: { data: DocData }) {
  const kendaraan = identitasKendaraan(data);
  const tanggal = tanggalPenyerahanTeks(data);
  const kota = toUpperText(data.kota);

  return (
    <div id="doc-penyerahan" data-doc-key="penyerahan" className={`${PAGE_CLASS} ${PAGE_A4} p-[16mm] print:p-[14mm]`}>
      <DocHeader data={data} layout="split" />

      <div className="mb-4 text-center">
        <h1 className="text-[13pt] font-bold uppercase tracking-wider underline">
          Surat Penyerahan Kendaraan Secara Sukarela
        </h1>
        <div>
          <LetterNumber label="Nomor:" value={data.nomorPenyerahan} />
        </div>
      </div>

      <p className="mb-2.5 text-justify">
        Pada hari ini, tanggal <strong>{tanggal || '(tanggal belum diisi)'}</strong>
        {kota ? `, bertempat di ${kota}` : ''}, kami yang bertanda tangan di bawah ini:
      </p>

      {/* PIHAK PERTAMA */}
      <div className="mb-2.5">
        <p className="mb-1 font-bold underline">I. PIHAK PERTAMA (YANG MENYERAHKAN / DEBITUR)</p>
        <div className="space-y-0.5 pl-4 font-sans">
          <DocRow label="Nama Lengkap" value={toUpperText(data.namaDebitur)} />
          <DocRow label="No. KTP / NIK" value={normalizeText(data.nikDebitur)} />
          <DocRow label="Alamat Lengkap" value={toUpperText(alamatDebiturLengkap(data))} />
          <DocRow label="No. Telepon / HP" value={normalizeText(data.hpDebitur)} />
          <DocRow label="No. Perjanjian / Kontrak" value={normalizeText(data.nomorKontrak)} bold />
          <DocRow label="Kreditur / Finance" value={krediturLabel(data)} />
        </div>
        <p className="mt-0.5 pl-4 text-[9.5pt] italic text-gray-700">
          Selanjutnya disebut sebagai <strong>PIHAK PERTAMA</strong>.
        </p>
      </div>

      {/* PIHAK KEDUA */}
      <div className="mb-3">
        <p className="mb-1 font-bold underline">II. PIHAK KEDUA (YANG MENERIMA UNIT / PETUGAS)</p>
        <div className="space-y-0.5 pl-4 font-sans">
          <DocRow label="Nama Lengkap" value={toUpperText(data.namaPetugas)} />
          <DocRow label="No. KTP / ID Petugas" value={normalizeText(data.nikPetugas)} />
          <DocRow label="Jabatan" value={normalizeText(data.jabatanPetugas)} />
          <DocRow label="Mewakili Perusahaan" value={toUpperText(data.namaPerusahaan)} />
          <DocRow label="No. Telepon / HP" value={normalizeText(data.hpPetugas)} />
        </div>
        <p className="mt-0.5 pl-4 text-[9.5pt] italic text-gray-700">
          Selanjutnya disebut sebagai <strong>PIHAK KEDUA</strong>.
        </p>
      </div>

      {/* Objek penyerahan */}
      <div className="mb-3">
        <p className="mb-1.5 text-justify">
          Dengan ini PIHAK PERTAMA menyatakan secara sadar, sukarela, dan tanpa paksaan dari pihak manapun menyerahkan
          1 (satu) unit kendaraan bermotor ({data.jenis === 'roda2' ? 'Roda 2 / Sepeda Motor' : 'Roda 4 / Mobil'})
          dengan rincian identitas sebagai berikut:
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 border border-black bg-gray-50/60 p-2.5 font-sans">
          <DocRow label="Merk / Tipe" value={toUpperText(kendaraan)} labelWidth={110} />
          <DocRow label="Nomor Polisi" value={toUpperText(data.kendaraanNoPol)} bold labelWidth={110} />
          <DocRow label="Tahun / Warna" value={`${normalizeText(data.kendaraanTahun)} ${normalizeText(data.kendaraanWarna)}`.trim()} labelWidth={110} />
          <DocRow label="Odometer" value={normalizeText(data.kendaraanOdometer)} labelWidth={110} />
          <DocRow label="Nomor Rangka" value={normalizeText(data.kendaraanNoRangka)} mono labelWidth={110} />
          <DocRow label="Nomor Mesin" value={normalizeText(data.kendaraanNoMesin)} mono labelWidth={110} />
          <DocRow label="Kelengkapan STNK" value={normalizeText(data.kendaraanStnk)} labelWidth={110} />
          <DocRow label="Status BPKB" value={normalizeText(data.kendaraanBpkb)} labelWidth={110} />
        </div>
      </div>

      {/* Ketentuan */}
      <div className="mb-4 space-y-1 text-justify leading-snug">
        <p className="font-bold">Ketentuan Penyerahan Unit:</p>
        <ol className="list-decimal space-y-0.5 pl-5 text-gray-900">
          <li>
            Penyerahan unit kendaraan ini dilakukan sehubungan dengan keterlambatan kewajiban pembayaran angsuran
            pembiayaan fasilitas kredit/fidusia pada kreditur <strong>{krediturLabel(data)}</strong>.
          </li>
          <li>
            PIHAK PERTAMA memberikan kuasa penuh kepada PIHAK KEDUA / Kreditur untuk mengamankan dan membawa unit
            kendaraan ke kantor atau tempat penyimpanan resmi yang ditunjuk.
          </li>
          <li>
            PIHAK PERTAMA memahami dan bersedia menyelesaikan kewajiban tunggakan sesuai jangka waktu dan prosedur
            yang berlaku pada pihak kreditur.
          </li>
          {normalizeText(data.catatanKhusus) && (
            <li className="italic">
              <span className="font-semibold not-italic">Catatan khusus:</span> {normalizeText(data.catatanKhusus)}
            </li>
          )}
        </ol>
        <p className="pt-0.5">
          Demikian Surat Penyerahan Kendaraan ini dibuat dengan sebenarnya, dalam keadaan sadar dan sehat walafiat,
          untuk dipergunakan sebagaimana mestinya.
        </p>
      </div>

      {/* Tanda tangan */}
      <div className="mt-1 text-center">
        <p className="mb-3">
          {kota || '(kota)'}, {tanggal || '(tanggal)'}
        </p>
        <div className="mb-4 grid grid-cols-2 gap-4">
          <SignBlock title="PIHAK PERTAMA" subtitle="(Yang Menyerahkan Unit)" name={data.namaDebitur} note="Konsumen / Debitur" />
          <SignBlock title="PIHAK KEDUA" subtitle="(Yang Menerima Unit)" name={data.namaPetugas} note={normalizeText(data.jabatanPetugas)} />
        </div>

        {(normalizeText(data.saksi1Nama) || normalizeText(data.saksi2Nama)) && (
          <div className="border-t border-gray-300 pt-2">
            <p className="mb-1.5 font-bold">SAKSI - SAKSI:</p>
            <div className="grid grid-cols-2 gap-4">
              <SignBlock
                title={normalizeText(data.saksi1Jabatan) || 'Saksi I'}
                name={data.saksi1Nama}
              />
              <SignBlock
                title={normalizeText(data.saksi2Jabatan) || 'Saksi II'}
                name={data.saksi2Nama}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
