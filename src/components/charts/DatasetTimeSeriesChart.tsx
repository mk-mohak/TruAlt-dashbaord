import React, { useState, useMemo } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { ChartContainer } from "./ChartContainer";
import { useApp } from "../../contexts/AppContext";
import { DataProcessor } from "../../utils/dataProcessing";
import { Database } from "lucide-react";

// Use the same color function for consistency
const getDatasetColorByName = (datasetName: string) => {
  const lowerName = datasetName.toLowerCase();

  // Fixed color mapping based on dataset type
  if (
    lowerName.includes("pos") &&
    lowerName.includes("fom") &&
    !lowerName.includes("lfom")
  ) {
    return "#3b82f6"; // Blue for POS FOM
  } else if (lowerName.includes("pos") && lowerName.includes("lfom")) {
    return "#7ab839"; // Green for POS LFOM
  } else if (lowerName.includes("lfom") && !lowerName.includes("pos")) {
    return "#7ab839"; // Green for LFOM
  } else if (
    lowerName.includes("fom") &&
    !lowerName.includes("pos") &&
    !lowerName.includes("lfom")
  ) {
    return "#f97316"; // Orange for FOM
  }

  // Fallback colors for other datasets
  const baseColors = [
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
    "#f59e0b",
    "#dc2626",
    "#84cc16",
    "#059669",
  ];

  return baseColors[Math.abs(datasetName.length) % baseColors.length];
};

const getDatasetDisplayName = (datasetName: string) => {
  const lowerName = datasetName.toLowerCase();

  if (
    lowerName.includes("pos") &&
    lowerName.includes("fom") &&
    !lowerName.includes("lfom")
  ) {
    return "POS FOM";
  } else if (lowerName.includes("pos") && lowerName.includes("lfom")) {
    return "POS LFOM";
  } else if (lowerName.includes("lfom") && !lowerName.includes("pos")) {
    return "LFOM";
  } else if (
    lowerName.includes("fom") &&
    !lowerName.includes("pos") &&
    !lowerName.includes("lfom")
  ) {
    return "FOM";
  }

  return datasetName;
};

interface DatasetTimeSeriesChartProps {
  className?: string;
}

export function DatasetTimeSeriesChart({
  className = "",
}: DatasetTimeSeriesChartProps) {
  const { state, getMultiDatasetData } = useApp();
  const [chartType, setChartType] = useState<"line" | "area" | "bar">("line");
  const isDarkMode = state.settings.theme === "dark";

  const multiDatasetData = getMultiDatasetData();
  const isMultiDataset = multiDatasetData.length > 1;

  // Process time series data for each dataset
  const processTimeSeriesData = useMemo(() => {
    if (state.datasets.length === 0) {
      return { categories: [], series: [], hasData: false };
    }

    const allMonths = new Set<string>();
    const datasetSeries: any[] = [];

    // Process each active dataset
    state.datasets
      .filter((dataset) => state.activeDatasetIds.includes(dataset.id))
      .forEach((dataset, index) => {
        // Find quantity and month columns
        const quantityColumn = Object.keys(dataset.data[0] || {}).find(
          (col) => col.toLowerCase() === "quantity"
        );
        const monthColumn = Object.keys(dataset.data[0] || {}).find(
          (col) => col.toLowerCase() === "month"
        );

        if (!quantityColumn || !monthColumn) {
          return;
        }

        // Group by month and sum quantities
        const monthlyData = new Map<string, number>();

        dataset.data.forEach((row) => {
          const month = String(row[monthColumn] || "").trim();
          const quantity = parseFloat(String(row[quantityColumn] || "0")) || 0;

          if (month && quantity > 0) {
            allMonths.add(month);
            const currentTotal = monthlyData.get(month) || 0;
            monthlyData.set(month, currentTotal + quantity);
          }
        });

        // Determine dataset display name
        datasetSeries.push({
          name: DataProcessor.getDatasetDisplayName(dataset.name),
          data: monthlyData,
          color: DataProcessor.getDatasetColorByName(dataset.name),
          datasetId: dataset.id,
        });
      });

    // Sort months chronologically
    const sortedMonths = Array.from(allMonths).sort((a, b) => {
      const monthOrder = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      return monthOrder.indexOf(a) - monthOrder.indexOf(b);
    });

    // Create final series with aligned data
    const finalSeries = datasetSeries.map((series) => ({
      name: series.name,
      data: sortedMonths.map((month) => {
        const value = series.data.get(month) || 0;
        return Math.round(value * 100) / 100; // Round to 2 decimal places
      }),
      color: series.color,
    }));

    return {
      categories: sortedMonths,
      series: finalSeries,
      hasData: finalSeries.length > 0 && sortedMonths.length > 0,
    };
  }, [state.datasets, state.activeDatasetIds]);

  if (!processTimeSeriesData.hasData) {
    return (
      <ChartContainer
        title="Quantity Trends by Month - All Datasets"
        availableTypes={["line", "area", "bar"]}
        currentType={chartType}
        onChartTypeChange={(type) =>
          setChartType(type as "line" | "area" | "bar")
        }
        className={className}
      >
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No Time Series Data Available</p>
            <p className="text-sm mt-2">
              Upload datasets with 'Quantity' and 'Month' columns to view trends
            </p>
          </div>
        </div>
      </ChartContainer>
    );
  }

  const chartOptions: ApexOptions = {
    chart: {
      type: chartType,
      background: "transparent",
      toolbar: { show: false },
      animations: {
        enabled: true,
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150,
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350,
        },
      },
    },

    stroke: {
      curve: "smooth",
      width: chartType === "line" ? 4 : chartType === "area" ? 3 : 0,
    },

    fill: {
      type: chartType === "area" ? "gradient" : "solid",
      gradient:
        chartType === "area"
          ? {
              shadeIntensity: 1,
              type: "vertical",
              opacityFrom: 0.7,
              opacityTo: 0.1,
              stops: [0, 100],
            }
          : undefined,
      colors: processTimeSeriesData.series.map((s) => s.color),
    },

    dataLabels: { enabled: false },

    xaxis: {
      categories: processTimeSeriesData.categories,
      labels: {
        style: { colors: isDarkMode ? "#9ca3af" : "#6b7280" },
        rotate: processTimeSeriesData.categories.length > 6 ? -45 : 0,
      },
      title: {
        text: "Months",
        style: { color: isDarkMode ? "#9ca3af" : "#6b7280" },
      },
    },

    yaxis: {
      labels: {
        formatter: (val: number) => {
          return val.toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          });
        },
        style: { colors: isDarkMode ? "#9ca3af" : "#6b7280" },
      },
      title: {
        text: "Total Quantity",
        style: { color: isDarkMode ? "#9ca3af" : "#6b7280" },
      },
    },

    colors: processTimeSeriesData.series.map((s) => s.color),

    theme: { mode: isDarkMode ? "dark" : "light" },

    grid: {
      borderColor: isDarkMode ? "#374151" : "#e5e7eb",
      padding: {
        top: 0,
        right: 10,
        bottom: 0,
        left: 10,
      },
    },

    tooltip: {
      theme: isDarkMode ? "dark" : "light",
      shared: true,
      intersect: false,
      y: {
        formatter: (val: number) => {
          return `${val.toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          })} mt`;
        },
      },
    },

    legend: {
      show: true,
      position: "top",
      labels: { colors: isDarkMode ? "#9ca3af" : "#6b7280" },
      markers: {
        width: 12,
        height: 12,
        radius: 6,
      },
    },

    markers: {
      size: chartType === "line" ? 6 : 0,
      colors: processTimeSeriesData.series.map((s) => s.color),
      strokeColors: "#ffffff",
      strokeWidth: 2,
      hover: { size: 8 },
    },

    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: "55%",
        dataLabels: { position: "top" },
        distributed: false,
      },
    },

    responsive: [
      {
        breakpoint: 768,
        options: {
          legend: { position: "bottom" },
          xaxis: {
            labels: { rotate: -90 },
          },
        },
      },
    ],
  };

  return (
    <ChartContainer
      title={`Quantity Trends by Month${
        isMultiDataset ? " - Dataset Comparison" : ""
      }`}
      availableTypes={["line", "area", "bar"]}
      currentType={chartType}
      onChartTypeChange={(type) =>
        setChartType(type as "line" | "area" | "bar")
      }
      className={className}
    >
      <div className="w-full h-full min-h-[500px]">
        <Chart
          key={chartType}
          options={chartOptions}
          series={processTimeSeriesData.series}
          type={chartType}
          height="500px"
          width="100%"
        />
      </div>
    </ChartContainer>
  );
}
