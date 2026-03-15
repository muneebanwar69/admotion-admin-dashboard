import React from "react";
import { motion } from "framer-motion";
import {
  User,
  CreditCard,
  Mail,
  Wallet,
  Hash,
  Globe,
  Building2,
  CheckCircle2,
} from "lucide-react";

const formatCNIC = (value) => {
  const digits = value.replace(/\D/g, "").slice(0, 13);
  let formatted = digits;
  if (digits.length > 5) {
    formatted = digits.slice(0, 5) + "-" + digits.slice(5);
  }
  if (digits.length > 12) {
    formatted = digits.slice(0, 5) + "-" + digits.slice(5, 12) + "-" + digits.slice(12);
  }
  return formatted;
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const inputBase =
  "w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 pl-10 pr-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-brand-900/30 focus:border-brand-900 focus:border-l-4 focus:border-l-brand-900 hover:border-slate-400 hover:shadow-sm transition-all duration-200";

const labelClass =
  "block text-sm font-bold text-blue-900 dark:text-blue-300 mb-1";

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

const IconWrapper = ({ icon: Icon }) => (
  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
    <Icon size={18} />
  </div>
);

/**
 * props:
 * - data: {firstName,lastName,cnic,email,accountTitle,accountNo,iban,bankName}
 * - onChange: (partial) => void
 */
const Step2OwnerBank = ({ data, onChange }) => {
  const set = (k, v) => onChange({ [k]: v });

  const emailValid = data.email && isValidEmail(data.email);

  return (
    <motion.div
      className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Owner Information Section */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-blue-900 dark:text-white">
          Owner Information
        </h2>
        <div className="mt-2 h-1 w-24 rounded-full bg-gradient-to-r from-brand-900 to-blue-500" />
      </div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-5"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* First Name */}
        <motion.div variants={itemVariants}>
          <label className={labelClass}>First Name</label>
          <div className="relative">
            <IconWrapper icon={User} />
            <input
              value={data.firstName}
              onChange={(e) => set("firstName", e.target.value)}
              placeholder="First name"
              className={inputBase}
            />
          </div>
        </motion.div>

        {/* Last Name */}
        <motion.div variants={itemVariants}>
          <label className={labelClass}>Last Name</label>
          <div className="relative">
            <IconWrapper icon={User} />
            <input
              value={data.lastName}
              onChange={(e) => set("lastName", e.target.value)}
              placeholder="Last name"
              className={inputBase}
            />
          </div>
        </motion.div>

        {/* CNIC */}
        <motion.div variants={itemVariants}>
          <label className={labelClass}>CNIC</label>
          <div className="relative">
            <IconWrapper icon={CreditCard} />
            <input
              value={data.cnic}
              onChange={(e) => set("cnic", formatCNIC(e.target.value))}
              placeholder="35202-1234567-1"
              className={inputBase}
              maxLength={15}
            />
          </div>
        </motion.div>

        {/* Email */}
        <motion.div variants={itemVariants}>
          <label className={labelClass}>Email</label>
          <div className="relative">
            <IconWrapper icon={Mail} />
            <input
              value={data.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="name@domain.com"
              className={`${inputBase} ${emailValid ? "pr-10" : ""}`}
            />
            {emailValid && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                <CheckCircle2 size={18} />
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Divider */}
      <div className="my-8 border-t border-gray-200 dark:border-slate-700" />

      {/* Bank Details Section */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-blue-900 dark:text-white">
          Bank Details
        </h2>
        <div className="mt-2 h-1 w-24 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
      </div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-5"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Account Title */}
        <motion.div variants={itemVariants}>
          <label className={labelClass}>Account Title</label>
          <div className="relative">
            <IconWrapper icon={Wallet} />
            <input
              value={data.accountTitle}
              onChange={(e) => set("accountTitle", e.target.value)}
              placeholder="Account title"
              className={inputBase}
            />
          </div>
        </motion.div>

        {/* Account No */}
        <motion.div variants={itemVariants}>
          <label className={labelClass}>Account No</label>
          <div className="relative">
            <IconWrapper icon={Hash} />
            <input
              value={data.accountNo}
              onChange={(e) => set("accountNo", e.target.value)}
              placeholder="001122334455"
              className={inputBase}
            />
          </div>
        </motion.div>

        {/* IBAN */}
        <motion.div variants={itemVariants}>
          <label className={labelClass}>IBAN</label>
          <div className="relative">
            <IconWrapper icon={Globe} />
            <input
              value={data.iban}
              onChange={(e) => set("iban", e.target.value.toUpperCase())}
              placeholder="PK00HABB0000..."
              className={inputBase}
            />
          </div>
        </motion.div>

        {/* Bank Name */}
        <motion.div variants={itemVariants}>
          <label className={labelClass}>Bank Name</label>
          <div className="relative">
            <IconWrapper icon={Building2} />
            <input
              value={data.bankName}
              onChange={(e) => set("bankName", e.target.value)}
              placeholder="Bank name"
              className={inputBase}
            />
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default Step2OwnerBank;
