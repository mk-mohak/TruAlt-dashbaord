import { 
  TrendingUp, 
  TrendingDown, 
  Database, 
  BarChart3, 
  DollarSign, 
  Users,
  IndianRupee,
  Euro,
  PoundSterling,
  JapaneseYen
} from 'lucide-react';
import { DataProcessor } from '../../utils/dataProcessing';
import { FlexibleDataRow } from '../../types';
import { useApp } from '../../contexts/AppContext';

// Use the same color function as FlexibleChart for consistency
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

interface KPICardsProps {
  data: FlexibleDataRow[];
  currency?: string;
}

export function KPICards({ data, currency = 'INR' }: KPICardsProps) {
  const { getMultiDatasetData } = useApp();
  const multiDatasetData = getMultiDatasetData();
  const isMultiDataset = multiDatasetData.length > 1;
  
  const kpis = DataProcessor.calculateKPIs(data);

  const getCurrencyIcon = (currency: string) => {
    switch (currency) {
      case 'INR':
        return IndianRupee;
      case 'EUR':
        return Euro;
      case 'GBP':
        return PoundSterling;
      case 'JPY':
        return JapaneseYen;
      case 'USD':
      case 'CAD':
      default:
        return DollarSign;
    }
  };

  // Calculate KPIs for each dataset if multiple are active
  const datasetKPIs = isMultiDataset 
    ? multiDatasetData.map(dataset => ({
        ...dataset,
        kpis: DataProcessor.calculateKPIs(dataset.data)
      }))
    : [];

  const cards = [
    {
      title: kpis.primaryValueColumn?.includes('price') || kpis.primaryValueColumn?.includes('revenue') ? 'Total Revenue' : 'Total Value',
      value: DataProcessor.formatCurrency(kpis.totalValue, currency),
      change: 12.5,
      changeType: 'increase' as const,
      icon: getCurrencyIcon(currency),
      color: 'primary',
    },
    {
      title: 'Total Records',
      value: DataProcessor.formatNumber(kpis.totalRecords),
      change: 8.2,
      changeType: 'increase' as const,
      icon: Database,
      color: 'secondary',
    },
    {
      title: 'Average Value',
      value: DataProcessor.formatCurrency(kpis.averageValue, currency),
      change: 0,
      changeType: 'neutral' as const,
      icon: BarChart3,
      color: 'accent',
    },
    {
      title: kpis.primaryCategoryColumn ? `Unique ${kpis.primaryCategoryColumn}` : 'Categories',
      value: kpis.uniqueCategories.toString(),
      change: -2.1,
      changeType: 'decrease' as const,
      icon: Users,
      color: 'secondary',
    },
  ];

  const getChangeIcon = (changeType: 'increase' | 'decrease' | 'neutral') => {
    switch (changeType) {
      case 'increase':
        return <TrendingUp className="h-4 w-4 text-success-500" />;
      case 'decrease':
        return <TrendingDown className="h-4 w-4 text-error-500" />;
      default:
        return null;
    }
  };

  const getChangeColor = (changeType: 'increase' | 'decrease' | 'neutral') => {
    switch (changeType) {
      case 'increase':
        return 'text-success-600 dark:text-success-400';
      case 'decrease':
        return 'text-error-600 dark:text-error-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon;
        
        return (
          <div
            key={card.title}
            className={`card hover:shadow-md transition-all duration-200 group ${
              isMultiDataset ? 'pb-4' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {card.value}
                </p>
                
                {card.change !== 0 && (
                  <div className={`flex items-center space-x-1.5 ${getChangeColor(card.changeType)}`}>
                    {getChangeIcon(card.changeType)}
                    <span className="text-sm font-medium">
                      {Math.abs(card.change)}%
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      vs last period
                    </span>
                  </div>
                )}
              </div>
              
              <div className={`
                p-3 rounded-lg group-hover:scale-110 transition-transform duration-200
                ${card.color === 'primary' ? 'bg-primary-100 dark:bg-primary-900/50' : ''}
                ${card.color === 'secondary' ? 'bg-secondary-100 dark:bg-secondary-900/50' : ''}
                ${card.color === 'accent' ? 'bg-accent-100 dark:bg-accent-900/50' : ''}
              `}>
                <Icon className={`
                  h-6 w-6
                  ${card.color === 'primary' ? 'text-primary-600 dark:text-primary-400' : ''}
                  ${card.color === 'secondary' ? 'text-secondary-600 dark:text-secondary-400' : ''}
                  ${card.color === 'accent' ? 'text-accent-600 dark:text-accent-400' : ''}
                `} />
              </div>
            </div>
            
            {/* Multi-dataset breakdown */}
            {isMultiDataset && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="space-y-2">
                  {datasetKPIs.map((dataset) => {
                    let value: string;
                    switch (index) {
                      case 0: // Total Value
                        value = DataProcessor.formatCurrency(dataset.kpis.totalValue, currency);
                        break;
                      case 1: // Records
                        value = DataProcessor.formatNumber(dataset.kpis.totalRecords);
                        break;
                      case 2: // Average
                        value = DataProcessor.formatCurrency(dataset.kpis.averageValue, currency);
                        break;
                      case 3: // Categories
                        value = dataset.kpis.uniqueCategories.toString();
                        break;
                      default:
                        value = '0';
                    }
                    
                    return (
                      <div key={dataset.datasetId} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: getUniqueDatasetColor(multiDatasetData.findIndex(d => d.datasetId === dataset.datasetId), multiDatasetData.length) }}
                          />
                          <span className="text-gray-600 dark:text-gray-400 truncate max-w-20">
                            {dataset.datasetName}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}