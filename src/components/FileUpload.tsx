import React, { useState, useRef } from 'react';
import { Upload, FileText, X, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { FileParser } from '../utils/fileParser';
import { DataRow, ValidationResult } from '../types';
import { DatabaseUploadModal } from './DatabaseUploadModal';
import { useApp } from '../contexts/AppContext';
import { TableName } from '../lib/supabase';

interface FileUploadProps {
  onDataLoaded: (data: DataRow[]) => void;
  className?: string;
}

export function FileUpload({ onDataLoaded, className = '' }: FileUploadProps) {
  const { uploadToDatabase } = useApp();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [showDatabaseUpload, setShowDatabaseUpload] = useState<{
    data: DataRow[];
    fileName: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setIsProcessing(true);
    setValidationResult(null);
    setShowValidation(false);

    try {
      const { data } = await FileParser.parseFile(file);
      const validation = FileParser.validateData(data);
      
      setValidationResult(validation);
      
      // Auto-load if data is valid and has no critical errors
      if (validation.isValid && validation.errors.filter(e => e.severity === 'error').length === 0) {
        onDataLoaded(validation.validData || []);
      } else {
        setShowValidation(true);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setValidationResult({
        isValid: false,
        totalRows: 0,
        validRows: 0,
        errors: [{ row: 0, column: 'general', message: errorMessage, severity: 'error' }],
        missingColumns: [],
        summary: {
          message: `❌ Failed to process file: ${errorMessage}`,
          type: 'error'
        },
        validData: []
      });
      setShowValidation(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmLoad = () => {
    if (validationResult && validationResult.isValid) {
      // Extract valid data from the stored parsed data
      if (validationResult.validData) {
        // Show database upload option
        setShowDatabaseUpload({
          data: validationResult.validData,
          fileName: 'uploaded-file'
        });
      }
    }
    setShowValidation(false);
    setValidationResult(null);
  };

  const handleDatabaseUpload = async (tableName: TableName, data: DataRow[]): Promise<boolean> => {
    const success = await uploadToDatabase(tableName, data);
    if (success) {
      setShowDatabaseUpload(null);
      onDataLoaded(data); // Also load locally for immediate display
    }
    return success;
  };
  const getSummaryIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-6 w-6 text-success-500" />;
      case 'warning': return <AlertTriangle className="h-6 w-6 text-warning-500" />;
      case 'error': return <AlertCircle className="h-6 w-6 text-error-500" />;
      default: return <FileText className="h-6 w-6 text-gray-500" />;
    }
  };

  if (showValidation && validationResult) {
    return (
      <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ${className}`}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Data Validation Results
            </h2>
            <button
              onClick={() => setShowValidation(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              {getSummaryIcon(validationResult.summary.type)}
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {validationResult.summary.message}
              </p>
            </div>

            {validationResult.errors.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Issues Found ({validationResult.errors.length})
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-60 overflow-y-auto">
                  {validationResult.errors.slice(0, 10).map((error, index) => (
                    <div
                      key={index}
                      className={`flex items-start space-x-2 py-2 ${
                        index < validationResult.errors.length - 1 ? 'border-b border-gray-200 dark:border-gray-600' : ''
                      }`}
                    >
                      {error.severity === 'error' ? (
                        <AlertCircle className="h-4 w-4 text-error-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-warning-500 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="text-sm">
                        <span className="font-medium">Row {error.row}, {error.column}:</span>
                        <span className="text-gray-600 dark:text-gray-400 ml-1">{error.message}</span>
                      </div>
                    </div>
                  ))}
                  {validationResult.errors.length > 10 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 pt-2">
                      And {validationResult.errors.length - 10} more issues...
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Total Rows:</span>
                  <span className="ml-2 font-medium">{validationResult.totalRows}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Valid Rows:</span>
                  <span className="ml-2 font-medium text-success-600">{validationResult.validRows}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Errors:</span>
                  <span className="ml-2 font-medium text-error-600">
                    {validationResult.errors.filter(e => e.severity === 'error').length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Warnings:</span>
                  <span className="ml-2 font-medium text-warning-600">
                    {validationResult.errors.filter(e => e.severity === 'warning').length}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowValidation(false)}
                className="btn-secondary"
              >
                Upload to Database ({validationResult.validRows} rows)
              </button>
              {validationResult.isValid && (
                <button
                  onClick={handleConfirmLoad}
                  className="btn-primary"
                >
                  Load Data ({validationResult.validRows} rows)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
          isDragging
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
        } ${isProcessing ? 'pointer-events-none opacity-50' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          {isProcessing ? (
            <div className="animate-spin h-12 w-12 border-4 border-primary-500 border-t-transparent rounded-full"></div>
          ) : (
            <Upload className={`h-12 w-12 ${isDragging ? 'text-primary-600' : 'text-gray-400'} transition-colors`} />
          )}
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {isProcessing ? 'Processing file...' : 'Upload your data'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {isProcessing 
                ? 'Please wait while we validate your data'
                : 'Drag & drop your file here, or click to browse'
              }
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Supports .xlsx, .csv, and .json files
            </p>
          </div>

          {!isProcessing && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-primary"
              disabled={isProcessing}
            >
              Browse Files
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.csv,.json"
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
          onUpload={handleDatabaseUpload}
        />
      )}
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 dark:bg-gray-800 dark:bg-opacity-75 rounded-xl">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Validating data...</p>
          </div>
        </div>
      )}
    </div>
  );
}