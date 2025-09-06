import React from 'react';
import { Filter, X, Calendar, Users } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

interface GlobalFilterIndicatorProps {
  onOpenFilters: () => void;
  className?: string;
}

export function GlobalFilterIndicator({ onOpenFilters, className = '' }: GlobalFilterIndicatorProps) {
  const { state, clearGlobalFilters } = useApp();
  const { globalFilters } = state;

  const hasActiveFilters = () => {
    return globalFilters.dateRange.fromDate || 
           globalFilters.dateRange.toDate || 
           globalFilters.selectedMonths.length > 0 || 
           globalFilters.selectedBuyerTypes.length > 0;
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (globalFilters.dateRange.fromDate || globalFilters.dateRange.toDate) count++;
    if (globalFilters.selectedMonths.length > 0) count++;
    if (globalFilters.selectedBuyerTypes.length > 0) count++;
    return count;
  };

  if (!hasActiveFilters()) {
    return (
      <button
        onClick={onOpenFilters}
        className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${className}`}
        title="Open global filters"
      >
        <Filter className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Filter Button with Badge */}
      <div className="relative">
        <button
          onClick={onOpenFilters}
          className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-900/70 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
          title="Manage global filters"
        >
          <Filter className="h-5 w-5" />
        </button>
        <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {getActiveFilterCount()}
        </span>
      </div>

      {/* Active Filter Tags */}
      <div className="flex items-center space-x-1 max-w-md overflow-x-auto">
        {globalFilters.dateRange.fromDate && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 whitespace-nowrap">
            <Calendar className="h-3 w-3 mr-1" />
            {new Date(globalFilters.dateRange.fromDate).toLocaleDateString()} - {globalFilters.dateRange.toDate ? new Date(globalFilters.dateRange.toDate).toLocaleDateString() : 'ongoing'}
          </span>
        )}
        
        {globalFilters.selectedMonths.length > 0 && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary-100 dark:bg-secondary-900/50 text-secondary-700 dark:text-secondary-300 whitespace-nowrap">
            <Calendar className="h-3 w-3 mr-1" />
            {globalFilters.selectedMonths.length === 1 
              ? globalFilters.selectedMonths[0]
              : `${globalFilters.selectedMonths.length} months`
            }
          </span>
        )}
        
        {globalFilters.selectedBuyerTypes.length > 0 && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-accent-100 dark:bg-accent-900/50 text-accent-700 dark:text-accent-300 whitespace-nowrap">
            <Users className="h-3 w-3 mr-1" />
            {globalFilters.selectedBuyerTypes.join(', ')}
          </span>
        )}
      </div>

      {/* Clear All Button */}
      <button
        onClick={clearGlobalFilters}
        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        title="Clear all filters"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}