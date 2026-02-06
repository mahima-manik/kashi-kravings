'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { SalesRecord } from '@/lib/types';

interface SalesTableProps {
  data: SalesRecord[];
}

type SortField = 'date' | 'storeName' | 'saleValue' | 'collectionReceived';
type SortDirection = 'asc' | 'desc';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

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
        case 'collectionReceived':
          comparison = a.collectionReceived - b.collectionReceived;
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Sales Records</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by store or date..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-chocolate-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center space-x-1">
                  <span>Date</span>
                  <SortIcon field="date" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('storeName')}
              >
                <div className="flex items-center space-x-1">
                  <span>Store</span>
                  <SortIcon field="storeName" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Products
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('saleValue')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Sale Value</span>
                  <SortIcon field="saleValue" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('collectionReceived')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Collection</span>
                  <SortIcon field="collectionReceived" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((record) => {
              const totalUnits =
                record.paanL +
                record.thandaiL +
                record.giloriL +
                record.paanS +
                record.thandaiS +
                record.giloriS +
                record.heritageBox9 +
                record.heritageBox15;

              return (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(record.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {record.storeName}
                    </div>
                    <div className="text-xs text-gray-500">{record.location}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="flex flex-wrap gap-1">
                      {record.paanL > 0 && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">
                          Paan L: {record.paanL}
                        </span>
                      )}
                      {record.thandaiL > 0 && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs">
                          Thandai L: {record.thandaiL}
                        </span>
                      )}
                      {record.giloriL > 0 && (
                        <span className="px-2 py-0.5 bg-pink-100 text-pink-800 rounded text-xs">
                          Gilori L: {record.giloriL}
                        </span>
                      )}
                      {record.paanS > 0 && (
                        <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">
                          Paan S: {record.paanS}
                        </span>
                      )}
                      {record.thandaiS > 0 && (
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">
                          Thandai S: {record.thandaiS}
                        </span>
                      )}
                      {record.giloriS > 0 && (
                        <span className="px-2 py-0.5 bg-pink-50 text-pink-700 rounded text-xs">
                          Gilori S: {record.giloriS}
                        </span>
                      )}
                      {record.heritageBox9 > 0 && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs">
                          Gift (9): {record.heritageBox9}
                        </span>
                      )}
                      {record.heritageBox15 > 0 && (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs">
                          Gift (15): {record.heritageBox15}
                        </span>
                      )}
                      {totalUnits === 0 && (
                        <span className="text-gray-400 italic">No products</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                    {formatCurrency(record.saleValue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <span
                      className={
                        record.collectionReceived >= record.saleValue
                          ? 'text-green-600 font-medium'
                          : 'text-amber-600'
                      }
                    >
                      {formatCurrency(record.collectionReceived)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredAndSortedData.length)} of{' '}
            {filteredAndSortedData.length} records
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
