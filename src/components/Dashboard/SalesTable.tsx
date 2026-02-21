'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { SalesRecord } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/format';

interface SalesTableProps {
  data: SalesRecord[];
}

type SortField = 'date' | 'storeName' | 'saleValue';
type SortDirection = 'asc' | 'desc';

const PRODUCT_BADGES: { key: keyof SalesRecord; label: string; color: string }[] = [
  { key: 'paanL', label: 'Paan L', color: 'bg-green-900/40 text-green-300' },
  { key: 'thandaiL', label: 'Thandai L', color: 'bg-purple-900/40 text-purple-300' },
  { key: 'giloriL', label: 'Gilori L', color: 'bg-pink-900/40 text-pink-300' },
  { key: 'paanS', label: 'Paan S', color: 'bg-green-900/30 text-green-400' },
  { key: 'thandaiS', label: 'Thandai S', color: 'bg-purple-900/30 text-purple-400' },
  { key: 'giloriS', label: 'Gilori S', color: 'bg-pink-900/30 text-pink-400' },
  { key: 'heritageBox9', label: 'Gift (9)', color: 'bg-amber-900/40 text-amber-300' },
  { key: 'heritageBox15', label: 'Gift (15)', color: 'bg-amber-900/30 text-amber-400' },
];

export default function SalesTable({ data }: SalesTableProps) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAndSortedData = useMemo(() => {
    let filtered = data;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = data.filter(
        (record) =>
          record.storeName.toLowerCase().includes(term) ||
          record.location.toLowerCase().includes(term) ||
          record.date.includes(term)
      );
    }

    return [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date':
          comparison = a.date.localeCompare(b.date);
          break;
        case 'storeName':
          comparison = a.storeName.localeCompare(b.storeName);
          break;
        case 'saleValue':
          comparison = a.saleValue - b.saleValue;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortField, sortDirection, searchTerm]);

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const paginatedData = filteredAndSortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  return (
    <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-surface-border">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-semibold text-white">Sales Records</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by store or date..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-4 py-2 bg-surface-card-hover border border-surface-border-light rounded-lg text-white placeholder-gray-500 text-sm focus:ring-1 focus:ring-brand-gold focus:border-transparent outline-none"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-surface-border">
          <thead className="bg-surface-card-hover">
            <tr>
              {[
                { field: 'date' as SortField, label: 'Date', align: 'text-left' },
                { field: 'storeName' as SortField, label: 'Store', align: 'text-left' },
                { field: null, label: 'Products', align: 'text-left' },
                { field: 'saleValue' as SortField, label: 'Sale Value', align: 'text-right' },
              ].map(({ field, label, align }) => (
                <th
                  key={label}
                  className={`px-6 py-3 ${align} text-xs font-medium text-gray-400 uppercase tracking-wider ${field ? 'cursor-pointer hover:text-gray-200' : ''}`}
                  onClick={field ? () => handleSort(field) : undefined}
                >
                  <div className={`flex items-center ${align === 'text-right' ? 'justify-end' : ''} gap-1`}>
                    <span>{label}</span>
                    {field && <SortIcon field={field} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {paginatedData.map((record) => {
              const hasProducts = PRODUCT_BADGES.some(
                ({ key }) => (record[key] as number) > 0
              );

              return (
                <tr key={record.id} className="hover:bg-surface-card-hover transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {formatDate(record.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{record.storeName}</div>
                    <div className="text-xs text-gray-500">{record.location}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex flex-wrap gap-1">
                      {PRODUCT_BADGES.map(({ key, label, color }) =>
                        (record[key] as number) > 0 ? (
                          <span key={key} className={`px-2 py-0.5 rounded text-xs ${color}`}>
                            {label}: {record[key] as number}
                          </span>
                        ) : null
                      )}
                      {!hasProducts && (
                        <span className="text-gray-600 italic">No products</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-white">
                    {formatCurrency(record.saleValue)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-surface-border flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredAndSortedData.length)} of{' '}
            {filteredAndSortedData.length} records
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-surface-card-hover border border-surface-border-light rounded text-sm text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-surface-card-hover border border-surface-border-light rounded text-sm text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
