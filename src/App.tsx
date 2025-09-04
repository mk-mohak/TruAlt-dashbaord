import React, { useState, useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { AppProvider, useApp } from "./contexts/AppContext";
import { useAuth } from "./hooks/useAuth";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { LoginScreen } from "./components/auth/LoginScreen";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { MultiFileUpload } from "./components/MultiFileUpload";
import { OverviewTab } from "./components/tabs/OverviewTab";
import { DataManagementTab } from "./components/data/DataManagementTab";
import { ExplorerTab } from "./components/tabs/ExplorerTab";
import { DatasetsTab } from "./components/tabs/DatasetsTab";
import { SettingsTab } from "./components/tabs/SettingsTab";

function DashboardContent() {
  const { state, setActiveTab } = useApp();
  const { user, isLoading: authLoading, role } = useAuth();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);

  // This effect sets the default tab based on the user's role after login.
  useEffect(() => {
    if (role && !state.activeTab) {
      // Only set if no tab is currently active
      if (role === "admin") {
        setActiveTab("overview");
      } else if (role === "operator") {
        setActiveTab("data-management");
      }
    }
  }, [role, state.activeTab, setActiveTab]);

  useEffect(() => {
    const handleOpenFileUpload = () => setShowFileUpload(true);
    window.addEventListener("openFileUpload", handleOpenFileUpload);
    return () =>
      window.removeEventListener("openFileUpload", handleOpenFileUpload);
  }, []);

  useEffect(() => {
    const handleDatabaseChange = (event: CustomEvent) => {
      console.log("Database change detected in App:", event.detail);
    };
    window.addEventListener(
      "supabase-data-changed",
      handleDatabaseChange as EventListener
    );
    return () => {
      window.removeEventListener(
        "supabase-data-changed",
        handleDatabaseChange as EventListener
      );
    };
  }, []);

  if (authLoading || (user && !role)) {
    return (
      <LoadingSpinner message="Initializing..." className="min-h-screen" />
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (state.isLoading && state.datasets.length === 0) {
    return (
      <LoadingSpinner
        message="Connecting to database..."
        type="database"
        className="min-h-screen"
      />
    );
  }

  const renderTabContent = () => {

    const filteredData = state.filteredData;
    let tabToRender = state.activeTab;

    if (role === "operator" && tabToRender === "overview") {
      setActiveTab("data-management");
      return <DataManagementTab />;
    }

    switch (tabToRender) {
      case "overview":
        return role === "admin" ? <OverviewTab data={filteredData} /> : null;
      case "data-management":
        return <DataManagementTab />;
      case "explorer":
        return <ExplorerTab data={filteredData} />;
      case "datasets":
        return <DatasetsTab />;
      case "settings":
        return <SettingsTab />;
      default:
        const defaultTab = role === "admin" ? "overview" : "data-management";
        setActiveTab(defaultTab);
        return null;
    }
  };

  if (showFileUpload) {
    const handleClose = () => setShowFileUpload(false);
    const handleContinue = () => {
      setShowFileUpload(false);
      setActiveTab(role === "admin" ? "overview" : "data-management");
    };
    return (
      <MultiFileUpload onClose={handleClose} onContinue={handleContinue} />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobileOpen={mobileSidebarOpen}
        onMobileToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      />

      <div
        className={`transition-all duration-300 ${
          sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
        }`}
      >
        <Header
          onMobileMenuToggle={() => setMobileSidebarOpen(true)}
          onUploadNewDataset={() => setShowFileUpload(true)}
        />
        <main
          className="p-4 lg:p-6 transition-all duration-300"
          id="dashboard-content"
        >
          <div>{renderTabContent()}</div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AppProvider>
          <DashboardContent />
        </AppProvider>
      </Router>
    </ErrorBoundary>
  );
}
