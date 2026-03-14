// src/components/Campaigns/CampaignWizard/Index.jsx
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import Step1Basic from "./Step1Basic";
import Step2AssignAds from "./Step2AssignAds";
import Step3AssignVehicles from "./Step3AssignVehicles";
import Step4Review from "./Step4Review";
import ProgressBar from "../../ProgressBar";
import CloseButton from "../../ui/CloseButton";
import { db } from "../../../firebase";
import {
  addDoc,
  collection,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import runAiNow from "../../../services/scheduler";
import { logCampaignCreated, logCampaignUpdated } from "../../../services/activityLogger";
import { useAuth } from "../../../contexts/AuthContext";

/**
 * Custom Modal for notifications
 */
function NotifyModal({ open, title, message, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full border border-gray-200 dark:border-slate-700 overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
              <CloseButton onClick={onClose} size="sm" />
            </div>
            <div className="px-6 py-6 text-center">
              <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all duration-200 font-semibold shadow-lg shadow-blue-500/30"
              >
                OK
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const STEPS = [
  "Basic Details",
  "Assign Ads",
  "Assign Vehicles",
  "Review & Submit",
];

const emptyForm = {
  name: "",
  cities: [],
  startDate: "",
  endDate: "",
  weekdays: {
    mon: false,
    tue: false,
    wed: false,
    thu: false,
    fri: false,
    sat: false,
    sun: false,
  },
  timeSlots: [],
  budget: "",
  notes: "",
  ads: [],
  vehicles: [],
};

export default function CampaignWizard() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const { currentUser } = useAuth();

  const [notify, setNotify] = useState({
    open: false,
    title: "",
    message: "",
  });

  // Listen to custom events from CampaignList
  useEffect(() => {
    const handleOpen = () => {
      setEditing(null);
      setForm(emptyForm);
      setStep(0);
      setOpen(true);
    };

    const handleEdit = (e) => {
      try {
        const c = e.detail;
        setEditing(c);
        setForm({
          name: c.name || "",
          cities: c.cities || [],
          startDate: c.startDate ? c.startDate.slice(0, 10) : "",
          endDate: c.endDate ? c.endDate.slice(0, 10) : "",
          weekdays: c.weekdays || { mon: false, tue: false, wed: false, thu: false, fri: false, sat: false, sun: false },
          timeSlots: c.timeSlots || [],
          budget: c.budget || "",
          notes: c.notes || "",
          ads: c.ads || [],
          vehicles: c.vehicles || [],
        });
        setStep(0);
        setOpen(true);
      } catch (err) {
        console.warn("Invalid campaign:edit payload", err);
      }
    };

    window.addEventListener("campaign:open", handleOpen);
    window.addEventListener("campaign:edit", handleEdit);
    return () => {
      window.removeEventListener("campaign:open", handleOpen);
      window.removeEventListener("campaign:edit", handleEdit);
    };
  }, []);

  const canNext = useMemo(() => {
    if (step === 0) return form.name && form.startDate && form.endDate;
    if (step === 1) return form.ads.length > 0;
    if (step === 2) return form.vehicles.length > 0;
    return true;
  }, [step, form]);

  const onNext = () => {
    if (!canNext) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const onBack = () => setStep((s) => Math.max(s - 1, 0));

  const onCancel = () => {
    setOpen(false);
    setEditing(null);
    setStep(0);
    setForm(emptyForm);
  };

  const onSubmit = async () => {
    setLoading(true);
    const userName = currentUser?.displayName || currentUser?.username || 'Admin';
    
    try {
      const payload = {
        name: form.name,
        cities: form.cities,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        weekdays: form.weekdays,
        timeSlots: form.timeSlots,
        budget: form.budget,
        notes: form.notes,
        ads: form.ads,
        vehicles: form.vehicles,
        mode: "manual",
        createdAt: serverTimestamp(),
      };

      let campaignId;
      if (editing && editing.id) {
        await updateDoc(doc(db, "campaigns", editing.id), payload);
        campaignId = editing.id;
        // Log the update activity
        await logCampaignUpdated({ ...payload, id: editing.id }, userName);
      } else {
        const docRef = await addDoc(collection(db, "campaigns"), payload);
        campaignId = docRef.id;
        // Log the create activity
        await logCampaignCreated({ ...payload, id: docRef.id }, userName);
      }

      // ✅ Assign ads to each selected vehicle for instant playback
      const assignedAdsData = form.ads.map(adId => ({
        adId: adId,
        startTime: new Date(form.startDate).toISOString(),
        endTime: new Date(form.endDate).toISOString(),
        campaignId: campaignId,
        assignedAt: new Date().toISOString()
      }));

      // Update each vehicle with the assigned ads
      for (const vehicleId of form.vehicles) {
        try {
          await updateDoc(doc(db, "vehicles", vehicleId), {
            assignedAds: assignedAdsData,
            campaignId: campaignId,
            lastAssignmentUpdate: serverTimestamp()
          });
          console.log(`✅ Assigned ads to vehicle ${vehicleId}`);
        } catch (err) {
          console.error(`Failed to assign ads to vehicle ${vehicleId}:`, err);
        }
      }

      await runAiNow();

      setLoading(false);
      setOpen(false);
      setEditing(null);
      setStep(0);
      setForm(emptyForm);

      // ✅ Show custom modal instead of alert
      setNotify({
        open: true,
        title: "Success",
        message: "Campaign saved and ads assigned to vehicles!",
      });
    } catch (err) {
      console.error(err);
      setLoading(false);
      setNotify({
        open: true,
        title: "Error",
        message: "Failed to save campaign. Please try again.",
      });
    }
  };

  // Use portal to render modals at document.body level, avoiding overflow/transform clipping
  return createPortal(
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center p-4 md:p-6 overflow-auto bg-black/60 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && onCancel()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl border border-gray-200 dark:border-slate-700 overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white dark:from-slate-800 dark:to-slate-900">
                <div className="flex items-center gap-4">
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {editing ? "Edit Campaign" : "Create Campaign"}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 font-medium px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    {STEPS[step]}
                  </div>
                </div>
                <CloseButton onClick={onCancel} />
              </div>

              <div className="px-6 py-6">
                <ProgressBar steps={STEPS} current={step} />
                <div className="mt-6">
                  {step === 0 && <Step1Basic form={form} setForm={setForm} />}
                  {step === 1 && <Step2AssignAds form={form} setForm={setForm} />}
                  {step === 2 && (
                    <Step3AssignVehicles form={form} setForm={setForm} />
                  )}
                  {step === 3 && <Step4Review form={form} setForm={setForm} />}
                </div>
              </div>

              <div className="px-6 py-5 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between bg-gray-50 dark:bg-slate-900/50">
                <div>
                  {step > 0 && (
                    <button
                      onClick={onBack}
                      className="px-5 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200 font-medium"
                    >
                      Back
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {step < STEPS.length - 1 && (
                    <button
                      onClick={onNext}
                      disabled={!canNext}
                      className={`px-5 py-2.5 rounded-lg transition-all duration-200 font-semibold ${
                        canNext
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30"
                          : "bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      Next
                    </button>
                  )}
                  {step === STEPS.length - 1 && (
                    <button
                      onClick={onSubmit}
                      disabled={loading}
                      className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all duration-200 font-semibold shadow-lg shadow-green-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? "Saving..." : "Submit"}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification modal */}
      <NotifyModal
        open={notify.open}
        title={notify.title}
        message={notify.message}
        onClose={() => setNotify({ open: false, title: "", message: "" })}
      />
    </>,
    document.body
  );
}
