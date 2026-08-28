import React, { useState } from 'react';
import LetterForm from './components/LetterForm';
import LetterPreview from './components/LetterPreview';
import { LetterData } from './types';
import { FileText } from 'lucide-react';

const initialData: LetterData = {
  kopImage: null,
  kopImageHeight: 120,
  kopImageFit: 'contain',
  kopImageAlign: 'center',
  kopCompanyName: 'PT. MITRA JASATRIA INDONESIA',
  letterNumber: 'ST-DC/MJI/2026/08/0483',
  assignerName: 'FILEMO HALAWA',
  assignerPosition: 'DIREKTUR',
  assigneeName: 'RIZKY JUANDA SAPUTRA',
  assigneeNIK: '3302242201940001',
  assigneePosition: 'Petugas Penagihan',
  clientName: 'Koperasi Anugrah Mega Mandiri (KAMM)',
  customerContract: '00730191',
  customerName: 'KISNO ANGKAH TRI HIDAYAT',
  customerAddress: 'KALIKABONG RT 004 RW 002, KALIMANAH',
  customerDueDate: '2 FEBRUARI 2024',
  customerInstallment: 'Rp. 385.000 (Angsuran ke 8 s/d 18)',
  customerUnpaidInstallmentCount: '10 Bulan',
  customerPenalty: 'Rp. 41.692.000',
  attachmentImages: [],
  vehicleBrand: 'YAMAHA / VIXION',
  vehiclePlate: 'R4088YV',
  validFrom: '21 Agustus 2026',
  validTo: '31 Agustus 2026',
  signPlaceDate: 'Purwokerto, 22 Agustus 2026'
};

export default function App() {
  const [data, setData] = useState<LetterData>(initialData);
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F0] font-sans text-[#4A4A4A]">
      <header className="bg-[#EBEBE4] border-b border-[#D1D1CA] px-6 py-4 flex items-center gap-3 print:hidden shadow-sm z-10">
        <div className="bg-[#5A5A40] p-2 rounded-lg text-white">
          <FileText size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#2C2C24]">Surat Tugas Generator</h1>
          <p className="text-xs text-[#8A8A7A]">Sistem Pembuat Surat Tugas Penagihan</p>
        </div>
      </header>

      {/* Mobile Tabs */}
      <div className="lg:hidden flex bg-[#EBEBE4] border-b border-[#D1D1CA] print:hidden">
        <button
          onClick={() => setActiveTab('form')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'form' ? 'text-[#5A5A40] border-b-2 border-[#5A5A40]' : 'text-[#8A8A7A] hover:text-[#4A4A4A]'}`}
        >
          Isi Data
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'preview' ? 'text-[#5A5A40] border-b-2 border-[#5A5A40]' : 'text-[#8A8A7A] hover:text-[#4A4A4A]'}`}
        >
          Pratinjau Surat
        </button>
      </div>

      <main className="flex-1 flex overflow-hidden">
        {/* Form Panel */}
        <div className={`w-full lg:w-[450px] xl:w-[500px] border-r border-[#D1D1CA] bg-[#EBEBE4] flex-col overflow-hidden ${activeTab === 'form' ? 'flex' : 'hidden lg:flex'} print:hidden`}>
          <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
            <LetterForm data={data} onChange={setData} />
          </div>
        </div>

        {/* Preview Panel */}
        <div className={`flex-1 flex-col overflow-hidden bg-[#FDFBF7] ${activeTab === 'preview' ? 'flex' : 'hidden lg:flex'} print:block print:bg-white`}>
          <LetterPreview data={data} />
        </div>
      </main>
    </div>
  );
}
