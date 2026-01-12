import React from "react";

/**
 * props:
 * - current (1|2|3)
 * Renders 3 steps with connector line, active coloring
 */
const StepIndicator = ({ current }) => {
  const steps = ["Vehicle Details", "Owner & Bank", "Documents"];

  return (
    <div className="flex items-center gap-3 mb-6">
      {steps.map((label, idx) => {
        const step = idx + 1;
        const active = current >= step;
        return (
          <React.Fragment key={label}>
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                  active ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"
                }`}
              >
                {step}
              </div>
              <div
                className={`text-xs font-medium ${
                  active ? "text-blue-600" : "text-slate-400"
                }`}
              >
                {label}
              </div>
            </div>
            {step !== 3 && (
              <div
                className={`h-px flex-1 ${
                  current > step ? "bg-blue-600" : "bg-slate-200"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default StepIndicator;

