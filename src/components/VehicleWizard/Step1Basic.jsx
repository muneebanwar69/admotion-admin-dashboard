import React from "react";
import { motion } from "framer-motion";
import {
  Car,
  Lock,
  User,
  Calendar,
  Palette,
  CreditCard,
  Tag,
  Clock,
  Hash,
  Building,
  Truck,
} from "lucide-react";

const types = [
  { label: "Personal", icon: User },
  { label: "Commercial", icon: Building },
  { label: "Fleet", icon: Truck },
];
const durations = ["Monthly", "Quarterly", "Annual"];

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

const Step1Basic = ({ carId, data, onChange }) => {
  const set = (k, v) => onChange({ [k]: v });

  const today = new Date().toISOString().split("T")[0];

  return (
    <motion.div
      className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Section Heading */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-blue-900 dark:text-white">
          Vehicle Type & Basic Details
        </h2>
        <div className="mt-2 h-1 w-24 rounded-full bg-gradient-to-r from-brand-900 to-blue-500" />
      </div>

      {/* Type Selector */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {types.map(({ label, icon: TypeIcon }) => {
          const active = data.type === label;
          return (
            <button
              type="button"
              key={label}
              onClick={() => set("type", label)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                active
                  ? "bg-gradient-to-r from-brand-900 to-blue-600 border-transparent text-white shadow-lg shadow-brand-900/30"
                  : "bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-600"
              }`}
            >
              <TypeIcon size={16} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Form Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Car ID */}
        <motion.div variants={itemVariants}>
          <label className={labelClass}>Car ID</label>
          <div className="relative">
            <IconWrapper icon={Hash} />
            <input
              value={carId}
              readOnly
              className={`${inputBase} bg-gray-100 dark:bg-slate-700 cursor-not-allowed`}
            />
          </div>
        </motion.div>

        {/* Car Name */}
        <motion.div variants={itemVariants}>
          <label className={labelClass}>Car Name</label>
          <div className="relative">
            <IconWrapper icon={Car} />
            <input
              value={data.vehicleName}
              onChange={(e) => set("vehicleName", e.target.value)}
              placeholder="e.g., Honda Civic"
              className={inputBase}
            />
          </div>
        </motion.div>

        {/* Password */}
        <motion.div variants={itemVariants}>
          <label className={labelClass}>Password</label>
          <div className="relative">
            <IconWrapper icon={Lock} />
            <input
              type="text"
              value={data.password || ""}
              onChange={(e) => set("password", e.target.value)}
              placeholder="Enter password for vehicle login"
              className={inputBase}
            />
          </div>
        </motion.div>

        {/* Owner Name */}
        <motion.div variants={itemVariants}>
          <label className={labelClass}>Car Owner Name</label>
          <div className="relative">
            <IconWrapper icon={User} />
            <input
              value={data.ownerName}
              onChange={(e) => set("ownerName", e.target.value)}
              placeholder="Owner full name"
              className={inputBase}
            />
          </div>
        </motion.div>

        {/* Model */}
        <motion.div variants={itemVariants}>
          <label className={labelClass}>Model</label>
          <div className="relative">
            <IconWrapper icon={Calendar} />
            <input
              value={data.model}
              onChange={(e) => set("model", e.target.value)}
              placeholder="e.g., 2021"
              className={inputBase}
            />
          </div>
        </motion.div>

        {/* Car Color */}
        <motion.div variants={itemVariants}>
          <label className={labelClass}>Car Color</label>
          <div className="relative">
            <IconWrapper icon={Palette} />
            <input
              value={data.color}
              onChange={(e) => set("color", e.target.value)}
              placeholder="e.g., White"
              className={inputBase}
            />
          </div>
        </motion.div>

        {/* CNIC */}
        <motion.div variants={itemVariants}>
          <label className={labelClass}>
            CNIC/NIC{" "}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              (Used for vehicle app login)
            </span>
          </label>
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

        {/* Plate Number */}
        <motion.div variants={itemVariants}>
          <label className={labelClass}>Plate Number</label>
          <div className="relative">
            <IconWrapper icon={Tag} />
            <input
              value={data.plateNumber || ""}
              onChange={(e) => set("plateNumber", e.target.value)}
              placeholder="e.g., ABC-123"
              className={inputBase}
            />
          </div>
        </motion.div>

        {/* Duration */}
        <motion.div variants={itemVariants}>
          <label className={labelClass}>Duration/Pass</label>
          <div className="relative">
            <IconWrapper icon={Clock} />
            <select
              value={data.duration}
              onChange={(e) => set("duration", e.target.value)}
              className={inputBase}
            >
              <option value="">Select duration</option>
              {durations.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Registration Date */}
        <motion.div variants={itemVariants}>
          <label className={labelClass}>Registration Date</label>
          <div className="relative">
            <IconWrapper icon={Calendar} />
            <input
              type="date"
              value={data.registrationDate}
              onChange={(e) => set("registrationDate", e.target.value)}
              min="2000-01-01"
              max={today}
              className={`${inputBase} appearance-none`}
            />
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default Step1Basic;
