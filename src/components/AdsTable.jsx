// src/components/AdsTable.jsx
import React from "react";

export default function AdsTable({
  ads,
  selected,
  setSelected,
  onEdit,
  onDelete,
  onPreview,
}) {
  const toggleRow = (id) => {
    if (selected.includes(id)) setSelected(selected.filter((s) => s !== id));
    else setSelected([...selected, id]);
  };
  const toggleAll = () => {
    if (selected.length === ads.length) setSelected([]);
    else setSelected(ads.map((a) => a.id));
  };

  return (
    <div className="bg-white p-6 rounded shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Ads Management</h2>
        {/* New ad button is provided by parent */}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto text-sm">
          <thead>
            <tr className="bg-[#0f1b54] text-white">
              <th className="p-2"><input type="checkbox" checked={selected.length === ads.length && ads.length>0} onChange={toggleAll} /></th>
              <th className="p-2">Ad ID</th>
              <th className="p-2">Ad Title</th>
              <th className="p-2">Category</th>
              <th className="p-2">Company</th>
              <th className="p-2">Budget</th>
              <th className="p-2">Start Time</th>
              <th className="p-2">End Time</th>
              <th className="p-2">Status</th>
              <th className="p-2">Plays</th>
              <th className="p-2">Location</th>
              <th className="p-2">Type</th>
              <th className="p-2">Email</th>
              <th className="p-2">Contact no</th>
              <th className="p-2">Preview</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ads.map((a) => (
              <tr key={a.id} className="odd:bg-gray-50 even:bg-white">
                <td className="p-2 text-center"><input type="checkbox" checked={selected.includes(a.id)} onChange={() => toggleRow(a.id)} /></td>
                <td className="p-2">{a.adId || a.id}</td>
                <td className="p-2">{a.title}</td>
                <td className="p-2">{a.category || "-"}</td>
                <td className="p-2">{a.company || "-"}</td>
                <td className="p-2">{a.budget || "-"}</td>
                <td className="p-2">{a.startTime || "-"}</td>
                <td className="p-2">{a.endTime || "-"}</td>
                <td className="p-2">{a.isActive ? "Active" : "Inactive"}</td>
                <td className="p-2">{a.plays || "-"}</td>
                <td className="p-2">{a.location || "-"}</td>
                <td className="p-2">{a.mediaType || "-"}</td>
                <td className="p-2">{a.email || "-"}</td>
                <td className="p-2">{a.contact || "-"}</td>
                <td className="p-2">
                  {a.thumbnailUrl ? (
                    <img src={a.thumbnailUrl} alt="thumb" className="w-16 h-10 object-cover rounded border" />
                  ) : a.mediaUrl ? (
                    a.mediaType === "video" ? <div className="w-16 h-10 flex items-center justify-center bg-gray-100 text-xs">Video</div> : <img src={a.mediaUrl} alt="media" className="w-16 h-10 object-cover rounded border" />
                  ) : (
                    <div className="w-16 h-10 bg-gray-100" />
                  )}
                </td>
                <td className="p-2">
                  <div className="flex gap-2">
                    <button onClick={() => onPreview(a)} className="px-2 py-1 text-xs bg-indigo-50 border rounded">Preview</button>
                    <button onClick={() => onEdit(a)} className="px-2 py-1 text-xs border rounded">Edit</button>
                    <button onClick={() => onDelete(a)} className="px-2 py-1 text-xs text-red-600 border rounded">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {ads.length === 0 && (
              <tr>
                <td colSpan={17} className="p-6 text-center text-gray-500">No ads yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
