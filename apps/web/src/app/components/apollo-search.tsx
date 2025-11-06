"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseClient";

export default function ApolloSearchModal({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: (open: boolean) => void;
  onAdded?: () => void;
}) {
  const supabase = supabaseBrowser();
  const [filters, setFilters] = useState({ company: "", city: "" });
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null); // NEW
 
  const handleSearch = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/source/apollo/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters),
      });
  
      // Parse body once
      let payload: any = null;
      try {
        payload = await res.json();
      } catch { payload = null; }
  
      if (!res.ok) {
        const msg = (payload && (payload.error || payload.message)) || `Request failed (${res.status})`;
        setResults([]);
        setErrorMsg(msg);
        return;
      }
  
      setResults(Array.isArray(payload?.results) ? payload.results : []);
    } catch (err: any) {
      console.error(err);
      setResults([]);
      setErrorMsg(err?.message || "Search failed");
    } finally {
      setLoading(false);
    }
  };
  

  const addToTargets = async (person: any) => {
    try {
      // Insert via server API so we bypass RLS and guarantee consistency
      const res = await fetch("/api/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...person,
          status: person.status ?? "new",
          source: person.source ?? "apollo",
        }),
      });
  
      const payload = await res.json();
      if (!res.ok) {
        console.error(payload);
        alert(payload?.error || `Insert failed (${res.status})`);
        return;
      }
  
      if (payload?.duplicated) {
        alert("Already exists");
        return;
      }
  
      // Success: tell the table to refresh and close modal
      alert(`${person.owner_name} added successfully`);
  
      // Fire a browser event that the table listens for
      window.dispatchEvent(new CustomEvent("targets:changed"));
  
      onAdded?.();      // in case you also bump refreshKey
      onClose(false);   // optional: close modal to see the table
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Unexpected error adding target");
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

        <h2 className="text-xl font-semibold mb-4">Search Apollo</h2>

        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <input
            type="text"
            placeholder="Company"
            value={filters.company}
            onChange={(e) => setFilters({ ...filters, company: e.target.value })}
            className="border border-gray-300 rounded px-2 py-1 flex-1"
          />
          <input
            type="text"
            placeholder="City"
            value={filters.city}
            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
            className="border border-gray-300 rounded px-2 py-1 flex-1"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        {/* Optional error line */}
        {errorMsg && (
          <p className="text-red-600 text-sm mb-2">{errorMsg}</p>
        )}

        <div className="space-y-2 max-h-64 overflow-y-auto border-t pt-3">
          {results.length === 0 && !loading && !errorMsg && (
            <p className="text-gray-500 text-sm">
              No results yet. Enter filters and click Search.
            </p>
          )}
          {results.map((r, i) => (
            <div
              key={i}
              className="flex justify-between items-center border p-2 rounded"
            >
              <div>
                <p className="font-medium">{r.owner_name}</p>
                <p className="text-sm text-gray-600">
                  {r.company} — {r.city}
                </p>
                <p className="text-xs text-gray-500">{r.email}</p>
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
