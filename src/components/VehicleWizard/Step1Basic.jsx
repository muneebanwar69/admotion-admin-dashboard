import React from "react";

const types = ["Personal", "Commercial", "Fleet"];
const durations = ["Monthly", "Quarterly", "Annual"];

const Step1Basic = ({ carId, data, onChange }) => {
  const set = (k, v) => onChange({ [k]: v });

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md">
      {/* Section Heading */}
      <h2 className="text-xl font-bold text-blue-900 dark:text-white mb-6">
        Vehicle Type & Basic Details
      </h2>

      {/* Type Selector */}
      <div className="flex gap-3 mb-6">
        {types.map((t) => {
          const active = data.type === t;
          return (
            <button
              type="button"
              key={t}
              onClick={() => set("type", t)}
              className={`px-5 py-2 rounded-full border text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                active
                  ? "bg-blue-600 border-blue-600 text-white shadow"
                  : "bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-600"
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>

      {/* Form Grid with 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Car ID */}
        <div>
          <label className="block text-sm font-bold text-blue-900 dark:text-blue-300 mb-1">
            Car ID
          </label>
          <input
            value={carId}
            readOnly
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-700 px-4 py-2 text-sm text-gray-900 dark:text-white cursor-not-allowed"
          />
        </div>

        {/* Car Name */}
        <div>
          <label className="block text-sm font-bold text-blue-900 dark:text-blue-300 mb-1">
            Car Name
          </label>
          <input
            value={data.vehicleName}
            onChange={(e) => set("vehicleName", e.target.value)}
            placeholder="e.g., Honda Civic"
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 transition-all duration-200 hover:border-blue-400"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-bold text-blue-900 dark:text-blue-300 mb-1">
            Password
          </label>
          <input
            type="text"
            value={data.password || ""}
            onChange={(e) => set("password", e.target.value)}
            placeholder="Enter password for vehicle login"
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 transition-all duration-200 hover:border-blue-400"
          />
        </div>

        {/* Owner Name */}
        <div>
          <label className="block text-sm font-bold text-blue-900 dark:text-blue-300 mb-1">
            Car Owner Name
          </label>
          <input
            value={data.ownerName}
            onChange={(e) => set("ownerName", e.target.value)}
            placeholder="Owner full name"
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 transition-all duration-200 hover:border-blue-400"
          />
        </div>

        {/* Model */}
        <div>
          <label className="block text-sm font-bold text-blue-900 dark:text-blue-300 mb-1">
            Model
          </label>
          <input
            value={data.model}
            onChange={(e) => set("model", e.target.value)}
            placeholder="e.g., 2021"
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 transition-all duration-200 hover:border-blue-400"
          />
        </div>

        {/* Car Color */}
        <div>
          <label className="block text-sm font-bold text-blue-900 dark:text-blue-300 mb-1">
            Car Color
          </label>
          <input
            value={data.color}
            onChange={(e) => set("color", e.target.value)}
            placeholder="e.g., White"
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 transition-all duration-200 hover:border-blue-400"
          />
        </div>

        {/* CNIC */}
        <div>
          <label className="block text-sm font-bold text-blue-900 dark:text-blue-300 mb-1">
            CNIC/NIC <span className="text-xs text-gray-500 dark:text-gray-400">(Used for vehicle app login)</span>
          </label>
          <input
            value={data.cnic}
            onChange={(e) => set("cnic", e.target.value)}
            placeholder="35202-1234567-1"
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 transition-all duration-200 hover:border-blue-400"
          />
        </div>

        {/* Plate Number */}
        <div>
          <label className="block text-sm font-bold text-blue-900 dark:text-blue-300 mb-1">
            Plate Number
          </label>
          <input
            value={data.plateNumber || ""}
            onChange={(e) => set("plateNumber", e.target.value)}
            placeholder="e.g., ABC-123"
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 transition-all duration-200 hover:border-blue-400"
          />
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-bold text-blue-900 dark:text-blue-300 mb-1">
            Duration/Pass
          </label>
          <select
            value={data.duration}
            onChange={(e) => set("duration", e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all duration-200 hover:border-blue-400"
          >
            <option value="">Select duration</option>
            {durations.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Registration Date */}
        <div>
          <label className="block text-sm font-bold text-blue-900 dark:text-blue-300 mb-1">
            Registration Date
          </label>
          <input
            type="date"
            value={data.registrationDate}
            onChange={(e) => set("registrationDate", e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all duration-200 hover:border-blue-400"
          />
        </div>
      </div>
    </div>
  );
};

export default Step1Basic;
