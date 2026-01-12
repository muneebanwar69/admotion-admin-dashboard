// Basic regex helpers
const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ibanRx = /^[A-Z]{2}\d[A-Z0-9]{12,30}$/i;

export function validateStep1(data) {
  const {
    type, vehicleName, ownerName, model, color, cnic, duration, registrationDate,
  } = data;

  const allFilled = [
    type, vehicleName, ownerName, model, color, cnic, duration, registrationDate,
  ].every((v) => String(v || "").trim().length > 0);

  // Minimal CNIC format check (#####-#######-#) or digits 13
  const cnicOk =
    /^\d{5}-\d{7}-\d$/.test(cnic) || /^\d{13}$/.test(cnic);

  return allFilled && cnicOk;
}

export function validateStep2(data) {
  const {
    firstName, lastName, cnic, email, accountTitle, accountNo, iban, bankName,
  } = data;

  const allFilled = [
    firstName, lastName, cnic, email, accountTitle, accountNo, iban, bankName,
  ].every((v) => String(v || "").trim().length > 0);

  const emailOk = emailRx.test(email);
  const cnicOk =
    /^\d{5}-\d{7}-\d$/.test(cnic) || /^\d{13}$/.test(cnic);
  const ibanOk = ibanRx.test(iban);

  return allFilled && emailOk && cnicOk && ibanOk;
}

export function validateStep3(data) {
  // Require three docs; we accept either File object OR a pre-filled name (for edit)
  const hasFront = !!(data.cnicFrontFile || data.cnicFrontName);
  const hasBack = !!(data.cnicBackFile || data.cnicBackName);
  const hasReg = !!(data.regDocFile || data.regDocName);
  return hasFront && hasBack && hasReg;
}
