import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import VehicleList from "../components/VehicleList";
import StepIndicator from "../components/VehicleWizard/StepIndicator";
import Step1Basic from "../components/VehicleWizard/Step1Basic";
import Step2OwnerBank from "../components/VehicleWizard/Step2OwnerBank";
import Step3Documents from "../components/VehicleWizard/Step3Documents";
import ConfirmDeleteDialog from "../components/ConfirmDeleteDialog";
import { generateCarId } from "../lib/id";
import { validateStep1, validateStep2, validateStep3 } from "../lib/validation";
import { useToast } from "../contexts/ToastContext";
import { useAuth } from "../contexts/AuthContext";
import { logVehicleDeleted, logVehicleCreated, logVehicleUpdated } from "../services/activityLogger";
import { Truck, CheckCircle, XCircle, Wrench } from "lucide-react";

// Firebase
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

// Status count bar component
const StatusCountBar = ({ vehicles }) => {
  const activeCount = vehicles.filter(v => v.status === 'Active').length;
  const inactiveCount = vehicles.filter(v => v.status === 'Inactive').length;
  const maintenanceCount = vehicles.filter(v => v.status === 'Maintenance').length;

  const counts = [
    { label: 'Active', count: activeCount, icon: CheckCircle, gradient: 'from-emerald-500 via-emerald-600 to-teal-700', glow: 'shadow-emerald-500/30', accent: 'from-emerald-300 to-teal-300', iconBg: 'bg-emerald-400/20 border-emerald-300/20', line: 'from-teal-400 via-emerald-400 to-green-400' },
    { label: 'Inactive', count: inactiveCount, icon: XCircle, gradient: 'from-rose-500 via-red-600 to-rose-700', glow: 'shadow-rose-500/30', accent: 'from-rose-300 to-pink-300', iconBg: 'bg-rose-400/20 border-rose-300/20', line: 'from-pink-400 via-rose-400 to-red-400' },
    { label: 'Maintenance', count: maintenanceCount, icon: Wrench, gradient: 'from-amber-500 via-orange-600 to-amber-700', glow: 'shadow-amber-500/30', accent: 'from-amber-300 to-orange-300', iconBg: 'bg-amber-400/20 border-amber-300/20', line: 'from-yellow-400 via-amber-400 to-orange-400' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      className="grid grid-cols-3 gap-4 mb-6"
    >
      {counts.map((item, index) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.25 } }}
            whileTap={{ scale: 0.98 }}
            className={`group relative flex items-center gap-3 p-5 rounded-2xl bg-gradient-to-br ${item.gradient} text-white shadow-xl ${item.glow} border border-white/10 overflow-hidden cursor-default`}
          >
            {/* Shimmer sweep */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            {/* Corner accent */}
            <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl ${item.accent} opacity-10 rounded-bl-full group-hover:opacity-20 transition-opacity duration-300`} />
            <motion.div
              className={`relative z-10 w-11 h-11 rounded-xl ${item.iconBg} border backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-all duration-300`}
              whileHover={{ rotate: 5 }}
            >
              <Icon className="w-5 h-5 text-white" />
            </motion.div>
            <div className="relative z-10">
              <p className="text-2xl font-bold text-white counter-value">{item.count}</p>
              <p className="text-xs text-white/70 font-semibold tracking-wider uppercase">{item.label}</p>
            </div>
            {/* Bottom accent line */}
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${item.line}`}>
              <motion.div
                className="h-full w-1/3 bg-white/30 rounded-full"
                animate={{ x: ['0%', '200%', '0%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

const Vehicles = () => {
  const toast = useToast();
  const { currentUser } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [mode, setMode] = useState("list");
  const [currentStep, setCurrentStep] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [askDeleteId, setAskDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [carId, setCarId] = useState("");
  const [step1, setStep1] = useState({
    type: "",
    vehicleName: "",
    ownerName: "",
    model: "",
    color: "",
    cnic: "",
    duration: "",
    registrationDate: "",
    password: "",
    contractRate: "",
    requiredHoursPerDay: "",
  });
  const [step2, setStep2] = useState({
    firstName: "",
    lastName: "",
    cnic: "",
    email: "",
    accountTitle: "",
    accountNo: "",
    iban: "",
    bankName: "",
  });
  const [step3, setStep3] = useState({
    cnicFrontFile: null,
    cnicBackFile: null,
    regDocFile: null,
    cnicFrontName: "",
    cnicBackName: "",
    regDocName: "",
  });

  // Fetch vehicles from Firestore
  useEffect(() => {
    let isActive = true;
    let retryCount = 0;

    const setupListener = () => {
      if (!isActive) return;

      try {
        const unsub = onSnapshot(collection(db, "vehicles"), (snapshot) => {
          if (!isActive) return;
          const vehiclesList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setVehicles(vehiclesList);
          retryCount = 0;
        }, (error) => {
          if (!isActive) return;

          if (error.code === 'internal' || error.message?.includes('ASSERTION')) {
            if (retryCount < 2) {
              retryCount++;
              setTimeout(setupListener, 500 * retryCount);
            }
          } else {
            console.error('Vehicles Page: Error fetching vehicles:', error);
          }
        });

        return () => {
          isActive = false;
          unsub();
        };
      } catch (err) {
        console.error('Failed to set up vehicles listener:', err);
        if (retryCount < 2) {
          retryCount++;
          setTimeout(setupListener, 500 * retryCount);
        }
      }
    };

    const cleanup = setupListener();
    return cleanup;
  }, []);

  const stepValid = useMemo(() => {
    if (currentStep === 1) return validateStep1(step1);
    if (currentStep === 2) return validateStep2(step2);
    if (currentStep === 3) return validateStep3(step3);
    return false;
  }, [currentStep, step1, step2, step3]);

  const startAdd = () => {
    setMode("wizard");
    setCurrentStep(1);
    setEditingId(null);
    setCarId(generateCarId(vehicles));
    setStep1({ type: "", vehicleName: "", ownerName: "", model: "", color: "", cnic: "", duration: "", registrationDate: "", password: "", contractRate: "", requiredHoursPerDay: "" });
    setStep2({ firstName: "", lastName: "", cnic: "", email: "", accountTitle: "", accountNo: "", iban: "", bankName: "" });
    setStep3({ cnicFrontFile: null, cnicBackFile: null, regDocFile: null, cnicFrontName: "", cnicBackName: "", regDocName: "" });
  };

  const startEdit = (v) => {
    setMode("wizard");
    setCurrentStep(1);
    setEditingId(v.id);
    setCarId(v.carId);
    setStep1({
      type: v.type, vehicleName: v.vehicleName, ownerName: v.ownerName, model: v.model,
      color: v.color, cnic: v.cnic, duration: v.duration, registrationDate: v.registrationDate, password: v.password || "",
      contractRate: v.contractRate || "", requiredHoursPerDay: v.requiredHoursPerDay || "",
    });
    setStep2({
      firstName: v.owner.firstName, lastName: v.owner.lastName, cnic: v.owner.cnic, email: v.owner.email,
      accountTitle: v.bank.accountTitle, accountNo: v.bank.accountNo, iban: v.bank.iban, bankName: v.bank.bankName,
    });
    setStep3({
      cnicFrontFile: null, cnicBackFile: null, regDocFile: null,
      cnicFrontName: v.docs.cnicFrontName || "", cnicBackName: v.docs.cnicBackName || "", regDocName: v.docs.regDocName || "",
    });
  };

  const cancelWizard = () => {
    setMode("list");
    setEditingId(null);
    setCurrentStep(1);
  };

  const next = () => stepValid && setCurrentStep((s) => Math.min(3, s + 1));
  const back = () => setCurrentStep((s) => Math.max(1, s - 1));

  // Convert a File to base64 string
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      if (!file) { resolve(null); return; }
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Save to Firestore
  const saveWizard = async () => {
    if (!validateStep1(step1) || !validateStep2(step2) || !validateStep3(step3)) {
      toast.warning('Please fill in all required fields');
      return;
    }

    setSaving(true);

    try {
      // Convert document files to base64
      const [cnicFrontBase64, cnicBackBase64, regDocBase64] = await Promise.all([
        fileToBase64(step3.cnicFrontFile),
        fileToBase64(step3.cnicBackFile),
        fileToBase64(step3.regDocFile),
      ]);

      const record = {
        carId, type: step1.type, vehicleName: step1.vehicleName, ownerName: step1.ownerName,
        model: step1.model, color: step1.color, cnic: step1.cnic, duration: step1.duration,
        registrationDate: step1.registrationDate, password: step1.password,
        contractRate: parseInt(step1.contractRate) || 0, requiredHoursPerDay: parseInt(step1.requiredHoursPerDay) || 8,
        status: "Active",
        owner: { firstName: step2.firstName, lastName: step2.lastName, cnic: step2.cnic, email: step2.email },
        bank: { accountTitle: step2.accountTitle, accountNo: step2.accountNo, iban: step2.iban, bankName: step2.bankName },
        docs: {
          cnicFrontName: step3.cnicFrontName, cnicBackName: step3.cnicBackName, regDocName: step3.regDocName,
          ...(cnicFrontBase64 && { cnicFrontData: cnicFrontBase64 }),
          ...(cnicBackBase64 && { cnicBackData: cnicBackBase64 }),
          ...(regDocBase64 && { regDocData: regDocBase64 }),
        },
      };

      const userName = currentUser?.displayName || currentUser?.username || 'Admin';

      if (editingId) {
        const vehicleRef = doc(db, "vehicles", editingId);
        await updateDoc(vehicleRef, record);
        logVehicleUpdated(record, userName).catch(() => {});
        toast.success('Vehicle updated successfully!');
      } else {
        const vehiclesCollection = collection(db, "vehicles");
        await addDoc(vehiclesCollection, record);
        logVehicleCreated(record, userName).catch(() => {});
        toast.success('Vehicle added successfully!');
      }

      cancelWizard();
    } catch (error) {
      console.error('Vehicles: Error saving vehicle:', error);

      if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
        toast.error('Firestore connection error. Please check your internet connection.');
      } else if (error.code === 'permission-denied') {
        toast.error('Permission denied. Check Firestore security rules.');
      } else {
        toast.error(`Failed to save vehicle: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setSaving(false);
    }
  };

  // Delete from Firestore
  const doDelete = async () => {
    if (askDeleteId) {
      try {
        let docId = askDeleteId;
        const vehicle = vehicles.find(v => v.id === askDeleteId || v.carId === askDeleteId);

        if (!vehicle) {
          toast.error('Vehicle not found. Please refresh and try again.');
          return;
        }

        if (vehicle.id) docId = vehicle.id;

        if (docId) {
          const vehicleData = {
            carId: vehicle.carId || vehicle.id,
            vehicleName: vehicle.vehicleName || vehicle.type || 'Unknown',
            ownerName: vehicle.ownerName || vehicle.owner?.firstName || 'Unknown',
          };

          const userName = currentUser?.displayName || currentUser?.username || 'Admin';

          await deleteDoc(doc(db, "vehicles", docId));

          try {
            await logVehicleDeleted(vehicleData, userName);
          } catch (logError) {
            console.error('Error logging vehicle deletion:', logError);
          }

          toast.success('Vehicle deleted successfully!');
          setAskDeleteId(null);
        }
      } catch (error) {
        console.error('Error deleting vehicle:', error);
        if (error.code === 'permission-denied') {
          toast.error('Permission denied. Check Firestore security rules.');
        } else {
          toast.error(`Failed to delete vehicle: ${error.message}`);
        }
      }
    }
  };

  const handleChat = async (vehicle) => {
    const currentUserId = currentUser?.uid;
    if (!currentUserId) return;

    try {
      // Check for existing conversation
      const q = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', currentUserId)
      );
      const snap = await getDocs(q);
      const existing = snap.docs.find(d => {
        const data = d.data();
        return data.participants?.includes(vehicle.id);
      });

      if (existing) {
        toast.info(`Chat with ${vehicle.ownerName || vehicle.vehicleName} is available in the messaging widget`);
        return;
      }

      // Create new conversation
      await addDoc(collection(db, 'conversations'), {
        participants: [currentUserId, vehicle.id],
        participantNames: {
          [currentUserId]: currentUser.displayName || currentUser.username || 'Admin',
          [vehicle.id]: `${vehicle.ownerName || 'Driver'} (${vehicle.carId || vehicle.id})`,
        },
        participantType: 'driver',
        lastMessage: null,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        unreadCount: { [currentUserId]: 0, [vehicle.id]: 0 },
      });
      toast.success(`Chat started with ${vehicle.ownerName || vehicle.vehicleName}! Open the messaging widget.`);
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error('Failed to start chat. Please try again.');
    }
  };

  if (mode === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6"
      >
        {/* Status Count Bar */}
        <StatusCountBar vehicles={vehicles} />

        <VehicleList
          vehicles={vehicles}
          onAdd={startAdd}
          onEdit={startEdit}
          onAskDelete={setAskDeleteId}
          onChat={handleChat}
        />
        <ConfirmDeleteDialog
          open={!!askDeleteId}
          onCancel={() => setAskDeleteId(null)}
          onConfirm={doDelete}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 rounded-2xl border border-slate-200 shadow-xl p-6 transition-colors duration-300"
      >
        <div className="flex items-center justify-between mb-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xl font-bold text-slate-800 dark:text-slate-100"
          >
            {editingId ? "Edit Vehicle" : "Add Vehicle"}
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={cancelWizard}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </motion.button>
        </div>

        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Step {currentStep} of 3
            </span>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {Math.round((currentStep / 3) * 100)}%
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / 3) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
            />
          </div>
        </div>

        <StepIndicator current={currentStep} />

        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-4"
        >
          {currentStep === 1 && (
            <Step1Basic carId={carId} data={step1} onChange={(partial) => setStep1((s) => ({ ...s, ...partial }))} />
          )}
          {currentStep === 2 && (
            <Step2OwnerBank data={step2} onChange={(partial) => setStep2((s) => ({ ...s, ...partial }))} />
          )}
          {currentStep === 3 && (
            <Step3Documents data={step3} onChange={(partial) => setStep3((s) => ({ ...s, ...partial }))} />
          )}
        </motion.div>

        <div className="mt-6 flex justify-between">
          <motion.button
            whileHover={currentStep !== 1 ? { scale: 1.02 } : {}}
            whileTap={currentStep !== 1 ? { scale: 0.98 } : {}}
            onClick={back}
            disabled={currentStep === 1}
            className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
              currentStep === 1
                ? "bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
                : "bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-slate-500"
            }`}
          >
            Back
          </motion.button>
          {currentStep < 3 ? (
            <motion.button
              whileHover={stepValid ? { scale: 1.02 } : {}}
              whileTap={stepValid ? { scale: 0.98 } : {}}
              onClick={next}
              disabled={!stepValid}
              className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                stepValid
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/50"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
              }`}
            >
              Next
            </motion.button>
          ) : (
            <motion.button
              whileHover={stepValid && !saving ? { scale: 1.02 } : {}}
              whileTap={stepValid && !saving ? { scale: 0.98 } : {}}
              onClick={saveWizard}
              disabled={!stepValid || saving}
              className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                stepValid && !saving
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/50"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
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
                'Save'
              )}
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Vehicles;
