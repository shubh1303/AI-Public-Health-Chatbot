import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from './Toast';
import { 
  LayoutDashboard, 
  CalendarPlus, 
  TableProperties, 
  MessageSquare, 
  LogOut, 
  Menu, 
  X, 
  UserCheck,
  Users
} from 'lucide-react';

const Layout = () => {
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Successfully logged out of portal.');
    navigate('/');
  };

  const adminNavItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Schedule Vaccine', path: '/admin/schedule', icon: CalendarPlus },
    { label: 'Vaccination Records', path: '/admin/vaccinations', icon: TableProperties },
    { label: 'Interactive Chatbot', path: '/admin/chatbot', icon: MessageSquare },
  ];

  const patientNavItems = [
    { label: 'Dashboard', path: '/patient/dashboard', icon: LayoutDashboard },
    { label: 'Interactive Chatbot', path: '/patient/chatbot', icon: MessageSquare },
  ];

  const navItems = isAdmin ? adminNavItems : patientNavItems;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row antialiased">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:w-64 shrink-0 flex-col bg-white border-r border-slate-200">
        {/* Brand/Logo Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-200 gap-2.5 bg-white">
          <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center font-bold text-white shadow-sm">
            H
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide text-slate-900 leading-none">HealthGuard</h1>
            <span className="text-[10px] text-slate-500 font-semibold tracking-widest uppercase">
              {isAdmin ? 'Admin Console' : 'Patient Portal'}
            </span>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 bg-white">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 group ${
                  isActive 
                    ? 'bg-green-50 text-green-700' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-green-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer profile & logout */}
        <div className="p-4 border-t border-slate-200 bg-slate-100/70">
          <div className="flex items-center gap-3 px-2 py-3">
            <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-green-700" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">{user?.name || (isAdmin ? 'Admin' : 'Patient')}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email || user?.phone_number || 'Authenticated'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full mt-2.5 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-all text-xs font-bold text-slate-700 shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-green-600 flex items-center justify-center font-bold text-white text-xs">
            H
          </div>
          <h1 className="text-sm font-bold text-slate-900 tracking-wide">HealthGuard</h1>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1 text-slate-500 hover:text-slate-900"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Drawer menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-white z-10 flex flex-col p-6 animate-fade-in border-t border-slate-200">
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-base font-bold transition-all ${
                    isActive 
                      ? 'bg-green-50 text-green-700' 
                      : 'text-slate-650 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          
          <div className="pt-6 border-t border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{user?.name || (isAdmin ? 'Admin User' : 'Patient')}</p>
                <p className="text-xs text-slate-500">{user?.email || user?.phone_number}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-colors font-bold text-sm shadow-sm"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main content wrapper */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-y-auto">
        <div className="flex-1 p-4 sm:p-6 md:p-10 max-w-7xl w-full mx-auto">
          {/* Outlet handles nested page rendering */}
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
