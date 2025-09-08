import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  BarChart,
  LineChart,
  PieChart,
  MoreHorizontal,
  BarChart3,
} from "lucide-react";

interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
  onChartTypeChange?: (type: string) => void;
  availableTypes?: string[];
  currentType?: string;
  className?: string;
}

export function ChartContainer({
  title,
  children,
  onChartTypeChange,
  availableTypes = [],
  currentType,
  className = "",
}: ChartContainerProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const handleSidebarToggle = useCallback(() => {
    setIsResizing(true);

    // Wait for sidebar transition to complete before showing chart
    setTimeout(() => {
      // Trigger chart resize
      window.dispatchEvent(new CustomEvent("chart-container-resize"));

      // Small delay to let chart resize, then show it
      setTimeout(() => {
        setIsResizing(false);
      }, 100);
    }, 300); // Match your sidebar transition duration
  }, []);

  // Listen for sidebar toggle events
  useEffect(() => {
    window.addEventListener("sidebar-toggle", handleSidebarToggle);
    return () => {
      window.removeEventListener("sidebar-toggle", handleSidebarToggle);
    };
  }, [handleSidebarToggle]);

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    };

    if (showOptions) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showOptions]);

  const chartTypeIcons: { [key: string]: React.ComponentType<any> } = {
    bar: BarChart,
    horizontalBar: BarChart3,
    line: LineChart,
    area: LineChart,
    donut: PieChart,
    pie: PieChart,
  };

  return (
    <div className={`card ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>

        {availableTypes.length > 0 && onChartTypeChange && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Chart options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {showOptions && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="py-2">
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Chart Type
                  </div>
                  {availableTypes.map((type) => {
                    const Icon = chartTypeIcons[type] || BarChart;
                    return (
                      <button
                        key={type}
                        onClick={() => {
                          onChartTypeChange(type);
                          setShowOptions(false);
                        }}
                        className={`
                          w-full flex items-center space-x-2 px-3 py-2 text-left text-sm transition-colors
                          ${
                            currentType === type
                              ? "bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          }
                        `}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="capitalize">
                          {type === "horizontalBar" ? "Horizontal Bar" : type}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div
        ref={chartContainerRef}
        className={`
          h-auto min-h-[420px] w-full transition-all duration-300 ease-in-out`}
        style={{
          overflow: "hidden", // Prevent chart overflow during transition
        }}
      >
        {children}
      </div>
    </div>
  );
}
