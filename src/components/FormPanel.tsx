import React, { useState } from 'react';
import { BastData, ChecklistMap, ItemCondition, VehicleType } from '../types';
import { getChecklistDefinitions } from '../data/defaults';
import { 
  Bike, 
  Car, 
  Building2, 
  UserCheck, 
  User, 
  FileText, 
  CheckSquare, 
  Sparkles,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  MinusCircle
} from 'lucide-react';

interface FormPanelProps {
  data: BastData;
  set: <K extends keyof BastData>(key: K, value: BastData[K]) => void;
  setJenis: (j: VehicleType) => void;
  setChecklist: (c: ChecklistMap) => void;
}

export default function FormPanel({ data, set, setJenis, setChecklist }: FormPanelProps) {
  const [activeSection, setActiveSection] = useState<'info' | 'kendaraan' | 'checklist' | 'ttd'>('info');
  const checklistDefs = getChecklistDefinitions(data.jenis);

  const inputClass =
    'w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent transition-all shadow-xs';
  const labelClass = 'block text-[11px] font-semibold text-slate-600 mb-1';

  const updateField = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    set(name as keyof BastData, value);
  };

  const handleItemStatusChange = (id: string, status: ItemCondition) => {
    const current = data.checklist[id] || { status: 'baik', catatan: '' };
    setChecklist({
      ...data.checklist,
      [id]: {
        ...current,
        status,
        catatan:
          status === 'baik'
            ? 'Lengkap & Baik'
            : status === 'rusak'
            ? 'Rusak / Lecet'
            : 'Tidak Ada / Tidak Diserahkan',
      },
    });
  };

  const handleItemNoteChange = (id: string, catatan: string) => {
    const current = data.checklist[id] || { status: 'baik', catatan: '' };
    setChecklist({
      ...data.checklist,
      [id]: {
        ...current,
        catatan,
      },
    });
  };

  const setAllStatus = (status: ItemCondition) => {
    const updated: ChecklistMap = {};
    for (const def of checklistDefs) {
      updated[def.id] = {
        status,
        catatan:
          status === 'baik'
            ? 'Lengkap & Baik'
            : status === 'rusak'
            ? 'Rusak'
            : 'Tidak Ada',
      };
    }
    setChecklist(updated);
  };

  return (
    <div className="space-y-4">
      {/* Jenis Kendaraan Selector */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
          Kategori Kendaraan
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setJenis('roda2')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              data.jenis === 'roda2'
                ? 'bg-[#5A5A40] text-white shadow-sm ring-2 ring-[#5A5A40]/30'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Bike size={16} />
            Roda 2 (Motor)
          </button>
          <button
            type="button"
            onClick={() => setJenis('roda4')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              data.jenis === 'roda4'
                ? 'bg-[#5A5A40] text-white shadow-sm ring-2 ring-[#5A5A40]/30'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Car size={16} />
            Roda 4 (Mobil)
          </button>
        </div>
      </div>

      {/* Navigation Pills inside Form */}
      <div className="flex rounded-lg bg-slate-200/80 p-1 gap-1 text-[11px] font-medium">
        <button
          type="button"
          onClick={() => setActiveSection('info')}
          className={`flex-1 py-1.5 px-2 rounded-md transition-all ${
            activeSection === 'info' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Pihak & Kontrak
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('kendaraan')}
          className={`flex-1 py-1.5 px-2 rounded-md transition-all ${
            activeSection === 'kendaraan' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Unit Kendaraan
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('checklist')}
          className={`flex-1 py-1.5 px-2 rounded-md transition-all ${
            activeSection === 'checklist' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Checklist ({checklistDefs.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('ttd')}
          className={`flex-1 py-1.5 px-2 rounded-md transition-all ${
            activeSection === 'ttd' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          TTD & Saksi
        </button>
      </div>

      {/* SECTION 1: INFO PIHAK & KONTRAK */}
      {activeSection === 'info' && (
        <div className="space-y-3.5">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Building2 size={15} className="text-[#5A5A40]" />
              <h3 className="text-xs font-bold text-slate-800">Data Perusahaan & Nomor Surat</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>No. BAST</label>
                <input type="text" name="nomorBast" value={data.nomorBast} onChange={updateField} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>No. Penyerahan</label>
                <input type="text" name="nomorPenyerahan" value={data.nomorPenyerahan} onChange={updateField} className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Nama Perusahaan</label>
              <input type="text" name="perusahaan" value={data.perusahaan} onChange={updateField} className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>Cabang</label>
                <input type="text" name="cabang" value={data.cabang} onChange={updateField} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Telepon / Kontak</label>
                <input type="text" name="telepon" value={data.telepon} onChange={updateField} className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Alamat Kantor</label>
              <input type="text" name="alamat" value={data.alamat} onChange={updateField} className={inputClass} />
            </div>
          </div>

          {/* Petugas */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <UserCheck size={15} className="text-[#5A5A40]" />
              <h3 className="text-xs font-bold text-slate-800">Pihak Kedua (Petugas Penerima)</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>Nama Petugas</label>
                <input type="text" name="petugasNama" value={data.petugasNama} onChange={updateField} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>NIK / ID Petugas</label>
                <input type="text" name="petugasNik" value={data.petugasNik} onChange={updateField} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>Jabatan</label>
                <input type="text" name="petugasJabatan" value={data.petugasJabatan} onChange={updateField} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>No. HP / WhatsApp</label>
                <input type="text" name="petugasHp" value={data.petugasHp} onChange={updateField} className={inputClass} />
              </div>
            </div>
          </div>

          {/* Debitur */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <User size={15} className="text-[#5A5A40]" />
              <h3 className="text-xs font-bold text-slate-800">Pihak Pertama (Debitur / Penyerah)</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>Nama Debitur / Konsumen</label>
                <input type="text" name="debiturNama" value={data.debiturNama} onChange={updateField} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>No. KTP / NIK</label>
                <input type="text" name="debiturNik" value={data.debiturNik} onChange={updateField} className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Alamat Lengkap</label>
              <input type="text" name="debiturAlamat" value={data.debiturAlamat} onChange={updateField} className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>No. HP Debitur</label>
                <input type="text" name="debiturHp" value={data.debiturHp} onChange={updateField} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>No. Kontrak / Perjanjian</label>
                <input type="text" name="nomorKontrak" value={data.nomorKontrak} onChange={updateField} className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Kreditur / Leasing / Lembaga</label>
              <input type="text" name="krediturLeasing" value={data.krediturLeasing} onChange={updateField} className={inputClass} />
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: UNIT KENDARAAN */}
      {activeSection === 'kendaraan' && (
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <FileText size={15} className="text-[#5A5A40]" />
            <h3 className="text-xs font-bold text-slate-800">Spesifikasi & Identitas Kendaraan</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Merk Kendaraan</label>
              <input type="text" name="kendaraanMerk" value={data.kendaraanMerk} onChange={updateField} className={inputClass} placeholder="Contoh: TOYOTA / HONDA" />
            </div>
            <div>
              <label className={labelClass}>Tipe / Model</label>
              <input type="text" name="kendaraanType" value={data.kendaraanType} onChange={updateField} className={inputClass} placeholder="Contoh: AVANZA 1.3 G" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className={labelClass}>Nomor Polisi</label>
              <input type="text" name="kendaraanNoPol" value={data.kendaraanNoPol} onChange={updateField} className={inputClass} placeholder="R 1234 XX" />
            </div>
            <div>
              <label className={labelClass}>Tahun</label>
              <input type="text" name="kendaraanTahun" value={data.kendaraanTahun} onChange={updateField} className={inputClass} placeholder="2022" />
            </div>
            <div>
              <label className={labelClass}>Warna</label>
              <input type="text" name="kendaraanWarna" value={data.kendaraanWarna} onChange={updateField} className={inputClass} placeholder="Hitam" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Nomor Rangka (VIN)</label>
              <input type="text" name="kendaraanNoRangka" value={data.kendaraanNoRangka} onChange={updateField} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Nomor Mesin</label>
              <input type="text" name="kendaraanNoMesin" value={data.kendaraanNoMesin} onChange={updateField} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Odometer (KM)</label>
              <input type="text" name="kendaraanOdometer" value={data.kendaraanOdometer} onChange={updateField} className={inputClass} placeholder="45.000 KM" />
            </div>
            <div>
              <label className={labelClass}>Posisi Bahan Bakar</label>
              <input type="text" name="kendaraanBahanBakar" value={data.kendaraanBahanBakar} onChange={updateField} className={inputClass} placeholder="1/2 Tangki / 3 Bar" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Kelengkapan STNK</label>
              <input type="text" name="kendaraanStnk" value={data.kendaraanStnk} onChange={updateField} className={inputClass} placeholder="Ada (Pajak s/d 2026)" />
            </div>
            <div>
              <label className={labelClass}>Status BPKB</label>
              <input type="text" name="kendaraanBpkb" value={data.kendaraanBpkb} onChange={updateField} className={inputClass} placeholder="Dalam Jaminan" />
            </div>
          </div>
          <div>
            <label className={labelClass}>Kondisi Mesin & Transmisi</label>
            <input type="text" name="kendaraanKondisiMesin" value={data.kendaraanKondisiMesin} onChange={updateField} className={inputClass} placeholder="Normal / Hidup / Suara Halus" />
          </div>
          <div>
            <label className={labelClass}>Catatan Kondisi Bodi & Eksterior</label>
            <textarea
              name="kendaraanKondisiBodi"
              value={data.kendaraanKondisiBodi}
              onChange={updateField}
              rows={2}
              className={`${inputClass} resize-none`}
              placeholder="Catatan lecet bodi, baret, penyok, dll."
            />
          </div>
        </div>
      )}

      {/* SECTION 3: CHECKLIST KOMPONEN */}
      {activeSection === 'checklist' && (
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <CheckSquare size={15} className="text-[#5A5A40]" />
              <h3 className="text-xs font-bold text-slate-800">Checklist Fisik ({data.jenis === 'roda2' ? 'Motor' : 'Mobil'})</h3>
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setAllStatus('baik')}
                className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded border border-emerald-200 cursor-pointer"
              >
                Set Semua Baik
              </button>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
            {checklistDefs.map((def) => {
              const current = data.checklist[def.id] || { status: 'baik', catatan: '' };
              const status = current.status;

              return (
                <div key={def.id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-800">{def.nama}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{def.kategori}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleItemStatusChange(def.id, 'baik')}
                      className={`flex-1 flex items-center justify-center gap-1 py-1 px-1.5 rounded text-[10.5px] font-semibold transition-all cursor-pointer ${
                        status === 'baik'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <CheckCircle2 size={12} />
                      Baik (✓)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleItemStatusChange(def.id, 'rusak')}
                      className={`flex-1 flex items-center justify-center gap-1 py-1 px-1.5 rounded text-[10.5px] font-semibold transition-all cursor-pointer ${
                        status === 'rusak'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <AlertTriangle size={12} />
                      Rusak (✗)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleItemStatusChange(def.id, 'tidak_ada')}
                      className={`flex-1 flex items-center justify-center gap-1 py-1 px-1.5 rounded text-[10.5px] font-semibold transition-all cursor-pointer ${
                        status === 'tidak_ada'
                          ? 'bg-slate-700 text-white shadow-xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <MinusCircle size={12} />
                      Tdk Ada (—)
                    </button>
                  </div>

                  <input
                    type="text"
                    value={current.catatan || ''}
                    onChange={(e) => handleItemNoteChange(def.id, e.target.value)}
                    placeholder="Catatan / keterangan tambahan..."
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#5A5A40]"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 4: TTD & SAKSI */}
      {activeSection === 'ttd' && (
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <UserCheck size={15} className="text-[#5A5A40]" />
            <h3 className="text-xs font-bold text-slate-800">Tempat, Tanggal & Saksi</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Kota / Tempat</label>
              <input type="text" name="kota" value={data.kota} onChange={updateField} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Tanggal Pelaksanaan</label>
              <input type="text" name="tanggal" value={data.tanggal} onChange={updateField} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Nama Saksi 1</label>
              <input type="text" name="saksi1Nama" value={data.saksi1Nama} onChange={updateField} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Jabatan / Status Saksi 1</label>
              <input type="text" name="saksi1Jabatan" value={data.saksi1Jabatan} onChange={updateField} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Nama Saksi 2</label>
              <input type="text" name="saksi2Nama" value={data.saksi2Nama} onChange={updateField} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Jabatan / Status Saksi 2</label>
              <input type="text" name="saksi2Jabatan" value={data.saksi2Jabatan} onChange={updateField} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Catatan Khusus / Pernyataan Tambahan</label>
            <textarea
              name="catatanKhusus"
              value={data.catatanKhusus}
              onChange={updateField}
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
