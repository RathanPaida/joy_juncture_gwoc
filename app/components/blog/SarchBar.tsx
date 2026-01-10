"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiSearch, FiX } from "react-icons/fi";
import { debounce } from "@/lib/utils";

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Fetch search suggestions
  const fetchSuggestions = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(
          `/api/blog/search/suggestions?q=${encodeURIComponent(query)}`,
        );
        const data = await response.json();
        if (data.success) {
          setSuggestions(data.data);
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [],
  );

  // Handle search input
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    fetchSuggestions(value);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("q", searchQuery.trim());
      params.delete("category"); // Clear category filter when searching
      router.push(`/blog?${params.toString()}`);
      setSuggestions([]);
    }
  };

  // Clear search
  const handleClear = () => {
    setSearchQuery("");
    setSuggestions([]);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    router.push(`/blog?${params.toString()}`);
  };

  // Use suggestion
  const useSuggestion = (suggestion: string) => {
    setSearchQuery(suggestion);
    const params = new URLSearchParams(searchParams.toString());
    params.set("q", suggestion);
    params.delete("category");
    router.push(`/blog?${params.toString()}`);
    setSuggestions([]);
  };

  // Clear suggestions on click outside
  useEffect(() => {
    const handleClickOutside = () => {
      setSuggestions([]);
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search gameplay guides, strategies, and stories..."
            className="w-full px-6 py-4 pl-14 pr-12 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg transition-all"
            autoComplete="off"
            aria-label="Search blog articles"
          />

          <div className="absolute left-5 text-gray-500" aria-hidden="true">
            <FiSearch className="w-5 h-5" />
          </div>

          {searchQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-16 text-gray-500 hover:text-gray-300 transition-colors"
              aria-label="Clear search"
              title="Clear search"
            >
              <FiX className="w-5 h-5" />
            </button>
          )}

          <button
            type="submit"
            className="absolute right-4 px-5 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/20"
            aria-label={isSearching ? "Searching..." : "Search articles"}
            title="Search"
            disabled={isSearching}
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
        </div>
      </form>

      {/* Search Suggestions */}
      {suggestions.length > 0 && (
        <div
          className="absolute z-50 w-full mt-2 bg-gray-900 border border-gray-700/50 rounded-2xl shadow-2xl shadow-black/50 backdrop-blur-sm overflow-hidden"
          role="listbox"
          aria-label="Search suggestions"
        >
          <div className="py-2">
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Popular Searches
            </div>
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => useSuggestion(suggestion)}
                className="w-full text-left px-4 py-3 hover:bg-gray-800/50 text-gray-300 hover:text-white transition-colors flex items-center gap-3 group"
                role="option"
                aria-label={`Search for "${suggestion}"`}
              >
                <FiSearch
                  className="w-4 h-4 text-gray-500 group-hover:text-orange-500"
                  aria-hidden="true"
                />
                <span>{suggestion}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Search Tags */}
      <div className="flex flex-wrap justify-center gap-3 mt-6">
        <button
          onClick={() => useSuggestion("Dead Man's Deck")}
          className="px-4 py-2 bg-gray-800/30 hover:bg-gray-700/50 text-gray-400 hover:text-white rounded-full text-sm transition-all border border-gray-700/50"
          aria-label="Search for Dead Man's Deck articles"
          title="Search Dead Man's Deck"
        >
          Dead Man's Deck
        </button>
        <button
          onClick={() => useSuggestion("Strategy Guide")}
          className="px-4 py-2 bg-gray-800/30 hover:bg-gray-700/50 text-gray-400 hover:text-white rounded-full text-sm transition-all border border-gray-700/50"
          aria-label="Search for Strategy Guide articles"
          title="Search Strategy Guide"
        >
          Strategy Guide
        </button>
        <button
          onClick={() => useSuggestion("Game Night")}
          className="px-4 py-2 bg-gray-800/30 hover:bg-gray-700/50 text-gray-400 hover:text-white rounded-full text-sm transition-all border border-gray-700/50"
          aria-label="Search for Game Night articles"
          title="Search Game Night"
        >
          Game Night
        </button>
        <button
          onClick={() => useSuggestion("Beginners")}
          className="px-4 py-2 bg-gray-800/30 hover:bg-gray-700/50 text-gray-400 hover:text-white rounded-full text-sm transition-all border border-gray-700/50"
          aria-label="Search for Beginner articles"
          title="Search Beginners"
        >
          Beginners
        </button>
      </div>
    </div>
  );
}
