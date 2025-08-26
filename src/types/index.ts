// Flexible data row interface that can accommodate any column structure
export interface FlexibleDataRow {
  [key: string]: string | number | null | undefined;
}

// Base interfaces for different data types
export interface SalesDataRow extends FlexibleDataRow {
  Date?: string;
  Week?: string | number;
  Month?: string;
  Year?: string | number;
  Name?: string;
  Address?: string;
  Adress?: string; // Handle typo in original data
  'Pin code'?: string | number;
  Pincode?: string | number;
  Taluka?: string;
  District?: string;
  State?: string;
  Quantity?: number;
  Price?: number;
  'Buyer Type'?: string;
  Type?: string;
}

export interface ProductionDataRow extends FlexibleDataRow {
  Date?: string;
  'RCF Production'?: number;
  'Boomi Samrudhi Production'?: number;
  'RCF Sales'?: number;
  'Boomi Samrudhi Sales'?: number;
  'RCF Stock Left'?: number;
  'Boomi Samrudhi Stock Left'?: number;
}

export interface ValidationResult {
  validData: FlexibleDataRow[];
  isValid: boolean;
  totalRows: number;
  validRows: number;
  errors: ValidationError[];
  detectedColumns: string[];
  dataType: 'sales' | 'production' | 'stock' | 'unknown';
  summary: ValidationSummary;
}

export interface ValidationError {
  row: number;
  column: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationSummary {
  message: string;
  type: 'success' | 'warning' | 'error';
}

export interface FilterState {
  dateRange: {
    start: string;
    end: string;
  };
  selectedValues: { [column: string]: string[] };
  selectedProducts: string[];
  selectedPlants: string[];
  selectedFactories: string[];
  drillDownFilters: {
    [key: string]: any;
  };
}

export interface ChartType {
  id: string;
  name: string;
  icon: string;
}

export interface KPICard {
  title: string;
  value: string;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: string;
  color: string;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  currency: string;
  language: string;
  notifications: boolean;
  autoSave: boolean;
  savedFilterSets: SavedFilterSet[];
  chartPreferences: {
    [key: string]: string;
  };
}

export interface SavedFilterSet {
  id: string;
  name: string;
  filters: FilterState;
  createdAt: string;
}

export interface ExportOptions {
  format: 'pdf' | 'png' | 'csv' | 'json';
  includeCharts: boolean;
  includeData: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  quality?: 'low' | 'medium' | 'high';
}

export type TabType = 'overview' | 'data-management' | 'explorer' | 'datasets' | 'settings';

export interface AppState {
  data: FlexibleDataRow[];
  filteredData: FlexibleDataRow[];
  datasets: Dataset[];
  activeDatasetIds: string[];
  datasetLibraryOpen: boolean;
  chartInteractionMode: 'normal' | 'brush' | 'crossfilter';
  brushSelection: BrushSelection | null;
  chartAnnotations: ChartAnnotation[];
  filters: FilterState;
  settings: UserSettings;
  activeTab: TabType;
  isLoading: boolean;
  error: string | null;
  sampleDataLoaded: boolean;
  chartInteractions: {
    [key: string]: any;
  };
  user: any;
  isAuthenticated: boolean;
}

export interface Dataset {
  id: string;
  name: string;
  data: FlexibleDataRow[];
  fileName: string;
  fileSize: number;
  uploadDate: string;
  status: 'valid' | 'warning' | 'error';
  rowCount: number;
  validationSummary?: string;
  color: string;
  preview: FlexibleDataRow[];
  dataType: 'sales' | 'production' | 'stock' | 'unknown';
  detectedColumns: string[];
}

export interface MultiDatasetData {
  datasetId: string;
  datasetName: string;
  data: FlexibleDataRow[];
  color: string;
  dataType: string;
}

export interface BrushSelection {
  chartId: string;
  selection: {
    xaxis?: { min: number; max: number };
    yaxis?: { min: number; max: number };
  };
}

export interface ChartAnnotation {
  id: string;
  chartId: string;
  x: number;
  y: number;
  text: string;
  color: string;
  timestamp: string;
}

export interface DatasetMergeConfig {
  primaryDatasetId: string;
  secondaryDatasetId: string;
  joinKey: string;
  joinType: 'inner' | 'left' | 'right' | 'outer';
}

export interface ChartRecommendation {
  type: string;
  title: string;
  description: string;
  confidence: number;
  reason: string;
}

// Column mapping for different data types
export interface ColumnMapping {
  date: string[];
  name: string[];
  location: string[];
  quantity: string[];
  price: string[];
  revenue: string[];
  category: string[];
}