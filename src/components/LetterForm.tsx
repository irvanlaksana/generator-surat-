import React, { useState, useEffect } from 'react';
import { LetterData } from '../types';
import { generateLetterNumber, generateOfficialLetterNumber } from '../utils/letterNumber';
import { fetchFirebaseData, EmployeeDoc, DebtorDoc } from '../services/firebaseService';
import { Users, Building2, Search, Check, ChevronDown, Sparkles, Filter, Bike, Car } from 'lucide-react';

interface LetterFormProps {
  data: LetterData;
  onChange: (data: LetterData) => void;
}

export default function LetterForm({ data, onChange }: LetterFormProps) {
  const [employees, setEmployees] = useState<EmployeeDoc[]>([]);
  const [debtors, setDebtors] = useState<DebtorDoc[]>([]);
  const [multifinances, setMultifinances] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Modals / Dropdowns state
  const [showEmployeePicker, setShowEmployeePicker] = useState(false);
  const [showDebtorPicker, setShowDebtorPicker] = useState(false);
  const [searchEmployeeQuery, setSearchEmployeeQuery] = useState('');
  const [searchDebtorQuery, setSearchDebtorQuery] = useState('');
  const [selectedMultifinance, setSelectedMultifinance] = useState('all');

  // Load Firestore collections on mount
  useEffect(() => {
    const loadFirestore = async () => {
      setLoadingData(true);
      try {
        const res = await fetchFirebaseData();
        setEmployees(res.employees);
        setDebtors(res.debtors);
        setMultifinances(res.multifinances);
      } catch (err) {
        console.error('Error loading Firestore data in form:', err);
      } finally {
        setLoadingData(false);
      }
    };
    loadFirestore();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const parsedValue = (type === 'range' || type === 'number') ? Number(value) : value;
    onChange({ ...data, [name]: parsedValue });
  };

  const handleGenerateLetterNumber = () => {
    onChange({
      ...data,
      letterNumber: generateOfficialLetterNumber({
        type: 'ST',
        companyName: data.kopCompanyName,
      }),
    });
  };

  // Pilih Petugas / Karyawan
  const selectEmployee = (emp: EmployeeDoc) => {
    onChange({
      ...data,
      assigneeName: emp.nama,
      assigneeNIK: emp.nik,
      assigneePosition: emp.jabatan,
    });
    setShowEmployeePicker(false);
  };

  // Pilih Debitur / Nasabah dari Multifinance
  const selectDebtor = (deb: DebtorDoc) => {
    onChange({
      ...data,
      clientName: deb.multifinance,
      customerContract: deb.nomorKontrak,
      customerName: deb.namaNasabah,
      customerAddress: deb.alamat,
      customerDueDate: deb.jatuhTempo,
      customerPenalty: deb.denda,
      customerInstallment: deb.angsuran,
      customerUnpaidInstallmentCount: deb.unpaidCount || '10 Bulan',
      vehicleBrand: deb.kendaraanType ? `${deb.kendaraanMerk} / ${deb.kendaraanType}` : deb.kendaraanMerk,
      vehiclePlate: deb.kendaraanNoPol,
    });
    setShowDebtorPicker(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange({ ...data, kopImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    let processed = 0;
    const newAttachments: { url: string, width: number, height: number }[] = [];
    
    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newAttachments.push({ url: reader.result as string, width: 600, height: 400 });
        processed++;
        if (processed === files.length) {
          onChange({ ...data, attachments: [...(data.attachments || []), ...newAttachments] });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index: number) => {
    const newAttachments = [...(data.attachments || [])];
    newAttachments.splice(index, 1);
    onChange({ ...data, attachments: newAttachments });
  };

  const updateAttachmentDimension = (index: number, field: 'width' | 'height', value: number) => {
    const newAttachments = [...(data.attachments || [])];
    newAttachments[index] = { ...newAttachments[index], [field]: value };
    onChange({ ...data, attachments: newAttachments });
  };

  const [activeCategory, setActiveCategory] = useState<'semua' | 'tugas' | 'nasabah' | 'kendaraan' | 'foto'>('semua');

  const sectionClass = "bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2.5";
  const headingClass = "text-xs font-bold text-slate-800 pb-1.5 border-b border-slate-100 uppercase tracking-wider flex items-center justify-between";
  const labelClass = "block text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-0.5";
  const inputClass = "w-full px-2.5 py-1.5 border border-slate-300 bg-white rounded-lg focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40] outline-none transition-all text-slate-800 placeholder:text-slate-400 text-xs shadow-2xs";

  // Filtered lists for modals
  const filteredEmployees = employees.filter((e) => {
    const q = searchEmployeeQuery.toLowerCase();
    return e.nama.toLowerCase().includes(q) || e.nik.toLowerCase().includes(q) || e.jabatan.toLowerCase().includes(q);
  });

  const filteredDebtors = debtors.filter((d) => {
    const q = searchDebtorQuery.toLowerCase();
    const matchesQuery =
      d.namaNasabah.toLowerCase().includes(q) ||
      d.nomorKontrak.toLowerCase().includes(q) ||
      d.kendaraanNoPol.toLowerCase().includes(q) ||
      d.alamat.toLowerCase().includes(q);
    const matchesMf = selectedMultifinance === 'all' || d.multifinance === selectedMultifinance;
    return matchesQuery && matchesMf;
  });

  return (
    <div className="space-y-2.5 pb-4">
      {/* Category Pills Switcher for quick navigation */}
      <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-[11px] font-semibold sticky top-0 z-10 shadow-xs backdrop-blur">
        <button
          type="button"
          onClick={() => setActiveCategory('semua')}
          className={`flex-1 py-1 px-1.5 rounded-md transition-all cursor-pointer text-center ${
            activeCategory === 'semua' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Semua
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory('tugas')}
          className={`flex-1 py-1 px-1.5 rounded-md transition-all cursor-pointer text-center ${
            activeCategory === 'tugas' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Pihak
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory('nasabah')}
          className={`flex-1 py-1 px-1.5 rounded-md transition-all cursor-pointer text-center ${
            activeCategory === 'nasabah' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Debitur
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory('kendaraan')}
          className={`flex-1 py-1 px-1.5 rounded-md transition-all cursor-pointer text-center ${
            activeCategory === 'kendaraan' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Unit & Kop
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory('foto')}
          className={`flex-1 py-1 px-1.5 rounded-md transition-all cursor-pointer text-center ${
            activeCategory === 'foto' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Lampiran
        </button>
      </div>

      {/* 1. Informasi Surat */}
      {(activeCategory === 'semua' || activeCategory === 'tugas') && (
        <section className={sectionClass}>
          <h2 className={headingClass}>
            <span>Informasi Surat</span>
          </h2>
          <div className="space-y-2.5">
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label className={labelClass}>No. Surat Tugas (Resmi)</label>
                <button
                  type="button"
                  onClick={handleGenerateLetterNumber}
                  className="text-[10px] text-[#5A5A40] hover:text-[#383826] font-bold flex items-center gap-0.5 hover:underline cursor-pointer"
                >
                  <Sparkles size={10} />
                  <span>Generate</span>
                </button>
              </div>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  name="letterNumber"
                  value={data.letterNumber}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="001/ST/MJI/29/VIII/2026"
                />
                <button
                  type="button"
                  id="btn-generate-st-number"
                  onClick={handleGenerateLetterNumber}
                  className="shrink-0 flex items-center gap-1 rounded-lg bg-[#5A5A40] hover:bg-[#484833] text-white px-2.5 py-1.5 text-xs font-bold transition cursor-pointer shadow-2xs"
                  title="Generate nomor surat tugas resmi"
                >
                  <Sparkles size={11} />
                  <span>Generate</span>
                </button>
              </div>
              <p className="text-[9.5px] text-slate-500 mt-0.5">
                Format: <code>[No]/ST/[Inisial]/[Tgl]/[BulanRomawi]/[Tahun]</code>
              </p>
            </div>
            <div>
              <label className={labelClass}>Tempat & Tanggal (Tanda Tangan)</label>
              <input type="text" name="signPlaceDate" value={data.signPlaceDate} onChange={handleChange} className={inputClass} />
            </div>
          </div>
        </section>
      )}

      {/* 2. Pemberi Tugas & Penerima Tugas */}
      {(activeCategory === 'semua' || activeCategory === 'tugas') && (
        <>
          <section className={sectionClass}>
            <h2 className={headingClass}>
              <span>Pemberi Tugas</span>
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>Nama</label>
                <input type="text" name="assignerName" value={data.assignerName} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Jabatan</label>
                <input type="text" name="assignerPosition" value={data.assignerPosition} onChange={handleChange} className={inputClass} />
              </div>
            </div>
          </section>

          <section className={sectionClass}>
            <div className={headingClass}>
              <span>Penerima Tugas</span>
              <button
                type="button"
                onClick={() => setShowEmployeePicker(true)}
                className="flex items-center gap-1 px-2 py-0.5 bg-[#2D6A4F] hover:bg-[#1B4332] text-white rounded-md text-[10.5px] font-bold transition shadow-2xs cursor-pointer"
              >
                <Users size={11} />
                <span>Tarik Karyawan</span>
              </button>
            </div>

            <div className="space-y-2">
              <div>
                <label className={labelClass}>Nama Petugas</label>
                <input type="text" name="assigneeName" value={data.assigneeName} onChange={handleChange} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>NIK</label>
                  <input type="text" name="assigneeNIK" value={data.assigneeNIK} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Jabatan</label>
                  <input type="text" name="assigneePosition" value={data.assigneePosition} onChange={handleChange} className={inputClass} />
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* 3. Detail Klien & Masa Berlaku */}
      {(activeCategory === 'semua' || activeCategory === 'nasabah') && (
        <>
          <section className={sectionClass}>
            <div className={headingClass}>
              <span>Klien / Multifinance</span>
              <button
                type="button"
                onClick={() => setShowDebtorPicker(true)}
                className="flex items-center gap-1 px-2 py-0.5 bg-[#5A5A40] hover:bg-[#484833] text-white rounded-md text-[10.5px] font-bold transition shadow-2xs cursor-pointer"
              >
                <Building2 size={11} />
                <span>Tarik Data</span>
              </button>
            </div>

            <div className="space-y-2">
              <div>
                <label className={labelClass}>Kreditur (Multifinance / Leasing)</label>
                <input type="text" name="clientName" value={data.clientName} onChange={handleChange} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>Berlaku Mulai</label>
                  <input type="text" name="validFrom" value={data.validFrom} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Berlaku Sampai</label>
                  <input type="text" name="validTo" value={data.validTo} onChange={handleChange} className={inputClass} />
                </div>
              </div>
            </div>
          </section>

          {/* 4. DATA NASABAH */}
          <section className={sectionClass}>
            <div className={headingClass}>
              <span>Data Nasabah / Debitur</span>
              <button
                type="button"
                onClick={() => setShowDebtorPicker(true)}
                className="flex items-center gap-1 px-2 py-0.5 bg-[#5A5A40] hover:bg-[#484833] text-white rounded-md text-[10.5px] font-bold transition shadow-2xs cursor-pointer"
              >
                <Building2 size={11} />
                <span>Pilih Debitur</span>
              </button>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>No. Kontrak</label>
                  <input type="text" name="customerContract" value={data.customerContract} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Nama Nasabah</label>
                  <input type="text" name="customerName" value={data.customerName} onChange={handleChange} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Alamat</label>
                <textarea name="customerAddress" value={data.customerAddress} onChange={handleChange} rows={2} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>Jatuh Tempo</label>
                  <input type="text" name="customerDueDate" value={data.customerDueDate} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Total Denda</label>
                  <input type="text" name="customerPenalty" value={data.customerPenalty} onChange={handleChange} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Angsuran / Keterangan</label>
                <input type="text" name="customerInstallment" value={data.customerInstallment} onChange={handleChange} className={inputClass} placeholder="Rp. 385.000 (Angsuran ke 8 s/d 18)" />
              </div>
            </div>
          </section>
        </>
      )}

      {/* 5. Data Kendaraan & Kop Surat */}
      {(activeCategory === 'semua' || activeCategory === 'kendaraan') && (
        <>
          <section className={sectionClass}>
            <h2 className={headingClass}>
              <span>Data Kendaraan</span>
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>Merk / Tipe</label>
                <input type="text" name="vehicleBrand" value={data.vehicleBrand} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Nomor Polisi</label>
                <input type="text" name="vehiclePlate" value={data.vehiclePlate} onChange={handleChange} className={inputClass} />
              </div>
            </div>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>
              <span>Kop Surat & Perusahaan</span>
            </h2>
            <div className="space-y-2">
              <div>
                <label className={labelClass}>Nama Perusahaan (Teks Surat)</label>
                <input type="text" name="kopCompanyName" value={data.kopCompanyName} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Upload Gambar Kop</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[11px] file:font-bold file:bg-[#5A5A40] file:text-white hover:file:bg-[#484833] transition cursor-pointer" 
                />
                {data.kopImage && (
                  <div className="mt-2 space-y-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                      <span className="text-[10px] font-bold text-slate-700">Pengaturan Kop</span>
                      <button
                        type="button"
                        onClick={() => onChange({ ...data, kopImage: null })}
                        className="text-[10px] text-rose-600 font-bold hover:underline"
                      >
                        Hapus Kop
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9.5px] font-bold text-slate-600">Tinggi: {data.kopImageHeight}px</label>
                        <input type="range" min="50" max="300" name="kopImageHeight" value={data.kopImageHeight} onChange={handleChange} className="w-full accent-[#5A5A40]" />
                      </div>
                      <div>
                        <label className="block text-[9.5px] font-bold text-slate-600">Jarak Bawah: {data.kopImageMarginBottom}px</label>
                        <input type="range" min="-30" max="150" name="kopImageMarginBottom" value={data.kopImageMarginBottom} onChange={handleChange} className="w-full accent-[#5A5A40]" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9.5px] font-bold text-slate-600">Skala</label>
                        <select name="kopImageFit" value={data.kopImageFit} onChange={handleChange} className={inputClass + " text-[11px] py-1"}>
                          <option value="contain">Contain</option>
                          <option value="fill">Fill</option>
                          <option value="cover">Cover</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9.5px] font-bold text-slate-600">Posisi</label>
                        <select name="kopImageAlign" value={data.kopImageAlign} onChange={handleChange} className={inputClass + " text-[11px] py-1"}>
                          <option value="center">Tengah</option>
                          <option value="left">Kiri</option>
                          <option value="right">Kanan</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </>
      )}

      {/* 6. Lampiran Foto */}
      {(activeCategory === 'semua' || activeCategory === 'foto') && (
        <section className={sectionClass}>
          <h2 className={headingClass}>
            <span>Lampiran Foto Dokumen</span>
          </h2>
          <div className="space-y-2">
            <div>
              <label className={labelClass}>Upload Foto (KTP, STNK, Unit, dll)</label>
              <input 
                type="file" 
                accept="image/*" 
                multiple
                onChange={handleAttachmentUpload} 
                className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[11px] file:font-bold file:bg-[#5A5A40] file:text-white hover:file:bg-[#484833] transition cursor-pointer" 
              />
            </div>
            {(data.attachments && data.attachments.length > 0) && (
              <div className="grid grid-cols-1 gap-2 mt-2">
                {data.attachments.map((att, idx) => (
                  <div key={idx} className="relative border border-slate-200 p-2 rounded-lg bg-slate-50">
                    <img src={att.url} alt={`Preview ${idx}`} className="w-full h-24 object-contain bg-white rounded border border-slate-200 mb-1.5" />
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-600">Lebar: {att.width}px</label>
                        <input type="range" min="100" max="800" value={att.width} onChange={(e) => updateAttachmentDimension(idx, 'width', Number(e.target.value))} className="w-full accent-[#5A5A40]" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-600">Tinggi: {att.height}px</label>
                        <input type="range" min="100" max="800" value={att.height} onChange={(e) => updateAttachmentDimension(idx, 'height', Number(e.target.value))} className="w-full accent-[#5A5A40]" />
                      </div>
                    </div>

                    <button 
                      onClick={() => removeAttachment(idx)}
                      className="absolute top-1.5 right-1.5 bg-rose-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow hover:bg-rose-700 transition"
                      title="Hapus foto"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TARIK DATA KARYAWAN */}
      {/* ========================================================================= */}
      {showEmployeePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#2D6A4F] text-white rounded-xl">
                  <Users size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Pilih Data Karyawan / Petugas</h3>
                  <p className="text-xs text-slate-500">Tarik data untuk mengisi nama, NIK, dan jabatan penerima tugas</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEmployeePicker(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="absolute left-3.5 top-2.5 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Cari nama karyawan, NIK, atau jabatan..."
                  value={searchEmployeeQuery}
                  onChange={(e) => setSearchEmployeeQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#2D6A4F] focus:bg-white transition"
                  autoFocus
                />
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-2 custom-scrollbar bg-slate-50/50">
              {filteredEmployees.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Tidak ditemukan karyawan yang sesuai pencarian.
                </div>
              ) : (
                filteredEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    onClick={() => selectEmployee(emp)}
                    className="p-3 bg-white rounded-xl border border-slate-200 hover:border-[#2D6A4F] hover:shadow-sm transition cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 uppercase">{emp.nama}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                          {emp.jabatan}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">
                        NIK: <strong className="font-mono">{emp.nik}</strong> {emp.cabang && `| Cabang: ${emp.cabang}`} {emp.hp && `| HP: ${emp.hp}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="px-3 py-1.5 bg-[#2D6A4F] text-white text-xs font-bold rounded-lg hover:bg-[#1B4332]"
                    >
                      Pilih
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowEmployeePicker(false)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TARIK DATA DEBITUR DARI SEMUA MULTIFINANCE */}
      {/* ========================================================================= */}
      {showDebtorPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#5A5A40] text-white rounded-xl">
                  <Building2 size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Pilih Data Debitur (Semua Multifinance)</h3>
                  <p className="text-xs text-slate-500">Tarik data nasabah, kontrak, denda, dan kendaraan otomatis</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDebtorPicker(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50"
              >
                ✕
              </button>
            </div>

            <div className="px-4 py-2.5 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Filter size={13} className="text-slate-500" />
                <span className="text-xs font-semibold text-slate-700">Filter Multifinance:</span>
                <select
                  value={selectedMultifinance}
                  onChange={(e) => setSelectedMultifinance(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800"
                >
                  <option value="all">Semua Multifinance ({debtors.length})</option>
                  {multifinances.map((mf) => (
                    <option key={mf} value={mf}>{mf}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-3.5 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="absolute left-3.5 top-2.5 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Cari nama nasabah, nomor kontrak, plat nomor, atau alamat..."
                  value={searchDebtorQuery}
                  onChange={(e) => setSearchDebtorQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#5A5A40] focus:bg-white transition"
                  autoFocus
                />
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-2.5 custom-scrollbar bg-slate-50/50">
              {filteredDebtors.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Tidak ditemukan debitur yang cocok dengan filter atau kata kunci.
                </div>
              ) : (
                filteredDebtors.map((deb) => (
                  <div
                    key={deb.id}
                    onClick={() => selectDebtor(deb)}
                    className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-[#5A5A40] hover:shadow-sm transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 uppercase">{deb.namaNasabah}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                          {deb.multifinance}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {deb.nomorKontrak}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-700 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                        <span className="font-semibold">
                          🚗 {deb.kendaraanMerk} {deb.kendaraanType} ({deb.kendaraanNoPol})
                        </span>
                        <span className="text-slate-500">📍 {deb.alamat}</span>
                      </div>
                      <div className="text-[10.5px] text-slate-600 flex flex-wrap items-center gap-x-3">
                        <span className="text-rose-600 font-semibold">Denda: {deb.denda}</span>
                        <span>Angsuran: {deb.angsuran}</span>
                        <span>Jatuh Tempo: {deb.jatuhTempo}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="px-3.5 py-1.5 bg-[#5A5A40] text-white text-xs font-bold rounded-lg hover:bg-[#484833] shrink-0"
                    >
                      Pilih Nasabah
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDebtorPicker(false)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
