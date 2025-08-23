import React from 'react';
import { FlexibleDataRow } from '../../types';
import { DataProcessor } from '../../utils/dataProcessing';
import { useApp } from '../../contexts/AppContext';
import { DataTable } from '../DataTable';

interface ExplorerTabProps {
  data: FlexibleDataRow[];
}

export function ExplorerTab({ data }: ExplorerTabProps) {
  const { state, getMultiDatasetData } = useApp();
  const multiDatasetData = getMultiDatasetData();
  const isMultiDataset = multiDatasetData.length > 1;

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <p className="text-lg font-medium">No data available</p>
          <p className="text-sm">Upload data to explore your datasets</p>
        </div>
      </div>
    );
  }

  const numericColumns = DataProcessor.findNumericColumns(data);
  const categoricalColumns = DataProcessor.findCategoricalColumns(data);
  const dateColumn = DataProcessor.findDateColumn(data);
  const dateRange = DataProcessor.getDateRange(data);

  // If multiple datasets are active, show separate tables for each
  if (isMultiDataset) {
    return (
      <div className="space-y-8">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Data Explorer - Multiple Datasets
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Browse and search through your datasets. Each dataset is displayed in a separate table below.
            Use the search bar and column filters within each table to find specific data points.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
              <h4 className="font-semibold text-primary-700 dark:text-primary-300">Active Datasets</h4>
              <p className="text-2xl font-bold text-primary-900 dark:text-primary-100">
                {multiDatasetData.length}
              </p>
            </div>
            
            <div className="bg-secondary-50 dark:bg-secondary-900/20 p-4 rounded-lg">
              <h4 className="font-semibold text-secondary-700 dark:text-secondary-300">Total Rows</h4>
              <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                {data.length.toLocaleString()}
              </p>
            </div>
            
            <div className="bg-accent-50 dark:bg-accent-900/20 p-4 rounded-lg">
              <h4 className="font-semibold text-accent-700 dark:text-accent-300">Combined Columns</h4>
              <p className="text-2xl font-bold text-accent-900 dark:text-accent-100">
                {Object.keys(data[0] || {}).length}
              </p>
            </div>
          </div>
        </div>

        {/* Individual Dataset Tables */}
        <div className="space-y-8">
          {multiDatasetData.map((dataset) => (
            <div key={dataset.datasetId} className="card">
              <div className="flex items-center space-x-3 mb-6">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: dataset.color }}
                />
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {dataset.datasetName}
                </h4>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({dataset.data.length.toLocaleString()} rows)
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <DataTable 
                  data={dataset.data} 
                  className="min-w-full"
                  tableId={`table-${dataset.datasetId}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Single dataset view (existing functionality)
  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Data Explorer
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Browse and search through your dataset. Use the search bar and column filters to find specific data points.
          The table is virtualized to handle large datasets efficiently.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
            <h4 className="font-semibold text-primary-700 dark:text-primary-300">Total Rows</h4>
            <p className="text-2xl font-bold text-primary-900 dark:text-primary-100">
              {data.length.toLocaleString()}
            </p>
          </div>
          
          <div className="bg-secondary-50 dark:bg-secondary-900/20 p-4 rounded-lg">
            <h4 className="font-semibold text-secondary-700 dark:text-secondary-300">Columns</h4>
            <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
              {Object.keys(data[0] || {}).length}
            </p>
          </div>
          
          <div className="bg-accent-50 dark:bg-accent-900/20 p-4 rounded-lg">
            <h4 className="font-semibold text-accent-700 dark:text-accent-300">Numeric Columns</h4>
            <p className="text-2xl font-bold text-accent-900 dark:text-accent-100">
              {numericColumns.length}
            </p>
          </div>

          <div className="bg-success-50 dark:bg-success-900/20 p-4 rounded-lg">
            <h4 className="font-semibold text-success-700 dark:text-success-300">Date Range</h4>
            <p className="text-sm font-bold text-success-900 dark:text-success-100">
              {dateRange.start && dateRange.end ? (
                `${dateRange.start} to ${dateRange.end}`
              ) : (
                'No date data'
              )}
            </p>
          </div>
        </div>

        {/* Column Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Numeric Columns</h4>
            <div className="space-y-1">
              {numericColumns.length > 0 ? (
                numericColumns.map(col => (
                  <span key={col} className="inline-block bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded mr-2 mb-1">
                    {col}
                  </span>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No numeric columns detected</p>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Categorical Columns</h4>
            <div className="space-y-1">
              {categoricalColumns.length > 0 ? (
                categoricalColumns.map(col => (
                  <span key={col} className="inline-block bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 text-xs px-2 py-1 rounded mr-2 mb-1">
                    {col}
                  </span>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No categorical columns detected</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <DataTable data={data} className="min-w-full" />
      </div>
    </div>
  );
}