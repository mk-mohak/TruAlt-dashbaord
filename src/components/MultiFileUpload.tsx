import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText, X, CheckCircle, AlertTriangle, AlertCircle, Plus, Eye } from 'lucide-react';
import { FileParser } from '../utils/fileParser';
import { DataRow, Dataset } from '../types';
import { useApp } from '../contexts/AppContext';
import { ColorManager } from '../utils/colorManager';
import { DataProcessor } from '../utils/dataProcessing';
import { DatabaseUploadModal } from './DatabaseUploadModal';
import { TableName } from '../lib/supabase';

interface MultiFileUploadProps {
  onClose: () => void;
  onContinue?: () => void;
  className?: string;
}

interface UploadingFile {
  id: string;
  file: File;
  status: 'uploading' | 'validating' | 'complete' | 'error';
  progress: number;
  data?: DataRow[];
  error?: string;
  validationSummary?: string;
}


export function MultiFileUpload({ onClose, onContinue, className = '' }: MultiFileUploadProps) {
  const { dispatch, uploadToDatabase } = useApp();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [validatedDatasets, setValidatedDatasets] = useState<Dataset[]>([]); // Local buffer
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const [showDatabaseUpload, setShowDatabaseUpload] = useState<{
    data: FlexibleDataRow[];
    fileName: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFiles(Array.from(files));
    }
  }, []);

  const handleFiles = async (files: File[]) => {
    const validFiles = files.filter(file => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      return ['csv', 'xlsx', 'xls', 'json'].includes(extension || '');
    });

    const newUploadingFiles: UploadingFile[] = validFiles.map(file => ({
      id: generateId(),
      file,
      status: 'uploading',
      progress: 0,
    }));

    setUploadingFiles(prev => [...prev, ...newUploadingFiles]);

    // Process files sequentially to avoid overwhelming the browser
    for (const uploadingFile of newUploadingFiles) {
      await processFile(uploadingFile);
    }
  };

  const processFile = async (uploadingFile: UploadingFile) => {
    try {
      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 20) {
        setUploadingFiles(prev => 
          prev.map(f => f.id === uploadingFile.id ? { ...f, progress } : f)
        );
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Change to validating status
      setUploadingFiles(prev => 
        prev.map(f => f.id === uploadingFile.id ? { ...f, status: 'validating' } : f)
      );

      // Parse and validate file
      const { data } = await FileParser.parseFile(uploadingFile.file);
      const validation = FileParser.validateData(data);

      const dataset: Dataset = {
        id: uploadingFile.id,
        name: uploadingFile.file.name.replace(/\.[^/.]+$/, ''),
        data: validation.validData || [],
        fileName: uploadingFile.file.name,
        fileSize: uploadingFile.file.size,
        uploadDate: new Date().toISOString(),
        status: validation.isValid ? 'valid' : validation.errors.some(e => e.severity === 'error') ? 'error' : 'warning',
        rowCount: validation.validRows,
        validationSummary: validation.summary.message,
        color: ColorManager.getDatasetColor(uploadingFile.file.name.replace(/\.[^/.]+$/, '')),
        preview: (validation.validData || []).slice(0, 5),
        dataType: validation.dataType,
        detectedColumns: validation.detectedColumns,
      };

      // Buffer in local state, not global
      setValidatedDatasets(prev => [...prev, dataset]);

      // Mark as complete
      setUploadingFiles(prev => 
        prev.map(f => f.id === uploadingFile.id ? { 
          ...f, 
          status: 'complete',
          data: validation.validData,
          validationSummary: validation.summary.message
        } : f)
      );

    } catch (error) {
      setUploadingFiles(prev => 
        prev.map(f => f.id === uploadingFile.id ? { 
          ...f, 
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        } : f)
      );
    }
  };

  const removeFile = (id: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== id));
    setValidatedDatasets(prev => prev.filter(ds => ds.id !== id));
  };

  const getStatusIcon = (status: UploadingFile['status']) => {
    switch (status) {
      case 'uploading':
      case 'validating':
        return <div className="animate-spin h-4 w-4 border-2 border-primary-500 border-t-transparent rounded-full" />;
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-success-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-error-500" />;
    }
  };

  const getStatusText = (file: UploadingFile) => {
    switch (file.status) {
      case 'uploading':
        return `Uploading... ${file.progress}%`;
      case 'validating':
        return 'Validating data...';
      case 'complete':
        return file.validationSummary || 'Upload complete';
      case 'error':
        return file.error || 'Upload failed';
    }
  };

  const allComplete = uploadingFiles.length > 0 && uploadingFiles.every(f => f.status === 'complete' || f.status === 'error');

  // Continue handler: add all validated datasets to global state
  const handleContinue = () => {
    validatedDatasets.forEach(ds => dispatch({ type: 'ADD_DATASET', payload: ds }));
    if (onContinue) onContinue();
  };

  const handleUploadToDatabase = async (tableName: TableName, data: FlexibleDataRow[]): Promise<boolean> => {
    const success = await uploadToDatabase(tableName, data);
    if (success) {
      setShowDatabaseUpload(null);
    }
    return success;
  };
  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Multi-Dataset Upload
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Main content area, scrollable if needed */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6">
          {/* Upload Zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 mb-6 ${
              isDragging
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center space-y-4">
              <Upload className={`h-12 w-12 ${isDragging ? 'text-primary-600' : 'text-gray-400'} transition-colors`} />
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Upload Multiple Datasets
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Drag & drop multiple files here, or click to browse
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Supports .xlsx, .csv, and .json files • Max 10 files at once
                </p>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Select Files</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.csv,.json"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>


        {/* Database Upload Modal */}
        {showDatabaseUpload && (
          <DatabaseUploadModal
            isOpen={true}
            onClose={() => setShowDatabaseUpload(null)}
            data={showDatabaseUpload.data}
            fileName={showDatabaseUpload.fileName}
            onUpload={handleUploadToDatabase}
          />
        )}
          {/* Upload Progress */}
          {uploadingFiles.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Upload Progress ({uploadingFiles.filter(f => f.status === 'complete').length}/{uploadingFiles.length})
              </h3>
              
              <div className="space-y-3">
                {uploadingFiles.map((file) => (
                  <div key={file.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(file.status)}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {file.file.name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {DataProcessor.formatFileSize(file.file.size)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {file.status === 'complete' && file.data && (
                          <button
                            onClick={() => setShowPreview(file.id)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                            title="Preview data"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                        {file.status === 'complete' && file.data && (
                          <button
                            onClick={() => setShowDatabaseUpload({
                              data: file.data,
                              fileName: file.file.name
                            })}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                            title="Upload to database"
                          >
                            <Upload className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => removeFile(file.id)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                          title="Remove file"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mb-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {getStatusText(file)}
                      </p>
                    </div>
                    
                    {file.status === 'uploading' && (
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data Preview Modal */}
          {showPreview && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[70vh] flex flex-col overflow-hidden z-[101]">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Data Preview</h3>
                  <button
                    onClick={() => setShowPreview(null)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {/* Make this div scrollable vertically, and table scrollable horizontally */}
                <div className="flex-1 overflow-y-auto p-4">
                  {(() => {
                    const file = uploadingFiles.find(f => f.id === showPreview);
                    if (!file?.data) return null;
                    const columns = Object.keys(file.data[0] || {});
                    return (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              {columns.map(col => (
                                <th key={col} className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {file.data.slice(0, 50).map((row, idx) => (
                              <tr key={idx}>
                                {columns.map(col => (
                                  <td key={col} className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                    {String(row[col as keyof typeof row])}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3 bg-white dark:bg-gray-800 sticky bottom-0 z-10">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
          {allComplete && (
            <button
              onClick={handleContinue}
              className="btn-primary"
            >
              Continue to Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
}