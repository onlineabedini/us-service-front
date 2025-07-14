import React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface CountryBadgeProps {
  countryName: string;
  flagClass: string;
  selected?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  className?: string;
}

const CountryBadge: React.FC<CountryBadgeProps> = ({
  countryName,
  flagClass,
  selected = false,
  onClick,
  onRemove,
  className,
}) => {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200",
        selected
          ? "bg-teal-100 text-teal-800 hover:bg-teal-200"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <span className={`${flagClass} w-4 h-4 rounded-sm shadow-sm`} />
      <span className="text-sm font-medium">{countryName}</span>
      {selected && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 p-0.5 hover:bg-teal-200 rounded-full transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

export { CountryBadge };