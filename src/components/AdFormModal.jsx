// src/components/AdFormModal.jsx
import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateVideoThumbnail } from "../utils/videoThumbnail";
import CloseButton from "./ui/CloseButton";

export default function AdFormModal({
  open,
  onClose,
  onSave,
  initial = null, // when editing pass ad object
  saving,
}) {
  const [form, setForm] = useState({
    adId: "",
    title: "",
    category: "",
    company: "",
    budget: "",
    startTime: "",
    endTime: "",
    location: "",
    type: "image",
    email: "",
    contact: "",
    isActive: true,
  });
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [thumbnailBlob, setThumbnailBlob] = useState(null);
  const [error, setError] = useState("");
  const inputFileRef = useRef();

  useEffect(() => {
    if (initial) {
      setForm({
        adId: initial.adId || initial.id || "",
        title: initial.title || "",
        category: initial.category || "",
        company: initial.company || "",
        budget: initial.budget || "",
        startTime: initial.startTime || "",
        endTime: initial.endTime || "",
        location: initial.location || "",
        type: initial.mediaType || "image",
        email: initial.email || "",
        contact: initial.contact || "",
        isActive: initial.isActive ?? true,
      });
      setPreviewUrl(initial.thumbnailUrl || initial.mediaUrl || "");
      setFile(null);
      setThumbnailBlob(null);
      setError("");
    } else {
      setForm((f) => ({ ...f, isActive: true }));
      setPreviewUrl("");
      setFile(null);
      setThumbnailBlob(null);
      setError("");
    }
  }, [initial, open]);


  const onFileChange = async (e) => {
    setError("");
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 100 * 1024 * 1024) {
      setError("Max file size is 100MB");
      inputFileRef.current.value = "";
      return;
    }
    setFile(f);
    // create immediate preview for image or video
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);

    if (f.type.startsWith("video")) {
      try {
        const thumbBlob = await generateVideoThumbnail(f, 1);
        setThumbnailBlob(thumbBlob);
      } catch (err) {
        console.error("thumbnail err", err);
      }
    } else {
      setThumbnailBlob(null);
    }
  };

  const handleChange = (k) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((s) => ({ ...s, [k]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // basic validation
    if (!form.title) {
      setError("Title required");
      return;
    }
    setError("");
    await onSave(form, file, thumbnailBlob);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/60 backdrop-blur-sm p-4 md:p-6"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl border border-gray-200 dark:border-slate-700 overflow-hidden"
          >
            <div className="flex justify-between items-center px-6 py-5 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-gray-50 to-white dark:from-slate-800 dark:to-slate-900">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{initial ? "Edit Ad" : "New Ad"}</h3>
              <CloseButton onClick={onClose} />
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Ad ID</label>
                  <input 
                    value={form.adId} 
                    onChange={handleChange("adId")} 
                    className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all" 
                    placeholder="Enter Ad ID" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Ad Title *</label>
                  <input 
                    value={form.title} 
                    onChange={handleChange("title")} 
                    className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all" 
                    placeholder="Enter Ad Title" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Category</label>
                  <input 
                    value={form.category} 
                    onChange={handleChange("category")} 
                    className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all" 
                    placeholder="Enter category" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Company</label>
                  <input 
                    value={form.company} 
                    onChange={handleChange("company")} 
                    className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all" 
                    placeholder="Enter company" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Budget</label>
                  <input 
                    value={form.budget} 
                    onChange={handleChange("budget")} 
                    className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all" 
                    placeholder="Enter budget" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Start Time</label>
                  <input 
                    value={form.startTime} 
                    onChange={handleChange("startTime")} 
                    className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all" 
                    placeholder="Enter start time" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">End Time</label>
                  <input 
                    value={form.endTime} 
                    onChange={handleChange("endTime")} 
                    className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all" 
                    placeholder="Enter end time" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Location</label>
                  <input 
                    value={form.location} 
                    onChange={handleChange("location")} 
                    className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all" 
                    placeholder="Enter location" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Type</label>
                  <select 
                    value={form.type} 
                    onChange={handleChange("type")} 
                    className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email</label>
                  <input 
                    value={form.email} 
                    onChange={handleChange("email")} 
                    className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all" 
                    placeholder="Enter email" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Contact No</label>
                  <input 
                    value={form.contact} 
                    onChange={handleChange("contact")} 
                    className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all" 
                    placeholder="Enter contact no" 
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={form.isActive} 
                      onChange={handleChange("isActive")} 
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500/50"
                    />
                    Active
                  </label>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Attachment</label>
                  <div className="flex gap-4 items-center mb-3">
                    <input 
                      ref={inputFileRef} 
                      type="file" 
                      accept="image/*,video/*" 
                      onChange={onFileChange}
                      className="text-sm text-gray-700 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-300"
                    />
                    <div className="text-xs text-gray-500 dark:text-gray-400">Max 100MB</div>
                  </div>
                  {previewUrl && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700">
                      {form.type === "video" || (file && file.type.startsWith("video")) ? (
                        <video src={previewUrl} controls className="max-h-48 w-full object-contain bg-gray-50 dark:bg-slate-900" />
                      ) : (
                        <img src={previewUrl} alt="preview" className="max-h-48 w-full object-contain bg-gray-50 dark:bg-slate-900" />
                      )}
                    </div>
                  )}
                </div>

                <div className="col-span-2 flex justify-end items-center gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-slate-700">
                  <button 
                    type="button" 
                    onClick={onClose} 
                    className="px-5 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={saving} 
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg shadow-blue-500/30"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
