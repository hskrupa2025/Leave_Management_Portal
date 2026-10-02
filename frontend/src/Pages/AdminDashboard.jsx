import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';

const AdminDashboard = () => {
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.get('/admin/dashboard')
            .then((res) => setDashboard(res.data))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="text-center mt-5">Loading...</div>;

    return (
        <div className="container mt-4">
            <h2>Admin Dashboard</h2>
            <div className="row my-4">
                <div className="col-md-4 mb-3">
                    <div className="card bg-primary text-white p-3">
                        <h5>Total Employees</h5>
                        <h3>{dashboard?.stats.totalEmployees}</h3>
                    </div>
                </div>
                <div className="col-md-4 mb-3">
                    <div className="card bg-warning text-dark p-3">
                        <h5>Pending Requests</h5>
                        <h3>{dashboard?.stats.pendingLeaves}</h3>
                    </div>
                </div>
                <div className="col-md-4 mb-3">
                    <div className="card bg-success text-white p-3">
                        <h5>Approved Requests</h5>
                        <h3>{dashboard?.stats.approvedLeaves}</h3>
                    </div>
                </div>
            </div>

            <div className="d-flex gap-3 mb-4">
                <Link to="/admin/leaves" className="btn btn-dark">Manage All Leaves</Link>
                <Link to="/admin/employees" className="btn btn-secondary">View Employees</Link>
            </div>

            <h4>Recent Leave Requests</h4>
            <div className="table-responsive mt-3">
                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Type</th>
                            <th>Dates</th>
                            <th>Days</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dashboard?.recentLeaves.map((l) => (
                            <tr key={l._id}>
                                <td>{l.employee?.name}</td>
                                <td>{l.leaveType}</td>
                                <td>{new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}</td>
                                <td>{l.numberOfDays}</td>
                                <td>
                                    <span className={`badge bg-${l.status === 'APPROVED' ? 'success' : l.status === 'REJECTED' ? 'danger' : 'warning'}`}>
                                        {l.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminDashboard;