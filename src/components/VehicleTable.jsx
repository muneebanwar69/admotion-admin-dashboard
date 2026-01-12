// src/components/VehicleTable.jsx
import React from "react";

const VehicleTable = ({ vehicles, onEdit, onDelete }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 text-gray-700 text-left">
            <th className="p-3">Vehicle ID</th>
            <th className="p-3">Model</th>
            <th className="p-3">Type</th>
            <th className="p-3">Owner</th>
            <th className="p-3">Contact</th>
            <th className="p-3 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.length > 0 ? (
            vehicles.map((vehicle) => (
              <tr key={vehicle.vehicleId} className="border-b hover:bg-gray-50">
                <td className="p-3">{vehicle.vehicleId}</td>
                <td className="p-3">{vehicle.model}</td>
                <td className="p-3">{vehicle.type}</td>
                <td className="p-3">{vehicle.ownerName}</td>
                <td className="p-3">{vehicle.ownerContact}</td>
                <td className="p-3 text-center flex gap-2 justify-center">
                  <button
                    onClick={() => onEdit(vehicle)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(vehicle.vehicleId)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="text-center py-4 text-gray-500">
                No vehicles registered yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default VehicleTable;
