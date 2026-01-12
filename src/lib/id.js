// Generates a sequential car id like 01, 02, 03...
export function generateCarId(existingVehicles = []) {
  // Extract numeric IDs from existing vehicles
  const existingIds = existingVehicles
    .map(v => {
      const id = v.carId;
      // Handle both numeric (01, 02) and old format (CAR-XXX)
      if (/^\d+$/.test(id)) {
        return parseInt(id, 10);
      }
      return 0;
    })
    .filter(id => id > 0);

  // Find the highest ID and add 1
  const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
  const nextId = maxId + 1;

  // Format with leading zero (01, 02, etc.)
  return String(nextId).padStart(2, '0');
}
