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
