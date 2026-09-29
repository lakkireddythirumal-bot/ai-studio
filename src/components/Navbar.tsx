import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePlant } from '../context/PlantContext';
import {
  LayoutDashboard,
  Factory,
  Boxes,
  FlaskConical,
  ShoppingBag,
  Wrench,
  Cog,
  FileSpreadsheet,
  LogOut,
  Calendar,
  RotateCw,
  Menu,
  X,
  Bell,
  Search
} from 'lucide-react';

export type PageId =
  | 'login'
  | 'dashboard'
  | 'production'
  | 'raw_materials'
  | 'premix'
  | 'pp_bags'
  | 'maintenance'
  | 'spare_parts'
  | 'reports';

interface NavbarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  onOpenSearch?: () => void;
  onOpenNotifications?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  onOpenSearch,
  onOpenNotifications,
}) => {
  const { currentUser, logout } = useAuth();
  const { status, refreshData, isLoading, viewDate, setViewDate, getAvailableDates, data } = usePlant();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);

  const navItems: Array<{ id: PageId; label: string; icon: React.ReactNode; count?: number }> = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'production', label: 'Production', icon: <Factory className="w-4 h-4" /> },
    { id: 'raw_materials', label: 'Raw Materials', icon: <Boxes className="w-4 h-4" /> },
    { id: 'premix', label: 'Premix', icon: <FlaskConical className="w-4 h-4" /> },
    { id: 'pp_bags', label: 'PP Bags', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'maintenance', label: 'Maintenance', icon: <Wrench className="w-4 h-4" /> },
    { id: 'spare_parts', label: 'Spare Parts', icon: <Cog className="w-4 h-4" /> },
    { id: 'reports', label: 'Reports', icon: <FileSpreadsheet className="w-4 h-4" /> },
  ];

  const availableDates = getAvailableDates();
  const displayDate = viewDate || data.report_date || 'Latest';

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
            
            {/* Left: Brand */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => onNavigate('dashboard')}
                className="flex items-center gap-2 text-left group"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
                  🏭
                </div>
                <div>
                  <div className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 flex items-center gap-1.5">
                    Feed Plant Manager
                  </div>
                  <div className="text-[10px] text-slate-500 hidden sm:block">
                    {currentUser?.plant || 'Khammam Control Center'}
                  </div>
                </div>
              </button>
            </div>

            {/* Middle: Desktop Nav Items */}
            <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-1">
              {navItems.map((item) => {
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/60 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Right: Actions, Date, Status & Profile */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              
              {/* Date dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-semibold text-slate-700 transition-colors"
                  title="Change Plant Date"
                >
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span className="hidden sm:inline">{displayDate}</span>
                  <span className="sm:hidden text-[10px]">{displayDate.slice(5) || 'Date'}</span>
                </button>

                {dateDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs">
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Select Plant Date
                    </div>
                    <button
                      onClick={() => {
                        setViewDate(null);
                        setDateDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center justify-between ${
                        !viewDate ? 'font-bold text-blue-600 bg-blue-50/50' : 'text-slate-700'
                      }`}
                    >
                      <span>Latest / Today</span>
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">LIVE</span>
                    </button>
                    <div className="border-t border-slate-100 my-1" />
                    <div className="max-h-52 overflow-y-auto">
                      {availableDates.map((d) => (
                        <button
                          key={d}
                          onClick={() => {
                            setViewDate(d);
                            setDateDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center justify-between ${
                            viewDate === d ? 'font-bold text-blue-600 bg-blue-50/50' : 'text-slate-700'
                          }`}
                        >
                          <span>{d}</span>
                          {d === data.report_date && (
                            <span className="text-[9px] text-slate-400">API latest</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Refresh Button */}
              <button
                onClick={() => refreshData()}
                disabled={isLoading}
                title={`Live sync status: ${status.message}`}
                className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors disabled:opacity-50"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
              </button>

              {/* Search shortcut button */}
              {onOpenSearch && (
                <button
                  onClick={onOpenSearch}
                  className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors"
                  title="Search Materials & Products"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Notification button */}
              {onOpenNotifications && (
                <button
                  onClick={onOpenNotifications}
                  className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors relative"
                  title="View Alerts"
                >
                  <Bell className="w-3.5 h-3.5" />
                </button>
              )}

              {/* User profile & Logout */}
              {currentUser && (
                <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-200">
                  <div className="hidden md:block text-right">
                    <div className="text-xs font-bold text-slate-800 leading-tight">
                      {currentUser.name}
                    </div>
                    <div className="text-[10px] text-blue-600 font-semibold leading-tight">
                      {currentUser.role}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      onNavigate('login');
                    }}
                    title="Sign out"
                    className="w-8 h-8 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Mobile menu hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-700"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-3 py-3 shadow-lg animate-in slide-in-from-top-2 duration-150">
            <div className="grid grid-cols-2 gap-1.5">
              {navItems.map((item) => {
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'text-slate-700 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {currentUser && (
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 px-1">
                <div>
                  <span className="font-bold text-slate-800">{currentUser.name}</span>
                  <span className="text-[10px] text-blue-600 block">{currentUser.role}</span>
                </div>
                <button
                  onClick={() => {
                    logout();
                    onNavigate('login');
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-1 text-red-600 hover:text-red-700 font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Floating Bottom Nav for Mobile / Thumb Access */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 py-1 px-2 flex justify-around items-center shadow-lg">
        {[
          { id: 'dashboard' as PageId, label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
          { id: 'production' as PageId, label: 'Production', icon: <Factory className="w-4 h-4" /> },
          { id: 'raw_materials' as PageId, label: 'Materials', icon: <Boxes className="w-4 h-4" /> },
          { id: 'premix' as PageId, label: 'Premix', icon: <FlaskConical className="w-4 h-4" /> },
          { id: 'maintenance' as PageId, label: 'Maintenance', icon: <Wrench className="w-4 h-4" /> },
          { id: 'reports' as PageId, label: 'Reports', icon: <FileSpreadsheet className="w-4 h-4" /> },
        ].map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center py-1 px-1.5 text-[10px] font-medium transition-colors ${
                isActive ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {item.icon}
              <span className="mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
