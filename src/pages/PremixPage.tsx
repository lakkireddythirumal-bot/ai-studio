import React, { useState } from 'react';
import { usePlant, fmt, num, isPremixMaterial, DEFAULT_SAFETY_DAYS } from '../context/PlantContext';
import {
  FlaskConical,
  Truck,
  Calculator,
  ArrowRight,
  ShieldAlert,
  Scale,
  CheckCircle2,
  Calendar,
  Sparkles
} from 'lucide-react';

export const PremixPage: React.FC = () => {
  const { getMaterials, getMaterial, transactions, avgConsumption, stockStatus, premixBommakalTransfers } = usePlant();

  // Inclusion Calculator state
  const [calcBatchTonnage, setCalcBatchTonnage] = useState('50');
  const [calcInclusionRateKgPerMT, setCalcInclusionRateKgPerMT] = useState('2.5');
  const [calcSelectedPremix, setCalcSelectedPremix] = useState('PREMIX BROILER STARTER');

  // Filter only premix materials
  const premixMaterials = getMaterials().filter((m) => isPremixMaterial(m));

  // Bommakal Transfers
  const bommakalRows = premixBommakalTransfers();
  const totalBommakalKG = bommakalRows.reduce((a, b) => a + b.value, 0);
  const totalBommakalMT = totalBommakalKG / 1000;

  // Processed inventory
  const inventory = premixMaterials.map((m) => {
    const x = getMaterial(m);
    const closingKg = num(x?.closing) || 0;
    const avgKg = avgConsumption(m);
    const status = stockStatus(closingKg, avgKg);
    return {
      name: m,
      closingKg,
      closingMT: closingKg / 1000,
      avgKg,
      status,
      reorderLevelKg: avgKg * DEFAULT_SAFETY_DAYS,
    };
  }).sort((a, b) => b.closingKg - a.closingKg);

  const totalPremixStockKg = inventory.reduce((a, b) => a + b.closingKg, 0);

  // Inclusion calculation
  const batchTonnes = Number(calcBatchTonnage) || 0;
  const rateKg = Number(calcInclusionRateKgPerMT) || 0;
  const requiredKg = batchTonnes * rateKg;
  const currentPremixObj = inventory.find((p) => p.name === calcSelectedPremix);
  const availableKg = currentPremixObj ? currentPremixObj.closingKg : 0;
  const hasSufficient = availableKg >= requiredKg;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-xl">🧪</span>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Premixes &amp; Micro-Ingredients Control
            </h1>
            <p className="text-xs text-slate-500">
              Vitamins, trace minerals, enzymes, amino acids &amp; Bommakal centralized transfer logistics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5" />
            <span>Bommakal Supply Line Active</span>
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Premix Stock</span>
            <FlaskConical className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 tabular-nums">
            {fmt(totalPremixStockKg)} <span className="text-xs font-bold text-slate-500">KG</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            ≈ {fmt(totalPremixStockKg / 1000)} MT in storage
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Bommakal Receipt</span>
            <Truck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-blue-700 tabular-nums">
            {fmt(totalBommakalKG)} <span className="text-xs font-bold text-blue-600">KG</span>
          </div>
          <div className="text-[11px] text-blue-600 font-semibold mt-1">
            {fmt(totalBommakalMT)} MT Transferred
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Active Formulations</span>
            <Scale className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-purple-700 tabular-nums">
            {premixMaterials.length} <span className="text-xs font-bold text-purple-600">Types</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Pre-starter, Starter, Finisher, Layers
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Reorder Attention</span>
            <ShieldAlert className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-700 tabular-nums">
            {inventory.filter((i) => i.status.status === 'REORDER').length}{' '}
            <span className="text-xs font-bold text-amber-600">Reorders</span>
          </div>
          <div className="text-[11px] text-amber-700 font-semibold mt-1">
            Lead time: 48h from Bommakal
          </div>
        </div>
      </div>

      {/* Bommakal Transfer Strip & Inclusion Calculator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Bommakal Receipts & Inventory */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Bommakal Transfers Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span>🚛</span> Bommakal Transfer Deliveries
                </h2>
                <p className="text-xs text-slate-500">
                  Transferred from Bommakal Micro-Nutrient blending center
                </p>
              </div>
              <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                Total: {fmt(totalBommakalMT)} MT
              </span>
            </div>

            <div className="space-y-2">
              {bommakalRows.map((r) => (
                <div
                  key={r.material}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/40 border border-slate-200/60 transition-colors"
                >
                  <div>
                    <span className="font-bold text-xs sm:text-sm text-slate-900 block">
                      {r.material}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Standard bag packaging (25 KG sealed drums/polybags)
                    </span>
                  </div>
                  <div className="text-right">
                    <strong className="text-sm sm:text-base font-extrabold text-emerald-700 block tabular-nums">
                      {fmt(r.value)} KG
                    </strong>
                    <small className="text-[10px] text-slate-500">
                      ≈ {fmt(r.value / 1000)} MT
                    </small>
                  </div>
                </div>
              ))}
              {!bommakalRows.length && (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No premix transfer movements recorded for this date.
                </div>
              )}
            </div>
          </div>

          {/* Premix Inventory Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-extrabold text-slate-900 text-sm sm:text-base">
                Premix Warehouse Stock &amp; Coverage
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Premix Formulation</th>
                    <th className="py-3 px-4 text-right">Stock (KG)</th>
                    <th className="py-3 px-4 text-right">Stock (MT)</th>
                    <th className="py-3 px-4 text-right">Daily Consumption</th>
                    <th className="py-3 px-4 text-right">Coverage</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inventory.map((item, idx) => {
                    const isReorder = item.status.status === 'REORDER';
                    return (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {item.name}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-slate-900 tabular-nums">
                          {fmt(item.closingKg)} KG
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600 tabular-nums">
                          {fmt(item.closingMT)} MT
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600 tabular-nums">
                          {item.avgKg ? `${fmt(item.avgKg)} KG/d` : '--'}
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold tabular-nums">
                          {item.status.cover !== null ? `${fmt(item.status.cover)} Days` : '--'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isReorder
                                ? 'bg-red-100 text-red-700'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {item.status.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Batch Inclusion Calculator & QA */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900 text-white rounded-2xl p-5 shadow-sm border border-indigo-950">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-5 h-5 text-indigo-400" />
              <h2 className="font-extrabold text-sm sm:text-base">Batch Dosage Calculator</h2>
            </div>
            <p className="text-xs text-slate-300 mb-4">
              Calculate exact premix addition based on production tonnage and inclusion rate.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Feed Formulation</label>
                <select
                  value={calcSelectedPremix}
                  onChange={(e) => setCalcSelectedPremix(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium outline-none focus:ring-1 focus:ring-indigo-400"
                >
                  {inventory.map((p) => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Planned Batch Size (MT)</label>
                <input
                  type="number"
                  value={calcBatchTonnage}
                  onChange={(e) => setCalcBatchTonnage(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Inclusion Rate (KG per MT of Feed)</label>
                <input
                  type="number"
                  step="0.1"
                  value={calcInclusionRateKgPerMT}
                  onChange={(e) => setCalcInclusionRateKgPerMT(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold outline-none"
                />
              </div>

              {/* Calculation Result */}
              <div className="mt-4 p-4 rounded-xl bg-slate-800/90 border border-slate-700 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Total Premix Required:</span>
                  <strong className="text-emerald-400 text-base font-mono font-extrabold">
                    {fmt(requiredKg)} KG
                  </strong>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Current Stock in Silo:</span>
                  <span className="font-mono text-slate-200">{fmt(availableKg)} KG</span>
                </div>

                <div className="pt-2 border-t border-slate-700 flex justify-between items-center">
                  <span className="text-[11px] text-slate-400">Stock Sufficiency:</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      hasSufficient ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                    }`}
                  >
                    {hasSufficient ? '✓ Sufficient for Batch' : '⚠ Deficit - Request Bommakal'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quality Clearance Info */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Premix Quality Assurance</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every Bommakal transfer lot is sealed with tamper-evident barcodes, assay certificates for Vitamin A (12,000 IU/g), D3 (3,000 IU/g), Vitamin E, and Phytase enzyme activity (5,000 FTU/g).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
