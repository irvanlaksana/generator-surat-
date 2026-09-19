export const formatDateID = (dateString: string): string => {
  if (!dateString) return '';
  // Check if it's YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const [y, m, d] = dateString.split('-');
    return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
  }
  return dateString;
};

export const formatDateDDMMYYYY = (dateString: string): string => {
  if (!dateString) return '';
  const trimmed = dateString.trim();
  // If already DD/MM/YYYY or D/M/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [d, m, y] = trimmed.split('/');
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  // If YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split('-');
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  return trimmed;
};

export const getTodaySignPlaceDate = (city = 'Purwokerto'): string => {
  const now = new Date();
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const day = now.getDate();
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  return `${city}, ${day} ${month} ${year}`;
};

export const formatCleanAddress = (address: string): string => {
  if (!address) return '';
  return address
    .replace(/,\s*KAB\.\s*[^,]+/gi, '')
    .replace(/^KAB\.\s*[^,]+,?\s*/gi, '')
    .trim()
    .replace(/,\s*$/, '');
};

