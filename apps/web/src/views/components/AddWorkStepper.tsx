import React from "react";
import { Check } from "lucide-react";

export interface AddWorkStepperProps {
  currentStep: number; // 0: Farmer, 1: Machinery, 2: Details, 3: Review, 4: Done
  onStepClick?: (stepIndex: number) => void;
}

const STEPS = [
  { id: 0, label: "Select Farmer", prefix: "1 " },
  { id: 1, label: "Choose Machinery", prefix: "" },
  { id: 2, label: "Work Details", prefix: "" },
  { id: 3, label: "Review", prefix: "" },
  { id: 4, label: "Done", prefix: "" },
];

export function AddWorkStepper({ currentStep, onStepClick }: AddWorkStepperProps) {
  return (
    <nav aria-label="Progress" className="w-full max-w-4xl mx-auto my-6 px-2 sm:px-6">
      <div className="flex items-center justify-between relative">
        {STEPS.map((step, idx) => {
          const isDone = currentStep > idx;
          const isActive = currentStep === idx;
          const isClickable = onStepClick && idx < currentStep && currentStep < 4;

          return (
            <React.Fragment key={step.id}>
              {/* Connector line between steps */}
              {idx > 0 && (
                <div
                  className={`flex-1 h-[2.5px] mx-2 sm:mx-4 transition-colors duration-300 ${
                    idx <= currentStep ? "bg-[#16812F]" : "bg-gray-200"
                  }`}
                  aria-hidden="true"
                />
              )}

              {/* Step indicator node & label */}
              <div className="flex flex-col items-center group">
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onStepClick(idx)}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 ${
                    isDone
                      ? "bg-[#16812F] text-white shadow-sm hover:brightness-105 cursor-pointer"
                      : isActive
                      ? "bg-[#075C2D] text-white shadow-md ring-4 ring-green-100 scale-105"
                      : "bg-white border-2 border-gray-200 text-gray-400 cursor-default"
                  } ${isClickable ? "hover:scale-105 cursor-pointer" : ""}`}
                  aria-current={isActive ? "step" : undefined}
                >
                  {isDone ? (
                    <Check className="w-5 h-5 text-white stroke-[2.5]" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </button>

                {/* Step label */}
                <span
                  className={`mt-2 text-xs sm:text-sm whitespace-nowrap tracking-tight transition-colors ${
                    isActive
                      ? "font-bold text-[#075C2D]"
                      : isDone
                      ? "font-medium text-gray-800"
                      : "font-normal text-gray-400"
                  }`}
                >
                  {step.prefix}
                  {step.label}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
}
