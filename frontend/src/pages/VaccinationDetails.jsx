import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import vaccinationService from '../services/vaccinationService';
import { useToast } from '../components/Toast';
import { 
  ArrowLeft, 
  Save, 
  Calendar, 
  Syringe, 
  Hash, 
  User, 
  Send, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  Trash2
} from 'lucide-react';

const VaccinationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Loaded record state
  const [record, setRecord] = useState(null);

  // Editable Form states
  const [vaccineName, setVaccineName] = useState('');
  const [doseNumber, setDoseNumber] = useState(1);
  const [scheduledDate, setScheduledDate] = useState('');
  const [administeredDate, setAdministeredDate] = useState('');
  const [notificationSent, setNotificationSent] = useState(false);
  
  // Custom toggles
  const [isMarkedAdministered, setIsMarkedAdministered] = useState(false);

  const fetchRecord = async () => {
    setLoading(true);
    try {
      const data = await vaccinationService.getVaccinationById(id);
      setRecord(data);
      
      // Seed forms
      setVaccineName(data.vaccine_name);
      setDoseNumber(data.dose_number);
      setScheduledDate(data.scheduled_date);
      setAdministeredDate(data.administered_date || '');
      setNotificationSent(data.notification_sent);
      setIsMarkedAdministered(!!data.administered_date);
    } catch (error) {
      console.error("Failed to load vaccination details:", error);
      toast.error("Vaccination record not found or could not be loaded.");
      navigate('/admin/vaccinations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecord();
  }, [id]);

  // Handle auto-populating date when marking administered
  const handleMarkAdministeredChange = (e) => {
    const checked = e.target.checked;
    setIsMarkedAdministered(checked);
    if (checked) {
      const todayStr = new Date().toISOString().split('T')[0];
      setAdministeredDate(todayStr);
    } else {
      setAdministeredDate('');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!vaccineName.trim()) {
      setErrorMsg('Vaccine name is required.');
      return;
    }
    if (doseNumber < 1) {
      setErrorMsg('Dose number must be greater than 0.');
      return;
    }
    if (!scheduledDate) {
      setErrorMsg('Scheduled date is required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        vaccine_name: vaccineName.trim(),
        dose_number: Number(doseNumber),
        scheduled_date: scheduledDate,
        administered_date: isMarkedAdministered ? (administeredDate || null) : null,
        notification_sent: notificationSent
      };

      await vaccinationService.updateVaccination(id, payload);
      toast.success('Vaccination record updated successfully.');
      fetchRecord(); // Reload details
    } catch (error) {
      console.error("Failed to save changes:", error);
      const msg = error.response?.data?.detail || "An error occurred while updating the record.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <Clock className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm font-medium">Fetching record details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 pb-6 border-b border-slate-200">
        <button
          onClick={() => navigate('/admin/vaccinations')}
          className="p-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-505 hover:text-slate-800 transition-all active:scale-95 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Vaccination Sheet</h2>
          <p className="text-[10px] text-slate-450 mt-1 font-mono font-semibold">Record ID: {record?.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Editor Form Card */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-slate-900 mb-2">Edit Schedule Parameters</h3>
          
          {errorMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 flex gap-3 text-rose-600 text-xs font-semibold leading-normal animate-fade-in">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-550" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            {/* User ID (Read-only) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Patient / User ID (Unmodifiable)
              </label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  disabled
                  value={record?.user_id || ''}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 font-mono text-sm cursor-not-allowed font-semibold"
                />
              </div>
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
                  placeholder="Vaccine Name"
                  value={vaccineName}
                  onChange={(e) => setVaccineName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-green-600 focus:bg-white transition-all text-sm font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Dose Number */}
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

              {/* Scheduled Date */}
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

            {/* Administered Status Section */}
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl space-y-4 shadow-sm">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isMarkedAdministered}
                  onChange={handleMarkAdministeredChange}
                  className="w-5 h-5 rounded border-slate-300 bg-white text-green-600 focus:ring-green-600 focus:ring-offset-white focus:ring-2"
                />
                <span className="text-sm font-bold text-slate-900">Mark Vaccine as Administered</span>
              </label>

              {isMarkedAdministered && (
                <div className="space-y-2 animate-slide-up">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Administration Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-3.5 w-5 h-5 text-green-600" />
                    <input
                      type="date"
                      required={isMarkedAdministered}
                      value={administeredDate}
                      onChange={(e) => setAdministeredDate(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white border border-green-200 text-green-700 focus:outline-none focus:border-green-600 transition-all text-sm font-mono font-bold"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Alert Sent Status */}
            <div className="flex items-center justify-between p-5 bg-slate-50 border border-slate-200 rounded-3xl shadow-sm">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Notification Alert Status</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 font-semibold">Toggle notification flag in database</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSent}
                  onChange={(e) => setNotificationSent(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600 peer-checked:after:bg-white"></div>
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm shadow-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Saving parameters...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </form>
        </div>

        {/* Side Details card: Secondary nested slate-100 surface */}
        <div className="bg-slate-100 border border-slate-200 p-6 rounded-3xl shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-3">Status Overview</h3>
          
          <div className="space-y-4 font-semibold text-slate-650 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-200/60">
              <span className="text-xs text-slate-500">Delivery State</span>
              {record?.administered_date ? (
                <span className="text-xs text-green-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Administered
                </span>
              ) : (
                <span className="text-xs text-amber-700 font-bold flex items-center gap-1 animate-pulse">
                  <Clock className="w-3.5 h-3.5" />
                  Pending
                </span>
              )}
            </div>

            <div className="flex justify-between py-2 border-b border-slate-200/60">
              <span className="text-xs text-slate-500">Notification Status</span>
              {record?.notification_sent ? (
                <span className="text-xs text-green-700 font-bold flex items-center gap-1 bg-green-50 border border-green-150 px-2 py-0.5 rounded-lg">
                  <Send className="w-3 h-3 text-green-600" />
                  Alert Dispatched
                </span>
              ) : (
                <span className="text-xs text-slate-500">
                  Queued / Not Sent
                </span>
              )}
            </div>

            <div className="flex justify-between py-2">
              <span className="text-xs text-slate-500">Scheduled Date</span>
              <span className="text-xs text-slate-800 font-mono font-bold">{record?.scheduled_date}</span>
            </div>

            {record?.administered_date && (
              <div className="flex justify-between py-2 bg-green-50/50 p-3 rounded-2xl border border-green-150">
                <span className="text-xs text-green-700 font-bold">Administered Date</span>
                <span className="text-xs text-green-700 font-mono font-bold">{record?.administered_date}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VaccinationDetails;
