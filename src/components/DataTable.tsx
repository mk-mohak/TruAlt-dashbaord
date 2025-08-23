import React, { useState, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Search, SortAsc, SortDesc, Filter } from 'lucide-react';
import { FlexibleDataRow } from '../types';
import { DataProcessor } from '../utils/dataProcessing';
import { useApp } from '../contexts/AppContext';

interface DataTableProps {
  data: FlexibleDataRow[];
  className?: string;
  tableId?: string;
}

interface ColumnConfig {
  key: string;
  label: string;
  width: number;
  sortable: boolean;
  filterable: boolean;
  isNumeric: boolean;
}

interface RowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    filteredData: FlexibleDataRow[];
    columns: ColumnConfig[];
    currency: string;
  };
}

function Row({ index, style, data }: RowProps) {
  const row = data.filteredData[index];
  
  return (
    <div
      style={style}
      className={`flex border-b border-gray-200 dark:border-gray-700 ${
        index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'
      } hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors overflow-hidden`}
    >
      {data.columns.map((column) => {
        const value = row[column.key];
        let displayValue = String(value || '');
        
        if (column.isNumeric && typeof value === 'number') {
          if (column.key.toLowerCase().includes('price') || column.key.toLowerCase().includes('revenue')) {
            displayValue = DataProcessor.formatCurrency(value, data.currency);
          } else {
            displayValue = DataProcessor.formatNumber(value);
          }
        }
        
        return (
          <div
            key={column.key}
            style={{ width: column.width }}
            className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 flex-shrink-0 truncate"
          >
            {displayValue}
          </div>
        );
      })}
    </div>
  );
}

export function DataTable({ data, className = '', tableId = 'data-table' }: DataTableProps) {
  const { state } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  // Generate column configuration dynamically
  const columns: ColumnConfig[] = useMemo(() => {
    if (data.length === 0) return [];
    
    const sampleRow = data[0];
    const numericColumns = DataProcessor.findNumericColumns(data);
    
    return Object.keys(sampleRow).map(key => ({
      key,
      label: key,
      width: key.toLowerCase().includes('address') || key.toLowerCase().includes('adress') ? 250 : 
             key.toLowerCase().includes('name') ? 180 :
             key.toLowerCase().includes('date') ? 120 : 140,
      sortable: true,
      filterable: !key.toLowerCase().includes('address') && !key.toLowerCase().includes('adress'),
      isNumeric: numericColumns.includes(key),
    }));
  }, [data]);

  const filteredAndSortedData = useMemo(() => {
    let filtered = data;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(row =>
        Object.values(row).some(value =>
          String(value || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply column filters
    Object.entries(columnFilters).forEach(([key, value]) => {
      if (value) {
        filtered = filtered.filter(row =>
          String(row[key] || '').toLowerCase().includes(value.toLowerCase())
        );
      }
    });

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        const aString = String(aValue || '').toLowerCase();
        const bString = String(bValue || '').toLowerCase();
        
        if (sortConfig.direction === 'asc') {
          return aString.localeCompare(bString);
        } else {
          return bString.localeCompare(aString);
        }
      });
    }

    return filtered;
  }, [data, searchTerm, sortConfig, columnFilters]);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleColumnFilter = (key: string, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? 
      <SortAsc className="h-4 w-4" /> : 
      <SortDesc className="h-4 w-4" />;
  };

  if (data.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <p className="text-lg font-medium">No data available</p>
            <p className="text-sm">Upload data to view the data explorer</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {tableId === 'data-table' ? 'Data Explorer' : 'Dataset Table'}
        </h3>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-64"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              showFilters ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            aria-label="Toggle column filters"
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Column Filters */}
      {showFilters && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg overflow-x-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {columns.filter(col => col.filterable).map(column => (
              <div key={column.key}>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {column.label}
                </label>
                <input
                  type="text"
                  placeholder={`Filter ${column.label.toLowerCase()}...`}
                  value={columnFilters[column.key] || ''}
                  onChange={(e) => handleColumnFilter(column.key, e.target.value)}
                  className="input-field text-sm"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 overflow-x-auto">
          <div className="flex overflow-x-auto">
            {columns.map((column) => (
              <div
                key={column.key}
                style={{ width: column.width, minWidth: column.width }}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap flex-shrink-0"
              >
                {column.sortable ? (
                  <button
                    onClick={() => handleSort(column.key)}
                    className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:text-gray-700 dark:focus:text-gray-200 whitespace-nowrap"
                  >
                    <span>{column.label}</span>
                    {getSortIcon(column.key)}
                  </button>
                ) : (
                  column.label
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Data Rows */}
        {filteredAndSortedData.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No data matches your current filters
          </div>
        ) : (
          <div className="overflow-x-auto">
            <List
              height={400}
              itemCount={filteredAndSortedData.length}
              itemSize={48}
              itemData={{
                filteredData: filteredAndSortedData,
                columns,
                currency: state.settings.currency
              }}
              width="100%"
              style={{ minWidth: columns.reduce((sum, col) => sum + col.width, 0) }}
            >
              {Row}
            </List>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <div className="overflow-hidden">
          Showing {filteredAndSortedData.length} of {data.length} rows
        </div>
        
        {searchTerm || Object.values(columnFilters).some(Boolean) ? (
          <button
            onClick={() => {
              setSearchTerm('');
              setColumnFilters({});
            }}
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            Clear filters
          </button>
        ) : null}
      </div>
    </div>
  );
}