import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        {/* Sleek, glowing loading spinner */}
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          <div className="absolute w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin animation-delay-150"></div>
        </div>
        <p className="mt-4 text-slate-400 font-medium tracking-wide animate-pulse">
          Authenticating user...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Save location to redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    // Patient trying to access admin pages -> redirect to patient dashboard
    return <Navigate to="/patient/dashboard" replace />;
  }

  if (!requireAdmin && isAdmin) {
    // Admin trying to access patient pages -> redirect to admin dashboard
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
