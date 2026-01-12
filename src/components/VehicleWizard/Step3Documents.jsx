import React from "react";

/**
 * props:
 * - data: {cnicFrontFile,cnicBackFile,regDocFile,cnicFrontName,cnicBackName,regDocName}
 * - onChange: (partial) => void
 */
const FileRow = ({ label, value, onChange }) => {
  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50">
      <div className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</div>
      <div className="flex items-center gap-3">
        {value ? (
          <span className="text-xs text-green-600 dark:text-green-400 max-w-[180px] truncate font-medium">✓ {value}</span>
        ) : (
          <span className="text-xs text-gray-400 dark:text-gray-500">No file selected</span>
        )}
        <label className="inline-flex cursor-pointer px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold transition-all shadow-md hover:shadow-lg">
          Upload
          <input type="file" className="hidden" onChange={onChange} accept="image/*,.pdf" />
        </label>
      </div>
    </div>
  );
};

const Step3Documents = ({ data, onChange }) => {
  const setFile = (k, fileObj, nameKey) => {
    onChange({ [k]: fileObj, [nameKey]: fileObj?.name || "" });
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md">
      <h2 className="text-xl font-bold text-blue-900 dark:text-white mb-6">Document Upload</h2>
      <div className="space-y-4">
        <FileRow
          label="CNIC Front"
          value={data.cnicFrontName}
          onChange={(e) => setFile("cnicFrontFile", e.target.files?.[0] || null, "cnicFrontName")}
        />
        <FileRow
          label="CNIC Back"
          value={data.cnicBackName}
          onChange={(e) => setFile("cnicBackFile", e.target.files?.[0] || null, "cnicBackName")}
        />
        <FileRow
          label="Vehicle Registration Document"
          value={data.regDocName}
          onChange={(e) => setFile("regDocFile", e.target.files?.[0] || null, "regDocName")}
        />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
        Supported formats: Images (JPG, PNG) and PDF files
      </p>
    </div>
  );
};

export default Step3Documents;
