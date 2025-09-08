import React from "react";
import {
  BarChart3,
  Edit3,
  Database,
  Settings,
  Menu,
  X,
  Library,
  LogOut,
} from "lucide-react";
import { TabType } from "../types";
import { useApp } from "../contexts/AppContext";
import { useAuth } from "../hooks/useAuth";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobileOpen: boolean;
  onMobileToggle: () => void;
}

const allNavigationItems = [
  {
    id: "overview" as TabType,
    label: "Dashboard Overview",
    icon: BarChart3,
    emoji: "📊",
  },
  {
    id: "data-management" as TabType,
    label: "Data Management",
    icon: Edit3,
    emoji: "✏️",
  },
  {
    id: "explorer" as TabType,
    label: "Data Explorer",
    icon: Database,
    emoji: "📝",
  },
  {
    id: "datasets" as TabType,
    label: "Data Manager",
    icon: Library,
    emoji: "📚",
  },
  { id: "settings" as TabType, label: "Settings", icon: Settings, emoji: "⚙️" },
];

export function Sidebar({
  isCollapsed,
  onToggle,
  isMobileOpen,
  onMobileToggle,
}: SidebarProps) {
  const { state, setActiveTab } = useApp();
  // The signOut function is no longer needed here
  const { user, role, signOut } = useAuth();

  const handleTabClick = (tabId: TabType) => {
    setActiveTab(tabId);
    if (isMobileOpen) {
      onMobileToggle();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, tabId: TabType) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleTabClick(tabId);
    }
  };

  // Filter navigation items based on user role
  const navigationItems = allNavigationItems.filter((item) => {
    if (role === "operator" && item.id === "overview") {
      return false; // Hide overview for operators
    }
    return true;
  });

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onMobileToggle}
        />
      )}
      <div
        className={`
        fixed top-0 left-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-40 transition-all duration-300 shadow-lg
        ${isCollapsed ? "w-16" : "w-64"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <button
                onClick={onToggle}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors hidden lg:block focus:outline-none"
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <Menu className="h-5 w-5" />
              </button>

              {!isCollapsed && (
                <h1 className="text-xl font-bold text-[#1A2885] dark:text-gray-100 whitespace-nowrap">
                  TruAlt Analytics
                </h1>
              )}
            </div>
            <button
              onClick={onMobileToggle}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors lg:hidden focus:outline-none"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav
            className="flex-1 p-4"
            role="navigation"
            aria-label="Main navigation"
          >
            <ul className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = state.activeTab === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => handleTabClick(item.id)}
                      onKeyDown={(e) => handleKeyDown(e, item.id)}
                      className={`
                        w-full flex items-center px-3 py-2.5 rounded-lg text-left transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-primary-500 relative
                        ${
                          isActive
                            ? "bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                        }
                      `}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <div
                        className={`flex items-center justify-center ${
                          isCollapsed ? "w-full" : "w-5 mr-3"
                        }`}
                      >
                        <Icon
                          className={`h-5 w-5 flex-shrink-0 ${
                            isActive
                              ? "text-primary-600 dark:text-primary-400"
                              : ""
                          }`}
                        />
                      </div>
                      {!isCollapsed && (
                        <span className="font-medium group-hover:translate-x-1 transition-transform flex-1 whitespace-nowrap">
                          {item.label}
                        </span>
                      )}
                      {isCollapsed && (
                        <span className="sr-only">{item.label}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
          {!isCollapsed && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              {user && (
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                    {user.email}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 capitalize">
                    Role: {role}
                  </p>
                  <button
                    onClick={signOut}
                    className="mt-3 flex items-center space-x-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 focus:outline-none rounded"
                    aria-label="Sign Out"
                    type="button"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p>TruAlt Analytics v1.0</p>
                <p>© 2025 Analytics Dashboard</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
