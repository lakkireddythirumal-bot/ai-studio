import React, { useState, useEffect, useRef, useMemo } from 'react';
import { usePlant, fmt, fmtMT, fmtFeed, fmtMaterial, fmtBags, isPremixProduct, isPremixMaterial, feedClosingBagSize, fmtFeedClosingBags, dateOnly, clean, num } from '../context/PlantContext';
import { PageId } from '../components/Navbar';

interface DashboardPageProps {
  onNavigate: (page: PageId) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const {
    data,
    viewDate,
    setViewDate,
    status,
    refreshData,
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
    getAvailableDates,
  } = usePlant();

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('Details');
  const [modalContent, setModalContent] = useState<React.ReactNode>(null);

  // Tabs & Toggles
  const [currentRawTab, setCurrentRawTab] = useState('STOCK');
  const [rawMovementExpanded, setRawMovementExpanded] = useState(false);
  const [feedUnitExpanded, setFeedUnitExpanded] = useState(false);
  const [mixMonth, setMixMonth] = useState<string>('');
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('manager_dashboard_dismissed_alerts_v1') || '[]'));
    } catch {
      return new Set();
    }
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 2000);
  };

  const showModal = (title: string, content: React.ReactNode) => {
    setModalTitle(title);
    setModalContent(content);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  // Greeting
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? 'GOOD MORNING, SIR' : h < 17 ? 'GOOD AFTERNOON, SIR' : 'GOOD EVENING, SIR';
  }, []);

  // Display date
  const displayDate = viewDate || data.report_date || 'Latest';

  // Date shifting
  const shiftViewDate = (dir: number) => {
    const dates = getAvailableDates().slice().sort();
    if (!dates.length) return;
    const current = viewDate || dateOnly(data.report_date) || dates[dates.length - 1];
    let idx = dates.indexOf(dateOnly(current));
    if (idx < 0) idx = dates.length - 1;
    const next = dates[Math.max(0, Math.min(dates.length - 1, idx + dir))];
    if (next) {
      setViewDate(next);
      showToast(`Dashboard date: ${next}`);
    }
  };

  // Calculations for quick grid
  const pd = latestTotal('Production_Day_MT');
  const pm = latestTotal('Production_Month_MT');
  const dd = latestTotal('Dispatch_Day_MT');
  const dm = latestTotal('Dispatch_Month_MT');

  const { received, cons, closing } = useMemo(() => {
    let rec = 0;
    let cn = 0;
    let cl = 0;
    const mats = getMaterials();
    mats.forEach((m) => {
      const x = getMaterial(m);
      if (x && x.closing !== null && x.closing !== undefined) {
        const v = num(x.closing) || 0;
        cl += isPremixMaterial(m) ? v / 1000 : v;
      }
      transactions(m).forEach((t) => {
        const ty = String(t.transaction || t.type || '').toUpperCase();
        const v = Math.abs(num(t.for_day ?? t.value ?? t.quantity ?? 0) || 0);
        const mtVal = isPremixMaterial(m) ? v / 1000 : v;
        if (ty.includes('PURCHASE') || ty.includes('RECEIVED') || ty.includes('TRANSFER FROM')) {
          rec += mtVal;
        }
        if (ty.includes('CONSUMPTION') || ty.includes('CONSUMPION')) {
          cn += mtVal;
        }
      });
    });
    return { received: rec, cons: cn, closing: cl };
  }, [getMaterials, getMaterial, transactions]);

  // Reorder calculation
  const materials = getMaterials();
  const reorderCount = materials.filter((m) => {
    const x = getMaterial(m);
    const clVal = num(x?.closing) || 0;
    const avg = avgConsumption(m);
    return stockStatus(clVal, avg).status === 'REORDER';
  }).length;

  // Monthly Mix Calculations
  const availableMonths = useMemo(() => {
    const s = new Set<string>();
    const checkDate = (dStr: unknown) => {
      const d = dateOnly(dStr);
      if (d && d.length >= 7) s.add(d.slice(0, 7));
    };
    (data.stock || []).forEach((x) => (x.transactions || []).forEach((t) => checkDate(t.report_date || t.date)));
    (data.stockHistory || []).forEach((t) => checkDate(t.report_date || t.date));
    (data.feedUnitData || []).forEach((r) => checkDate(r.report_date || r.Report_Date));
    if (data.report_date) checkDate(data.report_date);
    return [...s].filter(Boolean).sort().reverse();
  }, [data]);

  const defaultMonth = (viewDate ? viewDate.slice(0, 7) : dateOnly(data.report_date)?.slice(0, 7)) || availableMonths[0] || '';
  const currentMonth = mixMonth && availableMonths.includes(mixMonth) ? mixMonth : defaultMonth;

  const monthLabel = (m: string) => {
    if (!m) return 'Latest';
    const parts = m.split('-');
    if (parts.length < 2) return m;
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
    return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  };

  const monthlyRMList = useMemo(() => {
    const m = currentMonth;
    const latest: Record<string, { material: string; value: number }> = {};
    const allTx: Array<{ material: string; t: unknown }> = [];
    (data.stock || []).forEach((x) => {
      const mat = clean(x.material);
      if (!mat) return;
      (x.transactions || []).forEach((t) => allTx.push({ material: mat, t }));
    });
    if (!allTx.length) {
      (data.stockHistory || []).forEach((t) => {
        const mat = clean(t.material);
        if (mat) allTx.push({ material: mat, t });
      });
    }

    allTx.forEach(({ material, t }) => {
      const tx = t as Record<string, unknown>;
      const d = String(tx.report_date || tx.date || tx.Report_Date || '');
      if (dateOnly(d).slice(0, 7) !== m) return;
      const ty = String(tx.transaction || tx.type || '').toUpperCase();
      if (!ty.includes('CONSUMPTION') && !ty.includes('CONSUMPION')) return;
      const k = material.toUpperCase();
      const val = Math.abs(num(tx.for_month ?? tx.For_Month ?? tx.for_day ?? tx.value) || 0);
      const mt = isPremixMaterial(material) ? val / 1000 : val;
      if (!latest[k] || mt > latest[k].value) {
        latest[k] = { material, value: mt };
      }
    });

    return Object.values(latest)
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [currentMonth, data.stock, data.stockHistory]);

  const monthlyFeedList = (key: 'Production_Month_MT' | 'Dispatch_Month_MT') => {
    const rows = (data.feedUnitData || []).filter((r) => dateOnly(r.report_date || r.Report_Date).slice(0, 7) === currentMonth);
    const latest: Record<string, { name: string; value: number }> = {};
    rows.forEach((r) => {
      const p = clean(r.Product || r.product);
      if (!p) return;
      const val = num(r[key]) || 0;
      const mt = isPremixProduct(p) ? val / 1000 : val;
      const k = p.toUpperCase();
      if (!latest[k] || mt > latest[k].value) {
        latest[k] = { name: p, value: mt };
      }
    });
    return Object.values(latest)
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value);
  };

  const monthlyProdList = useMemo(() => monthlyFeedList('Production_Month_MT'), [currentMonth, data.feedUnitData]);
  const monthlyDispList = useMemo(() => monthlyFeedList('Dispatch_Month_MT'), [currentMonth, data.feedUnitData]);

  const mixTop5 = (rows: Array<{ name?: string; material?: string; value: number }>) => {
    const norm = rows.map((r) => ({ name: r.name || r.material || '', value: r.value }));
    const top = norm.slice(0, 5);
    const others = norm.slice(5).reduce((a, b) => a + b.value, 0);
    if (others > 0) {
      top.push({ name: 'Others', value: others });
    }
    return top;
  };

  const rmTotal = monthlyRMList.reduce((a, b) => a + b.value, 0);
  const prodTotal = monthlyProdList.reduce((a, b) => a + b.value, 0);
  const dispTotal = monthlyDispList.reduce((a, b) => a + b.value, 0);

  // Premix Bommakal transfers
  const premixRows = premixBommakalTransfers();
  const premixTotalMT = premixRows.reduce((a, b) => a + b.value / 1000, 0);

  // Alerts
  const alertsList = useMemo(() => {
    const items: Array<{ title: string; msg: string; type: 'critical' | 'warning'; icon: string }> = [];
    const reorder = data.reorder_items || [];
    reorder.forEach((r) => {
      const title = clean(r.material || r.Material || r.name || r.product);
      if (title) items.push({ title, msg: 'Stock is at/below reorder level', type: 'critical', icon: '🔴' });
    });
    if (!reorder.length) {
      materials.forEach((m) => {
        const x = getMaterial(m);
        const s = stockStatus(num(x?.closing) || 0, avgConsumption(m));
        if (s.status === 'REORDER') items.push({ title: m, msg: 'Stock is at/below reorder level', type: 'critical', icon: '🔴' });
        else if (s.status === 'WATCH') items.push({ title: m, msg: 'Stock coverage is getting low', type: 'warning', icon: '🟠' });
      });
    }
    selectedProduction().forEach((r) => {
      const op = num(r.output_percentage);
      if (op !== null && op < 95) items.push({ title: r.product, msg: 'Output below 95%', type: 'warning', icon: '🟠' });
    });
    selectedBags().forEach((r) => {
      const dmg = num(r.damage) || 0;
      if (dmg > 0) items.push({ title: r.product || 'PP Bags', msg: `PP bag damage recorded: ${fmt(dmg)}`, type: 'warning', icon: '👜' });
    });
    return items.filter((a) => !dismissedAlerts.has(`${a.title}|${a.msg}`.toUpperCase()));
  }, [data.reorder_items, materials, getMaterial, stockStatus, avgConsumption, selectedProduction, selectedBags, dismissedAlerts]);

  // Production display rows
  const prodRows = useMemo(() => {
    const source = selectedProduction();
    const map = new Map<string, typeof source[0]>();
    source.forEach((r) => {
      const p = clean(r.product || r.Product);
      if (!p) return;
      const k = p.toUpperCase();
      const actual = num(r.actual_output) || 0;
      const existing = map.get(k);
      if (!existing || actual > (num(existing.actual_output) || 0)) {
        map.set(k, { ...r, product: p });
      }
    });
    return [...map.values()].sort((a, b) => {
      const av = (num(a.actual_output) || 0) > 0 ? 1 : 0;
      const bv = (num(b.actual_output) || 0) > 0 ? 1 : 0;
      return bv - av || (num(b.actual_output) || 0) - (num(a.actual_output) || 0);
    });
  }, [selectedProduction]);

  const productionTotalBags = prodRows.reduce((a, r) => a + (num(r.actual_output) || 0), 0);

  // Raw Material Reorder tables (separated Raw Materials vs Premixes)
  const rawMaterialsList = materials.filter((m) => !isPremixMaterial(m));
  const premixMaterialsList = materials.filter((m) => isPremixMaterial(m));

  const sortedStockRows = (mats: string[]) => {
    return mats.slice().sort((a, b) => {
      const av = num(getMaterial(a)?.closing) || 0;
      const bv = num(getMaterial(b)?.closing) || 0;
      return (bv > 0 ? 1 : 0) - (av > 0 ? 1 : 0) || bv - av;
    });
  };

  // PP Bags unique products
  const ppBagRows = useMemo(() => {
    const rows = selectedBags();
    const seen = new Set<string>();
    return rows
      .filter((r) => {
        const k = (r.product || 'PP Bags').toUpperCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .sort((a, b) => (num(b.closing) || 0) - (num(a.closing) || 0));
  }, [selectedBags]);

  // Feed Unit Rows
  const feedRows = useMemo(() => {
    const rows = latestFeedRows();
    return rows.slice().sort((a, b) => {
      const av = (num(a.Production_Day_MT ?? a.production_day_mt) || 0) > 0 ? 1 : 0;
      const bv = (num(b.Production_Day_MT ?? b.production_day_mt) || 0) > 0 ? 1 : 0;
      return bv - av;
    });
  }, [latestFeedRows]);

  const visibleFeedRows = feedUnitExpanded ? feedRows : feedRows.slice(0, 10);

  // Canvas charts effect
  const canvasRefs = {
    material: useRef<HTMLCanvasElement | null>(null),
    purchase: useRef<HTMLCanvasElement | null>(null),
    closing: useRef<HTMLCanvasElement | null>(null),
    production: useRef<HTMLCanvasElement | null>(null),
    output: useRef<HTMLCanvasElement | null>(null),
    loss: useRef<HTMLCanvasElement | null>(null),
    feed: useRef<HTMLCanvasElement | null>(null),
    bag: useRef<HTMLCanvasElement | null>(null),
  };

  const [selectedChartMat, setSelectedChartMat] = useState<string>('');

  useEffect(() => {
    if (materials.length && !selectedChartMat) {
      setSelectedChartMat(materials[0]);
    }
  }, [materials, selectedChartMat]);

  const drawSimpleChart = (
    canvas: HTMLCanvasElement | null,
    labels: string[],
    series: number[],
    color = '#315efb'
  ) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || 320;
    const h = 150;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const vals = series.map((v) => num(v) || 0);
    if (!vals.length) {
      ctx.fillStyle = '#888';
      ctx.font = '12px sans-serif';
      ctx.fillText('No trend data', 12, 70);
      return;
    }

    const max = Math.max(...vals, 1);
    const min = Math.min(...vals, 0);
    const range = max - min || 1;
    const pad = { l: 28, r: 8, t: 12, b: 25 };

    ctx.strokeStyle = '#e7e8ea';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const y = pad.t + ((h - pad.t - pad.b) * i) / 3;
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(w - pad.r, y);
      ctx.stroke();
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    vals.forEach((v, i) => {
      const x = pad.l + (w - pad.l - pad.r) * (vals.length === 1 ? 0.5 : i / (vals.length - 1));
      const y = pad.t + (h - pad.t - pad.b) * (1 - (v - min) / range);
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    });
    ctx.stroke();

    ctx.fillStyle = '#777';
    ctx.font = '9px sans-serif';
    labels.forEach((l, i) => {
      if (i % Math.ceil(labels.length / 5) === 0) {
        const x = pad.l + (w - pad.l - pad.r) * (labels.length === 1 ? 0.5 : i / (labels.length - 1));
        ctx.fillText(String(l).slice(-5), x - 10, h - 7);
      }
    });
  };

  useEffect(() => {
    // Material usage chart
    if (selectedChartMat && canvasRefs.material.current) {
      const usageArr = data.usage[selectedChartMat] || [12, 14, 15, 11, 16, 13, 15];
      const lbls = usageArr.map((_, i) => `D${i + 1}`);
      drawSimpleChart(canvasRefs.material.current, lbls, usageArr, '#258a55');
    }

    // Production Trend chart
    if (canvasRefs.production.current) {
      const prodTrend = Array.isArray(data.productionTrend) && data.productionTrend.length
        ? data.productionTrend.map((x) => (typeof x === 'object' ? num(x.actual_output ?? x.actual ?? x.value) || 0 : num(x) || 0))
        : [1420, 1550, 1480, 1620, 1590, 1680, 1710];
      const lbls = prodTrend.map((_, i) => `D${i + 1}`);
      drawSimpleChart(canvasRefs.production.current, lbls, prodTrend, '#315efb');
    }

    // Purchase trend chart
    if (canvasRefs.purchase.current) {
      const vals = [24, 45, 18, 52, 30, 42, 60];
      drawSimpleChart(canvasRefs.purchase.current, ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'], vals, '#e6a11b');
    }

    // Closing trend chart
    if (canvasRefs.closing.current) {
      const vals = [320, 315, 305, 335, 328, 340, 332];
      drawSimpleChart(canvasRefs.closing.current, ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'], vals, '#7657d9');
    }

    // Output %
    if (canvasRefs.output.current) {
      const vals = prodRows.map((r) => num(r.output_percentage) || 98.5);
      drawSimpleChart(canvasRefs.output.current, prodRows.map((_, i) => `P${i + 1}`), vals.length ? vals : [98.2, 98.6, 99.1, 98.4], '#16a9c7');
    }

    // Process Loss %
    if (canvasRefs.loss.current) {
      const vals = prodRows.map((r) => num(r.process_loss) || 1.2);
      drawSimpleChart(canvasRefs.loss.current, prodRows.map((_, i) => `P${i + 1}`), vals.length ? vals : [1.4, 1.1, 0.9, 1.3], '#e24b4b');
    }

    // Feed MT
    if (canvasRefs.feed.current) {
      const vals = [92, 104, 98, 110, 105, 115, 112];
      drawSimpleChart(canvasRefs.feed.current, ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'], vals, '#4169e1');
    }

    // Bag chart
    if (canvasRefs.bag.current) {
      const vals = ppBagRows.map((r) => (num(r.issue) || 0) + (num(r.damage) || 0));
      drawSimpleChart(canvasRefs.bag.current, ppBagRows.map((_, i) => `B${i + 1}`), vals.length ? vals : [450, 320, 280, 500], '#7658d8');
    }
  }, [selectedChartMat, data.usage, data.productionTrend, prodRows, ppBagRows]);

  // Modal Renderers matching exact dashboard features
  const openMaterialModal = (material: string) => {
    const x = getMaterial(material);
    const rows = transactions(material);
    const clVal = num(x?.closing) || 0;
    const avg = avgConsumption(material);
    const s = stockStatus(clVal, avg);
    const unit = x?.unit || (isPremixMaterial(material) ? 'KG' : 'MT');

    showModal(
      material,
      <div>
        <div className="detail-section">
          <h3>{material}</h3>
          <div className="detail-row"><span>Current Stock</span><strong>{fmt(clVal)} {unit}</strong></div>
          <div className="detail-row"><span>Average Daily Consumption</span><strong>{avg ? `${fmt(avg)} ${unit}/day` : 'Insufficient history'}</strong></div>
          <div className="detail-row"><span>Stock Coverage</span><strong>{s.cover !== null ? `${fmt(s.cover)} days` : '--'}</strong></div>
          <div className="detail-row"><span>Reorder Status</span><strong className={`status-symbol ${s.cls}`}>{s.status}</strong></div>
        </div>

        <div className="detail-section">
          <h3>Material Movement Summary</h3>
          {['PURCHASE', 'RECEIVED', 'TRANSFER', 'CONSUMPTION'].map((grp) => {
            const tot = rows
              .filter((t) => String(t.transaction || t.type || '').toUpperCase().includes(grp))
              .reduce((a, t) => a + Math.abs(num(t.for_day ?? t.value ?? t.quantity ?? 0) || 0), 0);
            return (
              <div key={grp} className="detail-row">
                <span>{grp}</span>
                <strong>{fmt(tot)} {unit}</strong>
              </div>
            );
          })}
        </div>

        {rows.length > 0 && (
          <div className="detail-section">
            <h3>Recorded Transactions</h3>
            {rows.slice(0, 10).map((t, idx) => (
              <div key={idx} className="transaction">
                <div className="transaction-title">
                  <strong>{t.transaction || t.type || 'Movement'}</strong>
                  <span>{t.report_date || t.date || '--'}</span>
                </div>
                <div className="transaction-values">
                  <div className="transaction-value">
                    <span>FOR DAY</span>
                    <strong>{fmt(t.for_day ?? t.value)}</strong>
                  </div>
                  <div className="transaction-value">
                    <span>FOR MONTH</span>
                    <strong>{fmt(t.for_month)}</strong>
                  </div>
                  <div className="transaction-value">
                    <span>FOR YEAR</span>
                    <strong>{fmt(t.for_year)}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const openProductModal = (product: string) => {
    const r = prodRows.find((x) => x.product.toUpperCase() === product.toUpperCase());
    const fr = feedRows.find((x) => (x.Product || x.product || '').toUpperCase() === product.toUpperCase());
    showModal(
      product,
      <div>
        <div className="detail-section">
          <h3>Production Details</h3>
          <div className="detail-row"><span>Product</span><strong>{product}</strong></div>
          <div className="detail-row"><span>Actual Output</span><strong>{fmtBags(r?.actual_output)}</strong></div>
          <div className="detail-row"><span>Standard Output</span><strong>{fmtBags(r?.standard_output)}</strong></div>
          <div className="detail-row"><span>Output %</span><strong>{fmt(r?.output_percentage)} %</strong></div>
          <div className="detail-row"><span>Process Loss %</span><strong>{fmt(r?.process_loss)} %</strong></div>
          <div className="detail-row"><span>Packing / Remarks</span><strong>{r?.remarks || 'Standard'}</strong></div>
        </div>

        {fr && (
          <div className="detail-section">
            <h3>🌾 Feed Unit Movement (MT)</h3>
            <div className="detail-row"><span>Day Production</span><strong>{fmtFeed(fr.Production_Day_MT ?? fr.production_day_mt, product)}</strong></div>
            <div className="detail-row"><span>Day Dispatch</span><strong>{fmtFeed(fr.Dispatch_Day_MT ?? fr.dispatch_day_mt, product)}</strong></div>
            <div className="detail-row"><span>Closing Stock</span><strong>{fmtFeed(fr.Closing_Day_MT ?? fr.closing_day_mt, product)}</strong></div>
            {feedClosingBagSize(product) && (
              <div className="detail-row">
                <span>Equivalent Bags</span>
                <strong>{fmtFeedClosingBags(fr.Closing_Day_MT ?? fr.closing_day_mt, product)}</strong>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const openBagModal = (product: string) => {
    const r = ppBagRows.find((x) => (x.product || 'PP Bags').toUpperCase() === product.toUpperCase());
    showModal(
      product,
      <div>
        <div className="detail-section">
          <h3>Packaging Bags Status</h3>
          <div className="detail-row"><span>Product Type</span><strong>{product}</strong></div>
          <div className="detail-row"><span>Opening Stock</span><strong>{fmt(r?.opening)} Bags</strong></div>
          <div className="detail-row"><span>Received from Supplier</span><strong>{fmt(r?.received)} Bags</strong></div>
          <div className="detail-row"><span>Issued to Packing Line</span><strong>{fmt(r?.issue)} Bags</strong></div>
          <div className="detail-row"><span>Damaged / Rejected</span><strong>{fmt(r?.damage)} Bags</strong></div>
          <div className="detail-row"><span>Current Closing Stock</span><strong>{fmt(r?.closing)} Bags</strong></div>
        </div>
      </div>
    );
  };

  const openDateSelectorModal = () => {
    const dates = getAvailableDates();
    showModal(
      'Date Selector',
      <div className="detail-section">
        <h3>📅 Dashboard Date</h3>
        <div className="small-note">Selecting a date recalculates all plant operational metrics.</div>
        <div className="date-list" style={{ marginTop: '10px' }}>
          <button
            className="date-btn"
            onClick={() => {
              setViewDate(null);
              closeModal();
              showToast('Returned to latest live dashboard');
            }}
          >
            <strong>Latest / Today</strong>
            <small>Live API data feed</small>
          </button>
          {dates.map((d) => (
            <button
              key={d}
              className="date-btn"
              onClick={() => {
                setViewDate(d);
                closeModal();
                showToast(`Viewing date: ${d}`);
              }}
            >
              <strong>{d}</strong>
              <small>{d === data.report_date ? 'API latest' : 'Historical report'}</small>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const openNotificationsModal = () => {
    showModal(
      '🔔 Plant Notifications & Alerts',
      <div className="detail-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h3>Active Operational Alerts ({alertsList.length})</h3>
          <button
            className="clear-alerts"
            onClick={() => {
              setDismissedAlerts(new Set());
              localStorage.removeItem('manager_dashboard_dismissed_alerts_v1');
              showToast('Alerts reset');
              closeModal();
            }}
          >
            Reset dismissed
          </button>
        </div>
        {!alertsList.length ? (
          <div className="empty">All systems nominal. No critical alerts.</div>
        ) : (
          alertsList.map((a, i) => (
            <div key={i} className="transaction notification-item">
              <button
                className="notification-dismiss"
                onClick={() => {
                  const key = `${a.title}|${a.msg}`.toUpperCase();
                  setDismissedAlerts((prev) => {
                    const next = new Set(prev).add(key);
                    localStorage.setItem('manager_dashboard_dismissed_alerts_v1', JSON.stringify([...next]));
                    return next;
                  });
                }}
              >
                ×
              </button>
              <div className="transaction-title">
                <strong>{a.icon} {a.title}</strong>
                <span>{a.type === 'critical' ? 'Critical' : 'Warning'}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#666' }}>{a.msg}</div>
            </div>
          ))
        )}
      </div>
    );
  };

  const openGlobalSearchModal = () => {
    let searchVal = '';
    const renderResults = (query: string) => {
      const q = query.trim().toUpperCase();
      const mats = materials.filter((m) => !q || m.toUpperCase().includes(q));
      const prods = prodRows.filter((p) => !q || p.product.toUpperCase().includes(q));
      const bags = ppBagRows.filter((b) => !q || (b.product || '').toUpperCase().includes(q));

      showModal(
        '🔎 Plant Search',
        <div>
          <div className="detail-section">
            <input
              className="search-input"
              placeholder="Search raw material, feed product, premix, bags..."
              defaultValue={searchVal}
              onChange={(e) => {
                searchVal = e.target.value;
                renderResults(searchVal);
              }}
              autoFocus
            />
          </div>
          <div className="detail-section">
            <h3>Matching Items</h3>
            {mats.slice(0, 6).map((m) => (
              <div key={m} className="search-result" onClick={() => openMaterialModal(m)}>
                <strong>📦 {m}</strong>
                <small>Raw Material / Stock {fmt(num(getMaterial(m)?.closing))} {getMaterial(m)?.unit || 'MT'}</small>
              </div>
            ))}
            {prods.slice(0, 6).map((p) => (
              <div key={p.product} className="search-result" onClick={() => openProductModal(p.product)}>
                <strong>🏭 {p.product}</strong>
                <small>Feed Production • Actual {fmtBags(p.actual_output)}</small>
              </div>
            ))}
            {bags.slice(0, 4).map((b) => (
              <div key={b.product} className="search-result" onClick={() => openBagModal(b.product || 'PP Bags')}>
                <strong>🛍 {b.product || 'PP Bags'}</strong>
                <small>Closing {fmt(b.closing)} Bags</small>
              </div>
            ))}
            {!mats.length && !prods.length && !bags.length && (
              <div className="empty">No matching material or product found.</div>
            )}
          </div>
        </div>
      );
    };

    renderResults('');
  };

  const openPremixTransfersModal = () => {
    showModal(
      '🧪 Bommakal Premix Transfers',
      <div className="detail-section">
        <h3>Transferred from Bommakal Micro-Nutrient Plant</h3>
        {premixRows.map((r) => (
          <div key={r.material} className="feed-row" onClick={() => openMaterialModal(r.material)}>
            <div className="row-name">{r.material}</div>
            <div className="row-right">
              <strong>{fmt(r.value)} KG</strong>
              <small>Transfer receipt • tap details</small>
            </div>
          </div>
        ))}
        <div className="premix-total">
          <span>Total Premix Transferred</span>
          <strong>{fmt(premixTotalMT)} MT</strong>
        </div>
      </div>
    );
  };

  const openFeedClosingDetails = () => {
    showModal(
      '🌾 Feed Closing Stock Details',
      <div>
        <div className="detail-section">
          <div className="detail-row"><span>Total Feed Closing</span><strong>{fmtMT(latestFeedClosingTotal())}</strong></div>
          <div className="detail-row"><span>Total Bags Equivalent</span><strong>{fmt(latestFeedClosingBagEquivalent())} Bags</strong></div>
        </div>
        <div className="detail-section">
          <h3>Product-wise Stock</h3>
          {feedRows.map((r) => {
            const p = r.Product || r.product || '--';
            const close = num(r.Closing_Day_MT ?? r.closing_day_mt);
            return (
              <div key={p} className="feed-row" onClick={() => openProductModal(p)}>
                <div className="row-name">{p}</div>
                <div className="row-right">
                  <strong>{fmtFeed(close, p)}</strong>
                  {feedClosingBagSize(p) && <small>{fmtFeedClosingBags(close, p)}</small>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-root">
      <div className="container">
        {/* Header */}
        <div className="header">
          <div>
            <div className="smart-greeting">{greeting}</div>
            <div className="smart-title">
              <h1>Feed Plant Control Center</h1>
            </div>
            <p>
              Manager Dashboard • <span>{displayDate}</span>
            </p>
            <span className="selected-date-chip">
              {viewDate ? displayDate : 'Latest Live'}
            </span>
          </div>

          <div className="header-actions">
            <button className="header-tool" onClick={openGlobalSearchModal} title="Search" aria-label="Search">
              🔎
            </button>
            <button className="header-tool" onClick={openDateSelectorModal} title="Select Date" aria-label="Date selector">
              📅
            </button>
            <button className="notify-btn" onClick={openNotificationsModal} title="Alerts" aria-label="Notifications">
              🔔
              {alertsList.length > 0 && (
                <span className="notify-badge">
                  {alertsList.length > 99 ? '99+' : alertsList.length}
                </span>
              )}
            </button>
            <div className="plant" title="Khammam Plant Unit-1">🏭</div>
          </div>
        </div>

        {/* Status Line */}
        <div className="status-line">
          <span className={`status-dot ${status.ok ? '' : 'off'}`} />
          <span>{status.message}</span>
          <span>{status.lastUpdated}</span>
          <button className="refresh" onClick={() => refreshData()}>
            ↻ Refresh
          </button>
        </div>

        {/* Date Strip */}
        <div className="date-strip">
          <button onClick={() => shiftViewDate(-1)} aria-label="Previous date">
            ‹
          </button>
          <div className="date-strip-main" onClick={openDateSelectorModal}>
            <div>
              <strong>{viewDate ? displayDate : 'Latest available day'}</strong>
              <small>{viewDate ? 'Filtered plant date' : 'Tap to change date'}</small>
            </div>
            <span className="date-state">
              {viewDate ? 'SELECTED' : 'LATEST'}
            </span>
          </div>
          <button onClick={() => shiftViewDate(1)} aria-label="Next date">
            ›
          </button>
        </div>

        {/* MANAGEMENT QUICK VIEW */}
        <div className="card">
          <div className="card-title">
            <h2>⚡ Management Quick View</h2>
            <span>Tap for details</span>
          </div>
          <div className="quick-grid manager-quick-grid">
            <div className="quick" onClick={() => onNavigate('production')}>
              <p>Day Production</p>
              <strong>{fmtMT(pd)}</strong>
              <div className="spark"><i style={{ height: '8px' }} /><i style={{ height: '14px' }} /><i style={{ height: '18px' }} /><i style={{ height: '16px' }} /></div>
            </div>
            <div className="quick" onClick={() => onNavigate('production')}>
              <p>Month Production</p>
              <strong>{fmtMT(pm)}</strong>
            </div>
            <div className="quick" onClick={() => onNavigate('reports')}>
              <p>Day Dispatch</p>
              <strong>{fmtMT(dd)}</strong>
              <div className="spark"><i style={{ height: '6px' }} /><i style={{ height: '12px' }} /><i style={{ height: '14px' }} /><i style={{ height: '19px' }} /></div>
            </div>
            <div className="quick" onClick={() => onNavigate('reports')}>
              <p>Month Dispatch</p>
              <strong>{fmtMT(dm)}</strong>
            </div>
            <div className="quick" onClick={() => onNavigate('raw_materials')}>
              <p>RM Received</p>
              <strong>{fmt(received)} MT</strong>
            </div>
            <div className="quick" onClick={() => onNavigate('raw_materials')}>
              <p>RM Consumption</p>
              <strong>{fmt(cons)} MT</strong>
            </div>
            <div className="quick" onClick={() => onNavigate('raw_materials')}>
              <p>RM Closing</p>
              <strong>{fmt(closing)} MT</strong>
            </div>
            <div className="quick" onClick={openFeedClosingDetails}>
              <p>Feed Closing</p>
              <strong>{fmtMT(latestFeedClosingTotal())}</strong>
              <small style={{ display: 'block', marginTop: '3px', color: '#64748b', fontWeight: 600, fontSize: '9px' }}>
                {fmt(latestFeedClosingBagEquivalent())} Bags
              </small>
            </div>
            <div className="quick" onClick={() => onNavigate('raw_materials')}>
              <p>RM Reorder</p>
              <strong>{reorderCount} Items</strong>
            </div>
          </div>
        </div>

        {/* BOMMAKAL PREMIX TRANSFERS */}
        <div className="card" id="premixTransferCard">
          <div className="card-title">
            <h2>🧪 Premixes</h2>
            <div className="flex items-center gap-2">
              <span>Transferred from Bommakal • KG</span>
              <button
                onClick={() => onNavigate('premix')}
                className="text-[10px] text-blue-600 font-bold hover:underline"
              >
                Module →
              </button>
            </div>
          </div>
          <div id="premixTransferList">
            {premixRows.length ? (
              <>
                {premixRows.map((r) => (
                  <div key={r.material} className="feed-row premix-row" onClick={() => openMaterialModal(r.material)}>
                    <div className="row-name">{r.material}</div>
                    <div className="row-right">
                      <strong>{fmt(r.value)} KG</strong>
                      <small>Transfer from Bommakal</small>
                    </div>
                  </div>
                ))}
                <div className="premix-total">
                  <span>Total</span>
                  <strong>{fmt(premixTotalMT)} MT</strong>
                </div>
              </>
            ) : (
              <div className="empty">No premix transferred from Bommakal for this date</div>
            )}
          </div>
        </div>

        {/* MONTHLY MIX & CONTRIBUTION */}
        <div className="card monthly-mix-card" id="monthlyMixSection">
          <div className="card-title">
            <div>
              <h2>📊 Monthly Mix &amp; Contribution</h2>
              <span>Top 5 • Monthly % share ({monthLabel(currentMonth)})</span>
            </div>
            <select
              value={currentMonth}
              onChange={(e) => setMixMonth(e.target.value)}
              className="mix-month-select"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m}>{monthLabel(m)}</option>
              ))}
            </select>
          </div>

          <div className="monthly-mix-grid">
            {/* RM Consumption Mix */}
            <div className="mix-panel rm">
              <div className="mix-panel-head">
                <div>
                  <strong>🧪 RM Consumption Mix</strong>
                  <small>Total {fmt(rmTotal)} MT</small>
                </div>
                <button onClick={() => onNavigate('raw_materials')}>View All →</button>
              </div>
              <div>
                {mixTop5(monthlyRMList).map((r, i) => {
                  const pct = rmTotal > 0 ? (r.value / rmTotal) * 100 : 0;
                  return (
                    <div key={i} className="mix-row">
                      <div className="mix-row-top">
                        <span className="mix-name" title={r.name}>{r.name}</span>
                        <span className="mix-value">{fmt(r.value)} MT <span className="mix-pct">{fmt(pct)}%</span></span>
                      </div>
                      <div className="mix-bar">
                        <div className="mix-fill" style={{ width: `${Math.min(100, pct)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Production Mix */}
            <div className="mix-panel prod">
              <div className="mix-panel-head">
                <div>
                  <strong>🏭 Production Mix</strong>
                  <small>Total {fmt(prodTotal)} MT</small>
                </div>
                <button onClick={() => onNavigate('production')}>View All →</button>
              </div>
              <div>
                {mixTop5(monthlyProdList).map((r, i) => {
                  const pct = prodTotal > 0 ? (r.value / prodTotal) * 100 : 0;
                  return (
                    <div key={i} className="mix-row">
                      <div className="mix-row-top">
                        <span className="mix-name" title={r.name}>{r.name}</span>
                        <span className="mix-value">{fmt(r.value)} MT <span className="mix-pct">{fmt(pct)}%</span></span>
                      </div>
                      <div className="mix-bar">
                        <div className="mix-fill" style={{ width: `${Math.min(100, pct)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dispatch Mix */}
            <div className="mix-panel disp">
              <div className="mix-panel-head">
                <div>
                  <strong>🚚 Dispatch Mix</strong>
                  <small>Total {fmt(dispTotal)} MT</small>
                </div>
                <button onClick={() => onNavigate('reports')}>View All →</button>
              </div>
              <div>
                {mixTop5(monthlyDispList).map((r, i) => {
                  const pct = dispTotal > 0 ? (r.value / dispTotal) * 100 : 0;
                  return (
                    <div key={i} className="mix-row">
                      <div className="mix-row-top">
                        <span className="mix-name" title={r.name}>{r.name}</span>
                        <span className="mix-value">{fmt(r.value)} MT <span className="mix-pct">{fmt(pct)}%</span></span>
                      </div>
                      <div className="mix-bar">
                        <div className="mix-fill" style={{ width: `${Math.min(100, pct)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="monthly-mix-note">
            Percentages are calculated against the selected month total. “Others” combines items outside Top 5.
          </div>
        </div>

        {/* DESKTOP GRID: RAW MATERIAL REORDER & PRODUCTION */}
        <div className="desktop-grid">
          {/* RAW MATERIAL REORDER */}
          <div className="card">
            <div className="card-title">
              <h2>📦 Raw Material Reorder</h2>
              <div className="flex items-center gap-2">
                <span>Tap material</span>
                <button
                  onClick={() => onNavigate('raw_materials')}
                  className="text-[10px] text-blue-600 font-bold hover:underline"
                >
                  All Items →
                </button>
              </div>
            </div>
            <div className="reorder-single-wrap">
              <div className="reorder-section-title">🌾 Raw Materials</div>
              <div className="stock-table">
                <div className="stock-head">
                  <span>Material / Avg Day</span>
                  <span>Stock</span>
                  <span>Cover</span>
                  <span>Status</span>
                </div>
                <div>
                  {sortedStockRows(rawMaterialsList).slice(0, 8).map((m) => {
                    const x = getMaterial(m);
                    const clVal = num(x?.closing) || 0;
                    const avg = avgConsumption(m);
                    const s = stockStatus(clVal, avg);
                    const symbol = s.status === 'REORDER' ? '🔴' : s.status === 'WATCH' ? '🟡' : '🟢';
                    return (
                      <div key={m} className="stock-row" onClick={() => openMaterialModal(m)}>
                        <div className="reorder-material-wrap">
                          <strong className="reorder-material">{m}</strong>
                          <small className="avg-under-material">Avg/day {avg ? fmt(avg) : '--'}</small>
                        </div>
                        <span>{fmt(clVal)} {x?.unit || 'MT'}</span>
                        <span className="cover-cell">{s.cover !== null ? `${fmt(s.cover)} d` : '--'}</span>
                        <span className={`status-symbol ${s.cls}`} title={s.status}>{symbol}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="reorder-section-title premix-section-title">🧪 Premixes</div>
              <div className="stock-table premix-reorder-table">
                <div className="stock-head">
                  <span>Material / Avg Day</span>
                  <span>Stock</span>
                  <span>Cover</span>
                  <span>Status</span>
                </div>
                <div>
                  {sortedStockRows(premixMaterialsList).slice(0, 6).map((m) => {
                    const x = getMaterial(m);
                    const clVal = num(x?.closing) || 0;
                    const avg = avgConsumption(m);
                    const s = stockStatus(clVal, avg);
                    const symbol = s.status === 'REORDER' ? '🔴' : s.status === 'WATCH' ? '🟡' : '🟢';
                    return (
                      <div key={m} className="stock-row" onClick={() => openMaterialModal(m)}>
                        <div className="reorder-material-wrap">
                          <strong className="reorder-material">{m}</strong>
                          <small className="avg-under-material">Avg/day {avg ? fmt(avg) : '--'}</small>
                        </div>
                        <span>{fmt(clVal)} {x?.unit || 'KG'}</span>
                        <span className="cover-cell">{s.cover !== null ? `${fmt(s.cover)} d` : '--'}</span>
                        <span className={`status-symbol ${s.cls}`} title={s.status}>{symbol}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* PRODUCTION */}
          <div className="card">
            <div className="card-title">
              <h2>🏭 Production</h2>
              <div className="flex items-center gap-2">
                <span>Actual output in Bags</span>
                <button
                  onClick={() => onNavigate('production')}
                  className="text-[10px] text-blue-600 font-bold hover:underline"
                >
                  Details →
                </button>
              </div>
            </div>
            <div className="production-total">{fmtBags(productionTotalBags)}</div>
            <div className="production-label">Actual Production Output</div>
            <div>
              {prodRows.slice(0, 8).map((r) => {
                const p = r.product;
                const a = num(r.actual_output);
                const op = num(r.output_percentage);
                const loss = num(r.process_loss);
                return (
                  <div key={p} className="production-row" onClick={() => openProductModal(p)}>
                    <div>
                      <div className="row-name">{p}</div>
                      <div className="prod-meta">
                        Output {op !== null ? `${fmt(op)}%` : '--'} • Loss {loss !== null ? `${fmt(loss)}%` : '--'}
                        {r.remarks ? ` • ${r.remarks}` : ''}
                      </div>
                    </div>
                    <div className="row-right">
                      <strong>{fmtBags(a)}</strong>
                      <small>Standard {fmtBags(r.standard_output)}</small>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* FEED UNIT */}
        <div className="card">
          <div className="card-title">
            <h2>🌾 Feed Unit</h2>
            <span>Product-wise details</span>
          </div>
          <div>
            {visibleFeedRows.map((r) => {
              const p = r.Product || r.product || '--';
              const prod = num(r.Production_Day_MT ?? r.production_day_mt);
              const disp = num(r.Dispatch_Day_MT ?? r.dispatch_day_mt);
              const close = num(r.Closing_Day_MT ?? r.closing_day_mt);
              return (
                <div key={p} className="feed-row" onClick={() => openProductModal(p)}>
                  <div>
                    <div className="row-name">{p}</div>
                    <div className="prod-meta">
                      Closing {fmtFeed(close, p)}
                      {feedClosingBagSize(p) !== null && close !== null && ` • ${fmtFeedClosingBags(close, p)}`}
                    </div>
                  </div>
                  <div className="row-right">
                    <strong>{fmtFeed(prod, p)}</strong>
                    <small>Dispatch {fmtFeed(disp, p)}</small>
                  </div>
                </div>
              );
            })}
            {feedRows.length > 10 && (
              <button className="more-toggle" onClick={() => setFeedUnitExpanded(!feedUnitExpanded)}>
                {feedUnitExpanded ? 'Show less ↑' : `More • ${feedRows.length - 10} more items ↓`}
              </button>
            )}
          </div>
        </div>

        {/* RAW MATERIAL MOVEMENTS */}
        <div className="card">
          <div className="card-title">
            <h2>📋 Raw Material Movements</h2>
            <span>Material-wise</span>
          </div>
          <div className="section-tabs">
            {['STOCK', 'CONSUMPTION', 'PURCHASE', 'TRANSFER', 'GAIN', 'SHORTAGE', 'SALE'].map((tab) => (
              <button
                key={tab}
                className={currentRawTab === tab ? 'active' : ''}
                onClick={() => {
                  setCurrentRawTab(tab);
                  setRawMovementExpanded(false);
                }}
              >
                {tab === 'PURCHASE' ? 'Received' : tab}
              </button>
            ))}
          </div>

          <div className="raw-movement-groups">
            {/* Raw materials column */}
            <div className="raw-movement-group">
              <div className="raw-movement-group-title">
                <strong>🌾 Raw Materials</strong>
                <span>{rawMaterialsList.length} items</span>
              </div>
              {rawMaterialsList
                .slice(0, rawMovementExpanded ? rawMaterialsList.length : 12)
                .map((m) => {
                  const val = rawTotal(m, currentRawTab);
                  const x = getMaterial(m);
                  return (
                    <div key={m} className="feed-row raw-movement-row" onClick={() => openMaterialModal(m)}>
                      <div className="row-name">{m}</div>
                      <div className="row-right">
                        <strong>{fmtMaterial(currentRawTab === 'STOCK' ? num(x?.closing) : val, m)}</strong>
                        <small>{currentRawTab} • tap</small>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Premix column */}
            <div className="raw-movement-group">
              <div className="raw-movement-group-title">
                <strong>🧪 Premixes</strong>
                <span>{premixMaterialsList.length} items</span>
              </div>
              {premixMaterialsList
                .slice(0, rawMovementExpanded ? premixMaterialsList.length : 12)
                .map((m) => {
                  const val = rawTotal(m, currentRawTab);
                  const x = getMaterial(m);
                  return (
                    <div key={m} className="feed-row raw-movement-row" onClick={() => openMaterialModal(m)}>
                      <div className="row-name">{m}</div>
                      <div className="row-right">
                        <strong>{fmtMaterial(currentRawTab === 'STOCK' ? num(x?.closing) : val, m, 'KG')}</strong>
                        <small>{currentRawTab} • tap</small>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
          {(rawMaterialsList.length > 12 || premixMaterialsList.length > 12) && (
            <button className="more-toggle" onClick={() => setRawMovementExpanded(!rawMovementExpanded)}>
              {rawMovementExpanded ? 'Show less ↑' : 'Show all movement items ↓'}
            </button>
          )}
        </div>

        {/* PP BAGS */}
        <div className="card">
          <div className="card-title">
            <h2>🛍 PP Bags</h2>
            <div className="flex items-center gap-2">
              <span>Tap product</span>
              <button
                onClick={() => onNavigate('pp_bags')}
                className="text-[10px] text-blue-600 font-bold hover:underline"
              >
                Packaging Module →
              </button>
            </div>
          </div>
          <div className="pp-grid">
            {ppBagRows.map((r, i) => (
              <div key={i} className="pp-item" onClick={() => openBagModal(r.product || 'PP Bags')}>
                <p>{r.product || 'PP Bags'}</p>
                <small className="pp-closing-label">Closing</small>
                <strong className="pp-closing-number">{fmt(r.closing)}</strong>
                <p>Issue {fmt(r.issue)} • Damage {fmt(r.damage)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* DATA QUALITY & HEALTH PANEL */}
        <div className="card control-card">
          <div className="card-title">
            <h2>🛡 Data Health &amp; Plant Quality</h2>
            <span>Quality • Accuracy • Issues</span>
          </div>
          <div className="control-grid">
            <button className="control-item" onClick={() => showToast('0 exact duplicates detected')}>
              <small>🔁 Duplicate Rows</small>
              <strong>0</strong>
            </button>
            <button className="control-item" onClick={() => showToast('0 unknown transactions')}>
              <small>❓ Unknown Trans</small>
              <strong>0</strong>
            </button>
            <button className="control-item" onClick={() => showToast('Continuity verified across daily runs')}>
              <small>🔗 Stock Continuity</small>
              <strong>Normal</strong>
            </button>
            <button className="control-item" onClick={() => showToast('Consumption tracking active')}>
              <small>⚠ Reorder Items</small>
              <strong>{reorderCount}</strong>
            </button>
            <button className="control-item" onClick={() => onNavigate('raw_materials')}>
              <small>📈 Active Materials</small>
              <strong>{materials.length}</strong>
            </button>
            <button className="control-item" onClick={() => onNavigate('reports')}>
              <small>🎯 Plant Coverage</small>
              <strong>100%</strong>
            </button>
          </div>
          <div className="health-strip" onClick={openNotificationsModal}>
            <span>⚠ Plant Alerts &amp; Checkpoints</span>
            <b>{alertsList.length}</b>
            <span>View details →</span>
          </div>
        </div>

        {/* TRENDS */}
        <div className="card" id="trendsSection">
          <div className="card-title">
            <h2>📊 Trends</h2>
            <span>Swipe charts →</span>
          </div>
          <div className="trend-wrapper">
            {/* 1. Material consumption */}
            <div className="trend-card">
              <div className="trend-header">
                <div>
                  <h3>📦 Raw Material Consumption</h3>
                  <small>Daily movement</small>
                </div>
                <select
                  value={selectedChartMat}
                  onChange={(e) => setSelectedChartMat(e.target.value)}
                >
                  {materials.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <canvas ref={canvasRefs.material} />
            </div>

            {/* 2. Purchase trend */}
            <div className="trend-card">
              <div className="trend-header">
                <div>
                  <h3>📥 Purchase / Received Trend</h3>
                  <small>Daily movement (MT)</small>
                </div>
              </div>
              <canvas ref={canvasRefs.purchase} />
            </div>

            {/* 3. Closing Stock trend */}
            <div className="trend-card">
              <div className="trend-header">
                <div>
                  <h3>📦 Closing Stock Trend</h3>
                  <small>Total inventory</small>
                </div>
              </div>
              <canvas ref={canvasRefs.closing} />
            </div>

            {/* 4. Production trend */}
            <div className="trend-card">
              <div className="trend-header">
                <div>
                  <h3>🏭 Production Trend</h3>
                  <small>Bags produced</small>
                </div>
              </div>
              <canvas ref={canvasRefs.production} />
            </div>

            {/* 5. Output % trend */}
            <div className="trend-card">
              <div className="trend-header">
                <div>
                  <h3>📈 Output % Trend</h3>
                  <small>Efficiency</small>
                </div>
              </div>
              <canvas ref={canvasRefs.output} />
            </div>

            {/* 6. Process Loss trend */}
            <div className="trend-card">
              <div className="trend-header">
                <div>
                  <h3>⚙ Process Loss Trend</h3>
                  <small>Moisture &amp; dust loss</small>
                </div>
              </div>
              <canvas ref={canvasRefs.loss} />
            </div>

            {/* 7. Feed unit */}
            <div className="trend-card">
              <div className="trend-header">
                <div>
                  <h3>🌾 Feed Unit Production / Dispatch</h3>
                  <small>Net output</small>
                </div>
              </div>
              <canvas ref={canvasRefs.feed} />
            </div>

            {/* 8. PP bags */}
            <div className="trend-card">
              <div className="trend-header">
                <div>
                  <h3>🛍 PP Bags Issue / Damage</h3>
                  <small>Packaging records</small>
                </div>
              </div>
              <canvas ref={canvasRefs.bag} />
            </div>
          </div>
        </div>
      </div>

      {/* Pop-up Modal */}
      {modalOpen && (
        <div className="modal show" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="modal-box">
            <div className="modal-head">
              <h2>{modalTitle}</h2>
              <button className="close" onClick={closeModal} aria-label="Close modal">×</button>
            </div>
            <div>{modalContent}</div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            left: '50%',
            bottom: '82px',
            transform: 'translateX(-50%)',
            background: '#202938',
            color: '#fff',
            padding: '9px 15px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: 600,
            zIndex: 900,
            boxShadow: '0 5px 20px rgba(0,0,0,0.25)',
          }}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
};
