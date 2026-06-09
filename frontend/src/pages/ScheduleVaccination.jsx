import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import vaccinationService from '../services/vaccinationService';
import authService from '../services/authService';
import { useToast } from '../components/Toast';
import { Calendar, Syringe, User, Hash, AlertTriangle, ArrowLeft } from 'lucide-react';

const ScheduleVaccination = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Form fields
  const [selectedUserId, setSelectedUserId] = useState('');
  const [customUserId, setCustomUserId] = useState('');
  const [useCustomId, setUseCustomId] = useState(false);
  
  const [vaccineName, setVaccineName] = useState('');
  const [doseNumber, setDoseNumber] = useState(1);
  const [scheduledDate, setScheduledDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0] // Default to tomorrow
  );
  
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch users directory on load to populate selector dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const usersList = await authService.getUsers(0, 150);
        setUsers(usersList);
        
        // Parse preselected userId from query params
        const queryParams = new URLSearchParams(location.search);
        const preselectedUserId = queryParams.get('userId');
        
        if (preselectedUserId) {
          const userExists = usersList.some(u => u.id === preselectedUserId);
          if (userExists) {
            setSelectedUserId(preselectedUserId);
            setUseCustomId(false);
          } else {
            setCustomUserId(preselectedUserId);
            setUseCustomId(true);
          }
        } else if (usersList.length > 0) {
          setSelectedUserId(usersList[0].id);
        }
      } catch (error) {
        console.error("Failed to load user directories:", error);
        toast.warning("Failed to retrieve patient registry dropdown. Direct ID input enabled.");
        setUseCustomId(true);
        
        const queryParams = new URLSearchParams(location.search);
        const preselectedUserId = queryParams.get('userId');
        if (preselectedUserId) {
          setCustomUserId(preselectedUserId);
        }
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const targetUserId = useCustomId ? customUserId.trim() : selectedUserId;

    if (!targetUserId) {
      setErrorMsg('Please specify a valid Patient ID.');
      return;
    }
    if (!vaccineName.trim()) {
      setErrorMsg('Vaccine name is required.');
      return;
    }
    if (doseNumber < 1) {
      setErrorMsg('Dose number must be a positive integer.');
      return;
    }
    if (!scheduledDate) {
      setErrorMsg('Scheduled date is required.');
      return;
    }

    // Basic UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(targetUserId)) {
      setErrorMsg('Invalid Patient ID UUID format. Enter a valid UUID (e.g. 12345678-abcd-1234-abcd-123456789abc).');
      return;
    }

    setSubmitting(true);
    try {
      await vaccinationService.schedule({
        user_id: targetUserId,
        vaccine_name: vaccineName.trim(),
        dose_number: Number(doseNumber),
        scheduled_date: scheduledDate
      });
      toast.success(`Successfully scheduled ${vaccineName} (Dose ${doseNumber}) for date ${scheduledDate}!`);
      navigate('/admin/vaccinations');
    } catch (error) {
      console.error(error);
      const serverError = error.response?.data?.detail || 'Failed to record schedule. Verify patient ID exists.';
      setErrorMsg(serverError);
      toast.error(serverError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 pb-6 border-b border-slate-200">
        <button
          onClick={() => navigate(-1)}
          className="p-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-all active:scale-95 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Schedule Vaccination</h2>
          <p className="text-xs text-slate-505 mt-1 font-semibold">Create vaccination schedule reminder entry in database</p>
        </div>
      </div>

      <div className="max-w-2xl bg-white border border-slate-200 p-6 md:p-8 rounded-3xl shadow-sm">
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 flex gap-3 text-rose-600 text-xs font-semibold leading-normal animate-fade-in">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-550" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User ID Section */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Patient / User ID (UUID)
              </label>
              {users.length > 0 && (
                <button
                  type="button"
                  onClick={() => setUseCustomId(!useCustomId)}
                  className="text-xs text-green-600 font-bold hover:text-green-700 transition-colors"
                >
                  {useCustomId ? 'Select Registered User' : 'Input Custom UUID'}
                </button>
              )}
            </div>

            {useCustomId ? (
              <div className="relative">
                <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                  value={customUserId}
                  onChange={(e) => setCustomUserId(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-green-600 focus:bg-white transition-all text-sm font-mono font-medium"
                />
              </div>
            ) : (
              <div className="relative">
                <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                {loadingUsers ? (
                  <div className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 text-sm">
                    Fetching user registry...
                  </div>
                ) : (
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-green-600 focus:bg-white transition-all text-sm appearance-none font-semibold"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name || 'Unnamed User'} ({u.phone_number || 'No Phone'}) - {u.id.substring(0, 8)}...
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
            <p className="text-[10px] text-slate-450 italic font-semibold">
              Vaccination must be assigned to an existing patient register ID in the backend database.
            </p>
          </div>

          {/* Vaccine Name */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Vaccine Name
            </label>
            <div className="relative">
              <Syringe className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
              <input
                type="text"
                required
                placeholder="e.g. Polio (OPV), BCG, COVID-19"
                value={vaccineName}
                onChange={(e) => setVaccineName(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-green-600 focus:bg-white transition-all text-sm font-semibold"
              />
            </div>
          </div>

          {/* Dose Number & Scheduled Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Dose Number
              </label>
              <div className="relative">
                <Hash className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="number"
                  required
                  min="1"
                  value={doseNumber}
                  onChange={(e) => setDoseNumber(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-green-600 focus:bg-white transition-all text-sm font-semibold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Scheduled Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="date"
                  required
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-green-600 focus:bg-white transition-all text-sm font-semibold"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/admin/vaccinations')}
              className="flex-1 py-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm transition-all bg-white shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm shadow-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Scheduling...
                </>
              ) : (
                'Save Schedule'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleVaccination;
