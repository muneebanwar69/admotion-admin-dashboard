// src/components/Campaigns/CampaignWizard/Step3AssignVehicles.jsx
import React, { useEffect, useState } from "react";
import { db } from "../../../firebase";
import { collection, onSnapshot } from "firebase/firestore";

/*
 Step3: show vehicles in a table with checkboxes. Allow filtering by city/status.
*/

export default function Step3AssignVehicles({ form, setForm }) {
  const [vehicles, setVehicles] = useState([]);
  const [filterCity, setFilterCity] = useState("");
  
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "vehicles"), (snap) => {
      setVehicles(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const visible = vehicles.filter((v) => {
    if (!filterCity) return true;
    // Search in city, vehicleName, ownerName, or plateNumber
    const searchLower = filterCity.toLowerCase();
    return (
      (v.city || "").toLowerCase().includes(searchLower) ||
      (v.vehicleName || "").toLowerCase().includes(searchLower) ||
      (v.ownerName || "").toLowerCase().includes(searchLower) ||
      (v.plateNumber || "").toLowerCase().includes(searchLower) ||
      (v.carId || "").toLowerCase().includes(searchLower)
    );
  });

  const toggle = (id) => {
    const next = (form.vehicles || []).includes(id) 
      ? (form.vehicles || []).filter((v) => v !== id) 
      : [...(form.vehicles || []), id];
    setForm({ ...form, vehicles: next });
  };

  const selectAll = () => {
    setForm({ ...form, vehicles: visible.map(v => v.id) });
  };

  const deselectAll = () => {
    setForm({ ...form, vehicles: [] });
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md">
      <h2 className="text-xl font-bold text-blue-900 dark:text-white mb-4">Select Vehicles</h2>
      
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input 
          placeholder="Search by name, city, plate..." 
          value={filterCity} 
          onChange={(e) => setFilterCity(e.target.value)} 
          className="border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 min-w-[200px]" 
        />
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Showing {visible.length} vehicles | Selected: {(form.vehicles || []).length}
        </div>
        <div className="flex gap-2 ml-auto">
          <button
            type="button"
            onClick={selectAll}
            className="px-3 py-1.5 text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={deselectAll}
            className="px-3 py-1.5 text-xs font-semibold bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600"
          >
            Deselect All
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-700">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-brand-900 to-brand-800 text-white">
            <tr>
              <th className="p-3 text-left">#</th>
              <th className="p-3 text-left">Car ID</th>
              <th className="p-3 text-left">Vehicle Name</th>
              <th className="p-3 text-left">Owner</th>
              <th className="p-3 text-center">Plate No</th>
              <th className="p-3 text-center">Model</th>
              <th className="p-3 text-center">Color</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-center">Select</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan="9" className="p-6 text-center text-gray-500 dark:text-gray-400">
                  No vehicles found. Register vehicles first.
                </td>
              </tr>
            ) : (
              visible.map((v, idx) => {
                const isSelected = (form.vehicles || []).includes(v.id);
                return (
                  <tr 
                    key={v.id} 
                    className={`border-b dark:border-slate-700 cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-blue-50 dark:bg-blue-900/20' 
                        : 'hover:bg-gray-50 dark:hover:bg-slate-700'
                    }`}
                    onClick={() => toggle(v.id)}
                  >
                    <td className="p-3 text-gray-700 dark:text-gray-300">{idx + 1}</td>
                    <td className="p-3 font-semibold text-blue-600 dark:text-blue-400">{v.carId || v.id.slice(0, 6)}</td>
                    <td className="p-3 font-medium text-gray-900 dark:text-white">{v.vehicleName || "—"}</td>
                    <td className="p-3 text-gray-700 dark:text-gray-300">{v.ownerName || "—"}</td>
                    <td className="p-3 text-center text-gray-700 dark:text-gray-300">{v.plateNumber || "—"}</td>
                    <td className="p-3 text-center text-gray-700 dark:text-gray-300">{v.model || "—"}</td>
                    <td className="p-3 text-center">
                      {v.color ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span 
                            className="w-4 h-4 rounded-full border border-gray-300" 
                            style={{ backgroundColor: v.color.toLowerCase() }}
                          />
                          {v.color}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        v.status === 'Active' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {v.status || "—"}
                      </span>
                    </td>
                    <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={isSelected} 
                        onChange={() => toggle(v.id)}
                        className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
