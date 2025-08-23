import React from 'react';
import { TrendingUp, Database, BarChart3, Package } from 'lucide-react';
import { FlexibleDataRow } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { DataProcessor } from '../../utils/dataProcessing';

// Use the same color function for consistency
const getDatasetColorByName = (datasetName: string) => {
  const lowerName = datasetName.toLowerCase();
  
  // Fixed color mapping based on dataset type
  if (lowerName.includes('pos') && lowerName.includes('fom') && !lowerName.includes('lfom')) {
    return '#3b82f6'; // Blue for POS FOM
  } else if (lowerName.includes('pos') && lowerName.includes('lfom')) {
    return '#7ab839'; // Green for POS LFOM
  } else if (lowerName.includes('lfom') && !lowerName.includes('pos')) {
    return '#7ab839'; // Green for LFOM
  } else if (lowerName.includes('fom') && !lowerName.includes('pos') && !lowerName.includes('lfom')) {
    return '#f97316'; // Orange for FOM
  }
  
  // Fallback colors for other datasets
  const baseColors = [
    '#ef4444', '#8b5cf6', '#06b6d4', '#f59e0b', '#dc2626', '#84cc16', '#059669'
  ];
  
  return baseColors[Math.abs(datasetName.length) % baseColors.length];
};

const getDatasetDisplayName = (datasetName: string) => {
  const lowerName = datasetName.toLowerCase();
  
  if (lowerName.includes('pos') && lowerName.includes('fom') && !lowerName.includes('lfom')) {
    return 'POS FOM Sales';
  } else if (lowerName.includes('pos') && lowerName.includes('lfom')) {
    return 'POS LFOM Sales';
  } else if (lowerName.includes('lfom') && !lowerName.includes('pos')) {
    return 'LFOM Sales';
  } else if (lowerName.includes('fom') && !lowerName.includes('pos') && !lowerName.includes('lfom')) {
    return 'FOM Sales';
  }
  
  return `${datasetName} Sales`;
};

interface DatasetSpecificKPIsProps {
  className?: string;
}

export function DatasetSpecificKPIs({ className = '' }: DatasetSpecificKPIsProps) {
  const { state } = useApp();

  // Calculate exact quantity totals for each dataset, excluding MDA claim and stock datasets
  const calculateDatasetKPIs = () => {
    return state.datasets
      .filter(dataset => {
        const lowerName = dataset.name.toLowerCase();
        // Exclude MDA claim, stock, and recovery datasets
        return !(lowerName.includes('mda') || 
                lowerName.includes('claim') || 
                lowerName.includes('recovery') ||
                lowerName.includes('stock') ||
                lowerName.includes('inventory'));
      })
      .map((dataset) => {
        // Find quantity column (exact match, case insensitive)
        const quantityColumn = Object.keys(dataset.data[0] || {}).find(col => 
          col.toLowerCase().trim() === 'quantity'
        );

        let totalQuantity = 0;
        if (quantityColumn) {
          totalQuantity = dataset.data.reduce((sum, row) => {
            const quantity = parseFloat(String(row[quantityColumn] || '0')) || 0;
            return sum + quantity;
          }, 0);
        }

        return {
          id: dataset.id,
          name: getDatasetDisplayName(dataset.name),
          totalQuantity: Math.round(totalQuantity * 100) / 100,
          rowCount: dataset.rowCount,
          isActive: state.activeDatasetIds.includes(dataset.id),
          color: getDatasetColorByName(dataset.name),
          hasQuantityData: !!quantityColumn
        };
      });
  };

  const filteredDatasetKPIs = calculateDatasetKPIs();

  // If no non-MDA datasets, show placeholder
  if (filteredDatasetKPIs.length === 0) {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
        {['FOM Sales', 'LFOM Sales', 'POS FOM Sales', 'POS LFOM Sales'].map((name, index) => (
          <div key={name} className="card opacity-50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {name}
                </p>
                <p className="text-2xl font-bold text-gray-400 dark:text-gray-500 mb-1">
                  No Data
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Upload {name.split(' ')[0]} dataset
                </p>
              </div>
              
              <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
                <Package className="h-6 w-6 text-gray-400" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {filteredDatasetKPIs.map((dataset) => (
        <div
          key={dataset.id}
          className={`card transition-all duration-200 ${
            dataset.isActive 
              ? 'ring-2 ring-opacity-50 shadow-md' 
              : 'opacity-75 hover:opacity-100'
          }`}
          style={{ 
            ringColor: dataset.isActive ? dataset.color : 'transparent'
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: DataProcessor.getDatasetColorByName(dataset.name) }}
                />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {DataProcessor.getDatasetDisplayName(dataset.name)} Sales
                </p>
              </div>
              
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {dataset.hasQuantityData ? (
                  `${dataset.totalQuantity.toLocaleString('en-US', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2
                  })} mt` 
                ) : (
                  'No Quantity Data'
                )}
              </p>
              
              <div className="flex items-center space-x-2 text-xs">
                <span className={`${dataset.isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  {dataset.isActive ? '● Active' : '○ Inactive'}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {dataset.rowCount.toLocaleString()} rows
                </span>
              </div>
            </div>
            
            <div 
              className="p-3 rounded-lg"
              style={{ 
                backgroundColor: `${dataset.color}20`,
                color: dataset.color
              }}
            >
              <BarChart3 className="h-6 w-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}