import React, { useState, useMemo } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { BarChart, LineChart, PieChart, MoreHorizontal, BarChart3 } from 'lucide-react';
import { FlexibleDataRow } from '../../types';
import { DataProcessor } from '../../utils/dataProcessing';
import { ChartContainer } from './ChartContainer';
import { useApp } from '../../contexts/AppContext';

// Enhanced color generation for individual charts - moved to top level
const generateDatasetColors = (baseColor: string, dataCount: number) => {
  const colors = [];
  for (let i = 0; i < dataCount; i++) {
    const opacity = Math.max(0.3, 1 - (i * 0.1));
    colors.push(`${baseColor}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`);
  }
  return colors;
};

// Ensure unique colors for each dataset
const getUniqueDatasetColor = (datasetIndex: number, totalDatasets: number) => {
  const baseColors = [
    '#3b82f6', // blue
    '#7ab839', // green
    '#f97316', // orange
    '#ef4444', // red
    '#1A2885', // dark blue
    '#06b6d4', // cyan
    '#f59e0b', // amber
    '#dc2626', // red variant
    '#84cc16', // lime
    '#059669', // emerald
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange variant
    '#6366f1', // indigo
  ];
  
  return baseColors[datasetIndex % baseColors.length];
};

interface FlexibleChartProps {
  data: FlexibleDataRow[];
  title: string;
  chartType?: 'bar' | 'line' | 'pie' | 'donut' | 'area';
  isDarkMode?: boolean;
  className?: string;
}

export function FlexibleChart({ 
  data, 
  title, 
  chartType: initialChartType = 'bar', 
  isDarkMode = false,
  className = ''
}: FlexibleChartProps) {
  const { state, getMultiDatasetData } = useApp();
  const [chartType, setChartType] = useState<string>(initialChartType);
  const [showOptions, setShowOptions] = useState(false);
  
  const multiDatasetData = getMultiDatasetData();
  const isMultiDataset = multiDatasetData.length > 1;

  // Chart type icons mapping
  const chartTypeIcons = {
    bar: BarChart,
    horizontalBar: BarChart3,
    line: LineChart,
    area: LineChart,
    pie: PieChart,
    donut: PieChart
  };

  // Get available chart types
  const getAvailableTypes = () => {
    if (initialChartType === 'bar' || title.toLowerCase().includes('distribution')) {
      return ['bar', 'horizontalBar'];
    } else if (initialChartType === 'line' || title.toLowerCase().includes('trends')) {
      return ['line', 'area', 'bar'];
    } else if (initialChartType === 'donut') {
      return ['donut', 'pie'];
    }
    return [initialChartType];
  };
  
  // For multi-dataset mode, render individual charts for each dataset EXCEPT for time series
  if (isMultiDataset && !title.toLowerCase().includes('trends') && !title.toLowerCase().includes('time')) {
    const availableTypes = getAvailableTypes();
    const currentType = chartType;
    const onChartTypeChange = setChartType;

    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title} - Individual Dataset Views
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {multiDatasetData.length} datasets active
            </span>
            {/* Add chart type selector for individual charts */}
            {availableTypes.length > 0 && onChartTypeChange && (
              <div className="relative">
                <button
                  onClick={() => setShowOptions(!showOptions)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                  aria-label="Chart options"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>

                {showOptions && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <div className="py-2">
                      <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Chart Type
                      </div>
                      {availableTypes.map((type) => {
                        const Icon = chartTypeIcons[type] || BarChart;
                        return (
                          <button
                            key={type}
                            onClick={() => {
                              onChartTypeChange(type);
                              setShowOptions(false);
                            }}
                            className={`
                              w-full flex items-center space-x-2 px-3 py-2 text-left text-sm transition-colors
                              ${currentType === type 
                                ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300' 
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                              }
                            `}
                          >
                            <Icon className="h-4 w-4" />
                            <span className="capitalize">
                              {type === 'horizontalBar' ? 'Horizontal Bar' : type}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {multiDatasetData.map((dataset, index) => (
            <IndividualDatasetChart
              key={dataset.datasetId}
              data={dataset.data}
              title={`${dataset.datasetName}`}
              chartType={chartType}
              isDarkMode={isDarkMode}
              color={getUniqueDatasetColor(index, multiDatasetData.length)}
            />
          ))}
        </div>
      </div>
    );
  }

  // Process time series data for "Trends Over Time" chart
  const processTimeSeriesData = () => {
    try {
      if (!data || data.length === 0) {
        return { 
          chartData: [], 
          categories: [], 
          hasData: false, 
          errorMessage: 'No time series data available' 
        };
      }

      // Get time series data with proper grouping
      const timeSeriesData = DataProcessor.getTimeSeries(data, 'month');
      
      if (!timeSeriesData || timeSeriesData.length === 0) {
        // Fallback to day-based grouping if month fails
        const daySeriesData = DataProcessor.getTimeSeries(data, 'day');
        if (!daySeriesData || daySeriesData.length === 0) {
          return { 
            chartData: [], 
            categories: [], 
            hasData: false, 
            errorMessage: 'No valid date data found for time series' 
          };
        }
        
        // Limit to last 30 days for readability
        const limitedDayData = daySeriesData.slice(-30);
        return {
          chartData: limitedDayData.map(point => Math.round(point.value * 100) / 100),
          categories: limitedDayData.map(point => {
            const date = new Date(point.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          }),
          hasData: true,
          errorMessage: null
        };
      }

      return {
        chartData: timeSeriesData.map(point => Math.round(point.value * 100) / 100),
        categories: timeSeriesData.map(point => {
          const date = new Date(point.date + '-01');
          return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }),
        hasData: true,
        errorMessage: null
      };
    } catch (error) {
      console.error('Time series processing error:', error);
      return { 
        chartData: [], 
        categories: [], 
        hasData: false, 
        errorMessage: `Time series error: ${error.message}` 
      };
    }
  };

  // Comprehensive data processing with error handling
  const { chartData, categories, hasData, errorMessage } = useMemo(() => {
    try {
      // Special handling for "Trends Over Time" chart
      if (title.toLowerCase().includes('trends') || title.toLowerCase().includes('time')) {
        return processTimeSeriesData();
      }
      
      // Early return for empty data
      if (!data || !Array.isArray(data) || data.length === 0) {
        return { 
          chartData: [], 
          categories: [], 
          hasData: false, 
          errorMessage: 'No data available' 
        };
      }

      // Validate data structure
      const firstRow = data[0];
      if (!firstRow || typeof firstRow !== 'object') {
        return { 
          chartData: [], 
          categories: [], 
          hasData: false, 
          errorMessage: 'Invalid data structure' 
        };
      }

      // Find columns with comprehensive fallbacks
      const numericColumns = DataProcessor.findNumericColumns(data);
      const categoricalColumns = DataProcessor.findCategoricalColumns(data);
      
      console.log('FlexibleChart Debug:', {
        dataLength: data.length,
        numericColumns,
        categoricalColumns,
        firstRow: Object.keys(firstRow)
      });

      // Enhanced column detection with multiple fallback strategies
      let valueColumn = null;
      let categoryColumn = null;

      // Strategy 1: Find by keywords
      valueColumn = numericColumns.find(col => 
        col.toLowerCase().includes('price') || 
        col.toLowerCase().includes('revenue') ||
        col.toLowerCase().includes('quantity') ||
        col.toLowerCase().includes('amount') ||
        col.toLowerCase().includes('value') ||
        col.toLowerCase().includes('total')
      );

      categoryColumn = categoricalColumns.find(col =>
        col.toLowerCase().includes('name') ||
        col.toLowerCase().includes('product') ||
        col.toLowerCase().includes('category') ||
        col.toLowerCase().includes('type') ||
        col.toLowerCase().includes('item')
      );

      // Strategy 2: Use first available columns
      if (!valueColumn && numericColumns.length > 0) {
        valueColumn = numericColumns[0];
      }
      
      if (!categoryColumn && categoricalColumns.length > 0) {
        categoryColumn = categoricalColumns[0];
      }

      // Strategy 3: Create synthetic data if no proper columns found
      if (!valueColumn || !categoryColumn) {
        console.warn('FlexibleChart: Creating synthetic data due to missing columns');
        
        // Try to use any available column as category
        const availableColumns = Object.keys(firstRow);
        categoryColumn = categoryColumn || availableColumns.find(col => 
          col.toLowerCase() !== 'date' && 
          col.toLowerCase() !== 'time'
        ) || availableColumns[0];

        // Create count-based data if no numeric column
        if (!valueColumn) {
          const categoryData = DataProcessor.aggregateByColumn(data, categoryColumn);
          return {
            chartData: categoryData.map(item => item.value),
            categories: categoryData.map(item => item.name),
            hasData: true,
            errorMessage: null
          };
        }
      }

      // Process data with error handling
      const aggregatedData = DataProcessor.aggregateByCategory(data, categoryColumn, valueColumn);
      
      if (!aggregatedData || aggregatedData.length === 0) {
        return { 
          chartData: [], 
          categories: [], 
          hasData: false, 
          errorMessage: 'No aggregated data generated' 
        };
      }

      // Limit data points for better visualization (top 10)
      const limitedData = aggregatedData.slice(0, 10);

      return {
        chartData: limitedData.map(item => Math.round(item.total * 100) / 100), // Round to 2 decimals
        categories: limitedData.map(item => item.name || 'Unknown'),
        hasData: true,
        errorMessage: null
      };

    } catch (error) {
      console.error('FlexibleChart processing error:', error);
      return { 
        chartData: [], 
        categories: [], 
        hasData: false, 
        errorMessage: `Processing error: ${error.message}` 
      };
    }
  }, [data, title]);

  // Chart type configuration
  // Error state rendering
  if (!hasData) {
    return (
      <ChartContainer
        title={title}
        availableTypes={getAvailableTypes()}
        currentType={chartType}
        onChartTypeChange={setChartType}
        className={className}
      >
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <p className="text-lg font-medium">
              {errorMessage || 'No suitable data for visualization'}
            </p>
            <p className="text-sm mt-2">
              {data?.length > 0 
                ? 'Upload data with numeric and categorical columns' 
                : 'Upload data to view charts'
              }
            </p>
          </div>
        </div>
      </ChartContainer>
    );
  }

  // For trends/time charts in multi-dataset mode, prepare combined time series data
  const prepareMultiDatasetTimeSeries = () => {
    if (!isMultiDataset || (!title.toLowerCase().includes('trends') && !title.toLowerCase().includes('time'))) {
      return null;
    }

    // Get all unique dates across all datasets
    const allDates = new Set<string>();
    const datasetSeries: any[] = [];

    multiDatasetData.forEach(dataset => {
      const datasetTimeSeries = DataProcessor.getTimeSeries(dataset.data, 'month');
      datasetTimeSeries.forEach(point => allDates.add(point.date));
    });

    const sortedDates = Array.from(allDates).sort();

    // Create series for each dataset
    multiDatasetData.forEach((dataset, index) => {
      const datasetTimeSeries = DataProcessor.getTimeSeries(dataset.data, 'month');
      const timeSeriesMap = new Map(datasetTimeSeries.map(point => [point.date, point.revenue || point.value]));
      
      datasetSeries.push({
        name: dataset.datasetName,
        data: sortedDates.map(date => timeSeriesMap.get(date) || 0),
        color: getUniqueDatasetColor(index, multiDatasetData.length)
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

  // Get multi-dataset time series data if applicable
  const multiTimeSeriesData = prepareMultiDatasetTimeSeries();

  // Single dataset or trends chart - render normally
  const isHorizontalBar = chartType === 'horizontalBar';
  const actualChartType = isHorizontalBar ? 'bar' : chartType;
  const isPieChart = actualChartType === 'pie' || actualChartType === 'donut';

  // Use multi-dataset time series data if available, otherwise use processed data
  const finalCategories = multiTimeSeriesData ? multiTimeSeriesData.categories : categories;
  const finalSeries = multiTimeSeriesData ? multiTimeSeriesData.series : 
    isPieChart ? (chartData || []) : [{ name: 'Value', data: (chartData || []), color: '#3b82f6' }];

  // Comprehensive chart options with error prevention
  const chartOptions: ApexOptions = {
    chart: {
      type: actualChartType === 'donut' ? 'donut' : actualChartType,
      background: 'transparent',
      toolbar: { show: false },
      height: '100%',
      width: '100%',
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800
      }
    },
    
    // Conditional configuration based on chart type
    ...(isPieChart ? {
      labels: finalCategories || [],
      legend: {
        position: 'bottom',
        labels: { colors: isDarkMode ? '#9ca3af' : '#6b7280' }
      }
    } : {
      xaxis: {
        categories: finalCategories || [],
        labels: {
          style: { colors: isDarkMode ? '#9ca3af' : '#6b7280' },
          rotate: finalCategories && finalCategories.length > 10 ? -45 : 0
        },
        title: {
          text: title.toLowerCase().includes('trends') ? 'Time Period' : 'Categories',
          style: { color: isDarkMode ? '#9ca3af' : '#6b7280' }
        }
      },
      yaxis: {
        labels: {
          formatter: isHorizontalBar ? undefined : (val: number) => {
            if (isNaN(val) || val === null || val === undefined) {
              return String(val || '');
            }
            return DataProcessor.formatCurrency(val, state.settings.currency);
          },
          style: { colors: isDarkMode ? '#9ca3af' : '#6b7280' }
        },
        title: {
          text: title.toLowerCase().includes('trends') ? 'Sales Value' : 'Value',
          style: { color: isDarkMode ? '#9ca3af' : '#6b7280' }
        }
      }
    }),

    colors: multiTimeSeriesData ? multiTimeSeriesData.series.map(s => s.color) : [
      '#3b82f6', '#7ab839', '#f97316', '#ef4444', 
      '#1A2885', '#06b6d4', '#f59e0b', '#dc2626',
      '#84cc16', '#059669'
    ],
    
    theme: { mode: isDarkMode ? 'dark' : 'light' },
    
    grid: { 
      borderColor: isDarkMode ? '#374151' : '#e5e7eb',
      show: !isPieChart,
      padding: {
        top: 0,
        right: 10,
        bottom: 0,
        left: 10
      }
    },
    
    tooltip: {
      theme: isDarkMode ? 'dark' : 'light',
      shared: multiTimeSeriesData ? true : false,
      intersect: multiTimeSeriesData ? false : true,
      y: {
        formatter: (val: number) => DataProcessor.formatCurrency(val, state.settings.currency)
      }
    },
    
    plotOptions: {
      pie: {
        donut: {
          size: actualChartType === 'donut' ? '70%' : '0%',
          labels: {
            show: actualChartType === 'donut',
            total: {
              show: true,
              label: 'Total',
              formatter: () => DataProcessor.formatCurrency(
                chartData.reduce((sum, val) => sum + val, 0), 
                state.settings.currency
              )
            }
          }
        },
        expandOnClick: false,
        offsetX: 0,
        offsetY: 0
      },
      bar: {
        borderRadius: 4,
        columnWidth: '75%',
        barHeight: '75%',
        horizontal: isHorizontalBar,
        dataLabels: { position: 'top' },
        distributed: false
      }
    },
    
    dataLabels: {
      enabled: isPieChart,
      formatter: isPieChart ? (val: number) => `${val.toFixed(1)}%` : undefined,
      style: { colors: ['#ffffff'] }
    },
    
    stroke: {
      curve: 'smooth',
      width: actualChartType === 'line' || actualChartType === 'area' ? 4 : 0
    },
    
    fill: {
      type: actualChartType === 'area' ? 'gradient' : 'solid',
      gradient: actualChartType === 'area' ? {
        shadeIntensity: 1,
        type: 'vertical',
        colorStops: [
          { offset: 0, color: '#3b82f6', opacity: 0.8 },
          { offset: 100, color: '#3b82f6', opacity: 0.1 }
        ]
      } : undefined
    },

    markers: {
      size: actualChartType === 'line' ? 5 : 0,
      colors: multiTimeSeriesData ? multiTimeSeriesData.series.map(s => s.color) : ['#3b82f6'],
      strokeColors: '#ffffff',
      strokeWidth: 2,
      hover: {
        size: 8
      }
    },

    legend: multiTimeSeriesData ? {
      show: true,
      position: 'top',
      labels: { colors: isDarkMode ? '#9ca3af' : '#6b7280' }
    } : { show: false },

    // Responsive configuration
    responsive: [{
      breakpoint: 768,
      options: {
        plotOptions: {
          bar: { 
            horizontal: true,
            columnWidth: '80%',
            barHeight: '80%'
          }
        },
        legend: {
          position: 'bottom'
        },
        xaxis: {
          labels: {
            rotate: -90
          }
        },
        chart: {
          height: 400
        }
      }
    }]
  };

  return (
    <ChartContainer
      title={title}
      availableTypes={getAvailableTypes()}
      onChartTypeChange={setChartType}
      currentType={chartType}
      className={className}
    >
      <div className="w-full h-full min-h-[500px]">
        <Chart
          options={chartOptions}
          series={finalSeries}
          type={actualChartType === 'donut' ? 'donut' : actualChartType}
          height="500px"
          width="100%"
        />
      </div>
    </ChartContainer>
  );
}

// Individual Dataset Chart Component
interface IndividualDatasetChartProps {
  data: FlexibleDataRow[];
  title: string;
  chartType: string;
  isDarkMode: boolean;
  color: string;
}

function IndividualDatasetChart({
  data,
  title,
  chartType,
  isDarkMode,
  color
}: IndividualDatasetChartProps) {
  const { state } = useApp();

  // Process data for individual dataset
  const processedData = useMemo(() => {
    try {
      if (!data || data.length === 0) {
        return { chartData: [], categories: [], hasData: false };
      }

      const numericColumns = DataProcessor.findNumericColumns(data);
      const categoricalColumns = DataProcessor.findCategoricalColumns(data);

      let valueColumn = numericColumns.find(col => 
        col.toLowerCase().includes('price') || 
        col.toLowerCase().includes('revenue') ||
        col.toLowerCase().includes('quantity') ||
        col.toLowerCase().includes('amount')
      ) || numericColumns[0];

      let categoryColumn = categoricalColumns.find(col =>
        col.toLowerCase().includes('name') ||
        col.toLowerCase().includes('product') ||
        col.toLowerCase().includes('category')
      ) || categoricalColumns[0];

      if (!valueColumn || !categoryColumn) {
        return { chartData: [], categories: [], hasData: false };
      }

      const aggregatedData = DataProcessor.aggregateByCategory(data, categoryColumn, valueColumn);
      const limitedData = aggregatedData.slice(0, 8); // Limit for individual charts

      return {
        chartData: limitedData.map(item => Math.round(item.total * 100) / 100),
        categories: limitedData.map(item => item.name || 'Unknown'),
        hasData: true
      };
    } catch (error) {
      console.error('Individual chart processing error:', error);
      return { chartData: [], categories: [], hasData: false };
    }
  }, [data]);

  if (!processedData.hasData) {
    return (
      <div className="card">
        <div className="flex items-center space-x-3 mb-4">
          <div 
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: color }}
          />
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h4>
        </div>
        <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
          <p className="text-sm">No suitable data for visualization</p>
        </div>
      </div>
    );
  }

  const isHorizontalBar = chartType === 'horizontalBar';
  const actualChartType = isHorizontalBar ? 'bar' : chartType;
  const isPieChart = actualChartType === 'pie' || actualChartType === 'donut';

  // Generate colors based on dataset color
  const chartColors = isPieChart 
    ? generateDatasetColors(color, processedData.chartData.length)
    : [color];
  const chartOptions: ApexOptions = {
    chart: {
      type: actualChartType === 'donut' ? 'donut' : actualChartType,
      toolbar: { show: false },
      background: 'transparent',
      height: '100%',
      animations: { enabled: true, speed: 600 }
    },
    
    ...(isPieChart ? {
      labels: processedData.categories,
      legend: {
        position: 'bottom',
        labels: { colors: isDarkMode ? '#9ca3af' : '#6b7280' }
      }
    } : {
      xaxis: {
        categories: processedData.categories,
        labels: {
          style: { colors: isDarkMode ? '#9ca3af' : '#6b7280' },
          rotate: processedData.categories.length > 6 ? -45 : 0
        }
      },
      yaxis: {
        labels: {
          formatter: (val: number) => DataProcessor.formatCurrency(val, state.settings.currency),
          style: { colors: isDarkMode ? '#9ca3af' : '#6b7280' }
        }
      }
    }),

    colors: chartColors,
    theme: { mode: isDarkMode ? 'dark' : 'light' },
    grid: { 
      borderColor: isDarkMode ? '#374151' : '#e5e7eb',
      show: !isPieChart
    },
    
    plotOptions: {
      pie: {
        donut: {
          size: actualChartType === 'donut' ? '60%' : '0%'
        },
        expandOnClick: false
      },
      bar: {
        borderRadius: 4,
        columnWidth: '70%',
        horizontal: isHorizontalBar
      }
    },
    
    dataLabels: {
      enabled: isPieChart,
      formatter: isPieChart ? (val: number) => `${val.toFixed(1)}%` : undefined
    },
    
    tooltip: {
      theme: isDarkMode ? 'dark' : 'light',
      y: {
        formatter: (val: number) => DataProcessor.formatCurrency(val, state.settings.currency)
      }
    }
  };

  const series = isPieChart 
    ? processedData.chartData
    : [{ name: 'Value', data: processedData.chartData, color }];

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
          type={actualChartType === 'donut' ? 'donut' : actualChartType}
          height="100%"
        />
      </div>
    </div>
  );
}