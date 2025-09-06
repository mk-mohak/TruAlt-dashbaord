import React, { useState, useEffect, useRef } from "react";
import {
  Menu,
  Sun,
  Moon,
  Calendar,
  Filter,
  Download,
  Search,
  Bell,
  User,
  Upload,
  X,
} from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { DataProcessor } from "../utils/dataProcessing";
import { ExportUtils } from "../utils/exportUtils";
import { SavedFilters } from "./SavedFilters";
import { Database, Wifi, WifiOff } from "lucide-react";
import { DatabaseSyncIndicator } from "./DatabaseSyncIndicator";
import { GlobalFilterIndicator } from "./filters/GlobalFilterIndicator";
import { GlobalFilterPanel } from "./filters/GlobalFilterPanel";
import { useAuth } from "../hooks/useAuth";
// @ts-ignore
import logoDark from "../assets/TrualtLogo2.png";
// @ts-ignore
import logoLight from "../assets/TrualtLogo.png";

// Fixed color mapping function
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

interface HeaderProps {
  onMobileMenuToggle: () => void;
  onUploadNewDataset: () => void;
}

export function Header({
  onMobileMenuToggle,
  onUploadNewDataset,
}: HeaderProps) {
  const {
    state,
    setFilters,
    setSettings,
    clearGlobalFilters,
    syncFromDatabase,
  } = useApp();
  const { user, signOut } = useAuth();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showGlobalFilters, setShowGlobalFilters] = useState(false);
  const [tempFilters, setTempFilters] = useState({
    dateRange: { start: "", end: "" },
    selectedValues: {} as { [column: string]: string[] },
  });
  const uploadMenuRef = useRef<HTMLDivElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Click-away logic for menus
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        showUploadMenu &&
        uploadMenuRef.current &&
        !uploadMenuRef.current.contains(event.target as Node)
      ) {
        setShowUploadMenu(false);
      }
      if (
        showFilterMenu &&
        filterMenuRef.current &&
        !filterMenuRef.current.contains(event.target as Node)
      ) {
        setShowFilterMenu(false);
      }
      if (
        showExportMenu &&
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target as Node)
      ) {
        setShowExportMenu(false);
      }
      if (
        showUserMenu &&
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUploadMenu, showFilterMenu, showExportMenu, showUserMenu]);

  // Initialize temp filters when filter menu opens
  useEffect(() => {
    if (showFilterMenu) {
      setTempFilters({
        dateRange: state.filters.dateRange,
        selectedValues: { ...state.filters.selectedValues },
      });
    }
  }, [showFilterMenu, state.filters]);

  // Get dynamic filter options based on active datasets
  const getFilterOptions = () => {
    if (state.data.length === 0)
      return { columns: [], dateRange: { start: "", end: "" } };

    const categoricalColumns = DataProcessor.findCategoricalColumns(state.data);
    const dateRange = DataProcessor.getDateRange(state.data);

    // Filter out address columns and get meaningful columns for filtering
    const filterableColumns = categoricalColumns.filter((col) => {
      const lowerCol = col.toLowerCase();
      return (
        !lowerCol.includes("address") &&
        !lowerCol.includes("adress") &&
        !lowerCol.includes("pin") &&
        !lowerCol.includes("code") &&
        lowerCol !== "date"
      );
    });

    const columnOptions = filterableColumns
      .map((column) => ({
        column,
        label: column,
        values: DataProcessor.getUniqueValues(state.data, column).slice(0, 50), // Limit to 50 options
      }))
      .filter(
        (option) => option.values.length > 0 && option.values.length <= 100
      ); // Only show columns with reasonable number of options

    return { columns: columnOptions, dateRange };
  };

  const { columns: filterColumns, dateRange } = getFilterOptions();

  const toggleTheme = () => {
    const newTheme = state.settings.theme === "light" ? "dark" : "light";
    const newSettings = {
      ...state.settings,
      theme: newTheme as "light" | "dark" | "system",
    };
    setSettings(newSettings);
  };

  const handleTempDateRangeChange = (start: string, end: string) => {
    setTempFilters((prev) => ({
      ...prev,
      dateRange: { start, end },
    }));
  };

  const handleTempColumnFilterChange = (column: string, values: string[]) => {
    setTempFilters((prev) => ({
      ...prev,
      selectedValues: {
        ...prev.selectedValues,
        [column]: values,
      },
    }));
  };

  const applyFilters = () => {
    setFilters({
      ...state.filters,
      dateRange: tempFilters.dateRange,
      selectedValues: tempFilters.selectedValues,
    });
    setShowFilterMenu(false);
  };

  const clearTempFilters = () => {
    setTempFilters({
      dateRange: { start: "", end: "" },
      selectedValues: {},
    });
  };

  const handleExport = async (format: "pdf" | "png" | "csv" | "json") => {
    try {
      await ExportUtils.exportDashboard(
        {
          format,
          includeCharts: format === "pdf" || format === "png",
          includeData: format === "csv" || format === "json",
        },
        state.filteredData,
        state.settings.currency
      );
      setShowExportMenu(false);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const hasGlobalFilters =
    (state.filters.dateRange.start && state.filters.dateRange.end) ||
    Object.values(state.filters.selectedValues).some(
      (values) => values.length > 0
    );

  return (
    <header
      className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 lg:px-6 transition-all duration-300`}
    >
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMobileMenuToggle}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors lg:hidden focus:outline-none"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Logo and Title */}
          <div className="hidden lg:flex items-center space-x-3">
            <img
              src={state.settings.theme === "dark" ? logoDark : logoLight}
              alt="Company Logo"
              className="h-10 w-auto"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-2 lg:space-x-2">
          {/* Database Sync Indicator */}
          <DatabaseSyncIndicator />

          {/* Saved Filters */}
          {state.data.length > 0 && <SavedFilters />}

          {/* Global Filters */}
          {state.data.length > 0 && (
            <GlobalFilterIndicator 
              onOpenFilters={() => setShowGlobalFilters(true)}
            />
          )}
          {/* Export Menu */}
          {state.data.length > 0 && (
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none"
                aria-label="Export options"
              >
                <Download className="h-5 w-5" />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <div className="py-2">
                    <button
                      onClick={() => handleExport("pdf")}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Export as PDF
                    </button>
                    <button
                      onClick={() => handleExport("png")}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Export as PNG
                    </button>
                    <button
                      onClick={() => handleExport("csv")}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Export Data (CSV)
                    </button>
                    <button
                      onClick={() => handleExport("json")}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Export Data (JSON)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none"
            aria-label={`Switch to ${
              state.settings.theme === "light" ? "dark" : "light"
            } theme`}
          >
            {state.settings.theme === "light" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </button>

          {/* User Menu */}
          {user && (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none"
                title="User menu"
              >
                <User className="h-5 w-5" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Signed in as
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {user.email}
                    </p>
                  </div>
                  <div className="py-2">
                    <button
                      onClick={() => {
                        signOut();
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Global Filter Panel */}
      <GlobalFilterPanel 
        isOpen={showGlobalFilters}
        onToggle={() => setShowGlobalFilters(false)}
      />

      {/* Active Filters Display */}
      {state.data.length > 0 && hasGlobalFilters && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1">
                Active Filters:
              </span>

              {state.filters.dateRange.start && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300">
                  {state.filters.dateRange.start} -{" "}
                  {state.filters.dateRange.end || "ongoing"}
                </span>
              )}

              {Object.entries(state.filters.selectedValues).map(
                ([column, values]) =>
                  values.map((value) => (
                    <span
                      key={`${column}-${value}`}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary-100 dark:bg-secondary-900/50 text-secondary-700 dark:text-secondary-300"
                    >
                      {column}:{" "}
                      {String(value).length > 15
                        ? `${String(value).substring(0, 15)}...`
                        : value}
                    </span>
                  ))
              )}
            </div>

            <button
              onClick={clearGlobalFilters}
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors flex items-center space-x-1"
              title="Clear global filters"
            >
              <X className="h-4 w-4" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      )}

      {/* Active Dataset Indicator */}
      {state.activeDatasetIds.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Active Dataset{state.activeDatasetIds.length > 1 ? "s" : ""}:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {state.datasets
                .filter((d) => state.activeDatasetIds.includes(d.id))
                .map((dataset) => (
                  <div key={dataset.id} className="flex items-center space-x-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: DataProcessor.getDatasetColorByName(
                          dataset.name
                        ),
                      }}
                    />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {dataset.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ({dataset.rowCount.toLocaleString()} rows)
                    </span>
                  </div>
                ))}
            </div>
          </div>
          
          {/* Global Filter Status */}
          {(state.globalFilters.dateRange.fromDate || 
            state.globalFilters.dateRange.toDate || 
            state.globalFilters.selectedMonths.length > 0 || 
            state.globalFilters.selectedBuyerTypes.length > 0) && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Global Filters:
                  </span>
                  
                  {state.globalFilters.dateRange.fromDate && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(state.globalFilters.dateRange.fromDate).toLocaleDateString()} - {state.globalFilters.dateRange.toDate ? new Date(state.globalFilters.dateRange.toDate).toLocaleDateString() : 'ongoing'}
                    </span>
                  )}
                  
                  {state.globalFilters.selectedMonths.length > 0 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary-100 dark:bg-secondary-900/50 text-secondary-700 dark:text-secondary-300">
                      {state.globalFilters.selectedMonths.length === 1 
                        ? state.globalFilters.selectedMonths[0]
                        : `${state.globalFilters.selectedMonths.length} months`
                      }
                    </span>
                  )}
                  
                  {state.globalFilters.selectedBuyerTypes.length > 0 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-accent-100 dark:bg-accent-900/50 text-accent-700 dark:text-accent-300">
                      <Users className="h-3 w-3 mr-1" />
                      {state.globalFilters.selectedBuyerTypes.join(', ')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
