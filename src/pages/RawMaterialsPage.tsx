import React, { useState, useMemo } from 'react';
import { usePlant, fmt, num, isPremixMaterial, DEFAULT_SAFETY_DAYS } from '../context/PlantContext';
import {
  Boxes,
  Search,
  Filter,
  AlertOctagon,
  TrendingDown,
  Truck,
  CheckCircle,
  FileText
} from 'lucide-react';

export const RawMaterialsPage: React.FC = () => {
  const { getMaterials, getMaterial, transactions, avgConsumption, stockStatus, rawTotal } = usePlant();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'GRAINS' | 'PROTEIN' | 'MINERALS' | 'OILS'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'REORDER' | 'WATCH' | 'OK'>('ALL');
  const [activeTab, setActiveTab] = useState<'INVENTORY' | 'INBOUND' | 'RECONCILIATION'>('INVENTORY');

  // Filter raw materials (excluding premixes from this view since Premix has its own dedicated page)
  const allMaterials = getMaterials().filter((m) => !isPremixMaterial(m));

  const categorize = (name: string): 'GRAINS' | 'PROTEIN' | 'MINERALS' | 'OILS' => {
    const s = name.toUpperCase();
    if (s.includes('MAIZE') || s.includes('RICE') || s.includes('BAJRA') || s.includes('WHEAT') || s.includes('DORB') || s.includes('GRAIN')) {
      return 'GRAINS';
    }
    if (s.includes('SOYA') || s.includes('DOC') || s.includes('MEAL') || s.includes('MUSTARD') || s.includes('RAPESEED') || s.includes('FISH')) {
      return 'PROTEIN';
    }
    if (s.includes('OIL') || s.includes('FAT') || s.includes('MOLASSES') || s.includes('LECITHIN')) {
      return 'OILS';
    }
    return 'MINERALS';
  };

  const processedMaterials = useMemo(() => {
    return allMaterials
      .map((m) => {
        const x = getMaterial(m);
        const closing = num(x?.closing) || 0;
        const avg = avgConsumption(m);
        const status = stockStatus(closing, avg);
        const reorderLevel = avg * DEFAULT_SAFETY_DAYS;
        const category = categorize(m);
        const received = rawTotal(m, 'PURCHASE');
        const consumption = rawTotal(m, 'CONSUMPTION');
        return {
          name: m,
          closing,
          unit: x?.unit || 'MT',
          avg,
          status,
          reorderLevel,
          category,
          received,
          consumption,
        };
      })
      .filter((item) => {
        const matchesQuery = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCat = selectedCategory === 'ALL' || item.category === selectedCategory;
        const matchesStatus = statusFilter === 'ALL' || item.status.status === statusFilter;
        return matchesQuery && matchesCat && matchesStatus;
      })
      .sort((a, b) => {
        // Sort reorder items first, then by closing stock
        const scoreA = a.status.status === 'REORDER' ? 2 : a.status.status === 'WATCH' ? 1 : 0;
        const scoreB = b.status.status === 'REORDER' ? 2 : b.status.status === 'WATCH' ? 1 : 0;
        return scoreB - scoreA || b.closing - a.closing;
      });
  }, [allMaterials, getMaterial, avgConsumption, stockStatus, rawTotal, searchQuery, selectedCategory, statusFilter]);

  const totalStockMT = allMaterials.reduce((sum, m) => sum + (num(getMaterial(m)?.closing) || 0), 0);
  const reorderCount = allMaterials.filter((m) => stockStatus(num(getMaterial(m)?.closing) || 0, avgConsumption(m)).status === 'REORDER').length;
  const watchCount = allMaterials.filter((m) => stockStatus(num(getMaterial(m)?.closing) || 0, avgConsumption(m)).status === 'WATCH').length;
  const totalReceivedMT = allMaterials.reduce((sum, m) => sum + rawTotal(m, 'PURCHASE'), 0);
  const totalConsumedMT = allMaterials.reduce((sum, m) => sum + rawTotal(m, 'CONSUMPTION'), 0);

  // Inbound QC gate records
  const inboundShipments = [
    {
      id: 'GRN-8492',
      date: 'Today',
      truck: 'TS 09 UB 4821',
      material: 'YELLOW MAIZE (SILO #2)',
      vendor: 'Telangana Agri Grain Corp',
      grossNetMT: 32.4,
      moisturePct: 12.1,
      fungusAflatoxin: 'Negative (<10 ppb)',
      qcStatus: 'Approved & Unloaded',
    },
    {
      id: 'GRN-8493',
      date: 'Today',
      truck: 'AP 16 TE 9043',
      material: 'SOYA DE-OILED CAKE (46% PRO)',
      vendor: 'Ruchi Soya Industries Ltd',
      grossNetMT: 28.6,
      moisturePct: 10.4,
      fungusAflatoxin: 'Approved (Protein 46.2%)',
      qcStatus: 'Approved & Unloaded',
    },
    {
      id: 'GRN-8494',
      date: 'Yesterday',
      truck: 'MH 12 QX 3381',
      material: 'CALCITE POWDER (GRIT-FREE)',
      vendor: 'Deccan Minerals Kadapa',
      grossNetMT: 35.0,
      moisturePct: 1.2,
      fungusAflatoxin: 'Calcium 38.5%',
      qcStatus: 'Approved & Unloaded',
    },
    {
      id: 'GRN-8495',
      date: 'Yesterday',
      truck: 'TS 04 EC 1190',
      material: 'MUSTARD DOC (RAPESEED)',
      vendor: 'Kota Oil Mills Rajasthan',
      grossNetMT: 24.8,
      moisturePct: 9.8,
      fungusAflatoxin: 'Glucosinolates Normal',
      qcStatus: 'Approved & Unloaded',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-amber-50 text-amber-700 rounded-xl text-xl">📦</span>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Raw Materials &amp; Silo Inventory
            </h1>
            <p className="text-xs text-slate-500">
              Bulk grain silos, protein cakes, mineral supplements, safety coverage &amp; reorder points
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('INVENTORY')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'INVENTORY' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              Inventory ({allMaterials.length})
            </button>
            <button
              onClick={() => setActiveTab('INBOUND')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'INBOUND' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              Weighbridge &amp; QC
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total RM Stock</span>
            <Boxes className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 tabular-nums">
            {fmt(totalStockMT)} <span className="text-xs font-bold text-slate-500">MT</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Across 12 Silos &amp; Warehouses</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Critical Reorder</span>
            <AlertOctagon className="w-4 h-4 text-red-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-red-700 tabular-nums">
            {reorderCount} <span className="text-xs font-bold text-red-600">Materials</span>
          </div>
          <div className="text-[11px] text-red-600 mt-1 font-semibold">Action required: stock &le; 7 days</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Watch List</span>
            <TrendingDown className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-700 tabular-nums">
            {watchCount} <span className="text-xs font-bold text-amber-600">Materials</span>
          </div>
          <div className="text-[11px] text-amber-600 mt-1">Stock coverage &lt; 10 days</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Day Inbound</span>
            <Truck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700 tabular-nums">
            {fmt(totalReceivedMT)} <span className="text-xs font-bold text-emerald-600">MT</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Received &amp; weighed</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Day Consumption</span>
            <FileText className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-indigo-700 tabular-nums">
            {fmt(totalConsumedMT)} <span className="text-xs font-bold text-indigo-600">MT</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Batching &amp; extrusion use</div>
        </div>
      </div>

      {activeTab === 'INVENTORY' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Filters Bar */}
          <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {[
                { id: 'ALL', label: 'All Raw Materials' },
                { id: 'GRAINS', label: 'Grains & Cereals' },
                { id: 'PROTEIN', label: 'Protein Meals (DOC)' },
                { id: 'MINERALS', label: 'Minerals & Calcite' },
                { id: 'OILS', label: 'Liquids & Oils' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id as typeof selectedCategory)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedCategory === c.id
                      ? 'bg-slate-900 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search material..."
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 w-40 sm:w-52"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-semibold text-slate-700 outline-none"
              >
                <option value="ALL">All Status</option>
                <option value="REORDER">🔴 Reorder Only</option>
                <option value="WATCH">🟡 Watch Only</option>
                <option value="OK">🟢 Normal</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Material Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Current Stock</th>
                  <th className="py-3 px-4 text-right">Avg Consumption</th>
                  <th className="py-3 px-4 text-right">Stock Coverage</th>
                  <th className="py-3 px-4 text-right">Reorder Threshold</th>
                  <th className="py-3 px-4 text-center">Reorder Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {processedMaterials.map((item, idx) => {
                  const s = item.status;
                  const isReorder = s.status === 'REORDER';
                  const isWatch = s.status === 'WATCH';
                  return (
                    <tr key={idx} className={`hover:bg-blue-50/40 transition-colors ${isReorder ? 'bg-red-50/20' : ''}`}>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-xs sm:text-sm">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Received: {fmt(item.received)} MT • Consumed: {fmt(item.consumption)} MT
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900 tabular-nums">
                        {fmt(item.closing)} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600 tabular-nums">
                        {item.avg ? `${fmt(item.avg)} ${item.unit}/day` : '--'}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold tabular-nums">
                        <span className={isReorder ? 'text-red-600' : isWatch ? 'text-amber-600' : 'text-emerald-700'}>
                          {s.cover !== null ? `${fmt(s.cover)} Days` : '--'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500 tabular-nums">
                        {item.reorderLevel ? `${fmt(item.reorderLevel)} MT` : '--'}
                      </td>
                      <td className="py-3 px-4 text-center font-bold">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isReorder
                              ? 'bg-red-100 text-red-700 border border-red-200'
                              : isWatch
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {isReorder ? '🔴 REORDER' : isWatch ? '🟡 WATCH' : '🟢 OK'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {!processedMaterials.length && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No raw materials found matching the search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inbound Weighbridge & Quality Control View */}
      {activeTab === 'INBOUND' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-extrabold text-slate-900 text-sm sm:text-base">
              Weighbridge Gate Receipts &amp; Laboratory Quality Clearance (GRN)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Truck gross/tare weight verified against weighbridge tickets &amp; wet chemistry analysis
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                <tr>
                  <th className="py-3 px-4">GRN #</th>
                  <th className="py-3 px-4">Vehicle Number</th>
                  <th className="py-3 px-4">Material &amp; Silo</th>
                  <th className="py-3 px-4">Supplier / Vendor</th>
                  <th className="py-3 px-4 text-right">Net Weight</th>
                  <th className="py-3 px-4 text-right">Moisture %</th>
                  <th className="py-3 px-4">Lab Analysis</th>
                  <th className="py-3 px-4 text-center">QC Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inboundShipments.map((grn) => (
                  <tr key={grn.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">{grn.id}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{grn.truck}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{grn.material}</td>
                    <td className="py-3 px-4 text-slate-600">{grn.vendor}</td>
                    <td className="py-3 px-4 text-right font-black text-slate-900 tabular-nums">
                      {fmt(grn.grossNetMT)} MT
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-800 tabular-nums">
                      {grn.moisturePct}%
                    </td>
                    <td className="py-3 px-4 text-slate-600">{grn.fungusAflatoxin}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        <span>{grn.qcStatus}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
