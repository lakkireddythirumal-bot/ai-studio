import React, { useState, useMemo } from 'react';
import { usePlant, fmt, num } from '../context/PlantContext';
import {
  ShoppingBag,
  AlertTriangle,
  PackageCheck,
  RotateCcw,
  CheckCircle2,
  TrendingDown,
  PlusCircle,
  Layers
} from 'lucide-react';

export const PPBagsPage: React.FC = () => {
  const { selectedBags } = usePlant();
  const [filterSearch, setFilterSearch] = useState('');
  const [showRequisitionModal, setShowRequisitionModal] = useState(false);
  const [reqProduct, setReqProduct] = useState('BROILER FINISHER (70 KG BAGS)');
  const [reqQuantity, setReqQuantity] = useState('10000');
  const [reqUrgency, setReqUrgency] = useState('Standard (5 Days)');
  const [submittedReqs, setSubmittedReqs] = useState<Array<{ id: string; product: string; qty: number; urgency: string; date: string }>>([
    {
      id: 'REQ-BAG-1021',
      product: 'BROILER PRE-STARTER (50 KG)',
      qty: 15000,
      urgency: 'Immediate (2 Days)',
      date: '2026-09-28',
    },
    {
      id: 'REQ-BAG-1022',
      product: 'FC30 CRUMBLES (60 KG)',
      qty: 8000,
      urgency: 'Standard (5 Days)',
      date: '2026-09-25',
    },
  ]);

  const bagRows = selectedBags();

  // Deduplicate bag types
  const uniqueBags = useMemo(() => {
    const seen = new Set<string>();
    return bagRows.filter((r) => {
      const k = (r.product || 'PP Bags').toUpperCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }).sort((a, b) => (num(b.closing) || 0) - (num(a.closing) || 0));
  }, [bagRows]);

  const filteredBags = uniqueBags.filter((b) =>
    (b.product || '').toLowerCase().includes(filterSearch.toLowerCase())
  );

  const totalClosing = uniqueBags.reduce((a, b) => a + (num(b.closing) || 0), 0);
  const totalReceived = uniqueBags.reduce((a, b) => a + (num(b.received) || 0), 0);
  const totalIssued = uniqueBags.reduce((a, b) => a + (num(b.issue) || 0), 0);
  const totalDamaged = uniqueBags.reduce((a, b) => a + (num(b.damage) || 0), 0);
  const damageRate = totalIssued > 0 ? (totalDamaged / totalIssued) * 100 : 0;

  // Estimated packing capacity in MT assuming average 70kg bag
  const packingCapacityMT = (totalClosing * 70) / 1000;

  const handleCreateRequisition = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedReqs((prev) => [
      {
        id: `REQ-BAG-${Date.now().toString().slice(-4)}`,
        product: reqProduct,
        qty: Number(reqQuantity) || 5000,
        urgency: reqUrgency,
        date: new Date().toISOString().slice(0, 10),
      },
      ...prev,
    ]);
    setShowRequisitionModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-blue-50 text-blue-700 rounded-xl text-xl">🛍</span>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              PP Woven Bags &amp; Packaging Inventory
            </h1>
            <p className="text-xs text-slate-500">
              Polypropylene printed sacks (50 KG, 60 KG, 70 KG, 75 KG), packing line issues &amp; damage control
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowRequisitionModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Bag Requisition</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Bags in Stock</span>
            <ShoppingBag className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 tabular-nums">
            {fmt(totalClosing)} <span className="text-xs font-bold text-slate-500">Bags</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Available across store racks</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Packing Capacity</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-indigo-700 tabular-nums">
            {fmt(packingCapacityMT)} <span className="text-xs font-bold text-indigo-600">MT</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Ready for finished feed packaging</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Issued to Packing</span>
            <PackageCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700 tabular-nums">
            {fmt(totalIssued)} <span className="text-xs font-bold text-emerald-600">Bags</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Transferred to bagging lines</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Damaged / Rejected</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-red-700 tabular-nums">
            {fmt(totalDamaged)} <span className="text-xs font-bold text-red-600">Bags</span>
          </div>
          <div className="text-[11px] text-red-600 mt-1 font-semibold">
            Damage Rate: {fmt(damageRate)} %
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Received from Mills</span>
            <RotateCcw className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-700 tabular-nums">
            {fmt(totalReceived)} <span className="text-xs font-bold text-amber-600">Bags</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Delivered by supplier</div>
        </div>
      </div>

      {/* Main Table: Bag Specification, Stock & Reconciliation */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-extrabold text-slate-900 text-sm sm:text-base">
              PP Bag Type-Wise Reconciliation &amp; Store Balances
            </h2>
            <p className="text-xs text-slate-500">
              Formula: Opening + Received - Issued - Damaged = Calculated Closing
            </p>
          </div>

          <div className="relative">
            <input
              type="text"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="Search bag type..."
              className="pl-3 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 w-48"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
              <tr>
                <th className="py-3 px-4">Bag Product Type</th>
                <th className="py-3 px-4 text-right">Opening</th>
                <th className="py-3 px-4 text-right">Received</th>
                <th className="py-3 px-4 text-right">Issued</th>
                <th className="py-3 px-4 text-right">Damaged</th>
                <th className="py-3 px-4 text-right">Closing Balance</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBags.map((r, i) => {
                const op = num(r.opening) || 0;
                const rec = num(r.received) || 0;
                const iss = num(r.issue) || 0;
                const dmg = num(r.damage) || 0;
                const close = num(r.closing) || 0;
                const calculated = op + rec - iss - dmg;
                const isMatch = Math.abs(close - calculated) <= 1;
                return (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {r.product || 'PP Bags'}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600 tabular-nums">
                      {fmt(op)}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-700 font-semibold tabular-nums">
                      +{fmt(rec)}
                    </td>
                    <td className="py-3 px-4 text-right text-blue-700 font-semibold tabular-nums">
                      -{fmt(iss)}
                    </td>
                    <td className="py-3 px-4 text-right text-red-600 font-bold tabular-nums">
                      {dmg > 0 ? `-${fmt(dmg)}` : '0'}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-slate-900 text-sm tabular-nums">
                      {fmt(close)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isMatch ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isMatch ? '✓ Verified' : '⚠ Discrepancy'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {!filteredBags.length && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No PP bag records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bag Requisitions Queue */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
        <h2 className="font-extrabold text-slate-900 text-sm sm:text-base mb-3">
          Recent Bag Procurement Orders &amp; Indents
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {submittedReqs.map((req) => (
            <div key={req.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] font-bold text-blue-600">{req.id}</span>
                <strong className="block text-xs text-slate-900 font-bold mt-0.5">{req.product}</strong>
                <span className="text-[10px] text-slate-500">Ordered on {req.date} • {req.urgency}</span>
              </div>
              <div className="text-right">
                <strong className="text-sm font-black text-slate-900">{fmt(req.qty)} Bags</strong>
                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded block mt-1 font-semibold">
                  In Production at Mill
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Requisition Modal */}
      {showRequisitionModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <span>🛍</span> Create Bag Indent Requisition
              </h3>
              <button
                onClick={() => setShowRequisitionModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateRequisition} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bag Brand / Formulation</label>
                <select
                  value={reqProduct}
                  onChange={(e) => setReqProduct(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                >
                  <option value="BROILER PRE-STARTER (50 KG)">BROILER PRE-STARTER (50 KG)</option>
                  <option value="BROILER STARTER (70 KG)">BROILER STARTER (70 KG)</option>
                  <option value="BROILER FINISHER (70 KG)">BROILER FINISHER (70 KG)</option>
                  <option value="FC30 CRUMBLES (60 KG)">FC30 CRUMBLES (60 KG)</option>
                  <option value="LAYER CHICK MASH (50 KG)">LAYER CHICK MASH (50 KG)</option>
                  <option value="LAYER PHASE-1 MASH (75 KG)">LAYER PHASE-1 MASH (75 KG)</option>
                  <option value="BREEDER MASH PLM (75 KG)">BREEDER MASH PLM (75 KG)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Order Quantity (Bags)</label>
                <input
                  type="number"
                  value={reqQuantity}
                  onChange={(e) => setReqQuantity(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Delivery Priority</label>
                <select
                  value={reqUrgency}
                  onChange={(e) => setReqUrgency(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                >
                  <option value="Standard (5 Days)">Standard (5 Days)</option>
                  <option value="Urgent (3 Days)">Urgent (3 Days)</option>
                  <option value="Critical Shortage (24 Hours)">Critical Shortage (24 Hours)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRequisitionModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs"
                >
                  Submit Indent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
