import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, X, Truck, Plus, Pencil, Trash2 } from "lucide-react";
import RealTimeIndicator from "./ui/RealTimeIndicator";

const VehicleList = ({ vehicles, onAdd, onEdit, onAskDelete }) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter vehicles based on search query
  const filteredVehicles = vehicles.filter((vehicle) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      vehicle.carId?.toLowerCase().includes(query) ||
      vehicle.vehicleName?.toLowerCase().includes(query) ||
      vehicle.ownerName?.toLowerCase().includes(query) ||
      vehicle.model?.toLowerCase().includes(query) ||
      vehicle.color?.toLowerCase().includes(query) ||
      vehicle.cnic?.toLowerCase().includes(query) ||
      vehicle.plateNumber?.toLowerCase().includes(query) ||
      vehicle.duration?.toLowerCase().includes(query)
    );
  });

  const hasItems = vehicles.length > 0;

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-gradient-to-r from-brand-900 via-brand-800 to-brand-900 text-white px-6 py-4 rounded-xl shadow-lg mb-6 flex items-center justify-between border border-white/10'
      >
        <div className="flex items-center gap-3">
          <Truck className="w-6 h-6" />
          <h1 className='text-xl md:text-2xl font-bold'>Vehicles Management</h1>
        </div>
        <div className="flex items-center gap-4">
          <RealTimeIndicator isActive={true} />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAdd}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-semibold border border-white/20 transition-all duration-300"
          >
            <Plus size={18} /> Add Vehicle
          </motion.button>
        </div>
      </motion.div>

      {/* Search Filter */}
      {hasItems && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
            <input
              type="text"
              placeholder="Search by car plate number, driver CNIC, vehicle name, owner, model, color..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-900 dark:focus:ring-brand-800 focus:border-transparent transition-all duration-300 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X size={18} />
              </button>
            )}
          </div>
          {searchQuery && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 text-sm text-slate-600 dark:text-slate-400"
            >
              Found <span className="font-semibold text-brand-900 dark:text-blue-400">{filteredVehicles.length}</span> vehicle{filteredVehicles.length !== 1 ? 's' : ''} matching "{searchQuery}"
            </motion.p>
          )}
        </motion.div>
      )}

      {!hasItems ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg p-12 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
            <Truck className="w-8 h-8 text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium mb-2">No vehicles yet</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm">
            Click <span className="font-semibold text-brand-900 dark:text-blue-400">Add Vehicle</span> to register your first vehicle.
          </p>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden transition-all duration-300"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              {/* Table Header */}
              <thead className="bg-gradient-to-r from-brand-900 to-brand-800 text-white">
                <tr className="text-sm">
                  <th className="p-4 font-semibold">Car ID</th>
                  <th className="p-4 font-semibold">Vehicle Name</th>
                  <th className="p-4 font-semibold">Owner</th>
                  <th className="p-4 font-semibold">Model</th>
                  <th className="p-4 font-semibold">Color</th>
                  <th className="p-4 font-semibold">CNIC/NIC</th>
                  <th className="p-4 font-semibold">Plate Number</th>
                  <th className="p-4 font-semibold">Duration</th>
                  <th className="p-4 font-semibold">Registration</th>
                  <th className="p-4 font-semibold">Password</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="text-slate-700 dark:text-slate-300">
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan="12" className="p-12 text-center">
                      <div className="flex flex-col items-center">
                        <Search className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
                        <p className="text-lg font-medium text-slate-500 dark:text-slate-400 mb-1">No vehicles found</p>
                        <p className="text-sm text-slate-400 dark:text-slate-500">Try adjusting your search query</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((v, index) => (
                    <motion.tr
                      key={v.carId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-200 group"
                    >
                      <td className="p-4 font-semibold text-brand-900 dark:text-blue-400">{v.carId}</td>
                      <td className="p-4 font-medium">{v.vehicleName}</td>
                      <td className="p-4">{v.ownerName}</td>
                      <td className="p-4 text-slate-500 dark:text-slate-400">{v.model}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full border border-slate-200 dark:border-slate-600" style={{ backgroundColor: v.color?.toLowerCase() || '#gray' }} />
                          {v.color}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-sm text-slate-500 dark:text-slate-400">{v.cnic}</td>
                      <td className="p-4 font-mono text-sm">{v.plateNumber || "N/A"}</td>
                      <td className="p-4 text-slate-500 dark:text-slate-400">{v.duration}</td>
                      <td className="p-4 text-slate-500 dark:text-slate-400">{v.registrationDate}</td>
                      <td className="p-4 font-mono text-sm text-slate-400">
                        {v.password ? '••••••••' : "N/A"}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-emerald-400 to-emerald-500 text-white shadow-lg shadow-emerald-400/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          Active
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onEdit(v)}
                            className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-all duration-200"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onAskDelete(v.id || v.carId)}
                            className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-all duration-200"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default VehicleList;
