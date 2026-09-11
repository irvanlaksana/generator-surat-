/**
 * KOP SURAT FIX (TERKUNCI)
 * ----------------------------------------------------------------------------
 * Kop surat tidak dapat diganti dari form maupun dari payload otomatis
 * (JSON / link pre-fill / sinkronisasi antar dokumen):
 *  - Form Surat Tugas: section kop dinonaktifkan (hanya tampilan).
 *  - Payload: key `kopImage`, `kopCompanyName`, `kopImage*` di-blacklist
 *    saat payload disanitasi & diterapkan (lihat src/utils/payload.ts).
 *
 * CARA MENGGANTI KOP RESMI:
 * Letakkan file gambar kop (PNG/JPG/SVG) di src/assets/ lalu ubah
 * KOP_IMAGE_FIX di bawah, misalnya:
 *   import kopResmi from '../assets/kop-resmi.png';
 *   export const KOP_IMAGE_FIX = kopResmi; // (Vite otomatis jadi URL)
 */

export const KOP_COMPANY_NAME = 'PT. MITRA JASATRIA INDONESIA';

/** Placeholder kop resmi (SVG murni — teks tajam & mudah diganti). */
const KOP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 168" width="1000" height="168">
  <circle cx="88" cy="84" r="58" fill="#2C2C24"/>
  <circle cx="88" cy="84" r="51" fill="none" stroke="#C9A961" stroke-width="2.5"/>
  <text x="88" y="72" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="12" font-weight="bold" fill="#C9A961" letter-spacing="2">PT</text>
  <text x="88" y="102" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="27" font-weight="bold" fill="#FFFFFF" letter-spacing="1">MJI</text>
  <text x="505" y="52" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="bold" fill="#1F1F18" letter-spacing="2.5">PT. MITRA JASATRIA INDONESIA</text>
  <text x="505" y="86" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="17" fill="#3A3A30" letter-spacing="0.5">Jl. Gerilya No. 45, Purwokerto Selatan, Banyumas, Jawa Tengah</text>
  <text x="505" y="112" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="17" fill="#3A3A30" letter-spacing="0.5">Telp: (0281) 634567 / 0812-3456-7890</text>
  <rect x="26" y="140" width="948" height="4" fill="#1F1F18"/>
  <rect x="26" y="148" width="948" height="1.5" fill="#1F1F18"/>
</svg>`;

export const KOP_IMAGE_FIX: string = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(KOP_SVG)}`;

/** Pengaturan tata letak kop fix (dipakai sebagai initial state Surat Tugas). */
export const KOP_DEFAULT_SETTINGS = {
  kopImageHeight: 118,
  kopImageFit: 'contain' as const,
  kopImageAlign: 'center' as const,
  kopImageOffsetY: 0,
  kopImageOffsetX: 0,
  kopImageMarginBottom: 28,
};
