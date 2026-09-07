import React from 'react';
import type { DocData } from '../types';
import { normalizeText } from '../utils/format';

/**
 * Gaya dasar dokumen: satu set gaya dipakai semua dokumen agar hasil PDF konsisten.
 */

export const PAGE_F4 = 'w-[210mm] min-h-[330mm]';
export const PAGE_A4 = 'w-[210mm] min-h-[297mm]';

export const PAGE_CLASS =
  'mx-auto box-border bg-white text-black shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-[#E5E5E0] font-serif text-[10pt] leading-[1.35] ' +
  'print:shadow-none print:border-none print:m-0 print:border-none';

/** Baris label : nilai ala dokumen resmi */
export function DocRow({
  label,
  value,
  bold,
  labelWidth = 190,
  uppercase,
  mono,
}: {
  label: string;
  value?: React.ReactNode;
  bold?: boolean;
  labelWidth?: number;
  uppercase?: boolean;
  mono?: boolean;
}) {
  const node = typeof value === 'string' ? normalizeText(value) : value;
  const isEmpty = typeof node === 'string' && !node;
  return (
    <div className="grid items-start gap-x-1" style={{ gridTemplateColumns: `${labelWidth}px 10px 1fr` }}>
      <div className={bold ? 'font-bold' : ''}>{label}</div>
      <div className={bold ? 'font-bold' : ''}>:</div>
      <div
        className={
          isEmpty
            ? 'italic text-gray-500'
            : [uppercase ? 'uppercase' : '', bold ? 'font-bold' : '', mono ? 'font-mono' : ''].filter(Boolean).join(' ')
        }
      >
        {isEmpty ? '(belum diisi)' : (node as React.ReactNode)}
      </div>
    </div>
  );
}

/** Kepala dokumen: gambar kop bila ada, jika tidak memakai kop teks perusahaan */
export function DocHeader({ data, layout = 'center' }: { data: DocData; layout?: 'center' | 'split' }) {
  const wrapperStyle: React.CSSProperties = {
    marginTop: `${data.kopOffsetY}px`,
    marginBottom: `${data.kopImage ? Math.max(data.kopMarginBottom, 8) : 10}px`,
  };

  if (data.kopImage) {
    return (
      <div className="border-b-[2.5px] border-black pb-1" style={wrapperStyle}>
        <img
          src={data.kopImage}
          alt="Kop surat"
          style={{
            display: 'block',
            width: '100%',
            height: `${data.kopImageHeight}px`,
            objectFit: data.kopImageFit,
            objectPosition: data.kopImageAlign,
          }}
        />
      </div>
    );
  }

  const name = normalizeText(data.namaPerusahaan) || 'NAMA PERUSAHAAN';
  const lines = [data.cabang, data.alamatPerusahaan, data.teleponPerusahaan && `Telp: ${data.teleponPerusahaan}`]
    .map((v) => normalizeText(v || ''))
    .filter(Boolean);

  if (layout === 'split') {
    return (
      <div className="mb-3 flex items-start justify-between gap-3 border-b-2 border-black pb-1.5" style={wrapperStyle}>
        <div className="min-w-0">
          <h2 className="text-[13pt] font-bold uppercase leading-tight tracking-wide">{name}</h2>
          {lines.map((line) => (
            <p key={line} className="font-sans text-[9pt] leading-tight text-gray-700">
              {line}
            </p>
          ))}
        </div>
        <div className="shrink-0 text-right font-sans text-[9pt] leading-tight text-gray-700">
          <p className="font-bold text-black">Kreditur</p>
          <p>{normalizeText(data.namaKreditur).toUpperCase() || '-'}</p>
          <p className="mt-0.5 font-bold text-black">No. Kontrak</p>
          <p className="font-semibold">{normalizeText(data.nomorKontrak) || '-'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-3 border-b-2 border-black pb-1.5 text-center" style={wrapperStyle}>
      <h2 className="text-[14pt] font-bold uppercase leading-tight tracking-wide">{name}</h2>
      {lines.map((line) => (
        <p key={line} className="font-sans text-[9.5pt] leading-tight text-gray-700">
          {line}
        </p>
      ))}
    </div>
  );
}

/** Nomor surat yang dicetak di bawah judul */
export function LetterNumber({ label, value }: { label?: string; value: string }) {
  const shown = normalizeText(value) || '(belum dibuat)';
  return (
    <p className="mt-1 inline-block rounded border border-slate-300 bg-slate-100/70 px-3 py-0.5 font-mono text-[10.5pt] font-bold tracking-wide">
      {label ? `${label} ` : ''}
      {shown}
    </p>
  );
}

/** Blok tanda tangan (nama bergaris bawah) */
export function SignBlock({ title, subtitle, name, note }: { title: string; subtitle?: string; name?: string; note?: string }) {
  return (
    <div className="text-center">
      <p className="font-bold">{title}</p>
      {subtitle && <p className="text-[9pt] text-gray-600">{subtitle}</p>}
      <div className="h-14" />
      <p className="font-bold uppercase tracking-wide underline">{normalizeText(name) || '..............................'}</p>
      {note && <p className="text-[9.5pt] text-gray-700">{note}</p>}
    </div>
  );
}
