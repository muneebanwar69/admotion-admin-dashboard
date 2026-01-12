// src/components/Campaigns/CampaignWizard/Step4Review.jsx
import React, { useEffect, useState } from "react";
import { db } from "../../../firebase";
import { doc, getDoc } from "firebase/firestore";

/*
 Step4: show review of selected ads and vehicles, basic summary. Offer final submit button in parent.
*/

export default function Step4Review({ form }) {
  const [adsDetails, setAdsDetails] = useState([]);
  const [vehiclesDetails, setVehiclesDetails] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function fetchDetails() {
      const adsRes = [];
      const vehiclesRes = [];
      if (form.ads && form.ads.length) {
        await Promise.all(form.ads.map(async (adId) => {
          try {
            const d = await getDoc(doc(db, "ads", adId));
            if (d.exists()) adsRes.push({ id: adId, ...d.data() });
          } catch (e) {}
        }));
      }
      if (form.vehicles && form.vehicles.length) {
        await Promise.all(form.vehicles.map(async (vId) => {
          try {
            const d = await getDoc(doc(db, "vehicles", vId));
            if (d.exists()) vehiclesRes.push({ id: vId, ...d.data() });
          } catch (e) {}
        }));
      }
      if (!cancelled) {
        setAdsDetails(adsRes);
        setVehiclesDetails(vehiclesRes);
      }
    }
    fetchDetails();
    return () => (cancelled = true);
  }, [form.ads, form.vehicles]);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <div className="text-sm font-medium mb-2">Selected Ads</div>
        {adsDetails.length === 0 ? <div className="text-gray-500">No ads selected</div> : (
          <div className="space-y-2">
            {adsDetails.map((a) => (
              <div key={a.id} className="p-3 border rounded flex items-center gap-3">
                <div className="w-20 h-12 bg-gray-100 rounded overflow-hidden">
                  {a.preview ? <img src={a.preview} alt="" className="w-full h-full object-cover" /> : <div className="text-xs text-gray-500 p-2">No preview</div>}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{a.title}</div>
                  <div className="text-xs text-gray-500">{a.company}</div>
                </div>
                <div className="text-sm text-gray-600">{a.type}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="text-sm font-medium mb-2">Assigned Vehicles</div>
        {vehiclesDetails.length === 0 ? <div className="text-gray-500">No vehicles selected</div> : (
          <div className="space-y-2">
            {vehiclesDetails.map((v) => (
              <div key={v.id} className="p-3 border rounded">
                <div className="font-medium">{v.carId || v.id}</div>
                <div className="text-xs text-gray-500">{v.city || "—"} • {v.model || "—"}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
