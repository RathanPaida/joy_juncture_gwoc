"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp, X, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export const FILTERS = {
    gametype: {
        title: "Gametype",
        key: "gametype",
        options: [
            { label: "Board Games", value: "board-game" },
            { label: "Card Games", value: "card-game" }
        ],
    },
    occasion: {
        title: "Occasion",
        key: "category",
        options: [
            { label: "Party", value: "Party" },
            { label: "Family Event", value: "Family Event" },
            { label: "Date Night", value: "Date Night" },
            { label: "Strategy", value: "Strategy" },
            { label: "Kids", value: "Kids" },
            { label: "Travel", value: "Travel" }
        ],
    },
    mood: {
        title: "Mood",
        key: "mood",
        options: [
            { label: "Chill", value: "Chill" },
            { label: "Happy", value: "Happy" },
            { label: "Adventurous", value: "Adventurous" },
            { label: "Competitive", value: "Competitive" },
            { label: "Creative", value: "Creative" },
            { label: "Funny", value: "Funny" }
        ],
    },
    players: {
        title: "Players",
        key: "players",
        options: [
            { label: "2", value: "2" },
            { label: "3-5", value: "3-5" },
            { label: "5-7", value: "5-7" },
            { label: "7+", value: "7+" }
        ],
    },
};

export default function StoreFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({
        category: [],
        mood: [],
        players: [],
        gametype: [],
    });
    const [expanded, setExpanded] = useState<Record<string, boolean>>({
        category: true,
        mood: true,
        players: true,
        gametype: true,
    });
    const [mobileOpen, setMobileOpen] = useState(false);

    // Sync state with URL params on mount/update
    useEffect(() => {
        const newFilters: Record<string, string[]> = {
            category: searchParams.get("category")?.split(",") || [],
            mood: searchParams.get("mood")?.split(",") || [],
            players: searchParams.get("players")?.split(",") || [],
            gametype: searchParams.get("gametype")?.split(",") || [],
        };
        setActiveFilters(newFilters);
    }, [searchParams]);

    const toggleFilter = (key: string, value: string) => {
        const current = activeFilters[key] || [];
        let updated: string[];

        if (current.includes(value)) {
            updated = current.filter((item) => item !== value);
        } else {
            // For gametype, we behave like a radio button (single select) if desired, 
            // but the original code supported arrays. 
            // The user request "filters" implies checkbox. 
            // However, typical store gametype is mutually exclusive. 
            // Given the schema `gametype: String` (single), filtering by multiple would need $in.
            // The API supports passing a single RegEx. 
            // If we allow multiple, we should update API.
            // But let's check StorePage: `query.gametype = new RegExp(...)`. It only handles ONE value.
            // So for gametype, it should be Single Select.

            if (key === 'gametype') {
                updated = [value];
            } else {
                updated = [...current, value];
            }
        }

        const newFilters = { ...activeFilters, [key]: updated };
        setActiveFilters(newFilters);
        applyFilters(newFilters);
    };

    const applyFilters = (filters: Record<string, string[]>) => {
        const params = new URLSearchParams(searchParams.toString());

        Object.entries(filters).forEach(([key, values]) => {
            if (values.length > 0) {
                params.set(key, values.join(","));
            } else {
                params.delete(key);
            }
        });

        // Reset pagination to 1 when filtering
        params.set('page', '1');

        router.push(`/store?${params.toString()}`);
    };

    const clearAll = () => {
        setActiveFilters({ category: [], mood: [], players: [], gametype: [] });
        router.push("/store");
        setMobileOpen(false);
    };

    const toggleSection = (key: string) => {
        setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
    };


    const renderFilters = () => (
        <div className="space-y-8">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-orange-500 flex items-center gap-2">
                    <Filter size={18} /> Filters
                </h3>
                {(Object.values(activeFilters).some(v => v.length > 0)) && (
                    <button
                        onClick={clearAll}
                        className="text-xs text-stone-400 hover:text-white transition-colors"
                    >
                        Reset All Filters
                    </button>
                )}
            </div>

            {Object.entries(FILTERS).map(([key, data]) => (
                <div key={key} className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">
                            {data.title}
                        </span>
                    </div>

                    <div className="flex flex-col gap-2">
                        {data.options.map((option) => {
                            const isActive = activeFilters[data.key]?.includes(option.value);

                            return (
                                <button
                                    key={option.value}
                                    onClick={() => toggleFilter(data.key, option.value)}
                                    className={cn(
                                        "flex items-center gap-3 text-sm transition-all duration-200 group w-full text-left p-2 rounded-lg",
                                        isActive
                                            ? "bg-orange-500 text-black font-bold"
                                            : "text-stone-400 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    {/* Custom Checkbox/Radio UI */}
                                    <div className={cn(
                                        "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                                        isActive ? "border-black bg-black/20" : "border-stone-600 group-hover:border-stone-400"
                                    )}>
                                        {isActive && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                                    </div>
                                    {option.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <>
            {/* Mobile Toggle */}
            <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden fixed bottom-6 right-6 z-50 bg-orange-500 text-black p-4 rounded-full shadow-2xl flex items-center gap-2 font-bold animate-bounce-in"
            >
                <Filter size={20} /> Filters
            </button>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-72 flex-shrink-0">
                <div className="sticky top-24 bg-neutral-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                    {renderFilters()}
                </div>
            </aside>

            {/* Mobile Drawer */}
            {mobileOpen && (
                <div className="fixed inset-0 z-[100] lg:hidden">
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={() => setMobileOpen(false)}
                    />
                    <div className="absolute right-0 top-0 bottom-0 w-[300px] bg-neutral-900 border-l border-white/10 p-6 shadow-2xl animate-slide-in-right overflow-y-auto">
                        <button
                            onClick={() => setMobileOpen(false)}
                            className="absolute top-4 right-4 text-white/50 hover:text-white"
                        >
                            <X size={24} />
                        </button>
                        <div className="mt-8">
                            {renderFilters()}
                        </div>
                        <button
                            onClick={() => setMobileOpen(false)}
                            className="w-full mt-8 bg-orange-500 text-black font-bold py-3 rounded-xl"
                        >
                            View Results
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
