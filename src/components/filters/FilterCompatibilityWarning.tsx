import React from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';
import { GlobalFilterState } from '../../types/filters';

interface FilterCompatibilityWarningProps {
  warnings: string[];
  resultCount: number;
  totalCount: number;
  onDismiss?: () => void;
  className?: string;
}

export function FilterCompatibilityWarning({ 
  warnings, 
  resultCount, 
  totalCount, 
  onDismiss,
  className = '' 
}: FilterCompatibilityWarningProps) {
  if (warnings.length === 0 && resultCount > 0) return null;

  const isNoResults = resultCount === 0 && totalCount > 0;
  const hasWarnings = warnings.length > 0;

  return (
    <div className={`rounded-lg p-4 ${className} ${
      isNoResults 
        ? 'bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-700'
        : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
    }`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {isNoResults ? (
            <AlertTriangle className="h-5 w-5 text-warning-600 dark:text-warning-400" />
          ) : (
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          )}
        </div>
        
        <div className="flex-1">
          <h4 className={`font-medium ${
            isNoResults 
              ? 'text-warning-700 dark:text-warning-300'
              : 'text-blue-700 dark:text-blue-300'
          }`}>
            {isNoResults ? 'No Results Found' : 'Filter Information'}
          </h4>
          
          <div className={`mt-1 text-sm ${
            isNoResults 
              ? 'text-warning-600 dark:text-warning-400'
              : 'text-blue-600 dark:text-blue-400'
          }`}>
            {isNoResults ? (
              <p>
                Your current filter combination returns no data from the active dataset(s). 
                Try adjusting your filter criteria or switching to a different dataset.
              </p>
            ) : (
              <p>
                Showing {resultCount.toLocaleString()} of {totalCount.toLocaleString()} records 
                ({((resultCount / totalCount) * 100).toFixed(1)}% of total data)
              </p>
            )}
            
            {hasWarnings && (
              <div className="mt-2">
                <p className="font-medium">Compatibility Notes:</p>
                <ul className="list-disc list-inside space-y-1">
                  {warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}