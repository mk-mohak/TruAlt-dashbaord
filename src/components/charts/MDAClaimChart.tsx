import React, { useState, useMemo } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { FlexibleDataRow } from '../../types';
import { ChartContainer } from './ChartContainer';
import { useApp } from '../../contexts/AppContext';
import { DataProcessor } from '../../utils/dataProcessing';
import { ColorManager } from '../../utils/colorManager';

interface MDAClaimChartProps {
  className?: string;
}

export function MDAClaimChart({ className = '' }: MDAClaimChartProps) {
  const { state } = useApp();
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('line');
  const isDarkMode = state.settings.theme === 'dark';

  // Process MDA claim data
  const processMDAData = useMemo(() => {
    // Find MDA claim datasets
    const mdaDatasets = state.datasets.filter(dataset => 
      state.activeDatasetIds.includes(dataset.id) && 
      ColorManager.isMDAClaimDataset(dataset.name)
    );

    if (mdaDatasets.length === 0) {
      console.log('MDA Chart: No MDA datasets found');
      return { categories: [], series: [], hasData: false };
    }

    // Combine all MDA claim data
    const allMDAData = mdaDatasets.flatMap(dataset => dataset.data);

    if (allMDAData.length === 0) {
      console.log('MDA Chart: No data in MDA datasets');
      return { categories: [], series: [], hasData: false };
    }

    // Find required columns (exact match first, then case-insensitive)
    const sampleRow = allMDAData[0];
    const columns = Object.keys(sampleRow);
    
    console.log('MDA Chart: Available columns:', columns);
    
    // Find Month column
    const monthColumn = columns.find(col => {
      const lowerCol = col.toLowerCase().trim();
      return lowerCol === 'month' || 
             lowerCol.includes('month') ||
             lowerCol === 'period' ||
             lowerCol.includes('time') ||
             lowerCol.includes('date');
    });
    
    // Find Year column
    const yearColumn = columns.find(col => {
      const lowerCol = col.toLowerCase().trim();
      return lowerCol === 'year' || lowerCol.includes('year');
    });
    
    // Find Eligible Amount column
    const eligibleAmountColumn = columns.find(col => {
      const lowerCol = col.toLowerCase().trim();
      return lowerCol === 'eligible amount' ||
             (lowerCol.includes('eligible') && lowerCol.includes('amount')) ||
             lowerCol.includes('eligible_amount') ||
             lowerCol.includes('eligibleamount');
    });
    
    // Find Amount Received column
    const amountReceivedColumn = columns.find(col => {
      const lowerCol = col.toLowerCase().trim();
      return lowerCol === 'amount received' ||
             (lowerCol.includes('amount') && lowerCol.includes('received')) ||
             lowerCol.includes('amount_received') ||
             lowerCol.includes('amountreceived') ||
             lowerCol.includes('received_amount');
    });

    console.log('MDA Chart: Column detection results:', {
      monthColumn,
      yearColumn,
      eligibleAmountColumn,
      amountReceivedColumn
    });

    if (!monthColumn || !yearColumn || !eligibleAmountColumn || !amountReceivedColumn) {
      console.warn('MDA Chart: Missing required columns');
      return { categories: [], series: [], hasData: false };
    }

    // Month name mapping
    const monthAbbrevMap: { [key: string]: string } = {
      'January': 'Jan', 'February': 'Feb', 'March': 'Mar', 'April': 'Apr',
      'May': 'May', 'June': 'Jun', 'July': 'Jul', 'August': 'Aug',
      'September': 'Sep', 'October': 'Oct', 'November': 'Nov', 'December': 'Dec'
    };

    // Function to format month-year from separate year and month columns
    const formatMonthYear = (year: any, month: any): string | null => {
      if (!year || !month || month === '-' || month === '' || String(month).trim() === '') {
        return null;
      }
      
      try {
        const yearNum = parseInt(String(year));
        const monthStr = String(month).trim();
        
        if (isNaN(yearNum) || !monthStr) {
          return null;
        }
        
        // Convert month name to abbreviated format
        const monthAbbrev = monthAbbrevMap[monthStr] || monthStr.substring(0, 3);
        const yearAbbrev = yearNum.toString().slice(-2); // Get last 2 digits
        
        return `${monthAbbrev}-${yearAbbrev}`;
      } catch (error) {
        console.warn('Error formatting month-year:', { year, month, error });
        return null;
      }
    };

    // Enhanced number parsing function
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

    // Group by month and sum amounts
    const monthlyData = new Map<string, { eligible: number; received: number }>();
    let processedRows = 0;
    let validRows = 0;

    allMDAData.forEach((row, index) => {
      processedRows++;
      
      const year = row[yearColumn];
      const month = row[monthColumn];
      const eligibleRaw = row[eligibleAmountColumn];
      const receivedRaw = row[amountReceivedColumn];
      
      // Format month-year
      const monthYear = formatMonthYear(year, month);
      if (!monthYear) {
        return;
      }

      // Parse amounts
      const eligible = parseAmount(eligibleRaw);
      const received = parseAmount(receivedRaw);
      
      if (index < 10) { // Log first 10 rows for debugging
        console.log(`MDA Chart Row ${index + 1}: Year=${year}, Month=${month} -> ${monthYear}, Eligible=${eligibleRaw} -> ${eligible}, Received=${receivedRaw} -> ${received}`);
      }

      // Include rows with valid amounts (including zero, but at least one should be > 0)
      if (eligible > 0 || received > 0) {
        if (!monthlyData.has(monthYear)) {
          monthlyData.set(monthYear, { eligible: 0, received: 0 });
        }
        
        const current = monthlyData.get(monthYear)!;
        current.eligible += eligible;
        current.received += received;
        validRows++;
      }
    });

    console.log(`MDA Chart: Processed ${processedRows} rows, ${validRows} valid rows, ${monthlyData.size} monthly data points`);

    if (monthlyData.size === 0) {
      console.warn('MDA Chart: No valid monthly data points generated');
      return { categories: [], series: [], hasData: false };
    }

    // Sort months chronologically
    const sortedMonths = Array.from(monthlyData.keys()).sort((a, b) => {
      const partsA = a.split('-');
      const partsB = b.split('-');
      
      if (partsA.length !== 2 || partsB.length !== 2) {
        return 0;
      }
      
      const [monthA, yearA] = partsA;
      const [monthB, yearB] = partsB;
      
      const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      // Convert 2-digit years to 4-digit years
      let fullYearA = parseInt(yearA);
      let fullYearB = parseInt(yearB);
      
      if (fullYearA < 100) {
        fullYearA += fullYearA < 50 ? 2000 : 1900;
      }
      if (fullYearB < 100) {
        fullYearB += fullYearB < 50 ? 2000 : 1900;
      }
      
      const yearComparison = fullYearA - fullYearB;
      if (yearComparison !== 0) return yearComparison;
      
      return monthOrder.indexOf(monthA) - monthOrder.indexOf(monthB);
    });

    const eligibleData = sortedMonths.map(month => {
      const data = monthlyData.get(month)!;
      return Math.round(data.eligible * 100) / 100;
    });

    const receivedData = sortedMonths.map(month => {
      const data = monthlyData.get(month)!;
      return Math.round(data.received * 100) / 100;
    });

    console.log('MDA Chart: Final processing results:', {
      sortedMonths,
      eligibleDataSample: eligibleData.slice(0, 5),
      receivedDataSample: receivedData.slice(0, 5),
      totalEligible: eligibleData.reduce((sum, val) => sum + val, 0),
      totalReceived: receivedData.reduce((sum, val) => sum + val, 0)
    });

    return {
      categories: sortedMonths,
      series: [
        {
          name: 'Eligible Amount',
          data: eligibleData,
          color: '#3b82f6' // Blue
        },
        {
          name: 'Amount Received',
          data: receivedData,
          color: '#22c55e' // Green
        }
      ],
      hasData: sortedMonths.length > 0 && (eligibleData.some(v => v > 0) || receivedData.some(v => v > 0))
    };
  }, [state.datasets, state.activeDatasetIds]);

  if (!processMDAData.hasData) {
    console.log('MDA Chart: No data to display, component will not render');
    return null;
  }

  console.log('MDA Chart: Rendering chart with data:', {
    categoriesCount: processMDAData.categories.length,
    seriesCount: processMDAData.series.length
  });

  const chartOptions: ApexOptions = {
    chart: {
      type: chartType,
      background: 'transparent',
      toolbar: { show: false },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800
      }
    },
    
    stroke: {
      curve: 'smooth',
      width: chartType === 'line' ? 4 : chartType === 'area' ? 3 : 0,
    },
    
    fill: {
      type: chartType === 'area' ? 'gradient' : 'solid',
      gradient: chartType === 'area' ? {
        shadeIntensity: 1,
        type: 'vertical',
        colorStops: [
          { offset: 0, color: '#3b82f6', opacity: 0.8 },
          { offset: 50, color: '#3b82f6', opacity: 0.4 },
          { offset: 100, color: '#3b82f6', opacity: 0.1 }
        ]
      } : undefined
    },
    
    dataLabels: { enabled: false },
    
    xaxis: {
      categories: processMDAData.categories,
      labels: {
        style: { colors: isDarkMode ? '#9ca3af' : '#6b7280' },
        rotate: processMDAData.categories.length > 8 ? -45 : 0
      },
      title: {
        text: 'Months',
        style: { color: isDarkMode ? '#9ca3af' : '#6b7280' }
      }
    },
    
    yaxis: {
      labels: {
        formatter: (val: number) => {
          // Format values in thousands/lakhs/crores
          if (val >= 10000000) { // 1 crore
            return `₹${(val / 10000000).toFixed(1)}Cr`;
          } else if (val >= 100000) { // 1 lakh
            return `₹${(val / 100000).toFixed(1)}L`;
          } else if (val >= 1000) { // 1 thousand
            return `₹${(val / 1000).toFixed(1)}K`;
          }
          return `₹${val}`;
        },
        style: { colors: isDarkMode ? '#9ca3af' : '#6b7280' }
      },
      title: {
        text: 'Amount (₹)',
        style: { color: isDarkMode ? '#9ca3af' : '#6b7280' }
      }
    },
    
    colors: processMDAData.series.map(s => s.color),
    
    theme: { mode: isDarkMode ? 'dark' : 'light' },
    
    grid: { 
      borderColor: isDarkMode ? '#374151' : '#e5e7eb',
      padding: {
        top: 0,
        right: 10,
        bottom: 0,
        left: 10
      }
    },
    
    tooltip: {
      theme: isDarkMode ? 'dark' : 'light',
      shared: true,
      intersect: false,
      y: {
        formatter: (val: number) => {
          // Format tooltip values
          if (val >= 10000000) { // 1 crore
            return `₹${(val / 10000000).toFixed(2)} Crores`;
          } else if (val >= 100000) { // 1 lakh
            return `₹${(val / 100000).toFixed(2)} Lakhs`;
          } else if (val >= 1000) { // 1 thousand
            return `₹${(val / 1000).toFixed(2)} Thousands`;
          }
          return `₹${val.toLocaleString()}`;
        }
      }
    },
    
    legend: {
      show: true,
      position: 'top',
      labels: { colors: isDarkMode ? '#9ca3af' : '#6b7280' },
      markers: {
        width: 12,
        height: 12,
        radius: 6
      }
    },
    
    markers: {
      size: chartType === 'line' ? 6 : 0,
      colors: processMDAData.series.map(s => s.color),
      strokeColors: '#ffffff',
      strokeWidth: 2,
      hover: { size: 8 }
    },
    
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '75%',
        dataLabels: { position: 'top' }
      }
    },
    
    responsive: [{
      breakpoint: 768,
      options: {
        legend: { position: 'bottom' },
        xaxis: {
          labels: { rotate: -90 }
        }
      }
    }]
  };

  return (
    <ChartContainer
      title="MDA Claim Analysis - Eligible vs Received Amount"
      availableTypes={['line', 'area', 'bar']}
      currentType={chartType}
      onChartTypeChange={(type) => setChartType(type as 'line' | 'area' | 'bar')}
      className={className}
    >
      <div className="w-full h-full min-h-[500px]">
        <Chart
          options={chartOptions}
          series={processMDAData.series}
          type={chartType}
          height="500px"
          width="100%"
        />
      </div>
    </ChartContainer>
  );
}