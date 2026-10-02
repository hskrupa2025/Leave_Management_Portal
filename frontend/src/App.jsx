import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ApplyLeave from './pages/ApplyLeave';
import LeaveHistory from './pages/LeaveHistory';
import AdminDashboard from './pages/AdminDashboard';
import AdminLeaves from './pages/AdminLeaves';
import AdminEmployees from './pages/AdminEmployees';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />


        <Route path="/employee/dashboard" element={<ProtectedRoute employeeOnly><EmployeeDashboard /></ProtectedRoute>} />
        <Route path="/employee/apply-leave" element={<ProtectedRoute employeeOnly><ApplyLeave /></ProtectedRoute>} />
        <Route path="/employee/history" element={<ProtectedRoute employeeOnly><LeaveHistory /></ProtectedRoute>} />


        <Route path="/admin/dashboard" element={<ProtectedRoute adminOnly={true}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/leaves" element={<ProtectedRoute adminOnly={true}><AdminLeaves /></ProtectedRoute>} />
        <Route path="/admin/employees" element={<ProtectedRoute adminOnly={true}><AdminEmployees /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;