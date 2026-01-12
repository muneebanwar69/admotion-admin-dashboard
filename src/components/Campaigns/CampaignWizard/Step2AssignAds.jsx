// src/components/Campaigns/CampaignWizard/Step2AssignAds.jsx
import React, { useEffect, useState } from "react";
import { db } from "../../../firebase";
import { collection, onSnapshot } from "firebase/firestore";

/*
 Step2: show available ads as cards (preview, title, company)
 allow multi-select; selected ads are added to form.ads
*/

function AdCard({ ad, selected, onToggle }) {
  return (
    <div className={`border rounded p-3 flex gap-3 items-center ${selected ? "ring-2 ring-blue-300" : ""}`}>
      <div className="w-20 h-12 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
        {ad.type === "Image" && ad.preview ? (
          <img src={ad.preview} alt="ad" className="w-full h-full object-cover" />
        ) : ad.type === "Video" && ad.preview ? (
          <video src={ad.preview} className="w-full h-full object-cover" />
        ) : (
          <div className="text-xs text-gray-500">No preview</div>
        )}
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium">{ad.title}</div>
        <div className="text-xs text-gray-500">{ad.company || ad.category}</div>
      </div>
      <div>
        <button onClick={() => onToggle(ad.id)} className={`px-3 py-1 rounded ${selected ? "bg-[#101c44] text-white" : "border"}`}>
          {selected ? "Selected" : "Select"}
        </button>
      </div>
    </div>
  );
}

export default function Step2AssignAds({ form, setForm }) {
  const [ads, setAds] = useState([]);
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "ads"), (snap) => {
      setAds(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const toggle = (id) => {
    const next = (form.ads || []).includes(id) ? (form.ads || []).filter((a) => a !== id) : [...(form.ads || []), id];
    setForm({ ...form, ads: next });
  };

  return (
    <div>
      <div className="mb-3 text-sm text-gray-600">Select one or more ads to include in this campaign.</div>
      <div className="grid grid-cols-2 gap-3">
        {ads.map((ad) => (
          <AdCard key={ad.id} ad={ad} selected={(form.ads || []).includes(ad.id)} onToggle={toggle} />
        ))}
      </div>
    </div>
  );
}
