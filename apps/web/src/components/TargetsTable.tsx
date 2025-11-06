"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";

/** --- badge for status --- */
function StatusBadge({ value }: { value?: string | null }) {
  const v = (value || "new") as
    | "new"
    | "emailed"
    | "replied"
    | "called"
    | "converted"
    | string;

  const styles: Record<string, string> = {
    new: "bg-gray-100 text-gray-700 ring-1 ring-gray-300",
    emailed: "bg-blue-100 text-blue-800 ring-1 ring-blue-300",
    replied: "bg-amber-100 text-amber-800 ring-1 ring-amber-300",
    called: "bg-purple-100 text-purple-800 ring-1 ring-purple-300",
    converted: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300",
  };

  const cls = styles[v] ?? "bg-gray-100 text-gray-700 ring-1 ring-gray-300";

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {v}
    </span>
  );
}

type Target = {
  id: string;
  created_at: string;
  owner_name: string;
  company: string;
  property: string;
  city: string;
  email: string;
  source: string;
  status: string | null;
};

export default function TargetsTable({ refreshKey = 0 }: { refreshKey?: number }) {
  const [data, setData] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  /** fetch with cache-buster */
  const fetchTargets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/targets?ts=${Date.now()}`, { cache: "no-store" });
      const json = await res.json();
      const rows: Target[] = (json.targets || []).map((t: any) => ({
        ...t,
        status: t.status ?? "new",
      }));
      setData(rows);
    } catch (e) {
      console.error("Error fetching targets:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  /** initial + external refreshes */
  useEffect(() => {
    fetchTargets();
  }, [fetchTargets, refreshKey]);

  /** listen to event fired after server insert */
  useEffect(() => {
    const handler = () => {
      setColumnFilters([]); // avoid hidden new rows
      fetchTargets();
    };
    window.addEventListener("targets:changed", handler);
    return () => window.removeEventListener("targets:changed", handler);
  }, [fetchTargets]);

  /** columns */
  const columns = useMemo<ColumnDef<Target>[]>(
    () => [
      { accessorKey: "owner_name", header: "Name" },
      { accessorKey: "company", header: "Company" },
      { accessorKey: "property", header: "Property" },
      { accessorKey: "city", header: "City", filterFn: "includesString" },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ getValue }) => (
          <a className="text-blue-600 underline" href={`mailto:${getValue()}`}>
            {getValue() as string}
          </a>
        ),
      },
      { accessorKey: "source", header: "Source" },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => <StatusBadge value={getValue() as string} />,
        filterFn: "equalsString",
      },
    ],
    []
  );

  /** table instance */
  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 50 } }, // show a lot by default
  });

  /** filter options from current data */
  const cityOptions = useMemo(
    () => Array.from(new Set(data.map((d) => d.city).filter(Boolean))).sort(),
    [data]
  );
  const statusOptions = useMemo(
    () => Array.from(new Set(data.map((d) => d.status ?? "new"))).sort(),
    [data]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-600">
        Loading targets…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Filter by City</label>
          <select
            className="border rounded px-2 py-1"
            value={(table.getColumn("city")?.getFilterValue() as string) ?? ""}
            onChange={(e) =>
              table.getColumn("city")?.setFilterValue(e.target.value || undefined)
            }
          >
            <option value="">All Cities</option>
            {cityOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
          <select
            className="border rounded px-2 py-1"
            value={(table.getColumn("status")?.getFilterValue() as string) ?? ""}
            onChange={(e) =>
              table.getColumn("status")?.setFilterValue(e.target.value || undefined)
            }
          >
            <option value="">All Statuses</option>
            {statusOptions.map((s) => (
              <option key={String(s)} value={String(s)}>
                {String(s)}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setColumnFilters([])}
          className="border rounded px-3 py-1 text-sm hover:bg-gray-50"
        >
          Clear Filters
        </button>
      </div>

      {/* table */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider select-none cursor-pointer border-b"
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <span className="text-gray-400">
                        {{
                          asc: "↑",
                          desc: "↓",
                        }[header.column.getIsSorted() as string] ?? "↕"}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody className="bg-white">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b last:border-0 hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* footer / pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-gray-600">
        <div>
          Showing {table.getRowModel().rows.length} of {data.length} targets
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="border rounded px-2 py-1 disabled:opacity-40"
          >
            {"<<"}
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="border rounded px-2 py-1 disabled:opacity-40"
          >
            {"<"}
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="border rounded px-2 py-1 disabled:opacity-40"
          >
            {">"}
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="border rounded px-2 py-1 disabled:opacity-40"
          >
            {">>"}
          </button>

          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "all") table.setPageSize(data.length);
              else table.setPageSize(Number(val));
            }}
            className="border rounded px-2 py-1"
          >
            {[10, 20, 30, 40, 50].map((n) => (
              <option key={n} value={n}>
                Show {n}
              </option>
            ))}
            <option value="all">Show All</option>
          </select>
        </div>
      </div>
    </div>
  );
}
