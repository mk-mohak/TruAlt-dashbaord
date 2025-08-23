import React, { useState } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { Database } from 'lucide-react';
import { FlexibleDataRow } from '../../types';
import { DataProcessor } from '../../utils/dataProcessing';
import { ChartContainer } from '../charts/ChartContainer';
import { useApp } from '../../contexts/AppContext';

interface ComparisonTabProps {
  data: FlexibleDataRow[];
}

export function ComparisonTab({ data }: ComparisonTabProps) {
  const { state, getMultiDatasetData } = useApp();
  const isDarkMode = state.settings.theme === 'dark';
  const multiDatasetData = getMultiDatasetData();
  const isMultiDataset = multiDatasetData.length > 1;

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <p className="text-lg font-medium">No data available</p>
          <p className="text-sm">Upload data to view comparisons</p>
        </div>
      </div>
    );
  }

  const categoricalColumns = DataProcessor.findCategoricalColumns(data);
  const numericColumns = DataProcessor.findNumericColumns(data);
  
  const primaryCategoryColumn = categoricalColumns.find(col =>
    col.toLowerCase().includes('name') ||
    col.toLowerCase().includes('product') ||
    col.toLowerCase().includes('category')
  ) || categoricalColumns[0];

  const primaryValueColumn = numericColumns.find(col => 
    col.toLowerCase().includes('price') || 
    col.toLowerCase().includes('revenue') ||
    col.toLowerCase().includes('quantity') ||
    col.toLowerCase().includes('amount')
  ) || numericColumns[0];

  if (!primaryCategoryColumn || !primaryValueColumn) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <p className="text-lg font-medium">Insufficient data for comparison</p>
          <p className="text-sm">Need both categorical and numeric columns</p>
        </div>
      </div>
    );
  }

  const uniqueCategories = DataProcessor.getUniqueValues(data, primaryCategoryColumn);
  const aggregatedData = DataProcessor.aggregateByCategory(data, primaryCategoryColumn, primaryValueColumn);

  const filteredData = selectedCategories.length > 0
    ? aggregatedData.filter(item => selectedCategories.includes(item.name))
    : aggregatedData.slice(0, isMultiDataset ? 8 : 5);

  // Comparison chart options
  const comparisonOptions: ApexOptions = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      background: 'transparent',
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '70%',
        borderRadius: 4,
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: filteredData.map(item => item.name),
      labels: {
        style: { colors: isDarkMode ? '#9ca3af' : '#6b7280' },
      },
    },
    yaxis: {
      labels: {
        formatter: (val: number) => DataProcessor.formatCurrency(val, state.settings.currency),
        style: { colors: isDarkMode ? '#9ca3af' : '#6b7280' },
      },
    },
    colors: ['#3b82f6', '#22c55e', '#f97316', '#ef4444', '#8b5cf6'],
    theme: { mode: isDarkMode ? 'dark' : 'light' },
    grid: { borderColor: isDarkMode ? '#374151' : '#e5e7eb' },
    tooltip: {
      theme: isDarkMode ? 'dark' : 'light',
      y: {
        formatter: (val: number) => DataProcessor.formatCurrency(val, state.settings.currency),
      },
    },
  };

  const comparisonSeries = [{
    name: primaryValueColumn,
    data: filteredData.map(item => item.total),
  }];

  // Radar chart for multi-metric comparison
  const radarOptions: ApexOptions = {
    chart: { type: 'radar', background: 'transparent' },
    xaxis: {
      categories: ['Total Value', 'Count', 'Average'],
      labels: { style: { colors: isDarkMode ? '#9ca3af' : '#6b7280' } },
    },
    yaxis: { show: false },
    colors: ['#3b82f6', '#22c55e', '#f97316', '#ef4444', '#8b5cf6'],
    theme: { mode: isDarkMode ? 'dark' : 'light' },
    legend: { labels: { colors: isDarkMode ? '#9ca3af' : '#6b7280' } },
  };

  const maxTotal = Math.max(...filteredData.map(item => item.total));
  const maxCount = Math.max(...filteredData.map(item => item.count));
  const maxAverage = Math.max(...filteredData.map(item => item.average));

  const radarSeries = filteredData.map(item => ({
    name: item.name,
    data: [
      (item.total / maxTotal) * 100,
      (item.count / maxCount) * 100,
      (item.average / maxAverage) * 100,
    ],
  }));

  return (
    <div className="space-y-8">
      {/* Multi-dataset indicator */}
      {isMultiDataset && (
        <div className="card bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-800 rounded-lg">
              <Database className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 className="font-semibold text-primary-900 dark:text-primary-100">
                Multi-Dataset Comparison Mode
              </h3>
              <p className="text-sm text-primary-700 dark:text-primary-300">
                Comparing data across {multiDatasetData.length} active datasets
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Category selection */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Select {primaryCategoryColumn} to Compare
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {uniqueCategories.slice(0, 20).map((category) => (
            <label key={category} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedCategories.includes(category)}
                onChange={(e) =>
                  e.target.checked
                    ? setSelectedCategories([...selectedCategories, category])
                    : setSelectedCategories(selectedCategories.filter((c) => c !== category))
                }
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                {category}
              </span>
            </label>
          ))}
        </div>
        {selectedCategories.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Showing top {isMultiDataset ? 8 : 5} categories by default. Select categories above to customize comparison.
          </p>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {filteredData.map((item) => (
          <div key={item.name} className="card">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                {item.name}
              </h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-xs text-gray-600 dark:text-gray-400">Total Value</p>
                <p className="text-sm font-bold text-primary-600 dark:text-primary-400 break-words">
                  {DataProcessor.formatCurrency(item.total, state.settings.currency)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-600 dark:text-gray-400">Count</p>
                <p className="text-sm font-bold text-secondary-600 dark:text-secondary-400">
                  {DataProcessor.formatNumber(item.count)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-600 dark:text-gray-400">Average</p>
                <p className="text-sm font-bold text-accent-600 dark:text-accent-400 break-words">
                  {DataProcessor.formatCurrency(item.average, state.settings.currency)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-600 dark:text-gray-400">Share</p>
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  {((item.total / aggregatedData.reduce((sum, d) => sum + d.total, 0)) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="space-y-8">
        <ChartContainer title={`${primaryValueColumn} by ${primaryCategoryColumn}`} className="w-full">
          <Chart options={comparisonOptions} series={comparisonSeries} type="bar" height="100%" />
        </ChartContainer>

        <ChartContainer title="Multi-Metric Comparison" className="w-full">
          <Chart options={radarOptions} series={radarSeries} type="radar" height="100%" />
        </ChartContainer>
      </div>
    </div>
  );
}