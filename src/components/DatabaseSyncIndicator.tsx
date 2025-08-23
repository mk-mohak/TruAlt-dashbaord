import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export function DatabaseSyncIndicator() {
  const { state, syncFromDatabase } = useApp();
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);

  useEffect(() => {
    if (state.isConnectedToDatabase && !state.isLoading) {
      setLastSyncTime(new Date());
      setShowSyncSuccess(true);
      
      const timer = setTimeout(() => {
        setShowSyncSuccess(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [state.isConnectedToDatabase, state.isLoading, state.datasets.length]);

  const handleSync = async () => {
    await syncFromDatabase();
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Connection Status */}
      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
        state.isConnectedToDatabase
          ? 'bg-success-100 dark:bg-success-900/50 text-success-700 dark:text-success-300'
          : 'bg-error-100 dark:bg-error-900/50 text-error-700 dark:text-error-300'
      }`}>
        {state.isConnectedToDatabase ? (
          <Wifi className="h-3 w-3" />
        ) : (
          <WifiOff className="h-3 w-3" />
        )}
        <span>
          {state.isConnectedToDatabase ? 'Connected' : 'Offline'}
        </span>
      </div>

      {/* Sync Button */}
      <button
        onClick={handleSync}
        disabled={state.isLoading}
        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
        title="Sync with database"
      >
        <RefreshCw className={`h-4 w-4 ${state.isLoading ? 'animate-spin' : ''}`} />
      </button>

      {/* Sync Success Indicator */}
      {showSyncSuccess && (
        <div className="flex items-center space-x-1 text-success-600 dark:text-success-400">
          <CheckCircle className="h-4 w-4" />
          <span className="text-xs font-medium">Synced</span>
        </div>
      )}

      {/* Last Sync Time */}
      {lastSyncTime && !state.isLoading && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {lastSyncTime.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}