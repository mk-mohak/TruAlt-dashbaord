import React from "react";
import { FlexibleDataRow } from "../../types";
import { DatasetSpecificKPIs } from "../charts/DatasetSpecificKPIs";
import { DatasetTimeSeriesChart } from "../charts/DatasetTimeSeriesChart";
import { WeeklyDataDistributionChart } from "../charts/WeeklyDataDistributionChart";
import { DynamicRevenueBreakdownChart } from "../charts/DynamicRevenueBreakdownChart";
import { MDAClaimChart } from "../charts/MDAClaimChart";
import { MDAClaimKPI } from "../charts/MDAClaimKPI";
import { StockAnalysisChart } from "../charts/StockAnalysisChart";
import { BuyerTypeAnalysisChart } from "../charts/BuyerTypeAnalysisChart";
import { StockKPICards } from "../charts/StockKPICards";
import { useApp } from "../../contexts/AppContext";
import { DrillDownBreadcrumb } from "../DrillDownBreadcrumb";
import { DataProcessor } from "../../utils/dataProcessing";
import { ColorManager } from "../../utils/colorManager";

interface OverviewTabProps {
  data: FlexibleDataRow[];
}

export function OverviewTab({ data }: OverviewTabProps) {
  const { state } = useApp();
  const isDarkMode = state.settings.theme === "dark";

  // Check if MDA claim data is available
  const hasMDAClaimData = state.datasets.some(
    (dataset) =>
      state.activeDatasetIds.includes(dataset.id) &&
      ColorManager.isMDAClaimDataset(dataset.name)
  );

  // Check if stock data is available
  const hasStockData = state.datasets.some(
    (dataset) =>
      state.activeDatasetIds.includes(dataset.id) &&
      ColorManager.isStockDataset(dataset.name)
  );

  const hasFOMData = state.datasets.some(
    (dataset) =>
      state.activeDatasetIds.includes(dataset.id) &&
      (dataset.name.toLowerCase().includes("fom") ||
        dataset.fileName.toLowerCase().includes("fom") ||
        (dataset.detectedColumns?.includes("Buyer Type") &&
          dataset.detectedColumns?.includes("Price") &&
          dataset.detectedColumns?.includes("Name")))
  );

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <p className="text-lg font-medium">No data available</p>
          <p className="text-sm">Upload data to view the dashboard overview</p>
        </div>
      </div>
    );
  }

  const numericColumns = DataProcessor.findNumericColumns(data);
  const categoricalColumns = DataProcessor.findCategoricalColumns(data);
  const dateColumn = DataProcessor.findDateColumn(data);

  return (
    <div className="space-y-8">
      {/* Drill-down Breadcrumb */}
      <DrillDownBreadcrumb />

      {/* Dataset-Specific KPI Cards */}
      <div className="grid grid-cols-1 gap-6">
        <DatasetSpecificKPIs />

        {/* Stock KPI Cards - Only show when stock data is available */}
        {hasStockData && <StockKPICards />}

        {/* MDA Claim KPI - Only show when MDA claim data is available */}
        {hasMDAClaimData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <MDAClaimKPI />
          </div>
        )}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1">
        <WeeklyDataDistributionChart />
      </div>

      {hasFOMData && <BuyerTypeAnalysisChart />}

      {/* Quality Trends by Month - Repositioned */}
      <DatasetTimeSeriesChart />

      {/* Dynamic Revenue Breakdown */}
      <DynamicRevenueBreakdownChart />

      {/* Stock Analysis Charts - Only show when stock data is available */}
      {hasStockData && <StockAnalysisChart />}

      {/* MDA Claim Chart - Only show when MDA claim data is available */}
      {hasMDAClaimData && <MDAClaimChart />}
    </div>
  );
}
