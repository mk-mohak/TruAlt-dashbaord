import React, { useState } from 'react';
import { ApexOptions } from 'apexcharts';
import Chart from 'react-apexcharts';
import { DataRow } from '../../types';
import { DataProcessor } from '../../utils/dataProcessing';
import { ChartContainer } from './ChartContainer';
import { useApp } from '../../contexts/AppContext';

interface FactoryPerformanceChartProps {
  data: DataRow[];
  isDarkMode?: boolean;
  enableDrillDown?: boolean;
}

export function FactoryPerformanceChart({
  data,
  isDarkMode = false,
  enableDrillDown = true,
}: FactoryPerformanceChartProps) {
  const { addDrillDownFilter, state, getMultiDatasetData } = useApp();
  const [chartType, setChartType] = useState<'bar' | 'horizontal'>('bar');
  const isHorizontal = chartType === 'horizontal';

  const multiDatasetData = getMultiDatasetData();
  const isMultiDataset = multiDatasetData.length > 1;

  const factoryData = DataProcessor.aggregateByFactory(data);
  
  if (factoryData.length === 0) {
    return (
      <ChartContainer
        title="Factory Performance"
        onChartTypeChange={(type) => setChartType(type as 'bar' | 'horizontal')}
        availableTypes={['bar', 'horizontal']}
        currentType={chartType}
      >
        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
          No factory data available
        </div>
      </ChartContainer>
    );
  }
  
  // For multi-dataset mode, show individual charts for each dataset
  if (isMultiDataset) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Factory Performance - Individual Dataset Views
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {multiDatasetData.length} datasets active
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {multiDatasetData.map((dataset) => (
            <IndividualFactoryChart
              key={dataset.datasetId}
              data={dataset.data}
              title={dataset.datasetName}
              chartType={chartType}
              isDarkMode={isDarkMode}
              color={dataset.color}
              currency={state.settings.currency}
              enableDrillDown={enableDrillDown}
              addDrillDownFilter={addDrillDownFilter}
            />
          ))}
        </div>
      </div>
    );
  }

  // Single dataset chart
  const categories = factoryData.map((f) => f.name);
  const series = [{
    name: 'Revenue',
    data: factoryData.map((f) => f.totalRevenue),
    color: '#3b82f6'
  }];

  const chartOptions: ApexOptions = {
    chart: {
      id: 'factory-performance',
      type: 'bar',
      toolbar: { show: false },
      background: 'transparent',
      stacked: false,
      events: enableDrillDown ? {
        dataPointSelection: (event: any, chartContext: any, config: any) => {
          const factoryName = categories[config.dataPointIndex];
          addDrillDownFilter('FactoryName', factoryName);
        },
      } : {},
    },
    plotOptions: {
      bar: {
        horizontal: isHorizontal,
        borderRadius: 8,
        columnWidth: '70%',
        dataLabels: { 
          position: isHorizontal ? 'center' : 'top' 
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: categories,
      labels: {
        style: { colors: isDarkMode ? '#9ca3af' : '#6b7280' },
        formatter: isHorizontal
          ? (value: string) => DataProcessor.formatCurrency(Number(value), state.settings.currency)
          : undefined,
      },
    },
    yaxis: {
      labels: {
        style: { colors: isDarkMode ? '#9ca3af' : '#6b7280' },
        formatter: !isHorizontal ? (val: number) => DataProcessor.formatCurrency(val, state.settings.currency) : undefined,
      },
    },
    colors: ['#3b82f6'],
    theme: { mode: isDarkMode ? 'dark' : 'light' },
    grid: { borderColor: isDarkMode ? '#374151' : '#e5e7eb' },
    legend: { show: false },
    tooltip: {
      theme: isDarkMode ? 'dark' : 'light',
      custom: ({ dataPointIndex }: any) => {
        if (dataPointIndex === undefined || !factoryData[dataPointIndex]) return '';
        
        const factoryName = categories[dataPointIndex];
        const factory = factoryData[dataPointIndex];
        
        return `
          <div style="padding: 12px; background: ${isDarkMode ? '#1f2937' : '#ffffff'}; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="font-weight: 600; color: ${isDarkMode ? '#f3f4f6' : '#374151'}; margin-bottom: 8px;">
              ${factoryName}
            </div>
            <div style="margin-bottom: 6px;">
              <span style="color: ${isDarkMode ? '#9ca3af' : '#6b7280'};">Revenue: </span>
              <span style="font-weight: 600; color: #3b82f6;">
                ${DataProcessor.formatCurrency(factory.totalRevenue, state.settings.currency)}
              </span>
            </div>
          </div>
        `;
      },
    },
    responsive: [{
      breakpoint: 768,
      options: {
        plotOptions: {
          bar: {
            horizontal: true,
          }
        }
      }
    }]
  };

  return (
    <ChartContainer
      title="Factory Performance"
      onChartTypeChange={(type) => setChartType(type as 'bar' | 'horizontal')}
      availableTypes={['bar', 'horizontal']}
      currentType={chartType}
    >
      <Chart
        options={chartOptions}
        series={series}
        type="bar"
        height="100%"
      />
    </ChartContainer>
  );
}

// Individual Factory Chart Component
interface IndividualFactoryChartProps {
  data: FlexibleDataRow[];
  title: string;
  chartType: 'bar' | 'horizontal';
  isDarkMode: boolean;
  color: string;
  currency: string;
  enableDrillDown: boolean;
  addDrillDownFilter: (key: string, value: any) => void;
}

function IndividualFactoryChart({
  data,
  title,
  chartType,
  isDarkMode,
  color,
  currency,
  enableDrillDown,
  addDrillDownFilter
}: IndividualFactoryChartProps) {
  const factoryData = DataProcessor.aggregateByFactory(data);
  
  if (factoryData.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center space-x-3 mb-4">
          <div 
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: color }}
          />
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h4>
        </div>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <p className="text-sm">No factory data available</p>
        </div>
      </div>
    );
  }

  const isHorizontal = chartType === 'horizontal';
  const categories = factoryData.map(f => f.name);

  const chartOptions: ApexOptions = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      background: 'transparent',
      events: enableDrillDown ? {
        dataPointSelection: (event: any, chartContext: any, config: any) => {
          const factoryName = categories[config.dataPointIndex];
          addDrillDownFilter('FactoryName', factoryName);
        },
      } : {},
    },
    plotOptions: {
      bar: {
        horizontal: isHorizontal,
        borderRadius: 4,
        columnWidth: '70%',
        dataLabels: { position: isHorizontal ? 'center' : 'top' }
      }
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories,
      labels: {
        style: { colors: isDarkMode ? '#9ca3af' : '#6b7280' },
        formatter: isHorizontal
          ? (value: string) => DataProcessor.formatCurrency(Number(value), currency)
          : undefined,
      }
    },
    yaxis: {
      labels: {
        style: { colors: isDarkMode ? '#9ca3af' : '#6b7280' },
        formatter: !isHorizontal ? (val: number) => DataProcessor.formatCurrency(val, currency) : undefined,
      }
    },
    colors: [color],
    theme: { mode: isDarkMode ? 'dark' : 'light' },
    grid: { borderColor: isDarkMode ? '#374151' : '#e5e7eb' },
    tooltip: {
      theme: isDarkMode ? 'dark' : 'light',
      y: {
        formatter: (val: number) => DataProcessor.formatCurrency(val, currency)
      }
    }
  };

  const series = [{
    name: 'Revenue',
    data: factoryData.map(f => f.totalRevenue),
    color
  }];

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div 
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: color }}
          />
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h4>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {data.length} records
        </div>
      </div>
      
      <div className="h-80">
        <Chart
          options={chartOptions}
          series={series}
          type="bar"
          height="100%"
        />
      </div>
    </div>
  );
}