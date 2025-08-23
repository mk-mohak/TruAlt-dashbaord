import React, { useState } from 'react';
import { 
  Database, 
  Eye, 
  Trash2, 
  Download, 
  Merge, 
  ChevronDown, 
  ChevronRight,
  ChevronLeft,
  Calendar,
  FileText,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  BarChart3,
  X
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Dataset } from '../types';
import { DataProcessor } from '../utils/dataProcessing';

interface DatasetLibraryProps {
  isOpen: boolean;
  onToggle: () => void;
  sidebarCollapsed: boolean;
}

export function DatasetLibrary({ isOpen, onToggle, sidebarCollapsed }: DatasetLibraryProps) {
  const { state, setActiveDataset, removeDataset, mergeDatasets } = useApp();
  const [selectedDatasets, setSelectedDatasets] = useState<string[]>([]);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [previewDataset, setPreviewDataset] = useState<Dataset | null>(null);

  const getStatusIcon = (status: Dataset['status']) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-success-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-error-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDatasetSelect = (datasetId: string) => {
    if (selectedDatasets.includes(datasetId)) {
      setSelectedDatasets(prev => prev.filter(id => id !== datasetId));
    } else {
      setSelectedDatasets(prev => [...prev, datasetId]);
    }
  };

  const handleMergeDatasets = () => {
    if (selectedDatasets.length >= 2) {
      setShowMergeDialog(true);
    }
  };

  // Confirm merge: merge and update dashboard
  const handleConfirmMerge = () => {
    if (selectedDatasets.length >= 2) {
      // Use 'Date' as default join key (can be improved later)
      mergeDatasets(selectedDatasets[0], selectedDatasets[1], 'Date');
      setShowMergeDialog(false);
      setSelectedDatasets([]);
    }
  };

  const handleCancelMerge = () => {
    setShowMergeDialog(false);
  };

  return (
    <>
      <div className={`
        fixed top-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-30 transition-all duration-300 shadow-lg
        ${isOpen ? 'w-80' : 'w-0'}
        ${isOpen ? (sidebarCollapsed ? 'left-16' : 'left-64') : 'left-0'}
        overflow-hidden
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                  Dataset Library
                </h2>
              </div>
              <button
                onClick={onToggle}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            </div>
            
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {state.datasets.length} dataset{state.datasets.length !== 1 ? 's' : ''} loaded
            </div>
          </div>

          {/* Dataset List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {state.datasets.length === 0 ? (
              <div className="text-center py-8">
                <Database className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No datasets loaded</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">Upload files to get started</p>
              </div>
            ) : (
              state.datasets.map((dataset) => (
                <div
                  key={dataset.id}
                  className={`
                    border rounded-lg p-3 cursor-pointer transition-all duration-200 hover:shadow-md
                    ${state.activeDatasetId === dataset.id 
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }
                    ${selectedDatasets.includes(dataset.id) ? 'ring-2 ring-secondary-500' : ''}
                  `}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedDatasets.includes(dataset.id)}
                        onChange={() => handleDatasetSelect(dataset.id)}
                        className="rounded border-gray-300 text-secondary-600 focus:ring-secondary-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: dataset.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {dataset.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {dataset.fileName}
                        </p>
                      </div>
                    </div>
                    {getStatusIcon(dataset.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400 mb-2">
                    <div className="flex items-center space-x-1">
                      <FileText className="h-3 w-3" />
                      <span>{dataset.rowCount.toLocaleString()} rows</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatFileSize(dataset.fileSize)}</span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    {new Date(dataset.uploadDate).toLocaleDateString()}
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDataset(dataset.id);
                      }}
                      className={`
                        text-xs px-2 py-1 rounded transition-colors
                        ${state.activeDatasetId === dataset.id
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }
                      `}
                    >
                      {state.activeDatasetId === dataset.id ? 'Active' : 'Activate'}
                    </button>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewDataset(dataset);
                        }}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                        title="Preview data"
                      >
                        <Eye className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeDataset(dataset.id);
                        }}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded transition-colors"
                        title="Delete dataset"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Actions */}
          {state.datasets.length > 0 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
              <button
                onClick={handleMergeDatasets}
                disabled={selectedDatasets.length < 2}
                className="w-full btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Merge className="h-4 w-4" />
                <span>Merge Selected ({selectedDatasets.length})</span>
              </button>
            </div>
          )}

          {/* Merge confirmation dialog */}
          {showMergeDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-full">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Merge Datasets</h3>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  Are you sure you want to merge the selected datasets? This will create a new merged dataset and update the dashboard.
                </p>
                <div className="flex justify-end space-x-3">
                  <button onClick={handleCancelMerge} className="btn-secondary">Cancel</button>
                  <button onClick={handleConfirmMerge} className="btn-primary">Merge</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dataset Preview Modal */}
      {previewDataset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {previewDataset.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {previewDataset.rowCount.toLocaleString()} rows • {formatFileSize(previewDataset.fileSize)}
                </p>
              </div>
              <button
                onClick={() => setPreviewDataset(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Responsive, scrollable table area */}
            <div className="flex-1 overflow-y-auto p-6">
              {Array.isArray(previewDataset.data) && previewDataset.data.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        {Object.keys(previewDataset.data[0]).map(col => (
                          <th key={col} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {previewDataset.data.slice(0, 20).map((row, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700' : ''}>
                          {Object.keys(previewDataset.data[0]).map(col => (
                            <td key={col} className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
                              {String(row[col as keyof typeof row])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Sticky footer for summary and actions */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:justify-between gap-4 bg-white dark:bg-gray-800 sticky bottom-0 z-10">
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <span>Showing first 20 rows of {previewDataset.rowCount.toLocaleString()}</span>
                {getStatusIcon(previewDataset.status)}
                <span>{typeof previewDataset.validationSummary === 'string' ? previewDataset.validationSummary : ''}</span>
              </div>
              <button
                onClick={() => {
                  setActiveDataset(previewDataset.id);
                  setPreviewDataset(null);
                }}
                className="btn-primary w-full md:w-auto"
              >
                Use This Dataset
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}