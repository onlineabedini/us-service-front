//@collapse
import React, { useEffect, useState, useCallback, useRef } from "react";
import { Toaster, toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from '@/config/api';
import { providerService } from '@/services/provider.service';
import DOMPurify from 'dompurify';
import ProgressiveImage from '@/components/global/ProgressiveImage';
import { Pencil } from "lucide-react";
import StarRating from './StarRating';
import BookmarkButton from './BookmarkButton';
import { useTranslation } from "react-i18next";
import { marketPlaceRequiredFields } from '@/utils/requiredFieldsCheck';
import { getCookie } from '@/utils/authCookieService';

interface Provider {
    id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
    hourlyRate?: number;
    rating?: number; // Legacy field
    rate?: number; // New provider rating field from backend
    description?: string;
    location?: string;
    isAvailable?: boolean;
}

const BASE_URL = API_BASE_URL;

interface SimilarProvidersProps {
    currentProviderId?: string;
}

const SimilarProviders: React.FC<SimilarProvidersProps> = ({ currentProviderId }) => {
    const { t } = useTranslation();
    const [providers, setProviders] = useState<Provider[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [current, setCurrent] = useState(0);
    const [animDirection, setAnimDirection] = useState<'left' | 'right' | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState<any>(null);

    // Get client data for bookmark functionality
    const getClientData = useCallback(async () => {
        const clientId = getCookie('clientId');
        const token = getCookie('token');

        if (!clientId || !token) {
            setCurrentUser(null);
            return;
        }

        try {
            // Simple check if client is logged in without importing clientService to avoid circular deps
            setCurrentUser({ id: clientId });
        } catch (error) {
            setCurrentUser(null);
        }
    }, []);

    // Fetch similar providers using providerService
    const fetchProviders = useCallback(async () => {
        try {
            const data = await providerService.fetchProviders();
            
            // Filter providers based on marketplace requirements and admin status
            const filteredData = data.filter((provider: any) => {
                // Exclude admin and super admin providers
                const isSuperAdmin = provider.email === 'vitago.swe@gmail.com';
                const isAdmin = provider.role === 'admin';
                if (isSuperAdmin || isAdmin) {
                    return false;
                }
                
                // Check if provider meets marketplace requirements
                const meetsRequirements = marketPlaceRequiredFields(provider);
                return meetsRequirements;
            });
            
            const filteredProviders = currentProviderId
                ? filteredData.filter((provider: Provider) => provider.id !== currentProviderId)
                : filteredData;
            setProviders(filteredProviders);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError(t("providerPreview.couldNotLoadProviders"));
            setLoading(false);
            toast.error(t("providerPreview.couldNotLoadProviders"));
        }
    }, [currentProviderId]);

    useEffect(() => {
        fetchProviders();
        getClientData();
    }, [fetchProviders, getClientData]);

    // Carousel navigation
    const goLeft = () => {
        setAnimDirection('left');
        setCurrent((prev) => (prev - 4 + providers.length) % providers.length);
    };
    const goRight = () => {
        setAnimDirection('right');
        setCurrent((prev) => (prev + 4) % providers.length);
    };

    // Animated card entry
    useEffect(() => {
        if (animDirection) {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => setAnimDirection(null), 400);
        }
        return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
    }, [animDirection]);

    const handleCardClick = (provider: Provider) => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        navigate(`/provider/${provider.id}`);
    };

    // Always show 4 providers per row
    const getVisibleProviders = () => {
        return providers.slice(0, 4);
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[200px]">
            <div className="animate-pulse space-y-4 w-full max-w-2xl">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-gray-100 rounded-2xl h-80"></div>
                    ))}
                </div>
            </div>
        </div>
    );
    if (error) return <div className="text-center p-10 text-red-500">{error}</div>;
    
    // Return null if there are no providers to show
    if (!providers.length) return null;

    return (
        <div className="relative container mx-auto py-12 px-4 sm:px-8 rounded-3xl shadow-2xl bg-gradient-to-br from-teal-50 via-teal-50 to-purple-50 border border-white/80 overflow-hidden my-12">
            {/* Decorative background pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(94,234,212,0.08)_0,transparent_60%),radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.07)_0,transparent_70%)] pointer-events-none rounded-3xl z-0" />
            <div className="relative z-10">
                {/* Section Title */}
                <div className="flex items-center mb-8">
                    <div className="border-l-4 border-teal-400 pl-4">
                        <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">{t("similarProviders")}</h2>
                    </div>
                </div>
                <Separator className="mb-6" />
                {/* Carousel Controls */}
                <div className="flex justify-end items-center mb-4 gap-2">
                    <button onClick={goLeft} className="p-2 rounded-full bg-white shadow hover:bg-teal-50 border border-teal-100 text-teal-500 disabled:opacity-40" aria-label={t("providerPreview.previous")}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button onClick={goRight} className="p-2 rounded-full bg-white shadow hover:bg-teal-50 border border-teal-100 text-teal-500 disabled:opacity-40" aria-label={t("providerPreview.next")}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
                {/* Providers Carousel */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-7">
                    {getVisibleProviders().map((provider, idx) => (
                        <div
                            key={provider.id}
                            className={`group bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-500 hover:scale-[1.04] hover:shadow-2xl cursor-pointer border-2 border-transparent hover:border-teal-200 relative focus-within:ring-2 focus-within:ring-teal-400
                                ${animDirection === 'left' ? 'animate-slide-left' : ''}
                                ${animDirection === 'right' ? 'animate-slide-right' : ''}
                                opacity-0 translate-y-8 animate-fade-in`}
                            style={{ animationDelay: `${idx * 80}ms` }}
                            tabIndex={0}
                            onClick={() => handleCardClick(provider)}
                            onKeyPress={e => { if (e.key === 'Enter') handleCardClick(provider); }}
                            aria-label={t("providerPreview.viewProvider", { firstName: provider.firstName, lastName: provider.lastName })}
                        >
                            {/* Bookmark button - positioned at top right */}
                            {currentUser && (
                                <div className="absolute top-2 right-2 z-30">
                                    <BookmarkButton
                                        clientId={currentUser.id}
                                        providerId={provider.id}
                                        variant="overlay"
                                    />
                                </div>
                            )}

                            {/* Colored accent for available providers */}
                            {provider.isAvailable && (
                                <div className={`absolute top-2 ${currentUser ? 'right-14' : 'right-2'} m-1 w-3 h-3 rounded-full bg-green-400 border-2 border-white shadow-lg z-20`} title={t("providerPreview.available")} />
                            )}
                            <div className="relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                {/* Provider image with progressive loading */}
                                <ProgressiveImage
                                    src={provider.profileImage ? `${BASE_URL}/${provider.profileImage}` : '/assets/img/provider.jpg'}
                                    alt={`${provider.firstName} ${provider.lastName}`}
                                    className="w-full h-52"
                                    placeholder="/assets/img/provider.jpg"
                                />
                                <div className="absolute bottom-0 left-0 right-0 p-4 z-20 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                    <h3 className="text-xl font-bold text-white mb-1 drop-shadow-lg">{provider.firstName} {provider.lastName}</h3>
                                                        {/* Star rating and average value */}
                    <div className="flex items-center space-x-2">
                        {/* Render stars based on provider.rate (new backend field) or fallback to rating */}
                        <StarRating rating={provider.rate || provider.rating || 0} />
                        <span className="text-white text-sm">({(provider.rate || provider.rating || 0).toFixed(1)})</span>
                    </div>
                                </div>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <span className="px-3 py-1.5 bg-teal-100 text-teal-700 rounded-full text-base font-semibold shadow-sm transform transition-transform hover:scale-105">
                                            {provider.hourlyRate || "--"} SEK/hr
                                        </span>
                                        {provider.isAvailable && (
                                            <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-base font-semibold shadow-sm animate-pulse">
                                                {t("providerPreview.available")}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {/* Render provider description as sanitized HTML */}
                                <div
                                    className="text-gray-700 text-base line-clamp-3 min-h-[3rem] group-hover:text-gray-900 transition-colors duration-300"
                                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(provider.description || t("providerPreview.noDescriptionAvailable")) }}
                                />
                                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                    {/* Service Areas as badges instead of location */}
                                    <div className="flex flex-wrap gap-2 items-center text-sm">
                                        {Array.isArray((provider as any).serviceArea) && (provider as any).serviceArea.length > 0 ? (
                                            (provider as any).serviceArea.map((area: string, idx: number) => (
                                                <span key={idx} className="px-2 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-semibold border border-teal-100">
                                                    {area}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-semibold border border-gray-200">
                                                {t("providerPreview.noServiceArea")}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {/* Animated card entry keyframes */}
            <style>{`
                @keyframes fade-in {
                    0% { opacity: 0; transform: translateY(32px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.5s cubic-bezier(0.4,0,0.2,1) forwards;
                }
                @keyframes slide-left {
                    0% { opacity: 0; transform: translateX(-32px); }
                    100% { opacity: 1; transform: translateX(0); }
                }
                .animate-slide-left {
                    animation: slide-left 0.4s cubic-bezier(0.4,0,0.2,1) forwards;
                }
                @keyframes slide-right {
                    0% { opacity: 0; transform: translateX(32px); }
                    100% { opacity: 1; transform: translateX(0); }
                }
                .animate-slide-right {
                    animation: slide-right 0.4s cubic-bezier(0.4,0,0.2,1) forwards;
                }
            `}</style>
        </div>
    );
};

export default SimilarProviders;
