export interface Transaction {
  transaction?: string;
  type?: string;
  movement?: string;
  for_day?: number | string;
  for_month?: number | string;
  for_year?: number | string;
  report_date?: string;
  date?: string;
  Report_Date?: string;
  quantity?: number | string;
  qty?: number | string;
  value?: number | string;
  material?: string;
}

export interface StockItem {
  material: string;
  closing?: number | string | null;
  unit?: string;
  transactions?: Transaction[];
}

export interface ProductionItem {
  product: string;
  Product?: string;
  standard_output?: number | string;
  actual_output?: number | string;
  output_percentage?: number | string;
  process_loss?: number | string;
  remarks?: string;
  report_date?: string;
  Report_Date?: string;
}

export interface BagItem {
  product?: string;
  opening?: number | string;
  received?: number | string;
  issue?: number | string;
  damage?: number | string;
  closing?: number | string;
  report_date?: string;
  Report_Date?: string;
}

export interface FeedUnitItem {
  Product?: string;
  product?: string;
  Opening_Day_MT?: number | string;
  opening_day_mt?: number | string;
  Opening_Day?: number | string;
  opening_day?: number | string;
  Opening?: number | string;
  opening?: number | string;
  Production_Day_MT?: number | string;
  production_day_mt?: number | string;
  Production_Day?: number | string;
  production_day?: number | string;
  Production?: number | string;
  production?: number | string;
  Dispatch_Day_MT?: number | string;
  dispatch_day_mt?: number | string;
  Dispatch_Day?: number | string;
  dispatch_day?: number | string;
  Dispatch?: number | string;
  dispatch?: number | string;
  Transfer_Day_MT?: number | string;
  transfer_day_mt?: number | string;
  Transfer_Day?: number | string;
  transfer_day?: number | string;
  Transfer?: number | string;
  transfer?: number | string;
  Closing_Day_MT?: number | string;
  closing_day_mt?: number | string;
  Closing_Day?: number | string;
  closing_day?: number | string;
  Closing?: number | string;
  closing?: number | string;
  Production_Month_MT?: number | string;
  production_month_mt?: number | string;
  Production_Month?: number | string;
  production_month?: number | string;
  Dispatch_Month_MT?: number | string;
  dispatch_month_mt?: number | string;
  Dispatch_Month?: number | string;
  dispatch_month?: number | string;
  report_date?: string;
  Report_Date?: string;
}

export interface PlantData {
  stock: StockItem[];
  stockHistory?: Transaction[];
  production: ProductionItem[];
  productionHistory?: ProductionItem[];
  bags: BagItem[];
  bagsHistory?: BagItem[];
  feedUnitData: FeedUnitItem[];
  feedUnitTotals?: unknown[];
  productionTrend: Array<{ date?: string; report_date?: string; actual_output?: number; value?: number; actual?: number } | number>;
  usage: Record<string, number[]>;
  reorder_items: Array<{ material?: string; Material?: string; name?: string; product?: string }>;
  consumption: number | null;
  efficiency: number | null;
  processLoss: number | null;
  report_date: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Plant Manager' | 'Production Incharge' | 'Maintenance Engineer' | 'Stores Manager' | 'Director';
  plant: string;
  avatar: string;
}

export interface MaintenanceTask {
  id: string;
  equipmentName: string;
  equipmentCode: string;
  area: string;
  type: 'Preventive' | 'Breakdown' | 'Calibration' | 'Overhaul';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  scheduledDate: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
  assignedTo: string;
  downtimeMinutes: number;
  description: string;
  lastServiced?: string;
}

export interface SparePart {
  id: string;
  code: string;
  name: string;
  equipment: string;
  currentStock: number;
  unit: string;
  minStock: number;
  maxStock: number;
  unitPriceINR: number;
  binLocation: string;
  supplier: string;
  leadTimeDays: number;
  category: 'Dies & Rollers' | 'Hammers & Screens' | 'Motors & Drives' | 'Bearings & Seals' | 'Belts & Chains' | 'Sensors & Electrical';
}
