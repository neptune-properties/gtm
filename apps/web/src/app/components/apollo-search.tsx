"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseClient";

export default function ApolloSearchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: (open: boolean) => void;
}) {
  const supabase = supabaseBrowser();
  const [filters, setFilters] = useState({ company: "", city: "" });
  const [results, setResults] = useState<any[]>([]);
  const [mode, setMode] = useState<"mock" | "live" | undefined>();
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/source/apollo/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("Apollo search failed", data);
        alert(data?.error ?? "Apollo search failed");
        setResults([]);
      } else {
        setResults(data.results || []);
        setMode(data.mode);
      }
    } finally {
      setLoading(false);
    }
  };

  const addToTargets = async (person: any) => {
    // client-side duplicate check (email)
    if (!person.email) {
      alert("No email found for this person; cannot add (dedupe by email).");
      return;
    }

    const { data: existing, error: selErr } = await supabase
      .from("targets")
      .select("email")
      .eq("email", person.email)
      .maybeSingle();

    if (selErr) {
      console.error(selErr);
      alert("Error checking duplicates");
      return;
    }
    if (existing) {
      alert("Already exists");
      return;
    }

    // Insert (or use upsert if you create a unique index on email)
    const { error } = await supabase
      .from("targets")
      .insert(person); // or .upsert(person, { onConflict: "email", ignoreDuplicates: true })

    if (error) {
      console.error(error);
      alert("Error adding target");
    } else {
      alert(`${person.owner_name || "Target"} added successfully`);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
        <button
          onClick={() => onClose(false)}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
        >
          ✕
        </button>

        <h2 className="text-xl font-semibold mb-2">Search Apollo</h2>
        {mode && (
          <p className="text-xs mb-2 text-gray-500">
            Mode: <span className="font-medium">{mode}</span>
          </p>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            type="text"
            placeholder="Company"
            value={filters.company}
            onChange={(e) => setFilters({ ...filters, company: e.target.value })}
            className="border border-gray-300 rounded px-2 py-1 flex-1"
          />
          <input
            type="text"
            placeholder="City (e.g., Austin, TX)"
            value={filters.city}
            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
            className="border border-gray-300 rounded px-2 py-1 flex-1"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "..." : "Search"}
          </button>
        </div>

        {/* Results */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {results.length === 0 && !loading && (
            <p className="text-gray-500 text-sm">No results yet.</p>
          )}
          {results.map((r, i) => (
            <div
              key={`${r.email || r.owner_name || i}-${i}`}
              className="flex justify-between items-center border border-gray-200 p-2 rounded"
            >
              <div>
                <p className="font-medium">{r.owner_name || "Unknown"}</p>
                <p className="text-sm text-gray-600">
                  {r.company || "—"} {r.city ? `— ${r.city}` : ""}
                </p>
                <p className="text-xs text-gray-500">{r.email || "No email"}</p>
              </div>
              <button
                onClick={() => addToTargets(r)}
                className="bg-green-600 text-white text-sm px-3 py-1 rounded hover:bg-green-700"
              >
                Add
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
