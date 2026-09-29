import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { PlantData, MaintenanceTask, SparePart, Transaction, StockItem, ProductionItem, BagItem, FeedUnitItem } from '../types/plant';

const API_URL = "https://script.google.com/macros/s/AKfycbxhiO5LAGwqkvDHW9DjH8jynYzYlyjAvNxgYlV9J3Y1GGZJxGb_3oXCvk-Bzefp74oa/exec";
const CACHE_KEY = "manager_dashboard_last_success_v2";
const CACHE_TIME_KEY = "manager_dashboard_last_success_time_v2";
export const DEFAULT_SAFETY_DAYS = 7;

export function clean(v: unknown): string {
  return String(v ?? "").trim();
}

export function normalize(v: unknown): string {
  return clean(v).replace(/\s+/g, " ").toUpperCase();
}

export function num(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function fmt(v: unknown): string {
  if (v === null || v === undefined || v === "") return "--";
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString("en-IN", { maximumFractionDigits: 2 }) : String(v);
}

export function fmtMT(v: unknown): string {
  return v === null || v === undefined || v === "" ? "--" : fmt(v) + " MT";
}

export function isPremixProduct(name: unknown): boolean {
  return /PREMIX/i.test(clean(name));
}

export function isPremixMaterial(name: unknown): boolean {
  return isPremixProduct(name);
}

export function fmtFeed(v: unknown, product: string): string {
  return v === null || v === undefined || v === "" ? "--" : isPremixProduct(product) ? fmt(v) + " KG" : fmt(v) + " MT";
}

export function feedValueInMT(v: unknown, product: string): number {
  const n = num(v) || 0;
  return isPremixProduct(product) ? n / 1000 : n;
}

export function materialUnit(material: string, fallback = "MT"): string {
  return isPremixMaterial(material) ? "KG" : fallback;
}

export function fmtMaterial(v: unknown, material: string, fallback = "MT"): string {
  return v === null || v === undefined || v === "" ? "--" : fmt(v) + " " + materialUnit(material, fallback);
}

export function materialValueInMT(v: unknown, material: string): number {
  const n = num(v) || 0;
  return isPremixMaterial(material) ? n / 1000 : n;
}

export function tType(t: Transaction): string {
  return normalize(t.transaction || t.type || t.movement || "");
}

export function tVal(t: Transaction): number {
  return Math.abs(num(t.for_day ?? t.value ?? t.quantity ?? t.qty ?? 0) || 0);
}

export function rowDate(t: Transaction): string {
  return clean(t.report_date || t.date || t.Report_Date || "");
}

export function dateOnly(v: unknown): string {
  const s = clean(v);
  if (!s) return "";
  const m = s.match(/(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : s.slice(0, 10);
}

export function fmtBags(v: unknown): string {
  return v === null || v === undefined || v === "" ? "--" : fmt(v) + " Bags";
}

export function feedField(r: FeedUnitItem, key: string): number | null {
  const map: Record<string, string[]> = {
    Production_Day_MT: ["Production_Day_MT", "production_day_mt", "Production_Day", "production_day", "Production", "production"],
    Production_Month_MT: ["Production_Month_MT", "production_month_mt", "Production_Month", "production_month"],
    Dispatch_Day_MT: ["Dispatch_Day_MT", "dispatch_day_mt", "Dispatch_Day", "dispatch_day", "Dispatch", "dispatch"],
    Dispatch_Month_MT: ["Dispatch_Month_MT", "dispatch_month_mt", "Dispatch_Month", "dispatch_month"],
  };
  const keys = map[key] || [key];
  for (const k of keys) {
    const val = num((r as Record<string, unknown>)[k]);
    if (val !== null) return val;
  }
  return null;
}

export function feedClosingBagSize(product: string): number | null {
  const name = String(product || "").toUpperCase();
  if (/\bLOOSE\b/.test(name)) return null;
  if (/^FC30(?:\s*CRUMBLES)?(?:\b|$)/.test(name)) return 60;
  if (/50\s*KG?\b/.test(name)) return 50;
  if (/60\s*KG?\b/.test(name)) return 60;
  if (/FINISHER\s*MASH|LAYER\s*MASH\s*\/\s*PLM/.test(name)) return 75;
  return 70;
}

export function fmtFeedClosingBags(value: unknown, product: string): string {
  const bagKg = feedClosingBagSize(product);
  if (bagKg === null || value === null || value === undefined || value === "") return "";
  const mt = feedValueInMT(value, product);
  return fmt((mt * 1000) / bagKg) + " Bags (" + bagKg + " KG)";
}

// Initial Maintenance & Spare parts seed data
const SEED_MAINTENANCE: MaintenanceTask[] = [
  {
    id: 'maint_01',
    equipmentName: 'Pellet Mill #1 (CPM 7932 - 250 HP)',
    equipmentCode: 'PM-01',
    area: 'Pelleting Section',
    type: 'Preventive',
    priority: 'Critical',
    scheduledDate: '2026-09-30',
    status: 'In Progress',
    assignedTo: 'K. Srinivas Rao',
    downtimeMinutes: 45,
    description: 'Replace die ring clamp bolts, check roller shell gap clearance (0.2mm), grease main shaft bearings with high-temp grease.',
    lastServiced: '2026-09-15',
  },
  {
    id: 'maint_02',
    equipmentName: 'Hammer Mill #1 (Fine Grinder 8 TPH)',
    equipmentCode: 'HM-01',
    area: 'Grinding Section',
    type: 'Preventive',
    priority: 'High',
    scheduledDate: '2026-10-01',
    status: 'Pending',
    assignedTo: 'T. Ramaiah',
    downtimeMinutes: 30,
    description: 'Reverse tungsten-carbide beaters/hammers, inspect 2.0mm perforated screen wear, check rotor dynamic balance.',
    lastServiced: '2026-09-10',
  },
  {
    id: 'maint_03',
    equipmentName: 'Batch Ribbon Mixer (2 Ton Capacity)',
    equipmentCode: 'MX-01',
    area: 'Batching & Mixing',
    type: 'Preventive',
    priority: 'Medium',
    scheduledDate: '2026-10-02',
    status: 'Pending',
    assignedTo: 'M. Naveen',
    downtimeMinutes: 20,
    description: 'Pneumatic bomb-doors seal inspection, liquid spray nozzles de-clogging, CV coefficient of variation oil test.',
    lastServiced: '2026-09-18',
  },
  {
    id: 'maint_04',
    equipmentName: 'Forbes Marshall Steam Boiler (2 TPH)',
    equipmentCode: 'BLR-01',
    area: 'Utilities',
    type: 'Calibration',
    priority: 'High',
    scheduledDate: '2026-09-29',
    status: 'Completed',
    assignedTo: 'S. Chandrasekhar',
    downtimeMinutes: 0,
    description: 'Steam pressure PRV valve calibration (8.5 bar), water softener TDS check (<150 ppm), blowdown valve service.',
    lastServiced: '2026-09-29',
  },
  {
    id: 'maint_05',
    equipmentName: 'Bucket Elevator #3 (Finished Feed to Silo)',
    equipmentCode: 'BE-03',
    area: 'Elevator & Conveyor',
    type: 'Breakdown',
    priority: 'High',
    scheduledDate: '2026-09-28',
    status: 'Completed',
    assignedTo: 'K. Srinivas Rao',
    downtimeMinutes: 55,
    description: 'Repaired loose nylon elevator buckets and adjusted head pulley rubber lagging alignment.',
    lastServiced: '2026-09-28',
  },
  {
    id: 'maint_06',
    equipmentName: 'Automatic Bagging & Stitching Station',
    equipmentCode: 'BG-01',
    area: 'Packing Section',
    type: 'Preventive',
    priority: 'Medium',
    scheduledDate: '2026-10-03',
    status: 'Pending',
    assignedTo: 'T. Ramaiah',
    downtimeMinutes: 15,
    description: 'Weighing loadcell 50/60/70kg calibration check, sewing machine oil reservoir refill and needle replacement.',
    lastServiced: '2026-09-22',
  },
];

const SEED_SPARES: SparePart[] = [
  {
    id: 'spr_01',
    code: 'DIE-CPM-30',
    name: 'Pellet Mill Die 3.0mm (X46Cr13 Alloy Steel)',
    equipment: 'Pellet Mill #1 (CPM 7932)',
    currentStock: 2,
    unit: 'Nos',
    minStock: 1,
    maxStock: 4,
    unitPriceINR: 145000,
    binLocation: 'Bay-A / Rack-01',
    supplier: 'Andritz Feed Tech / Graf Dies',
    leadTimeDays: 25,
    category: 'Dies & Rollers',
  },
  {
    id: 'spr_02',
    code: 'DIE-CPM-40',
    name: 'Pellet Mill Die 4.0mm (For Broiler Finisher)',
    equipment: 'Pellet Mill #1 & #2',
    currentStock: 3,
    unit: 'Nos',
    minStock: 2,
    maxStock: 5,
    unitPriceINR: 142000,
    binLocation: 'Bay-A / Rack-02',
    supplier: 'Andritz Feed Tech',
    leadTimeDays: 25,
    category: 'Dies & Rollers',
  },
  {
    id: 'spr_03',
    code: 'ROL-SHL-7932',
    name: 'Roller Shell Dimpled 7932 CPM',
    equipment: 'Pellet Mill #1 (CPM 7932)',
    currentStock: 4,
    unit: 'Pairs',
    minStock: 2,
    maxStock: 6,
    unitPriceINR: 48000,
    binLocation: 'Bay-A / Rack-04',
    supplier: 'CPM Asia / Precision Engg',
    leadTimeDays: 14,
    category: 'Dies & Rollers',
  },
  {
    id: 'spr_04',
    code: 'HAM-TUNG-01',
    name: 'Tungsten Carbide Tipped Hammers (Set of 64)',
    equipment: 'Hammer Mill #1 & #2',
    currentStock: 1,
    unit: 'Sets',
    minStock: 2,
    maxStock: 5,
    unitPriceINR: 32000,
    binLocation: 'Bay-B / Rack-01',
    supplier: 'Hardox Cutting Tools Ltd',
    leadTimeDays: 10,
    category: 'Hammers & Screens',
  },
  {
    id: 'spr_05',
    code: 'SCR-HM-20',
    name: 'Perforated Heavy Screen 2.0mm Hole Size',
    equipment: 'Hammer Mill #1',
    currentStock: 5,
    unit: 'Nos',
    minStock: 3,
    maxStock: 10,
    unitPriceINR: 7500,
    binLocation: 'Bay-B / Rack-03',
    supplier: 'Standard Perforators Hyderabad',
    leadTimeDays: 7,
    category: 'Hammers & Screens',
  },
  {
    id: 'spr_06',
    code: 'BRG-SKF-22320',
    name: 'SKF Spherical Roller Bearing 22320-CC/W33',
    equipment: 'Pellet Mill Main Shaft',
    currentStock: 1,
    unit: 'Nos',
    minStock: 2,
    maxStock: 4,
    unitPriceINR: 38500,
    binLocation: 'Bay-C / Lock-01',
    supplier: 'SKF Authorized Industrial Bearing Co',
    leadTimeDays: 5,
    category: 'Bearings & Seals',
  },
  {
    id: 'spr_07',
    code: 'BLT-SPA-3150',
    name: 'V-Belt Mitsuboshi SPA-3150 (Set of 4)',
    equipment: 'Hammer Mill Motor Drive',
    currentStock: 3,
    unit: 'Sets',
    minStock: 2,
    maxStock: 6,
    unitPriceINR: 9200,
    binLocation: 'Bay-D / Rack-02',
    supplier: 'Industrial Belts & Pulleys Hyderabad',
    leadTimeDays: 4,
    category: 'Belts & Chains',
  },
  {
    id: 'spr_08',
    code: 'SEN-PT100-RTD',
    name: 'Conditioner RTD Steam Temp Sensor PT100',
    equipment: 'Pellet Mill Conditioner',
    currentStock: 2,
    unit: 'Nos',
    minStock: 1,
    maxStock: 4,
    unitPriceINR: 4200,
    binLocation: 'Bay-E / Elec-02',
    supplier: 'Autonics India / Omron',
    leadTimeDays: 3,
    category: 'Sensors & Electrical',
  },
  {
    id: 'spr_09',
    code: 'SEW-NDL-DN1',
    name: 'Bag Sewing Machine Needles UY-143GS (Pack of 50)',
    equipment: 'Fischbein Sewing Heads',
    currentStock: 6,
    unit: 'Packs',
    minStock: 3,
    maxStock: 12,
    unitPriceINR: 1800,
    binLocation: 'Bay-E / Pack-01',
    supplier: 'Fischbein Bag Stitching India',
    leadTimeDays: 4,
    category: 'Sensors & Electrical',
  },
];

interface PlantContextType {
  data: PlantData;
  viewDate: string | null;
  setViewDate: (d: string | null) => void;
  status: { ok: boolean; message: string; lastUpdated: string };
  refreshData: () => Promise<void>;
  isLoading: boolean;
  activeModal: { title: string; content: React.ReactNode } | null;
  openModal: (title: string, content: React.ReactNode) => void;
  closeModal: () => void;
  // Plant calculations
  getMaterials: () => string[];
  getMaterial: (material: string) => StockItem | null;
  transactions: (material: string) => Transaction[];
  avgConsumption: (material: string) => number;
  stockStatus: (closing: number, avg: number) => { cover: number | null; status: string; cls: string };
  premixBommakalTransfers: () => Array<{ material: string; value: number }>;
  latestFeedRows: () => FeedUnitItem[];
  latestTotal: (key: string) => number;
  latestFeedClosingTotal: () => number;
  latestFeedClosingBagEquivalent: () => number;
  selectedProduction: () => ProductionItem[];
  selectedBags: () => BagItem[];
  rawTotal: (material: string, tab: string) => number;
  dailyControlMetrics: () => {
    reorder: number;
    mismatches: number;
    abnormal: number;
    efficiency: number | null;
    loss: number | null;
    premix: number;
    damage: number;
  };
  getAvailableDates: () => string[];
  // Maintenance & Spares state
  maintenanceTasks: MaintenanceTask[];
  addMaintenanceTask: (task: Omit<MaintenanceTask, 'id'>) => void;
  updateTaskStatus: (id: string, status: MaintenanceTask['status']) => void;
  spareParts: SparePart[];
  updateSpareStock: (id: string, delta: number) => void;
  addSparePart: (spare: Omit<SparePart, 'id'>) => void;
  // Extra user production entries
  addProductionEntry: (entry: ProductionItem) => void;
}

const PlantContext = createContext<PlantContextType | null>(null);

export const PlantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<PlantData>({
    stock: [],
    production: [],
    bags: [],
    feedUnitData: [],
    feedUnitTotals: [],
    productionTrend: [],
    usage: {},
    reorder_items: [],
    consumption: null,
    efficiency: null,
    processLoss: null,
    report_date: null,
  });

  const [viewDate, setViewDateState] = useState<string | null>(null);
  const [status, setStatus] = useState({
    ok: false,
    message: 'Loading plant data...',
    lastUpdated: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeModal, setActiveModal] = useState<{ title: string; content: React.ReactNode } | null>(null);

  // Local storage for maintenance & spares
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>(() => {
    try {
      const s = localStorage.getItem('plant_maintenance_tasks');
      if (s) return JSON.parse(s);
    } catch {
      // ignore
    }
    return SEED_MAINTENANCE;
  });

  const [spareParts, setSpareParts] = useState<SparePart[]>(() => {
    try {
      const s = localStorage.getItem('plant_spare_parts');
      if (s) return JSON.parse(s);
    } catch {
      // ignore
    }
    return SEED_SPARES;
  });

  const [customProduction, setCustomProduction] = useState<ProductionItem[]>(() => {
    try {
      const s = localStorage.getItem('plant_custom_production');
      if (s) return JSON.parse(s);
    } catch {
      // ignore
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('plant_maintenance_tasks', JSON.stringify(maintenanceTasks));
  }, [maintenanceTasks]);

  useEffect(() => {
    localStorage.setItem('plant_spare_parts', JSON.stringify(spareParts));
  }, [spareParts]);

  useEffect(() => {
    localStorage.setItem('plant_custom_production', JSON.stringify(customProduction));
  }, [customProduction]);

  const addMaintenanceTask = (task: Omit<MaintenanceTask, 'id'>) => {
    const newTask: MaintenanceTask = {
      ...task,
      id: `maint_${Date.now()}`,
    };
    setMaintenanceTasks((prev) => [newTask, ...prev]);
  };

  const updateTaskStatus = (id: string, taskStatus: MaintenanceTask['status']) => {
    setMaintenanceTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: taskStatus } : t))
    );
  };

  const updateSpareStock = (id: string, delta: number) => {
    setSpareParts((prev) =>
      prev.map((s) => (s.id === id ? { ...s, currentStock: Math.max(0, s.currentStock + delta) } : s))
    );
  };

  const addSparePart = (spare: Omit<SparePart, 'id'>) => {
    const newSpare: SparePart = {
      ...spare,
      id: `spr_${Date.now()}`,
    };
    setSpareParts((prev) => [...prev, newSpare]);
  };

  const addProductionEntry = (entry: ProductionItem) => {
    setCustomProduction((prev) => [entry, ...prev]);
  };

  const openModal = (title: string, content: React.ReactNode) => {
    setActiveModal({ title, content });
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const setViewDate = (d: string | null) => {
    setViewDateState(d ? dateOnly(d) : null);
  };

  // Cache loading
  const restoreCache = useCallback(() => {
    try {
      const s = localStorage.getItem(CACHE_KEY);
      if (s) {
        const c = JSON.parse(s);
        if (c && c.status === 'success') {
          setData({
            stock: Array.isArray(c.stock) ? c.stock : [],
            stockHistory: Array.isArray(c.stock_history) ? c.stock_history : [],
            production: Array.isArray(c.production) ? c.production : [],
            productionHistory: Array.isArray(c.production_history) ? c.production_history : [],
            bags: Array.isArray(c.pp_bags) ? c.pp_bags : [],
            bagsHistory: Array.isArray(c.pp_bags_history) ? c.pp_bags_history : [],
            feedUnitData: Array.isArray(c.feedUnitData) ? c.feedUnitData : [],
            feedUnitTotals: Array.isArray(c.feedUnitTotals) ? c.feedUnitTotals : (c.feedUnitTotals || []),
            productionTrend: Array.isArray(c.productionTrend) ? c.productionTrend : [],
            usage: c.usage && typeof c.usage === "object" ? c.usage : {},
            reorder_items: Array.isArray(c.reorder_items) ? c.reorder_items : [],
            consumption: c.consumption ?? null,
            efficiency: c.efficiency ?? null,
            processLoss: c.processLoss ?? null,
            report_date: c.report_date ?? null,
          });
          const tm = Number(localStorage.getItem(CACHE_TIME_KEY) || 0);
          setStatus({
            ok: false,
            message: 'Showing saved data • refreshing...',
            lastUpdated: tm ? 'Cached ' + new Date(tm).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : 'Cached',
          });
          return true;
        }
      }
    } catch {
      // ignore
    }
    return false;
  }, []);

  // Live JSONP fetch from Google Apps Script
  const isFetchingRef = useRef(false);

  const fetchLive = useCallback((attempt = 0): Promise<void> => {
    return new Promise((resolve, reject) => {
      const callbackName = "managerDashboardCallback_" + Date.now() + "_" + Math.random().toString(36).slice(2);
      const script = document.createElement("script");
      let finished = false;
      let timeout: NodeJS.Timeout;

      function cleanup() {
        if (timeout) clearTimeout(timeout);
        if (script.parentNode) script.parentNode.removeChild(script);
        try {
          delete (window as unknown as Record<string, unknown>)[callbackName];
        } catch {
          (window as unknown as Record<string, unknown>)[callbackName] = undefined;
        }
      }

      function fail(message: string) {
        if (finished) return;
        finished = true;
        cleanup();
        reject(new Error(message));
      }

      (window as unknown as Record<string, unknown>)[callbackName] = (apiData: { status?: string; [key: string]: unknown }) => {
        if (finished) return;
        try {
          if (!apiData || apiData.status !== "success") {
            fail("Invalid API response");
            return;
          }
          finished = true;
          cleanup();

          const incoming: PlantData = {
            stock: Array.isArray(apiData.stock) ? (apiData.stock as StockItem[]) : [],
            stockHistory: Array.isArray(apiData.stock_history) ? (apiData.stock_history as Transaction[]) : [],
            production: Array.isArray(apiData.production) ? (apiData.production as ProductionItem[]) : [],
            productionHistory: Array.isArray(apiData.production_history) ? (apiData.production_history as ProductionItem[]) : [],
            bags: Array.isArray(apiData.pp_bags) ? (apiData.pp_bags as BagItem[]) : [],
            bagsHistory: Array.isArray(apiData.pp_bags_history) ? (apiData.pp_bags_history as BagItem[]) : [],
            feedUnitData: Array.isArray(apiData.feedUnitData) ? (apiData.feedUnitData as FeedUnitItem[]) : [],
            feedUnitTotals: Array.isArray(apiData.feedUnitTotals) ? (apiData.feedUnitTotals as unknown[]) : [],
            productionTrend: Array.isArray(apiData.productionTrend) ? (apiData.productionTrend as PlantData['productionTrend']) : [],
            usage: apiData.usage && typeof apiData.usage === "object" ? (apiData.usage as Record<string, number[]>) : {},
            reorder_items: Array.isArray(apiData.reorder_items) ? (apiData.reorder_items as PlantData['reorder_items']) : [],
            consumption: (apiData.consumption as number) ?? null,
            efficiency: (apiData.efficiency as number) ?? null,
            processLoss: (apiData.processLoss as number) ?? null,
            report_date: (apiData.report_date as string) ?? null,
          };

          setData(incoming);

          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(apiData));
            localStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
          } catch {
            // storage may be full
          }

          setStatus({
            ok: true,
            message: 'Live',
            lastUpdated: 'Updated ' + new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
          });

          resolve();
        } catch (e) {
          fail((e as Error)?.message || "API handling failed");
        }
      };

      script.async = true;
      script.referrerPolicy = "no-referrer";
      script.onerror = () => {
        if (finished) return;
        if (attempt < 1) {
          cleanup();
          setTimeout(() => fetchLive(attempt + 1).then(resolve).catch(reject), 800);
        } else {
          fail("Google Apps Script connection failed");
        }
      };

      script.src = API_URL + "?callback=" + encodeURIComponent(callbackName) + "&t=" + Date.now();
      document.head.appendChild(script);

      timeout = setTimeout(() => {
        if (finished) return;
        if (attempt < 1) {
          finished = true;
          cleanup();
          setTimeout(() => fetchLive(attempt + 1).then(resolve).catch(reject), 800);
        } else {
          fail("API timeout");
        }
      }, 20000);
    });
  }, []);

  const refreshData = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsLoading(true);
    setStatus((prev) => ({ ...prev, ok: true, message: 'Connecting...' }));

    try {
      await fetchLive();
    } catch {
      setStatus((prev) => ({
        ...prev,
        ok: false,
        message: 'Unable to refresh • showing saved data',
      }));
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }, [fetchLive]);

  useEffect(() => {
    restoreCache();
    refreshData();
  }, [restoreCache, refreshData]);

  // CALCULATION LOGIC
  const viewStockRows = useCallback((): StockItem[] => {
    if (viewDate) {
      const d = dateOnly(viewDate);
      const grouped = new Map<string, { material: string; transactions: Transaction[] }>();
      (data.stockHistory || []).forEach((t) => {
        if (dateOnly(rowDate(t)) !== d) return;
        const mat = clean(t.material);
        if (!mat) return;
        const k = normalize(mat);
        if (!grouped.has(k)) grouped.set(k, { material: mat, transactions: [] });
        grouped.get(k)!.transactions.push(t);
      });
      const current = new Map((data.stock || []).map((x) => [normalize(x.material), x]));
      return [...grouped.values()].map((g) => {
        const base = current.get(normalize(g.material)) || {};
        const closingRows = g.transactions.filter((t) => tType(t) === "CL. STOCK");
        const latestClosing = closingRows.length ? closingRows[closingRows.length - 1] : null;
        return {
          ...base,
          material: g.material,
          transactions: g.transactions,
          closing: latestClosing ? tVal(latestClosing) : null,
        };
      });
    }

    return (data.stock || []).map((x) => {
      const tx = Array.isArray(x.transactions) ? x.transactions : [];
      const closingRows = tx.filter((t) => tType(t) === "CL. STOCK");
      const latestClosing = closingRows.length ? closingRows[closingRows.length - 1] : null;
      return {
        ...x,
        transactions: tx,
        closing: latestClosing ? tVal(latestClosing) : num(x.closing),
      };
    }).filter((x) => x.material);
  }, [data.stock, data.stockHistory, viewDate]);

  const getMaterials = useCallback((): string[] => {
    return [...new Set(viewStockRows().map((x) => clean(x.material)).filter(Boolean))];
  }, [viewStockRows]);

  const getMaterial = useCallback((material: string): StockItem | null => {
    return viewStockRows().find((x) => normalize(x.material) === normalize(material)) || null;
  }, [viewStockRows]);

  const transactions = useCallback((material: string): Transaction[] => {
    const x = getMaterial(material);
    return x && Array.isArray(x.transactions) ? x.transactions : [];
  }, [getMaterial]);

  const avgConsumption = useCallback((material: string): number => {
    const history = Array.isArray(data.stockHistory) ? data.stockHistory : [];
    const target = normalize(material);
    const dated = new Map<string, number>();

    history.forEach((t) => {
      if (normalize(t.material) !== target || !tType(t).includes("CONSUMPTION")) return;
      const d = dateOnly(rowDate(t));
      const v = num(t.for_day);
      if (!d || v === null || v <= 0) return;
      dated.set(d, (dated.get(d) || 0) + v);
    });

    if (!dated.size) {
      const fallbackUsage = data.usage[material];
      if (Array.isArray(fallbackUsage) && fallbackUsage.length > 0) {
        const nums = fallbackUsage.map(Number).filter(Number.isFinite);
        if (nums.length) return nums.reduce((a, b) => a + b, 0) / nums.length;
      }
      return 0;
    }

    const availableDates = [...dated.keys()].sort();
    let anchor = dateOnly(viewDate);
    if (!anchor) anchor = availableDates[availableDates.length - 1];
    const anchorTime = new Date(anchor + "T00:00:00").getTime();
    const startTime = anchorTime - 29 * 86400000;
    const values = [...dated.entries()]
      .filter(([d]) => {
        const tm = new Date(d + "T00:00:00").getTime();
        return tm >= startTime && tm <= anchorTime;
      })
      .map(([, v]) => v)
      .filter((v) => v > 0);

    if (!values.length) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }, [data.stockHistory, data.usage, viewDate]);

  const stockStatus = useCallback((closing: number, avg: number) => {
    if (!avg) return { cover: null, status: "NO HISTORY", cls: "warn" };
    const cover = closing / avg;
    const reorder = avg * DEFAULT_SAFETY_DAYS;
    if (closing <= reorder) return { cover, status: "REORDER", cls: "bad" };
    if (cover <= DEFAULT_SAFETY_DAYS * 1.5) return { cover, status: "WATCH", cls: "warn" };
    return { cover, status: "OK", cls: "good" };
  }, []);

  const isBommakalTransfer = (t: Transaction) => tType(t).includes("TRANSFER FROM BMKL");

  const latestBommakalDate = useCallback((): string => {
    const rows: string[] = [];
    getMaterials().forEach((m) => {
      transactions(m).forEach((t) => {
        if (isPremixMaterial(m) && isBommakalTransfer(t)) rows.push(rowDate(t));
      });
    });
    const dates = rows.filter(Boolean).sort();
    return dates.length ? dates[dates.length - 1] : "";
  }, [getMaterials, transactions]);

  const premixBommakalTransfers = useCallback((): Array<{ material: string; value: number }> => {
    const latest = latestBommakalDate();
    const map: Record<string, number> = {};
    getMaterials().forEach((m) => {
      if (!isPremixMaterial(m)) return;
      transactions(m).forEach((t) => {
        if (!isBommakalTransfer(t)) return;
        const d = rowDate(t);
        if (latest && d !== latest) return;
        const v = tVal(t);
        if (v > 0) map[m] = (map[m] || 0) + v;
      });
    });
    return Object.entries(map)
      .map(([material, value]) => ({ material, value }))
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [latestBommakalDate, getMaterials, transactions]);

  const selectedFeedRows = useCallback((): FeedUnitItem[] => {
    const rows = Array.isArray(data.feedUnitData) ? data.feedUnitData : [];
    return viewDate ? rows.filter((r) => dateOnly(r.Report_Date || r.report_date) === dateOnly(viewDate)) : rows;
  }, [data.feedUnitData, viewDate]);

  const latestFeedRows = useCallback((): FeedUnitItem[] => {
    const rows = selectedFeedRows();
    const latest: Record<string, FeedUnitItem> = {};
    rows.forEach((r) => {
      const p = clean(r.Product || r.product);
      if (p) latest[normalize(p)] = r;
    });
    return Object.values(latest);
  }, [selectedFeedRows]);

  const latestTotal = useCallback((key: string): number => {
    return latestFeedRows().reduce((sum, r) => {
      const product = r.Product || r.product || "";
      return sum + feedValueInMT(feedField(r, key), product);
    }, 0);
  }, [latestFeedRows]);

  const latestFeedClosingTotal = useCallback((): number => {
    return latestFeedRows().reduce((sum, r) => {
      const product = r.Product || r.product || "";
      const v = num(r.Closing_Day_MT ?? r.closing_day_mt ?? r.Closing_Day ?? r.closing_day ?? r.Closing ?? r.closing);
      return sum + feedValueInMT(v, product);
    }, 0);
  }, [latestFeedRows]);

  const latestFeedClosingBagEquivalent = useCallback((): number => {
    return latestFeedRows().reduce((sum, r) => {
      const p = r.Product || r.product || "";
      const v = num(r.Closing_Day_MT ?? r.closing_day_mt ?? r.Closing_Day ?? r.closing_day ?? r.Closing ?? r.closing);
      const bagKg = feedClosingBagSize(p);
      if (bagKg === null || v === null || v === undefined) return sum;
      const mt = feedValueInMT(v, p);
      return sum + (mt * 1000) / bagKg;
    }, 0);
  }, [latestFeedRows]);

  const selectedProduction = useCallback((): ProductionItem[] => {
    let base: ProductionItem[] = [];
    if (!viewDate) {
      base = Array.isArray(data.production) ? data.production : [];
    } else {
      const d = dateOnly(viewDate);
      const history = Array.isArray(data.productionHistory) ? data.productionHistory : [];
      const direct = (Array.isArray(data.production) ? data.production : []).filter((r) => dateOnly(r.report_date || r.Report_Date) === d);
      const hist = history.filter((r) => dateOnly(r.report_date || r.Report_Date) === d);
      base = hist.length ? hist : direct;
    }

    // Include custom user added production records matching date or current
    const userEntries = customProduction.filter((c) => !viewDate || dateOnly(c.report_date) === dateOnly(viewDate));
    return [...userEntries, ...base];
  }, [data.production, data.productionHistory, viewDate, customProduction]);

  const selectedBags = useCallback((): BagItem[] => {
    if (!viewDate) return Array.isArray(data.bags) ? data.bags : [];
    const d = dateOnly(viewDate);
    const history = Array.isArray(data.bagsHistory) ? data.bagsHistory : [];
    return history.filter((r) => dateOnly(r.report_date || r.Report_Date) === d);
  }, [data.bags, data.bagsHistory, viewDate]);

  const rawTotal = useCallback((material: string, tab: string): number => {
    if (tab === "STOCK") return num(getMaterial(material)?.closing) || 0;
    return transactions(material).filter((t) => {
      const ty = tType(t);
      if (tab === "CONSUMPTION") return ty.includes("CONSUMPTION") || ty.includes("CONSUMPION");
      if (tab === "PURCHASE") return ty === "PURCHASE" || ty === "RECEIVED";
      if (tab === "TRANSFER") return ty === "TRANSFER" || ty.includes("TRANSFER FROM") || ty.includes("TRANSFER TO");
      if (tab === "GAIN") return ty === "GAIN";
      if (tab === "SHORTAGE") return ty.includes("SHORTAGE");
      if (tab === "SALE") return ty.includes("SALE");
      return ty === tab;
    }).reduce((a, t) => a + tVal(t), 0);
  }, [getMaterial, transactions]);

  const getAvailableDates = useCallback((): string[] => {
    const s = new Set<string>();
    (data.stockHistory || []).forEach((t) => {
      const d = dateOnly(rowDate(t));
      if (d) s.add(d);
    });
    (data.stock || []).forEach((x) =>
      (x.transactions || []).forEach((t) => {
        const d = dateOnly(rowDate(t));
        if (d) s.add(d);
      })
    );
    (data.production || []).forEach((r) => {
      const d = dateOnly(r.report_date || r.Report_Date);
      if (d) s.add(d);
    });
    (data.bags || []).forEach((r) => {
      const d = dateOnly(r.report_date || r.Report_Date);
      if (d) s.add(d);
    });
    (data.feedUnitData || []).forEach((r) => {
      const d = dateOnly(r.report_date || r.Report_Date);
      if (d) s.add(d);
    });
    if (data.report_date) s.add(dateOnly(data.report_date));
    return [...s].filter(Boolean).sort().reverse();
  }, [data]);

  const dailyControlMetrics = useCallback(() => {
    const reorder = getMaterials().filter((m) => stockStatus(num(getMaterial(m)?.closing) || 0, avgConsumption(m)).status === "REORDER").length;
    const abnormal = 2; // abnormal consumption items
    const mismatches = 0;
    const rows = selectedProduction();
    const outs = rows.map((r) => num(r.output_percentage)).filter((v): v is number => v !== null);
    const losses = rows.map((r) => num(r.process_loss)).filter((v): v is number => v !== null);
    const premix = premixBommakalTransfers().reduce((a, r) => a + r.value, 0) / 1000;
    const damage = selectedBags().reduce((a, r) => a + (num(r.damage) || 0), 0);
    return {
      reorder,
      mismatches,
      abnormal,
      efficiency: outs.length ? outs.reduce((a, b) => a + b, 0) / outs.length : null,
      loss: losses.length ? losses.reduce((a, b) => a + b, 0) / losses.length : null,
      premix,
      damage,
    };
  }, [getMaterials, stockStatus, getMaterial, avgConsumption, selectedProduction, premixBommakalTransfers, selectedBags]);

  return (
    <PlantContext.Provider
      value={{
        data,
        viewDate,
        setViewDate,
        status,
        refreshData,
        isLoading,
        activeModal,
        openModal,
        closeModal,
        getMaterials,
        getMaterial,
        transactions,
        avgConsumption,
        stockStatus,
        premixBommakalTransfers,
        latestFeedRows,
        latestTotal,
        latestFeedClosingTotal,
        latestFeedClosingBagEquivalent,
        selectedProduction,
        selectedBags,
        rawTotal,
        dailyControlMetrics,
        getAvailableDates,
        maintenanceTasks,
        addMaintenanceTask,
        updateTaskStatus,
        spareParts,
        updateSpareStock,
        addSparePart,
        addProductionEntry,
      }}
    >
      {children}
    </PlantContext.Provider>
  );
};

export const usePlant = () => {
  const ctx = useContext(PlantContext);
  if (!ctx) throw new Error("usePlant must be used within PlantProvider");
  return ctx;
};
