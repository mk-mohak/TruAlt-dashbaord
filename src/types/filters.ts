export interface GlobalFilterState {
  dateRange: {
    fromDate: string;
    toDate: string;
  };
  selectedMonths: string[];
  selectedBuyerTypes: string[];
}

export interface FilterPersistence {
  filters: GlobalFilterState;
  timestamp: string;
  datasetIds: string[];
}

export interface FilterValidationResult {
  isValid: boolean;
  warnings: string[];
  resultCount: number;
}