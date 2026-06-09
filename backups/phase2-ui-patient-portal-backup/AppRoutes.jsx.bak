import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import Layout from '../components/Layout';

// Import Pages
import Landing from '../pages/Landing';
import Signup from '../pages/Signup';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import ScheduleVaccination from '../pages/ScheduleVaccination';
import VaccinationList from '../pages/VaccinationList';
import VaccinationDetails from '../pages/VaccinationDetails';
import Chatbot from '../pages/Chatbot';
import PatientDashboard from '../pages/PatientDashboard';
import AdminUsers from '../pages/AdminUsers';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />

      {/* Protected Administrative Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin={true}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="schedule" element={<ScheduleVaccination />} />
        <Route path="vaccinations" element={<VaccinationList />} />
        <Route path="vaccinations/:id" element={<VaccinationDetails />} />
        <Route path="chatbot" element={<Chatbot />} />
      </Route>

      {/* Protected Patient Routes */}
      <Route
        path="/patient"
        element={
          <ProtectedRoute requireAdmin={false}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/patient/dashboard" replace />} />
        <Route path="dashboard" element={<PatientDashboard />} />
        <Route path="chatbot" element={<Chatbot />} />
      </Route>

      {/* Wildcard Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
