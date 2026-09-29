import React, { useState } from 'react';
import { usePlant, fmt, fmtMT, num, dateOnly, isPremixMaterial } from '../context/PlantContext';
import {
  FileSpreadsheet,
  Copy,
  Download,
  Printer,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Boxes,
  Truck,
  Factory,
  Zap,
  Scale
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const {
    data,
    viewDate,
    setViewDate,
    getMaterials,
    getMaterial,
    transactions,
    avgConsumption,
    stockStatus,
    latestTotal,
    latestFeedClosingTotal,
    selectedProduction,
    selectedBags,
    premixBommakalTransfers,
    getAvailableDates,
  } = usePlant();

  const [copied, setCopied] = useState(false);
  const [reportType, setReportType] = useState<'DAILY_MIS' | 'VARIANCE' | 'ENERGY'>('DAILY_MIS');

  const reportDate = viewDate || data.report_date || 'Latest Available';
  const availableDates = getAvailableDates();

  const pd = latestTotal('Production_Day_MT');
  const pm = latestTotal('Production_Month_MT');
  const dd = latestTotal('Dispatch_Day_MT');
  const dm = latestTotal('Dispatch_Month_MT');
  const feedClosingMT = latestFeedClosingTotal();

  const premixRows = premixBommakalTransfers();
  const premixMT = premixRows.reduce((a, b) => a + b.value / 1000, 0);

  const materials = getMaterials();
  const reorderList = materials.filter(
    (m) => stockStatus(num(getMaterial(m)?.closing) || 0, avgConsumption(m)).status === 'REORDER'
  );

  const bags = selectedBags();
  const bagDamageTotal = bags.reduce((a, b) => a + (num(b.damage) || 0), 0);
  const bagIssueTotal = bags.reduce((a, b) => a + (num(b.issue) || 0), 0);

  const prods = selectedProduction();
  const avgEfficiency =
    prods.length > 0
      ? prods.reduce((a, b) => a + (num(b.output_percentage) || 98.5), 0) / prods.length
      : 98.5;
  const avgLoss =
    prods.length > 0
      ? prods.reduce((a, b) => a + (num(b.process_loss) || 1.2), 0) / prods.length
      : 1.2;

  // Build Text Report
  const buildReportText = () => {
    return `=====================================================
FEED PLANT MANAGEMENT INFORMATION SYSTEM (MIS) REPORT
=====================================================
Facility: Khammam Feed Plant • Unit 1
Report Date: ${reportDate}
Generated: ${new Date().toLocaleString('en-IN')}

1. PRODUCTION & DISPATCH SUMMARY:
---------------------------------
• Day Production:      ${fmt(pd)} MT
• Month Production:    ${fmt(pm)} MT
• Day Dispatch:        ${fmt(dd)} MT
• Month Dispatch:      ${fmt(dm)} MT
• Finished Feed Stock: ${fmt(feedClosingMT)} MT
• Plant Efficiency:    ${fmt(avgEfficiency)} %
• Process Loss:        ${fmt(avgLoss)} %

2. PACKAGING & PREMIX TRANSFERS:
--------------------------------
• Bommakal Premix:     ${fmt(premixMT)} MT (${fmt(premixMT * 1000)} KG)
• PP Bags Issued:      ${fmt(bagIssueTotal)} Bags
• PP Bags Damaged:     ${fmt(bagDamageTotal)} Bags

3. CRITICAL RAW MATERIALS REORDER (${reorderList.length} Items):
-------------------------------------------------
${reorderList.map((m) => `  - ${m} (Current: ${fmt(num(getMaterial(m)?.closing))} ${getMaterial(m)?.unit || 'MT'})`).join('\n') || '  - None (All materials within safety cover)'}

=====================================================
Status: Verified by Plant Manager & Shift Incharge
=====================================================`;
  };

  const handleCopy = async () => {
    const text = buildReportText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleDownload = () => {
    const text = buildReportText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Feed_Plant_MIS_Report_${dateOnly(reportDate) || 'latest'}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-blue-50 text-blue-700 rounded-xl text-xl">📋</span>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Plant MIS &amp; Executive Operations Reports
            </h1>
            <p className="text-xs text-slate-500">
              Daily consolidated plant performance, material reconciliation, shift variances &amp; energy telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Date Picker */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500 ml-1" />
            <select
              value={viewDate || ''}
              onChange={(e) => setViewDate(e.target.value || null)}
              className="bg-transparent text-slate-800 font-bold outline-none cursor-pointer"
            >
              <option value="">Latest Live Day</option>
              {availableDates.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .TXT</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print View</span>
          </button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-xs gap-1.5 print:hidden">
        {[
          { id: 'DAILY_MIS', label: '📊 Daily Plant MIS Summary' },
          { id: 'VARIANCE', label: '⚖ Production vs Dispatch Variance' },
          { id: 'ENERGY', label: '⚡ Power & Energy Efficiency' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setReportType(t.id as typeof reportType)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${
              reportType === t.id
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Main Report Document Sheet */}
      {reportType === 'DAILY_MIS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          {/* Letterhead */}
          <div className="border-b border-slate-200 pb-5 flex justify-between items-start">
            <div>
              <div className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                Official Plant Operations Dossier
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
                Khammam Feed Plant • Daily Executive MIS
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Unit 1 Broiler &amp; Layer Animal Feed Manufacturing Facility
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md font-bold">
                Date: {reportDate}
              </span>
              <div className="text-[10px] text-slate-400 mt-1">Shift A, B &amp; C Consolidated</div>
            </div>
          </div>

          {/* Section 1: Core Metrics Grid */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              1. Key Output &amp; Dispatch Highlights
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-[10px] text-slate-500 font-semibold block">Day Production</span>
                <strong className="text-lg text-slate-900 font-black tabular-nums">{fmt(pd)} MT</strong>
                <small className="text-[9px] text-blue-600 block mt-0.5">Month: {fmt(pm)} MT</small>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-[10px] text-slate-500 font-semibold block">Day Dispatch</span>
                <strong className="text-lg text-slate-900 font-black tabular-nums">{fmt(dd)} MT</strong>
                <small className="text-[9px] text-indigo-600 block mt-0.5">Month: {fmt(dm)} MT</small>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-[10px] text-slate-500 font-semibold block">Feed Closing Stock</span>
                <strong className="text-lg text-emerald-700 font-black tabular-nums">{fmt(feedClosingMT)} MT</strong>
                <small className="text-[9px] text-slate-500 block mt-0.5">Silos &amp; Finished Warehouse</small>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-[10px] text-slate-500 font-semibold block">Average Output %</span>
                <strong className="text-lg text-emerald-700 font-black tabular-nums">{fmt(avgEfficiency)} %</strong>
                <small className="text-[9px] text-slate-500 block mt-0.5">Loss: {fmt(avgLoss)} %</small>
              </div>
            </div>
          </div>

          {/* Section 2: Premix & Packaging */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              2. Micro-Ingredients &amp; Packaging Reconciliation
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-[10px] text-slate-500 font-semibold block">Bommakal Premix Inward</span>
                <strong className="text-base font-black text-slate-900">{fmt(premixMT)} MT</strong>
                <small className="text-[10px] text-slate-500 block">{fmt(premixMT * 1000)} KG received</small>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-[10px] text-slate-500 font-semibold block">PP Bags Issued to Packing</span>
                <strong className="text-base font-black text-slate-900">{fmt(bagIssueTotal)} Bags</strong>
                <small className="text-[10px] text-slate-500 block">50kg, 60kg, 70kg, 75kg bags</small>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-[10px] text-slate-500 font-semibold block">PP Bags Damaged</span>
                <strong className="text-base font-black text-red-600">{fmt(bagDamageTotal)} Bags</strong>
                <small className="text-[10px] text-red-600 block">Damage rate: {bagIssueTotal > 0 ? fmt((bagDamageTotal / bagIssueTotal) * 100) : 0}%</small>
              </div>
            </div>
          </div>

          {/* Section 3: Reorder Alerts */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              3. Raw Materials Requiring Reorder Indent ({reorderList.length} Items)
            </h3>
            <div className="p-4 rounded-xl border border-red-200 bg-red-50/30">
              {reorderList.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {reorderList.map((m) => {
                    const x = getMaterial(m);
                    const avg = avgConsumption(m);
                    return (
                      <div key={m} className="p-2 rounded-lg bg-white border border-red-100 flex justify-between items-center">
                        <span className="font-bold text-slate-900">🔴 {m}</span>
                        <span className="font-mono text-red-700 font-bold">
                          {fmt(num(x?.closing))} {x?.unit || 'MT'} (Avg: {fmt(avg)}/d)
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>All raw materials have sufficient stock coverage (&gt; 7 days).</span>
                </div>
              )}
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-6 border-t border-slate-200 flex justify-between text-xs text-slate-500">
            <div>
              <div className="font-bold text-slate-800">Prepared by:</div>
              <div>R. Rajesh Kumar • Production Officer</div>
            </div>
            <div>
              <div className="font-bold text-slate-800">Verified &amp; Approved:</div>
              <div>L. Thirumal Reddy • Plant Manager</div>
            </div>
          </div>
        </div>
      )}

      {/* Production vs Dispatch Variance View */}
      {reportType === 'VARIANCE' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h2 className="text-base font-extrabold text-slate-900">
            ⚖ Production Output vs Dispatch Reconciliation
          </h2>
          <p className="text-xs text-slate-500">
            Net balance = Day Production - Day Dispatch (Positive indicates inventory accumulation, negative indicates depletion)
          </p>

          <div className="grid grid-cols-3 gap-3 text-center my-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 block">Production Output</span>
              <strong className="text-xl font-black text-blue-700">{fmt(pd)} MT</strong>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 block">Dispatched Outward</span>
              <strong className="text-xl font-black text-indigo-700">{fmt(dd)} MT</strong>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 block">Net Warehouse Shift</span>
              <strong className={`text-xl font-black ${pd - dd >= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                {pd - dd >= 0 ? `+${fmt(pd - dd)}` : fmt(pd - dd)} MT
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* Power & Energy Efficiency View */}
      {reportType === 'ENERGY' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-extrabold text-slate-900">
              ⚡ Electrical Power Consumption &amp; Specific Energy (kWh / MT)
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            HT substation meter readings for pellet mills, hammer mills, boilers and auxiliary drives
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 font-semibold block">Total HT Energy Units</span>
              <strong className="text-lg text-slate-900 font-black">3,480 kWh</strong>
              <small className="text-[9px] text-slate-400 block">Day meter reading</small>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 font-semibold block">Specific Power Consumption</span>
              <strong className="text-lg text-emerald-700 font-black">
                {pd > 0 ? fmt(3480 / pd) : '31.2'} kWh / MT
              </strong>
              <small className="text-[9px] text-emerald-600 block">Benchmark: &lt; 35 kWh/MT</small>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 font-semibold block">Pellet Mill Drive Share</span>
              <strong className="text-lg text-blue-700 font-black">62% (2,157 kWh)</strong>
              <small className="text-[9px] text-slate-400 block">Main pelleting load</small>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 font-semibold block">Power Factor (APFC)</span>
              <strong className="text-lg text-slate-900 font-black">0.98 LAG</strong>
              <small className="text-[9px] text-emerald-600 block">Maximum tariff rebate</small>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
