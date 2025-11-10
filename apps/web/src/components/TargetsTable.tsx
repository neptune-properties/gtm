'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react'
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
} from '@tanstack/react-table';

/** --- Status badge --- */
const StatusBadge = ({ status }: { status: string | null | undefined }) => {
  const s = (status || 'new') as 'new' | 'emailed' | 'replied' | 'called' | 'converted'
  const colors = {
    new: { backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' },
    emailed: { backgroundColor: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd' },
    replied: { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' },
    called: { backgroundColor: '#e9d5ff', color: '#7c2d12', border: '1px solid #c4b5fd' },
    converted: { backgroundColor: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7' },
  } as const;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 500,
        ...(colors[s] || colors.new),
      }}
    >
      {s}
    </span>
  );
};

type Target = {
  id: string
  created_at: string
  owner_name: string
  company: string
  property: string
  city: string
  email: string
  source: string
  status: string | null
}

export default function TargetsTable({ refreshKey = 0 }: { refreshKey?: number }) {
  const [data, setData] = useState<Target[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  /** fetch from API */
  const fetchTargets = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/targets?ts=${Date.now()}`, { cache: 'no-store' })
      const json = await res.json()
      const rows: Target[] = (json.targets || []).map((t: any) => ({
        ...t,
        status: t.status ?? 'new',
      }))
      setData(rows)
    } catch (err) {
      console.error('Error fetching targets:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTargets()
  }, [fetchTargets, refreshKey])

  const columns = useMemo<ColumnDef<Target>[]>(
    () => [
      { accessorKey: 'owner_name', header: 'Name' },
      { accessorKey: 'company', header: 'Company' },
      { accessorKey: 'property', header: 'Property' },
      { accessorKey: 'city', header: 'City', filterFn: 'includesString' },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ getValue }) => {
          const v = getValue() as string
          return (
            <a
              href={`mailto:${v}`}
              style={{ color: '#2563eb', textDecoration: 'underline' }}
            >
              {v}
            </a>
          )
        },
      },
      { accessorKey: 'source', header: 'Source' },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => <StatusBadge status={getValue() as string} />,
        filterFn: 'equals',
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const target = row.original;
          return (
            <button
              onClick={() => {
                const searchParams = new URLSearchParams({
                  targetId: target.id,
                  targetName: target.owner_name,
                  targetCompany: target.company,
                  targetProperty: target.property,
                  targetEmail: target.email,
                  targetCity: target.city,
                });
                window.location.href = `/templates?${searchParams.toString()}`;
              }}
              style={{
                backgroundColor: '#2563eb',
                color: '#fff',
                padding: '6px 10px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Send Email
            </button>
          );
        },
      },
    ],
    []
  );

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
  });

  const uniqueCities = useMemo(
    () => [...new Set(data.map((d) => d.city).filter(Boolean))].sort(),
    [data]
  )
  const uniqueStatuses = useMemo(
    () => [...new Set(data.map((d) => d.status ?? 'new'))].sort(),
    [data]
  )

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{ fontSize: 18 }}>Loading targets...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>Targets</h2>

        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Filter by City</label>
            <select
              style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 4 }}
              value={(table.getColumn('city')?.getFilterValue() as string) ?? ''}
              onChange={(e) => table.getColumn('city')?.setFilterValue(e.target.value || undefined)}
            >
              <option value="">All Cities</option>
              {uniqueCities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Filter by Status</label>
            <select
              style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 4 }}
              value={(table.getColumn('status')?.getFilterValue() as string) ?? ''}
              onChange={(e) => table.getColumn('status')?.setFilterValue(e.target.value || undefined)}
            >
              <option value="">All Statuses</option>
              {uniqueStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'end' }}>
            <button
              onClick={() => table.resetColumnFilters()}
              style={{
                padding: '8px 16px',
                fontSize: 14,
                border: '1px solid #d1d5db',
                borderRadius: 4,
                backgroundColor: 'white',
                cursor: 'pointer',
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: 8 }}>
        <table style={{ minWidth: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f9fafb' }}>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    onClick={h.column.getToggleSortingHandler()}
                    style={{
                      padding: '12px 24px',
                      textAlign: 'left',
                      fontSize: 12,
                      fontWeight: 500,
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      cursor: 'pointer',
                      borderBottom: '1px solid #e5e7eb',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>
                        {h.isPlaceholder
                          ? null
                          : flexRender(h.column.columnDef.header, h.getContext())}
                      </span>
                      <span style={{ color: '#9ca3af' }}>
                        {{ asc: '↑', desc: '↓' }[h.column.getIsSorted() as string] ?? '↕'}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody style={{ backgroundColor: 'white' }}>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: 14, color: '#111827' }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {['<<', '<', '>', '>>'].map((symbol, i) => {
            const actions = [
              () => table.setPageIndex(0),
              () => table.previousPage(),
              () => table.nextPage(),
              () => table.setPageIndex(table.getPageCount() - 1),
            ]
            const disabled = i < 2 ? !table.getCanPreviousPage() : !table.getCanNextPage()
            return (
              <button
                key={symbol}
                onClick={actions[i]}
                disabled={disabled}
                style={{
                  padding: '4px 12px',
                  fontSize: 14,
                  border: '1px solid #d1d5db',
                  borderRadius: 4,
                  backgroundColor: 'white',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.5 : 1,
                }}
              >
                {symbol}
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14 }}>
            Page <strong>{table.getState().pagination.pageIndex + 1}</strong> of{' '}
            {table.getPageCount()}
          </span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            style={{
              padding: '4px 12px',
              fontSize: 14,
              border: '1px solid #d1d5db',
              borderRadius: 4,
            }}
          >
            {[10, 20, 30, 40, 50].map((n) => (
              <option key={n} value={n}>
                Show {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginTop: 16, fontSize: 14, color: '#6b7280' }}>
        Showing {table.getRowModel().rows.length} of {data.length} targets
      </div>
    </div>
  )
}
