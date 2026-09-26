import React, { useState, useEffect } from 'react';
import { LetterData, AttachmentData } from '../types';
import { generateOfficialLetterNumber } from '../utils/letterNumber';
import { formatDateID, formatCleanAddress, formatDateDDMMYYYY, formatDueDate, getTodaySignPlaceDate } from '../utils/dateFormatter';
import { Sparkles, Calendar, Scissors, SlidersHorizontal, Loader2, Undo2, Check, Save, RotateCcw, Image as ImageIcon } from 'lucide-react';
import { regionData } from '../data/regions';
import { BLANK_LETTER_DATA, CONTOH_LETTER_DATA, CONTOH_LETTER_PERORANGAN } from '../data/defaults';
import { autoCropDocumentImage } from '../utils/imageAutoCrop';
import ImageCropModal from './ImageCropModal';
import { getSavedKopTemplate, saveKopTemplate } from '../utils/kopStorage';

interface LetterFormProps {
  data: LetterData;
  onChange: (data: LetterData) => void;
}

export default function LetterForm({ data, onChange }: LetterFormProps) {
  const formatRupiah = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    return 'Rp ' + parseInt(digits, 10).toLocaleString('id-ID').replace(/,/g, '.');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let parsedValue: string | number = (type === 'range' || type === 'number') ? Number(value) : value;
    
    if (name === 'customerInstallment' || name === 'customerTotalInstallment' || name === 'customerPenalty') {
      parsedValue = formatRupiah(value as string);
    }
    
    onChange({ ...data, [name]: parsedValue });
  };

  // Clean up any lingering KAB. from customerAddress
  useEffect(() => {
    if (data.customerAddress && /KAB\./i.test(data.customerAddress)) {
      onChange({
        ...data,
        customerAddress: formatCleanAddress(data.customerAddress),
      });
    }
  }, [data.customerAddress]);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let newData = { ...data, [name]: value };

    if (name === 'customerKecamatan') {
      let detectedKab = '';
      let kecName = value;
      if (value.includes('|')) {
        const parts = value.split('|');
        detectedKab = parts[0];
        kecName = parts[1];
        newData.customerKabupaten = detectedKab;
        newData.customerKecamatan = kecName;
      } else {
        for (const [kab, kecMap] of Object.entries(regionData)) {
          if (kecMap[value]) {
            detectedKab = kab;
            break;
          }
        }
        newData.customerKabupaten = detectedKab;
      }
      newData.customerKelurahan = '';
    }

    const parts = [];
    if (newData.customerAddressDetail && newData.customerAddressDetail.trim()) {
      parts.push(formatCleanAddress(newData.customerAddressDetail.trim()));
    }
    const rtClean = (newData.customerRt || '').trim().replace(/^RT\.?\s*/i, '');
    const rwClean = (newData.customerRw || '').trim().replace(/^RW\.?\s*/i, '');
    if (rtClean && rwClean) {
      parts.push(`RT ${rtClean} RW ${rwClean}`);
    } else if (rtClean) {
      parts.push(`RT ${rtClean}`);
    } else if (rwClean) {
      parts.push(`RW ${rwClean}`);
    }
    if (newData.customerKelurahan) parts.push(`KEL. ${newData.customerKelurahan}`);
    if (newData.customerKecamatan) parts.push(`KEC. ${newData.customerKecamatan}`);
    // Do not append KAB.

    newData.customerAddress = parts.filter(Boolean).join(', ');

    onChange(newData);
  };

  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...data, customerDueDate: e.target.value });
  };

  const handleDueDateBlur = () => {
    if (data.customerDueDate && data.customerDueDate.trim()) {
      onChange({ ...data, customerDueDate: formatDueDate(data.customerDueDate) });
    }
  };

  // Derive make and model for Data Kendaraan
  const currentMake = data.vehicleBrandMake ?? (
    data.vehicleBrand?.toUpperCase().startsWith('HONDA') ? 'HONDA' :
    data.vehicleBrand?.toUpperCase().startsWith('YAMAHA') ? 'YAMAHA' :
    data.vehicleBrand?.toUpperCase().startsWith('SUZUKI') ? 'SUZUKI' : ''
  );

  const currentModel = data.vehicleBrandModel ?? (
    data.vehicleBrand?.includes('/')
      ? data.vehicleBrand.split('/')[1]?.trim()
      : (currentMake && data.vehicleBrand?.toUpperCase().startsWith(currentMake)
          ? data.vehicleBrand.slice(currentMake.length).trim().replace(/^[\/\-\s]+/, '')
          : (currentMake ? '' : data.vehicleBrand || ''))
  );

  const handleVehicleMakeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const make = e.target.value;
    const model = currentModel;
    const combined = make && model ? `${make} / ${model}` : (make || model);
    onChange({
      ...data,
      vehicleBrandMake: make,
      vehicleBrandModel: model,
      vehicleBrand: combined,
    });
  };

  const handleVehicleModelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const model = e.target.value;
    const make = currentMake;
    const combined = make && model ? `${make} / ${model}` : (make || model);
    onChange({
      ...data,
      vehicleBrandMake: make,
      vehicleBrandModel: model,
      vehicleBrand: combined,
    });
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

  const [savedKopSuccess, setSavedKopSuccess] = useState<boolean>(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const url = reader.result as string;
        const updated = { ...data, kopImage: url };
        onChange(updated);
        saveKopTemplate(updated);
        setSavedKopSuccess(true);
        setTimeout(() => setSavedKopSuccess(false), 2500);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAsDefaultKop = () => {
    saveKopTemplate(data);
    setSavedKopSuccess(true);
    setTimeout(() => setSavedKopSuccess(false), 3000);
  };

  const handleRestoreSavedKop = () => {
    const saved = getSavedKopTemplate();
    if (saved && saved.kopImage) {
      onChange({
        ...data,
        kopImage: saved.kopImage,
        kopImageHeight: saved.kopImageHeight,
        kopImageFit: saved.kopImageFit,
        kopImageAlign: saved.kopImageAlign,
        kopImageOffsetY: saved.kopImageOffsetY,
        kopImageOffsetX: saved.kopImageOffsetX,
        kopImageMarginBottom: saved.kopImageMarginBottom,
        kopCompanyName: saved.kopCompanyName || data.kopCompanyName,
      });
      setSavedKopSuccess(true);
      setTimeout(() => setSavedKopSuccess(false), 2500);
    }
  };

  const handleResetKopPosition = () => {
    onChange({
      ...data,
      kopImageHeight: 120,
      kopImageOffsetY: 0,
      kopImageOffsetX: 0,
      kopImageMarginBottom: 32,
      kopImageFit: 'contain',
      kopImageAlign: 'center',
    });
  };

  const [autoCropOnUpload, setAutoCropOnUpload] = useState<boolean>(true);
  const [isProcessingAttachments, setIsProcessingAttachments] = useState<boolean>(false);
  const [activeCropIndex, setActiveCropIndex] = useState<number | null>(null);
  const [singleCropLoading, setSingleCropLoading] = useState<number | null>(null);

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsProcessingAttachments(true);
    const fileList = Array.from(files) as File[];
    const newAttachments: AttachmentData[] = [];
    
    for (const file of fileList) {
      try {
        const rawDataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        if (autoCropOnUpload) {
          const cropRes = await autoCropDocumentImage(rawDataUrl, { sensitivity: 'medium' });
          if (cropRes.didCrop) {
            newAttachments.push({
              url: cropRes.url,
              originalUrl: rawDataUrl,
              width: 600,
              height: 270,
              cropped: true,
            });
          } else {
            newAttachments.push({
              url: rawDataUrl,
              originalUrl: rawDataUrl,
              width: 600,
              height: 270,
              cropped: false,
            });
          }
        } else {
          newAttachments.push({
            url: rawDataUrl,
            originalUrl: rawDataUrl,
            width: 600,
            height: 270,
            cropped: false,
          });
        }
      } catch (err) {
        console.error('Error processing attachment:', err);
      }
    }

    onChange({ ...data, attachments: [...(data.attachments || []), ...newAttachments] });
    setIsProcessingAttachments(false);
    e.target.value = '';
  };

  const handleAutoCropSingle = async (index: number) => {
    const att = data.attachments?.[index];
    if (!att) return;
    setSingleCropLoading(index);
    try {
      const base = att.originalUrl || att.url;
      const cropRes = await autoCropDocumentImage(base, { sensitivity: 'medium' });
      const newAttachments = [...(data.attachments || [])];
      if (cropRes.didCrop) {
        newAttachments[index] = {
          ...att,
          url: cropRes.url,
          originalUrl: base,
          cropped: true,
        };
      } else {
        alert('Tepi dokumen sudah optimal atau kontras background sudah pas.');
      }
      onChange({ ...data, attachments: newAttachments });
    } catch (e) {
      console.error(e);
    } finally {
      setSingleCropLoading(null);
    }
  };

  const handleRestoreOriginal = (index: number) => {
    const att = data.attachments?.[index];
    if (!att || !att.originalUrl) return;
    const newAttachments = [...(data.attachments || [])];
    newAttachments[index] = {
      ...att,
      url: att.originalUrl,
      cropped: false,
    };
    onChange({ ...data, attachments: newAttachments });
  };

  const resetAllAttachmentsToDefault = () => {
    if (!data.attachments || data.attachments.length === 0) return;
    const updated = data.attachments.map(att => ({ ...att, width: 600, height: 270 }));
    onChange({ ...data, attachments: updated });
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

  const [activeCategory, setActiveCategory] = useState<'semua' | 'tugas' | 'nasabah' | 'kop'>('semua');

  const handleResetForm = () => {
    onChange({
      ...data,
      ...BLANK_LETTER_DATA,
      // Preserve current Kop settings so user's uploaded letterhead isn't lost
      kopImage: data.kopImage,
      kopImageHeight: data.kopImageHeight,
      kopImageFit: data.kopImageFit,
      kopImageAlign: data.kopImageAlign,
      kopImageOffsetY: data.kopImageOffsetY,
      kopImageOffsetX: data.kopImageOffsetX,
      kopImageMarginBottom: data.kopImageMarginBottom,
      kopCompanyName: data.kopCompanyName,
    });
  };

  const handleApplyContoh = () => {
    onChange({
      ...data,
      ...CONTOH_LETTER_DATA,
      // Preserve current Kop settings
      kopImage: data.kopImage,
      kopImageHeight: data.kopImageHeight,
      kopImageFit: data.kopImageFit,
      kopImageAlign: data.kopImageAlign,
      kopImageOffsetY: data.kopImageOffsetY,
      kopImageOffsetX: data.kopImageOffsetX,
      kopImageMarginBottom: data.kopImageMarginBottom,
      kopCompanyName: data.kopCompanyName,
    });
  };

  const handleApplyContohPerorangan = () => {
    onChange({
      ...data,
      ...CONTOH_LETTER_PERORANGAN,
      // Preserve current Kop settings
      kopImage: data.kopImage,
      kopImageHeight: data.kopImageHeight,
      kopImageFit: data.kopImageFit,
      kopImageAlign: data.kopImageAlign,
      kopImageOffsetY: data.kopImageOffsetY,
      kopImageOffsetX: data.kopImageOffsetX,
      kopImageMarginBottom: data.kopImageMarginBottom,
      kopCompanyName: data.kopCompanyName,
    });
  };

  const sectionClass = "bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2.5";
  const headingClass = "text-xs font-bold text-slate-800 pb-1.5 border-b border-slate-100 uppercase tracking-wider flex items-center justify-between";
  const labelClass = "block text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-0.5";
  const inputClass = "w-full px-2.5 py-1.5 border border-slate-300 bg-white rounded-lg focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40] outline-none transition-all text-slate-800 placeholder:text-slate-400 text-xs shadow-2xs";

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
          Debitur & Tagihan
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory('kop')}
          className={`flex-1 py-1 px-1.5 rounded-md transition-all cursor-pointer text-center ${
            activeCategory === 'kop' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Kop Surat
        </button>
      </div>

      {/* Preset & Reset Bar for Surat Tugas */}
      <div className="bg-slate-100/90 border border-slate-200/90 p-2.5 rounded-xl shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
            <Sparkles size={13} className="text-[#5A5A40]" />
            <span>Preset & Reset Surat Tugas:</span>
          </div>
          <span className="text-[9.5px] bg-slate-200 text-slate-700 font-semibold px-1.5 py-0.5 rounded">
            Cepat Isi
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={handleApplyContoh}
            className="flex items-center justify-center gap-1 py-1.5 px-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-lg font-bold text-[10px] transition shadow-2xs cursor-pointer active:scale-95"
            title="Muat data contoh Surat Tugas leasing kendaraan"
          >
            <Sparkles size={11} className="text-[#5A5A40]" />
            <span>Contoh Leasing</span>
          </button>

          <button
            type="button"
            onClick={handleApplyContohPerorangan}
            className="flex items-center justify-center gap-1 py-1.5 px-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-bold text-[10px] transition shadow-2xs cursor-pointer active:scale-95"
            title="Muat data contoh Surat Tugas penagihan perorangan (hutang piutang)"
          >
            <Sparkles size={11} className="text-amber-700" />
            <span>Contoh Perorangan</span>
          </button>

          <button
            type="button"
            id="btn-reset-form-kosong-surat-tugas"
            onClick={handleResetForm}
            className="flex items-center justify-center gap-1 py-1.5 px-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg font-bold text-[10px] transition shadow-2xs cursor-pointer active:scale-95"
            title="Kosongkan seluruh isian formulir Surat Tugas (Reset Bersih)"
          >
            <RotateCcw size={11} className="text-rose-600" />
            <span>Kosongkan</span>
          </button>
        </div>
      </div>

      {/* Switcher Jenis Penagihan */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
        <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
          Jenis Penagihan:
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => onChange({ ...data, penagihanType: 'lembaga' })}
            className={`py-1.5 px-2 rounded-lg font-bold text-xs transition border cursor-pointer text-center ${
              data.penagihanType !== 'perorangan'
                ? 'bg-[#5A5A40] text-white border-[#5A5A40] shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            🏢 Lembaga / Leasing
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...data, penagihanType: 'perorangan' })}
            className={`py-1.5 px-2 rounded-lg font-bold text-xs transition border cursor-pointer text-center ${
              data.penagihanType === 'perorangan'
                ? 'bg-[#5A5A40] text-white border-[#5A5A40] shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            👤 Penagihan Perorangan
          </button>
        </div>
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
              <div className="flex items-center justify-between mb-1">
                <label className={labelClass}>Tempat & Tanggal (Tanda Tangan)</label>
                <button
                  type="button"
                  onClick={() => onChange({ ...data, signPlaceDate: getTodaySignPlaceDate('Purwokerto') })}
                  className="text-[10px] text-[#5A5A40] hover:underline font-bold cursor-pointer"
                  title="Klik untuk mengisi tanggal hari ini"
                >
                  Set Purwokerto Hari Ini
                </button>
              </div>
              <input 
                type="text" 
                name="signPlaceDate" 
                value={data.signPlaceDate} 
                onChange={handleChange} 
                className={inputClass} 
                placeholder="Contoh: Purwokerto, 19 September 2026"
              />
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
            <h2 className={headingClass}>
              <span>Penerima Tugas</span>
            </h2>

            <div className="space-y-2">
              <div>
                <label className={labelClass}>Nama Petugas</label>
                <input 
                  type="text" 
                  name="assigneeName" 
                  value={data.assigneeName} 
                  onChange={handleChange} 
                  className={inputClass} 
                  placeholder="Nama Lengkap Petugas"
                />
              </div>
              <div>
                <label className={labelClass}>Jabatan</label>
                <input type="text" name="assigneePosition" value={data.assigneePosition} onChange={handleChange} className={inputClass} />
              </div>
            </div>
          </section>
        </>
      )}

      {/* 3. Detail Klien & Masa Berlaku */}
      {(activeCategory === 'semua' || activeCategory === 'nasabah') && (
        <>
          <section className={sectionClass}>
            <h2 className={headingClass}>
              <span>{data.penagihanType === 'perorangan' ? 'Pemberi Kuasa Perorangan' : 'Klien / Kreditur'}</span>
              <span className="text-[9px] font-semibold text-[#5A5A40] bg-[#5A5A40]/10 px-1.5 py-0.5 rounded">
                {data.penagihanType === 'perorangan' ? 'Perorangan' : 'Lembaga (Format Lama)'}
              </span>
            </h2>

            <div className="space-y-2">
              <div>
                <label className={labelClass}>
                  {data.penagihanType === 'perorangan' ? 'Nama Pemberi Kuasa (Kreditur Perorangan)' : 'Kreditur (Multifinance / Leasing)'}
                </label>
                <input 
                  type="text" 
                  name="clientName" 
                  value={data.clientName} 
                  onChange={handleChange} 
                  className={inputClass} 
                  placeholder={data.penagihanType === 'perorangan' ? 'Nama Lengkap Pemberi Kuasa Pribadi' : 'Nama Lembaga / Leasing'}
                />
              </div>

              {data.penagihanType === 'perorangan' && (
                <>
                  <div>
                    <label className={labelClass}>NIK Pemberi Kuasa (Opsional)</label>
                    <input 
                      type="text" 
                      name="krediturPeroranganNik" 
                      value={data.krediturPeroranganNik || ''} 
                      onChange={handleChange} 
                      className={inputClass} 
                      placeholder="Nomor Induk Kependudukan (KTP)"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Dasar Penagihan / Hubungan Hukum</label>
                    <input 
                      type="text" 
                      name="dasarPenagihan" 
                      value={data.dasarPenagihan || ''} 
                      onChange={handleChange} 
                      className={inputClass} 
                      placeholder="Contoh: Surat Pengakuan Hutang & Kuasa Khusus 10 Jan 2026"
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>Berlaku Mulai</label>
                  <input type="date" name="validFrom" value={data.validFrom} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Berlaku Sampai</label>
                  <input type="date" name="validTo" value={data.validTo} onChange={handleChange} className={inputClass} />
                </div>
              </div>
            </div>
          </section>

          {/* 4. DATA NASABAH */}
          <section className={sectionClass}>
            <h2 className={headingClass}>
              <span>Data Nasabah / Debitur</span>
            </h2>

            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>
                    {data.penagihanType === 'perorangan' ? 'No. Perjanjian / Bukti' : 'No. Kontrak'}
                  </label>
                  <input 
                    type="text" 
                    name="customerContract" 
                    value={data.customerContract} 
                    onChange={handleChange} 
                    className={inputClass} 
                    placeholder={data.penagihanType === 'perorangan' ? 'Contoh: SPH/08/I/2026' : 'Nomor Kontrak Nasabah'}
                  />
                </div>
                <div>
                  <label className={labelClass}>Nama Debitur / Nasabah</label>
                  <input 
                    type="text" 
                    name="customerName" 
                    value={data.customerName} 
                    onChange={handleChange} 
                    className={inputClass} 
                    placeholder="Nama Lengkap Debitur"
                  />
                </div>
              </div>
              <div className="space-y-2 p-3 border border-slate-200 bg-slate-50/50 rounded-lg">
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Alamat Nasabah</label>
                
                <div>
                  <label className={labelClass}>Jalan / Dusun / No. Rumah (Opsional)</label>
                  <input 
                    type="text" 
                    name="customerAddressDetail" 
                    value={data.customerAddressDetail || ''} 
                    onChange={handleAddressChange} 
                    className={inputClass} 
                    placeholder="Contoh: Jl. Ahmad Yani No. 88 (Opsional)" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass}>RT</label>
                    <input 
                      type="text" 
                      name="customerRt" 
                      value={data.customerRt || ''} 
                      onChange={handleAddressChange} 
                      className={inputClass} 
                      placeholder="Contoh: 004 atau 04" 
                    />
                  </div>
                  <div>
                    <label className={labelClass}>RW</label>
                    <input 
                      type="text" 
                      name="customerRw" 
                      value={data.customerRw || ''} 
                      onChange={handleAddressChange} 
                      className={inputClass} 
                      placeholder="Contoh: 002 atau 02" 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass}>Kecamatan</label>
                    <select 
                      name="customerKecamatan" 
                      value={data.customerKabupaten && data.customerKecamatan ? `${data.customerKabupaten}|${data.customerKecamatan}` : data.customerKecamatan || ''} 
                      onChange={handleAddressChange} 
                      className={inputClass}
                    >
                      <option value="">Pilih Kecamatan...</option>
                      {Object.entries(regionData).map(([kab, kecs]) => (
                        <optgroup key={kab} label={`KAB. / WILAYAH ${kab}`}>
                          {Object.keys(kecs).map(kec => (
                            <option key={`${kab}-${kec}`} value={`${kab}|${kec}`}>
                              {kec} ({kab})
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Kelurahan / Desa</label>
                    {(() => {
                      const availableKelurahans = (
                        (data.customerKabupaten && data.customerKecamatan && regionData[data.customerKabupaten]?.[data.customerKecamatan]) ||
                        (data.customerKecamatan && Object.values(regionData).find(m => m[data.customerKecamatan])?.[data.customerKecamatan]) ||
                        []
                      );
                      return (
                        <select 
                          name="customerKelurahan" 
                          value={data.customerKelurahan || ''} 
                          onChange={handleAddressChange} 
                          className={inputClass} 
                          disabled={!data.customerKecamatan}
                        >
                          <option value="">
                            {data.customerKecamatan ? 'Pilih Kelurahan/Desa...' : 'Pilih Kecamatan dulu'}
                          </option>
                          {availableKelurahans.map(kel => (
                            <option key={kel} value={kel}>{kel}</option>
                          ))}
                        </select>
                      );
                    })()}
                  </div>
                </div>
                
                <div className="mt-2 pt-1.5 border-t border-slate-200/80 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-600">Alamat di Surat:</span>
                    <span className="text-[9.5px] text-slate-400">Dapat diedit manual</span>
                  </div>
                  <input
                    type="text"
                    name="customerAddress"
                    value={data.customerAddress || ''}
                    onChange={handleChange}
                    className={`${inputClass} font-mono uppercase text-[11px] bg-slate-50`}
                    placeholder="Contoh: RT 004 RW 002, KEL. TELUK, KEC. PURWOKERTO SELATAN"
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Jatuh Tempo (contoh: 22-September-2026)</label>
                <div className="relative flex items-center">
                  <input 
                    type="text" 
                    name="customerDueDate" 
                    value={data.customerDueDate} 
                    onChange={handleDueDateChange} 
                    onBlur={handleDueDateBlur}
                    className={`${inputClass} pr-8`} 
                    placeholder="contoh: 22-September-2026" 
                  />
                  <div className="absolute right-2 flex items-center justify-center pointer-events-auto">
                    <input
                      type="date"
                      tabIndex={-1}
                      className="absolute inset-0 opacity-0 w-6 h-6 cursor-pointer"
                      title="Pilih tanggal dari kalender"
                      onChange={(e) => {
                        if (e.target.value) {
                          onChange({ ...data, customerDueDate: formatDueDate(e.target.value) });
                        }
                      }}
                    />
                    <Calendar size={14} className="text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Format Lama Lembaga: Angsuran, Total Angsuran, Total Denda */}
              {data.penagihanType !== 'perorangan' && (
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                  <div>
                    <label className={labelClass}>Angsuran</label>
                    <input type="text" name="customerInstallment" value={data.customerInstallment} onChange={handleChange} className={inputClass} placeholder="Contoh: Rp 1.850.000" />
                  </div>
                  <div>
                    <label className={labelClass}>Total Angsuran</label>
                    <input type="text" name="customerTotalInstallment" value={data.customerTotalInstallment} onChange={handleChange} className={inputClass} placeholder="Contoh: Rp 5.550.000" />
                  </div>
                  <div>
                    <label className={labelClass}>Total Denda</label>
                    <input type="text" name="customerPenalty" value={data.customerPenalty} onChange={handleChange} className={inputClass} placeholder="Contoh: Rp 350.000" />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 5. BESARAN TAGIHAN & KRONOLOGI (Hanya untuk Penagihan Perorangan) */}
          {data.penagihanType === 'perorangan' && (
            <section className={sectionClass}>
              <h2 className={headingClass}>
                <span>Besaran Tagihan & Kronologi (Perorangan)</span>
                <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  Rincian Kewajiban
                </span>
              </h2>

              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass}>Hutang Pokok</label>
                    <input 
                      type="text" 
                      name="besaranPokok" 
                      value={data.besaranPokok || ''} 
                      onChange={handleChange} 
                      className={inputClass} 
                      placeholder="Contoh: Rp 65.000.000" 
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Bunga / Denda / Biaya</label>
                    <input 
                      type="text" 
                      name="besaranBungaDenda" 
                      value={data.besaranBungaDenda || ''} 
                      onChange={handleChange} 
                      className={inputClass} 
                      placeholder="Contoh: Rp 5.000.000" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass}>Total Tagihan (Wajib Dibayar)</label>
                    <input 
                      type="text" 
                      name="totalTagihan" 
                      value={data.totalTagihan || ''} 
                      onChange={handleChange} 
                      className={`${inputClass} font-bold text-slate-900 border-amber-300 focus:ring-amber-500`} 
                      placeholder="Contoh: Rp 70.000.000" 
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Terbilang</label>
                    <input 
                      type="text" 
                      name="terbilangTagihan" 
                      value={data.terbilangTagihan || ''} 
                      onChange={handleChange} 
                      className={inputClass} 
                      placeholder="Contoh: Tujuh Puluh Juta Rupiah" 
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Kronologi & Duduk Perkara</label>
                  <textarea 
                    name="kronologi" 
                    rows={3}
                    value={data.kronologi || ''} 
                    onChange={handleChange} 
                    className={`${inputClass} resize-none leading-relaxed`} 
                    placeholder="Uraikan riwayat timbulnya hutang/tagihan, batas waktu pembayaran, teguran/somasi yang telah dilakukan, serta kewajiban yang belum diselesaikan..." 
                  />
                </div>
              </div>
            </section>
          )}

          <section className={sectionClass}>
            <h2 className={headingClass}>
              <span>Data Kendaraan {data.penagihanType === 'perorangan' ? '(Opsional)' : ''}</span>
              {data.penagihanType === 'perorangan' && (data.vehicleBrand || data.vehiclePlate) && (
                <button
                  type="button"
                  onClick={() => onChange({
                    ...data,
                    vehicleBrand: '',
                    vehicleBrandMake: '',
                    vehicleBrandModel: '',
                    vehiclePlate: ''
                  })}
                  className="text-[9.5px] text-rose-600 hover:underline font-bold cursor-pointer"
                >
                  Kosongkan Kendaraan
                </button>
              )}
            </h2>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>Merk</label>
                  <select
                    name="vehicleBrandMake"
                    value={currentMake}
                    onChange={handleVehicleMakeChange}
                    className={inputClass}
                  >
                    <option value="">Pilih Merk...</option>
                    <option value="HONDA">HONDA</option>
                    <option value="YAMAHA">YAMAHA</option>
                    <option value="SUZUKI">SUZUKI</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Tipe (Ketik Manual)</label>
                  <input
                    type="text"
                    name="vehicleBrandModel"
                    value={currentModel}
                    onChange={handleVehicleModelChange}
                    className={inputClass}
                    placeholder="Contoh: VARIO 160 / BEAT"
                  />
                </div>
              </div>

              {data.vehicleBrand && (
                <p className="text-[11px] text-slate-500 font-mono">
                  Merk/Tipe di Surat: <span className="font-bold uppercase text-slate-700">{data.vehicleBrand}</span>
                </p>
              )}

              <div>
                <label className={labelClass}>Nomor Polisi</label>
                <input
                  type="text"
                  name="vehiclePlate"
                  value={data.vehiclePlate}
                  onChange={handleChange}
                  className={`${inputClass} font-bold tracking-wider`}
                  placeholder="R-1234-XX"
                />
              </div>
            </div>
          </section>

          <section className={sectionClass}>
            <div className={headingClass}>
              <div className="flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-[#5A5A40]" />
                <span>Lampiran Foto Dokumen</span>
              </div>
              {data.attachments && data.attachments.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 font-normal">
                    {data.attachments.length} Foto
                  </span>
                  <button
                    type="button"
                    onClick={resetAllAttachmentsToDefault}
                    className="text-[9.5px] text-[#5A5A40] hover:underline font-bold cursor-pointer"
                    title="Reset semua foto ke ukuran default 600 × 270 px"
                  >
                    Reset Ukuran (600×270)
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-2.5">
              {/* Auto Crop Toggle */}
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={autoCropOnUpload}
                    onChange={(e) => setAutoCropOnUpload(e.target.checked)}
                    className="rounded text-[#5A5A40] focus:ring-[#5A5A40] accent-[#5A5A40] w-3.5 h-3.5 cursor-pointer"
                  />
                  <span className="flex items-center gap-1">
                    <Scissors className="w-3 h-3 text-[#5A5A40]" />
                    <span>Auto-Crop latar belakang saat upload</span>
                  </span>
                </label>
                <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
                  Potong meja/lantai/tepi tak penting
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={labelClass}>Upload Foto (KTP, STNK, Unit, Berkas dll)</label>
                  <span className="text-[9.5px] text-slate-500 font-medium">Default: 600 × 270 px</span>
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple
                  onChange={handleAttachmentUpload} 
                  disabled={isProcessingAttachments}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[11px] file:font-bold file:bg-[#5A5A40] file:text-white hover:file:bg-[#484833] transition cursor-pointer disabled:opacity-50" 
                />
              </div>

              {/* Processing Loader */}
              {isProcessingAttachments && (
                <div className="flex items-center justify-center gap-2 py-2 px-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 font-semibold animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-[#5A5A40]" />
                  <span>Sedang memotong background foto dokumen otomatis...</span>
                </div>
              )}

              {(data.attachments && data.attachments.length > 0) && (
                <div className="grid grid-cols-1 gap-2.5 mt-2">
                  {data.attachments.map((att, idx) => (
                    <div key={idx} className="relative border border-slate-200 p-2.5 rounded-xl bg-slate-50 shadow-2xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10.5px] font-bold text-slate-800">Foto {idx + 1}</span>
                          {att.cropped ? (
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded flex items-center gap-1 border border-emerald-200">
                              <Check className="w-2.5 h-2.5" />
                              <span>Background Terpotong</span>
                            </span>
                          ) : (
                            <span className="text-[9px] bg-slate-200 text-slate-600 font-medium px-1.5 py-0.5 rounded">
                              Foto Asli
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            updateAttachmentDimension(idx, 'width', 600);
                            updateAttachmentDimension(idx, 'height', 270);
                          }}
                          className="text-[9px] text-[#5A5A40] hover:underline font-semibold cursor-pointer mr-6"
                          title="Kembalikan ke ukuran standar 600 × 270 px"
                        >
                          Reset 600×270 px
                        </button>
                      </div>

                      {/* Image Preview & Quick Actions */}
                      <div className="relative mb-2 group">
                        <img 
                          src={att.url} 
                          alt={`Preview ${idx + 1}`} 
                          className="w-full h-28 object-contain bg-white rounded-lg border border-slate-200" 
                        />
                      </div>

                      {/* Crop Action Buttons */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-2.5 pb-2 border-b border-slate-200">
                        <button
                          type="button"
                          onClick={() => setActiveCropIndex(idx)}
                          className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-[10px] font-bold text-slate-700 flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                          title="Sesuaikan tepi atau potong manual"
                        >
                          <SlidersHorizontal className="w-3 h-3 text-[#5A5A40]" />
                          <span>Sesuaikan Potongan</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAutoCropSingle(idx)}
                          disabled={singleCropLoading === idx}
                          className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-[10px] font-bold text-[#5A5A40] flex items-center gap-1 shadow-2xs cursor-pointer transition-colors disabled:opacity-50"
                          title="Deteksi dan potong ulang background secara otomatis"
                        >
                          {singleCropLoading === idx ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Scissors className="w-3 h-3" />
                          )}
                          <span>Auto-Crop Ulang</span>
                        </button>

                        {att.originalUrl && (att.cropped || att.url !== att.originalUrl) && (
                          <button
                            type="button"
                            onClick={() => handleRestoreOriginal(idx)}
                            className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-[10px] font-bold text-slate-600 flex items-center gap-1 shadow-2xs cursor-pointer transition-colors ml-auto"
                            title="Kembalikan foto awal tanpa terpotong"
                          >
                            <Undo2 className="w-3 h-3 text-slate-500" />
                            <span>Foto Asli</span>
                          </button>
                        )}
                      </div>
                      
                      {/* Dimension sliders */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="block text-[9px] font-bold text-slate-600">Lebar: {att.width || 600}px</label>
                            <button
                              type="button"
                              onClick={() => updateAttachmentDimension(idx, 'width', 600)}
                              className="text-[8.5px] text-[#5A5A40] hover:underline font-semibold cursor-pointer"
                              title="Set lebar ke 600px"
                            >
                              600px
                            </button>
                          </div>
                          <input type="range" min="100" max="800" value={att.width || 600} onChange={(e) => updateAttachmentDimension(idx, 'width', Number(e.target.value))} className="w-full accent-[#5A5A40]" />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="block text-[9px] font-bold text-slate-600">Tinggi: {att.height || 270}px</label>
                            <button
                              type="button"
                              onClick={() => updateAttachmentDimension(idx, 'height', 270)}
                              className="text-[8.5px] text-[#5A5A40] hover:underline font-semibold cursor-pointer"
                              title="Set tinggi ke 270px"
                            >
                              270px
                            </button>
                          </div>
                          <input type="range" min="100" max="800" value={att.height || 270} onChange={(e) => updateAttachmentDimension(idx, 'height', Number(e.target.value))} className="w-full accent-[#5A5A40]" />
                        </div>
                      </div>

                      <button 
                        onClick={() => removeAttachment(idx)}
                        className="absolute top-2 right-2 bg-rose-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow hover:bg-rose-700 transition cursor-pointer"
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
        </>
      )}

      {/* 5. Kop Surat */}
      {(activeCategory === 'semua' || activeCategory === 'kop') && (
        <>
          <section className={sectionClass}>
            <div className={headingClass}>
              <div className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#5A5A40]" />
                <span>Kop Surat & Perusahaan</span>
              </div>
              {data.kopImage && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleSaveAsDefaultKop}
                    className="text-[9.5px] text-[#5A5A40] hover:underline font-bold cursor-pointer flex items-center gap-0.5"
                    title="Kunci gambar dan posisi kop saat ini sebagai template standar"
                  >
                    <Save className="w-3 h-3" />
                    <span>Kunci Sebagai Standar</span>
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2.5">
              {/* Feedback Alert */}
              {savedKopSuccess && (
                <div className="text-[10.5px] bg-emerald-600 text-white font-bold py-1 px-2.5 rounded-lg text-center shadow-xs">
                  ✓ Kop Surat & pengaturan posisi berhasil disimpan sebagai template standar permanen!
                </div>
              )}

              {/* Status Banner when Kop is active */}
              {data.kopImage ? (
                <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Kop Surat aktif & posisi saat ini otomatis tersimpan.</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleSaveAsDefaultKop}
                      className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
                      title="Simpan gambar & koordinat kop saat ini agar selalu muncul sebagai bawaan"
                    >
                      <Save className="w-3 h-3" />
                      <span>Kunci Standar</span>
                    </button>
                  </div>
                </div>
              ) : (
                getSavedKopTemplate()?.kopImage && (
                  <div className="flex items-center justify-between p-2 bg-[#5A5A40]/10 rounded-lg border border-[#5A5A40]/20">
                    <span className="text-[11px] text-slate-700 font-medium">Kop Surat template standar tersedia di memori.</span>
                    <button
                      type="button"
                      onClick={handleRestoreSavedKop}
                      className="px-2.5 py-1 bg-[#5A5A40] hover:bg-[#484833] text-white rounded text-[10.5px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Terapkan Kop Standar</span>
                    </button>
                  </div>
                )
              )}

              <div>
                <label className={labelClass}>Nama Perusahaan (Teks Surat)</label>
                <input type="text" name="kopCompanyName" value={data.kopCompanyName} onChange={handleChange} className={inputClass} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={labelClass}>Upload Gambar Kop Baru</label>
                  {data.kopImage && (
                    <span className="text-[9.5px] text-emerald-700 font-bold">Kop Sedang Digunakan</span>
                  )}
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[11px] file:font-bold file:bg-[#5A5A40] file:text-white hover:file:bg-[#484833] transition cursor-pointer" 
                />
                
                {data.kopImage && (
                  <div className="mt-2.5 space-y-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10.5px] font-bold text-slate-800">Pengaturan Posisi Kop Surat</span>
                        <button
                          type="button"
                          onClick={handleResetKopPosition}
                          className="text-[9.5px] text-[#5A5A40] hover:underline font-semibold cursor-pointer"
                          title="Kembalikan koordinat posisi ke standar (Tengah, Tinggi: 120px)"
                        >
                          Reset Posisi
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = { ...data, kopImage: null };
                          onChange(updated);
                          saveKopTemplate(updated);
                        }}
                        className="text-[10px] text-rose-600 font-bold hover:underline cursor-pointer"
                      >
                        Hapus Kop
                      </button>
                    </div>

                    {/* Live Preview Thumbnail */}
                    <div className="bg-white p-2 rounded-lg border border-slate-200 text-center overflow-hidden">
                      <img 
                        src={data.kopImage} 
                        alt="Preview Kop" 
                        style={{
                          height: `${Math.min(data.kopImageHeight, 90)}px`,
                          objectFit: data.kopImageFit,
                          objectPosition: data.kopImageAlign,
                          marginLeft: data.kopImageAlign === 'left' ? 0 : data.kopImageAlign === 'right' ? 'auto' : 'auto',
                          marginRight: data.kopImageAlign === 'right' ? 0 : data.kopImageAlign === 'left' ? 'auto' : 'auto',
                        }}
                        className="max-w-full"
                      />
                      <p className="text-[9px] text-slate-400 mt-1">
                        Posisi: {data.kopImageAlign} | Tinggi: {data.kopImageHeight}px | Geser: X={data.kopImageOffsetX}px, Y={data.kopImageOffsetY}px | Jarak Bawah: {data.kopImageMarginBottom}px
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="block text-[9.5px] font-bold text-slate-600">Geser Kiri / Kanan</label>
                          <span className="text-[9px] font-mono text-slate-500">{data.kopImageOffsetX || 0}px</span>
                        </div>
                        <input type="range" min="-150" max="150" name="kopImageOffsetX" value={data.kopImageOffsetX} onChange={handleChange} className="w-full accent-[#5A5A40]" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="block text-[9.5px] font-bold text-slate-600">Geser Atas / Bawah</label>
                          <span className="text-[9px] font-mono text-slate-500">{data.kopImageOffsetY || 0}px</span>
                        </div>
                        <input type="range" min="-150" max="150" name="kopImageOffsetY" value={data.kopImageOffsetY} onChange={handleChange} className="w-full accent-[#5A5A40]" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="block text-[9.5px] font-bold text-slate-600">Tinggi Gambar Kop</label>
                          <span className="text-[9px] font-mono text-slate-500">{data.kopImageHeight}px</span>
                        </div>
                        <input type="range" min="50" max="300" name="kopImageHeight" value={data.kopImageHeight} onChange={handleChange} className="w-full accent-[#5A5A40]" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="block text-[9.5px] font-bold text-slate-600">Jarak Bawah (Spasi)</label>
                          <span className="text-[9px] font-mono text-slate-500">{data.kopImageMarginBottom}px</span>
                        </div>
                        <input type="range" min="-100" max="150" name="kopImageMarginBottom" value={data.kopImageMarginBottom} onChange={handleChange} className="w-full accent-[#5A5A40]" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9.5px] font-bold text-slate-600 mb-0.5">Skala / Tampilan</label>
                        <select name="kopImageFit" value={data.kopImageFit} onChange={handleChange} className={inputClass + " text-[11px] py-1"}>
                          <option value="contain">Contain (Proporsional Utuh)</option>
                          <option value="fill">Fill (Isi Penuh)</option>
                          <option value="cover">Cover (Potong Penuh)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9.5px] font-bold text-slate-600 mb-0.5">Perataan Posisi</label>
                        <select name="kopImageAlign" value={data.kopImageAlign} onChange={handleChange} className={inputClass + " text-[11px] py-1"}>
                          <option value="center">Tengah (Center)</option>
                          <option value="left">Rata Kiri (Left)</option>
                          <option value="right">Rata Kanan (Right)</option>
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
      {/* Image Crop Modal */}
      {activeCropIndex !== null && data.attachments?.[activeCropIndex] && (
        <ImageCropModal
          isOpen={true}
          onClose={() => setActiveCropIndex(null)}
          imageUrl={data.attachments[activeCropIndex].url}
          originalUrl={data.attachments[activeCropIndex].originalUrl}
          onSaveCrop={(croppedUrl) => {
            const newAttachments = [...(data.attachments || [])];
            newAttachments[activeCropIndex] = {
              ...newAttachments[activeCropIndex],
              url: croppedUrl,
              cropped: true,
            };
            onChange({ ...data, attachments: newAttachments });
          }}
          onRestoreOriginal={() => handleRestoreOriginal(activeCropIndex)}
        />
      )}
    </div>
  );
}
