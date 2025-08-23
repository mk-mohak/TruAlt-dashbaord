import React, { useState } from 'react';
import { Upload, Database, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { TABLES, TableName } from '../lib/supabase';
import { FlexibleDataRow } from '../types';

interface DatabaseUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: FlexibleDataRow[];
  fileName: string;
  onUpload: (tableName: TableName, data: FlexibleDataRow[]) => Promise<boolean>;
}

export function DatabaseUploadModal({ 
  isOpen, 
  onClose, 
  data, 
  fileName, 
  onUpload 
}: DatabaseUploadModalProps) {
  const [selectedTable, setSelectedTable] = useState<TableName | ''>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const detectTableFromFileName = (fileName: string): TableName | '' => {
    const lowerName = fileName.toLowerCase();
    
    if (lowerName.includes('pos') && lowerName.includes('fom') && !lowerName.includes('lfom')) {
      return TABLES.POS_FOM;
    }
    if (lowerName.includes('pos') && lowerName.includes('lfom')) {
      return TABLES.POS_LFOM;
    }
    if (lowerName.includes('lfom') && !lowerName.includes('pos')) {
      return TABLES.LFOM;
    }
    if (lowerName.includes('fom') && !lowerName.includes('pos') && !lowerName.includes('lfom')) {
      return TABLES.FOM;
    }
    if (lowerName.includes('mda') || lowerName.includes('claim')) {
      return TABLES.MDA_CLAIM;
    }
    if (lowerName.includes('stock')) {
      return TABLES.STOCK;
    }
    
    return '';
  };

  // Auto-detect table on mount
  React.useEffect(() => {
    if (fileName && !selectedTable) {
      const detected = detectTableFromFileName(fileName);
      if (detected) {
        setSelectedTable(detected);
      }
    }
  }, [fileName, selectedTable]);

  const handleUpload = async () => {
    if (!selectedTable) return;
    
    setIsUploading(true);
    setUploadResult(null);

    try {
      const success = await onUpload(selectedTable, data);
      
      if (success) {
        setUploadResult({
          success: true,
          message: `Successfully uploaded ${data.length} records to ${selectedTable}`
        });
        
        // Auto-close after successful upload
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setUploadResult({
          success: false,
          message: 'Upload failed. Please check the console for details.'
        });
      }
    } catch (error) {
      setUploadResult({
        success: false,
        message: error instanceof Error ? error.message : 'Upload failed'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getTableDescription = (tableName: TableName) => {
    switch (tableName) {
      case TABLES.FOM:
        return 'Factory Outlet Management - Sales data with buyer information';
      case TABLES.LFOM:
        return 'Local Factory Outlet Management - Regional sales data';
      case TABLES.MDA_CLAIM:
        return 'MDA Claim data - Subsidy claims and recovery information';
      case TABLES.POS_LFOM:
        return 'Point of Sale LFOM - Transaction-level sales data';
      case TABLES.POS_FOM:
        return 'Point of Sale FOM - Transaction-level sales data';
      case TABLES.STOCK:
        return 'Stock Management - Production, sales, and inventory data';
      default:
        return 'Database table for storing structured data';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Database className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Upload to Database
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={isUploading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* File Info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              File Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">File:</span>
                <span className="ml-2 font-medium">{fileName}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Rows:</span>
                <span className="ml-2 font-medium">{data.length.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Table Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Select Target Table
            </label>
            <div className="space-y-3">
              {Object.values(TABLES).map((tableName) => (
                <label
                  key={tableName}
                  className={`
                    flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all
                    ${selectedTable === tableName
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-600'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="table"
                    value={tableName}
                    checked={selectedTable === tableName}
                    onChange={(e) => setSelectedTable(e.target.value as TableName)}
                    className="mt-1 text-primary-600 focus:ring-primary-500"
                    disabled={isUploading}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {tableName}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {getTableDescription(tableName)}
                    </div>
                  </div>
                </label>
              ))}
            </div>
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
              <p className={`text-sm font-medium ${
                uploadResult.success 
                  ? 'text-success-700 dark:text-success-300' 
                  : 'text-error-700 dark:text-error-300'
              }`}>
                {uploadResult.message}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="btn-secondary"
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!selectedTable || isUploading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isUploading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>Upload to Database</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}