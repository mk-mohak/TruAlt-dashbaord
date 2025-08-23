import React from 'react';
import { Loader, Database } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  type?: 'default' | 'database';
  className?: string;
}

export function LoadingSpinner({ 
  message = 'Loading...', 
  type = 'default',
  className = '' 
}: LoadingSpinnerProps) {
  const Icon = type === 'database' ? Database : Loader;

  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <div className="text-center">
        <Icon className={`h-8 w-8 mx-auto mb-4 ${
          type === 'database' ? 'text-primary-600 dark:text-primary-400 animate-pulse' : 'text-gray-400 animate-spin'
        }`} />
        <p className="text-gray-600 dark:text-gray-400 font-medium">
          {message}
        </p>
        {type === 'database' && (
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Syncing with Supabase database...
          </p>
        )}
      </div>
    </div>
  );
}