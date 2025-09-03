import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Calendar, BarChart3 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { ColorManager } from '../../utils/colorManager';
import { DataProcessor } from '../../utils/dataProcessing';

interface RevenueKPICardsProps {
  className?: string;
}

interface RevenueData {
  month: string;
  directSalesFOM: number;
  directSalesLFOM: number;
  mdaClaimReceived: number;
  totalRevenue: number;
}

export function RevenueKPICards({ className = '' }: RevenueKPICardsProps) {
  const { state } = useApp();

  // Process revenue data from Revenue table
  const revenueData = useMemo((): RevenueData[] => {
    // Find Revenue datasets
    const revenueDatasets = state.datasets.filter(dataset => 
      state.activeDatasetIds.includes(dataset.id) && 
      (dataset.name.toLowerCase().includes('revenue') || 
       dataset.fileName.toLowerCase().includes('revenue'))
    );

    if (revenueDatasets.length === 0) {
      return [];
    }

    // Combine all revenue data
    const allRevenueData = revenueDatasets.flatMap(dataset => dataset.data);

    if (allRevenueData.length === 0) {
      return [];
    }

    // Find required columns (case-insensitive)
    const sampleRow = allRevenueData[0];
    const columns = Object.keys(sampleRow);
    
    const monthsColumn = columns.find(col => {
      const lowerCol = col.toLowerCase().trim();
      return lowerCol === 'months' || lowerCol === 'month';
    });
    
    const directSalesFOMColumn = columns.find(col => {
      const lowerCol = col.toLowerCase().trim();
      return lowerCol === 'direct sales fom' || 
             lowerCol.includes('direct') && lowerCol.includes('fom');
    });
    
    const directSalesLFOMColumn = columns.find(col => {
      const lowerCol = col.toLowerCase().trim();
      return lowerCol === 'direct sales lfom' || 
             (lowerCol.includes('direct') && lowerCol.includes('lfom'));
    });
    
    const mdaClaimColumn = columns.find(col => {
      const lowerCol = col.toLowerCase().trim();
      return lowerCol === 'mda claim received' ||
             (lowerCol.includes('mda') && lowerCol.includes('claim'));
    });
    
    const totalRevenueColumn = columns.find(col => {
      const lowerCol = col.toLowerCase().trim();
      return lowerCol === 'total revenue' ||
             (lowerCol.includes('total') && lowerCol.includes('revenue'));
    });

    if (!monthsColumn || !directSalesFOMColumn || !directSalesLFOMColumn || 
        !mdaClaimColumn || !totalRevenueColumn) {
      console.warn('Revenue KPI: Missing required columns');
      return [];
    }

    // Parse amount function for Indian number format
    const parseAmount = (value: any): number => {
      if (value === null || value === undefined || value === '-' || value === '' || 
          String(value).trim() === '' || String(value).toLowerCase() === 'nan') {
        return 0;
      }
      
      // Convert to string and clean
      let cleaned = String(value).replace(/[",\s]/g, '');
      
      // Handle cases where .00 is at the end
      if (cleaned.endsWith('.00')) {
        cleaned = cleaned.slice(0, -3);
      }
      
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    // Process data
    const processedData: RevenueData[] = allRevenueData.map(row => ({
      month: String(row[monthsColumn] || '').trim(),
      directSalesFOM: parseAmount(row[directSalesFOMColumn]),
      directSalesLFOM: parseAmount(row[directSalesLFOMColumn]),
      mdaClaimReceived: parseAmount(row[mdaClaimColumn]),
      totalRevenue: parseAmount(row[totalRevenueColumn])
    })).filter(item => item.month && item.month !== '');

    // Sort by month order
    const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    return processedData.sort((a, b) => {
      const aIndex = monthOrder.indexOf(a.month);
      const bIndex = monthOrder.indexOf(b.month);
      return aIndex - bIndex;
    });
  }, [state.datasets, state.activeDatasetIds]);

  // Apply global filters to revenue data
  const filteredRevenueData = useMemo(() => {
    if (revenueData.length === 0) return [];

    let filtered = revenueData;

    // Apply month filters if any
    const monthFilters = state.filters.selectedValues['Months'] || 
                        state.filters.selectedValues['Month'] || [];
    
    if (monthFilters.length > 0) {
      filtered = filtered.filter(item => monthFilters.includes(item.month));
    }

    return filtered;
  }, [revenueData, state.filters]);

  // Get latest month data for default display
  const latestMonthData = filteredRevenueData.length > 0 ? 
    filteredRevenueData[filteredRevenueData.length - 1] : null;

  // Calculate totals across filtered months
  const totals = useMemo(() => {
    if (filteredRevenueData.length === 0) {
      return {
        totalRevenue: 0,
        directSalesFOM: 0,
        directSalesLFOM: 0,
        mdaClaimReceived: 0
      };
    }

    return filteredRevenueData.reduce((acc, item) => ({
      totalRevenue: acc.totalRevenue + item.totalRevenue,
      directSalesFOM: acc.directSalesFOM + item.directSalesFOM,
      directSalesLFOM: acc.directSalesLFOM + item.directSalesLFOM,
      mdaClaimReceived: acc.mdaClaimReceived + item.mdaClaimReceived
    }), {
      totalRevenue: 0,
      directSalesFOM: 0,
      directSalesLFOM: 0,
      mdaClaimReceived: 0
    });
  }, [filteredRevenueData]);

  // Don't render if no revenue data
  if (revenueData.length === 0) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return DataProcessor.formatCurrency(amount, state.settings.currency);
  };

  const isMultipleMonths = filteredRevenueData.length > 1;
  const displayData = isMultipleMonths ? totals : (latestMonthData || totals);

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${className}`}>
      {/* Card 1 - Total Revenue Card */}
      <div className="card hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border-primary-200 dark:border-primary-700">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              <p className="text-sm font-medium text-primary-700 dark:text-primary-300">
                Total Revenue
                {isMultipleMonths ? ` (${filteredRevenueData.length} months)` : 
                 latestMonthData ? ` - ${latestMonthData.month}` : ''}
              </p>
            </div>
            
            <p className="text-3xl font-bold text-primary-900 dark:text-primary-100 mb-2">
              {formatCurrency(displayData.totalRevenue)}
            </p>
            
            {isMultipleMonths && (
              <div className="space-y-1 text-xs text-primary-700 dark:text-primary-300">
                <p className="font-medium">Month-wise breakdown:</p>
                <div className="max-h-20 overflow-y-auto space-y-1">
                  {filteredRevenueData.map(item => (
                    <div key={item.month} className="flex justify-between">
                      <span>{item.month}:</span>
                      <span className="font-medium">{formatCurrency(item.totalRevenue)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex items-center space-x-1.5 mt-3 text-primary-600 dark:text-primary-400">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">
                {isMultipleMonths ? 'Combined Total' : 'Latest Month'}
              </span>
            </div>
          </div>
          
          <div className="p-3 rounded-lg bg-primary-100 dark:bg-primary-800/50">
            <DollarSign className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
        </div>
      </div>

      {/* Card 2 - Sales & Claims Card */}
      <div className="card hover:shadow-lg transition-all duration-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4 text-secondary-600 dark:text-secondary-400" />
            <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
              Sales & Claims Breakdown
              {isMultipleMonths ? ` (${filteredRevenueData.length} months)` : 
               latestMonthData ? ` - ${latestMonthData.month}` : ''}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Direct Sales FOM */}
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Direct Sales FOM
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Factory Outlet Management
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(displayData.directSalesFOM)}
              </p>
              {isMultipleMonths && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Avg: {formatCurrency(displayData.directSalesFOM / filteredRevenueData.length)}
                </p>
              )}
            </div>
          </div>

          {/* Direct Sales LFOM */}
          <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Direct Sales LFOM
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Local Factory Outlet Management
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {formatCurrency(displayData.directSalesLFOM)}
              </p>
              {isMultipleMonths && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Avg: {formatCurrency(displayData.directSalesLFOM / filteredRevenueData.length)}
                </p>
              )}
            </div>
          </div>

          {/* MDA Claim Received */}
          <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  MDA Claim Received
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Government Subsidy Claims
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {formatCurrency(displayData.mdaClaimReceived)}
              </p>
              {isMultipleMonths && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Avg: {formatCurrency(displayData.mdaClaimReceived / filteredRevenueData.length)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Summary for multiple months */}
        {isMultipleMonths && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                Period: {filteredRevenueData[0]?.month} - {filteredRevenueData[filteredRevenueData.length - 1]?.month}
              </p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <p className="text-gray-500 dark:text-gray-400">FOM</p>
                  <p className="font-medium text-blue-600 dark:text-blue-400">
                    {((displayData.directSalesFOM / displayData.totalRevenue) * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500 dark:text-gray-400">LFOM</p>
                  <p className="font-medium text-green-600 dark:text-green-400">
                    {((displayData.directSalesLFOM / displayData.totalRevenue) * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500 dark:text-gray-400">MDA</p>
                  <p className="font-medium text-purple-600 dark:text-purple-400">
                    {((displayData.mdaClaimReceived / displayData.totalRevenue) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RevenueKPICards;