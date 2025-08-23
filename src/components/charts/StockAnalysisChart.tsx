import React, { useState, useMemo } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { FlexibleDataRow } from '../../types';
import { ChartContainer } from './ChartContainer';
import { useApp } from '../../contexts/AppContext';
import { ColorManager } from '../../utils/colorManager';

interface StockAnalysisChartProps {
  className?: string;
}

export function StockAnalysisChart({ className = '' }: StockAnalysisChartProps) {
  const { state } = useApp();
  const [chartType, setChartType] = useState<'bar' | 'line' | 'horizontalBar'>('bar');
  const isDarkMode = state.settings.theme === 'dark';

  const processStockData = useMemo(() => {
    const stockDatasets = state.datasets.filter(dataset =>
      state.activeDatasetIds.includes(dataset.id) &&
      ColorManager.isStockDataset(dataset.name)
    );

    if (stockDatasets.length === 0) {
      return { rcfData: null, boomiData: null, hasData: false };
    }

    const allStockData = stockDatasets.flatMap(ds => ds.data);
    if (allStockData.length === 0) {
      return { rcfData: null, boomiData: null, hasData: false };
    }

    const columns = Object.keys(allStockData[0]);
    const dateCol = columns.find(c => c.toLowerCase().trim() === 'date');

    const findCol = (prefix: string, field: string) =>
      columns.find(c => c.toLowerCase().includes(prefix) && c.toLowerCase().includes(field));

    const rcfProdCol = findCol('rcf', 'production');
    const rcfSalesCol = findCol('rcf', 'sales');
    const rcfStockCol = findCol('rcf', 'stock');
    const boomiProdCol = findCol('boomi', 'production');
    const boomiSalesCol = findCol('boomi', 'sales');
    const boomiStockCol = findCol('boomi', 'stock');

    if (!dateCol) {
      return { rcfData: null, boomiData: null, hasData: false };
    }

    const parseNum = (val: any) => {
      if (val === null || val === '-' || String(val).trim() === '') return 0;
      const n = parseFloat(String(val).replace(/[",\s]/g, ''));
      return isNaN(n) ? 0 : n;
    };

    const map = new Map<string, {
      rcfProduction: number;
      rcfSales: number;
      rcfStock: number;
      boomiProduction: number;
      boomiSales: number;
      boomiStock: number;
    }>();

    allStockData.forEach(row => {
      const d = String(row[dateCol]).trim();
      if (!d) return;

      map.set(d, {
        rcfProduction: parseNum(row[rcfProdCol!] || 0),
        rcfSales:      parseNum(row[rcfSalesCol!] || 0),
        rcfStock:      parseNum(row[rcfStockCol!] || 0),
        boomiProduction: parseNum(row[boomiProdCol!] || 0),
        boomiSales:      parseNum(row[boomiSalesCol!] || 0),
        boomiStock:      parseNum(row[boomiStockCol!] || 0),
      });
    });

    const sortedDates = Array.from(map.keys()).sort((a, b) =>
      new Date(a).getTime() - new Date(b).getTime()
    );

    const aggregate = (dates: string[]) => {
      if (dates.length <= 15) {
        return { dates, map };
      }

      const aggregatedDates: string[] = [];
      const aggregatedMap = new Map<string, any>();

      if (dates.length > 50) {
        const monthMap = new Map<string, any>();
        dates.forEach(d => {
          const m = new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
          const data = map.get(d)!;
          const mm = monthMap.get(m) || { ...data, count: 0 };
          mm.rcfProduction += data.rcfProduction;
          mm.rcfSales      += data.rcfSales;
          mm.rcfStock      += data.rcfStock;
          mm.boomiProduction += data.boomiProduction;
          mm.boomiSales      += data.boomiSales;
          mm.boomiStock      += data.boomiStock;
          mm.count++;
          monthMap.set(m, mm);
        });

        Array.from(monthMap.keys()).sort().forEach(m => {
          const d = monthMap.get(m);
          aggregatedDates.push(m);
          aggregatedMap.set(m, {
            rcfProduction: Math.round(d.rcfProduction / d.count),
            rcfSales:      Math.round(d.rcfSales / d.count),
            rcfStock:      Math.round(d.rcfStock / d.count),
            boomiProduction: Math.round(d.boomiProduction / d.count),
            boomiSales:      Math.round(d.boomiSales / d.count),
            boomiStock:      Math.round(d.boomiStock / d.count),
          });
        });
      } else {
        const step = Math.ceil(dates.length / 12);
        for (let i = 0; i < dates.length; i += step) {
          const d = dates[i];
          aggregatedDates.push(d);
          aggregatedMap.set(d, map.get(d));
        }
      }

      return { dates: aggregatedDates, map: aggregatedMap };
    };

    const useAgg = chartType === 'horizontalBar';
    const { dates: finalDates, map: finalMap } = useAgg
      ? aggregate(sortedDates)
      : { dates: sortedDates, map };

    const makeData = () => ({
      categories: finalDates,
      series: [
        { name: 'Production/RCF',        data: finalDates.map(d => finalMap.get(d).rcfProduction), color: '#3b82f6' },
        { name: 'Sales/RCF',             data: finalDates.map(d => finalMap.get(d).rcfSales),      color: '#ef4444' },
        { name: 'Unsold/RCF',            data: finalDates.map(d => finalMap.get(d).rcfStock),      color: '#f59e0b' },
      ]
    });

    return {
      rcfData: makeData(),
      boomiData: {
        categories: finalDates,
        series: [
          { name: 'Production/Boomi', data: finalDates.map(d => finalMap.get(d).boomiProduction), color: '#3b82f6' },
          { name: 'Sales/Boomi',      data: finalDates.map(d => finalMap.get(d).boomiSales),      color: '#ef4444' },
          { name: 'Unsold/Boomi',     data: finalDates.map(d => finalMap.get(d).boomiStock),      color: '#f59e0b' },
        ]
      },
      hasData: finalDates.length > 0
    };
  }, [state.datasets, state.activeDatasetIds, chartType]);

  if (!processStockData.hasData) return null;

  const createChartOptions = (title: string): ApexOptions => {
    const isHorizontal = chartType === 'horizontalBar';
    const actualType = isHorizontal ? 'bar' : chartType;
    const count = processStockData.rcfData!.categories.length;
    const dynamicHeight = isHorizontal ? Math.max(400, count * 40 + 200) : 500;
    
    // Create responsive options based on chart type
    const createResponsiveOptions = () => {
      const baseResponsive = {
        chart: { height: isHorizontal ? Math.max(300, count * 20 + 150) : 400 },
        xaxis: { labels: { rotate: isHorizontal ? 0 : -90, style: { fontSize: '10px' } } },
        yaxis: { labels: { style: { fontSize: '10px' } } }
      };

      if (actualType === 'bar') {
        return {
          ...baseResponsive,
          plotOptions: {
            bar: {
              columnWidth: isHorizontal ? '80%' : '85%',
              barHeight: isHorizontal ? '80%' : undefined
            }
          }
        };
      }

      return baseResponsive;
    };

    const options: ApexOptions = {
      chart: {
        type: actualType,
        background: 'transparent',
        toolbar: { show: false },
        height: dynamicHeight,
        animations: { enabled: true, easing: 'easeinout', speed: 800 }
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories: processStockData.rcfData!.categories,
        labels: {
          style: { colors: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: '12px' },
          rotate: isHorizontal ? 0 : -45
        },
        title: { text: isHorizontal ? 'Value (mt)' : 'Date', style: { color: isDarkMode ? '#9ca3af' : '#6b7280' } }
      },
      yaxis: {
        labels: {
          style: { colors: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: '11px' },
          formatter: val => {
            if (isHorizontal) {
              const d = String(val);
              return d.length > 7 && d.includes('-')
                ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : d;
            }
            const n = typeof val === 'string' ? parseFloat(val) : val;
            return n >= 1e6 ? `${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `${(n/1e3).toFixed(1)}K` : `${n}`;
          }
        },
        title: { text: isHorizontal ? 'Date' : 'Value (mt)', style: { color: isDarkMode ? '#9ca3af' : '#6b7280' } }
      },
      colors: processStockData.rcfData!.series.map(s => s.color),
      theme: { mode: isDarkMode ? 'dark' : 'light' },
      grid: { borderColor: isDarkMode ? '#374151' : '#e5e7eb', padding: { top: 10, right: 15, bottom: 10, left: 15 } },
      tooltip: {
        theme: isDarkMode ? 'dark' : 'light',
        shared: true,
        intersect: false,
        y: { formatter: v => v >= 1e6 ? `${(v/1e6).toFixed(2)}M mt` : v >= 1e3 ? `${(v/1e3).toFixed(2)}K mt` : `${v} mt` }
      },
      legend: {
        show: true,
        position: 'bottom',
        horizontalAlign: 'center',
        labels: { colors: isDarkMode ? '#9ca3af' : '#6b7280' },
        markers: { width: 12, height: 12, radius: 6 },
        itemMargin: { horizontal: 10, vertical: 5 }
      },
      responsive: [{
        breakpoint: 768,
        options: createResponsiveOptions()
      }]
    };

    // Add chart-type specific options
    if (actualType === 'bar') {
      options.plotOptions = {
        bar: {
          horizontal: isHorizontal,
          borderRadius: 3,
          columnWidth: isHorizontal ? '70%' : '75%',
          barHeight: isHorizontal ? '75%' : undefined,
          dataLabels: { position: isHorizontal ? 'bottom' : 'top' }
        }
      };
    } else if (actualType === 'line') {
      options.stroke = {
        curve: 'smooth',
        width: 2
      };
      options.markers = {
        size: 4,
        strokeWidth: 2,
        hover: {
          size: 6
        }
      };
    }

    return options;
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {processStockData.rcfData && (
        <ChartContainer
          title="RCF: Production, Sales, and Unsold Stock Over Time"
          availableTypes={['bar', 'line', 'horizontalBar']}
          currentType={chartType}
          onChartTypeChange={type => setChartType(type as any)}
        >
          <Chart
            options={createChartOptions('RCF')}
            series={processStockData.rcfData.series}
            type={chartType === 'horizontalBar' ? 'bar' : chartType}
            height={createChartOptions('RCF').chart!.height!}
            width="100%"
          />
        </ChartContainer>
      )}
      {processStockData.boomiData && (
        <ChartContainer
          title="Boomi Samrudhi: Production, Sales, and Unsold Stock Over Time"
          availableTypes={['bar', 'line', 'horizontalBar']}
          currentType={chartType}
          onChartTypeChange={type => setChartType(type as any)}
        >
          <Chart
            options={createChartOptions('Boomi Samrudhi')}
            series={processStockData.boomiData.series}
            type={chartType === 'horizontalBar' ? 'bar' : chartType}
            height={createChartOptions('Boomi Samrudhi').chart!.height!}
            width="100%"
          />
        </ChartContainer>
      )}
    </div>
  );
}

export default StockAnalysisChart;

