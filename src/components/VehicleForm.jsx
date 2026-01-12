// src/components/VehicleForm.jsx
import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

const VehicleForm = ({ onCancel, onSubmit, editData }) => {
  const steps = ["Vehicle Details", "Owner Info", "Verification"];
  const [currentStep, setCurrentStep] = useState(0);

  const [formData, setFormData] = useState({
    vehicleId: `CAR-${uuidv4().slice(0, 5).toUpperCase()}`,
    model: "",
    type: "",
    ownerName: "",
    ownerContact: "",
    documents: null,
  });

  // If editing, load data
  useEffect(() => {
    if (editData) {
      setFormData(editData);
    }
  }, [editData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e) => {
    setFormData((prev) => ({ ...prev, documents: e.target.files[0] }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-2xl mx-auto">
      {/* Step Progress */}
      <div className="flex justify-between mb-6">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center text-sm">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                index <= currentStep ? "bg-blue-600 text-white" : "bg-gray-300"
              }`}
            >
              {index + 1}
            </div>
            <span
              className={`mt-2 ${
                index <= currentStep ? "text-blue-600" : "text-gray-400"
              }`}
            >
              {step}
            </span>
          </div>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {currentStep === 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Vehicle Details</h2>
            <div className="mb-4">
              <label className="block text-gray-700">Vehicle ID</label>
              <input
                type="text"
                value={formData.vehicleId}
                disabled
                className="w-full p-2 border rounded-lg bg-gray-100"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Model</label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg"
                placeholder="Enter vehicle model"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Select type</option>
                <option value="Car">Car</option>
                <option value="Bike">Bike</option>
                <option value="Truck">Truck</option>
              </select>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Owner Info</h2>
            <div className="mb-4">
              <label className="block text-gray-700">Owner Name</label>
              <input
                type="text"
                name="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg"
                placeholder="Enter owner name"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Owner Contact</label>
              <input
                type="text"
                name="ownerContact"
                value={formData.ownerContact}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg"
                placeholder="Enter owner contact"
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Verification</h2>
            <div className="mb-4">
              <label className="block text-gray-700">Upload Documents</label>
              <input
                type="file"
                onChange={handleFileUpload}
                className="w-full p-2 border rounded-lg"
              />
              {formData.documents && (
                <p className="mt-2 text-sm text-green-600">
                  {formData.documents.name || "Document already uploaded"}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-between mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <div className="flex gap-3">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={prevStep}
                className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300"
              >
                Back
              </button>
            )}
            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                {editData ? "Update" : "Submit"}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default VehicleForm;
