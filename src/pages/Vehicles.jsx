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

// 🔹 Firebase
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";

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

  // 🔹 Fetch vehicles from Firestore
  useEffect(() => {
    console.log('🔥 Vehicles Page: Starting Firebase listener for vehicles collection...')
    const unsub = onSnapshot(collection(db, "vehicles"), (snapshot) => {
      const vehiclesList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      console.log('✅ Vehicles Page: Fetched', vehiclesList.length, 'vehicles from Firebase', vehiclesList)
      setVehicles(vehiclesList);
    }, (error) => {
      console.error('❌ Vehicles Page: Error fetching vehicles:', error);
      console.error('Error code:', error.code, 'Message:', error.message);
    });
    return () => unsub();
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
    setStep1({
      type: "",
      vehicleName: "",
      ownerName: "",
      model: "",
      color: "",
      cnic: "",
      duration: "",
      registrationDate: "",
      password: "",
    });
    setStep2({
      firstName: "",
      lastName: "",
      cnic: "",
      email: "",
      accountTitle: "",
      accountNo: "",
      iban: "",
      bankName: "",
    });
    setStep3({
      cnicFrontFile: null,
      cnicBackFile: null,
      regDocFile: null,
      cnicFrontName: "",
      cnicBackName: "",
      regDocName: "",
    });
  };

  const startEdit = (v) => {
    setMode("wizard");
    setCurrentStep(1);
    setEditingId(v.id);
    setCarId(v.carId);
    setStep1({
      type: v.type,
      vehicleName: v.vehicleName,
      ownerName: v.ownerName,
      model: v.model,
      color: v.color,
      cnic: v.cnic,
      duration: v.duration,
      registrationDate: v.registrationDate,
      password: v.password || "",
    });
    setStep2({
      firstName: v.owner.firstName,
      lastName: v.owner.lastName,
      cnic: v.owner.cnic,
      email: v.owner.email,
      accountTitle: v.bank.accountTitle,
      accountNo: v.bank.accountNo,
      iban: v.bank.iban,
      bankName: v.bank.bankName,
    });
    setStep3({
      cnicFrontFile: null,
      cnicBackFile: null,
      regDocFile: null,
      cnicFrontName: v.docs.cnicFrontName || "",
      cnicBackName: v.docs.cnicBackName || "",
      regDocName: v.docs.regDocName || "",
    });
  };

  const cancelWizard = () => {
    setMode("list");
    setEditingId(null);
    setCurrentStep(1);
  };

  const next = () => stepValid && setCurrentStep((s) => Math.min(3, s + 1));
  const back = () => setCurrentStep((s) => Math.max(1, s - 1));

  // 🔹 Save to Firestore
  const saveWizard = async () => {
    if (!validateStep1(step1) || !validateStep2(step2) || !validateStep3(step3)) {
      toast.warning('Please fill in all required fields');
      return;
    }

    setSaving(true);
    console.log('🔥 Vehicles: Starting save operation...');
    
    try {
      const record = {
        carId,
        type: step1.type,
        vehicleName: step1.vehicleName,
        ownerName: step1.ownerName,
        model: step1.model,
        color: step1.color,
        cnic: step1.cnic,
        duration: step1.duration,
        registrationDate: step1.registrationDate,
        password: step1.password,
        status: "Active",
        owner: {
          firstName: step2.firstName,
          lastName: step2.lastName,
          cnic: step2.cnic,
          email: step2.email,
        },
        bank: {
          accountTitle: step2.accountTitle,
          accountNo: step2.accountNo,
          iban: step2.iban,
          bankName: step2.bankName,
        },
        docs: {
          cnicFrontName: step3.cnicFrontName,
          cnicBackName: step3.cnicBackName,
          regDocName: step3.regDocName,
        },
      };

      console.log('📝 Vehicles: Record to save:', record);

      // Get current user name for logging
      const userName = currentUser?.displayName || currentUser?.username || 'Admin';

      if (editingId) {
        // Update existing vehicle
        console.log('🔄 Vehicles: Updating vehicle with ID:', editingId);
        const vehicleRef = doc(db, "vehicles", editingId);
        await updateDoc(vehicleRef, record);
        console.log('✅ Vehicles: Vehicle updated successfully in Firestore');
        
        // Log the update activity (don't block on this)
        logVehicleUpdated(record, userName).catch(logError => {
          console.error('⚠️ Error logging vehicle update:', logError);
          // Don't show error toast for logging failures
        });
        
        toast.success('Vehicle updated successfully!');
      } else {
        // Create new vehicle
        console.log('➕ Vehicles: Creating new vehicle...');
        const vehiclesCollection = collection(db, "vehicles");
        const docRef = await addDoc(vehiclesCollection, record);
        console.log('✅ Vehicles: Vehicle created successfully in Firestore with ID:', docRef.id);
        
        // Log the creation activity (don't block on this)
        logVehicleCreated(record, userName).catch(logError => {
          console.error('⚠️ Error logging vehicle creation:', logError);
          // Don't show error toast for logging failures
        });
        
        toast.success('Vehicle added successfully!');
      }

      cancelWizard();
    } catch (error) {
      console.error('❌ Vehicles: Error saving vehicle:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      
      // Check if it's a Firestore connection error
      if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
        toast.error('Firestore connection error. Please check your internet connection and Firebase configuration.');
      } else if (error.code === 'permission-denied') {
        toast.error('Permission denied. Check Firestore security rules. Make sure you have write access to the "vehicles" collection.');
      } else if (error.code === 'failed-precondition') {
        toast.error('Firestore operation failed. The document may have been modified. Please refresh and try again.');
      } else {
        toast.error(`Failed to save vehicle: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setSaving(false);
      console.log('🏁 Vehicles: Save operation completed');
    }
  };

  // 🔹 Delete from Firestore
  const doDelete = async () => {
    if (askDeleteId) {
      try {
        // Find the vehicle document ID by carId if askDeleteId is a carId
        let docId = askDeleteId;
        const vehicle = vehicles.find(v => v.id === askDeleteId || v.carId === askDeleteId);
        
        if (!vehicle) {
          toast.error('Vehicle not found. Please refresh and try again.');
          return;
        }
        
        if (vehicle.id) {
          docId = vehicle.id; // Use the Firestore document ID
        }
        
        if (docId) {
          // Get vehicle data before deleting for logging
          const vehicleData = {
            carId: vehicle.carId || vehicle.id,
            vehicleName: vehicle.vehicleName || vehicle.type || 'Unknown',
            ownerName: vehicle.ownerName || vehicle.owner?.firstName || 'Unknown',
          };
          
          // Get current user name for logging
          const userName = currentUser?.displayName || currentUser?.username || 'Admin';
          
          // Delete the vehicle from Firestore
          await deleteDoc(doc(db, "vehicles", docId));
          
          // Log the deletion activity
          try {
            await logVehicleDeleted(vehicleData, userName);
            console.log('✅ Vehicle deletion logged to activityLogs');
          } catch (logError) {
            console.error('⚠️ Error logging vehicle deletion:', logError);
            // Don't fail the delete if logging fails, but show warning
            toast.error('Vehicle deleted but activity log failed. Check Firestore connection.');
          }
          
          toast.success('Vehicle deleted successfully!');
          setAskDeleteId(null);
        } else {
          toast.error('Vehicle document ID not found. Please refresh and try again.');
        }
      } catch (error) {
        console.error('❌ Error deleting vehicle:', error);
        
        // Check if it's a Firestore connection error
        if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
          toast.error('Firestore connection error. Please check your internet connection and Firebase configuration.');
        } else if (error.code === 'permission-denied') {
          toast.error('Permission denied. Check Firestore security rules.');
        } else {
          toast.error(`Failed to delete vehicle: ${error.message}`);
        }
      }
    }
  };

  if (mode === "list") {
    return (
      <>
        <VehicleList
          vehicles={vehicles}
          onAdd={startAdd}
          onEdit={startEdit}
          onAskDelete={setAskDeleteId}
        />
        <ConfirmDeleteDialog
          open={!!askDeleteId}
          onCancel={() => setAskDeleteId(null)}
          onConfirm={doDelete}
        />
      </>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6"
    >
      <div className="bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 rounded-xl border border-slate-200 shadow-lg p-6 transition-colors duration-300">
        <div className="flex items-center justify-between mb-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xl font-bold text-slate-800 dark:text-slate-100"
          >
            {editingId ? "Edit Vehicle" : "Add Vehicle"}
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={cancelWizard}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
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

        <div className="mt-4">
          {currentStep === 1 && (
            <Step1Basic
              carId={carId}
              data={step1}
              onChange={(partial) => setStep1((s) => ({ ...s, ...partial }))}
            />
          )}
          {currentStep === 2 && (
            <Step2OwnerBank
              data={step2}
              onChange={(partial) => setStep2((s) => ({ ...s, ...partial }))}
            />
          )}
          {currentStep === 3 && (
            <Step3Documents
              data={step3}
              onChange={(partial) => setStep3((s) => ({ ...s, ...partial }))}
            />
          )}
        </div>

        <div className="mt-6 flex justify-between">
          <motion.button
            whileHover={currentStep !== 1 ? { scale: 1.05 } : {}}
            whileTap={currentStep !== 1 ? { scale: 0.95 } : {}}
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
              whileHover={stepValid ? { scale: 1.05 } : {}}
              whileTap={stepValid ? { scale: 0.95 } : {}}
              onClick={next}
              disabled={!stepValid}
              className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                stepValid
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/50"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
              }`}
            >
              Next →
            </motion.button>
          ) : (
            <motion.button
              whileHover={stepValid && !saving ? { scale: 1.05 } : {}}
              whileTap={stepValid && !saving ? { scale: 0.95 } : {}}
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
                '✓ Save'
              )}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Vehicles;
