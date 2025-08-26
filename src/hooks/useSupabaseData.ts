import { useState, useEffect, useCallback } from 'react';
import { DatabaseService } from '../services/databaseService';
import { TABLES, TableName } from '../lib/supabase';
import { Dataset, FlexibleDataRow } from '../types';
import { ColorManager } from '../utils/colorManager';

interface UseSupabaseDataReturn {
  datasets: Dataset[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  uploadData: (tableName: TableName, data: FlexibleDataRow[]) => Promise<boolean>;
}

// Move detectDataType outside as a standalone function
const detectDataType = (tableName: string): 'sales' | 'production' | 'stock' | 'unknown' => {
  const lowerName = tableName.toLowerCase();
  if (lowerName.includes('stock')) return 'stock';
  if (lowerName.includes('production')) return 'production';
  if (lowerName.includes('fom') || lowerName.includes('lfom')) return 'sales';
  return 'unknown';
};

export function useSupabaseData(): UseSupabaseDataReturn {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const convertDatabaseRecordsToDataset = useCallback((
    tableName: TableName,
    records: any[]
  ): Dataset => {
    // Convert database records to FlexibleDataRow format
    const data: FlexibleDataRow[] = records.map(record => {
      const converted: FlexibleDataRow = {};
      Object.entries(record).forEach(([key, value]: [string, any]) => {
        converted[key] = value;
      });
      return converted;
    });

    return {
      id: `supabase-${tableName.toLowerCase().replace(/\s+/g, '-')}`,
      name: tableName,
      data,
      fileName: `${tableName}.csv`,
      fileSize: JSON.stringify(records).length,
      uploadDate: new Date().toISOString(),
      status: 'valid',
      rowCount: records.length,
      validationSummary: `${records.length} records loaded from database`,
      color: ColorManager.getDatasetColor(tableName),
      preview: data.slice(0, 5),
      dataType: detectDataType(tableName),
      detectedColumns: records.length > 0 ? Object.keys(records[0]) : [],
    };
  }, []);

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if DatabaseService exists
      if (!DatabaseService || typeof DatabaseService.fetchAllData !== 'function') {
        throw new Error('DatabaseService is not properly initialized');
      }

      const result = await DatabaseService.fetchAllData();
      
      if (!result) {
        throw new Error('No result returned from DatabaseService');
      }

      if (result.errors && result.errors.length > 0) {
        console.warn('Errors from DatabaseService:', result.errors);
        setError(`Some data could not be loaded: ${result.errors.join(', ')}`);
      }

      const newDatasets: Dataset[] = [];

      // Convert each table's data to datasets with better error handling
      try {
        if (result.fom && result.fom.length > 0) {
          newDatasets.push(convertDatabaseRecordsToDataset(TABLES.FOM, result.fom));
        }
        
        if (result.lfom && result.lfom.length > 0) {
          newDatasets.push(convertDatabaseRecordsToDataset(TABLES.LFOM, result.lfom));
        }
        
        if (result.mdaClaim && result.mdaClaim.length > 0) {
          newDatasets.push(convertDatabaseRecordsToDataset(TABLES.MDA_CLAIM, result.mdaClaim));
        }
        
        if (result.posLfom && result.posLfom.length > 0) {
          newDatasets.push(convertDatabaseRecordsToDataset(TABLES.POS_LFOM, result.posLfom));
        }
        
        if (result.posFom && result.posFom.length > 0) {
          newDatasets.push(convertDatabaseRecordsToDataset(TABLES.POS_FOM, result.posFom));
        }
        
        if (result.stock && result.stock.length > 0) {
          newDatasets.push(convertDatabaseRecordsToDataset(TABLES.STOCK, result.stock));
        }
      } catch (conversionError) {
        console.error('Error converting data to datasets:', conversionError);
        setError('Error processing database records');
      }

      setDatasets(newDatasets);

      // If no datasets were created but no errors, it means tables are empty
      if (newDatasets.length === 0 && (!result.errors || result.errors.length === 0)) {
        setError('Database connected but no data found in any tables');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error fetching data from Supabase:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [convertDatabaseRecordsToDataset]);

  const uploadData = useCallback(async (tableName: TableName, data: FlexibleDataRow[]): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      let result;
      
      switch (tableName) {
        case TABLES.FOM:
          result = await DatabaseService.uploadFOMData(data);
          break;
        case TABLES.LFOM:
          result = await DatabaseService.uploadLFOMData(data);
          break;
        case TABLES.MDA_CLAIM:
          result = await DatabaseService.uploadMDAClaimData(data);
          break;
        case TABLES.POS_LFOM:
          result = await DatabaseService.uploadPOSLFOMData(data);
          break;
        case TABLES.POS_FOM:
          result = await DatabaseService.uploadPOSFOMData(data);
          break;
        case TABLES.STOCK:
          result = await DatabaseService.uploadStockData(data);
          break;
        default:
          throw new Error(`Unsupported table: ${tableName}`);
      }

      if (result.error) {
        console.error('Upload error:', result.error);
        setError(result.error.message);
        return false;
      }

      // Refresh data after successful upload
      await fetchAllData();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      console.error('Upload error:', err);
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchAllData]);

  // Initial data fetch
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  return {
    datasets,
    isLoading,
    error,
    refetch: fetchAllData,
    uploadData,
  };
}
