import React, { useState } from "react";
import { Search, X } from "lucide-react";

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
    <div className="p-6">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Vehicles</h1>
        <button
          onClick={onAdd}
          className="bg-[#101c44] text-white px-4 py-2 rounded-lg shadow hover:bg-[#182b5b] transition-all duration-200 transform hover:scale-105"
        >
          + Add Vehicle
        </button>
      </div>

      {/* Search Filter */}
      {hasItems && (
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by car plate number, driver CNIC, vehicle name, owner, model, color..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#101c44] focus:border-transparent transition-all duration-200 hover:border-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>
          {searchQuery && (
            <div className="mt-2 text-sm text-gray-600">
              Found {filteredVehicles.length} vehicle{filteredVehicles.length !== 1 ? 's' : ''} matching "{searchQuery}"
            </div>
          )}
        </div>
      )}

      {!hasItems ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow p-12 text-center">
          <div className="text-slate-400 text-sm">No vehicles yet</div>
          <div className="mt-2 text-slate-600">
            Click <span className="font-medium">Add Vehicle</span> to register your first vehicle.
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow overflow-hidden transition-all duration-300 hover:shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              {/* Table Header with Dark Blue Background to match Ads page */}
              <thead className="bg-[#101c44] text-white">
                <tr className="text-sm">
                  <th className="p-4 font-medium">Car ID</th>
                  <th className="p-4 font-medium">Vehicle Name</th>
                  <th className="p-4 font-medium">Owner</th>
                  <th className="p-4 font-medium">Model</th>
                  <th className="p-4 font-medium">Color</th>
                  <th className="p-4 font-medium">CNIC/NIC</th>
                  <th className="p-4 font-medium">Plate Number</th>
                  <th className="p-4 font-medium">Duration/Pass</th>
                  <th className="p-4 font-medium">Registration Date</th>
                  <th className="p-4 font-medium">Password</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 text-center font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="text-slate-800">
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan="12" className="p-12 text-center text-gray-500">
                      <div>
                        <p className="text-lg font-medium mb-2">No vehicles found</p>
                        <p className="text-sm">Try adjusting your search query</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((v) => (
                  <tr
                    key={v.carId}
                    className="border-t border-slate-100 hover:bg-slate-50 transition-all duration-200"
                  >
                    <td className="p-4 font-semibold">{v.carId}</td>
                    <td className="p-4">{v.vehicleName}</td>
                    <td className="p-4">{v.ownerName}</td>
                    <td className="p-4">{v.model}</td>
                    <td className="p-4">{v.color}</td>
                    <td className="p-4">{v.cnic}</td>
                    <td className="p-4">{v.plateNumber || "N/A"}</td>
                    <td className="p-4">{v.duration}</td>
                    <td className="p-4">{v.registrationDate}</td>
                    <td className="p-4">
                      {v.password ? v.password : "N/A"}
                    </td>
                    <td className="p-4 text-green-600 font-semibold">
                      Active
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onEdit(v)}
                          className="px-3 py-1.5 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 transition-all duration-200 transform hover:scale-105"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onAskDelete(v.id || v.carId)}
                          className="px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all duration-200 transform hover:scale-105"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleList;
