import React, { useState, useEffect } from 'react';
import { Lightbulb, X, Plus } from 'lucide-react';

export default function ItineraryAISuggestions({
    day,
    onAddSuggestion,
    dayId
}) {
    const [suggestions, setSuggestions] = useState([]);
    const [matchedSuggestions, setMatchedSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const dayTitle = day?.titles?.[day.titles.length - 1] || "";

    // Fetch suggestions from API
    useEffect(() => {
        const fetchSuggestions = async () => {
            setIsLoading(true);
            try {
                const res = await fetch('https://apitour.rajasthantouring.in/api/suggestions');
                const data = await res.json();
                setSuggestions(data.data?.suggestions || []);
            } catch (err) {
                console.error('Failed to load suggestions', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSuggestions();
    }, []);



    // Match suggestions based on day title
    useEffect(() => {
        if (!dayTitle || !suggestions.length) {
            setMatchedSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const titleLower = dayTitle?.toLowerCase();
        const titleWords = titleLower.split(" ").filter(w => w.length >= 2);

        const matched = suggestions.filter(suggestion => {
            const sug = suggestion.title?.toLowerCase();

            return titleWords.some(word => sug?.includes(word));
        });



        setMatchedSuggestions(matched);
        setShowSuggestions(matched.length > 0);
    }, [dayTitle, suggestions]);

    const handleAddSuggestion = (suggestion) => {

        // 2 बार चलाओ उसी सेकंड में

        console.log("🎯 1st Replace");
        onAddSuggestion(suggestion);

        Promise.resolve().then(() => {
            console.log("🎯 2nd Replace");
            onAddSuggestion(suggestion);
        });

        // Button UI change (optional)
        const btn = document.querySelector(`[data-suggestion-id="${suggestion.title}"]`);
        if (btn) {
            btn.classList.add("bg-green-500");
            btn.innerHTML = "✓ Replaced x2";
            setTimeout(() => {
                btn.classList.remove("bg-green-500");
                btn.innerHTML = `
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"                             d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0         0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Replace
            `;
            }, 2000);
        }
    };




    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Loading AI suggestions...</span>
            </div>
        );
    }

    if (!showSuggestions || matchedSuggestions.length === 0) {
        return null;
    }

    return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-500 animate-pulse" />
                    <h4 className="text-sm font-semibold text-gray-800">
                        AI Suggestions for "{dayTitle}"
                    </h4>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                        {matchedSuggestions.length} found
                    </span>
                </div>
                <button
                    onClick={() => setShowSuggestions(false)}
                    className="text-gray-400 hover:text-gray-600 transition"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="space-y-3">
                {matchedSuggestions.map((suggestion, index) => (
                    <div
                        key={index}
                        className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                                <h5 className="font-semibold text-gray-800 text-sm mb-1">
                                    {suggestion.title}
                                </h5>
                                <p className="text-xs text-gray-600 line-clamp-2">
                                    {suggestion.description}
                                </p>
                            </div>
                            <button
                                data-suggestion-id={suggestion.title}
                                onClick={() => handleAddSuggestion(suggestion)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-all duration-200 hover:scale-105 whitespace-nowrap"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Replace
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Click "Replace" to update day description with this suggestion
            </p>
        </div>
    );
}