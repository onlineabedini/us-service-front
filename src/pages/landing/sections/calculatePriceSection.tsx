import React, { useState, useMemo } from "react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { useTranslation } from 'react-i18next';

/* ───────── constants ───────── */
const TAX_RATE = 0.07;                 // 7 % of gross (rate × hours)
const SOCIAL_SECURITY_RATE = 0.3142;   // 31.42 % of gross
const HOURS_MAX = 200;                 // ≈ one working‑month (5 × 40 h)

/* ───────── helpers ───────── */
const formatNumber = (n: number) =>
    Math.round(n).toLocaleString("sv-SE");

// RUT logic: always double the rate
const getEffectiveRate = (rate: number) => rate * 2;

// ───────── Tooltip helpers ─────────
// Get tooltip text for RUT deduction
const getRutTooltip = (t: any) => t('provider.landing.calculate_price_rut_tooltip');
// Get tooltip text for income before tax
const getIncomeBeforeTaxTooltip = (t: any) => t('provider.landing.calculate_price_income_before_tax_tooltip');

const CalculatePriceSection = () => {
    // Add translation hook
    const { t } = useTranslation();
    // State for hourly rate
    const [rate, setRate] = useState<number>(200);
    // State for hours per month
    const [hours, setHours] = useState<number>(150);
    // (RUT is always applied, so no state needed)

    /* === earnings logic === */
    const earnings = useMemo(() => {
        // Always use doubled rate (RUT applied)
        const effectiveRate = getEffectiveRate(rate);
        const gross = effectiveRate * hours;               // rate × hours
        const tax = gross * TAX_RATE;                      // 7 %
        // Social security is now based on (gross - tax)
        const socialSecurity = (gross - tax) * SOCIAL_SECURITY_RATE;
        const net = gross - tax - socialSecurity;

        return { gross, tax, socialSecurity, net };
    }, [rate, hours]);

    /* === slider track colours === */
    const rateTrack = useMemo(() => {
        const pct = ((rate - 100) / 900) * 100;            // 100 – 1000 kr
        return `linear-gradient(to right,#008080 ${pct}%,#E5E7EB ${pct}%)`;
    }, [rate]);

    const hoursTrack = useMemo(() => {
        const pct = ((hours - 1) / (HOURS_MAX - 1)) * 100; // 1 – 200 h
        return `linear-gradient(to right,#008080 ${pct}%,#E5E7EB ${pct}%)`;
    }, [hours]);

    /* === UI === */
    return (
        <TooltipProvider>
            <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
                {/* ───── Heading ───── */}
                <div className="container mx-auto px-4 max-w-7xl">
                    <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
                        {t('provider.landing.calculate_price_title')}
                    </h2>
                    <p className="text-center text-gray-600 mb-16 max-w-2xl mx-auto">
                        {t('provider.landing.calculate_price_subtitle')}
                    </p>
                </div>

                {/* ───── Sliders + result ───── */}
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                        {/* ───── Hourly‑rate slider ───── */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-semibold text-gray-900">
                                    {t('provider.landing.hourly_rate')}
                                </h3>
                                {/* Info tooltip for RUT deduction */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="ml-1 cursor-pointer text-gray-400 hover:text-teal-600">
                                            <Info size={18} />
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                        {getRutTooltip(t)}
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <input
                                type="range"
                                min={100}
                                max={1000}
                                step={50}
                                value={rate}
                                onChange={(e) => setRate(Number(e.target.value))}
                                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                                style={{ background: rateTrack }}
                            />
                            <p className="text-2xl font-bold text-gray-900 mt-4">
                                {formatNumber(rate)} SEK<span className="text-sm font-normal text-gray-500">/h</span>
                            </p>
                        </div>

                        {/* ───── Hours‑per‑month slider ───── */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-semibold text-gray-900">{t('provider.landing.hours_per_month')}</h3>
                            </div>
                            <input
                                type="range"
                                min={1}
                                max={HOURS_MAX}
                                value={hours}
                                onChange={(e) => setHours(Number(e.target.value))}
                                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                                style={{ background: hoursTrack }}
                            />
                            <p className="text-2xl font-bold text-gray-900 mt-4">
                                {hours} <span className="text-sm font-normal text-gray-500">h</span>
                            </p>
                        </div>

                        {/* ───── Net earnings display ───── */}
                        <div className="bg-teal-50 p-6 rounded-2xl shadow-sm border border-teal-100">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-semibold text-gray-900">
                                    {t('provider.landing.earning_before_tax')}
                                </h3>
                                {/* Info tooltip for income before tax */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="ml-1 cursor-pointer text-gray-400 hover:text-teal-600">
                                            <Info size={18} />
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                        {getIncomeBeforeTaxTooltip(t)}
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <div className="flex items-baseline">
                                <p className="text-4xl font-bold text-teal-600">
                                    {formatNumber(earnings.net)}
                                </p>
                                <span className="ml-1 text-lg text-gray-600">kr</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </TooltipProvider>
    );
};

export default CalculatePriceSection;