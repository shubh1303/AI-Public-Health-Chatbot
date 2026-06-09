import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { useToast } from '../components/Toast';
import { 
  Users, 
  Search, 
  UserCheck, 
  UserX, 
  CalendarPlus, 
  ShieldAlert, 
  Mail, 
  Smartphone,
  Eye
} from 'lucide-react';

const AdminUsers = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(null); // stores user.id of current status toggle

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await authService.getUsers(0, 200);
      setUsers(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load user directory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (user) => {
    setActionLoading(user.id);
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await authService.updateUserStatus(user.id, newStatus);
      toast.success(`User '${user.name}' status set to ${newStatus}.`);
      // Update local state
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.detail || "Failed to update user status.";
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(u => {
    const term = searchTerm.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(term)) ||
      (u.phone_number && u.phone_number.includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term))
    );
  });

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-green-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-semibold text-xs animate-pulse">Loading registered patients...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">User Management</h2>
          <p className="text-slate-500 text-xs mt-1 font-semibold">
            Monitor and manage patient authentication credentials and clinic status logs.
          </p>
        </div>
        <div className="relative w-full md:w-80 shrink-0">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, phone, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-green-600 transition-all text-xs font-semibold shadow-sm focus:ring-2 focus:ring-green-500/25"
          />
        </div>
      </div>

      {/* Database listings */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 m-6 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
              <Users className="w-6 h-6" />
            </div>
            <h5 className="text-sm font-bold text-slate-900">No matching patients found</h5>
            <p className="text-xs text-slate-500 mt-1 mb-4 max-w-xs leading-normal">
              We couldn't find any user matching your search term. Try checking for typos or clear search parameters.
            </p>
            <button
              onClick={() => setSearchTerm('')}
              className="px-4 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all shadow-sm active:scale-95"
            >
              Reset Search Filter
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4 pl-6">Name</th>
                  <th className="p-4">Contact Info</th>
                  <th className="p-4">Preferred Language</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700 text-xs">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="p-4 pl-6">
                      <p className="text-slate-900 font-bold">{u.name || 'Unnamed'}</p>
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5">{u.id}</p>
                    </td>
                    <td className="p-4 space-y-1">
                      <span className="flex items-center gap-1.5 text-slate-800">
                        <Smartphone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {u.phone_number || 'N/A'}
                      </span>
                      {u.email && (
                        <span className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {u.email}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-600 font-bold text-[10px] uppercase">
                        {u.language_preference || 'en'}
                      </span>
                    </td>
                    <td className="p-4">
                      {u.is_admin ? (
                        <span className="inline-flex items-center gap-1 text-indigo-700 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          Administrator
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full text-[10px]">
                          Patient
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        u.status === 'active'
                          ? 'bg-green-50 border-green-150 text-green-700'
                          : 'bg-rose-50 border-rose-150 text-rose-700'
                      }`}>
                        {u.status || 'active'}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Schedule Vaccine Action (Only for non-admins) */}
                        {!u.is_admin && (
                          <button
                            onClick={() => navigate(`/admin/schedule?userId=${u.id}`)}
                            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-green-50 text-slate-700 hover:text-green-700 transition-all hover:border-green-200 shadow-sm"
                            title="Schedule Vaccination"
                          >
                            <CalendarPlus className="w-4 h-4 text-green-600" />
                          </button>
                        )}
                        
                        {/* Toggle active status toggle (Admins can't disable themselves) */}
                        {u.is_admin ? (
                          <span className="text-[10px] text-slate-400 font-mono italic pr-2 font-bold">Protected</span>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(u)}
                            disabled={actionLoading === u.id}
                            className={`p-2 rounded-xl border transition-all shadow-sm bg-white ${
                              u.status === 'active'
                                ? 'border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-rose-600'
                                : 'border-slate-200 hover:bg-green-50 hover:border-green-200 text-green-600'
                            }`}
                            title={u.status === 'active' ? 'Disable Account' : 'Reactivate Account'}
                          >
                            {actionLoading === u.id ? (
                              <div className="w-4 h-4 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin"></div>
                            ) : u.status === 'active' ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminUsers;
