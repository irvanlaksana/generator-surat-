import React from 'react';
import { LetterData } from '../types';
import { Printer } from 'lucide-react';

interface LetterPreviewProps {
  data: LetterData;
}

export default function LetterPreview({ data }: LetterPreviewProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="h-full flex flex-col bg-[#FDFBF7]">
      <div className="flex justify-end p-4 bg-[#EBEBE4] border-b border-[#D1D1CA] print:hidden">
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-[#5A5A40] text-white rounded-lg hover:bg-[#484833] transition-colors font-medium text-sm shadow-sm"
        >
          <Printer size={16} />
          Cetak / Simpan PDF
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 print:p-0 print:overflow-visible text-black bg-[#EBEBE4] print:bg-white">
        {/* The Document Container - F4 Size (210x330mm) with 1cm Top Margin, 3.5cm Bottom Margin */}
        <div className="max-w-[210mm] min-h-[330mm] mx-auto bg-white pt-[10mm] px-[20mm] pb-[35mm] shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-[#E5E5E0] font-serif print:shadow-none print:border-none print:p-0 print:pt-[10mm] print:px-[20mm] print:pb-[35mm] print:m-0 print:max-w-none print:min-h-[330mm] text-[15px] leading-snug">
          
          {/* Kop Surat Image */}
          <div style={{ marginTop: `${data.kopImageOffsetY}px`, marginBottom: `${data.kopImageMarginBottom}px` }}>
            {data.kopImage ? (
              <img 
                src={data.kopImage} 
                alt="Kop Surat" 
                style={{
                  width: '100%',
                  height: `${data.kopImageHeight}px`,
                  objectFit: data.kopImageFit,
                  objectPosition: data.kopImageAlign
                }} 
              />
            ) : (
              <div className="border-[2px] border-dashed border-[#D1D1CA] bg-[#F5F5F0] p-8 text-center text-[#8A8A7A] text-sm font-sans rounded-xl">
                [ Area Kop Surat - Silakan unggah file gambar melalui form Isi Data ]
              </div>
            )}
          </div>

          {/* Title Section */}
          <div className="text-center mb-8">
            <h2 className="font-bold underline text-lg tracking-wide uppercase">Surat Tugas</h2>
            <p className="font-bold text-sm mt-1">Nomor: {data.letterNumber}</p>
          </div>

          {/* Body */}
          <div className="space-y-4 text-justify">
            <p>Yang bertanda tangan di bawah ini, mewakili Manajemen <strong>{data.kopCompanyName}</strong>:</p>
            
            <div className="pl-8 space-y-1 my-3">
              <div className="grid grid-cols-[100px_10px_1fr]">
                <div className="font-bold">Nama</div><div>:</div><div className="font-bold uppercase">{data.assignerName}</div>
              </div>
              <div className="grid grid-cols-[100px_10px_1fr]">
                <div className="font-bold">Jabatan</div><div>:</div><div className="font-bold uppercase">{data.assignerPosition}</div>
              </div>
            </div>

            <p>Dengan ini memberikan tugas penuh, wewenang, dan tanggung jawab penagihan di lapangan kepada :</p>

            <div className="my-4 pl-8">
              <table className="w-full text-left font-bold mb-2">
                <thead>
                  <tr>
                    <th className="pb-2 w-[40%]">Nama</th>
                    <th className="pb-2 w-[35%]">NIK</th>
                    <th className="pb-2 w-[25%]">Jabatan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="uppercase">{data.assigneeName}</td>
                    <td>{data.assigneeNIK}</td>
                    <td>{data.assigneePosition}</td>
                  </tr>
                </tbody>
              </table>
              <p className="font-normal mt-2">Dan rekan</p>
            </div>

            <p>
              Untuk melakukan konfirmasi, penagihan, dan negosiasi penyelesaian kewajiban pembayaran atas nama Debitur/Nasabah dari <strong>{data.clientName}</strong> yang penagihannya dikuasakan kepada <strong>{data.kopCompanyName}</strong>.
            </p>

            <p>Berikut data nasabah :</p>
            
            <div className="pl-8 space-y-1 mb-4">
              <div className="grid grid-cols-[200px_10px_1fr]">
                <div>No. Kontrak</div><div>:</div><div>{data.customerContract}</div>
              </div>
              <div className="grid grid-cols-[200px_10px_1fr]">
                <div>Nama</div><div>:</div><div className="uppercase">{data.customerName}</div>
              </div>
              <div className="grid grid-cols-[200px_10px_1fr]">
                <div>Alamat</div><div>:</div><div className="uppercase">{data.customerAddress}</div>
              </div>
              <div className="grid grid-cols-[200px_10px_1fr]">
                <div>Tanggal Jatuh Tempo</div><div>:</div><div className="uppercase">{data.customerDueDate}</div>
              </div>
              <div className="grid grid-cols-[200px_10px_1fr]">
                <div>Informasi Angsuran</div><div>:</div><div>{data.customerInstallment}</div>
              </div>
              <div className="grid grid-cols-[200px_10px_1fr]">
                <div>Jumlah Angsuran belum bayar</div><div>:</div><div>{data.customerUnpaidInstallmentCount}</div>
              </div>
              <div className="grid grid-cols-[200px_10px_1fr]">
                <div>DENDA</div><div>:</div><div>{data.customerPenalty}</div>
              </div>
            </div>

            <p>Adapun spesifikasi kendaraan sebagai berikut :</p>
            
            <div className="pl-8 space-y-1 mb-6">
              <div className="grid grid-cols-[200px_10px_1fr]">
                <div>Merk/Type</div><div>:</div><div className="uppercase">{data.vehicleBrand}</div>
              </div>
              <div className="grid grid-cols-[200px_10px_1fr]">
                <div>Nomor Polisi</div><div>:</div><div className="uppercase">{data.vehiclePlate}</div>
              </div>
            </div>

            <p>Pelaksanaan Surat Tugas ini wajib tunduk dan patuh pada ketentuan sebagai berikut:</p>

            {/* Rules Sections */}
            <div className="space-y-4">
              <div className="text-center font-bold mt-6 mb-2">MASA BERLAKU SURAT TUGAS</div>
              <p>
                Surat Tugas ini berlaku efektif terhitung sejak tanggal {data.validFrom} sampai dengan tanggal {data.validTo}. Apabila masa berlaku telah berakhir, Surat Tugas ini dinyatakan tidak berlaku lagi dan wajib diperpanjang melalui persetujuan Manajemen {data.kopCompanyName}.
              </p>

              <div className="text-center font-bold mt-6 mb-2">WEWENANG DAN TANGGUNG JAWAB PETUGAS</div>
              <p>Dalam menjalankan tugas penagihan di lapangan, Tim Penagihan berwenang:</p>
              <ul className="list-disc pl-8 space-y-2">
                <li className="pl-2">Mendatangi alamat domisili, kantor, atau lokasi tempat usaha Debitur sesuai data resmi yang tercantum dalam lembar kerja penagihan.</li>
                <li className="pl-2">Melakukan konfirmasi, negosiasi, dan menyampaikan Surat Peringatan (SP) atau tagihan resmi yang diterbitkan oleh Perusahaan/Kreditur/Mitra Perusahaan.</li>
                <li className="pl-2">Untuk keperluan diatas, PENERIMA TUGAS berhak untuk menerima jaminan piutang/jaminan fidusia, menandatangani dokumen - dokumen, meminta tanda tangan, serta melakukan tindakan yang dianggap perlu dalam melaksanakan tugas tersebut/meminta bantuan pihak berwajib jika diperlukan.</li>
              </ul>

              <div className="text-center font-bold mt-6 mb-2 break-before-auto">LARANGAN DAN KEPATUHAN</div>
              <ul className="list-disc pl-8 space-y-2">
                <li className="pl-2">Dilarang menerima pembayaran tunai (cash) secara langsung dari Debitur dalam bentuk apa pun, kecuali menggunakan Virtual Account resmi atau tanda terima sah dari sistem perusahaan.</li>
                <li className="pl-2">Dilarang menggunakan ancaman, kekerasan fisik, intimidasi, penekanan secara psikologis, atau tindakan melawan hukum yang melanggar Kode Etik Penagihan Bank Indonesia (BI), Otoritas Jasa Keuangan (OJK), serta Peraturan Perundang-undangan Republik Indonesia.</li>
                <li className="pl-2">Petugas wajib bersikap sopan, profesional, mengenakan pakaian rapi dan sopan selama berada di lapangan.</li>
                <li className="pl-2">Petugas wajib melaporkan hasil penagihan (Field Report) secara real-time melalui sistem aplikasi penagihan resmi {data.kopCompanyName} pada hari yang sama.</li>
              </ul>

              <div className="text-center font-bold mt-6 mb-2">SANKSI DAN TANGGUNG JAWAB HUKUM</div>
              <ul className="list-disc pl-8 space-y-2">
                <li className="pl-2">Setiap pelanggaran terhadap kode etik, penyalahgunaan wewenang, penggelapan dana penagihan, atau tindakan penyimpangan yang dilakukan oleh Petugas Penagihan akan dikenakan sanksi tegas berupa Pemutusan Hubungan Kerja (PHK) secara tidak hormat.</li>
                <li className="pl-2">Tindakan pelanggaran hukum yang dilakukan oleh Petugas di luar prosedur resmi Perusahaan menjadi tanggung jawab pribadi petugas bersangkutan secara pidana maupun perdata ({data.kopCompanyName} membebaskan diri dari segala tuntutan hukum akibat penyimpangan oknum).</li>
              </ul>

              <p className="mt-6 pt-4">
                Demikian Surat Tugas ini diterbitkan untuk dipergunakan sebagaimana mestinya dan dilaksanakan dengan penuh rasa tanggung jawab demi menjaga integritas, profesionalisme, dan nama baik {data.kopCompanyName} serta Kreditur.
              </p>
            </div>

            {/* Signatures */}
            <div className="mt-12 flex justify-between break-inside-avoid">
              <div className="w-[300px]">
                <p className="mb-24"><br/>Pemberi Tugas,<br/>{data.kopCompanyName}</p>
                <p className="font-bold underline">{data.assignerName}</p>
                <p>{data.assignerPosition}</p>
              </div>
              <div className="w-[300px]">
                <p className="mb-24">{data.signPlaceDate}<br/>Penerima Tugas,<br/>PETUGAS PENAGIHAN</p>
                <p className="font-bold underline">{data.assigneeName}</p>
              </div>
            </div>

          </div>
        </div>

        {/* Lampiran Images Page */}
        {(data.attachments && data.attachments.length > 0) && (
          <div className="max-w-[210mm] min-h-[330mm] mx-auto bg-white pt-[10mm] px-[20mm] pb-[35mm] shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-[#E5E5E0] font-serif print:shadow-none print:border-none print:p-0 print:pt-[10mm] print:px-[20mm] print:pb-[35mm] print:m-0 print:max-w-none print:min-h-[330mm] mt-8 print:mt-0 print:break-before-page">
            <h3 className="font-bold text-lg mb-6 text-center underline">Lampiran</h3>
            <div className="flex flex-col items-center gap-8">
              {data.attachments.map((att, idx) => (
                <img 
                  key={idx} 
                  src={att.url} 
                  alt={`Lampiran ${idx + 1}`} 
                  style={{ width: `${att.width}px`, height: `${att.height}px` }}
                  className="object-contain border-2 border-dashed border-[#D1D1CA] p-2" 
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
