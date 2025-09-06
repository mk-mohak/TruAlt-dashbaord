import { useState, useEffect, useCallback } from 'react';
import { GlobalFilterState, FilterPersistence } from '../types/filters';
import { FlexibleDataRow } from '../types';
import { GlobalFilterProcessor } from '../utils/globalFilterProcessor';

const STORAGE_KEY = 'dashboard-global-filters';

export function useGlobalFilters() {
  const [globalFilters, setGlobalFilters] = useState<GlobalFilterState>({
    dateRange: { fromDate: '', toDate: '' },
    selectedMonths: [],
    selectedBuyerTypes: []
  });

  // Load persisted filters on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const persistence: FilterPersistence = JSON.parse(saved);
        // Only load if saved within last 24 hours
        const savedTime = new Date(persistence.timestamp);
        const now = new Date();
        const hoursDiff = (now.getTime() - savedTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          setGlobalFilters(persistence.filters);
        }
      }
    } catch (error) {
      console.error('Error loading persisted filters:', error);
    }
  }, []);

  // Persist filters whenever they change
  const persistFilters = useCallback((filters: GlobalFilterState, datasetIds: string[]) => {
    try {
      const persistence: FilterPersistence = {
        filters,
        timestamp: new Date().toISOString(),
        datasetIds
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistence));
    } catch (error) {
      console.error('Error persisting filters:', error);
    }
  }, []);

  const updateGlobalFilters = useCallback((filters: GlobalFilterState, datasetIds: string[] = []) => {
    setGlobalFilters(filters);
    persistFilters(filters, datasetIds);
  }, [persistFilters]);

  const clearGlobalFilters = useCallback(() => {
    const emptyFilters: GlobalFilterState = {
      dateRange: { fromDate: '', toDate: '' },
      selectedMonths: [],
      selectedBuyerTypes: []
    };
    setGlobalFilters(emptyFilters);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const applyFiltersToData = useCallback((data: FlexibleDataRow[]) => {
    return GlobalFilterProcessor.applyGlobalFilters(data, globalFilters);
  }, [globalFilters]);

  const getFilteredDataCount = useCallback((data: FlexibleDataRow[], filters?: GlobalFilterState) => {
    const filtersToUse = filters || globalFilters;
    const filteredData = GlobalFilterProcessor.applyGlobalFilters(data, filtersToUse);
    return filteredData.length;
  }, [globalFilters]);

  const hasActiveFilters = useCallback(() => {
    return globalFilters.dateRange.fromDate || 
           globalFilters.dateRange.toDate || 
           globalFilters.selectedMonths.length > 0 || 
           globalFilters.selectedBuyerTypes.length > 0;
  }, [globalFilters]);

  const validateFiltersForDataset = useCallback((data: FlexibleDataRow[]) => {
    return GlobalFilterProcessor.validateFilters(data, globalFilters);
  }, [globalFilters]);

  return {
    globalFilters,
    setGlobalFilters: updateGlobalFilters,
    clearGlobalFilters,
    applyFiltersToData,
    getFilteredDataCount,
    hasActiveFilters,
    validateFiltersForDataset
  };
}