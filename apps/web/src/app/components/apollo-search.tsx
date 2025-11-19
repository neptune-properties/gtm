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
  const [filters, setFilters] = useState({
    company: "",
    city: "",
    title: "",
    seniority: [] as string[],
    keywords: "",
    emailStatus: [] as string[],
  });
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
        body: JSON.stringify({
          company: filters.company,
          city: filters.city,
          person_titles: filters.title ? [filters.title] : undefined,
          person_seniorities:
            filters.seniority.length > 0 ? filters.seniority : undefined,
          q_keywords: filters.keywords || undefined,
        }),
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

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <input
            type="text"
            placeholder="Company"
            value={filters.company}
            onChange={(e) => setFilters({ ...filters, company: e.target.value })}
            className="border border-gray-300 rounded px-2 py-1 flex-1 min-w-[120px]"
          />
          <input
            type="text"
            placeholder="City"
            value={filters.city}
            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
            className="border border-gray-300 rounded px-2 py-1 flex-1 min-w-[120px]"
          />
          <input
            type="text"
            placeholder="Job Title"
            value={filters.title}
            onChange={(e) => setFilters({ ...filters, title: e.target.value })}
            className="border border-gray-300 rounded px-2 py-1 flex-1 min-w-[160px]"
          />
          { /* seniority dropdown */ }
          <div className="relative">
            <details className="border border-gray-300 rounded px-2 py-1 cursor-pointer select-none">
              <summary className="text-sm">
                {filters.seniority.length > 0
                  ? filters.seniority.join(", ")
                  : "Select Seniorities"}
              </summary>
              <div className="absolute z-10 bg-white border border-gray-200 rounded mt-1 shadow p-2 flex flex-col gap-1 w-48 max-h-48 overflow-y-auto">
                {[
                  "owner",
                  "founder",
                  "c_suite",
                  "partner",
                  "vp",
                  "head",
                  "director",
                  "manager",
                  "senior",
                  "entry",
                  "intern",
                ].map((s) => (
                  <label key={s} className="flex items-center gap-2 text-sm capitalize">
                    <input
                      type="checkbox"
                      checked={filters.seniority.includes(s)}
                      onChange={(e) => {
                        setFilters({
                          ...filters,
                          seniority: e.target.checked
                            ? [...filters.seniority, s]
                            : filters.seniority.filter((v) => v !== s),
                        });
                      }}
                    />
                    {s.replace("_", " ")}
                  </label>
                ))}
              </div>
            </details>
          </div>
          <input
            type="text"
            placeholder="Keywords"
            value={filters.keywords}
            onChange={(e) => setFilters({ ...filters, keywords: e.target.value })}
            className="border border-gray-300 rounded px-2 py-1 flex-1 min-w-[160px]"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        {/* Email Verification Status Dropdown */}
        <div className="relative flex-shrink-0">
          <details className="border border-gray-300 rounded-md px-3 py-2 text-sm cursor-pointer select-none bg-white">
            <summary className="text-gray-700 font-medium">
              {filters.emailStatus.length > 0
                ? filters.emailStatus.join(", ")
                : "Email Status"}
            </summary>
            <div className="absolute z-20 bg-white border border-gray-200 rounded-md mt-1 shadow-md p-2 flex flex-col gap-1 w-52 max-h-48 overflow-y-auto">
              {["verified", "unverified", "likely to engage", "unavailable"].map((s) => (
                <label
                  key={s}
                  className="flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-100 rounded px-1 py-0.5"
                >
                  <input
                    type="checkbox"
                    checked={filters.emailStatus.includes(s)}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        emailStatus: e.target.checked
                          ? [...filters.emailStatus, s]
                          : filters.emailStatus.filter((v) => v !== s),
                      })
                    }
                    className="accent-blue-600"
                  />
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </label>
              ))}
            </div>
          </details>
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
