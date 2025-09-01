export class ColorManager {
  private static readonly BASE_COLORS = [
    '#3b82f6', // Blue
    '#22c55e', // Green  
    '#f97316', // Orange
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#06b6d4', // Cyan
    '#f59e0b', // Amber
    '#ec4899', // Pink
    '#84cc16', // Lime
    '#14b8a6', // Teal
    '#6366f1', // Indigo
    '#dc2626', // Red variant
    '#059669', // Emerald
    '#7c3aed', // Violet
    '#0891b2', // Sky
  ];

  private static readonly DATASET_TYPE_COLORS = {
    'pos_fom': '#3b82f6',     
    'pos_lfom': '#22c55e',    
    'lfom': '#f59e0b',        
    'fom': '#f97316',         
    'mda_claim': '#8b5cf6',   
    'stock': '#14b8a6',       
    'production': '#7ab839',
  };

  private static assignedColors = new Map<string, string>();
  private static colorIndex = 0;

  static getDatasetColor(datasetName: string): string {
    // Check if color is already assigned
    if (this.assignedColors.has(datasetName)) {
      return this.assignedColors.get(datasetName)!;
    }

    // Detect dataset type and assign predefined color
    const detectedType = this.detectDatasetType(datasetName);
    if (detectedType && this.DATASET_TYPE_COLORS[detectedType]) {
      const color = this.DATASET_TYPE_COLORS[detectedType];
      this.assignedColors.set(datasetName, color);
      return color;
    }

    // Assign next available color from base palette
    const color = this.BASE_COLORS[this.colorIndex % this.BASE_COLORS.length];
    this.assignedColors.set(datasetName, color);
    this.colorIndex++;
    
    return color;
  }

  private static detectDatasetType(datasetName: string): string | null {
    const lowerName = datasetName.toLowerCase();
    
    // Order matters - check most specific first
    if (lowerName.includes('pos') && lowerName.includes('fom') && !lowerName.includes('lfom')) {
      return 'pos_fom';
    }
    if (lowerName.includes('pos') && lowerName.includes('lfom')) {
      return 'pos_lfom';
    }
    if (lowerName.includes('lfom') && !lowerName.includes('pos')) {
      return 'lfom';
    }
    if (lowerName.includes('fom') && !lowerName.includes('pos') && !lowerName.includes('lfom')) {
      return 'fom';
    }
    if (lowerName.includes('mda') && lowerName.includes('claim')) {
      return 'mda_claim';
    }
    if (lowerName.includes('stock')) {
      return 'stock';
    }
    if (lowerName.includes('production')) {
      return 'production';
    }
    if (lowerName.includes('stock') || lowerName.includes('inventory')) {
      return 'stock';
    }
    
    return null;
  }

  static getDatasetDisplayName(datasetName: string): string {
    const lowerName = datasetName.toLowerCase();
    
    if (lowerName.includes('pos') && lowerName.includes('fom') && !lowerName.includes('lfom')) {
      return 'POS FOM';
    }
    if (lowerName.includes('pos') && lowerName.includes('lfom')) {
      return 'POS LFOM';
    }
    if (lowerName.includes('lfom') && !lowerName.includes('pos')) {
      return 'LFOM';
    }
    if (lowerName.includes('fom') && !lowerName.includes('pos') && !lowerName.includes('lfom')) {
      return 'FOM';
    }
    if (lowerName.includes('mda') && lowerName.includes('claim')) {
      return 'MDA Claim';
    }
    if (lowerName.includes('stock')) {
      return 'Stock';
    }
    if (lowerName.includes('production')) {
      return 'Production';
    }
    if (lowerName.includes('stock') || lowerName.includes('inventory')) {
      return 'Stock Data';
    }
    
    return datasetName;
  }

  static isMDAClaimDataset(datasetName: string): boolean {
    const lowerName = datasetName.toLowerCase();
    return lowerName.includes('mda') || lowerName.includes('claim');
  }

  static isStockDataset(datasetName: string): boolean {
    const lowerName = datasetName.toLowerCase();
    return lowerName.includes('stock') || lowerName.includes('inventory');
  }

  static resetColorAssignments(): void {
    this.assignedColors.clear();
    this.colorIndex = 0;
  }

  static getAllAssignedColors(): Map<string, string> {
    return new Map(this.assignedColors);
  }
}