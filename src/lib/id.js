// Generates a sequential car id like ADM-0001, ADM-0002, ADM-0003...
export function generateCarId(existingVehicles = []) {
  const PREFIX = 'ADM-';

  // Extract numeric parts from existing vehicle IDs
  const existingNums = existingVehicles
    .map(v => {
      const id = v.carId;
      // Handle ADM-XXXX format
      if (id && id.startsWith(PREFIX)) {
        const num = parseInt(id.slice(PREFIX.length), 10);
        return isNaN(num) ? 0 : num;
      }
      // Handle legacy plain-number IDs (e.g. "01", "02")
      if (id && /^\d+$/.test(id)) {
        return parseInt(id, 10);
      }
      return 0;
    })
    .filter(n => n > 0);

  // Find the highest number and increment
  const maxNum = existingNums.length > 0 ? Math.max(...existingNums) : 0;
  const nextNum = maxNum + 1;

  // Format as ADM-0001, ADM-0002, etc.
  return `${PREFIX}${String(nextNum).padStart(4, '0')}`;
}
