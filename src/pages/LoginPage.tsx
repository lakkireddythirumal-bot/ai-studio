import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User } from '../types/plant';
import { ShieldCheck, ArrowRight, Lock, User as UserIcon, CheckCircle2 } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<User['role']>('Plant Manager');
  const [plantLocation, setPlantLocation] = useState('Khammam Feed Plant Unit-1');
  const [username, setUsername] = useState('thirumal.reddy');
  const [password, setPassword] = useState('••••••••••');
  const [rememberMe, setRememberMe] = useState(true);

  const roleProfiles: Array<{
    role: User['role'];
    name: string;
    description: string;
    icon: string;
  }> = [
    {
      role: 'Plant Manager',
      name: 'L. Thirumal Reddy',
      description: 'Full oversight: Production, Inventory, Premix, Maintenance & MIS',
      icon: '🏭',
    },
    {
      role: 'Production Incharge',
      name: 'R. Rajesh Kumar',
      description: 'Batch runs, pellet mill outputs, process loss & shift logs',
      icon: '⚙️',
    },
    {
      role: 'Maintenance Engineer',
      name: 'K. Srinivas Rao',
      description: 'Equipment health, preventive maintenance & spare parts inventory',
      icon: '🔧',
    },
    {
      role: 'Stores Manager',
      name: 'V. Murali Krishna',
      description: 'Raw materials receipt, Bommakal premixes & PP bag stocks',
      icon: '📦',
    },
  ];

  const handleRoleSelect = (r: User['role']) => {
    setSelectedRole(r);
    const profile = roleProfiles.find((p) => p.role === r);
    if (profile) {
      setUsername(profile.name.toLowerCase().replace(/[^a-z]/g, '.'));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const profile = roleProfiles.find((p) => p.role === selectedRole);
    login(selectedRole, plantLocation, profile?.name);
    onLoginSuccess();
  };

  const handleQuickLogin = (role: User['role']) => {
    handleRoleSelect(role);
    const profile = roleProfiles.find((p) => p.role === role);
    login(role, plantLocation, profile?.name);
    onLoginSuccess();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Plant Badge */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-xl text-3xl mb-3">
          🏭
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Feed Plant Manager
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-300">
          Plant Operations, Inventory & Maintenance Control System
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-100">
          
          {/* Plant Unit selector */}
          <div className="mb-5 pb-4 border-b border-slate-100">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Manufacturing Facility / Unit
            </label>
            <select
              value={plantLocation}
              onChange={(e) => setPlantLocation(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800"
            >
              <option value="Khammam Feed Plant Unit-1">Khammam Feed Plant • Unit 1 (Broiler & Layer Feeds)</option>
              <option value="Bommakal Premix Unit">Bommakal Central Premix & Micro-ingredients Facility</option>
              <option value="Warangal Feed Mill">Warangal Feed Mill • Unit 2 (Mash & Pellets)</option>
            </select>
          </div>

          {/* Quick Role Selection Cards */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              Select Operating Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              {roleProfiles.map((p) => {
                const isSelected = selectedRole === p.role;
                return (
                  <button
                    type="button"
                    key={p.role}
                    onClick={() => handleRoleSelect(p.role)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-1 ring-blue-600'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xl">{p.icon}</span>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      )}
                    </div>
                    <div className="mt-1 font-bold text-xs text-slate-900 leading-tight">
                      {p.role}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                      {p.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Username / Officer ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800"
                  placeholder="e.g. thirumal.reddy"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800"
                  placeholder="••••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <span>Remember session</span>
              </label>
              <span className="text-slate-400 text-[11px]">Authorized plant personnel only</span>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>Sign In as {selectedRole}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Sign In as Plant Manager shortcut */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px]">Instant Access:</span>
            <button
              type="button"
              onClick={() => handleQuickLogin('Plant Manager')}
              className="font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
            >
              <span>1-Click Enter as Plant Manager</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Security / System Footer */}
        <div className="mt-4 text-center text-[11px] text-slate-400 flex items-center justify-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Feed Mill SCADA &amp; ERP Synchronization Active</span>
        </div>
      </div>
    </div>
  );
};
