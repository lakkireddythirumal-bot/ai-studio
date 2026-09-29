import React, { useState } from 'react';
import { usePlant, fmt } from '../context/PlantContext';
import { MaintenanceTask } from '../types/plant';
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  PlusCircle,
  Activity,
  Calendar,
  User,
  ShieldCheck,
  Zap,
  Filter
} from 'lucide-react';

export const MaintenancePage: React.FC = () => {
  const { maintenanceTasks, addMaintenanceTask, updateTaskStatus } = usePlant();
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [equipmentName, setEquipmentName] = useState('Pellet Mill #1 (CPM 7932 - 250 HP)');
  const [equipmentCode, setEquipmentCode] = useState('PM-01');
  const [area, setArea] = useState('Pelleting Section');
  const [type, setType] = useState<MaintenanceTask['type']>('Preventive');
  const [priority, setPriority] = useState<MaintenanceTask['priority']>('High');
  const [scheduledDate, setScheduledDate] = useState('2026-10-02');
  const [assignedTo, setAssignedTo] = useState('K. Srinivas Rao');
  const [downtimeMinutes, setDowntimeMinutes] = useState('30');
  const [description, setDescription] = useState('Check roller shells, grease main bearings, inspect die clamp wear');

  const filteredTasks = maintenanceTasks.filter((t) => {
    const matchesType = filterType === 'ALL' || t.type === filterType;
    const matchesStatus = filterStatus === 'ALL' || t.status === filterStatus;
    return matchesType && matchesStatus;
  });

  const pendingCount = maintenanceTasks.filter((t) => t.status === 'Pending').length;
  const inProgressCount = maintenanceTasks.filter((t) => t.status === 'In Progress').length;
  const completedCount = maintenanceTasks.filter((t) => t.status === 'Completed').length;
  const totalDowntime = maintenanceTasks.reduce((sum, t) => sum + (t.downtimeMinutes || 0), 0);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    addMaintenanceTask({
      equipmentName,
      equipmentCode,
      area,
      type,
      priority,
      scheduledDate,
      status: 'Pending',
      assignedTo,
      downtimeMinutes: Number(downtimeMinutes) || 0,
      description,
      lastServiced: new Date().toISOString().slice(0, 10),
    });
    setShowAddModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-orange-50 text-orange-700 rounded-xl text-xl">⚙️</span>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Plant Machinery &amp; Maintenance Management
            </h1>
            <p className="text-xs text-slate-500">
              CPM Pellet Mills, Fine Hammer Mills, 2-Ton Mixers, Forbes Marshall Boilers &amp; Preventive PM Schedules
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Work Order / Breakdown</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Plant OEE &amp; Availability</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700 tabular-nums">
            96.8 %
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            Plant Uptime Benchmark &gt; 95%
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Active Work Orders</span>
            <Clock className="w-4 h-4 text-orange-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-orange-700 tabular-nums">
            {pendingCount + inProgressCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {inProgressCount} in progress • {pendingCount} scheduled
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Completed PM Tasks</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-blue-700 tabular-nums">
            {completedCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Inspected &amp; signed off
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Logged Downtime</span>
            <AlertTriangle className="w-4 h-4 text-slate-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 tabular-nums">
            {totalDowntime} <span className="text-xs font-bold text-slate-500">Mins</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            ≈ {fmt(totalDowntime / 60)} hrs total maintenance time
          </div>
        </div>
      </div>

      {/* Equipment Registry Quick Status */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
        <h2 className="text-sm sm:text-base font-extrabold text-slate-900 mb-3 flex items-center gap-2">
          <span>🏭</span> Key Machinery Status
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { name: 'Pellet Mill #1 (CPM 7932)', status: 'OPERATIONAL', load: '86% Load', temp: '84.5°C', icon: '⚡' },
            { name: 'Pellet Mill #2 (Andritz FeedMax)', status: 'OPERATIONAL', load: '78% Load', temp: '82.0°C', icon: '⚡' },
            { name: 'Hammer Mill #1 (8 TPH)', status: 'OPERATIONAL', load: '91% Load', temp: 'Vibration 2.1mm/s', icon: '🔨' },
            { name: 'Steam Boiler (2 TPH 10 Bar)', status: 'OPERATIONAL', load: '8.4 Bar', temp: 'TDS Normal', icon: '🔥' },
          ].map((eq) => (
            <div key={eq.name} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between">
                <span className="text-lg">{eq.icon}</span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {eq.status}
                </span>
              </div>
              <strong className="block text-xs font-bold text-slate-900 mt-2">{eq.name}</strong>
              <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                <span>{eq.load}</span>
                <span>{eq.temp}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Work Orders & Preventive Schedules Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="font-extrabold text-slate-900 text-sm sm:text-base">
              Work Orders &amp; Preventive Maintenance Schedules
            </h2>
            <p className="text-xs text-slate-500">
              Tap any task status to advance: Pending &rarr; In Progress &rarr; Completed
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-semibold text-slate-700 outline-none"
            >
              <option value="ALL">All Maintenance Types</option>
              <option value="Preventive">Preventive PM</option>
              <option value="Breakdown">Breakdown</option>
              <option value="Calibration">Calibration</option>
              <option value="Overhaul">Overhaul</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-semibold text-slate-700 outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
              <tr>
                <th className="py-3 px-4">Equipment &amp; Code</th>
                <th className="py-3 px-4">Type &amp; Priority</th>
                <th className="py-3 px-4">Description of Work</th>
                <th className="py-3 px-4">Scheduled Date</th>
                <th className="py-3 px-4">Engineer</th>
                <th className="py-3 px-4 text-right">Downtime</th>
                <th className="py-3 px-4 text-center">Status (Click to toggle)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.map((t) => {
                const isPending = t.status === 'Pending';
                const isInProgress = t.status === 'In Progress';
                const isCompleted = t.status === 'Completed';

                const nextStatus: MaintenanceTask['status'] = isPending
                  ? 'In Progress'
                  : isInProgress
                  ? 'Completed'
                  : 'Pending';

                return (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <strong className="block text-slate-900 font-bold">{t.equipmentName}</strong>
                      <span className="text-[10px] font-mono text-slate-400">{t.equipmentCode} • {t.area}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{t.type}</div>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          t.priority === 'Critical'
                            ? 'bg-red-100 text-red-700'
                            : t.priority === 'High'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs">
                      {t.description}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {t.scheduledDate}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {t.assignedTo}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                      {t.downtimeMinutes} min
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => updateTaskStatus(t.id, nextStatus)}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold cursor-pointer transition-all active:scale-95 ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : isInProgress
                            ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                            : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        }`}
                        title="Click to advance status"
                      >
                        {isCompleted && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {isInProgress && <Zap className="w-3 h-3 text-blue-600 animate-pulse" />}
                        {isPending && <Clock className="w-3 h-3 text-amber-600" />}
                        <span>{t.status}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!filteredTasks.length && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No maintenance tasks found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <span>🔧</span> Create Maintenance Work Order
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Equipment Name</label>
                <select
                  value={equipmentName}
                  onChange={(e) => {
                    setEquipmentName(e.target.value);
                    if (e.target.value.includes('Pellet Mill #1')) {
                      setEquipmentCode('PM-01');
                      setArea('Pelleting Section');
                    } else if (e.target.value.includes('Hammer Mill')) {
                      setEquipmentCode('HM-01');
                      setArea('Grinding Section');
                    } else if (e.target.value.includes('Boiler')) {
                      setEquipmentCode('BLR-01');
                      setArea('Utilities');
                    } else {
                      setEquipmentCode('MX-01');
                      setArea('Mixing');
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                >
                  <option value="Pellet Mill #1 (CPM 7932 - 250 HP)">Pellet Mill #1 (CPM 7932 - 250 HP)</option>
                  <option value="Pellet Mill #2 (Andritz FeedMax - 200 HP)">Pellet Mill #2 (Andritz FeedMax - 200 HP)</option>
                  <option value="Hammer Mill #1 (Fine Grinder 8 TPH)">Hammer Mill #1 (Fine Grinder 8 TPH)</option>
                  <option value="Forbes Marshall Steam Boiler (2 TPH)">Forbes Marshall Steam Boiler (2 TPH)</option>
                  <option value="Batch Ribbon Mixer (2 Ton Capacity)">Batch Ribbon Mixer (2 Ton Capacity)</option>
                  <option value="Bucket Elevator #3 (Finished Feed)">Bucket Elevator #3 (Finished Feed)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Maintenance Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as typeof type)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  >
                    <option value="Preventive">Preventive</option>
                    <option value="Breakdown">Breakdown</option>
                    <option value="Calibration">Calibration</option>
                    <option value="Overhaul">Overhaul</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as typeof priority)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estimated Downtime (mins)</label>
                  <input
                    type="number"
                    value={downtimeMinutes}
                    onChange={(e) => setDowntimeMinutes(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Engineer / Tech</label>
                <input
                  type="text"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Job Description &amp; Actions</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  placeholder="Details of inspection, parts replacement, lubrication..."
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
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-xs"
                >
                  Create Work Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
