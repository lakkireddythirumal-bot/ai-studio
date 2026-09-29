import React, { useState } from 'react';
import { usePlant, fmt } from '../context/PlantContext';
import { SparePart } from '../types/plant';
import {
  Cog,
  AlertOctagon,
  Boxes,
  PlusCircle,
  Search,
  CheckCircle,
  ArrowUpDown,
  DollarSign,
  Plus,
  Minus
} from 'lucide-react';

export const SparePartsPage: React.FC = () => {
  const { spareParts, updateSpareStock, addSparePart } = usePlant();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState<'ALL' | 'CRITICAL' | 'NORMAL'>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [code, setCode] = useState('SCR-HM-30');
  const [name, setName] = useState('Perforated Screen 3.0mm (Hammer Mill)');
  const [equipment, setEquipment] = useState('Hammer Mill #1 & #2');
  const [currentStock, setCurrentStock] = useState('4');
  const [unit, setUnit] = useState('Nos');
  const [minStock, setMinStock] = useState('2');
  const [maxStock, setMaxStock] = useState('8');
  const [unitPriceINR, setUnitPriceINR] = useState('8500');
  const [binLocation, setBinLocation] = useState('Bay-B / Rack-04');
  const [supplier, setSupplier] = useState('Standard Perforators Ltd');
  const [leadTimeDays, setLeadTimeDays] = useState('7');
  const [category, setCategory] = useState<SparePart['category']>('Hammers & Screens');

  const filteredParts = spareParts.filter((p) => {
    const matchesQuery =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.equipment.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCat === 'ALL' || p.category === selectedCat;
    const isCritical = p.currentStock <= p.minStock;
    const matchesStatus =
      stockStatusFilter === 'ALL' ||
      (stockStatusFilter === 'CRITICAL' && isCritical) ||
      (stockStatusFilter === 'NORMAL' && !isCritical);

    return matchesQuery && matchesCat && matchesStatus;
  });

  const totalPartsCount = spareParts.reduce((sum, p) => sum + p.currentStock, 0);
  const criticalCount = spareParts.filter((p) => p.currentStock <= p.minStock).length;
  const totalValuation = spareParts.reduce((sum, p) => sum + p.currentStock * p.unitPriceINR, 0);

  const handleCreateSpare = (e: React.FormEvent) => {
    e.preventDefault();
    addSparePart({
      code,
      name,
      equipment,
      currentStock: Number(currentStock) || 0,
      unit,
      minStock: Number(minStock) || 1,
      maxStock: Number(maxStock) || 5,
      unitPriceINR: Number(unitPriceINR) || 0,
      binLocation,
      supplier,
      leadTimeDays: Number(leadTimeDays) || 7,
      category,
    });
    setShowAddModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-blue-50 text-blue-700 rounded-xl text-xl">🔧</span>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Spare Parts &amp; Consumables Inventory
            </h1>
            <p className="text-xs text-slate-500">
              Pellet mill dies &amp; roller shells, hammer beaters, perforated screens, SKF bearings &amp; belts
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Spare Part Item</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Spares in Stock</span>
            <Boxes className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 tabular-nums">
            {totalPartsCount} <span className="text-xs font-bold text-slate-500">Units</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{spareParts.length} distinct catalog items</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Critical Min Stock Alerts</span>
            <AlertOctagon className="w-4 h-4 text-red-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-red-700 tabular-nums">
            {criticalCount} <span className="text-xs font-bold text-red-600">Items</span>
          </div>
          <div className="text-[11px] text-red-600 mt-1 font-semibold">
            Stock at or below reorder point
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Inventory Valuation</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 tabular-nums">
            ₹ {fmt(totalValuation)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Capital spare value in store</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Spares Categories</span>
            <Cog className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-purple-700 tabular-nums">
            6 <span className="text-xs font-bold text-purple-600">Categories</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Dies, Hammers, Bearings, Belts</div>
        </div>
      </div>

      {/* Main Spares Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'ALL', label: 'All Spares' },
              { id: 'Dies & Rollers', label: 'Dies & Rollers' },
              { id: 'Hammers & Screens', label: 'Hammers & Screens' },
              { id: 'Bearings & Seals', label: 'Bearings & Seals' },
              { id: 'Belts & Chains', label: 'Belts & Chains' },
              { id: 'Sensors & Electrical', label: 'Sensors & Needles' },
            ].map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCat(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCat === c.id
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
                placeholder="Search spare name, code..."
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 w-44 sm:w-56"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>

            <select
              value={stockStatusFilter}
              onChange={(e) => setStockStatusFilter(e.target.value as typeof stockStatusFilter)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-semibold text-slate-700 outline-none"
            >
              <option value="ALL">All Stock</option>
              <option value="CRITICAL">🔴 Low Stock</option>
              <option value="NORMAL">🟢 Sufficient</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
              <tr>
                <th className="py-3 px-4">Part Code &amp; Name</th>
                <th className="py-3 px-4">Equipment &amp; Bin</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Min / Max</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-center">Current Stock</th>
                <th className="py-3 px-4 text-center">Adjust Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredParts.map((p) => {
                const isCritical = p.currentStock <= p.minStock;
                return (
                  <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${isCritical ? 'bg-red-50/20' : ''}`}>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[10px] text-blue-600 font-bold block">{p.code}</span>
                      <strong className="text-slate-900 font-bold text-xs">{p.name}</strong>
                      <span className="text-[10px] text-slate-500 block">Supplier: {p.supplier} • Lead: {p.leadTimeDays}d</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{p.equipment}</div>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                        {p.binLocation}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {p.minStock} / {p.maxStock} {p.unit}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-900 font-bold">
                      ₹ {fmt(p.unitPriceINR)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <strong className={`text-sm font-black tabular-nums ${isCritical ? 'text-red-600' : 'text-slate-900'}`}>
                          {p.currentStock} {p.unit}
                        </strong>
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                            isCritical ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isCritical ? 'REORDER' : 'OK'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
                        <button
                          onClick={() => updateSpareStock(p.id, -1)}
                          disabled={p.currentStock <= 0}
                          title="Issue 1 part (consume)"
                          className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-mono font-bold text-slate-700 border-x border-slate-200">
                          {p.currentStock}
                        </span>
                        <button
                          onClick={() => updateSpareStock(p.id, 1)}
                          title="Receive 1 part (replenish)"
                          className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!filteredParts.length && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No spare parts found matching the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Spare Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <span>🔧</span> Add Spare Part to Catalog
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateSpare} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Part Code</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as typeof category)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  >
                    <option value="Dies & Rollers">Dies &amp; Rollers</option>
                    <option value="Hammers & Screens">Hammers &amp; Screens</option>
                    <option value="Bearings & Seals">Bearings &amp; Seals</option>
                    <option value="Belts & Chains">Belts &amp; Chains</option>
                    <option value="Motors & Drives">Motors &amp; Drives</option>
                    <option value="Sensors & Electrical">Sensors &amp; Electrical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Spare Part Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Equipment</label>
                  <input
                    type="text"
                    value={equipment}
                    onChange={(e) => setEquipment(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bin Location</label>
                  <input
                    type="text"
                    value={binLocation}
                    onChange={(e) => setBinLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Current Stock</label>
                  <input
                    type="number"
                    value={currentStock}
                    onChange={(e) => setCurrentStock(e.target.value)}
                    required
                    className="w-full px-2 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Min Level</label>
                  <input
                    type="number"
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value)}
                    required
                    className="w-full px-2 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit Price (₹)</label>
                  <input
                    type="number"
                    value={unitPriceINR}
                    onChange={(e) => setUnitPriceINR(e.target.value)}
                    required
                    className="w-full px-2 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
