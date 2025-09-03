import { useState, useEffect, useCallback } from "react";
import { DatabaseService } from "../services/databaseService";
import { TABLES, TableName } from "../lib/supabase";
import { Dataset, FlexibleDataRow } from "../types";
import { ColorManager } from "../utils/colorManager";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

// Helper to detect data type
const detectDataType = (tableName: string): 'sales' | 'production' | 'stock' | 'unknown' => {
  const lowerName = tableName.toLowerCase();
  if (lowerName.includes('stock')) return 'stock';
  if (lowerName.includes('production')) return 'production';
  if (lowerName.includes('fom') || lowerName.includes('lfom')) return 'sales';
  return 'unknown';
};

// Helper to convert DB records to a Dataset
const convertDatabaseRecordsToDataset = (
  tableName: TableName,
  records: any[]
): Dataset => {
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
};

export function useSupabaseData() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await DatabaseService.fetchAllData();
      if (result.errors && result.errors.length > 0) {
        setError(`Some data could not be loaded: ${result.errors.join(', ')}`);
      }

      const newDatasets: Dataset[] = [];
      if (result.fom && result.fom.length > 0) newDatasets.push(convertDatabaseRecordsToDataset(TABLES.FOM, result.fom));
      if (result.lfom && result.lfom.length > 0) newDatasets.push(convertDatabaseRecordsToDataset(TABLES.LFOM, result.lfom));
      if (result.mdaClaim && result.mdaClaim.length > 0) newDatasets.push(convertDatabaseRecordsToDataset(TABLES.MDA_CLAIM, result.mdaClaim));
      if (result.posLfom && result.posLfom.length > 0) newDatasets.push(convertDatabaseRecordsToDataset(TABLES.POS_LFOM, result.posLfom));
      if (result.posFom && result.posFom.length > 0) newDatasets.push(convertDatabaseRecordsToDataset(TABLES.POS_FOM, result.posFom));
      if (result.stock && result.stock.length > 0) newDatasets.push(convertDatabaseRecordsToDataset(TABLES.STOCK, result.stock));
      
      setDatasets(newDatasets);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch initial data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Effect for initial fetch and real-time subscriptions
  useEffect(() => {
    fetchAllData();

    const handleRealtimeUpdate = (tableName: TableName) => (
      payload: RealtimePostgresChangesPayload<FlexibleDataRow>
    ) => {
      console.log(`Real-time change in ${tableName}:`, payload);
      setDatasets(currentDatasets => {
        const datasetIndex = currentDatasets.findIndex(ds => ds.name === tableName);
        
        if (datasetIndex === -1 && payload.eventType === 'INSERT') {
            fetchAllData();
            return currentDatasets;
        }
        
        if(datasetIndex === -1) return currentDatasets;

        const updatedDataset = { ...currentDatasets[datasetIndex] };
        // All tables now use 'id' as the primary key
        const idColumn = "id";

        switch (payload.eventType) {
          case 'INSERT':
            updatedDataset.data = [payload.new, ...updatedDataset.data];
            break;
          case 'UPDATE':
            updatedDataset.data = updatedDataset.data.map(row =>
              row[idColumn] === payload.new[idColumn] ? payload.new : row
            );
            break;
          case 'DELETE':
            const recordId = (payload.old as FlexibleDataRow)[idColumn];
            updatedDataset.data = updatedDataset.data.filter(
              row => row[idColumn] !== recordId
            );
            break;
          default:
            break;
        }

        updatedDataset.rowCount = updatedDataset.data.length;
        updatedDataset.preview = updatedDataset.data.slice(0, 5);

        const newDatasets = [...currentDatasets];
        newDatasets[datasetIndex] = updatedDataset;
        
        if (updatedDataset.rowCount === 0) {
            return newDatasets.filter(ds => ds.name !== tableName);
        }

        return newDatasets;
      });
    };

    const subscriptions = Object.values(TABLES).map(tableName => {
      return DatabaseService.subscribeToTable(tableName, handleRealtimeUpdate(tableName));
    });

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [fetchAllData]);

  return {
    datasets,
    isLoading,
    error,
    refetch: fetchAllData,
  };
}