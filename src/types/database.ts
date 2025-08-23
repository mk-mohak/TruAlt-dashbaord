// Database types based on existing schema
export interface FOMRecord {
  'S.No.': number;
  Date?: string;
  Week?: string;
  Month?: string;
  Year?: number;
  Name?: string;
  Adress?: string;
  'Pin code'?: number;
  Taluka?: string;
  District?: string;
  State?: string;
  Quantity?: number;
  Price?: number;
  'Buyer Type'?: string;
}

export interface LFOMRecord {
  'S.No.': number;
  Date?: string;
  Week?: string;
  Month?: string;
  Year?: number;
  Name?: string;
  Adress?: string;
  'Pin code'?: number;
  Taluka?: string;
  District?: string;
  State?: string;
  Quantity?: number;
  Price?: string;
  'Buyer Type'?: string;
}

export interface MDAClaimRecord {
  id: number;
  Year?: number;
  Month?: string;
  Week?: number;
  'Quantity Applied for MDA Claim/Sold'?: string;
  'Claim Accepted'?: string;
  'Eligible Amount'?: string;
  'Amount Received'?: string;
  'Amount not Received'?: string;
  'EQ QTY'?: string;
  'Date of Receipt'?: string;
  '% Recovery'?: string;
}

export interface POSLFOMRecord {
  id: number;
  Date?: string;
  Week?: string;
  Month?: string;
  Year?: number;
  Name?: string;
  Adress?: string;
  State?: string;
  Quantity?: number;
  Price?: number;
  Type?: string;
}

export interface POSFOMRecord {
  id: number;
  Date?: string;
  Week?: string;
  Month?: string;
  Year?: number;
  Name?: string;
  Adress?: string;
  State?: string;
  Quantity?: number;
  Price?: number;
  Revenue?: number;
  Type?: string;
}

export interface StockRecord {
  id: number;
  Date?: string;
  'RCF Production'?: number;
  'Boomi Samrudhi Production'?: string;
  'RCF Sales'?: number;
  'Boomi Samrudhi Sales'?: string;
  'RCF Stock Left'?: number;
  'Boomi Samrudhi Stock Left'?: number;
  'Total Stock Left'?: number;
}

export type DatabaseRecord = 
  | FOMRecord 
  | LFOMRecord 
  | MDAClaimRecord 
  | POSLFOMRecord 
  | POSFOMRecord 
  | StockRecord;

export interface DatabaseError {
  message: string;
  details?: string;
  hint?: string;
}

export interface DatabaseResponse<T> {
  data: T[] | null;
  error: DatabaseError | null;
  count?: number;
}