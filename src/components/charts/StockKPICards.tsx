import React, { useMemo } from 'react';
import { Package, TrendingUp, TrendingDown, Factory, ShoppingCart } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { ColorManager } from '../../utils/colorManager';

interface StockKPICardsProps {
  className?: string;
}

export function StockKPICards({ className = '' }: StockKPICardsProps) {
  const { state } = useApp();

  // Calculate production and sales KPIs for both products
  const productionSalesKPIs = useMemo(() => {
    // Find stock datasets
    const stockDatasets = state.datasets.filter(dataset => 
      state.activeDatasetIds.includes(dataset.id) && 
      ColorManager.isStockDataset(dataset.name)
    );

    if (stockDatasets.length === 0) {
      return { 
        hasData: false, 
        rcfProductionAvg: 0, 
        rcfSalesAvg: 0,
        boomiProductionAvg: 0,
        boomiSalesAvg: 0
      };
    }

    // Combine all stock data
    const allStockData = stockDatasets.flatMap(dataset => dataset.data);
    
    if (allStockData.length === 0) {
      return { 
        hasData: false, 
        rcfProductionAvg: 0, 
        rcfSalesAvg: 0,
        boomiProductionAvg: 0,
        boomiSalesAvg: 0
      };
    }

    // Find required columns (case-insensitive)
    const sampleRow = allStockData[0];
    const columns = Object.keys(sampleRow);
    
    const rcfProductionColumn = columns.find(col => {
      const lowerCol = col.toLowerCase().trim();
      return lowerCol.includes('rcf') && lowerCol.includes('production');
    });
    
    const rcfSalesColumn = columns.find(col => {
      const lowerCol = col.toLowerCase().trim();
      return lowerCol.includes('rcf') && lowerCol.includes('sales');
    });
    
    const boomiProductionColumn = columns.find(col => {
      const lowerCol = col.toLowerCase().trim();
      return lowerCol.includes('boomi') && lowerCol.includes('production');
    });
    
    const boomiSalesColumn = columns.find(col => {
      const lowerCol = col.toLowerCase().trim();
      return lowerCol.includes('boomi') && lowerCol.includes('sales');
    });

    console.log('Production Sales KPI - Column Detection:', {
      availableColumns: columns,
      rcfProductionColumn,
      rcfSalesColumn,
      boomiProductionColumn,
      boomiSalesColumn
    });

    if (!rcfProductionColumn || !rcfSalesColumn || !boomiProductionColumn || !boomiSalesColumn) {
      console.warn('Production Sales KPI - Missing required columns');
      return { 
        hasData: false, 
        rcfProductionAvg: 0, 
        rcfSalesAvg: 0,
        boomiProductionAvg: 0,
        boomiSalesAvg: 0
      };
    }

    // Parse Indian number format
    const parseIndianNumber = (value: string): number => {
      if (!value || value === '-' || value === '' || value.trim() === '') return 0;
      
      // Remove commas, quotes, and extra spaces, but keep decimal points
      const cleaned = value.replace(/[",\s]/g, '');
      const parsed = parseFloat(cleaned);
      
      return isNaN(parsed) ? 0 : parsed;
    };

    // Calculate totals and count for averages
    let totalRCFProduction = 0;
    let totalRCFSales = 0;
    let totalBoomiProduction = 0;
    let totalBoomiSales = 0;
    let validRowCount = 0;

    allStockData.forEach((row, index) => {
      const rcfProductionRaw = String(row[rcfProductionColumn] || '').trim();
      const rcfSalesRaw = String(row[rcfSalesColumn] || '').trim();
      const boomiProductionRaw = String(row[boomiProductionColumn] || '').trim();
      const boomiSalesRaw = String(row[boomiSalesColumn] || '').trim();
      
      const rcfProduction = parseIndianNumber(rcfProductionRaw);
      const rcfSales = parseIndianNumber(rcfSalesRaw);
      const boomiProduction = parseIndianNumber(boomiProductionRaw);
      const boomiSales = parseIndianNumber(boomiSalesRaw);
      
      console.log(`Production Sales KPI Row ${index + 1}: RCF Prod: ${rcfProductionRaw} -> ${rcfProduction}, RCF Sales: ${rcfSalesRaw} -> ${rcfSales}, Boomi Prod: ${boomiProductionRaw} -> ${boomiProduction}, Boomi Sales: ${boomiSalesRaw} -> ${boomiSales}`);
      
      totalRCFProduction += rcfProduction;
      totalRCFSales += rcfSales;
      totalBoomiProduction += boomiProduction;
      totalBoomiSales += boomiSales;
      validRowCount++;
    });

    // Calculate averages
    const rcfProductionAvg = validRowCount > 0 ? totalRCFProduction / validRowCount : 0;
    const rcfSalesAvg = validRowCount > 0 ? totalRCFSales / validRowCount : 0;
    const boomiProductionAvg = validRowCount > 0 ? totalBoomiProduction / validRowCount : 0;
    const boomiSalesAvg = validRowCount > 0 ? totalBoomiSales / validRowCount : 0;

    console.log('Production Sales KPI - Final Averages:', {
      rcfProductionAvg,
      rcfSalesAvg,
      boomiProductionAvg,
      boomiSalesAvg,
      validRowCount
    });

    return {
      hasData: validRowCount > 0,
      rcfProductionAvg: Math.round(rcfProductionAvg * 100) / 100,
      rcfSalesAvg: Math.round(rcfSalesAvg * 100) / 100,
      boomiProductionAvg: Math.round(boomiProductionAvg * 100) / 100,
      boomiSalesAvg: Math.round(boomiSalesAvg * 100) / 100
    };
  }, [state.datasets, state.activeDatasetIds]);

  if (!productionSalesKPIs.hasData) {
    return null; // Don't render if no data
  }

  const formatAmount = (amount: number): string => {
    if (amount >= 10000000) { // 1 crore
      return `${(amount / 10000000).toFixed(2)}Cr`;
    } else if (amount >= 100000) { // 1 lakh
      return `${(amount / 100000).toFixed(2)}L`;
    } else if (amount >= 1000) { // 1 thousand
      return `${(amount / 1000).toFixed(2)}K`;
    }
    return amount.toFixed(0);
  };

  const getPerformanceStatus = (production: number, sales: number) => {
    const ratio = sales > 0 ? production / sales : production > 0 ? 2 : 0;
    if (ratio > 1.2) return { status: 'High Production', color: 'success', icon: TrendingUp };
    if (ratio > 0.8) return { status: 'Balanced', color: 'warning', icon: Package };
    return { status: 'High Demand', color: 'error', icon: TrendingDown };
  };

  const rcfStatus = getPerformanceStatus(productionSalesKPIs.rcfProductionAvg, productionSalesKPIs.rcfSalesAvg);
  const boomiStatus = getPerformanceStatus(productionSalesKPIs.boomiProductionAvg, productionSalesKPIs.boomiSalesAvg);

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 ${className}`}>
      {/* RCF Product KPI */}
      <div className="card hover:shadow-md transition-all duration-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
              RCF Product Performance
            </p>
            
            {/* Production and Sales side by side */}
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Factory className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-1" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Production</span>
                </div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatAmount(productionSalesKPIs.rcfProductionAvg)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Avg: {productionSalesKPIs.rcfProductionAvg.toFixed(1)}
                </p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <ShoppingCart className="h-4 w-4 text-green-600 dark:text-green-400 mr-1" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Sales</span>
                </div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatAmount(productionSalesKPIs.rcfSalesAvg)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Avg: {productionSalesKPIs.rcfSalesAvg.toFixed(1)}
                </p>
              </div>
            </div>
            
            <div className={`flex items-center space-x-1.5 ${
              rcfStatus.color === 'success' ? 'text-success-600 dark:text-success-400' :
              rcfStatus.color === 'warning' ? 'text-warning-600 dark:text-warning-400' :
              'text-error-600 dark:text-error-400'
            }`}>
              <rcfStatus.icon className="h-4 w-4" />
              <span className="text-sm font-medium">
                {rcfStatus.status}
              </span>
            </div>
          </div>
          
          <div className={`p-3 rounded-lg ${
            rcfStatus.color === 'success' ? 'bg-success-100 dark:bg-success-900/50' :
            rcfStatus.color === 'warning' ? 'bg-warning-100 dark:bg-warning-900/50' :
            'bg-error-100 dark:bg-error-900/50'
          }`}>
            <Package className={`h-6 w-6 ${
              rcfStatus.color === 'success' ? 'text-success-600 dark:text-success-400' :
              rcfStatus.color === 'warning' ? 'text-warning-600 dark:text-warning-400' :
              'text-error-600 dark:text-error-400'
            }`} />
          </div>
        </div>
      </div>

      {/* Boomi Samrudhi Product KPI */}
      <div className="card hover:shadow-md transition-all duration-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
              Boomi Samrudhi Product Performance
            </p>
            
            {/* Production and Sales side by side */}
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Factory className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-1" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Production</span>
                </div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatAmount(productionSalesKPIs.boomiProductionAvg)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Avg: {productionSalesKPIs.boomiProductionAvg.toFixed(1)}
                </p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <ShoppingCart className="h-4 w-4 text-green-600 dark:text-green-400 mr-1" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Sales</span>
                </div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatAmount(productionSalesKPIs.boomiSalesAvg)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Avg: {productionSalesKPIs.boomiSalesAvg.toFixed(1)}
                </p>
              </div>
            </div>
            
            <div className={`flex items-center space-x-1.5 ${
              boomiStatus.color === 'success' ? 'text-success-600 dark:text-success-400' :
              boomiStatus.color === 'warning' ? 'text-warning-600 dark:text-warning-400' :
              'text-error-600 dark:text-error-400'
            }`}>
              <boomiStatus.icon className="h-4 w-4" />
              <span className="text-sm font-medium">
                {boomiStatus.status}
              </span>
            </div>
          </div>
          
          <div className={`p-3 rounded-lg ${
            boomiStatus.color === 'success' ? 'bg-success-100 dark:bg-success-900/50' :
            boomiStatus.color === 'warning' ? 'bg-warning-100 dark:bg-warning-900/50' :
            'bg-error-100 dark:bg-error-900/50'
          }`}>
            <Package className={`h-6 w-6 ${
              boomiStatus.color === 'success' ? 'text-success-600 dark:text-success-400' :
              boomiStatus.color === 'warning' ? 'text-warning-600 dark:text-warning-400' :
              'text-error-600 dark:text-error-400'
            }`} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default StockKPICards;
