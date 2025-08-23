import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { FlexibleDataRow, ValidationResult, ValidationError } from '../types';

export class FileParser {
  static async parseFile(file: File): Promise<{ data: any[], errors: string[] }> {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'csv':
        return this.parseCSV(file);
      case 'xlsx':
      case 'xls':
        return this.parseExcel(file);
      case 'json':
        return this.parseJSON(file);
      default:
        throw new Error(`Unsupported file type: ${extension}`);
    }
  }

  private static parseCSV(file: File): Promise<{ data: any[], errors: string[] }> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim(),
        transform: (value: string, header: string) => {
          // Auto-detect and transform numeric columns
          if (this.isNumericColumn(header) || this.looksLikeNumber(value)) {
            const num = parseFloat(value);
            return isNaN(num) ? value.trim() : num;
          }
          return value.trim();
        },
        complete: (results) => {
          resolve({
            data: results.data,
            errors: results.errors.map(error => error.message)
          });
        },
        error: (error) => {
          reject(new Error(`CSV parsing error: ${error.message}`));
        }
      });
    });
  }

  private static parseExcel(file: File): Promise<{ data: any[], errors: string[] }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: ''
          });

          if (jsonData.length === 0) {
            reject(new Error('Excel file is empty'));
            return;
          }

          // Convert to object format with headers
          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1).map(row => {
            const obj: any = {};
            headers.forEach((header, index) => {
              const value = (row as any[])[index];
              // Auto-detect and transform numeric columns
              if (this.isNumericColumn(header) || this.looksLikeNumber(String(value))) {
                obj[header] = typeof value === 'number' ? value : parseFloat(value) || 0;
              } else {
                obj[header] = value || '';
              }
            });
            return obj;
          });

          resolve({
            data: rows,
            errors: []
          });
        } catch (error) {
          reject(new Error(`Excel parsing error: ${error}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read Excel file'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  private static parseJSON(file: File): Promise<{ data: any[], errors: string[] }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const data = JSON.parse(text);
          
          if (!Array.isArray(data)) {
            reject(new Error('JSON file must contain an array of objects'));
            return;
          }

          resolve({
            data,
            errors: []
          });
        } catch (error) {
          reject(new Error(`JSON parsing error: ${error}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read JSON file'));
      };

      reader.readAsText(file);
    });
  }

  static validateData(data: any[]): ValidationResult {
    const errors: ValidationError[] = [];
    const validRowsData: FlexibleDataRow[] = [];
    
    if (data.length === 0) {
      return {
        isValid: false,
        totalRows: 0,
        validRows: 0,
        errors: [{ row: 0, column: 'general', message: 'No data found', severity: 'error' }],
        detectedColumns: [],
        dataType: 'unknown',
        summary: {
          message: '❌ No data found in file',
          type: 'error'
        },
        validData: [],
      };
    }

    // Detect columns and data type
    const firstRow = data[0];
    const detectedColumns = Object.keys(firstRow);
    const dataType = this.detectDataType(detectedColumns);

    // Flexible validation - no required columns, just clean the data
    data.forEach((row, index) => {
      const rowNumber = index + 1;
      const cleanedRow: FlexibleDataRow = {};
      let hasValidData = false;

      // Clean and validate each column
      Object.keys(row).forEach(column => {
        const value = row[column];
        
        if (value !== null && value !== undefined && value !== '') {
          hasValidData = true;
          
          // Auto-convert numeric values
          if (this.isNumericColumn(column) || this.looksLikeNumber(String(value))) {
            const numValue = parseFloat(String(value));
            cleanedRow[column] = isNaN(numValue) ? value : numValue;
          } else {
            cleanedRow[column] = String(value).trim();
          }
        } else {
          cleanedRow[column] = null;
        }
      });

      // Only include rows that have at least some valid data
      if (hasValidData) {
        validRowsData.push(cleanedRow);
      } else {
        errors.push({
          row: rowNumber,
          column: 'general',
          message: 'Row contains no valid data',
          severity: 'warning'
        });
      }
    });

    const errorCount = errors.filter(e => e.severity === 'error').length;
    const warningCount = errors.filter(e => e.severity === 'warning').length;

    let summary;
    if (errorCount > 0) {
      summary = {
        message: `❌ ${errorCount} critical errors found. ${validRowsData.length}/${data.length} rows can be loaded.`,
        type: 'error' as const
      };
    } else if (warningCount > 0) {
      summary = {
        message: `⚠️ ${warningCount} warnings found. ${validRowsData.length}/${data.length} rows loaded successfully.`,
        type: 'warning' as const
      };
    } else {
      summary = {
        message: `✅ ${validRowsData.length} rows loaded successfully`,
        type: 'success' as const
      };
    }

    return {
      isValid: validRowsData.length > 0,
      totalRows: data.length,
      validRows: validRowsData.length,
      errors,
      detectedColumns,
      dataType,
      summary,
      validData: validRowsData,
    };
  }

  private static detectDataType(columns: string[]): 'sales' | 'production' | 'stock' | 'unknown' {
    const columnStr = columns.join(' ').toLowerCase();
    
    if (columnStr.includes('production') && columnStr.includes('sales') && columnStr.includes('stock')) {
      return 'production';
    }
    
    if (columnStr.includes('quantity') && columnStr.includes('price') && (columnStr.includes('name') || columnStr.includes('buyer'))) {
      return 'sales';
    }
    
    if (columnStr.includes('stock') || columnStr.includes('inventory')) {
      return 'stock';
    }
    
    return 'unknown';
  }

  private static isNumericColumn(columnName: string): boolean {
    const numericKeywords = [
      'quantity', 'price', 'revenue', 'amount', 'total', 'sum', 'count',
      'production', 'sales', 'stock', 'left', 'units', 'value', 'cost',
      'latitude', 'longitude', 'week', 'year', 'code'
    ];
    
    const lowerColumn = columnName.toLowerCase();
    return numericKeywords.some(keyword => lowerColumn.includes(keyword));
  }

  private static looksLikeNumber(value: string): boolean {
    if (!value || value.trim() === '') return false;
    const trimmed = value.trim();
    return !isNaN(parseFloat(trimmed)) && isFinite(parseFloat(trimmed));
  }

  private static isValidDate(dateString: string): boolean {
    if (!dateString) return false;
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }
}