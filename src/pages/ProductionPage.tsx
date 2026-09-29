import React, { useState } from 'react';
import { usePlant, fmt, fmtBags, num } from '../context/PlantContext';
import {
  Factory,
  PlusCircle,
  TrendingUp,
  AlertTriangle,
  Clock,
  Gauge,
  CheckCircle2,
  Download,
  Filter,
  Layers
} from 'lucide-react';

export const ProductionPage: React.FC = () => {
  const { selectedProduction, addProductionEntry, viewDate, data } = usePlant();
  const [filterQuery, setFilterQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New batch form state
  const [newProduct, setNewProduct] = useState('BROILER PRE-STARTER CRUMBLES');
  const [newShift, setNewShift] = useState('Shift A (06:00 - 14:00)');
  const [newStandardBags, setNewStandardBags] = useState('1600');
  const [newActualBags, setNewActualBags] = useState('1580');
  const [newOutputPct, setNewOutputPct] = useState('98.75');
  const [newLossPct, setNewLossPct] = useState('1.25');
  const [newRemarks, setNewRemarks] = useState('70 KG Bags • Smooth pelleting');

  const prodList = selectedProduction();

  // Deduplicate products
  const uniqueProdMap = new Map<string, typeof prodList[0]>();
  prodList.forEach((r) => {
    const p = (r.product || r.Product || '').trim();
    if (!p) return;
    const k = p.toUpperCase();
    const actual = num(r.actual_output) || 0;
    const existing = uniqueProdMap.get(k);
    if (!existing || actual > (num(existing.actual_output) || 0)) {
      uniqueProdMap.set(k, { ...r, product: p });
    }
  });

  const products = [...uniqueProdMap.values()].filter((r) =>
    r.product.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const totalBags = products.reduce((a, b) => a + (num(b.actual_output) || 0), 0);
  const totalStandard = products.reduce((a, b) => a + (num(b.standard_output) || 0), 0);
  const avgEfficiency =
    products.length > 0
      ? products.reduce((a, b) => a + (num(b.output_percentage) || 98.5), 0) / products.length
      : 98.5;
  const avgLoss =
    products.length > 0
      ? products.reduce((a, b) => a + (num(b.process_loss) || 1.2), 0) / products.length
      : 1.2;

  // Approx MT (average 70kg bag)
  const estMT = (totalBags * 70) / 1000;

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    addProductionEntry({
      product: newProduct,
      standard_output: Number(newStandardBags) || 0,
      actual_output: Number(newActualBags) || 0,
      output_percentage: Number(newOutputPct) || 98.5,
      process_loss: Number(newLossPct) || 1.2,
      remarks: `${newShift} • ${newRemarks}`,
      report_date: viewDate || data.report_date || new Date().toISOString().slice(0, 10),
    });
    setShowAddModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 text-blue-700 rounded-xl text-lg">🏭</span>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Production Management
              </h1>
              <p className="text-xs text-slate-500">
                Pellet mills, batching accuracy, standard vs actual outputs &amp; process loss
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Log Batch Run</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Actual Output</span>
            <Factory className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 tabular-nums">
            {fmtBags(totalBags)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>≈ {fmt(estMT)} MT total weight</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Standard Target</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 tabular-nums">
            {fmtBags(totalStandard)}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>
              {totalStandard > 0 ? `${fmt((totalBags / totalStandard) * 100)}% Target Achieved` : 'Target met'}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Avg Output %</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700 tabular-nums">
            {fmt(avgEfficiency)} %
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Standard benchmark: ≥ 98.0%
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Process Loss %</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-700 tabular-nums">
            {fmt(avgLoss)} %
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Allowable steam/dust limit: &lt; 1.5%
          </div>
        </div>
      </div>

      {/* Pellet Mill Real-time Instrumentation Readings */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold tracking-wide uppercase text-slate-200">
              Pellet Mill &amp; Boiler Operational Status
            </h2>
          </div>
          <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
            All Lines Running
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <span className="text-[10px] text-slate-400 block font-semibold">Steam Header Pressure</span>
            <strong className="text-lg text-emerald-400 font-mono">8.4 Bar</strong>
            <small className="text-[9px] text-slate-400 block">Dry saturated steam</small>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <span className="text-[10px] text-slate-400 block font-semibold">Conditioner Temp</span>
            <strong className="text-lg text-emerald-400 font-mono">84.5 °C</strong>
            <small className="text-[9px] text-slate-400 block">Starch gelatinization range</small>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <span className="text-[10px] text-slate-400 block font-semibold">PM #1 Main Motor Load</span>
            <strong className="text-lg text-blue-400 font-mono">215 Amps</strong>
            <small className="text-[9px] text-slate-400 block">86% rated capacity</small>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <span className="text-[10px] text-slate-400 block font-semibold">Pellet Cooler Temp</span>
            <strong className="text-lg text-cyan-400 font-mono">32.0 °C</strong>
            <small className="text-[9px] text-slate-400 block">Within +5°C of ambient</small>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="font-extrabold text-slate-900 text-sm sm:text-base">
              Product-Wise Production Runs ({products.length} Products)
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter product name..."
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 w-44 sm:w-56"
              />
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
              <tr>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4 text-right">Actual Output</th>
                <th className="py-3 px-4 text-right">Standard Output</th>
                <th className="py-3 px-4 text-right">Efficiency %</th>
                <th className="py-3 px-4 text-right">Process Loss</th>
                <th className="py-3 px-4">Packing Specification / Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((r, i) => {
                const op = num(r.output_percentage);
                const loss = num(r.process_loss);
                const isGood = op !== null && op >= 98;
                return (
                  <tr key={i} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {r.product}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-blue-700 tabular-nums">
                      {fmtBags(r.actual_output)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600 tabular-nums">
                      {fmtBags(r.standard_output)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold tabular-nums">
                      <span className={`px-2 py-0.5 rounded-md ${isGood ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {op !== null ? `${fmt(op)} %` : '--'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-700 tabular-nums">
                      {loss !== null ? `${fmt(loss)} %` : '--'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium">
                        {r.remarks || '70 KG Bags'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {!products.length && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No production records match the query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Batch Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <span>➕</span> Log New Production Batch
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Name</label>
                <select
                  value={newProduct}
                  onChange={(e) => setNewProduct(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option value="BROILER PRE-STARTER CRUMBLES">BROILER PRE-STARTER CRUMBLES</option>
                  <option value="BROILER STARTER PELLETS">BROILER STARTER PELLETS</option>
                  <option value="BROILER FINISHER PELLETS">BROILER FINISHER PELLETS</option>
                  <option value="FC30 CRUMBLES (60 KG)">FC30 CRUMBLES (60 KG)</option>
                  <option value="LAYER CHICK MASH">LAYER CHICK MASH</option>
                  <option value="LAYER GROWER MASH">LAYER GROWER MASH</option>
                  <option value="LAYER PHASE-1 MASH">LAYER PHASE-1 MASH</option>
                  <option value="LAYER PHASE-2 MASH">LAYER PHASE-2 MASH</option>
                  <option value="BREEDER MASH (PLM)">BREEDER MASH (PLM)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Operating Shift</label>
                <select
                  value={newShift}
                  onChange={(e) => setNewShift(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option value="Shift A (06:00 - 14:00)">Shift A (06:00 - 14:00)</option>
                  <option value="Shift B (14:00 - 22:00)">Shift B (14:00 - 22:00)</option>
                  <option value="Shift C (22:00 - 06:00)">Shift C (22:00 - 06:00)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Standard Output (Bags)</label>
                  <input
                    type="number"
                    value={newStandardBags}
                    onChange={(e) => setNewStandardBags(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Actual Output (Bags)</label>
                  <input
                    type="number"
                    value={newActualBags}
                    onChange={(e) => setNewActualBags(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Output %</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newOutputPct}
                    onChange={(e) => setNewOutputPct(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Process Loss %</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newLossPct}
                    onChange={(e) => setNewLossPct(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Remarks &amp; Bag Spec</label>
                <input
                  type="text"
                  value={newRemarks}
                  onChange={(e) => setNewRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  placeholder="e.g. 70 KG bags, steam temperature 85°C"
                />
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
                  Save Batch Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
