import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import { Lock, Smartphone, ShieldAlert, KeyRound, UserCheck, Shield } from 'lucide-react';

const Login = () => {
  const { login, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [role, setRole] = useState('admin'); // 'admin' or 'patient'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      const defaultPath = isAdmin ? '/admin/dashboard' : '/patient/dashboard';
      const from = location.state?.from?.pathname || defaultPath;
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isAdmin, navigate, location]);

  // Check if session expired url parameter exists
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('expired')) {
      setErrorMsg('Your session has expired. Please sign in again.');
      toast.warning('Session expired. Please log in again.');
    }
  }, [location, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMsg('Please enter both username/phone/email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const profile = await login(username, password, role);
      toast.success(`Successfully logged in as ${profile.is_admin ? 'Admin' : 'Patient'}.`);
      
      const defaultPath = profile.is_admin ? '/admin/dashboard' : '/patient/dashboard';
      const from = location.state?.from?.pathname || defaultPath;
      // If patient tries to navigate to admin path, override to patient dashboard
      const finalPath = (!profile.is_admin && from.startsWith('/admin')) ? '/patient/dashboard' : from;
      
      navigate(finalPath, { replace: true });
    } catch (err) {
      console.error(err);
      const serverError = err.response?.data?.detail || 'Incorrect username, email, or password.';
      setErrorMsg(serverError);
      toast.error(serverError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background ambient glowing spheres */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-green-600/5 blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-emerald-600/5 blur-3xl"></div>

      <div className="w-full max-w-md z-10 animate-fade-in">
        {/* Portal branding */}
        <div className="flex flex-col items-center mb-6">
          <Link to="/" className="flex flex-col items-center group">
            <div className="w-14 h-14 rounded-2xl bg-green-600 flex items-center justify-center shadow-sm mb-4 group-hover:scale-105 transition-transform duration-300">
              <KeyRound className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">HealthGuard</h2>
            <p className="text-sm text-slate-500 mt-1.5 font-medium">Public Health & Vaccination Platform</p>
          </Link>
        </div>

        {/* Login form card */}
        <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-xl shadow-slate-200/50">
          
          {/* Role selector tab (Capsule bar) */}
          <div className="flex flex-col sm:flex-row bg-slate-100 p-1.5 rounded-2xl border border-slate-200 mb-6 gap-1.5 sm:gap-0">
            <button
              type="button"
              onClick={() => {
                setRole('admin');
                setErrorMsg('');
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                role === 'admin'
                  ? 'bg-white text-green-700 shadow-sm border border-slate-200/30'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Shield className="w-4 h-4" />
              Administrative
            </button>
            <button
              type="button"
              onClick={() => {
                setRole('patient');
                setErrorMsg('');
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                role === 'patient'
                  ? 'bg-white text-green-700 shadow-sm border border-slate-200/30'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Patient Portal
            </button>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 flex gap-3 text-rose-600 text-xs font-medium leading-normal animate-fade-in">
              <ShieldAlert className="w-5 h-5 shrink-0 text-rose-550" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                {role === 'admin' ? 'Phone Number or Username' : 'Email Address or Phone'}
              </label>
              <div className="relative">
                <Smartphone className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder={role === 'admin' ? 'e.g. +1234567890 or admin' : 'e.g. patient@example.com or +1234567890'}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-green-600 focus:bg-white transition-all text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-green-600 focus:bg-white transition-all text-sm font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-3 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Logging in...
                </>
              ) : (
                role === 'admin' ? 'Sign In to Admin Dashboard' : 'Sign In to Patient Portal'
              )}
            </button>
          </form>

          {role === 'patient' && (
            <div className="mt-6 text-center">
              <p className="text-xs text-slate-500 font-medium">
                New to the platform?{' '}
                <Link to="/signup" className="text-green-600 font-bold hover:text-green-700 hover:underline">
                  Create a Patient Account
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
