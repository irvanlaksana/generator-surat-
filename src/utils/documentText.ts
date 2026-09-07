import type { DocData } from '../types';
import { formatRupiah, formatTanggalIdUpper, joinAddress, normalizeText, toUpperText } from './format';
import { getInisialKreditur } from './filename';

/** Teks turunan yang dipakai berulang di beberapa dokumen */

export function alamatDebiturLengkap(data: DocData): string {
  const tanpaKec = normalizeText(data.alamatDebitur).replace(/,?\s*(kecamatan|kec\.)\s+[a-zà-ÿ' -]+/i, '');
  return joinAddress(
    tanpaKec,
    data.kecamatan ? `Kec. ${normalizeText(data.kecamatan)}` : '',
    data.kabupaten ? `Kab. ${normalizeText(data.kabupaten)}` : '',
  );
}

export function identitasKendaraan(data: DocData): string {
  return normalizeText(`${data.kendaraanMerk} ${data.kendaraanType}`);
}

export function rincianAngsuran(data: DocData): string {
  const nilai = formatRupiah(data.nilaiAngsuran);
  const nomor = normalizeText(data.nomorAngsuran);
  if (nilai && nomor) return `${nilai} (Angsuran ke ${nomor})`;
  if (nilai) return `${nilai} / bulan`;
  if (nomor) return `Angsuran ke ${nomor}`;
  return '';
}

export function totalTunggakanText(data: DocData): string {
  const parts = [formatRupiah(data.totalTunggakan), formatRupiah(data.denda)].filter(Boolean);
  if (!parts.length) return '';
  if (parts.length === 1) return parts[0];
  return `${parts[0]} (denda ${parts[1]})`;
}

export function periodeBerlaku(data: DocData): string {
  const mulai = formatTanggalIdUpper(data.masaBerlakuMulai);
  const sampai = formatTanggalIdUpper(data.masaBerlakuSampai);
  if (mulai && sampai) return `${mulai} sampai dengan ${sampai}`;
  if (mulai) return `${mulai} dan seterusnya`;
  if (sampai) return `sampai dengan ${sampai}`;
  return '(masa berlaku belum diisi)';
}

export function krediturLabel(data: DocData): string {
  const nama = toUpperText(data.namaKreditur);
  const inisial = getInisialKreditur(data);
  if (!nama) return inisial || '-';
  if (nama.includes(`(${inisial})`) || nama.toUpperCase().includes(inisial)) return nama;
  return inisial ? `${nama} (${inisial})` : nama;
}

export function tanggalPenyerahanTeks(data: DocData): string {
  return formatTanggalIdUpper(data.tanggalPenyerahan || data.tanggalSurat);
}

export function kotaPelaksanaan(data: DocData): string {
  return toUpperText(data.kota || '');
}
