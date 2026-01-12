import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Trash2, Save, PlusCircle, Upload, X, Search } from "lucide-react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { logAdCreated, logAdUpdated, logAdDeleted } from "../services/activityLogger";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useUpload } from "../contexts/UploadContext";
import { SkeletonList } from "../components/ui/SkeletonLoader";
import { EmptyAds } from "../components/ui/EmptyState";

const Ads = () => {
  const toast = useToast();
  const { currentUser } = useAuth();
  const { startUpload, isUploading } = useUpload();
  const [ads, setAds] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    adId: "",
    title: "",
    category: "",
    company: "",
    budget: "",
    start: "",
    end: "",
    status: "",
    location: "",
    type: "Image",
    email: "",
    contact: "",
    preview: "",
    mediaBase64: "",
    mediaType: "Image",
    mediaSize: "",
    mediaName: "",
  });

  const [deleteTarget, setDeleteTarget] = useState(null);
  const adsCollection = collection(db, "ads");

  // ✅ Real-time fetch ads
  useEffect(() => {
    const unsubscribe = onSnapshot(adsCollection, (snapshot) => {
      const adsList = snapshot.docs.map((doc) => ({
        ...doc.data(),
        docId: doc.id,
      }));
      setAds(adsList);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching ads:', error);
      toast.error('Failed to load ads');
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ✅ Open new ad form
  const handleNewAd = () => {
    setFormData({
      adId: `Ad ${String(ads.length + 1).padStart(2, "0")}`,
      title: "",
      category: "",
      company: "",
      budget: "",
      start: "",
      end: "",
      status: "",
      location: "",
      type: "Image",
      email: "",
      contact: "",
      preview: "",
      mediaBase64: "",
      mediaType: "Image",
      mediaSize: "",
      mediaName: "",
    });
    setPreviewFile(null);
    setEditingAd(null);
    setShowForm(true);
  };

  // ✅ Edit ad
  const handleEdit = (ad) => {
    setFormData({
      ...ad,
      // Keep the preview URL for display (could be base64 or URL)
      preview: ad.mediaBase64 || ad.preview || "",
    });
    setPreviewFile(null);
    setEditingAd(ad.docId);
    setShowForm(true);
  };

  // ✅ Handle file upload & preview (just set preview, actual upload happens on save)
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileSizeMB = file.size / (1024 * 1024);
      
      // Warning for large files
      if (fileSizeMB > 20) {
        toast.warning(`Large file (${fileSizeMB.toFixed(1)} MB) - upload may take longer`);
      }
      
      setPreviewFile(file);
      
      // Create preview URL for display
      const previewUrl = URL.createObjectURL(file);
      
      setFormData({ 
        ...formData, 
        preview: previewUrl,
        mediaType: file.type.startsWith('video') ? 'Video' : 'Image',
        type: file.type.startsWith('video') ? 'Video' : 'Image',
        mediaSize: fileSizeMB.toFixed(2) + ' MB',
        mediaName: file.name
      });
      
      console.log('📁 File selected:', file.name, fileSizeMB.toFixed(2), 'MB');
    }
  };

  // ✅ Remove uploaded preview before saving
  const removePreview = () => {
    setPreviewFile(null);
    setFormData({ ...formData, preview: "", mediaBase64: "", mediaSize: "", mediaName: "" });
  };

  // ✅ Save ad - Uses background upload so admin can navigate away
  const handleSave = async () => {
    if (!formData.title) {
      toast.error('Please enter a title for the ad');
      return;
    }

    const userName = currentUser?.displayName || currentUser?.username || 'Admin';
    
    // Close the form immediately - upload continues in background
    setShowForm(false);
    toast.info('Upload started - you can navigate to other pages');
    
    // Start background upload
    startUpload(
      formData,
      previewFile,
      editingAd,
      userName,
      () => {
        // Success callback
        toast.success(editingAd ? 'Ad updated successfully!' : 'Ad created successfully!');
      },
      (error) => {
        // Error callback
        toast.error(`Upload failed: ${error.message}`);
      }
    );
    
    // Reset form
    setPreviewFile(null);
    setEditingAd(null);
  };

  // ✅ Ask delete
  const askDelete = (ad) => {
    setDeleteTarget(ad);
  };

  // ✅ Confirm delete
  const confirmDelete = async () => {
    if (deleteTarget) {
      try {
        const userName = currentUser?.displayName || currentUser?.username || 'Admin';
        await deleteDoc(doc(db, "ads", deleteTarget.docId));
        setAds(ads.filter((ad) => ad.docId !== deleteTarget.docId));
        await logAdDeleted(deleteTarget, userName);
        toast.success('Ad deleted successfully!');
        setDeleteTarget(null);
      } catch (error) {
        console.error('Error deleting ad:', error);
        toast.error('Failed to delete ad. Please try again.');
      }
    }
  };

  // ✅ Cancel delete
  const cancelDelete = () => {
    setDeleteTarget(null);
  };

  // Filter ads based on search query
  const filteredAds = ads.filter((ad) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      ad.adId?.toLowerCase().includes(query) ||
      ad.title?.toLowerCase().includes(query) ||
      ad.company?.toLowerCase().includes(query) ||
      ad.category?.toLowerCase().includes(query) ||
      ad.location?.toLowerCase().includes(query) ||
      ad.email?.toLowerCase().includes(query) ||
      ad.contact?.toLowerCase().includes(query) ||
      ad.status?.toLowerCase().includes(query)
    );
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 relative"
    >
      {/* ✅ TABLE VIEW */}
      {!showForm && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl font-bold text-slate-800 dark:text-slate-100"
            >
              Ads Management
            </motion.h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNewAd}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-500/50 hover:shadow-xl transition-all duration-300"
            >
              <PlusCircle size={18} /> New Ad
            </motion.button>
          </div>

          {/* Search Filter */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by company name, ad title, category, location, email, contact..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#101c44] focus:border-transparent transition-all duration-200 hover:border-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>
            {searchQuery && (
              <div className="mt-2 text-sm text-gray-600">
                Found {filteredAds.length} ad{filteredAds.length !== 1 ? 's' : ''} matching "{searchQuery}"
              </div>
            )}
          </div>

          {loading ? (
            <SkeletonList items={5} />
          ) : filteredAds.length === 0 && !searchQuery ? (
            <EmptyAds onAdd={handleNewAd} />
          ) : (
            <div className="overflow-x-auto shadow-lg rounded-xl transition-all duration-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-gradient-to-r from-brand-900 to-brand-800 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Ad ID</th>
                    <th className="px-4 py-3 text-left font-semibold">Ad Title</th>
                    <th className="px-4 py-3 text-left font-semibold">Category</th>
                    <th className="px-4 py-3 text-left font-semibold">Company</th>
                    <th className="px-4 py-3 text-left font-semibold">Budget</th>
                    <th className="px-4 py-3 text-left font-semibold">Start Date</th>
                    <th className="px-4 py-3 text-left font-semibold">End Date</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Location</th>
                    <th className="px-4 py-3 text-left font-semibold">Type</th>
                    <th className="px-4 py-3 text-left font-semibold">Email</th>
                    <th className="px-4 py-3 text-left font-semibold">Contact</th>
                    <th className="px-4 py-3 text-left font-semibold">Preview</th>
                    <th className="px-4 py-3 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAds.length === 0 ? (
                    <tr>
                      <td colSpan="14" className="px-4 py-12 text-center text-gray-500 dark:text-slate-400">
                        <div>
                          <p className="text-lg font-medium mb-2">No ads found</p>
                          <p className="text-sm">Try adjusting your search query</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <AnimatePresence>
                      {filteredAds.map((ad, index) => (
                        <motion.tr
                          key={ad.docId}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: index * 0.03 }}
                          className="border-b dark:border-slate-700 text-center hover:bg-gray-50 dark:hover:bg-slate-700 transition-all duration-200 group"
                        >
                    <td className="px-4 py-2">{ad.adId}</td>
                    <td className="px-4 py-2">{ad.title}</td>
                    <td className="px-4 py-2">{ad.category}</td>
                    <td className="px-4 py-2">{ad.company}</td>
                    <td className="px-4 py-2">{ad.budget}</td>
                    <td className="px-4 py-2">{ad.start}</td>
                    <td className="px-4 py-2">{ad.end}</td>
                    <td className="px-4 py-2">
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                          ad.status === 'Active'
                            ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg shadow-green-400/50'
                            : 'bg-gradient-to-r from-red-400 to-rose-500 text-white shadow-lg shadow-red-400/50'
                        }`}
                      >
                        <motion.span
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-2 h-2 bg-white rounded-full"
                        />
                        {ad.status}
                      </motion.span>
                    </td>
                    <td className="px-4 py-2 dark:text-slate-100">{ad.location}</td>
                    <td className="px-4 py-2 dark:text-slate-100">{ad.type}</td>
                    <td className="px-4 py-2 dark:text-slate-100">{ad.email}</td>
                    <td className="px-4 py-2 dark:text-slate-100">{ad.contact}</td>
                    <td className="px-4 py-2">
                      {ad.preview ? (
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className="inline-block"
                        >
                          {ad.type === "Image" ? (
                            <img
                              src={ad.preview}
                              alt="Preview"
                              className="h-12 w-12 object-cover mx-auto rounded-lg shadow-md"
                            />
                          ) : (
                            <video
                              src={ad.preview}
                              className="h-12 w-12 mx-auto rounded-lg shadow-md"
                              controls
                            />
                          )}
                        </motion.div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleEdit(ad)}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          Edit
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => askDelete(ad)}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          Delete
                        </motion.button>
                      </div>
                    </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ✅ FORM VIEW */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-800 shadow-xl rounded-xl p-6 max-w-3xl border border-slate-200 dark:border-slate-700 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-6">
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xl font-bold text-slate-800 dark:text-slate-100"
              >
                {editingAd ? "Edit Ad" : "Add New Ad"}
              </motion.h2>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowForm(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X size={20} />
              </motion.button>
            </div>

          <div className="grid grid-cols-2 gap-4">
            {Object.keys(formData).map((key) =>
              key !== "preview" && key !== "adId" ? (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1 capitalize">
                    {key}
                  </label>
                  {key === "type" ? (
                    <select
                      value={formData[key]}
                      onChange={(e) =>
                        setFormData({ ...formData, [key]: e.target.value })
                      }
                      className="w-full border rounded-md p-2 transition-all duration-200 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    >
                      <option>Image</option>
                      <option>Video</option>
                    </select>
                  ) : key === "start" || key === "end" ? (
                    <input
                      type="date"
                      value={formData[key]}
                      onChange={(e) =>
                        setFormData({ ...formData, [key]: e.target.value })
                      }
                      className="w-full border rounded-md p-2 transition-all duration-200 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  ) : (
                    <input
                      type="text"
                      value={formData[key]}
                      onChange={(e) =>
                        setFormData({ ...formData, [key]: e.target.value })
                      }
                      className="w-full border rounded-md p-2 transition-all duration-200 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  )}
                </div>
              ) : null
            )}

            {/* ✅ File Upload (Styled) */}
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">
                Upload Attachment
              </label>
              <label className="flex items-center gap-2 bg-[#101c44] text-white px-4 py-2 rounded-md cursor-pointer hover:bg-[#182b5b] w-fit transition-all duration-200 transform hover:scale-105">
                <Upload size={18} />
                Choose File
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {formData.preview && (
                <div className="mt-3 relative inline-block">
                  {formData.type === "Image" ? (
                    <img
                      src={formData.preview}
                      alt="Preview"
                      className="h-32 w-32 object-cover rounded-md border"
                    />
                  ) : (
                    <video
                      src={formData.preview}
                      controls
                      className="h-32 w-32 rounded-md border"
                    />
                  )}
                  <button
                    onClick={removePreview}
                    className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition-all duration-200 transform hover:scale-110"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

            <div className="flex gap-3 mt-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-500/50 hover:shadow-xl transition-all duration-300 ${
                  saving ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} /> Save
                  </>
                )}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowForm(false)}
                className="px-6 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300"
              >
                Cancel
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✅ Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={cancelDelete}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-96 border border-slate-200 dark:border-slate-700"
            >
              <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Confirm Delete</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Are you sure you want to delete this ad? This action cannot be undone.
              </p>
              <div className="flex justify-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={confirmDelete}
                  className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Yes, Delete
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={cancelDelete}
                  className="px-6 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Ads;
