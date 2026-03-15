import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Upload, CreditCard, FileText, CheckCircle, X, Eye, Image } from "lucide-react";

/**
 * props:
 * - data: {cnicFrontFile,cnicBackFile,regDocFile,cnicFrontName,cnicBackName,regDocName}
 * - onChange: (partial) => void
 */

const formatFileSize = (file) => {
  if (!file || !file.size) return "";
  const bytes = file.size;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const DocumentCard = ({ icon: Icon, title, description, file, fileName, fileKey, nameKey, onChange, delay }) => {
  const hasFile = !!file;
  const isImage = file instanceof File && file.type?.startsWith("image/");

  const previewUrl = useMemo(() => {
    if (file instanceof File) {
      return URL.createObjectURL(file);
    }
    return null;
  }, [file]);

  const handleUpload = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }
    onChange({ [fileKey]: selected, [nameKey]: selected.name });
  };

  const handleDelete = () => {
    onChange({ [fileKey]: null, [nameKey]: "" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className={`relative rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
        hasFile
          ? "border-green-400 dark:border-green-500 bg-green-50/50 dark:bg-green-950/20 shadow-lg shadow-green-100 dark:shadow-green-900/10"
          : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-500"
      }`}
    >
      {/* Green accent bar when uploaded */}
      {hasFile && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-emerald-500" />
      )}

      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Left icon */}
          <div className={`flex-shrink-0 p-3 rounded-xl ${
            hasFile
              ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-200 dark:shadow-green-900/30"
              : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
          }`}>
            <Icon className="w-6 h-6" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
              {hasFile && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </motion.div>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{description}</p>

            {/* Upload state */}
            {hasFile ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                {/* File info row */}
                <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl p-3 border border-green-200 dark:border-green-800">
                  <div className="flex-shrink-0">
                    {isImage && previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-12 h-12 rounded-lg object-cover border border-green-200 dark:border-green-700"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-slate-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{fileName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatFileSize(file)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {/* Preview button */}
                    {previewUrl && (
                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                        title="Preview file"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                    )}
                    {/* Re-upload button */}
                    <label className="p-2 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors cursor-pointer" title="Replace file">
                      <Upload className="w-4 h-4" />
                      <input type="file" className="hidden" onChange={handleUpload} accept="image/*,.pdf" />
                    </label>
                    {/* Delete button */}
                    <button
                      onClick={handleDelete}
                      className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Large image preview */}
                {isImage && previewUrl && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="rounded-xl overflow-hidden border border-green-200 dark:border-green-800"
                  >
                    <img
                      src={previewUrl}
                      alt="Document preview"
                      className="w-full max-h-48 object-contain bg-slate-50 dark:bg-slate-900"
                    />
                  </motion.div>
                )}
              </motion.div>
            ) : (
              /* Drop zone / Upload area */
              <label className="group block cursor-pointer">
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 text-center hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all duration-300">
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                      <Upload className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        Click or drag to upload
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        JPG, PNG or PDF - Max 5MB
                      </p>
                    </div>
                  </div>
                </div>
                <input type="file" className="hidden" onChange={handleUpload} accept="image/*,.pdf" />
              </label>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const Step3Documents = ({ data, onChange }) => {
  const documents = [
    {
      icon: CreditCard,
      title: "CNIC Front",
      description: "Upload a clear photo of the front side of your CNIC card",
      fileKey: "cnicFrontFile",
      nameKey: "cnicFrontName",
    },
    {
      icon: CreditCard,
      title: "CNIC Back",
      description: "Upload a clear photo of the back side of your CNIC card",
      fileKey: "cnicBackFile",
      nameKey: "cnicBackName",
    },
    {
      icon: FileText,
      title: "Vehicle Registration Document",
      description: "Upload the vehicle registration certificate or ownership document",
      fileKey: "regDocFile",
      nameKey: "regDocName",
    },
  ];

  const uploadedCount = documents.filter((d) => data[d.fileKey]).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-blue-900 dark:text-white">Document Upload</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Upload required verification documents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${
            uploadedCount === documents.length
              ? "text-green-600 dark:text-green-400"
              : "text-slate-500 dark:text-slate-400"
          }`}>
            {uploadedCount}/{documents.length} uploaded
          </span>
          {uploadedCount === documents.length && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <CheckCircle className="w-5 h-5 text-green-500" />
            </motion.div>
          )}
        </div>
      </div>

      {/* Document cards */}
      <div className="space-y-4">
        {documents.map((doc, index) => (
          <DocumentCard
            key={doc.fileKey}
            icon={doc.icon}
            title={doc.title}
            description={doc.description}
            file={data[doc.fileKey]}
            fileName={data[doc.nameKey]}
            fileKey={doc.fileKey}
            nameKey={doc.nameKey}
            onChange={onChange}
            delay={index * 0.1}
          />
        ))}
      </div>

      {/* Footer note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-xs text-slate-500 dark:text-slate-400 mt-5 flex items-center gap-2"
      >
        <Image className="w-4 h-4" />
        Supported formats: JPG, PNG, PDF (Max 5MB per file)
      </motion.p>
    </motion.div>
  );
};

export default Step3Documents;
