'use client'

import React, { useState, useEffect, useMemo } from 'react'
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
} from '@tanstack/react-table'

type Target = {
  id: string
  created_at: string
  owner_name: string
  company: string
  property: string
  city: string
  email: string
  source: string
  status: 'new' | 'emailed' | 'replied' | 'called' | 'converted'
}

const StatusDropdown = ({ 
  status, 
  targetId, 
  onStatusChange 
}: { 
  status: Target['status']
  targetId: string
  onStatusChange: (targetId: string, newStatus: Target['status']) => void
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const statusStyles = {
    new: { backgroundColor: '#f3f4f6', color: '#374151' },
    emailed: { backgroundColor: '#dbeafe', color: '#1e40af' },
    replied: { backgroundColor: '#fef3c7', color: '#92400e' },
    called: { backgroundColor: '#e9d5ff', color: '#7c2d12' },
    converted: { backgroundColor: '#d1fae5', color: '#065f46' },
  }

  const statusOptions: Target['status'][] = ['new', 'emailed', 'replied', 'called', 'converted']

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => {
          console.log('CLICKED!')
          setIsOpen(!isOpen)
        }}
        style={{
          padding: '4px 12px',
          borderRadius: '6px',
          border: '1px solid #d1d5db',
          cursor: 'pointer',
          ...statusStyles[status]
        }}
      >
        {status} ▼
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          background: 'white',
          border: '1px solid #ccc',
          zIndex: 1000
        }}>
          {statusOptions.map(option => (
            <div 
              key={option}
              onClick={() => {
                onStatusChange(targetId, option)
                setIsOpen(false)
              }}
              style={{ padding: '8px', cursor: 'pointer' }}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function TargetsTable() {
  const [data, setData] = useState<Target[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  // Fetch data
  useEffect(() => {
    const fetchTargets = async () => {
      try {
        const response = await fetch('/api/targets')
        const result = await response.json()
        console.log('Fetched targets:', result) // Debug log
        setData(result.targets || [])
      } catch (error) {
        console.error('Error fetching targets:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTargets()
  }, [])

  // Update status in backend
  const updateStatus = async (targetId: string, newStatus: Target['status']) => {
    try {
      const response = await fetch('/api/targets/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetId,
          status: newStatus,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      // Update local state
      setData(prevData =>
        prevData.map(target =>
          target.id === targetId ? { ...target, status: newStatus } : target
        )
      )

      console.log(`Status updated for target ${targetId} to ${newStatus}`)
    } catch (error) {
      console.error('Error updating status:', error)
      // You might want to show an error message to the user here
    }
  }

  // Define columns
  const columns = useMemo<ColumnDef<Target>[]>(
    () => [
      {
        accessorKey: 'owner_name',
        header: 'Name',
      },
      {
        accessorKey: 'company',
        header: 'Company',
      },
      {
        accessorKey: 'property',
        header: 'Property',
      },
      {
        accessorKey: 'city',
        header: 'City',
        filterFn: 'includesString',
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ getValue }) => (
          <a
            href={`mailto:${getValue() as string}`}
            style={{ color: '#2563eb', textDecoration: 'underline' }}
          >
            {getValue() as string}
          </a>
        ),
      },
      {
        accessorKey: 'source',
        header: 'Source',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <StatusDropdown 
            status={row.original.status} 
            targetId={row.original.id}
            onStatusChange={updateStatus}
          />
        ),
        filterFn: 'equals',
      },
    ],
    []
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  // Get unique cities and statuses for filters
  const uniqueCities = useMemo(() => {
    const cities = data.map((item) => item.city).filter(Boolean)
    return [...new Set(cities)].sort()
  }, [data])

  const uniqueStatuses = useMemo(() => {
    const statuses = data.map((item) => item.status)
    return [...new Set(statuses)].sort()
  }, [data])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
        <div style={{ fontSize: '18px' }}>Loading targets...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Targets</h2>
        
        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          {/* City Filter */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="city-filter" style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
              Filter by City
            </label>
            <select
              id="city-filter"
              style={{ 
                padding: '8px 12px', 
                border: '1px solid #d1d5db', 
                borderRadius: '4px',
                outline: 'none'
              }}
              value={(table.getColumn('city')?.getFilterValue() as string) ?? ''}
              onChange={(e) =>
                table.getColumn('city')?.setFilterValue(e.target.value || undefined)
              }
            >
              <option value="">All Cities</option>
              {uniqueCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="status-filter" style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
              Filter by Status
            </label>
            <select
              id="status-filter"
              style={{ 
                padding: '8px 12px', 
                border: '1px solid #d1d5db', 
                borderRadius: '4px',
                outline: 'none'
              }}
              value={(table.getColumn('status')?.getFilterValue() as string) ?? ''}
              onChange={(e) =>
                table.getColumn('status')?.setFilterValue(e.target.value || undefined)
              }
            >
              <option value="">All Statuses</option>
              {uniqueStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'end' }}>
            <button
              onClick={() => table.resetColumnFilters()}
              style={{ 
                padding: '8px 16px', 
                fontSize: '14px', 
                border: '1px solid #d1d5db', 
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
        <table style={{ minWidth: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f9fafb' }}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    style={{
                      padding: '12px 24px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      cursor: 'pointer',
                      userSelect: 'none',
                      borderBottom: '1px solid #e5e7eb'
                    }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </span>
                      <span style={{ color: '#9ca3af' }}>
                        {{
                          asc: '↑',
                          desc: '↓',
                        }[header.column.getIsSorted() as string] ?? '↕'}
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
                    style={{ 
                      padding: '16px 24px', 
                      whiteSpace: 'nowrap', 
                      fontSize: '14px', 
                      color: '#111827' 
                    }}
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            style={{ 
              padding: '4px 12px', 
              fontSize: '14px', 
              border: '1px solid #d1d5db', 
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: table.getCanPreviousPage() ? 'pointer' : 'not-allowed',
              opacity: table.getCanPreviousPage() ? 1 : 0.5
            }}
          >
            {'<<'}
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            style={{ 
              padding: '4px 12px', 
              fontSize: '14px', 
              border: '1px solid #d1d5db', 
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: table.getCanPreviousPage() ? 'pointer' : 'not-allowed',
              opacity: table.getCanPreviousPage() ? 1 : 0.5
            }}
          >
            {'<'}
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            style={{ 
              padding: '4px 12px', 
              fontSize: '14px', 
              border: '1px solid #d1d5db', 
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: table.getCanNextPage() ? 'pointer' : 'not-allowed',
              opacity: table.getCanNextPage() ? 1 : 0.5
            }}
          >
            {'>'}
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            style={{ 
              padding: '4px 12px', 
              fontSize: '14px', 
              border: '1px solid #d1d5db', 
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: table.getCanNextPage() ? 'pointer' : 'not-allowed',
              opacity: table.getCanNextPage() ? 1 : 0.5
            }}
          >
            {'>>'}
          </button>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px' }}>
            Page{' '}
            <strong>
              {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </strong>
          </span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value))
            }}
            style={{ 
              padding: '4px 12px', 
              fontSize: '14px', 
              border: '1px solid #d1d5db', 
              borderRadius: '4px',
              outline: 'none'
            }}
          >
            {[10, 20, 30, 40, 50].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results summary */}
      <div style={{ marginTop: '16px', fontSize: '14px', color: '#6b7280' }}>
        Showing {table.getRowModel().rows.length} of {data.length} targets
      </div>
    </div>
  )
}