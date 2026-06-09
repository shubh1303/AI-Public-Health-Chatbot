import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import vaccinationService from '../services/vaccinationService';
import api from '../services/api';
import { useToast } from '../components/Toast';
import { 
  User, 
  Mail, 
  Smartphone, 
  Languages, 
  Edit3, 
  Download, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  MessageSquare,
  Bell,
  X,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';

const PatientDashboard = () => {
  const { user, updateProfile } = useAuth();
  const toast = useToast();
  
  const [vaccinations, setVaccinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  
  // Tabs: 'schedule' or 'notifications'
  const [activeTab, setActiveTab] = useState('schedule');
  
  // Modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editLang, setEditLang] = useState(user?.language_preference || 'en');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const data = await vaccinationService.getPatientVaccinations();
        setVaccinations(data);
      } catch (error) {
        console.error("Failed to load patient vaccinations:", error);
        toast.error("Could not fetch vaccination details.");
      } finally {
        setLoading(false);
      }
    };
    fetchPatientData();
  }, [toast]);

  // Open modal & prepopulate
  const openEditModal = () => {
    setEditName(user?.name || '');
    setEditEmail(user?.email || '');
    setEditLang(user?.language_preference || 'en');
    setEditModalOpen(true);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      await updateProfile({
        name: editName,
        email: editEmail,
        language_preference: editLang
      });
      toast.success("Profile updated successfully.");
      setEditModalOpen(false);
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.detail || "Failed to update profile details.";
      toast.error(msg);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const downloadPatientReport = async () => {
    setPdfLoading(true);
    try {
      const response = await api.get('/api/v1/patient/report', {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'vaccination-report.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Vaccination report downloaded successfully.');
    } catch (error) {
      console.error('Failed to download vaccination report:', error);
      toast.error('Failed to generate vaccination report.');
    } finally {
      setPdfLoading(false);
    }
  };


  // Compute metrics
  const totalDoses = vaccinations.length;
  const completedDoses = vaccinations.filter(v => v.administered_date).length;
  const pendingDoses = totalDoses - completedDoses;
  
  // Find next upcoming vaccination
  const upcomingVaccs = vaccinations
    .filter(v => !v.administered_date)
    .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));
  const nextScheduledDate = upcomingVaccs.length > 0 ? upcomingVaccs[0].scheduled_date : 'None';

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-green-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-semibold animate-pulse text-xs">Loading patient records...</p>
      </div>
    );
  }

  const nextVac = upcomingVaccs.length > 0 ? upcomingVaccs[0] : null;

  return (
    <div className="space-y-8 animate-fade-in relative">
      
      {/* 1. Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Welcome Back, {user?.name || 'Sarah'}</h2>
          <p className="text-slate-500 text-xs mt-1 font-semibold">Monitor your immunization calendar and wellness recommendations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column (Span 2) - Critical Patient Info Flow */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 2. Next Vaccination Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden card-hover">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-green-500/5 blur-2xl"></div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Next Scheduled Immunization</span>
              <span className="text-[10px] text-green-700 font-bold bg-green-550 bg-green-50 border border-green-100 px-2.5 py-1 rounded-full">
                Upcoming Status
              </span>
            </div>
            
            {nextVac ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">{nextVac.vaccine_name}</h3>
                  <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-green-600 shrink-0" />
                    <span>Dose {nextVac.dose_number} • Scheduled for {nextVac.scheduled_date}</span>
                  </p>
                </div>
                <div className="shrink-0">
                  <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-150 text-amber-700 text-xs font-bold uppercase tracking-wider">
                    Pending Dose
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-2 text-slate-500 italic text-xs font-semibold">
                No upcoming vaccination scheduled. All dose logs are complete!
              </div>
            )}
          </div>

          {/* 3. Upcoming Vaccinations List */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="pb-3 border-b border-slate-100 mb-4 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Upcoming Vaccinations Checklist</h4>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                {upcomingVaccs.length} Pending
              </span>
            </div>

            {upcomingVaccs.length === 0 ? (
              <div className="text-center py-12 px-6 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 flex flex-col items-center justify-center">
                <Calendar className="w-8 h-8 text-slate-300 mb-2" />
                <h5 className="text-xs font-bold text-slate-800">No vaccinations found</h5>
                <p className="text-[10px] text-slate-450 mt-0.5 mb-4 max-w-xs leading-normal">
                  Your upcoming schedules checklist is empty. You are fully immunized or have no scheduled records.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all shadow-sm active:scale-95"
                >
                  Refresh Data
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                      <th className="pb-2.5 pr-4">Vaccine Name</th>
                      <th className="pb-2.5 pr-4">Dose No</th>
                      <th className="pb-2.5 pr-4">Scheduled Date</th>
                      <th className="pb-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {upcomingVaccs.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/50">
                        <td className="py-3 pr-4 text-slate-900 font-bold">{v.vaccine_name}</td>
                        <td className="py-3 pr-4 text-slate-500">Dose {v.dose_number}</td>
                        <td className="py-3 pr-4 text-slate-500">{v.scheduled_date}</td>
                        <td className="py-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-[9px] font-bold">
                            Scheduled
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 4. Vaccination Status Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 p-5 rounded-3xl flex items-center gap-4 shadow-sm card-hover">
              <div className="w-11 h-11 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center text-green-600 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Completed Doses</p>
                <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">{completedDoses} / {totalDoses}</h3>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-3xl flex items-center gap-4 shadow-sm card-hover">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Pending Doses</p>
                <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">{pendingDoses}</h3>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-3xl flex items-center gap-4 shadow-sm card-hover">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Next Date</p>
                <h3 className="text-sm font-extrabold text-slate-900 mt-1 truncate">{nextScheduledDate}</h3>
              </div>
            </div>
          </div>

          {/* 5. PDF Report Download Banner */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 card-hover">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Official Immunization Record</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed font-semibold">
                  Generate and export your structured immunization report including dose numbers, scheduled dates, and SMS dispatch indicators.
                </p>
              </div>
            </div>
            <button
              onClick={downloadPatientReport}
              disabled={pdfLoading || vaccinations.length === 0}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 shrink-0 disabled:opacity-40"
            >
              {pdfLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download PDF Report
                </>
              )}
            </button>
          </div>

          {/* 6. AI Assistant Access Prompt Section */}
          <div className="bg-gradient-to-tr from-green-50 to-emerald-50 border border-green-200/60 p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 card-hover">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-green-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Virtual Wellness Assistant</h4>
                <p className="text-[11px] text-green-700 mt-0.5 leading-relaxed font-semibold">
                  Have questions about vaccine symptoms or schedule timelines? Get instant replies in English, Hindi, or Telugu.
                </p>
              </div>
            </div>
            <Link
              to="/patient/chatbot"
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs text-center transition-colors shadow-sm shrink-0"
            >
              Ask AI Assistant
            </Link>
          </div>

        </div>

        {/* Right Column (Span 1) - Profile Details & Secondary logs */}
        <div className="space-y-6">
          
          {/* Patient Profile Details */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Patient Profile</h3>
              <button
                onClick={openEditModal}
                className="p-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors shadow-sm"
                title="Edit Profile"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-3">
                <User className="w-4.5 h-4.5 text-green-600 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Full Name</p>
                  <p className="text-slate-800 mt-0.5 font-bold">{user?.name || 'Sarah Jenkins'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-4.5 h-4.5 text-green-600 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Email Address</p>
                  <p className="text-slate-800 mt-0.5 truncate">{user?.email || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Smartphone className="w-4.5 h-4.5 text-green-600 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Phone Number (Immutable)</p>
                  <p className="text-slate-800 mt-0.5 font-bold">{user?.phone_number || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Languages className="w-4.5 h-4.5 text-green-600 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Language Preference</p>
                  <p className="text-slate-800 mt-0.5 uppercase tracking-wide font-bold">{user?.language_preference || 'en'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* SMS Alert logs center */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-green-600" />
                Reminder Logs
              </h4>
            </div>
            
            {vaccinations.filter(v => v.notification_sent).length === 0 ? (
              <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 flex flex-col items-center justify-center">
                <Bell className="w-8 h-8 text-slate-300 mb-2 animate-pulse" />
                <h5 className="text-xs font-bold text-slate-850">No alerts triggered</h5>
                <p className="text-[10px] text-slate-450 mt-0.5 text-center leading-normal">
                  SMS reminder alerts log history is empty. Logs are generated when reminders scan triggers.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {vaccinations
                  .filter(v => v.notification_sent)
                  .map((v) => (
                    <div key={v.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 card-hover">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-slate-800">{v.vaccine_name} SMS</span>
                        <span className={`px-2 py-0.5 rounded-md text-[8px] uppercase border ${
                          v.sms_delivery_status === 'sent'
                            ? 'bg-green-50 border-green-150 text-green-700'
                            : 'bg-rose-50 border-rose-150 text-rose-700'
                        }`}>
                          {v.sms_delivery_status || 'sent'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 italic leading-normal bg-white border border-slate-200 p-2.5 rounded-xl">
                        "Hi {user?.name || 'Sarah'}, your {v.vaccine_name} is scheduled for {v.scheduled_date}. Reply CHAT for AI support."
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Edit Profile Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 p-6 rounded-3xl space-y-5 shadow-2xl relative animate-fade-in">
            <button
              onClick={() => setEditModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-850 hover:bg-slate-50"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div>
              <h3 className="text-lg font-bold text-slate-900">Edit Patient Profile</h3>
              <p className="text-xs text-slate-500 mt-1 font-semibold">Modify your name, email, and preferences.</p>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-green-600 focus:bg-white transition-all text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-green-600 focus:bg-white transition-all text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
                  <Languages className="w-3.5 h-3.5 text-slate-400" />
                  Language Preference
                </label>
                <select
                  value={editLang}
                  onChange={(e) => setEditLang(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-green-600 focus:bg-white transition-all text-xs font-semibold"
                >
                  <option value="en">English (en)</option>
                  <option value="hi">Hindi (hi)</option>
                  <option value="te">Telugu (te)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="flex-1 py-2.5 rounded-2xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="flex-1 py-2.5 rounded-2xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {updatingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default PatientDashboard;
