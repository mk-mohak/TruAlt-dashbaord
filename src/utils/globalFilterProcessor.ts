import { FlexibleDataRow } from '../types';
import { GlobalFilterState, FilterValidationResult } from '../types/filters';

export class GlobalFilterProcessor {
  /**
   * Apply global filters to a dataset
   */
  static applyGlobalFilters(
    data: FlexibleDataRow[], 
    filters: GlobalFilterState
  ): FlexibleDataRow[] {
    if (data.length === 0) return [];

    let filteredData = [...data];

    // Apply date range filter
    if (filters.dateRange.fromDate || filters.dateRange.toDate) {
      filteredData = this.applyDateRangeFilter(filteredData, filters.dateRange);
    }

    // Apply month filter
    if (filters.selectedMonths.length > 0) {
      filteredData = this.applyMonthFilter(filteredData, filters.selectedMonths);
    }

    // Apply buyer type filter
    if (filters.selectedBuyerTypes.length > 0) {
      filteredData = this.applyBuyerTypeFilter(filteredData, filters.selectedBuyerTypes);
    }

    return filteredData;
  }

  /**
   * Apply date range filter with robust date parsing
   */
  private static applyDateRangeFilter(
    data: FlexibleDataRow[], 
    dateRange: { fromDate: string; toDate: string }
  ): FlexibleDataRow[] {
    const { fromDate, toDate } = dateRange;
    
    if (!fromDate && !toDate) return data;

    // Find date column
    const dateColumn = this.findDateColumn(data);
    if (!dateColumn) {
      console.warn('No date column found for date range filtering');
      return data;
    }

    return data.filter(row => {
      const dateValue = row[dateColumn];
      if (!dateValue) return false;

      const parsedDate = this.parseDate(String(dateValue));
      if (!parsedDate) return false;

      const fromDateObj = fromDate ? new Date(fromDate) : null;
      const toDateObj = toDate ? new Date(toDate) : null;

      if (fromDateObj && parsedDate < fromDateObj) return false;
      if (toDateObj && parsedDate > toDateObj) return false;

      return true;
    });
  }

  /**
   * Apply month filter with flexible month column detection
   */
  private static applyMonthFilter(
    data: FlexibleDataRow[], 
    selectedMonths: string[]
  ): FlexibleDataRow[] {
    if (selectedMonths.length === 0) return data;

    // Find month column
    const monthColumn = this.findMonthColumn(data);
    if (!monthColumn) {
      console.warn('No month column found for month filtering');
      return data;
    }

    return data.filter(row => {
      const monthValue = String(row[monthColumn] || '').trim();
      if (!monthValue) return false;

      // Handle different month formats
      const normalizedMonth = this.normalizeMonth(monthValue);
      return selectedMonths.includes(normalizedMonth);
    });
  }

  /**
   * Apply buyer type filter with flexible column detection
   */
  private static applyBuyerTypeFilter(
    data: FlexibleDataRow[], 
    selectedBuyerTypes: string[]
  ): FlexibleDataRow[] {
    if (selectedBuyerTypes.length === 0) return data;

    // Find buyer type column
    const buyerTypeColumn = this.findBuyerTypeColumn(data);
    if (!buyerTypeColumn) {
      console.warn('No buyer type column found for buyer type filtering');
      return data;
    }

    return data.filter(row => {
      const buyerTypeValue = String(row[buyerTypeColumn] || '').trim().toUpperCase();
      if (!buyerTypeValue) return false;

      // Normalize buyer type values
      const normalizedBuyerType = this.normalizeBuyerType(buyerTypeValue);
      return selectedBuyerTypes.includes(normalizedBuyerType);
    });
  }

  /**
   * Validate filters against dataset and return validation result
   */
  static validateFilters(
    data: FlexibleDataRow[], 
    filters: GlobalFilterState
  ): FilterValidationResult {
    const warnings: string[] = [];
    
    // Check if date column exists when date filters are applied
    if ((filters.dateRange.fromDate || filters.dateRange.toDate) && !this.findDateColumn(data)) {
      warnings.push('Date range filter applied but no date column found in dataset');
    }

    // Check if month column exists when month filters are applied
    if (filters.selectedMonths.length > 0 && !this.findMonthColumn(data)) {
      warnings.push('Month filter applied but no month column found in dataset');
    }

    // Check if buyer type column exists when buyer type filters are applied
    if (filters.selectedBuyerTypes.length > 0 && !this.findBuyerTypeColumn(data)) {
      warnings.push('Buyer type filter applied but no buyer type column found in dataset');
    }

    const filteredData = this.applyGlobalFilters(data, filters);

    return {
      isValid: filteredData.length > 0 || data.length === 0,
      warnings,
      resultCount: filteredData.length
    };
  }

  /**
   * Get filter statistics for display
   */
  static getFilterStatistics(
    originalData: FlexibleDataRow[], 
    filteredData: FlexibleDataRow[], 
    filters: GlobalFilterState
  ) {
    return {
      originalCount: originalData.length,
      filteredCount: filteredData.length,
      reductionPercentage: originalData.length > 0 
        ? ((originalData.length - filteredData.length) / originalData.length) * 100 
        : 0,
      hasDateFilter: !!(filters.dateRange.fromDate || filters.dateRange.toDate),
      hasMonthFilter: filters.selectedMonths.length > 0,
      hasBuyerTypeFilter: filters.selectedBuyerTypes.length > 0,
    };
  }

  /**
   * Get filter statistics for display
   */
  static getFilterStatistics(
    originalData: FlexibleDataRow[], 
    filteredData: FlexibleDataRow[], 
    filters: GlobalFilterState
  ) {
    return {
      originalCount: originalData.length,
      filteredCount: filteredData.length,
      reductionPercentage: originalData.length > 0 
        ? ((originalData.length - filteredData.length) / originalData.length) * 100 
        : 0,
      hasDateFilter: !!(filters.dateRange.fromDate || filters.dateRange.toDate),
      hasMonthFilter: filters.selectedMonths.length > 0,
      hasBuyerTypeFilter: filters.selectedBuyerTypes.length > 0,
    };
  }

  /**
   * Find date column in dataset
   */
  private static findDateColumn(data: FlexibleDataRow[]): string | null {
    if (data.length === 0) return null;
    
    const columns = Object.keys(data[0]);
    return columns.find(col => 
      col.toLowerCase().includes('date') || 
      col.toLowerCase() === 'date'
    ) || null;
  }

  /**
   * Find month column in dataset
   */
  private static findMonthColumn(data: FlexibleDataRow[]): string | null {
    if (data.length === 0) return null;
    
    const columns = Object.keys(data[0]);
    return columns.find(col => {
      const lowerCol = col.toLowerCase();
      return lowerCol === 'month' || 
             lowerCol === 'months' || 
             lowerCol.includes('month');
    }) || null;
  }

  /**
   * Find buyer type column in dataset
   */
  private static findBuyerTypeColumn(data: FlexibleDataRow[]): string | null {
    if (data.length === 0) return null;
    
    const columns = Object.keys(data[0]);
    return columns.find(col => {
      const lowerCol = col.toLowerCase().replace(/\s+/g, '');
      return lowerCol.includes('buyer') && lowerCol.includes('type') ||
             lowerCol === 'type' ||
             lowerCol === 'buyertype';
    }) || null;
  }

  /**
   * Parse date with multiple format support
   */
  private static parseDate(dateString: string): Date | null {
    if (!dateString) return null;

    // Handle MM/DD/YYYY and DD/MM/YYYY formats
    if (dateString.includes('/')) {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        let month, day, year;
        
        // Detect format based on first part
        if (parseInt(parts[0]) > 12) {
          // DD/MM/YYYY format
          [day, month, year] = parts;
        } else {
          // MM/DD/YYYY format
          [month, day, year] = parts;
        }
        
        // Ensure 4-digit year
        if (year.length === 2) {
          year = '20' + year;
        }
        
        const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        const date = new Date(isoDate);
        return isNaN(date.getTime()) ? null : date;
      }
    }

    // Handle DD-MM-YYYY format
    if (dateString.includes('-') && dateString.split('-')[0].length <= 2) {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        const fullYear = year.length === 2 ? '20' + year : year;
        const isoDate = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        const date = new Date(isoDate);
        return isNaN(date.getTime()) ? null : date;
      }
    }

    // Try direct parsing for ISO format
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  }

  /**
   * Normalize month names to full month names
   */
  private static normalizeMonth(monthValue: string): string {
    const monthMap: { [key: string]: string } = {
      'jan': 'January', 'january': 'January',
      'feb': 'February', 'february': 'February',
      'mar': 'March', 'march': 'March',
      'apr': 'April', 'april': 'April',
      'may': 'May',
      'jun': 'June', 'june': 'June',
      'jul': 'July', 'july': 'July',
      'aug': 'August', 'august': 'August',
      'sep': 'September', 'september': 'September',
      'oct': 'October', 'october': 'October',
      'nov': 'November', 'november': 'November',
      'dec': 'December', 'december': 'December'
    };

    const normalized = monthValue.toLowerCase().trim();
    return monthMap[normalized] || monthValue;
  }

  /**
   * Normalize buyer type values
   */
  private static normalizeBuyerType(buyerTypeValue: string): string {
    const normalized = buyerTypeValue.toUpperCase().trim();
    
    // Handle common variations
    if (normalized === 'B2B' || normalized === 'B-2-B' || normalized === 'B 2 B') {
      return 'B2B';
    }
    if (normalized === 'B2C' || normalized === 'B-2-C' || normalized === 'B 2 C') {
      return 'B2C';
    }
    
    return normalized;
  }

  /**
   * Check if filters are compatible with dataset
   */
  static areFiltersCompatible(data: FlexibleDataRow[], filters: GlobalFilterState): boolean {
    if (data.length === 0) return true;

    // Check date compatibility
    if (filters.dateRange.fromDate || filters.dateRange.toDate) {
      if (!this.findDateColumn(data)) return false;
    }

    // Check month compatibility
    if (filters.selectedMonths.length > 0) {
      if (!this.findMonthColumn(data)) return false;
    }

    // Check buyer type compatibility
    if (filters.selectedBuyerTypes.length > 0) {
      if (!this.findBuyerTypeColumn(data)) return false;
    }

    return true;
  }

  /**
   * Get available filter options from dataset
   */
  static getAvailableFilterOptions(data: FlexibleDataRow[]) {
    if (data.length === 0) {
      return {
        hasDateColumn: false,
        hasMonthColumn: false,
        hasBuyerTypeColumn: false,
        availableMonths: [],
        availableBuyerTypes: [],
        dateRange: { min: '', max: '' }
      };
    }

    const dateColumn = this.findDateColumn(data);
    const monthColumn = this.findMonthColumn(data);
    const buyerTypeColumn = this.findBuyerTypeColumn(data);

    // Get available months from data
    const availableMonths = monthColumn 
      ? [...new Set(data.map(row => this.normalizeMonth(String(row[monthColumn] || ''))).filter(Boolean))]
      : [];

    // Get available buyer types from data
    const availableBuyerTypes = buyerTypeColumn 
      ? [...new Set(data.map(row => this.normalizeBuyerType(String(row[buyerTypeColumn] || ''))).filter(Boolean))]
      : [];

    // Get date range from data
    let dateRange = { min: '', max: '' };
    if (dateColumn) {
      const dates = data
        .map(row => this.parseDate(String(row[dateColumn] || '')))
        .filter(date => date !== null)
        .sort((a, b) => a!.getTime() - b!.getTime());
      
      if (dates.length > 0) {
        dateRange = {
          min: dates[0]!.toISOString().split('T')[0],
          max: dates[dates.length - 1]!.toISOString().split('T')[0]
        };
      }
    }

    return {
      hasDateColumn: !!dateColumn,
      hasMonthColumn: !!monthColumn,
      hasBuyerTypeColumn: !!buyerTypeColumn,
      availableMonths,
      availableBuyerTypes,
      dateRange
    };
  }
}