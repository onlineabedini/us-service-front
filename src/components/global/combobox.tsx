import React, { useState, useRef, useEffect } from "react";

interface ComboboxProps {
  label?: string;
  children: React.ReactNode;
  disabled?: boolean;
}

// --- Helper: Recursively filter children for search ---
function filterChildren(children: React.ReactNode, search: string): React.ReactNode {
  if (!search) return children;
  if (Array.isArray(children)) {
    // If children is an array, filter each child
    const filtered = children
      .map(child => filterChildren(child, search))
      .filter(Boolean);
    return filtered.length > 0 ? filtered : null;
  }
  if (typeof children === "string") {
    return children.toLowerCase().includes(search.toLowerCase()) ? children : null;
  }
  if (React.isValidElement(children)) {
    // If this is a div or other element, check its children
    const childText = getTextFromReactNode(children.props.children);
    // If this element has children and any child matches, keep the element with filtered children
    if (children.props && children.props.children) {
      const filteredSub = filterChildren(children.props.children, search);
      if (filteredSub) {
        return React.cloneElement(children, {}, filteredSub);
      }
    }
    // Otherwise, check if this element's text matches
    if (childText && childText.toLowerCase().includes(search.toLowerCase())) {
      return children;
    }
    return null;
  }
  return null;
}

// --- Helper: Get all text from a ReactNode (for searching) ---
function getTextFromReactNode(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return node.toString();
  if (Array.isArray(node)) return node.map(getTextFromReactNode).join(" ");
  if (React.isValidElement(node) && node.props && node.props.children) {
    return getTextFromReactNode(node.props.children);
  }
  return "";
}

export const Combobox: React.FC<ComboboxProps> = ({ label, children, disabled = false }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const comboboxRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    if (!disabled) setOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!comboboxRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Use recursive filter for search ---
  let filteredChildren = children;
  if (open && search) {
    filteredChildren = filterChildren(children, search);
  }

  return (
    <div className={`relative w-full ${disabled ? 'opacity-60 pointer-events-none' : ''}`} ref={comboboxRef}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={handleToggle}
        className={`flex items-center justify-between w-full px-4 py-2.5 text-base bg-white border border-gray-200 rounded-lg shadow-sm text-gray-700 ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200'}`}
        aria-expanded={open}
        disabled={disabled}
      >
        <span>{disabled ? 'Not available' : 'Select...'}</span>
        <svg
          className={`w-5 h-5 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && !disabled && (
        <div className="absolute mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-10 overflow-auto max-h-64 ring-1 ring-black ring-opacity-5">
          {/* Search box for filtering */}
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:border-teal-400 text-sm"
              autoFocus
              disabled={disabled}
            />
          </div>
          {/* Filtered children */}
          <div className="max-h-48 overflow-auto">
            {(!filteredChildren || (Array.isArray(filteredChildren) && filteredChildren.length === 0)) ? (
              <div className="p-2 text-gray-400 text-sm">No results</div>
            ) : (
              filteredChildren
            )}
          </div>
        </div>
      )}
    </div>
  );
};