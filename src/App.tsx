import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MultiFileUpload } from './components/MultiFileUpload';
import { OverviewTab } from './components/tabs/OverviewTab';
import { ComparisonTab } from './components/tabs/ComparisonTab';
import { DeepDiveTab } from './components/tabs/DeepDiveTab';
import { ExplorerTab } from './components/tabs/ExplorerTab';
import { DatasetsTab } from './components/tabs/DatasetsTab';
import { SettingsTab } from './components/tabs/SettingsTab';
import { WelcomeScreen } from './components/WelcomeScreen';

function DashboardContent() {
  // Hooks must come first, before any return
  const { state, setActiveTab } = useApp();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);

  // Listen for file upload events from the datasets tab
  useEffect(() => {
    const handleOpenFileUpload = () => setShowFileUpload(true);
    window.addEventListener('openFileUpload', handleOpenFileUpload);
    return () => window.removeEventListener('openFileUpload', handleOpenFileUpload);
  }, []);

  // Listen for database changes (from realtime subscriptions)
  useEffect(() => {
    const handleDatabaseChange = (event: CustomEvent) => {
      console.log('Database change detected in App:', event.detail);
      // UI feedback if needed
    };
    window.addEventListener('supabase-data-changed', handleDatabaseChange as EventListener);
    return () => {
      window.removeEventListener('supabase-data-changed', handleDatabaseChange as EventListener);
    };
  }, []);

  // Now you can safely return early based on loading state
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
    if (state.datasets.length === 0 && !showFileUpload) {
      return <WelcomeScreen onFileUpload={() => setShowFileUpload(true)} />;
    }

    const filteredData = state.filteredData;
    switch (state.activeTab) {
      case 'overview':
        return <OverviewTab data={filteredData} />;
      case 'comparison':
        return <ComparisonTab data={filteredData} />;
      case 'deepdive':
        return <DeepDiveTab data={filteredData} />;
      case 'explorer':
        return <ExplorerTab data={filteredData} />;
      case 'datasets':
        return <DatasetsTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        setActiveTab('overview');
        return <OverviewTab data={filteredData} />;
    }
  };

  // Early return for welcome screen
  if (state.datasets.length === 0 && !showFileUpload) {
    return <WelcomeScreen onFileUpload={() => setShowFileUpload(true)} />;
  }

  // Early return for file upload modal
  if (showFileUpload) {
    const handleClose = () => setShowFileUpload(false);
    const handleContinue = () => {
      setShowFileUpload(false);
      setActiveTab('overview');
    };
    return <MultiFileUpload onClose={handleClose} onContinue={handleContinue} />;
  }

  // Main dashboard render
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobileOpen={mobileSidebarOpen}
        onMobileToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      />

      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <Header
          onMobileMenuToggle={() => setMobileSidebarOpen(true)}
          onUploadNewDataset={() => setShowFileUpload(true)}
        />
        <main className="p-4 lg:p-6 transition-all duration-300" id="dashboard-content">
          <div className="max-w-7xl mx-auto">{renderTabContent()}</div>
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
