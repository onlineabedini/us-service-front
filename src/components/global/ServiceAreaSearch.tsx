import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { StockholmAreas } from "@/lists/stockholmAreas";
import { MapPin } from "lucide-react";

const ServiceAreaSearch: React.FC = () => {
    const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const filteredAreas = StockholmAreas.filter((area) =>
        area.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAreaToggle = (area: string) => {
        setSelectedAreas(prev => {
            if (prev.includes(area)) {
                return prev.filter(a => a !== area);
            } else {
                return [...prev, area];
            }
        });
    };

    const handleSearch = () => {
        if (selectedAreas.length > 0) {
            navigate(`/marketPlace?serviceArea=${encodeURIComponent(JSON.stringify(selectedAreas))}`);
        }
    };

    return (
        <div ref={searchRef} className="relative w-full max-w-xl mx-auto mt-8">
            <div className="flex flex-col gap-2">
                <div className="relative flex-1">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setIsOpen(true);
                        }}
                        onFocus={() => setIsOpen(true)}
                        placeholder="Search service areas..."
                        className="w-full px-4 py-3 text-lg rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                    {isOpen && filteredAreas.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                            {filteredAreas.map((area) => (
                                <div
                                    key={area}
                                    className="px-4 py-2 cursor-pointer hover:bg-gray-100 flex items-center gap-2 text-left"
                                    onClick={() => handleAreaToggle(area)}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedAreas.includes(area)}
                                        onChange={() => {}}
                                        className="h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                                    />
                                    <MapPin className="w-4 h-4 text-teal-600 flex-shrink-0" />
                                    <span>{area}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {selectedAreas.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {selectedAreas.map((area) => (
                            <span
                                key={area}
                                className="bg-gradient-to-r from-teal-200 to-teal-100 text-teal-900 px-3 py-1 rounded-full text-sm font-semibold shadow-sm flex items-center gap-2"
                            >
                                {area}
                                <button
                                    onClick={() => handleAreaToggle(area)}
                                    className="text-teal-700 hover:text-teal-900"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                )}
                <button
                    onClick={handleSearch}
                    disabled={selectedAreas.length === 0}
                    className="px-8 py-3 text-lg font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Search
                </button>
            </div>
        </div>
    );
};

export default ServiceAreaSearch;