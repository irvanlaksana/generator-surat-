export function generateLetterNumber(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const sequence = Math.floor(Math.random() * 9000) + 1000;

  return `ST-DC/MJI/${year}/${month}/${sequence}`;
}