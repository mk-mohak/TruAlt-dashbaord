import { supabase, TABLES, TableName } from '../lib/supabase';
import { 
  FOMRecord, 
  LFOMRecord, 
  MDAClaimRecord, 
  POSLFOMRecord, 
  POSFOMRecord, 
  StockRecord,
  RevenueRecord,
  DatabaseRecord,
  DatabaseResponse 
} from '../types/database';
import { FlexibleDataRow } from '../types';

// Converts Excel's serial number date to a JavaScript Date object
function excelDateToJSDate(serial: number) {
  const utc_days  = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;                                        
  const date_info = new Date(utc_value * 1000);
  return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate() + 1);
}

// Parses a string date (e.g., "DD-MM-YYYY") into a JavaScript Date object
function parseStringDate(dateString: string): Date | null {
    // Handles formats like DD-MM-YYYY, DD/MM/YYYY
    const parts = dateString.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    if (!parts) return null;

    // parts[1] = Day, parts[2] = Month, parts[3] = Year
    const day = parseInt(parts[1], 10);
    const month = parseInt(parts[2], 10) - 1; // Month is 0-indexed in JS
    const year = parseInt(parts[3], 10);
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

    const date = new Date(year, month, day);
    if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
        return date;
    }
    return null;
}

export class DatabaseService {
  // Generic CRUD operations
  static async fetchAll<T extends DatabaseRecord>(tableName: TableName): Promise<DatabaseResponse<T>> {
    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .order('id', { ascending: false }); // Show newest first

      if (error) {
        console.error(`Error fetching ${tableName}:`, error);
        return {
          data: null,
          error: {
            message: `Failed to fetch ${tableName} data`,
            details: error.message,
            hint: error.hint
          }
        };
      }

      return {
        data: data as T[],
        error: null,
        count: count || 0
      };
    } catch (err) {
      console.error(`Unexpected error fetching ${tableName}:`, err);
      return {
        data: null,
        error: {
          message: `Unexpected error fetching ${tableName}`,
          details: err instanceof Error ? err.message : 'Unknown error'
        }
      };
    }
  }

  static async insertRecord<T extends DatabaseRecord>(
    tableName: TableName, 
    record: Partial<T>
  ): Promise<DatabaseResponse<T>> {
    try {
      // Clean the record before insertion
      const cleanedRecord = this.convertToTableRecord(record as FlexibleDataRow, tableName);
      
      const { data, error } = await supabase
        .from(tableName)
        .insert([cleanedRecord])
        .select();

      if (error) {
        console.error(`Error inserting into ${tableName}:`, error);
        return {
          data: null,
          error: {
            message: `Failed to insert record into ${tableName}`,
            details: error.message,
            hint: error.hint
          }
        };
      }

      return {
        data: data as T[],
        error: null
      };
    } catch (err) {
      console.error(`Unexpected error inserting into ${tableName}:`, err);
      return {
        data: null,
        error: {
          message: `Unexpected error inserting into ${tableName}`,
          details: err instanceof Error ? err.message : 'Unknown error'
        }
      };
    }
  }

  static async insertBatch<T extends DatabaseRecord>(
    tableName: TableName, 
    records: Partial<T>[]
  ): Promise<DatabaseResponse<T>> {
    try {
      // Supabase has a limit on batch inserts, so we'll chunk them
      const BATCH_SIZE = 1000;
      const chunks = [];
      
      for (let i = 0; i < records.length; i += BATCH_SIZE) {
        chunks.push(records.slice(i, i + BATCH_SIZE));
      }

      const allInsertedData: T[] = [];
      
      for (const chunk of chunks) {
        const { data, error } = await supabase
          .from(tableName)
          .insert(chunk)
          .select();

        if (error) {
          console.error(`Error batch inserting into ${tableName}:`, error);
          return {
            data: null,
            error: {
              message: `Failed to batch insert records into ${tableName}`,
              details: error.message,
              hint: error.hint
            }
          };
        }

        if (data) {
          allInsertedData.push(...(data as T[]));
        }
      }

      return {
        data: allInsertedData,
        error: null
      };
    } catch (err) {
      console.error(`Unexpected error batch inserting into ${tableName}:`, err);
      return {
        data: null,
        error: {
          message: `Unexpected error batch inserting into ${tableName}`,
          details: err instanceof Error ? err.message : 'Unknown error'
        }
      };
    }
  }

  static async updateRecord<T extends DatabaseRecord>(
    tableName: TableName,
    id: number | string,
    updates: Partial<T>,
    idColumn: string = 'id'
  ): Promise<DatabaseResponse<T>> {
    try {
      // Clean the updates before applying
      const cleanedUpdates = this.convertToTableRecord(updates as FlexibleDataRow, tableName);
      
      const { data, error } = await supabase
        .from(tableName)
        .update(cleanedUpdates)
        .eq(idColumn, id)
        .select();

      if (error) {
        console.error(`Error updating ${tableName}:`, error);
        return {
          data: null,
          error: {
            message: `Failed to update record in ${tableName}`,
            details: error.message,
            hint: error.hint
          }
        };
      }

      return {
        data: data as T[],
        error: null
      };
    } catch (err) {
      console.error(`Unexpected error updating ${tableName}:`, err);
      return {
        data: null,
        error: {
          message: `Unexpected error updating ${tableName}`,
          details: err instanceof Error ? err.message : 'Unknown error'
        }
      };
    }
  }

  static async deleteRecord(
    tableName: TableName,
    id: number | string,
    idColumn: string = 'id'
  ): Promise<DatabaseResponse<any>> {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .delete()
        .eq(idColumn, id)
        .select();

      if (error) {
        console.error(`Error deleting from ${tableName}:`, error);
        return {
          data: null,
          error: {
            message: `Failed to delete record from ${tableName}`,
            details: error.message,
            hint: error.hint
          }
        };
      }

      return {
        data: data,
        error: null
      };
    } catch (err) {
      console.error(`Unexpected error deleting from ${tableName}:`, err);
      return {
        data: null,
        error: {
          message: `Unexpected error deleting from ${tableName}`,
          details: err instanceof Error ? err.message : 'Unknown error'
        }
      };
    }
  }

  // Real-time subscription setup
  static subscribeToTable<T extends DatabaseRecord>(
    tableName: TableName,
    callback: (payload: any) => void
  ) {
    return supabase
      .channel(`${tableName}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName
        },
        callback
      )
      .subscribe();
  }

  // Utility function to convert FlexibleDataRow to appropriate database record
  static convertToTableRecord(
    data: FlexibleDataRow,
    tableName: TableName
  ): Partial<DatabaseRecord> {
    const cleanedData: any = {};
    
    Object.entries(data).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        return;
      }
      
      const lowerKey = key.toLowerCase();

      if (lowerKey.includes('date')) {
        let jsDate: Date | null = null;
        if (typeof value === 'number') {
          jsDate = excelDateToJSDate(value);
        } else if (typeof value === 'string') {
          jsDate = parseStringDate(value);
        }
        
        if (jsDate) {
          cleanedData[key] = jsDate.toISOString().split('T')[0];
          return; 
        }
      }

      if (this.isNumericColumn(key) && typeof value === 'string') {
        const numValue = parseFloat(value.replace(/[,\s]/g, ''));
        if (!isNaN(numValue)) {
          cleanedData[key] = numValue;
        }
      } else {
        cleanedData[key] = value;
      }
    });

    return cleanedData;
  }

  private static isNumericColumn(columnName: string): boolean {
    const numericKeywords = [
      'quantity', 'price', 'revenue', 'amount', 'total', 'sum', 'count',
      'production', 'sales', 'stock', 'left', 'units', 'value', 'cost',
      'year', 'week', 'code', 'pin', 'recovery'
    ];
    
    const lowerColumn = columnName.toLowerCase();
    if (lowerColumn.includes('date')) return false;

    return numericKeywords.some(keyword => lowerColumn.includes(keyword));
  }

  // Table-specific methods
  static async fetchFOMData(): Promise<DatabaseResponse<FOMRecord>> {
    return this.fetchAll<FOMRecord>(TABLES.FOM);
  }

  static async fetchLFOMData(): Promise<DatabaseResponse<LFOMRecord>> {
    return this.fetchAll<LFOMRecord>(TABLES.LFOM);
  }

  static async fetchMDAClaimData(): Promise<DatabaseResponse<MDAClaimRecord>> {
    return this.fetchAll<MDAClaimRecord>(TABLES.MDA_CLAIM);
  }

  static async fetchPOSLFOMData(): Promise<DatabaseResponse<POSLFOMRecord>> {
    return this.fetchAll<POSLFOMRecord>(TABLES.POS_LFOM);
  }

  static async fetchPOSFOMData(): Promise<DatabaseResponse<POSFOMRecord>> {
    return this.fetchAll<POSFOMRecord>(TABLES.POS_FOM);
  }

  static async fetchStockData(): Promise<DatabaseResponse<StockRecord>> {
    return this.fetchAll<StockRecord>(TABLES.STOCK);
  }

  static async fetchRevenueData(): Promise<DatabaseResponse<RevenueRecord>> {
    return this.fetchAll<RevenueRecord>(TABLES.REVENUE);
  }

  // Batch operations for data upload
  static async uploadFOMData(records: FlexibleDataRow[]): Promise<DatabaseResponse<FOMRecord>> {
    const convertedRecords = records.map(record => 
      this.convertToTableRecord(record, TABLES.FOM) as Partial<FOMRecord>
    );
    return this.insertBatch<FOMRecord>(TABLES.FOM, convertedRecords);
  }

  static async uploadLFOMData(records: FlexibleDataRow[]): Promise<DatabaseResponse<LFOMRecord>> {
    const convertedRecords = records.map(record => 
      this.convertToTableRecord(record, TABLES.LFOM) as Partial<LFOMRecord>
    );
    return this.insertBatch<LFOMRecord>(TABLES.LFOM, convertedRecords);
  }

  static async uploadMDAClaimData(records: FlexibleDataRow[]): Promise<DatabaseResponse<MDAClaimRecord>> {
    const convertedRecords = records.map(record => 
      this.convertToTableRecord(record, TABLES.MDA_CLAIM) as Partial<MDAClaimRecord>
    );
    return this.insertBatch<MDAClaimRecord>(TABLES.MDA_CLAIM, convertedRecords);
  }

  static async uploadPOSLFOMData(records: FlexibleDataRow[]): Promise<DatabaseResponse<POSLFOMRecord>> {
    const convertedRecords = records.map(record => 
      this.convertToTableRecord(record, TABLES.POS_LFOM) as Partial<POSLFOMRecord>
    );
    return this.insertBatch<POSLFOMRecord>(TABLES.POS_LFOM, convertedRecords);
  }

  static async uploadPOSFOMData(records: FlexibleDataRow[]): Promise<DatabaseResponse<POSFOMRecord>> {
    const convertedRecords = records.map(record => 
      this.convertToTableRecord(record, TABLES.POS_FOM) as Partial<POSFOMRecord>
    );
    return this.insertBatch<POSFOMRecord>(TABLES.POS_FOM, convertedRecords);
  }

  static async uploadStockData(records: FlexibleDataRow[]): Promise<DatabaseResponse<StockRecord>> {
    const convertedRecords = records.map(record => 
      this.convertToTableRecord(record, TABLES.STOCK) as Partial<StockRecord>
    );
    return this.insertBatch<StockRecord>(TABLES.STOCK, convertedRecords);
  }

  static async uploadRevenueData(records: FlexibleDataRow[]): Promise<DatabaseResponse<RevenueRecord>> {
    const convertedRecords = records.map(record => 
      this.convertToTableRecord(record, TABLES.REVENUE) as Partial<RevenueRecord>
    );
    return this.insertBatch<RevenueRecord>(TABLES.REVENUE, convertedRecords);
  }

  // Get all data from all tables
  static async fetchAllData(): Promise<{
    fom: FOMRecord[];
    lfom: LFOMRecord[];
    mdaClaim: MDAClaimRecord[];
    posLfom: POSLFOMRecord[];
    posFom: POSFOMRecord[];
    stock: StockRecord[];
    revenue: RevenueRecord[];
    errors: string[];
  }> {
    const results = await Promise.allSettled([
      this.fetchFOMData(),
      this.fetchLFOMData(),
      this.fetchMDAClaimData(),
      this.fetchPOSLFOMData(),
      this.fetchPOSFOMData(),
      this.fetchStockData(),
      this.fetchRevenueData()
    ]);

    const errors: string[] = [];
    const data = {
      fom: [] as FOMRecord[],
      lfom: [] as LFOMRecord[],
      mdaClaim: [] as MDAClaimRecord[],
      posLfom: [] as POSLFOMRecord[],
      posFom: [] as POSFOMRecord[],
      stock: [] as StockRecord[],
      revenue: [] as RevenueRecord[]
    };

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.data) {
        switch (index) {
          case 0: data.fom = result.value.data as FOMRecord[]; break;
          case 1: data.lfom = result.value.data as LFOMRecord[]; break;
          case 2: data.mdaClaim = result.value.data as MDAClaimRecord[]; break;
          case 3: data.posLfom = result.value.data as POSLFOMRecord[]; break;
          case 4: data.posFom = result.value.data as POSFOMRecord[]; break;
          case 5: data.stock = result.value.data as StockRecord[]; break;
          case 6: data.revenue = result.value.data as RevenueRecord[]; break;
        }
      } else if (result.status === 'fulfilled' && result.value.error) {
        errors.push(result.value.error.message);
      } else if (result.status === 'rejected') {
        errors.push(`Failed to fetch data: ${result.reason}`);
      }
    });

    return { ...data, errors };
  }
}