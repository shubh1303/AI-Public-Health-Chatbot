import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import vaccinationService from '../services/vaccinationService';
import { useToast } from '../components/Toast';
import { 
  Search, 
  Filter, 
  Calendar, 
  Eye, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  Send,
  PlusCircle
} from 'lucide-react';

const VaccinationList = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [vaccinations, setVaccinations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, administered, scheduled
  const [alertFilter, setAlertFilter] = useState('all'); // all, sent, pending
  const [dateFilter, setDateFilter] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchVaccinations = async () => {
    setLoading(true);
    try {
      // Build server filter params
      const apiFilters = {};
      if (alertFilter !== 'all') {
        apiFilters.notification_sent = alertFilter === 'sent';
      }
      if (dateFilter) {
        apiFilters.due_date = dateFilter;
      }
      
      const records = await vaccinationService.getVaccinations(apiFilters);
      setVaccinations(records);
      setCurrentPage(1); // Reset page on refresh
    } catch (error) {
      console.error("Failed to load records:", error);
      toast.error("Unable to retrieve vaccination schedules.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVaccinations();
  }, [alertFilter, dateFilter]); // Re-fetch on filter changes that are server-supported

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setAlertFilter('all');
    setDateFilter('');
  };

  // Local filtering & searching
  const filteredRecords = vaccinations.filter((item) => {
    // Search match (vaccine name or user id)
    const matchesSearch = 
      item.vaccine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.user_id.toLowerCase().includes(searchTerm.toLowerCase());

    // Administered status match
    let matchesStatus = true;
    if (statusFilter === 'administered') {
      matchesStatus = item.administered_date !== null;
    } else if (statusFilter === 'scheduled') {
      matchesStatus = item.administered_date === null;
    }

    return matchesSearch && matchesStatus;
  });

  // Pagination Math
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRecords.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Vaccination Registry</h2>
          <p className="text-xs text-slate-500 mt-1 font-semibold">Browse and manage active immunization records</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleResetFilters}
            className="px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-bold text-slate-550 hover:text-slate-800 transition-colors shadow-sm"
          >
            Clear Filters
          </button>
          <button
            onClick={fetchVaccinations}
            className="p-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-all shadow-sm"
            title="Reload registry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/admin/schedule')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            Schedule New
          </button>
        </div>
      </div>

      {/* Filter Toolbar Card (Slate-100 secondary track surface) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-100 border border-slate-200 p-5 rounded-3xl shadow-sm">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, patient ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-green-600 transition-colors text-sm font-semibold shadow-sm"
          />
        </div>

        {/* Administration Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-green-600 transition-colors text-sm appearance-none font-semibold shadow-sm"
          >
            <option value="all">All Delivery Statuses</option>
            <option value="administered">Administered Only</option>
            <option value="scheduled">Scheduled/Pending Only</option>
          </select>
          <Filter className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        {/* SMS Reminder Filter */}
        <div className="relative">
          <select
            value={alertFilter}
            onChange={(e) => setAlertFilter(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-green-600 transition-colors text-sm appearance-none font-semibold shadow-sm"
          >
            <option value="all">All Reminder States</option>
            <option value="sent">Alert Sent</option>
            <option value="pending">Alert Pending</option>
          </select>
          <Send className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        {/* Due Date Filter */}
        <div className="relative">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-green-600 transition-colors text-sm font-semibold shadow-sm"
          />
          <Calendar className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 m-6 rounded-2xl">
            <RefreshCw className="w-8 h-8 text-green-600 animate-spin mb-3" />
            <p className="text-slate-500 text-xs font-semibold tracking-wide">Loading registry data...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 m-6 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
              <Calendar className="w-6 h-6" />
            </div>
            <h5 className="text-sm font-bold text-slate-900">No matching registry records</h5>
            <p className="text-xs text-slate-500 mt-1 mb-4 max-w-xs leading-normal">
              We couldn't find any vaccination schedule matching your filters. Try search terms or clear options.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all shadow-sm active:scale-95"
            >
              Reset Registry Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-450">
                  <th className="py-4 px-6 rounded-l-xl">Vaccine Name</th>
                  <th className="py-4 px-6">Dose</th>
                  <th className="py-4 px-6">Scheduled Date</th>
                  <th className="py-4 px-6">Administered Date</th>
                  <th className="py-4 px-6">Patient ID</th>
                  <th className="py-4 px-6">SMS Alert</th>
                  <th className="py-4 px-6 text-center rounded-r-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700 text-xs">
                {currentItems.map((vac) => (
                  <tr key={vac.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4.5 px-6 font-bold text-slate-900">{vac.vaccine_name}</td>
                    <td className="py-4.5 px-6 text-slate-500 font-semibold">Dose {vac.dose_number}</td>
                    <td className="py-4.5 px-6 text-slate-500 font-mono text-xs font-semibold">{vac.scheduled_date}</td>
                    <td className="py-4.5 px-6">
                      {vac.administered_date ? (
                        <span className="text-green-700 font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                          <span className="font-mono text-xs">{vac.administered_date}</span>
                        </span>
                      ) : (
                        <span className="text-amber-700 font-bold flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
                          <span>Not Administered</span>
                        </span>
                      )}
                    </td>
                    <td className="py-4.5 px-6 font-mono text-xs text-slate-400 truncate max-w-[140px]" title={vac.user_id}>
                      {vac.user_id}
                    </td>
                    <td className="py-4.5 px-6">
                      {vac.notification_sent ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-50 border border-green-150 text-green-700 text-[10px] font-bold uppercase tracking-wider">
                          Sent
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-4.5 px-6 text-center">
                      <button
                        onClick={() => navigate(`/admin/vaccinations/${vac.id}`)}
                        className="p-2 rounded-xl bg-white border border-slate-200 text-green-700 hover:text-green-800 hover:bg-slate-50 transition-all inline-flex items-center gap-1 text-xs font-bold shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4.5 bg-slate-50 border-t border-slate-200">
            <span className="text-xs text-slate-500 font-semibold">
              Showing page <strong className="text-slate-800">{currentPage}</strong> of <strong className="text-slate-800">{totalPages}</strong> ({filteredRecords.length} records)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((c) => Math.max(1, c - 1))}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-30 disabled:pointer-events-none shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((c) => Math.min(totalPages, c + 1))}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-30 disabled:pointer-events-none shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VaccinationList;
