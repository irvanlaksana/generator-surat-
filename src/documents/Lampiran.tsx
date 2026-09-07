import type { DocData, UploadedDoc } from '../types';
import { DocHeader, PAGE_CLASS, PAGE_F4 } from './docStyle';
import { DOC_CATEGORY_MAP } from '../data/defaults';
import { identitasKendaraan, krediturLabel } from '../utils/documentText';
import { normalizeText, toUpperText } from '../utils/format';

const IMAGES_PER_PAGE = 4;

function chunk<T>(list: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

/** Halaman lampiran: KTP, STNK, BPKB, foto unit, dan berkas lain (F4, otomatis berhalaman) */
export default function Lampiran({ data }: { data: DocData }) {
  const dokumen = data.dokumen ?? [];
  const pages = chunk(dokumen, IMAGES_PER_PAGE);

  const subline = [
    data.nomorSuratTugas ? `No. Surat: ${normalizeText(data.nomorSuratTugas)}` : '',
    `Debitur: ${toUpperText(data.namaDebitur) || '-'}`,
    `Kontrak: ${normalizeText(data.nomorKontrak) || '-'}`,
    `Unit: ${toUpperText(identitasKendaraan(data)) || '-'} / ${toUpperText(data.kendaraanNoPol) || '-'}`,
  ]
    .filter(Boolean)
    .join(' · ');

  if (!dokumen.length) {
    return (
      <div id="doc-lampiran" data-doc-key="lampiran" className={`${PAGE_CLASS} ${PAGE_F4} px-[20mm] py-[16mm]`}>
        <DocHeader data={data} />
        <div className="text-center">
          <h3 className="text-[12pt] font-bold uppercase underline">Lampiran Dokumen Pendukung</h3>
          <p className="mt-1 text-[10pt]">{subline}</p>
          <div className="mx-auto mt-10 w-[150mm] rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="text-[10.5pt] font-bold text-slate-600">Belum ada berkas yang diunggah</p>
            <p className="mt-1 text-[9.5pt] text-slate-500">
              Unggah KTP, STNK, BPKB, foto unit, atau dokumen lain pada bagian <strong>Berkas Pendukung</strong> di
              form pengisian data. Halaman lampiran akan terisi otomatis.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {pages.map((items, pageIdx) => (
        <div
          key={`lampiran-${pageIdx}`}
          id={pageIdx === 0 ? 'doc-lampiran' : `doc-lampiran-${pageIdx + 1}`}
          data-doc-key="lampiran"
          className={`${PAGE_CLASS} ${PAGE_F4} px-[18mm] py-[14mm]`}
        >
          <DocHeader data={data} />

          <div className="mb-2 text-center">
            <h3 className="text-[12.5pt] font-bold uppercase tracking-wide underline">
              Lampiran Dokumen Pendukung
            </h3>
            <p className="mt-1 text-[9pt] font-semibold text-gray-800">{subline}</p>
            <p className="text-[9pt] font-bold text-gray-700">
              Halaman {pageIdx + 1} dari {pages.length}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {items.map((doc: UploadedDoc, idx) => {
              const category = DOC_CATEGORY_MAP[doc.kategori];
              const nomor = pageIdx * IMAGES_PER_PAGE + idx + 1;
              return (
                <figure key={doc.id} className="break-inside-avoid">
                  <div className="flex h-[105mm] items-center justify-center overflow-hidden rounded border border-slate-400 bg-white p-1">
                    <img src={doc.url} alt={doc.label} className="max-h-full max-w-full object-contain" />
                  </div>
                  <figcaption className="mt-1 text-center">
                    <p className="text-[9.5pt] font-bold uppercase">
                      {nomor}. {normalizeText(doc.label) || category?.label || 'Dokumen'}
                    </p>
                    <p className="text-[8.5pt] text-gray-600">
                      {category?.label ?? 'Berkas'}
                      {doc.fileName ? ` · ${doc.fileName}` : ''}
                    </p>
                  </figcaption>
                </figure>
              );
            })}
          </div>

          <p className="mt-4 border-t border-dashed border-gray-400 pt-1.5 text-justify text-[9pt] italic text-gray-700">
            Dokumen lampiran ini merupakan bagian yang tidak terpisahkan dari Surat Tugas Nomor{' '}
            {normalizeText(data.nomorSuratTugas) || '(nomor surat)'} atas nama Debitur{' '}
            {toUpperText(data.namaDebitur) || '(nama debitur)'} pada kreditur {krediturLabel(data)}, dan digunakan
            semata-mata sebagai bukti pendukung pelaksanaan penagihan di lapangan.
          </p>
        </div>
      ))}
    </>
  );
}
