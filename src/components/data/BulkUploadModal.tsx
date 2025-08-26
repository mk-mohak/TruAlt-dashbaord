import React, { useState, useRef } from 'react';
import { Upload, X, FileText, CheckCircle, AlertCircle, Database } from 'lucide-react';
import { TableName } from '../../lib/supabase';
import { FileParser } from '../../utils/fileParser';
import { DatabaseService } from '../../services/databaseService';
import { FlexibleDataRow } from '../../types';

interface BulkUploadModalProps {
  tableName: TableName;
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkUploadModal({ tableName, onClose, onSuccess }: BulkUploadModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    recordsProcessed?: number;
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
    setUploadResult(null);

    try {
      // Parse file
      const { data } = await FileParser.parseFile(file);
      const validation = FileParser.validateData(data);

      if (!validation.isValid || validation.validData.length === 0) {
        setUploadResult({
          success: false,
          message: 'File validation failed. Please check your data format.',
        });
        return;
      }

      // Upload to database
      let result;
      switch (tableName) {
        case 'FOM':
          result = await DatabaseService.uploadFOMData(validation.validData);
          break;
        case 'LFOM':
          result = await DatabaseService.uploadLFOMData(validation.validData);
          break;
        case 'MDA claim':
          result = await DatabaseService.uploadMDAClaimData(validation.validData);
          break;
        case 'POS LFOM':
          result = await DatabaseService.uploadPOSLFOMData(validation.validData);
          break;
        case 'POS FOM':
          result = await DatabaseService.uploadPOSFOMData(validation.validData);
          break;
        case 'Stock':
          result = await DatabaseService.uploadStockData(validation.validData);
          break;
        default:
          throw new Error(`Unsupported table: ${tableName}`);
      }

      if (result.error) {
        setUploadResult({
          success: false,
          message: result.error.message,
        });
      } else {
        setUploadResult({
          success: true,
          message: `Successfully uploaded ${validation.validData.length} records to ${tableName}`,
          recordsProcessed: validation.validData.length,
        });

        // Auto-close and refresh after successful upload
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (error) {
      setUploadResult({
        success: false,
        message: error instanceof Error ? error.message : 'Upload failed',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Upload className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Bulk Upload to {tableName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={isProcessing}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Upload Zone */}
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
                  {isProcessing ? 'Processing file...' : 'Upload CSV or Excel file'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {isProcessing 
                    ? 'Please wait while we process and upload your data'
                    : 'Drag & drop your file here, or click to browse'
                  }
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Supports .xlsx, .csv files • Max 10MB
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
              accept=".xlsx,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Upload Result */}
          {uploadResult && (
            <div className={`
              p-4 rounded-lg flex items-center space-x-3
              ${uploadResult.success 
                ? 'bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-700' 
                : 'bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-700'
              }
            `}>
              {uploadResult.success ? (
                <CheckCircle className="h-5 w-5 text-success-600 dark:text-success-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-error-600 dark:text-error-400" />
              )}
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  uploadResult.success 
                    ? 'text-success-700 dark:text-success-300' 
                    : 'text-error-700 dark:text-error-300'
                }`}>
                  {uploadResult.message}
                </p>
                {uploadResult.recordsProcessed && (
                  <p className="text-xs text-success-600 dark:text-success-400 mt-1">
                    {uploadResult.recordsProcessed} records processed successfully
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Upload Instructions
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Ensure your file has the correct column headers for {tableName}</li>
              <li>• Data will be validated before upload</li>
              <li>• Invalid rows will be skipped with error reporting</li>
              <li>• Large files may take a few moments to process</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}