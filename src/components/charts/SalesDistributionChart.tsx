import React, { useState } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { DataRow } from '../../types';
import { DataProcessor } from '../../utils/dataProcessing';
import { ChartContainer } from './ChartContainer';
import { useApp } from '../../contexts/AppContext';

interface SalesDistributionChartProps {
  data: DataRow[];
  isDarkMode?: boolean;
  enableDrillDown?: boolean;
}

export function SalesDistributionChart({ data, isDarkMode = false }: SalesDistributionChartProps) {
  const { state, getMultiDatasetData } = useApp();
  const [chartType, setChartType] = useState<'donut' | 'pie'>('donut');
  
  const multiDatasetData = getMultiDatasetData();
  const isMultiDataset = multiDatasetData.length > 1;
  
  const plantData = DataProcessor.aggregateByPlant(data);
  
  if (plantData.length === 0) {
    return (
      <ChartContainer
        title="Sales Distribution by Plant"
        onChartTypeChange={(type) => setChartType(type as 'donut' | 'pie')}
        availableTypes={['donut', 'pie']}
        currentType={chartType}
      >
        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
          No plant data available
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
            Sales Distribution by Plant - Individual Dataset Views
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {multiDatasetData.length} datasets active
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {multiDatasetData.map((dataset) => (
            <IndividualPlantChart
              key={dataset.datasetId}
              data={dataset.data}
              title={dataset.datasetName}
              chartType={chartType}
              isDarkMode={isDarkMode}
              color={dataset.color}
              currency={state.settings.currency}
            />
          ))}
        </div>
      </div>
    );
  }

  const totalRevenue = plantData.reduce((sum, plant) => sum + plant.totalRevenue, 0);

  const chartOptions: ApexOptions = {
    chart: {
      id: 'sales-distribution',
      type: chartType,
      background: 'transparent',
      animations: {
        enabled: true,
        speed: 600,
        animateGradually: {
            enabled: true,
            delay: 150
        },
        dynamicAnimation: {
            enabled: true,
            speed: 350
        }
      },
      events: {
        dataPointSelection: (event: any, chartContext: any, config: any) => {
          const plantName = plantData[config.dataPointIndex]?.name;
          if (plantName) {
            addDrillDownFilter('PlantName', plantName);
          }
        },
      },
    },
    labels: plantData.map(plant => plant.name),
    colors: [
      '#3b82f6', '#22c55e', '#f97316', '#ef4444', 
      '#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899'
    ],
    legend: {
      position: 'bottom',
      labels: {
        colors: isDarkMode ? '#9ca3af' : '#6b7280',
      },
    },
    plotOptions: {
      pie: {
        offsetX: 0, // Remove the offset that was causing the chart to be partially off-screen
        donut: {
          size: chartType === 'donut' ? '70%' : '0%',
          labels: {
            show: chartType === 'donut',
            name: {
              show: true,
              color: isDarkMode ? '#9ca3af' : '#6b7280',
            },
            value: {
              show: true,
              formatter: (val: string) => DataProcessor.formatCurrency(Number(val), state.settings.currency),
              color: isDarkMode ? '#f3f4f6' : '#374151',
            },
            total: {
              show: true,
              label: 'Total Revenue',
              formatter: () => DataProcessor.formatCurrency(totalRevenue, state.settings.currency),
              color: isDarkMode ? '#f3f4f6' : '#374151',
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`,
      style: {
        colors: ['#ffffff'],
      },
    },
    tooltip: {
      theme: isDarkMode ? 'dark' : 'light',
      y: {
        formatter: (val: number) => DataProcessor.formatCurrency(val, state.settings.currency),
      },
    },
    responsive: [{
      breakpoint: 768,
      options: {
        legend: {
          position: 'bottom'
        }
      }
    }]
  };

  const series = plantData.map(plant => plant.totalRevenue);
  
  const chartKey = JSON.stringify(state.filters.drillDownFilters);

  return (
    <ChartContainer
      title="Sales Distribution by Plant"
      onChartTypeChange={(type) => setChartType(type as 'donut' | 'pie')}
      availableTypes={['donut', 'pie']}
      currentType={chartType}
    >
      <div className="relative w-full h-[400px] flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <div className="w-full h-full flex flex-col items-center justify-center">
          <div className="w-full max-w-[600px] h-[300px] flex items-center justify-center">
            <Chart
              key={chartKey}
              options={chartOptions}
              series={series}
              type={chartType}
              height="100%"
              width="100%"
            />
          </div>
          <div className={`mt-4 flex flex-col items-center justify-center text-center ${chartType === 'pie' && 'hidden'}`}>
          </div>
        </div>
        <div 
          className={`absolute top-1/2 right-10 -translate-y-1/2 flex flex-col items-center justify-center text-center pointer-events-none transition-opacity duration-300
          ${chartType === 'pie' ? 'opacity-100' : 'opacity-0'}`}
        >
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {DataProcessor.formatCurrency(totalRevenue, state.settings.currency)}
          </p>
        </div>
      </div>
    </ChartContainer>
  );
}

// Individual Plant Chart Component
interface IndividualPlantChartProps {
  data: FlexibleDataRow[];
  title: string;
  chartType: 'donut' | 'pie';
  isDarkMode: boolean;
  color: string;
  currency: string;
}

function IndividualPlantChart({
  data,
  title,
  chartType,
  isDarkMode,
  color,
  currency
}: IndividualPlantChartProps) {
  const plantData = DataProcessor.aggregateByPlant(data);
  
  if (plantData.length === 0) {
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
          <p className="text-sm">No plant data available</p>
        </div>
      </div>
    );
  }

  const totalRevenue = plantData.reduce((sum, plant) => sum + plant.totalRevenue, 0);
  
  // Generate color variations based on the dataset color
  const generateColorVariations = (baseColor: string) => {
    return [
      baseColor,
      `${baseColor}E6`, // 90% opacity
      `${baseColor}CC`, // 80% opacity
      `${baseColor}B3`, // 70% opacity
      `${baseColor}99`, // 60% opacity
      `${baseColor}80`, // 50% opacity
      `${baseColor}66`, // 40% opacity
      `${baseColor}4D`, // 30% opacity
    ];
  };

  const chartOptions: ApexOptions = {
    chart: {
      type: chartType,
      background: 'transparent',
      animations: { enabled: true, speed: 600 }
    },
    labels: plantData.map(plant => plant.name),
    colors: generateColorVariations(color),
    legend: {
      position: 'bottom',
      labels: { colors: isDarkMode ? '#9ca3af' : '#6b7280' }
    },
    plotOptions: {
      pie: {
        donut: {
          size: chartType === 'donut' ? '60%' : '0%',
          labels: {
            show: chartType === 'donut',
            total: {
              show: true,
              label: 'Total',
              formatter: () => DataProcessor.formatCurrency(totalRevenue, currency)
            }
          }
        },
        expandOnClick: false
      }
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => val > 5 ? `${val.toFixed(1)}%` : '',
      style: { colors: ['#ffffff'] }
    },
    tooltip: {
      theme: isDarkMode ? 'dark' : 'light',
      y: {
        formatter: (val: number) => DataProcessor.formatCurrency(val, currency)
      }
    }
  };

  const series = plantData.map(plant => plant.totalRevenue);

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
          type={chartType}
          height="100%"
        />
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Total Revenue: {DataProcessor.formatCurrency(totalRevenue, currency)}
        </p>
      </div>
    </div>
  );
}