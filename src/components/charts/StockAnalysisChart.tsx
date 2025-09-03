import React, { useState, useMemo } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { FlexibleDataRow } from "../../types";
import { ChartContainer } from "./ChartContainer";
import { useApp } from "../../contexts/AppContext";

interface StockAnalysisChartProps {
  className?: string;
}

// A robust helper function to parse 'dd-mm-yyyy' dates
const parseDate = (dateString: string): Date | null => {
  if (!dateString || typeof dateString !== "string") return null;

  const parts = dateString.split(/[-/]/); // Handles both '-' and '/' separators
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
    let year = parseInt(parts[2], 10);

    if (year < 100) {
      year += 2000;
    }

    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      const date = new Date(year, month, day);
      if (
        date.getFullYear() === year &&
        date.getMonth() === month &&
        date.getDate() === day
      ) {
        return date;
      }
    }
  }
  return null;
};

export function StockAnalysisChart({
  className = "",
}: StockAnalysisChartProps) {
  const { state } = useApp();
  const [chartType, setChartType] = useState<"area" | "bar">("area"); // Removed horizontalBar
  const isDarkMode = state.settings.theme === "dark";

  const processedData = useMemo(() => {
    const activeData = state.datasets
      .filter((d) => state.activeDatasetIds.includes(d.id))
      .flatMap((d) => d.data);

    if (activeData.length === 0) {
      return { rcfData: null, boomiData: null, hasData: false };
    }

    const monthlyData: {
      [month: string]: {
        rcfProduction: number[];
        rcfSales: number[];
        rcfStock: number[];
        boomiProduction: number[];
        boomiSales: number[];
        boomiStock: number[];
      };
    } = {};

    activeData.forEach((row) => {
      try {
        const date = parseDate(row["Date"] as string);
        if (!date) return;

        const monthKey = date.toLocaleString("en-US", {
          month: "short",
          year: "numeric",
        });

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            rcfProduction: [],
            rcfSales: [],
            rcfStock: [],
            boomiProduction: [],
            boomiSales: [],
            boomiStock: [],
          };
        }

        const parseAndPush = (arr: number[], value: any) => {
          if (
            value !== null &&
            value !== undefined &&
            String(value).trim() !== ""
          ) {
            const num = parseFloat(String(value).replace(/,/g, ""));
            if (!isNaN(num)) arr.push(num);
          }
        };

        parseAndPush(
          monthlyData[monthKey].rcfProduction,
          row["RCF Production"]
        );
        parseAndPush(monthlyData[monthKey].rcfSales, row["RCF Sales"]);
        parseAndPush(monthlyData[monthKey].rcfStock, row["RCF Stock Left"]);
        parseAndPush(
          monthlyData[monthKey].boomiProduction,
          row["Boomi Samrudhi Production"]
        );
        parseAndPush(
          monthlyData[monthKey].boomiSales,
          row["Boomi Samrudhi Sales"]
        );
        parseAndPush(
          monthlyData[monthKey].boomiStock,
          row["Boomi Samrudhi Stock Left"]
        );
      } catch (e) {
        console.error("Error processing row:", row, e);
      }
    });

    const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime();
    });

    if (sortedMonths.length === 0) {
      return { rcfData: null, boomiData: null, hasData: false };
    }

    const avg = (arr: number[]) =>
      arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    const createSeries = (product: "rcf" | "boomi") => {
      const p = product === "rcf" ? "rcf" : "boomi";
      return [
        {
          name: "Production",
          data: sortedMonths.map((m) =>
            Math.round(
              avg(
                monthlyData[m][
                  `${p}Production` as keyof (typeof monthlyData)[string]
                ]
              )
            )
          ),
          color: "#3b82f6",
        },
        {
          name: "Sales",
          data: sortedMonths.map((m) =>
            Math.round(
              avg(
                monthlyData[m][
                  `${p}Sales` as keyof (typeof monthlyData)[string]
                ]
              )
            )
          ),
          color: "#ef4444",
        },
        {
          name: "Unsold Stock",
          data: sortedMonths.map((m) =>
            Math.round(
              avg(
                monthlyData[m][
                  `${p}Stock` as keyof (typeof monthlyData)[string]
                ]
              )
            )
          ),
          color: "#ffc658",
        },
      ];
    };

    const rcfData = { categories: sortedMonths, series: createSeries("rcf") };
    const boomiData = {
      categories: sortedMonths,
      series: createSeries("boomi"),
    };

    return { rcfData, boomiData, hasData: true };
  }, [state.datasets, state.activeDatasetIds]);

  if (!processedData.hasData) return null;

  const createChartOptions = (categories: string[]): ApexOptions => {
    return {
      chart: {
        type: chartType,
        background: "transparent",
        toolbar: { show: false },
        height: 400,
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: "85%",
          borderRadius: 4,
          dataLabels: { position: "top" },
        },
      },
      dataLabels: { enabled: false },
      stroke: { curve: "smooth", width: chartType === "area" ? 2 : 0 },
      xaxis: {
        categories: categories,
        labels: { style: { colors: isDarkMode ? "#9ca3af" : "#6b7280" } },
        title: {
          text: "Month",
          style: { color: isDarkMode ? "#9ca3af" : "#6b7280" },
        },
      },
      yaxis: {
        labels: {
          style: { colors: isDarkMode ? "#9ca3af" : "#6b7280" },
          formatter: (val) => val.toFixed(0),
        },
        title: {
          text: "Average Value",
          style: { color: isDarkMode ? "#9ca3af" : "#6b7280" },
        },
      },
      tooltip: {
        theme: isDarkMode ? "dark" : "light",
        y: { formatter: (val) => `${val.toFixed(2)}` },
      },
      legend: {
        position: "bottom",
        horizontalAlign: "center",
        labels: { colors: isDarkMode ? "#9ca3af" : "#6b7280" },
      },
      grid: { borderColor: isDarkMode ? "#374151" : "#e5e7eb" },
      fill: { opacity: chartType === "area" ? 0.3 : 1, type: "solid" },
    };
  };

  const renderChart = (
    data: { categories: string[]; series: any[] } | null,
    title: string
  ) => {
    if (!data) return null;
    const options = createChartOptions(data.categories);
    return (
      <ChartContainer
        title={title}
        availableTypes={["area", "bar"]}
        currentType={chartType}
        onChartTypeChange={(type) => setChartType(type as any)}
      >
        <Chart
          options={options}
          series={data.series}
          type={chartType}
          height={options.chart?.height}
          width="100%"
        />
      </ChartContainer>
    );
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {renderChart(
        processedData.rcfData,
        "RCF: Production, Sales, and Unsold Stock Over Time"
      )}
      {renderChart(
        processedData.boomiData,
        "Boomi Samrudhi: Production, Sales, and Unsold Stock Over Time"
      )}
    </div>
  );
}

export default StockAnalysisChart;
