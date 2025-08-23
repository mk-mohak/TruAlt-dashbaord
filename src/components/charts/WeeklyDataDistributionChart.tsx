import React, { useState, useMemo } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { ChartContainer } from './ChartContainer';
import { useApp } from '../../contexts/AppContext';
import { DataProcessor } from '../../utils/dataProcessing';

interface WeeklyDataDistributionChartProps {
  className?: string;
}

export function WeeklyDataDistributionChart({ className = '' }: WeeklyDataDistributionChartProps) {
  const { state, getMultiDatasetData } = useApp();
  const [chartType, setChartType] = useState<'bar' | 'horizontalBar'>('bar');
  const isDarkMode = state.settings.theme === 'dark';
  const isHorizontal = chartType === 'horizontalBar';

  // Process weekly data (same as before)
  const { categories, series, hasData } = useMemo(() => {
    const allWeekMonthCombos = new Set<string>();
    const datasetSeries: { name: string; dataMap: Map<string, number>; color: string }[] = [];

    state.datasets
      .filter(ds => state.activeDatasetIds.includes(ds.id))
      .forEach(ds => {
        const data = ds.data;
        if (!data.length) return;
        const qtyCol   = Object.keys(data[0]).find(c => c.toLowerCase() === 'quantity');
        const weekCol  = Object.keys(data[0]).find(c => c.toLowerCase() === 'week');
        const monthCol = Object.keys(data[0]).find(c => c.toLowerCase() === 'month');
        if (!qtyCol || !weekCol || !monthCol) return;

        const map = new Map<string, number>();
        data.forEach(row => {
          const week  = String(row[weekCol]).trim();
          const month = String(row[monthCol]).trim();
          const qty   = parseFloat(String(row[qtyCol]).replace(/[, ]/g, '')) || 0;
          if (!week || !month) return;
          const key = `${week}-${month}`;
          allWeekMonthCombos.add(key);
          map.set(key, (map.get(key) || 0) + qty);
        });

        datasetSeries.push({
          name: DataProcessor.getDatasetDisplayName(ds.name),
          dataMap: map,
          color: DataProcessor.getDatasetColorByName(ds.name)
        });
      });

    const sortedKeys = Array.from(allWeekMonthCombos).sort((a, b) => {
      const [wA, mA] = a.split('-');
      const [wB, mB] = b.split('-');
      const mo = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
      const ma = mo.indexOf(mA), mb = mo.indexOf(mB);
      if (ma !== mb) return ma - mb;
      return parseInt(wA.replace(/\D/g, '')) - parseInt(wB.replace(/\D/g, ''));
    });

    // Aggregate for horizontal if too many
    const aggregate = (keys: string[], map: Map<string, number>) => {
      if (keys.length <= 15) return { keys, map };
      const aggKeys: string[] = [];
      const aggMap = new Map<string, number>();
      const step = Math.ceil(keys.length / 12);
      for (let i = 0; i < keys.length; i += step) {
        const k = keys[i];
        aggKeys.push(k);
        aggMap.set(k, map.get(k)!);
      }
      return { keys: aggKeys, map: aggMap };
    };

    let finalKeys = sortedKeys;
    let finalMaps = datasetSeries.map(s => s.dataMap);
    if (isHorizontal) {
      // aggregate each dataset's map
      const { keys, map: _ } = aggregate(sortedKeys, new Map());
      finalKeys = keys;
      finalMaps = datasetSeries.map(s => aggregate(sortedKeys, s.dataMap).map);
    }

    const formattedCategories = finalKeys.map(k => {
      const [w, m] = k.split('-');
      return `${w} (${m.substring(0,3)})`;
    });

    const finalSeries = datasetSeries.map((s, idx) => ({
      name: s.name,
      data: finalKeys.map(k => finalMaps[idx].get(k) || 0),
      color: s.color
    }));

    return {
      categories: formattedCategories,
      series: finalSeries,
      hasData: finalSeries.length > 0 && finalKeys.length > 0
    };
  }, [state.datasets, state.activeDatasetIds, chartType]);

  if (!hasData) {
    return (
      <ChartContainer
        title="Data Distribution - Weekly Quantity Analysis"
        availableTypes={['bar','horizontalBar']}
        currentType={chartType}
        onChartTypeChange={t => setChartType(t as any)}
        className={className}
      >
        <div className="flex items-center justify-center h-64 text-gray-500">
          <p>No weekly data available.</p>
        </div>
      </ChartContainer>
    );
  }

  // Calculate dynamic height: 40px per category + 200px buffer
  const dynamicHeight = isHorizontal
    ? Math.max(400, categories.length * 40 + 200)
    : 500;

  const chartOptions: ApexOptions = {
    chart: {
      type: isHorizontal ? 'bar' : 'bar',
      height: dynamicHeight,
      background: 'transparent',
      toolbar: { show: false },
      animations: { enabled: true, easing: 'easeinout', speed: 800 }
    },
    plotOptions: {
      bar: {
        horizontal: isHorizontal,
        borderRadius: 4,
        columnWidth: isHorizontal ? '70%' : '75%',
        barHeight: isHorizontal ? '75%' : undefined,
        dataLabels: { position: isHorizontal ? 'bottom' : 'top' }
      }
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories,
      labels: {
        style: { colors: isDarkMode ? '#9ca3af' : '#6b7280' },
        rotate: isHorizontal ? 0 : -45
      },
      title: {
        text: isHorizontal ? 'Quantity' : 'Week (Month)',
        style: { color: isDarkMode ? '#9ca3af' : '#6b7280' }
      }
    },
    yaxis: {
      labels: {
        formatter: (val: number) =>
          val.toString().includes('.') 
            ? Math.round(val).toLocaleString() 
            : val.toLocaleString(),
        style: { colors: isDarkMode ? '#9ca3af' : '#6b7280' }
      },
      title: {
        text: isHorizontal ? 'Week (Month)' : 'Quantity',
        style: { color: isDarkMode ? '#9ca3af' : '#6b7280' }
      }
    },
    colors: series.map(s => s.color),
    theme: { mode: isDarkMode ? 'dark' : 'light' },
    grid: {
      borderColor: isDarkMode ? '#374151' : '#e5e7eb',
      padding: { top: 10, right: 15, bottom: 10, left: 15 }
    },
    tooltip: {
      theme: isDarkMode ? 'dark' : 'light',
      shared: true,
      intersect: false,
      y: { formatter: v => `${v.toLocaleString()} mt` }
    },
    legend: {
      show: true,
      position: 'top',
      labels: { colors: isDarkMode ? '#9ca3af' : '#6b7280' },
      markers: { width: 12, height: 12, radius: 6 }
    },
    responsive: [{
      breakpoint: 768,
      options: {
        chart: { height: isHorizontal ? Math.max(300, categories.length * 25 + 150) : 400 },
        xaxis: { labels: { rotate: isHorizontal ? 0 : -90 } }
      }
    }]
  };

  return (
    <ChartContainer
      title="Data Distribution - Weekly Quantity Analysis"
      availableTypes={['bar','horizontalBar']}
      currentType={chartType}
      onChartTypeChange={t => setChartType(t as any)}
      className={className}
    >
      <div className="w-full h-full" style={{ minHeight: `${dynamicHeight}px` }}>
        <Chart
          options={chartOptions}
          series={series}
          type={isHorizontal ? 'bar' : 'bar'}
          height={dynamicHeight}
          width="100%"
        />
      </div>
    </ChartContainer>
  );
}

export default WeeklyDataDistributionChart;
