import * as React from "react";
import { cn } from "@/lib/utils";

interface YesNoButtonProps {
  value: boolean;
  onChange: (value: boolean) => void;
  name?: string;
  label?: string;
  className?: string;
}

const YesNoButton = React.forwardRef<HTMLDivElement, YesNoButtonProps>(
  ({ value, onChange, name, label, className }, ref) => {
    return (
      <div ref={ref} className={cn("flex flex-col gap-2", className)}>
        {label && (
          <label className="block text-sm font-medium text-gray-700">{label}</label>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange(true)}
            className={cn(
              "flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]",
              value
                ? "bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-lg hover:shadow-teal-500/25"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => onChange(false)}
            className={cn(
              "flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]",
              !value
                ? "bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-lg hover:shadow-teal-500/25"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            No
          </button>
        </div>
      </div>
    );
  }
);

YesNoButton.displayName = "YesNoButton";

export { YesNoButton };