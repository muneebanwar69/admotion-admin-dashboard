import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Trash2, Save, PlusCircle, Upload, X, Search, Layers, LayoutGrid, List, CheckCircle, DollarSign, Film } from "lucide-react";
import RealTimeIndicator from "../components/ui/RealTimeIndicator";
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

// City area definitions
const CITY_AREAS = {
  Islamabad: ['F-6', 'F-7', 'F-8', 'Blue Area', 'G-9', 'I-8', 'G-11', 'H-9'],
  Lahore: ['Gulberg', 'DHA', 'Model Town', 'Johar Town', 'Liberty'],
  Karachi: ['Clifton', 'DHA Karachi', 'Saddar', 'Gulshan'],
  Rawalpindi: ['Saddar', 'Commercial Market', 'Bahria Town'],
  Peshawar: ['Saddar', 'University Town', 'Hayatabad'],
  Faisalabad: ['D Ground', 'Peoples Colony', 'Madina Town'],
  Multan: ['Cantt', 'Gulgasht Colony', 'Bosan Road'],
};

const CITIES = Object.keys(CITY_AREAS);
const STATUS_OPTIONS = ['Active', 'Inactive', 'Pending', 'Expired'];
const TIME_SLOTS = ['Morning', 'Afternoon', 'Evening', 'Night'];
const WEATHER_TARGETS = ['Sunny', 'Rainy', 'Cold', 'Cloudy'];

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
  const [viewMode, setViewMode] = useState("table"); // "table" or "cards"

  const [formData, setFormData] = useState({
    adId: "",
    title: "",
    category: "",
    company: "",
    budget: "",
    start: "",
    end: "",
    status: "Active",
    location: "",
    type: "Image",
    email: "",
    contact: "",
    preview: "",
    mediaBase64: "",
    mediaType: "Image",
    mediaSize: "",
    mediaName: "",
    timeSlots: [],
    weatherTargets: [],
    targetAreas: [],
  });

  const [deleteTarget, setDeleteTarget] = useState(null);
  const adsCollection = collection(db, "ads");

  // Real-time fetch ads
  useEffect(() => {
    let isActive = true;
    let retryCount = 0;
    const maxRetries = 2;

    const setupListener = () => {
      if (!isActive) return;

      try {
        const unsubscribe = onSnapshot(
          adsCollection,
          (snapshot) => {
            if (!isActive) return;
            const adsList = snapshot.docs.map((doc) => ({
              ...doc.data(),
              docId: doc.id,
            }));
            setAds(adsList);
            setLoading(false);
            retryCount = 0;
          },
          (error) => {
            if (!isActive) return;

            if (error.code === 'internal' || error.message?.includes('ASSERTION')) {
              if (retryCount < maxRetries) {
                retryCount++;
                setTimeout(setupListener, 500 * retryCount);
              } else {
                toast.error('Connection error - please refresh the page');
                setLoading(false);
              }
            } else {
              console.error('Ads Page: Error fetching ads:', error);
              toast.error('Failed to load ads');
              setLoading(false);
            }
          }
        );

        return () => {
          isActive = false;
          unsubscribe?.();
        };
      } catch (err) {
        console.error('Failed to set up listener:', err);
        if (isActive && retryCount < maxRetries) {
          retryCount++;
          setTimeout(setupListener, 500 * retryCount);
        }
      }
    };

    const cleanup = setupListener();
    return cleanup;
  }, []);

  // Open new ad form
  const handleNewAd = () => {
    setFormData({
      adId: `Ad ${String(ads.length + 1).padStart(2, "0")}`,
      title: "",
      category: "",
      company: "",
      budget: "",
      start: "",
      end: "",
      status: "Active",
      location: "",
      type: "Image",
      email: "",
      contact: "",
      preview: "",
      mediaBase64: "",
      mediaType: "Image",
      mediaSize: "",
      mediaName: "",
      timeSlots: [],
      weatherTargets: [],
      targetAreas: [],
    });
    setPreviewFile(null);
    setEditingAd(null);
    setShowForm(true);
  };

  // Edit ad
  const handleEdit = (ad) => {
    setFormData({
      ...ad,
      preview: ad.mediaBase64 || ad.preview || "",
      timeSlots: ad.timeSlots || [],
      weatherTargets: ad.weatherTargets || [],
      targetAreas: ad.targetAreas || [],
    });
    setPreviewFile(null);
    setEditingAd(ad.docId);
    setShowForm(true);
  };

  // Handle file upload & preview
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileSizeMB = file.size / (1024 * 1024);

      if (fileSizeMB > 20) {
        toast.warning(`Large file (${fileSizeMB.toFixed(1)} MB) - upload may take longer`);
      }

      setPreviewFile(file);

      const previewUrl = URL.createObjectURL(file);

      setFormData({
        ...formData,
        preview: previewUrl,
        mediaType: file.type.startsWith('video') ? 'Video' : 'Image',
        type: file.type.startsWith('video') ? 'Video' : 'Image',
        mediaSize: fileSizeMB.toFixed(2) + ' MB',
        mediaName: file.name
      });
    }
  };

  // Remove uploaded preview before saving
  const removePreview = () => {
    setPreviewFile(null);
    setFormData({ ...formData, preview: "", mediaBase64: "", mediaSize: "", mediaName: "" });
  };

  // Save ad
  const handleSave = async () => {
    if (!formData.title) {
      toast.error('Please enter a title for the ad');
      return;
    }

    const userName = currentUser?.displayName || currentUser?.username || 'Admin';

    setShowForm(false);
    toast.info('Upload started - you can navigate to other pages');

    startUpload(
      formData,
      previewFile,
      editingAd,
      userName,
      () => {
        toast.success(editingAd ? 'Ad updated successfully!' : 'Ad created successfully!');
      },
      (error) => {
        toast.error(`Upload failed: ${error.message}`);
      }
    );

    setPreviewFile(null);
    setEditingAd(null);
  };

  // Ask delete
  const askDelete = (ad) => {
    setDeleteTarget(ad);
  };

  // Confirm delete
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

  // Cancel delete
  const cancelDelete = () => {
    setDeleteTarget(null);
  };

  // Toggle multi-select helper
  const toggleMultiSelect = (key, value) => {
    setFormData(prev => {
      const arr = prev[key] || [];
      if (arr.includes(value)) {
        return { ...prev, [key]: arr.filter(v => v !== value) };
      } else {
        return { ...prev, [key]: [...arr, value] };
      }
    });
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

  // Available areas based on selected location
  const availableAreas = formData.location ? (CITY_AREAS[formData.location] || []) : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 relative"
    >
      {/* TABLE / CARD VIEW */}
      {!showForm && (
        <div>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className='bg-gradient-to-r from-brand-900 via-brand-800 to-brand-900 text-white px-6 py-4 rounded-2xl shadow-xl mb-6 flex items-center justify-between border border-white/10'
          >
            <div className="flex items-center gap-3">
              <Layers className="w-6 h-6" />
              <h1 className='text-xl md:text-2xl font-bold'>Ads Management</h1>
            </div>
            <div className="flex items-center gap-4">
              <RealTimeIndicator isActive={!loading} />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNewAd}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-semibold border border-white/20 transition-all duration-300"
              >
                <PlusCircle size={18} /> New Ad
              </motion.button>
            </div>
          </motion.div>

          {/* KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              {
                label: 'Total Ads',
                value: ads.length,
                icon: Layers,
                gradientFrom: 'from-blue-500',
                gradientTo: 'to-indigo-600',
                iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
                accentFrom: 'from-blue-500',
                accentTo: 'to-indigo-600',
              },
              {
                label: 'Active Ads',
                value: ads.filter((a) => a.status === 'Active').length,
                icon: CheckCircle,
                gradientFrom: 'from-green-500',
                gradientTo: 'to-emerald-600',
                iconBg: 'bg-gradient-to-br from-green-500 to-emerald-600',
                accentFrom: 'from-green-500',
                accentTo: 'to-emerald-600',
              },
              {
                label: 'Total Budget',
                value: `PKR ${ads.reduce((sum, a) => sum + (parseFloat(a.budget) || 0), 0).toLocaleString()}`,
                icon: DollarSign,
                gradientFrom: 'from-amber-500',
                gradientTo: 'to-yellow-500',
                iconBg: 'bg-gradient-to-br from-amber-500 to-yellow-500',
                accentFrom: 'from-amber-500',
                accentTo: 'to-yellow-500',
              },
              {
                label: 'Video Ads',
                value: ads.filter((a) => a.type === 'Video').length,
                icon: Film,
                gradientFrom: 'from-purple-500',
                gradientTo: 'to-violet-600',
                iconBg: 'bg-gradient-to-br from-purple-500 to-violet-600',
                accentFrom: 'from-purple-500',
                accentTo: 'to-violet-600',
              },
            ].map((card, index) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                whileHover={{ y: -4 }}
                className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-5 overflow-hidden hover:shadow-2xl transition-shadow duration-300"
              >
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.accentFrom} ${card.accentTo}`} />
                <div className="flex items-center gap-4">
                  <div className={`${card.iconBg} p-3 rounded-xl text-white shadow-lg`}>
                    <card.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{card.value}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{card.label}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Search Filter + View Toggle */}
          <div className="mb-4 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500" size={20} />
              <input
                type="text"
                placeholder="Search by company name, ad title, category, location, email, contact..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 rounded-xl focus:ring-2 focus:ring-brand-800 focus:border-transparent transition-all duration-300 hover:border-gray-400 dark:hover:border-slate-500 hover:shadow-md focus:shadow-lg"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>
            {/* View toggle */}
            <div className="flex items-center bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setViewMode("table")}
                className={`p-2.5 transition-all duration-200 ${viewMode === 'table' ? 'bg-brand-900 text-white' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
              >
                <List size={20} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setViewMode("cards")}
                className={`p-2.5 transition-all duration-200 ${viewMode === 'cards' ? 'bg-brand-900 text-white' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
              >
                <LayoutGrid size={20} />
              </motion.button>
            </div>
          </div>

          {searchQuery && (
            <div className="mb-3 text-sm text-gray-600 dark:text-slate-400">
              Found {filteredAds.length} ad{filteredAds.length !== 1 ? 's' : ''} matching "{searchQuery}"
            </div>
          )}

          {loading ? (
            <SkeletonList items={5} />
          ) : filteredAds.length === 0 && !searchQuery ? (
            <EmptyAds onAdd={handleNewAd} />
          ) : viewMode === "cards" ? (
            /* CARD GRID VIEW */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <AnimatePresence>
                {filteredAds.map((ad, index) => (
                  <motion.div
                    key={ad.docId}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-30px" }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.04, duration: 0.4 }}
                    whileHover={{ y: -4 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300 hover:shadow-xl group"
                  >
                    {/* Preview area */}
                    <div className="h-36 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center relative overflow-hidden">
                      {ad.preview ? (
                        ad.type === "Image" ? (
                          <img src={ad.preview} alt="Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <video src={ad.preview} className="w-full h-full object-cover" />
                        )
                      ) : (
                        <Layers className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                      )}
                      <div className="absolute top-2 right-2">
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            ad.status === 'Active'
                              ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg shadow-green-400/50'
                              : ad.status === 'Pending'
                              ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-lg shadow-yellow-400/50'
                              : ad.status === 'Expired'
                              ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                              : 'bg-gradient-to-r from-red-400 to-rose-500 text-white shadow-lg shadow-red-400/50'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                          {ad.status || 'N/A'}
                        </motion.span>
                      </div>
                    </div>
                    {/* Card body */}
                    <div className="p-4">
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate">{ad.title || 'Untitled'}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{ad.company} - {ad.category}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-slate-600 dark:text-slate-400">{ad.location || 'No location'}</span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{ad.budget ? `PKR ${ad.budget}` : '--'}</span>
                      </div>
                      {/* Time slots & weather tags */}
                      {(ad.timeSlots?.length > 0 || ad.weatherTargets?.length > 0) && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(ad.timeSlots || []).map(ts => (
                            <span key={ts} className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-[10px] font-medium">{ts}</span>
                          ))}
                          {(ad.weatherTargets || []).map(wt => (
                            <span key={wt} className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded text-[10px] font-medium">{wt}</span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleEdit(ad)}
                          className="flex-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold text-xs shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          Edit
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => askDelete(ad)}
                          className="flex-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold text-xs shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          Delete
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {filteredAds.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-500 dark:text-slate-400">
                  <p className="text-lg font-medium mb-2">No ads found</p>
                  <p className="text-sm">Try adjusting your search query</p>
                </div>
              )}
            </div>
          ) : (
            /* TABLE VIEW */
            <div className="overflow-x-auto shadow-xl rounded-2xl transition-all duration-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
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
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: index * 0.03 }}
                          className="border-b dark:border-slate-700 text-center hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all duration-200 group"
                        >
                    <td className="px-4 py-2 dark:text-slate-100">{ad.adId}</td>
                    <td className="px-4 py-2 dark:text-slate-100">{ad.title}</td>
                    <td className="px-4 py-2 dark:text-slate-300">{ad.category}</td>
                    <td className="px-4 py-2 dark:text-slate-300">{ad.company}</td>
                    <td className="px-4 py-2 dark:text-slate-300">{ad.budget}</td>
                    <td className="px-4 py-2 dark:text-slate-300">{ad.start}</td>
                    <td className="px-4 py-2 dark:text-slate-300">{ad.end}</td>
                    <td className="px-4 py-2">
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                          ad.status === 'Active'
                            ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg shadow-green-400/50'
                            : ad.status === 'Pending'
                            ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-lg shadow-yellow-400/50'
                            : ad.status === 'Expired'
                            ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
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
                              className="h-12 w-12 object-cover mx-auto rounded-xl shadow-md"
                            />
                          ) : (
                            <video
                              src={ad.preview}
                              className="h-12 w-12 mx-auto rounded-xl shadow-md"
                              controls
                            />
                          )}
                        </motion.div>
                      ) : (
                        <span className="text-gray-400 dark:text-slate-500">--</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleEdit(ad)}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          Edit
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => askDelete(ad)}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
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

      {/* FORM MODAL - rendered via portal to avoid overflow clipping */}
      {createPortal(
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 overflow-y-auto py-8 px-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 shadow-2xl rounded-2xl p-6 w-full max-w-3xl border border-slate-200 dark:border-slate-700 transition-all duration-300 my-auto"
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
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <X size={20} className="dark:text-slate-300" />
                </motion.button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Title</label>
                  <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 rounded-xl p-2 transition-all duration-200 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800" />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Category</label>
                  <input type="text" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 rounded-xl p-2 transition-all duration-200 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800" />
                </div>

                {/* Company */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Company</label>
                  <input type="text" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 rounded-xl p-2 transition-all duration-200 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800" />
                </div>

                {/* Budget */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Budget</label>
                  <input type="text" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 rounded-xl p-2 transition-all duration-200 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800" />
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Start Date</label>
                  <input type="date" value={formData.start} onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-xl p-2 transition-all duration-200 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800" />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">End Date</label>
                  <input type="date" value={formData.end} onChange={(e) => setFormData({ ...formData, end: e.target.value })}
                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-xl p-2 transition-all duration-200 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800" />
                </div>

                {/* Status - Dropdown */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-xl p-2 transition-all duration-200 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800">
                    <option value="">Select Status</option>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Location - City Dropdown */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Location (City)</label>
                  <select value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value, targetAreas: [] })}
                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-xl p-2 transition-all duration-200 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800">
                    <option value="">Select City</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Type</label>
                  <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-xl p-2 transition-all duration-200 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800">
                    <option>Image</option>
                    <option>Video</option>
                  </select>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 rounded-xl p-2 transition-all duration-200 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800" />
                </div>

                {/* Contact */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Contact</label>
                  <input type="text" value={formData.contact} onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 rounded-xl p-2 transition-all duration-200 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800" />
                </div>

                {/* Time Slots - Multi-select checkboxes */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Time Slots</label>
                  <div className="flex flex-wrap gap-2">
                    {TIME_SLOTS.map(slot => (
                      <motion.button
                        key={slot}
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => toggleMultiSelect('timeSlots', slot)}
                        className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all duration-200 ${
                          (formData.timeSlots || []).includes(slot)
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-400/30'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-blue-400'
                        }`}
                      >
                        {slot}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Weather Targets - Multi-select */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Weather Targets</label>
                  <div className="flex flex-wrap gap-2">
                    {WEATHER_TARGETS.map(weather => (
                      <motion.button
                        key={weather}
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => toggleMultiSelect('weatherTargets', weather)}
                        className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all duration-200 ${
                          (formData.weatherTargets || []).includes(weather)
                            ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-400/30'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-amber-400'
                        }`}
                      >
                        {weather}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Target Areas - Based on selected city */}
                {availableAreas.length > 0 && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Target Areas in {formData.location}</label>
                    <div className="flex flex-wrap gap-2">
                      {availableAreas.map(area => (
                        <motion.button
                          key={area}
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => toggleMultiSelect('targetAreas', area)}
                          className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all duration-200 ${
                            (formData.targetAreas || []).includes(area)
                              ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-400/30'
                              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-purple-400'
                          }`}
                        >
                          {area}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* File Upload */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                    Upload Attachment
                  </label>
                  <label className="flex items-center gap-2 bg-brand-900 text-white px-4 py-2 rounded-xl cursor-pointer hover:bg-brand-800 w-fit transition-all duration-200 transform hover:scale-105">
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
                          className="h-32 w-32 object-cover rounded-xl border dark:border-slate-600"
                        />
                      ) : (
                        <video
                          src={formData.preview}
                          controls
                          className="h-32 w-32 rounded-xl border dark:border-slate-600"
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
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
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
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all duration-300"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
      )}

      {/* Delete Confirmation Modal - rendered via portal */}
      {createPortal(
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
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-96 border border-slate-200 dark:border-slate-700"
            >
              <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Confirm Delete</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Are you sure you want to delete this ad? This action cannot be undone.
              </p>
              <div className="flex justify-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={confirmDelete}
                  className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Yes, Delete
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={cancelDelete}
                  className="px-6 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all duration-300"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
      )}
    </motion.div>
  );
};

export default Ads;
