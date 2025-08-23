import React from 'react';
import { Database, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

interface DatabaseStatusProps {
  className?: string;
}

export function DatabaseStatus({ className = '' }: DatabaseStatusProps) {
  const { state, syncFromDatabase } = useApp();

  const handleRefresh = async () => {
    await syncFromDatabase();
  };

  return (
    <div className={`card ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${
            state.isConnectedToDatabase 
              ? 'bg-success-100 dark:bg-success-900/50' 
              : 'bg-error-100 dark:bg-error-900/50'
          }`}>
            <Database className={`h-5 w-5 ${
              state.isConnectedToDatabase 
                ? 'text-success-600 dark:text-success-400' 
                : 'text-error-600 dark:text-error-400'
            }`} />
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Database Connection
            </h3>
            <div className="flex items-center space-x-2">
              {state.isConnectedToDatabase ? (
                <>
                  <CheckCircle className="h-4 w-4 text-success-500" />
                  <span className="text-sm text-success-600 dark:text-success-400">
                    Connected to Supabase
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-error-500" />
                  <span className="text-sm text-error-600 dark:text-error-400">
                    {state.databaseError || 'Not connected'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={state.isLoading}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          title="Refresh data from database"
        >
          <RefreshCw className={`h-4 w-4 ${state.isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {state.databaseError && (
        <div className="mt-4 p-3 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-700 rounded-lg">
          <p className="text-sm text-error-700 dark:text-error-300">
            <strong>Error:</strong> {state.databaseError}
          </p>
        </div>
      )}

      {state.isConnectedToDatabase && (
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Active Datasets:</span>
            <span className="ml-2 font-medium">{state.activeDatasetIds.length}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Total Records:</span>
            <span className="ml-2 font-medium">{state.data.length.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}