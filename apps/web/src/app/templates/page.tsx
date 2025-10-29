"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";

type Target = {
  id: string;
  owner_name: string;
  company: string;
  property: string;
  city: string;
  email: string;
  source: string;
  status: string;
};

export default function TargetsPage() {
  const [data, setData] = useState<Target[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [cityFilter, setCityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    const fetchDistinctValues = async () => {
      const res = await fetch("/api/targets?mode=distinct");
      const json = await res.json();
      setCities(json.cities || []);
      setStatuses(json.statuses || []);
    };

    fetchDistinctValues();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const params = new URLSearchParams();
      if (cityFilter) params.append("city", cityFilter);
      if (statusFilter) params.append("status", statusFilter);

      const res = await fetch(`/api/targets?${params.toString()}`);
      const json = await res.json();
      setData(json.targets || []);
    };

    fetchData();
  }, [cityFilter, statusFilter]);

  const columns = useMemo<ColumnDef<Target>[]>(
    () => [
      { header: "Owner", accessorKey: "owner_name" },
      { header: "Company", accessorKey: "company" },
      { header: "Property", accessorKey: "property" },
      { header: "City", accessorKey: "city" },
      { header: "Email", accessorKey: "email" },
      { header: "Source", accessorKey: "source" },
      {
        header: "Status",
        accessorKey: "status",
        cell: ({ getValue }) => {
          const status = getValue() as string;
          const color =
            status === "new"
              ? "bg-blue-100 text-blue-800"
              : status === "emailed"
              ? "bg-green-100 text-green-800"
              : status === "pending"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-gray-100 text-gray-800";
          return (
            <span
              className={`px-2 py-1 rounded text-sm font-medium ${color}`}
            >
              {status}
            </span>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Targets</h1>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All Cities</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All Statuses</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <table className="min-w-full border border-gray-200">
        <thead className="bg-gray-100">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="px-4 py-2 text-left">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-t">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="text-center py-6 text-gray-500">
                No results found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}