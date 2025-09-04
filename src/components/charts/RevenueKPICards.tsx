import React, { useMemo } from "react";
import { TrendingUp, DollarSign, Calendar, BarChart3 } from "lucide-react";
import { useApp } from "../../contexts/AppContext";
import { ColorManager } from "../../utils/colorManager";
import { DataProcessor } from "../../utils/dataProcessing";

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

export function RevenueKPICards({ className = "" }: RevenueKPICardsProps) {
  const { state } = useApp();

  // Process revenue data from Revenue table
  const revenueData = useMemo((): RevenueData[] => {
    // Find Revenue datasets
    const revenueDatasets = state.datasets.filter(
      (dataset) =>
        state.activeDatasetIds.includes(dataset.id) &&
        (dataset.name.toLowerCase().includes("revenue") ||
          dataset.fileName.toLowerCase().includes("revenue"))
    );

    if (revenueDatasets.length === 0) {
      return [];
    }

    // Combine all revenue data
    const allRevenueData = revenueDatasets.flatMap((dataset) => dataset.data);

    if (allRevenueData.length === 0) {
      return [];
    }

    // Find required columns (case-insensitive)
    const sampleRow = allRevenueData[0];
    const columns = Object.keys(sampleRow);

    const monthsColumn = columns.find((col) => {
      const lowerCol = col.toLowerCase().trim();
      return lowerCol === "months" || lowerCol === "month";
    });

    const directSalesFOMColumn = columns.find((col) => {
      const lowerCol = col.toLowerCase().trim();
      return (
        lowerCol === "direct sales fom" ||
        (lowerCol.includes("direct") && lowerCol.includes("fom"))
      );
    });

    const directSalesLFOMColumn = columns.find((col) => {
      const lowerCol = col.toLowerCase().trim();
      return (
        lowerCol === "direct sales lfom" ||
        (lowerCol.includes("direct") && lowerCol.includes("lfom"))
      );
    });

    const mdaClaimColumn = columns.find((col) => {
      const lowerCol = col.toLowerCase().trim();
      return (
        lowerCol === "mda claim received" ||
        (lowerCol.includes("mda") && lowerCol.includes("claim"))
      );
    });

    const totalRevenueColumn = columns.find((col) => {
      const lowerCol = col.toLowerCase().trim();
      return (
        lowerCol === "total revenue" ||
        (lowerCol.includes("total") && lowerCol.includes("revenue"))
      );
    });

    if (
      !monthsColumn ||
      !directSalesFOMColumn ||
      !directSalesLFOMColumn ||
      !mdaClaimColumn ||
      !totalRevenueColumn
    ) {
      console.warn("Revenue KPI: Missing required columns");
      return [];
    }

    // Parse amount function for Indian number format
    const parseAmount = (value: any): number => {
      if (
        value === null ||
        value === undefined ||
        value === "-" ||
        value === "" ||
        String(value).trim() === "" ||
        String(value).toLowerCase() === "nan"
      ) {
        return 0;
      }

      let cleaned = String(value).replace(/[",\s]/g, "");

      if (cleaned.endsWith(".00")) {
        cleaned = cleaned.slice(0, -3);
      }

      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    // Process data
    const processedData: RevenueData[] = allRevenueData
      .map((row) => ({
        month: String(row[monthsColumn] || "").trim(),
        directSalesFOM: parseAmount(row[directSalesFOMColumn]),
        directSalesLFOM: parseAmount(row[directSalesLFOMColumn]),
        mdaClaimReceived: parseAmount(row[mdaClaimColumn]),
        totalRevenue: parseAmount(row[totalRevenueColumn]),
      }))
      .filter((item) => item.month && item.month !== "");

    // Sort by month order
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

    const monthFilters =
      state.filters.selectedValues["Months"] ||
      state.filters.selectedValues["Month"] ||
      [];

    if (monthFilters.length > 0) {
      filtered = filtered.filter((item) => monthFilters.includes(item.month));
    }

    return filtered;
  }, [revenueData, state.filters]);

  // Get latest month data from the (potentially filtered) data
  const latestMonthData =
    filteredRevenueData.length > 0
      ? filteredRevenueData[filteredRevenueData.length - 1]
      : null;

  if (!latestMonthData) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return DataProcessor.formatCurrency(amount, state.settings.currency);
  };

  const displayData = latestMonthData;

  return (
    <div className={`grid grid-cols-1 gap-6 ${className}`}>
      <div className="card hover:shadow-lg transition-all duration-200">
        <div className="flex justify-between items-start">
          {/* Left Side: Total Revenue */}
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              <p className="text-sm font-medium text-primary-700 dark:text-primary-300">
                Total Revenue for {displayData.month}
              </p>
            </div>
            <p className="text-3xl font-semibold text-primary-900 dark:text-primary-100">
              {formatCurrency(displayData.totalRevenue)}
            </p>
          </div>

          {/* Vertical Divider */}
          <div className="border-l border-gray-200 dark:border-gray-800 h-[7rem] self-center"></div>

          {/* Right Side: Breakdown */}
          <div className="flex-1 pl-6">
            <div className="space-y-3">
              {/* Direct Sales FOM */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                  <p className="text-[1.1rem] font-small text-gray-700 dark:text-gray-200">
                    Direct Sales FOM
                  </p>
                </div>
                <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {formatCurrency(displayData.directSalesFOM)}
                </p>
              </div>

              {/* Direct Sales LFOM */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                  <p className="text-[1.1rem] font-small text-gray-700 dark:text-gray-200">
                    Direct Sales LFOM
                  </p>
                </div>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {formatCurrency(displayData.directSalesLFOM)}
                </p>
              </div>

              {/* MDA Claim Received */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
                  <p className="text-[1.1rem] font-small text-gray-700 dark:text-gray-200">
                    MDA Claim Received
                  </p>
                </div>
                <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                  {formatCurrency(displayData.mdaClaimReceived)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RevenueKPICards;
