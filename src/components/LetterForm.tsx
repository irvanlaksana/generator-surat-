import React from 'react';
import { LetterData } from '../types';
import { generateLetterNumber } from '../utils/letterNumber';

interface LetterFormProps {
  data: LetterData;
  onChange: (data: LetterData) => void;
}

export default function LetterForm({ data, onChange }: LetterFormProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const parsedValue = (type === 'range' || type === 'number') ? Number(value) : value;
    onChange({ ...data, [name]: parsedValue });
  };

  const handleGenerateLetterNumber = () => {
    onChange({ ...data, letterNumber: generateLetterNumber() });
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

  const sectionClass = "bg-white/60 p-5 rounded-xl border border-[#D1D1CA] shadow-sm";
  const headingClass = "text-sm font-bold text-[#2C2C24] mb-4 pb-2 border-b border-[#D1D1CA] uppercase tracking-wider";
  const labelClass = "block text-[11px] uppercase tracking-wider font-bold text-[#8A8A7A] mb-1";
  const inputClass = "w-full px-3 py-2 border border-[#D1D1CA] bg-white/80 rounded-lg focus:ring-2 focus:ring-[#5A5A40]/20 focus:border-[#5A5A40] outline-none transition-all text-[#2C2C24] placeholder:text-[#A1A191] text-sm";

  return (
    <div className="space-y-6 h-full overflow-y-auto pb-12 pr-2">
      <section className={sectionClass}>
        <h2 className={headingClass}>Kop Surat</h2>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Gambar Kop Surat</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload} 
              className="w-full text-sm text-[#4A4A4A] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#5A5A40] file:text-white hover:file:bg-[#484833] transition-all cursor-pointer" 
            />
            {data.kopImage && (
              <div className="mt-4 space-y-3 p-3 bg-[#EBEBE4]/50 rounded-lg border border-[#D1D1CA]">
                <p className="text-[10px] font-bold text-[#5A5A40] uppercase border-b border-[#D1D1CA] pb-1">Pengaturan Gambar Kop</p>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-[#4A4A4A] mb-1">Tinggi Gambar: {data.kopImageHeight}px</label>
                    <input type="range" min="50" max="400" name="kopImageHeight" value={data.kopImageHeight} onChange={handleChange} className="w-full accent-[#5A5A40]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#4A4A4A] mb-1">Jarak Bawah Gambar: {data.kopImageMarginBottom}px</label>
                    <input type="range" min="-50" max="200" name="kopImageMarginBottom" value={data.kopImageMarginBottom} onChange={handleChange} className="w-full accent-[#5A5A40]" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#4A4A4A] mb-1">Posisi Vertikal (Melewati Batas Margin Atas/Bawah): {data.kopImageOffsetY}px</label>
                  <input type="range" min="-150" max="150" name="kopImageOffsetY" value={data.kopImageOffsetY} onChange={handleChange} className="w-full accent-[#5A5A40]" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-[#4A4A4A] mb-1">Skala Gambar</label>
                    <select name="kopImageFit" value={data.kopImageFit} onChange={handleChange} className={inputClass + " text-xs py-1.5"}>
                      <option value="contain">Proporsional (Contain)</option>
                      <option value="fill">Tarik Penuh (Memanjangkan)</option>
                      <option value="cover">Penuhi Area (Cover)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#4A4A4A] mb-1">Posisi (Alignment)</label>
                    <select name="kopImageAlign" value={data.kopImageAlign} onChange={handleChange} className={inputClass + " text-xs py-1.5"}>
                      <option value="left">Kiri</option>
                      <option value="center">Tengah</option>
                      <option value="right">Kanan</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div>
            <label className={labelClass}>Nama Perusahaan (Untuk teks surat)</label>
            <input type="text" name="kopCompanyName" value={data.kopCompanyName} onChange={handleChange} className={inputClass} />
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>Informasi Surat</h2>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Nomor Surat</label>
            <div className="flex gap-2">
              <input type="text" name="letterNumber" value={data.letterNumber} onChange={handleChange} className={inputClass} />
              <button
                type="button"
                onClick={handleGenerateLetterNumber}
                className="shrink-0 rounded-lg bg-[#5A5A40] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-[#484833]"
              >
                Acak
              </button>
            </div>
          </div>
          <div>
            <label className={labelClass}>Tempat & Tanggal (Tanda Tangan)</label>
            <input type="text" name="signPlaceDate" value={data.signPlaceDate} onChange={handleChange} className={inputClass} />
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>Pemberi Tugas</h2>
        <div className="grid grid-cols-1 gap-4">
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
        <h2 className={headingClass}>Penerima Tugas</h2>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Nama</label>
            <input type="text" name="assigneeName" value={data.assigneeName} onChange={handleChange} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
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

      <section className={sectionClass}>
        <h2 className={headingClass}>Detail Klien & Masa Berlaku</h2>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Nama Klien / Kreditur</label>
            <input type="text" name="clientName" value={data.clientName} onChange={handleChange} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
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

      <section className={sectionClass}>
        <h2 className={headingClass}>Data Nasabah</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
          <div className="grid grid-cols-2 gap-4">
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
            <label className={labelClass}>Angsuran / Total Angsuran</label>
            <input type="text" name="customerInstallment" value={data.customerInstallment} onChange={handleChange} className={inputClass} placeholder="Rp. 385.000 (Angsuran ke 8 s/d 18)" />
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>Data Kendaraan</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Merk/Type</label>
            <input type="text" name="vehicleBrand" value={data.vehicleBrand} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Nomor Polisi</label>
            <input type="text" name="vehiclePlate" value={data.vehiclePlate} onChange={handleChange} className={inputClass} />
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>Lampiran Foto</h2>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Tambah Foto (KTP, STNK, dll)</label>
            <input 
              type="file" 
              accept="image/*" 
              multiple
              onChange={handleAttachmentUpload} 
              className="w-full text-sm text-[#4A4A4A] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#5A5A40] file:text-white hover:file:bg-[#484833] transition-all cursor-pointer" 
            />
          </div>
          {(data.attachments && data.attachments.length > 0) && (
            <div className="grid grid-cols-1 gap-3 mt-4">
              {data.attachments.map((att, idx) => (
                <div key={idx} className="relative border border-[#D1D1CA] p-3 rounded-lg bg-[#EBEBE4]">
                  <img src={att.url} alt={`Preview ${idx}`} className="w-full h-32 object-contain bg-white rounded border border-[#D1D1CA] mb-3" />
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-[#4A4A4A] mb-1">Lebar Gambar: {att.width}px</label>
                      <input type="range" min="100" max="800" value={att.width} onChange={(e) => updateAttachmentDimension(idx, 'width', Number(e.target.value))} className="w-full accent-[#5A5A40]" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#4A4A4A] mb-1">Tinggi Gambar: {att.height}px</label>
                      <input type="range" min="100" max="1000" value={att.height} onChange={(e) => updateAttachmentDimension(idx, 'height', Number(e.target.value))} className="w-full accent-[#5A5A40]" />
                    </div>
                  </div>

                  <button 
                    onClick={() => removeAttachment(idx)}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shadow-md hover:bg-red-700 transition-colors"
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
