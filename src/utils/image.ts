import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE_MB } from '../data/defaults';

/**
 * Validasi + optimasi berkas gambar yang diunggah user.
 * Gambar di-resize & dikompresi menjadi JPEG base64 supaya lampiran PDF
 * tetap ringan (html2canvas hanya bisa merender raster, bukan PDF).
 */

export interface ReadImageResult {
  url: string;
  width: number;
  height: number;
  size: number;
  fileName: string;
}

export class UploadError extends Error {}

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
    return `Format "${file.type || file.name.split('.').pop()}" tidak didukung. Gunakan JPG, PNG, atau WEBP.`;
  }
  const sizeMb = file.size / 1024 / 1024;
  if (sizeMb > MAX_FILE_SIZE_MB) {
    return `Ukuran ${sizeMb.toFixed(1)} MB melebihi batas ${MAX_FILE_SIZE_MB} MB. Kompres gambar terlebih dahulu.`;
  }
  if (file.size === 0) return 'File kosong / rusak, silakan unggah ulang.';
  return null;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new UploadError('Gambar tidak dapat dibaca (file mungkin rusak).'));
    img.src = src;
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new UploadError('Gagal membaca file dari perangkat.'));
    reader.readAsDataURL(file);
  });
}

/** Perkiraan panjang base64 data URL dalam byte */
function approxBytes(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] ?? '';
  return Math.round((base64.length * 3) / 4);
}

export async function readImageFile(file: File, maxEdge = 1400, quality = 0.82): Promise<ReadImageResult> {
  const invalid = validateImageFile(file);
  if (invalid) throw new UploadError(invalid);

  const dataUrl = await readFileAsDataUrl(file);
  const img = await loadImage(dataUrl);
  const natural = Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height);
  if (!natural) throw new UploadError('Dimensi gambar tidak terbaca, coba file lain.');

  const safeName = file.name.toLowerCase().replace(/\.[^.]+$/, '').slice(0, 40) || 'berkas';

  // File kecil & cukup tajam: simpan apa adanya (tanpa rekompresi)
  if (file.size <= 350_000 && natural <= maxEdge) {
    return {
      url: dataUrl,
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
      size: file.size,
      fileName: file.name || `${safeName}.jpg`,
    };
  }

  const scale = Math.min(1, maxEdge / natural);
  const width = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
  const height = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new UploadError('Browser tidak mendukung pemrosesan gambar (canvas).');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  let out = canvas.toDataURL('image/jpeg', quality);
  if (approxBytes(out) > MAX_FILE_SIZE_MB * 1024 * 1024) {
    out = canvas.toDataURL('image/jpeg', 0.65);
  }

  return { url: out, width, height, size: approxBytes(out), fileName: `${safeName}.jpg` };
}

/** Ukuran file manusiawi untuk tampilan (1.4 MB -> "1,4 MB") */
export function formatBytes(bytes: number): string {
  if (!bytes) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1).replace('.', ',')} MB`;
}
