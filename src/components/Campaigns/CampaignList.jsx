// src/components/Campaigns/CampaignList.jsx
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PlusCircle, Pencil, Trash2, PlayCircle, Rocket } from "lucide-react";
import { db } from "../../firebase";
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  query,
  orderBy,
  updateDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import runAiNow from "../../services/scheduler";
import { logCampaignDeleted } from "../../services/activityLogger";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { SkeletonTable } from "../ui/SkeletonLoader";
import { EmptyCampaigns } from "../ui/EmptyState";

/**
 * Enhanced Custom Modal Component with animations
 */
function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-700"
          >
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">{title}</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">{message}</p>
            <div className="flex justify-end gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onCancel}
                className="px-6 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onConfirm}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-lg shadow-blue-500/50 hover:shadow-xl transition-all duration-300"
              >
                Confirm
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/**
 * CampaignList shows campaigns + add/edit/delete + run AI
 */
export default function CampaignList() {
  const toast = useToast();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  const [modal, setModal] = useState({
    open: false,
    type: null, // "delete" | "ai"
    campaign: null,
  });

  useEffect(() => {
    const q = query(collection(db, "campaigns"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setCampaigns(items);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleDelete = async (c) => {
    setModal({ open: true, type: "delete", campaign: c });
  };

  const confirmDelete = async () => {
    const c = modal.campaign;
    const userName = currentUser?.displayName || currentUser?.username || 'Admin';
    try {
      await deleteDoc(doc(db, "campaigns", c.id));
      // Log the delete activity
      await logCampaignDeleted(c, userName);
      await runAiNow(); // re-run AI after delete
      toast.success('Campaign deleted successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete campaign. Please try again.');
    } finally {
      setModal({ open: false, type: null, campaign: null });
    }
  };

  const handleRunAi = () => {
    setModal({ open: true, type: "ai", campaign: null });
  };

  const confirmRunAi = async () => {
    try {
      setLoading(true);
      await runAiNow();
      toast.success('AI Scheduler executed successfully!');
    } catch (err) {
      console.error(err);
      toast.error('AI Scheduler failed. Please try again.');
    } finally {
      setLoading(false);
      setModal({ open: false, type: null, campaign: null });
    }
  };

  const onEdit = (c) => {
    window.dispatchEvent(new CustomEvent("campaign:edit", { detail: c }));
  };

  const onAddCampaign = () => {
    window.dispatchEvent(new CustomEvent("campaign:open"));
  };

  // ✅ Play Now - Instantly assign ads to all vehicles in the campaign
  const handlePlayNow = async (campaign) => {
    if (!campaign.vehicles?.length || !campaign.ads?.length) {
      toast.error('Campaign has no vehicles or ads assigned!');
      return;
    }

    try {
      setLoading(true);
      
      // Create assigned ads data
      const assignedAdsData = campaign.ads.map(adId => ({
        adId: adId,
        startTime: campaign.startDate || new Date().toISOString(),
        endTime: campaign.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        campaignId: campaign.id,
        assignedAt: new Date().toISOString()
      }));

      // Update each vehicle with the assigned ads
      let successCount = 0;
      for (const vehicleId of campaign.vehicles) {
        try {
          await updateDoc(doc(db, "vehicles", vehicleId), {
            assignedAds: assignedAdsData,
            campaignId: campaign.id,
            lastAssignmentUpdate: serverTimestamp()
          });
          successCount++;
          console.log(`✅ Pushed ads to vehicle ${vehicleId}`);
        } catch (err) {
          console.error(`Failed to push ads to vehicle ${vehicleId}:`, err);
        }
      }

      if (successCount > 0) {
        toast.success(`🚀 Ads pushed to ${successCount} vehicle(s)! They will start playing immediately.`);
      } else {
        toast.error('Failed to push ads to vehicles.');
      }
    } catch (err) {
      console.error('Error pushing ads:', err);
      toast.error('Failed to push ads. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 transition-colors duration-300"
    >
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-gradient-to-r from-brand-900 to-brand-800 text-white rounded-t-xl">
        <div>
          <div className="text-lg font-bold text-white">Manual Campaigns</div>
          <div className="text-sm text-white/80">
            Priority schedules that AI will not override
          </div>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAddCampaign}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border border-white/30"
          >
            <PlusCircle size={18} /> Add Campaign
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRunAi}
            disabled={loading}
            className={`flex items-center gap-2 border-2 border-white/30 hover:border-white/50 backdrop-blur-sm text-white px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
              loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/20'
            }`}
            title="Run AI Scheduler now"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Running...
              </>
            ) : (
              <>
                <PlayCircle size={18} /> Run AI
              </>
            )}
          </motion.button>
        </div>
      </div>

      <div className="p-4 overflow-x-auto">
        {loading && campaigns.length === 0 ? (
          <SkeletonTable rows={5} cols={9} />
        ) : campaigns.length === 0 ? (
          <EmptyCampaigns onAdd={onAddCampaign} />
        ) : (
          <div className="overflow-x-auto rounded-lg shadow-inner bg-slate-50 dark:bg-slate-900/50">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-brand-900 to-brand-800 text-white">
                <tr>
                  <th className="p-3 text-left font-semibold">Campaign ID</th>
                  <th className="p-3 text-left font-semibold">Title</th>
                  <th className="p-3 text-center font-semibold">Cities</th>
                  <th className="p-3 text-center font-semibold">Start Date</th>
                  <th className="p-3 text-center font-semibold">End Date</th>
                  <th className="p-3 text-center font-semibold">Status</th>
                  <th className="p-3 text-center font-semibold">Vehicles</th>
                  <th className="p-3 text-center font-semibold">Budget</th>
                  <th className="p-3 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {campaigns.map((c, index) => {
                const start = c.startDate
                  ? new Date(c.startDate).toLocaleDateString()
                  : "—";
                const end = c.endDate
                  ? new Date(c.endDate).toLocaleDateString()
                  : "—";
                const status = (() => {
                  const now = Date.now();
                  const s = c.startDate ? new Date(c.startDate).getTime() : 0;
                  const e = c.endDate ? new Date(c.endDate).getTime() : 0;
                  if (s <= now && now <= e) return "Active";
                  if (now < s) return "Upcoming";
                  return "Ended";
                })();
                    return (
                      <motion.tr
                        key={c.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all duration-200 group"
                      >
                        <td className="p-3 dark:text-slate-100 font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {c.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="p-3 dark:text-slate-100 font-medium">{c.name}</td>
                        <td className="p-3 text-center dark:text-slate-100">
                          {(c.cities || []).join(", ") || "All"}
                        </td>
                        <td className="p-3 text-center dark:text-slate-100">{start}</td>
                        <td className="p-3 text-center dark:text-slate-100">{end}</td>
                        <td className="p-3 text-center">
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.03 + 0.2 }}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                              status === 'Active'
                                ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg shadow-green-400/50'
                                : status === 'Upcoming'
                                ? 'bg-gradient-to-r from-blue-400 to-cyan-500 text-white shadow-lg shadow-blue-400/50'
                                : 'bg-gradient-to-r from-red-400 to-rose-500 text-white shadow-lg shadow-red-400/50'
                            }`}
                          >
                            <motion.span
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="w-2 h-2 bg-white rounded-full"
                            />
                            {status}
                          </motion.span>
                        </td>
                        <td className="p-3 text-center dark:text-slate-100 font-semibold">
                          {(c.vehicles || []).length || 0}
                        </td>
                        <td className="p-3 text-center dark:text-slate-100">{c.budget || "—"}</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handlePlayNow(c)}
                              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                              title="Push ads to vehicles now"
                            >
                              <Rocket size={16} className="inline mr-1" />
                              Play
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => onEdit(c)}
                              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                            >
                              Edit
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleDelete(c)}
                              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                            >
                              Delete
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ✅ Custom modal for delete + AI confirm */}
      <ConfirmModal
        open={modal.open}
        title={
          modal.type === "delete"
            ? "Delete Campaign"
            : "Run AI Scheduler"
        }
        message={
          modal.type === "delete"
            ? `Are you sure you want to delete campaign "${modal.campaign?.name}"?`
            : "Do you want to run the AI Scheduler now?"
        }
        onConfirm={modal.type === "delete" ? confirmDelete : confirmRunAi}
        onCancel={() => setModal({ open: false, type: null, campaign: null })}
      />
    </motion.div>
  );
}
