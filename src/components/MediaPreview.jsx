// src/components/MediaPreview.jsx
import React from "react";

export default function MediaPreview({ open, onClose, mediaUrl, mediaType, title }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded shadow-lg max-w-4xl w-full p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold">{title || "Preview"}</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900">Close</button>
        </div>
        <div className="w-full h-[60vh] flex items-center justify-center bg-gray-50">
          {mediaType === "video" ? (
            <video controls className="max-h-full max-w-full">
              <source src={mediaUrl} />
              Your browser does not support the video tag.
            </video>
          ) : (
            <img src={mediaUrl} alt="preview" className="max-h-full max-w-full object-contain" />
          )}
        </div>
      </div>
    </div>
  );
}
