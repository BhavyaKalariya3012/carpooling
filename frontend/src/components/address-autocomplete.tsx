"use client";

import { useEffect, useRef, useState } from "react";
import { fetchPlaceSuggestions, type PlaceSuggestion } from "@/lib/ola-maps";

interface AddressAutocompleteProps {
  label: string;
  value: string;
  onSelect: (place: PlaceSuggestion) => void;
  required?: boolean;
}

const DEBOUNCE_MS = 300;

/**
 * Address text input backed by Ola Maps' Autocomplete API. The user only
 * ever sees and types place names/addresses; lat/lng are resolved silently
 * from the selected suggestion and handed to the parent via onSelect.
 */
export default function AddressAutocomplete({ label, value, onSelect, required }: AddressAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleChange(next: string) {
    setQuery(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!next.trim()) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const results = await fetchPlaceSuggestions(next);
      setSuggestions(results);
      setOpen(results.length > 0);
      setLoading(false);
    }, DEBOUNCE_MS);
  }

  function handlePick(place: PlaceSuggestion) {
    setQuery(place.description);
    setOpen(false);
    onSelect(place);
  }

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1 text-sm font-medium text-zinc-700">
      {label}
      <input
        required={required}
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder="Start typing an address or place name..."
        autoComplete="off"
        className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-normal focus:border-zinc-900 focus:outline-none"
      />
      {open && (
        <ul className="absolute top-full z-10 mt-1 w-full rounded-md border border-zinc-200 bg-white py-1 shadow-lg">
          {loading && <li className="px-3 py-2 text-xs font-normal text-zinc-400">Searching...</li>}
          {!loading &&
            suggestions.map((s) => (
              <li key={s.placeId}>
                <button
                  type="button"
                  onClick={() => handlePick(s)}
                  className="block w-full px-3 py-2 text-left text-sm font-normal text-zinc-700 hover:bg-zinc-100"
                >
                  {s.description}
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
