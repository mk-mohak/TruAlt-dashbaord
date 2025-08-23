import React from 'react';
import { ChevronRight, X } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export function DrillDownBreadcrumb() {
  const { state, clearDrillDownFilters } = useApp();
  
  const drillDownFilters = state.filters.drillDownFilters;
  const hasFilters = Object.keys(drillDownFilters).length > 0;

  if (!hasFilters) return null;

  return (
    <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700 rounded-lg p-3 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-primary-700 dark:text-primary-300 font-medium">
            Drill-down active:
          </span>
          <div className="flex items-center space-x-1">
            {Object.entries(drillDownFilters).map(([key, value], index) => (
              <React.Fragment key={key}>
                {index > 0 && <ChevronRight className="h-3 w-3 text-primary-500" />}
                <span className="bg-primary-100 dark:bg-primary-800 text-primary-800 dark:text-primary-200 px-2 py-1 rounded text-xs font-medium">
                  {key}: {value}
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>
        
        <button
          onClick={clearDrillDownFilters}
          className="flex items-center space-x-1 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          title="Clear drill-down filters"
        >
          <X className="h-4 w-4" />
          <span className="text-sm">Clear</span>
        </button>
      </div>
    </div>
  );
}