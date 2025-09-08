import React, { useMemo } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { useApp } from '../../contexts/AppContext';
import { ChartContainer } from './ChartContainer';
import { DataProcessor } from '../../utils/dataProcessing';
import { ColorManager } from '../../utils/colorManager';
import { FlexibleDataRow } from '../../types';

interface BuyerTypeData {
  buyerType: string;
  totalSales: number;
  totalQuantity: number;
  count: number;
  averagePrice: number;
}

export function BuyerTypeAnalysisChart() {
  const { state } = useApp();
  
  // Get all active datasets and process buyer type data from each
  const buyerTypeAnalysis = useMemo((): BuyerTypeData[] => {
    const activeDatasets = state.datasets.filter(d => state.activeDatasetIds.includes(d.id));
    
    if (activeDatasets.length === 0) return [];

    // Initialize buyer type aggregation
    const buyerTypeMap = new Map<string, { total: number; totalQuantity: number; count: number; prices: number[] }>();
    
    // Initialize both buyer types to ensure they always appear
    buyerTypeMap.set('B2B', { total: 0, totalQuantity: 0, count: 0, prices: [] });
    buyerTypeMap.set('B2C', { total: 0, totalQuantity: 0, count: 0, prices: [] });

    activeDatasets.forEach(dataset => {
      const data = dataset.data;
      if (!data || data.length === 0) return;

      // Find the buyer type column (case insensitive and flexible matching)
      const buyerTypeColumn = Object.keys(data[0] || {}).find(col => {
        const lowerCol = col.toLowerCase().replace(/\s+/g, '');
        return lowerCol.includes('buyer') && lowerCol.includes('type');
      });
      
      // Find the price column (case insensitive)
      const priceColumn = Object.keys(data[0] || {}).find(col => 
        col.toLowerCase() === 'price' || col.toLowerCase().includes('price')
      );

      // Find the quantity column (case insensitive)
      const quantityColumn = Object.keys(data[0] || {}).find(col => 
        col.toLowerCase() === 'quantity' || col.toLowerCase().includes('quantity')
      );

      // If dataset doesn't have buyer type column, check if it's a known B2C dataset
      if (!buyerTypeColumn) {
        // For datasets without buyer type column, assume B2C if they have price/quantity
        if (priceColumn && quantityColumn) {
          data.forEach((row: FlexibleDataRow, index: number) => {
            const priceRaw = row[priceColumn];
            const quantityRaw = row[quantityColumn];

            // Parse price
            let price = 0;
            if (typeof priceRaw === 'number') {
              price = priceRaw;
            } else if (typeof priceRaw === 'string') {
              const cleanPrice = priceRaw.replace(/[₹,$\s]/g, '');
              price = parseFloat(cleanPrice) || 0;
            }

            // Parse quantity
            let quantity = 0;
            if (typeof quantityRaw === 'number') {
              quantity = quantityRaw;
            } else if (typeof quantityRaw === 'string') {
              quantity = parseFloat(quantityRaw) || 0;
            }

            // Add to B2C if valid
            if (price > 0 && quantity > 0) {
              const b2cData = buyerTypeMap.get('B2C')!;
              b2cData.total += price;
              b2cData.totalQuantity += quantity;
              b2cData.count += 1;
              b2cData.prices.push(price);
            }
          });
        }
        return; // Skip to next dataset
      }

      // Process datasets with buyer type column
      if (!priceColumn || !quantityColumn) {
        console.log(`Dataset ${dataset.name} missing required columns:`, { buyerTypeColumn, priceColumn, quantityColumn });
        return;
      }

      data.forEach((row: FlexibleDataRow, index: number) => {
        const buyerTypeRaw = row[buyerTypeColumn];
        const priceRaw = row[priceColumn];
        const quantityRaw = row[quantityColumn];

        // More robust buyer type parsing
        let buyerType = String(buyerTypeRaw || '').toUpperCase().trim();
        
        // Handle common variations
        if (buyerType === 'B2B' || buyerType === 'B-2-B' || buyerType === 'B 2 B') {
          buyerType = 'B2B';
        } else if (buyerType === 'B2C' || buyerType === 'B-2-C' || buyerType === 'B 2 C') {
          buyerType = 'B2C';
        }

        // More robust price parsing
        let price = 0;
        if (typeof priceRaw === 'number') {
          price = priceRaw;
        } else if (typeof priceRaw === 'string') {
          // Remove currency symbols and commas, then parse
          const cleanPrice = priceRaw.replace(/[₹,$\s]/g, '');
          price = parseFloat(cleanPrice) || 0;
        }

        // More robust quantity parsing
        let quantity = 0;
        if (typeof quantityRaw === 'number') {
          quantity = quantityRaw;
        } else if (typeof quantityRaw === 'string') {
          quantity = parseFloat(quantityRaw) || 0;
        }

        // Only include valid entries
        if (buyerType && (buyerType === 'B2B' || buyerType === 'B2C') && price > 0 && quantity > 0) {
          const data = buyerTypeMap.get(buyerType)!;
          data.total += price;
          data.totalQuantity += quantity;
          data.count += 1;
          data.prices.push(price);
        }
      });
    });

    console.log('Parsed buyer type data:', Array.from(buyerTypeMap.entries()));

    // Convert to array format for chart, always include both types even if one has 0 values
    return Array.from(buyerTypeMap.entries()).map(([buyerType, data]) => ({
      buyerType,
      totalSales: data.total,
      totalQuantity: data.totalQuantity,
      count: data.count,
      averagePrice: data.count > 0 ? data.total / data.count : 0,
    })).sort((a, b) => b.totalSales - a.totalSales);
  }, [state.datasets, state.activeDatasetIds]);

  // Get primary dataset color (preferably FOM if available)
  const primaryColor = useMemo(() => {
    const activeDatasets = state.datasets.filter(d => state.activeDatasetIds.includes(d.id));
    const fomDataset = activeDatasets.find(dataset => 
      dataset.name.toLowerCase().includes('fom') ||
      dataset.fileName.toLowerCase().includes('fom')
    );
    
    if (fomDataset) {
      return fomDataset.color || ColorManager.getDatasetColor(fomDataset.name);
    }
    
    // Fall back to first active dataset color
    return activeDatasets.length > 0 
      ? (activeDatasets[0].color || ColorManager.getDatasetColor(activeDatasets[0].name))
      : '#3B82F6';
  }, [state.datasets, state.activeDatasetIds]);

  // Don't render if no data at all
  if (buyerTypeAnalysis.length === 0 || buyerTypeAnalysis.every(item => item.totalSales === 0)) {
    return null;
  }

  // ApexCharts configuration
  const chartOptions: ApexOptions = {
    chart: {
      type: 'bar',
      height: 350,
      background: 'transparent',
      toolbar: {
        show: false,
      },
    },
    theme: {
      mode: state.settings.theme === 'dark' ? 'dark' : 'light',
    },
    colors: [primaryColor],
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: false,
        columnWidth: '30%',
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: buyerTypeAnalysis.map(item => item.buyerType),
      labels: {
        style: {
          colors: state.settings.theme === 'dark' ? '#9CA3AF' : '#6B7280',
          fontSize: '12px',
        },
      },
      axisBorder: {
        color: state.settings.theme === 'dark' ? '#4B5563' : '#9CA3AF',
      },
      axisTicks: {
        color: state.settings.theme === 'dark' ? '#4B5563' : '#9CA3AF',
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: state.settings.theme === 'dark' ? '#9CA3AF' : '#6B7280',
          fontSize: '11px',
        },
        formatter: function (value) {
          if (value >= 10000000) {
            return `₹${(value / 10000000).toFixed(1)}Cr`;
          } else if (value >= 100000) {
            return `₹${(value / 100000).toFixed(1)}L`;
          } else if (value >= 1000) {
            return `₹${(value / 1000).toFixed(0)}K`;
          } else {
            return `₹${value}`;
          }
        },
      },
    },
    grid: {
      borderColor: state.settings.theme === 'dark' ? '#374151' : '#E5E7EB',
      strokeDashArray: 3,
    },
    tooltip: {
      theme: state.settings.theme === 'dark' ? 'dark' : 'light',
      custom: function({ series, seriesIndex, dataPointIndex, w }) {
        const data = buyerTypeAnalysis[dataPointIndex];
        return `
          <div class="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
            <p class="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Buyer Type: ${data.buyerType}
            </p>
            <div class="space-y-1 text-sm">
              <p class="text-blue-600 dark:text-blue-400">
                <span class="font-medium">Total Sales:</span> ${DataProcessor.formatCurrency(data.totalSales, state.settings.currency)}
              </p>
              <p class="text-gray-600 dark:text-gray-400">
                <span class="font-medium">Total Quantity:</span> ${DataProcessor.formatNumber(data.totalQuantity)} metric ton
              </p>
            </div>
          </div>
        `;
      },
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          chart: {
            height: 300,
          },
          plotOptions: {
            bar: {
              columnWidth: '70%',
            },
          },
        },
      },
    ],
  };

  const chartSeries = [
    {
      name: 'Total Sales',
      data: buyerTypeAnalysis.map(item => item.totalSales),
    },
  ];

  // Get dataset names for title
  const activeDatasetNames = state.datasets
    .filter(d => state.activeDatasetIds.includes(d.id))
    .map(d => d.name)
    .join(', ');

  return (
    <ChartContainer 
      title={`Sales Analysis by Buyer Type (B2B vs B2C) - ${activeDatasetNames}`}
      className="col-span-1 lg:col-span-2"
    >
      <div className="h-96">
        <Chart
          options={chartOptions}
          series={chartSeries}
          type="bar"
          height="100%"
        />
      </div>
      
      {/* Summary Statistics */}
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {buyerTypeAnalysis.map((data, index) => (
          <div key={data.buyerType} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-center">
              <div 
                className="w-4 h-4 rounded-full mx-auto mb-2"
                style={{ backgroundColor: primaryColor }}
              ></div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                {data.buyerType}
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                {DataProcessor.formatCurrency(data.totalSales, state.settings.currency)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {DataProcessor.formatNumber(data.totalQuantity)} metric ton
              </p>
            </div>
          </div>
        ))}
        
        {/* Total Summary */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-800">
          <div className="text-center">
            <div 
              className="w-4 h-4 rounded-full mx-auto mb-2"
              style={{ backgroundColor: primaryColor }}
            ></div>
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
              Total Sales
            </p>
            <p className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-1">
              {DataProcessor.formatCurrency(
                buyerTypeAnalysis.reduce((sum, data) => sum + data.totalSales, 0),
                state.settings.currency
              )}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              {buyerTypeAnalysis.reduce((sum, data) => sum + data.totalQuantity, 0)} metric ton
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              From {state.datasets.filter(d => state.activeDatasetIds.includes(d.id)).reduce((sum, dataset) => sum + dataset.data.length, 0)} total records
            </p>
          </div>
        </div>
      </div>
    </ChartContainer>
  );
}