"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "lucide-react";

interface NominatimResult {
  place_id: number;
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    hamlet?: string;
    municipality?: string;
    state?: string;
    postcode?: string;
    county?: string;
    neighbourhood?: string;
    suburb?: string;
  };
}

interface ParsedAddress {
  address: string;
  city: string;
  state: string;
  zip: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (address: ParsedAddress) => void;
  placeholder?: string;
  id?: string;
}

const STATE_ABBR: Record<string, string> = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR",
  California: "CA", Colorado: "CO", Connecticut: "CT", Delaware: "DE",
  Florida: "FL", Georgia: "GA", Hawaii: "HI", Idaho: "ID",
  Illinois: "IL", Indiana: "IN", Iowa: "IA", Kansas: "KS",
  Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD",
  Massachusetts: "MA", Michigan: "MI", Minnesota: "MN", Mississippi: "MS",
  Missouri: "MO", Montana: "MT", Nebraska: "NE", Nevada: "NV",
  "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM",
  "New York": "NY", "North Carolina": "NC", "North Dakota": "ND",
  Ohio: "OH", Oklahoma: "OK", Oregon: "OR", Pennsylvania: "PA",
  "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD",
  Tennessee: "TN", Texas: "TX", Utah: "UT", Vermont: "VT",
  Virginia: "VA", Washington: "WA", "West Virginia": "WV",
  Wisconsin: "WI", Wyoming: "WY", "District of Columbia": "DC",
};

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Start typing your address...",
  id = "address",
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const parseSuggestion = (r: NominatimResult): ParsedAddress => {
    const a = r.address;
    const street = [a.house_number, a.road].filter(Boolean).join(" ");
    const city =
      a.city || a.town || a.village || a.hamlet || a.municipality || a.county || "";
    const state = STATE_ABBR[a.state || ""] || a.state || "";
    const zip = a.postcode || "";
    return {
      address: street || r.display_name.split(",")[0].trim(),
      city,
      state,
      zip,
    };
  };

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.trim().length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/address-search?q=${encodeURIComponent(query.trim())}`,
        { signal: abortRef.current.signal }
      );
      const data: NominatimResult[] = await res.json();
      setSuggestions(data);
      setIsOpen(data.length > 0);
      setHighlightedIndex(-1);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setSuggestions([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      onChange(val);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (val.trim().length < 3) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      debounceRef.current = setTimeout(() => {
        fetchSuggestions(val);
      }, 300);
    },
    [onChange, fetchSuggestions]
  );

  const handleSelect = useCallback(
    (r: NominatimResult) => {
      const parsed = parseSuggestion(r);
      onChange(parsed.address);
      onSelect(parsed);
      setIsOpen(false);
      setSuggestions([]);
    },
    [onChange, onSelect]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen || suggestions.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((p) =>
          p < suggestions.length - 1 ? p + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((p) =>
          p > 0 ? p - 1 : suggestions.length - 1
        );
      } else if (
        (e.key === "Enter" || e.key === "Tab") &&
        highlightedIndex >= 0
      ) {
        e.preventDefault();
        handleSelect(suggestions[highlightedIndex]);
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    },
    [isOpen, suggestions, highlightedIndex, handleSelect]
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const formatDisplay = (r: NominatimResult) => {
    const a = r.address;
    const street = [a.house_number, a.road].filter(Boolean).join(" ");
    const city =
      a.city || a.town || a.village || a.hamlet || a.municipality || a.county || "";
    const state = STATE_ABBR[a.state || ""] || a.state || "";
    const zip = a.postcode || "";
    const primary = street || r.display_name.split(",")[0].trim();
    const secondary = [city, state, zip].filter(Boolean).join(", ");
    return { primary, secondary };
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Input
          id={id}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          autoComplete="off"
          className="pr-9"
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <MapPin className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
          <ul className="max-h-64 overflow-y-auto py-1" role="listbox">
            {suggestions.map((result, index) => {
              const { primary, secondary } = formatDisplay(result);
              return (
                <li
                  key={`${result.place_id}-${index}`}
                  role="option"
                  aria-selected={index === highlightedIndex}
                  className={`flex cursor-pointer items-start gap-2.5 px-3 py-2 transition-colors ${
                    index === highlightedIndex
                      ? "bg-primary/5"
                      : "hover:bg-muted/40"
                  }`}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(result);
                  }}
                >
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-sm text-foreground">
                      {primary}
                    </p>
                    {secondary && (
                      <p className="truncate text-xs text-muted-foreground">
                        {secondary}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
