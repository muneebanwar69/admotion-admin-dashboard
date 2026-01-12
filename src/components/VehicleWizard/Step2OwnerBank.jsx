import React from "react";

/**
 * props:
 * - data: {firstName,lastName,cnic,email,accountTitle,accountNo,iban,bankName}
 * - onChange: (partial) => void
 */
const Step2OwnerBank = ({ data, onChange }) => {
  const set = (k, v) => onChange({ [k]: v });

  const inputClass = "w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 transition-all";
  const labelClass = "block text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1";

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md">
      <h2 className="text-xl font-bold text-blue-900 dark:text-white mb-6">Owner & Bank Details</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className={labelClass}>First Name</label>
          <input
            value={data.firstName}
            onChange={(e) => set("firstName", e.target.value)}
            className={inputClass}
            placeholder="First name"
          />
        </div>

        <div>
          <label className={labelClass}>Last Name</label>
          <input
            value={data.lastName}
            onChange={(e) => set("lastName", e.target.value)}
            className={inputClass}
            placeholder="Last name"
          />
        </div>

        <div>
          <label className={labelClass}>CNIC</label>
          <input
            value={data.cnic}
            onChange={(e) => set("cnic", e.target.value)}
            placeholder="35202-1234567-1"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Email</label>
          <input
            value={data.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="name@domain.com"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Account Title</label>
          <input
            value={data.accountTitle}
            onChange={(e) => set("accountTitle", e.target.value)}
            placeholder="Account title"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Account No</label>
          <input
            value={data.accountNo}
            onChange={(e) => set("accountNo", e.target.value)}
            placeholder="001122334455"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>IBAN</label>
          <input
            value={data.iban}
            onChange={(e) => set("iban", e.target.value)}
            placeholder="PK00HABB0000..."
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Bank Name</label>
          <input
            value={data.bankName}
            onChange={(e) => set("bankName", e.target.value)}
            placeholder="Bank name"
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
};

export default Step2OwnerBank;
