import api from './api';

const authService = {
  /**
   * Log in an administrative user.
   * Sends request in standard URL-encoded format expected by OAuth2PasswordRequestForm.
   */
  async login(username, password) {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    const response = await api.post('/api/v1/admin/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (response.data && response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
    }
    return response.data;
  },

  /**
   * Log in a patient user (email or phone + password).
   */
  async patientLogin(username, password) {
    const response = await api.post('/api/v1/patient/login', { username, password });
    if (response.data && response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
    }
    return response.data;
  },

  /**
   * Sign up a new patient user.
   */
  async patientSignup(payload) {
    const response = await api.post('/api/v1/patient/signup', payload);
    return response.data;
  },

  /**
   * Retrieve profile details of the currently authenticated patient.
   */
  async getCurrentPatient() {
    const response = await api.get('/api/v1/patient/me');
    return response.data;
  },

  /**
   * Update the patient profile. Pass arguments as query parameters.
   */
  async updatePatientProfile(payload) {
    const response = await api.put('/api/v1/patient/profile', null, {
      params: payload
    });
    return response.data;
  },

  /**
   * Allows an administrator to disable or reactivate a patient user's status.
   */
  async updateUserStatus(id, status) {
    const response = await api.put(`/api/v1/admin/users/${id}/status`, { status });
    return response.data;
  },

  /**
   * Log out current user by removing the JWT token.
   */
  logout() {
    localStorage.removeItem('token');
  },

  /**
   * Retrieve profile details of the currently authenticated administrator.
   */
  async getCurrentUser() {
    const response = await api.get('/api/v1/admin/me');
    return response.data;
  },

  /**
   * Get a list of registered users. Requires administrator privileges.
   */
  async getUsers(skip = 0, limit = 100) {
    const response = await api.get('/api/v1/admin/users', {
      params: { skip, limit }
    });
    return response.data;
  }
};

export default authService;
