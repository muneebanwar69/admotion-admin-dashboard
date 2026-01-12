// src/components/Campaigns/CampaignWizard/Step1Basic.jsx
import React from "react";

/*
 Basic Step: name, cities (text comma separated), start/end date, weekdays toggles,
 budget, notes. Keep UI matching your provided UI: label + inputs inline grid.
*/

export default function Step1Basic({ form, setForm }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-1">Campaign Title</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full border rounded p-2"
          placeholder="e.g. Summer Promotion"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Cities (comma separated)</label>
        <input
          value={(form.cities || []).join(", ")}
          onChange={(e) => setForm({ ...form, cities: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
          className="w-full border rounded p-2"
          placeholder="e.g. Islamabad, Lahore"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Start Date</label>
        <input
          type="date"
          value={form.startDate || ""}
          onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          className="w-full border rounded p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">End Date</label>
        <input
          type="date"
          value={form.endDate || ""}
          onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          className="w-full border rounded p-2"
        />
      </div>

      <div className="col-span-2">
        <label className="block text-sm font-medium mb-1">Budget (optional)</label>
        <input
          value={form.budget || ""}
          onChange={(e) => setForm({ ...form, budget: e.target.value })}
          className="w-full border rounded p-2"
          placeholder="e.g. 50K"
        />
      </div>

      <div className="col-span-2">
        <label className="block text-sm font-medium mb-1">Notes / Description</label>
        <textarea
          value={form.notes || ""}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="w-full border rounded p-2 h-24"
          placeholder="Additional instructions for campaign..."
        />
      </div>
    </div>
  );
}
