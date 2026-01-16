"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp, X, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

const FILTERS = {
    occasion: {
        title: "Occasion",
        key: "category",
        options: ["Party", "Family Event", "Date Night", "Strategy", "Kids", "Travel"],
    },
    mood: {
        title: "Mood",
        key: "mood",
        options: ["Chill", "Happy", "Adventurous", "Competitive", "Creative", "Funny"],
    },
    players: {
        title: "Players",
        key: "players",
        options: ["2", "3-5", "5-7", "7+"],
    },
};

export default function StoreFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({
        category: [],
        mood: [],
        players: [],
    });
    const [expanded, setExpanded] = useState<Record<string, boolean>>({
        category: true,
        mood: true,
        players: true,
    });
    const [mobileOpen, setMobileOpen] = useState(false);

    // Sync state with URL params on mount/update
    useEffect(() => {
        const newFilters: Record<string, string[]> = {
            category: searchParams.get("category")?.split(",") || [],
            mood: searchParams.get("mood")?.split(",") || [],
            players: searchParams.get("players")?.split(",") || [],
        };
        setActiveFilters(newFilters);
    }, [searchParams]);

    const toggleFilter = (key: string, value: string) => {
        const current = activeFilters[key] || [];
        let updated: string[];

        if (current.includes(value)) {
            updated = current.filter((item) => item !== value);
        } else {
            updated = [...current, value];
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
        setActiveFilters({ category: [], mood: [], players: [] });
        router.push("/store");
        setMobileOpen(false);
    };

    const toggleSection = (key: string) => {
        setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const FilterContent = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Filter size={20} className="text-orange-500" /> Filters
                </h3>
                {(activeFilters.category.length > 0 || activeFilters.mood.length > 0 || activeFilters.players.length > 0) && (
                    <button
                        onClick={clearAll}
                        className="text-xs text-orange-500 hover:text-white underline"
                    >
                        Clear all
                    </button>
                )}
            </div>

            {Object.entries(FILTERS).map(([key, data]) => (
                <div key={key} className="border-b border-white/10 pb-4 last:border-0">
                    <button
                        onClick={() => toggleSection(key)}
                        className="flex items-center justify-between w-full text-left mb-3 group"
                    >
                        <span className="font-semibold text-white group-hover:text-orange-400 transition-colors">
                            {data.title}
                        </span>
                        {expanded[key] ? (
                            <ChevronUp size={16} className="text-white/50" />
                        ) : (
                            <ChevronDown size={16} className="text-white/50" />
                        )}
                    </button>

                    {expanded[key] && (
                        <div className="flex flex-wrap gap-2">
                            {data.options.map((option) => {
                                const isActive = activeFilters[data.key]?.includes(option);
                                return (
                                    <button
                                        key={option}
                                        onClick={() => toggleFilter(data.key, option)}
                                        className={cn(
                                            "px-3 py-1.5 text-xs rounded-full border transition-all duration-200",
                                            isActive
                                                ? "bg-orange-500 border-orange-500 text-black font-bold shadow-[0_0_10px_rgba(255,140,0,0.4)]"
                                                : "bg-white/5 border-white/10 text-white/70 hover:border-orange-500/50 hover:text-white"
                                        )}
                                    >
                                        {option}
                                    </button>
                                );
                            })}
                        </div>
                    )}
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
                    <FilterContent />
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
                            <FilterContent />
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
