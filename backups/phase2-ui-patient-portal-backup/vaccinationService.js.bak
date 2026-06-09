import api from './api';

const vaccinationService = {
  /**
   * Schedule a new vaccination schedule reminder for a target user.
   */
  async schedule(payload) {
    const response = await api.post('/api/v1/vaccinations/schedule', payload);
    return response.data;
  },

  /**
   * Retrieve all scheduled vaccinations with optional filters.
   * Supported filters: user_id, notification_sent, due_date
   */
  async getVaccinations(filters = {}) {
    const params = {};
    if (filters.user_id) params.user_id = filters.user_id;
    if (filters.notification_sent !== undefined && filters.notification_sent !== '') {
      params.notification_sent = filters.notification_sent === 'true' || filters.notification_sent === true;
    }
    if (filters.due_date) params.due_date = filters.due_date;

    const response = await api.get('/api/v1/vaccinations', { params });
    return response.data;
  },

  /**
   * Retrieve details of a specific vaccination schedule by its ID.
   */
  async getVaccinationById(id) {
    const response = await api.get(`/api/v1/vaccinations/${id}`);
    return response.data;
  },

  /**
   * Update details of an existing vaccination record (e.g. mark administered).
   */
  async updateVaccination(id, payload) {
    const response = await api.put(`/api/v1/vaccinations/${id}`, payload);
    return response.data;
  },

  /**
   * Scans and dispatches alerts for vaccination reminders scheduled for a specific date (defaults to today).
   */
  async triggerReminders(dueDate = null) {
    const params = {};
    if (dueDate) {
      params.due_date = dueDate;
    }
    const response = await api.post('/api/v1/vaccinations/trigger-reminders', null, { params });
    return response.data;
  },

  /**
   * Retrieve scheduled vaccinations for the logged-in patient.
   */
  async getPatientVaccinations() {
    const response = await api.get('/api/v1/patient/vaccinations');
    return response.data;
  },

  /**
   * Download the patient's vaccination report as a PDF blob.
   */
  async getPatientReportBlob() {
    const response = await api.get('/api/v1/patient/report', {
      responseType: 'blob'
    });
    return response.data;
  }
};

export default vaccinationService;
