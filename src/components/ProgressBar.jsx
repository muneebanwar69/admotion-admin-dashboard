// src/components/ProgressBar.jsx
import React from "react";

/*
 Show step indicator + progress line. Accepts 'steps' array and 'current' index.
*/

export default function ProgressBar({ steps = [], current = 0 }) {
  const pct = Math.round((current / Math.max(1, steps.length - 1)) * 100);
  return (
    <div>
      <div className="flex items-center gap-4">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-3">
            <div className={`w-8 h-8 flex items-center justify-center rounded-full ${i <= current ? "bg-[#101c44] text-white" : "bg-gray-200 text-gray-600"}`}>
              {i + 1}
            </div>
            <div className={`text-sm ${i <= current ? "text-slate-800 font-medium" : "text-gray-500"}`}>{s}</div>
          </div>
        ))}
      </div>

      <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div style={{ width: `${pct}%` }} className="h-full bg-[#101c44]" />
      </div>
    </div>
  );
}
