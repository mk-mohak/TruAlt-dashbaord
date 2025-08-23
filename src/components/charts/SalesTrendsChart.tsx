import React, { useState } from 'react';
import { ApexOptions } from 'apexcharts';
import { DataRow } from '../../types';
import { DataProcessor } from '../../utils/dataProcessing';
import { ChartContainer } from './ChartContainer';
import Chart from 'react-apexcharts';
import { useApp } from '../../contexts/AppContext';

interface SalesTrendsChartProps {
  data: DataRow[];
  isDarkMode?: boolean;
}

export function SalesTrendsChart({ data, isDarkMode = false }: SalesTrendsChartProps) {
  const { state, getMultiDatasetData } = useApp();
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('line');
  
  const multiDatasetData = getMultiDatasetData();
  const isMultiDataset = multiDatasetData.length > 1;
  
  const timeSeriesData = DataProcessor.getTimeSeries(data, 'month');
  
  // Return placeholder if no data is available
  if (!data || data.length === 0 || !timeSeriesData || timeSeriesData.length === 0) {
    return (
      <ChartContainer
        title="Sales Trends Over Time"
        onChartTypeChange={(type) => setChartType(type as 'line' | 'area' | 'bar')}
        availableTypes={['line', 'area', 'bar']}
        currentType={chartType}
      >
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <p className="text-lg font-medium">No data available</p>
            <p className="text-sm">Upload data to view sales trends</p>
          </div>
        </div>
      </ChartContainer>
    );
  }

  // For multi-dataset mode, combine all datasets into one time series chart
  // This is different from other charts because time series comparison is meaningful
  const prepareTimeSeriesData = () => {
    if (!isMultiDataset) {
      return {
        categories: timeSeriesData.map(point => {
          const date = new Date(point.date + '-01');
          return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }),
        series: [{
          name: 'Revenue',
          data: timeSeriesData.map(point => point.revenue),
          color: '#3b82f6'
        }]
      };
    }

    // For multi-dataset, create series for each dataset
    const allDates = new Set<string>();
    const datasetSeries: any[] = [];

    multiDatasetData.forEach(dataset => {
      const datasetTimeSeries = DataProcessor.getTimeSeries(dataset.data, 'month');
      datasetTimeSeries.forEach(point => allDates.add(point.date));
    });

    const sortedDates = Array.from(allDates).sort();

    multiDatasetData.forEach(dataset => {
      const datasetTimeSeries = DataProcessor.getTimeSeries(dataset.data, 'month');
      const timeSeriesMap = new Map(datasetTimeSeries.map(point => [point.date, point.revenue]));
      
      datasetSeries.push({
        name: dataset.datasetName,
        data: sortedDates.map(date => timeSeriesMap.get(date) || 0),
        color: dataset.color
      });
    });

    return {
      categories: sortedDates.map(date => {
        const dateObj = new Date(date + '-01');
        return dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }),
      series: datasetSeries
    };
  };

  const { categories, series } = prepareTimeSeriesData();

  const chartOptions: ApexOptions = {
    chart: {
      type: chartType,
      toolbar: {
        show: false,
      },
      background: 'transparent',
      zoom: {
        enabled: true,
      },
    },
    stroke: {
      curve: 'smooth',
      width: chartType === 'line' ? 3 : 0,
    },
    fill: {
      type: chartType === 'area' ? 'gradient' : 'solid',
      gradient: {
        shadeIntensity: 1,
        type: 'vertical',
        colorStops: [
          {
            offset: 0,
            color: '#3b82f6',
            opacity: 0.8
          },
          {
            offset: 100,
            color: '#3b82f6',
            opacity: 0.1
          }
        ]
      }
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: categories,
      labels: {
        style: {
          colors: isDarkMode ? '#9ca3af' : '#6b7280',
        },
      },
    },
    yaxis: {
      labels: {
        formatter: (val: number) => DataProcessor.formatCurrency(val, state.settings.currency),
        style: {
          colors: isDarkMode ? '#9ca3af' : '#6b7280',
        },
      },
    },
    colors: series.map(s => s.color),
    theme: {
      mode: isDarkMode ? 'dark' : 'light',
    },
    grid: {
      borderColor: isDarkMode ? '#374151' : '#e5e7eb',
    },
    legend: isMultiDataset ? {
      show: true,
      position: 'top',
      labels: {
        colors: isDarkMode ? '#9ca3af' : '#6b7280',
      },
    } : { show: false },
    tooltip: {
      theme: isDarkMode ? 'dark' : 'light',
      shared: true,
      intersect: false,
      followCursor: true,
      y: {
        formatter: (val: number) => DataProcessor.formatCurrency(val, state.settings.currency),
      },
    },
    markers: {
      size: chartType === 'line' ? 6 : 0,
      colors: series.map(s => s.color),
      strokeColors: '#ffffff',
      strokeWidth: 2,
      hover: {
        size: 8,
      },
    },
  };

  return (
    <ChartContainer
      title={`Sales Trends Over Time${isMultiDataset ? ' - Dataset Comparison' : ''}`}
      onChartTypeChange={(type) => setChartType(type as 'line' | 'area' | 'bar')}
      availableTypes={['line', 'area', 'bar']}
      currentType={chartType}
    >
      <Chart
        options={chartOptions}
        series={series}
        type={chartType}
        height="100%"
      />
    </ChartContainer>
  );
}