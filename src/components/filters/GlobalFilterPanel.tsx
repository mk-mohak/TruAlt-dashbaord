import React, { useState, useEffect, useRef } from 'react';
import { Filter, Calendar, Users, X, ChevronDown, Search } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { GlobalFilterState } from '../../types/filters';

interface GlobalFilterPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const BUYER_TYPES = ['B2B', 'B2C'];

export function GlobalFilterPanel({ isOpen, onToggle, className = '' }: GlobalFilterPanelProps) {
  const { state, setGlobalFilters, clearGlobalFilters, getFilteredDataCount } = useApp();
  const [tempFilters, setTempFilters] = useState<GlobalFilterState>(state.globalFilters);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showBuyerTypeDropdown, setShowBuyerTypeDropdown] = useState(false);
  
  const monthDropdownRef = useRef<HTMLDivElement>(null);
  const buyerTypeDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(event.target as Node)) {
        setShowMonthDropdown(false);
      }
      if (buyerTypeDropdownRef.current && !buyerTypeDropdownRef.current.contains(event.target as Node)) {
        setShowBuyerTypeDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync temp filters with global state when panel opens
  useEffect(() => {
    if (isOpen) {
      setTempFilters(state.globalFilters);
    }
  }, [isOpen, state.globalFilters]);

  const handleDateRangeChange = (field: 'fromDate' | 'toDate', value: string) => {
    setTempFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [field]: value
      }
    }));
  };

  const handleMonthToggle = (month: string) => {
    setTempFilters(prev => ({
      ...prev,
      selectedMonths: prev.selectedMonths.includes(month)
        ? prev.selectedMonths.filter(m => m !== month)
        : [...prev.selectedMonths, month]
    }));
  };

  const handleBuyerTypeToggle = (buyerType: string) => {
    setTempFilters(prev => ({
      ...prev,
      selectedBuyerTypes: prev.selectedBuyerTypes.includes(buyerType)
        ? prev.selectedBuyerTypes.filter(bt => bt !== buyerType)
        : [...prev.selectedBuyerTypes, buyerType]
    }));
  };

  const applyFilters = () => {
    setGlobalFilters(tempFilters);
    onToggle();
  };

  const clearFilters = () => {
    const emptyFilters: GlobalFilterState = {
      dateRange: { fromDate: '', toDate: '' },
      selectedMonths: [],
      selectedBuyerTypes: []
    };
    setTempFilters(emptyFilters);
    clearGlobalFilters();
  };

  const hasActiveFilters = () => {
    return tempFilters.dateRange.fromDate || 
           tempFilters.dateRange.toDate || 
           tempFilters.selectedMonths.length > 0 || 
           tempFilters.selectedBuyerTypes.length > 0;
  };

  const getFilteredCount = () => {
    return getFilteredDataCount(tempFilters);
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 pt-20 ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Filter className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Global Filters
            </h2>
          </div>
          <button
            onClick={onToggle}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Filter Preview */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  Filter Preview
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {getFilteredCount()} records will be shown after applying filters
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Available: {state.data.length.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Date Range Filter */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Calendar className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Custom Date Range
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={tempFilters.dateRange.fromDate}
                  onChange={(e) => handleDateRangeChange('fromDate', e.target.value)}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={tempFilters.dateRange.toDate}
                  onChange={(e) => handleDateRangeChange('toDate', e.target.value)}
                  className="input-field w-full"
                />
              </div>
            </div>
            {tempFilters.dateRange.fromDate && tempFilters.dateRange.toDate && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Range: {new Date(tempFilters.dateRange.fromDate).toLocaleDateString()} - {new Date(tempFilters.dateRange.toDate).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Month Filter */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Calendar className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Month Filter
              </label>
            </div>
            <div className="relative" ref={monthDropdownRef}>
              <button
                onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                className="input-field w-full flex items-center justify-between text-left"
              >
                <span className="text-gray-900 dark:text-gray-100">
                  {tempFilters.selectedMonths.length === 0 
                    ? 'Select months...' 
                    : `${tempFilters.selectedMonths.length} month${tempFilters.selectedMonths.length > 1 ? 's' : ''} selected`
                  }
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showMonthDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showMonthDropdown && (
                <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10 max-h-60 overflow-y-auto">
                  <div className="p-2">
                    <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-600">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Select Months
                      </span>
                      <button
                        onClick={() => setTempFilters(prev => ({ ...prev, selectedMonths: [] }))}
                        className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1 mt-2">
                      {MONTHS.map(month => (
                        <label
                          key={month}
                          className="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={tempFilters.selectedMonths.includes(month)}
                            onChange={() => handleMonthToggle(month)}
                            className="rounded border-gray-300 text-secondary-600 focus:ring-secondary-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {month}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            {tempFilters.selectedMonths.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {tempFilters.selectedMonths.map(month => (
                  <span
                    key={month}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary-100 dark:bg-secondary-900/50 text-secondary-700 dark:text-secondary-300"
                  >
                    {month}
                    <button
                      onClick={() => handleMonthToggle(month)}
                      className="ml-1 hover:text-secondary-900 dark:hover:text-secondary-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Buyer Type Filter */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Users className="h-5 w-5 text-accent-600 dark:text-accent-400" />
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Buyer Type Filter
              </label>
            </div>
            <div className="relative" ref={buyerTypeDropdownRef}>
              <button
                onClick={() => setShowBuyerTypeDropdown(!showBuyerTypeDropdown)}
                className="input-field w-full flex items-center justify-between text-left"
              >
                <span className="text-gray-900 dark:text-gray-100">
                  {tempFilters.selectedBuyerTypes.length === 0 
                    ? 'Select buyer types...' 
                    : `${tempFilters.selectedBuyerTypes.length} type${tempFilters.selectedBuyerTypes.length > 1 ? 's' : ''} selected`
                  }
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showBuyerTypeDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showBuyerTypeDropdown && (
                <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                  <div className="p-2">
                    <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-600">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Select Buyer Types
                      </span>
                      <button
                        onClick={() => setTempFilters(prev => ({ ...prev, selectedBuyerTypes: [] }))}
                        className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="space-y-1 mt-2">
                      {BUYER_TYPES.map(buyerType => (
                        <label
                          key={buyerType}
                          className="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={tempFilters.selectedBuyerTypes.includes(buyerType)}
                            onChange={() => handleBuyerTypeToggle(buyerType)}
                            className="rounded border-gray-300 text-accent-600 focus:ring-accent-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {buyerType}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            {tempFilters.selectedBuyerTypes.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {tempFilters.selectedBuyerTypes.map(buyerType => (
                  <span
                    key={buyerType}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-accent-100 dark:bg-accent-900/50 text-accent-700 dark:text-accent-300"
                  >
                    {buyerType}
                    <button
                      onClick={() => handleBuyerTypeToggle(buyerType)}
                      className="ml-1 hover:text-accent-900 dark:hover:text-accent-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Filter Summary */}
          {hasActiveFilters() && (
            <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700 rounded-lg p-4">
              <h4 className="font-medium text-primary-700 dark:text-primary-300 mb-2">
                Active Filters Summary
              </h4>
              <div className="space-y-1 text-sm text-primary-600 dark:text-primary-400">
                {tempFilters.dateRange.fromDate && (
                  <p>• Date range: {new Date(tempFilters.dateRange.fromDate).toLocaleDateString()} - {tempFilters.dateRange.toDate ? new Date(tempFilters.dateRange.toDate).toLocaleDateString() : 'ongoing'}</p>
                )}
                {tempFilters.selectedMonths.length > 0 && (
                  <p>• Months: {tempFilters.selectedMonths.join(', ')}</p>
                )}
                {tempFilters.selectedBuyerTypes.length > 0 && (
                  <p>• Buyer Types: {tempFilters.selectedBuyerTypes.join(', ')}</p>
                )}
              </div>
            </div>
          )}

          {/* No Results Warning */}
          {hasActiveFilters() && getFilteredCount() === 0 && (
            <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-700 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Search className="h-5 w-5 text-warning-600 dark:text-warning-400" />
                <div>
                  <h4 className="font-medium text-warning-700 dark:text-warning-300">
                    No Results Found
                  </h4>
                  <p className="text-sm text-warning-600 dark:text-warning-400">
                    The current filter combination returns no data. Try adjusting your filters.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <button
            onClick={clearFilters}
            className="btn-secondary flex items-center space-x-2"
            disabled={!hasActiveFilters()}
          >
            <X className="h-4 w-4" />
            <span>Clear All</span>
          </button>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onToggle}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={applyFilters}
              className="btn-primary flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>Apply Filters</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}